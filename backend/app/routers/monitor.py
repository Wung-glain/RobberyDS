# app/routers/monitor.py
from __future__ import annotations

import asyncio
import json
import os
import socket
import time


from collections import defaultdict, deque
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Any, Deque, Dict, List, Optional, Set

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse

import psutil

# --- Optional scapy imports (graceful degradation) ---
try:
    from scapy.all import sniff, ARP, Ether, srp, TCP, UDP, IP
    SCAPY = True
except Exception:
    SCAPY = False

router = APIRouter(prefix="/monitor", tags=["Monitor"])  # mount this in main.py

# ----------------------------------------------------------------------------
# Config
# ----------------------------------------------------------------------------
ARP_CIDR = os.getenv("ARP_CIDR", "192.168.137.0/24")
SSE_TICK_SEC = float(os.getenv("SSE_INTERVAL_SECS", "1"))
ANOMALY_STD_THRESHOLD = float(os.getenv("ANOMALY_STD_THRESHOLD", "3.0"))
HIGH_TRAFFIC_MBPS = float(os.getenv("HIGH_TRAFFIC_MBPS", "50"))
DEVICE_SCAN_EVERY = int(os.getenv("DEVICE_SCAN_EVERY", "30"))  # seconds
ALERT_BUFFER = int(os.getenv("ALERT_BUFFER", "200"))
LOG_BUFFER = int(os.getenv("LOG_BUFFER", "500"))

# ----------------------------------------------------------------------------
# Data Models
# ----------------------------------------------------------------------------
@dataclass
class Alert:
    timestamp: str
    type: str
    severity: str
    source_ip: Optional[str]
    message: str
    details: Dict[str, Any]

@dataclass
class SecurityLog:
    timestamp: str
    level: str
    source: str
    message: str
    ip_address: Optional[str]

@dataclass
class MonitorSnapshot:
    ts: str
    inbound_mbps: float
    outbound_mbps: float
    status: str
    devices: List[Dict[str, str]]
    alerts: List[Dict[str, Any]]
    logs: List[Dict[str, Any]]

# ----------------------------------------------------------------------------
# Monitor Manager (singleton)
# ----------------------------------------------------------------------------
class MonitorManager:
    def __init__(self) -> None:
        self.running = False
        self._lock = asyncio.Lock()
        self._tasks: List[asyncio.Task] = []

        # state
        self._devices: Dict[str, Dict[str, str]] = {}
        self._alerts: Deque[Alert] = deque(maxlen=ALERT_BUFFER)
        self._logs: Deque[SecurityLog] = deque(maxlen=LOG_BUFFER)
        self._latest_in_mbps: float = 0.0
        self._latest_out_mbps: float = 0.0
        self._status: str = "OK"

        # anomaly baseline
        self._baseline_init = False
        self._in_avg = 0.0
        self._out_avg = 0.0
        self._in_std = 0.1
        self._out_std = 0.1

        # for TCP SYN tracking (basic port scan detection)
        self._syn_counts: Dict[str, int] = defaultdict(int)
        self._last_syn_reset = time.time()

        # websocket clients
        self._clients: Set[WebSocket] = set()

        # packet sniffing
        self._sniff_thread = None
        self._stop_sniff = False

    # --------------- public API ---------------
    async def start(self) -> None:
        async with self._lock:
            if self.running:
                return
            self.running = True
            self._log("INFO", "monitor", "Monitoring started", None)
            # spawn async tasks
            self._tasks = [
                asyncio.create_task(self._loop_throughput()),
                asyncio.create_task(self._loop_device_scan()),
                asyncio.create_task(self._loop_housekeeping()),
                asyncio.create_task(self._loop_broadcast()),
            ]
            # start sniffing in background thread if scapy available
            if SCAPY:
                import threading

                self._stop_sniff = False
                self._sniff_thread = threading.Thread(target=self._sniff_packets, daemon=True)
                self._sniff_thread.start()
            else:
                self._log("WARN", "monitor", "Scapy not available; packet inspection disabled", None)

    async def stop(self) -> None:
        async with self._lock:
            if not self.running:
                return
            self.running = False
            self._stop_sniff = True
            for t in self._tasks:
                t.cancel()
            self._tasks.clear()
            self._log("INFO", "monitor", "Monitoring stopped", None)

    async def register_ws(self, ws: WebSocket) -> None:
        await ws.accept()
        self._clients.add(ws)
        self._log("INFO", "ws", "Client connected", None)

    def unregister_ws(self, ws: WebSocket) -> None:
        if ws in self._clients:
            self._clients.remove(ws)
            self._log("INFO", "ws", "Client disconnected", None)

    # --------------- loops ---------------
    async def _loop_throughput(self) -> None:
        # rolling per-second throughput using psutil
        prev = psutil.net_io_counters()
        prev_t = time.time()
        while self.running:
            await asyncio.sleep(SSE_TICK_SEC)
            now_c = psutil.net_io_counters()
            now_t = time.time()
            dt = max(1e-6, now_t - prev_t)
            in_b = max(0, now_c.bytes_recv - prev.bytes_recv)
            out_b = max(0, now_c.bytes_sent - prev.bytes_sent)
            self._latest_in_mbps = round((in_b * 8) / dt / 1_000_000, 3)
            self._latest_out_mbps = round((out_b * 8) / dt / 1_000_000, 3)
            prev, prev_t = now_c, now_t

            # anomaly check & status
            self._update_anomaly_and_status()

            # high traffic alert
            if self._latest_in_mbps > HIGH_TRAFFIC_MBPS or self._latest_out_mbps > HIGH_TRAFFIC_MBPS:
                self._raise_alert(
                    atype="HighTraffic",
                    severity="high",
                    source_ip=None,
                    message="High traffic volume detected",
                    details={
                        "in_mbps": self._latest_in_mbps,
                        "out_mbps": self._latest_out_mbps,
                        "threshold": HIGH_TRAFFIC_MBPS,
                    },
                )

    async def _loop_device_scan(self) -> None:
        # scan periodically; first run soon
        next_scan = 0.0
        while self.running:
            now = time.time()
            if now >= next_scan:
                try:
                    new_devices = self._scan_devices()
                    for d in new_devices:
                        self._devices[d["ip"]] = d
                except Exception as e:
                    self._log("ERROR", "device_scan", f"Device scan failed: {e}", None)
                next_scan = now + DEVICE_SCAN_EVERY
            await asyncio.sleep(1)

    async def _loop_housekeeping(self) -> None:
        # reset syn counters per short window to detect scans
        while self.running:
            await asyncio.sleep(10)
            self._syn_counts.clear()
            self._last_syn_reset = time.time()

    async def _loop_broadcast(self) -> None:
        while self.running:
            await asyncio.sleep(SSE_TICK_SEC)
            if not self._clients:
                continue
            snap = self._snapshot()
            msg = json.dumps(asdict(snap))
            await self._broadcast(msg)

    # --------------- packet sniffing (thread) ---------------
    def _sniff_packets(self) -> None:
        """Blocking sniffer in a thread; pushes alerts/logs via shared state."""
        if not SCAPY:
            return
        try:
            def cb(pkt):
                try:
                    if IP in pkt:
                        src = pkt[IP].src
                        ts = datetime.now(timezone.utc).isoformat()
                        # basic TCP analysis
                        if TCP in pkt:
                            flags = pkt[TCP].flags
                            dport = int(pkt[TCP].dport)
                            # SYN without ACK (possible scan)
                            if flags & 0x02 and not (flags & 0x10):
                                self._syn_counts[src] += 1
                                if self._syn_counts[src] >= 50:  # burst threshold
                                    self._raise_alert(
                                        atype="SynScan",
                                        severity="medium",
                                        source_ip=src,
                                        message=f"Possible SYN scan detected (>=50 SYNs in window)",
                                        details={"syn_count": self._syn_counts[src]},
                                    )
                            # sensitive ports
                            if dport in (22, 23, 3389, 445, 1433):
                                self._raise_alert(
                                    atype="SensitivePortAccess",
                                    severity="medium",
                                    source_ip=src,
                                    message=f"Traffic to sensitive port {dport}",
                                    details={"dst_port": dport},
                                )
                        if UDP in pkt:
                            dport = int(pkt[UDP].dport)
                            if dport in (53, 123, 1900):  # DNS/NTP/SSDP often abused in amplification
                                self._raise_alert(
                                    atype="AmplificationVector",
                                    severity="low",
                                    source_ip=src,
                                    message=f"Burst to UDP port {dport}",
                                    details={"dst_port": dport},
                                )
                        # general packet log
                        self._logs.append(
                            SecurityLog(
                                timestamp=ts,
                                level="INFO",
                                source="sniffer",
                                message="packet",
                                ip_address=src,
                            )
                        )
                except Exception:
                    pass

            sniff(prn=cb, store=False, stop_filter=lambda p: self._stop_sniff)
        except Exception as e:
            self._log("ERROR", "sniffer", f"Sniffer error: {e}", None)

    # --------------- helpers ---------------
    def _scan_devices(self) -> List[Dict[str, str]]:
        devices: List[Dict[str, str]] = []
        if SCAPY:
            try:
                arp = ARP(pdst=ARP_CIDR)
                ether = Ether(dst="ff:ff:ff:ff:ff:ff")
                pkt = ether / arp
                answered = srp(pkt, timeout=2, verbose=0)[0]
                for _, rcv in answered:
                    devices.append({"ips": rcv.psrc, "mac": rcv.hwsrc})
                    print("This are devices connected to your network")
                    print(devices)
            except Exception as e:
                self._log("WARN", "device_scan", f"ARP scan failed: {e}", None)
        else:
            # fallback: parse `arp -a` output (best-effort, cross-platform)
            try:
                import subprocess

                out = subprocess.check_output(["arp", "-a"], text=True, timeout=5)
                for line in out.splitlines():
                    if "(" in line and ")" in line:
                        # e.g., Interface: 192.168.1.5 --- 0x12\n  192.168.1.1          aa-bb-cc-dd-ee-ff     dynamic
                        parts = line.split()
                        if len(parts) >= 2:
                            ip = parts[0]
                            mac = parts[1] if len(parts) > 1 else ""
                            devices.append({"ip": ip, "mac": mac})
            except Exception:
                pass
        # also include localhost
        try:
            hostname = socket.gethostname()
            local_ip = socket.gethostbyname(hostname)
            devices.append({"ip": local_ip, "mac": ""})
        except Exception:
            pass
        # de-dup by IP
        uniq: Dict[str, Dict[str, str]] = {}
        for d in devices:
            uniq[d.get("ip", "")] = d
        return [v for k, v in uniq.items() if k]

    def _update_anomaly_and_status(self) -> None:
        # init baseline
        if not self._baseline_init:
            self._in_avg = self._latest_in_mbps
            self._out_avg = self._latest_out_mbps
            self._baseline_init = True
            return
        # EWMA
        alpha = 0.2
        self._in_avg = (1 - alpha) * self._in_avg + alpha * self._latest_in_mbps
        self._out_avg = (1 - alpha) * self._out_avg + alpha * self._latest_out_mbps
        # naive std proxy (abs dev EWMA)
        self._in_std = (1 - alpha) * self._in_std + alpha * abs(self._latest_in_mbps - self._in_avg)
        self._out_std = (1 - alpha) * self._out_std + alpha * abs(self._latest_out_mbps - self._out_avg)
        # z-score
        z_in = 0 if self._in_std == 0 else abs(self._latest_in_mbps - self._in_avg) / max(0.001, self._in_std)
        z_out = 0 if self._out_std == 0 else abs(self._latest_out_mbps - self._out_avg) / max(0.001, self._out_std)
        if z_in >= ANOMALY_STD_THRESHOLD or z_out >= ANOMALY_STD_THRESHOLD:
            self._status = "ALERT"
            self._raise_alert(
                atype="ThroughputAnomaly",
                severity="high",
                source_ip=None,
                message="Throughput anomaly detected",
                details={
                    "in_mbps": self._latest_in_mbps,
                    "out_mbps": self._latest_out_mbps,
                    "z_in": round(z_in, 2),
                    "z_out": round(z_out, 2),
                },
            )
        else:
            self._status = "OK"

    def _raise_alert(self, atype: str, severity: str, source_ip: Optional[str], message: str, details: Dict[str, Any]) -> None:
        ts = datetime.now(timezone.utc).isoformat()
        alert = Alert(timestamp=ts, type=atype, severity=severity, source_ip=source_ip, message=message, details=details)
        self._alerts.append(alert)
        self._logs.append(
            SecurityLog(
                timestamp=ts,
                level="WARN" if severity != "low" else "INFO",
                source="detector",
                message=f"{atype}: {message}",
                ip_address=source_ip,
            )
        )

    def _log(self, level: str, source: str, message: str, ip: Optional[str]) -> None:
        ts = datetime.now(timezone.utc).isoformat()
        self._logs.append(SecurityLog(timestamp=ts, level=level, source=source, message=message, ip_address=ip))
        # Also print to server logs for operator visibility
        try:
            print(f"[{ts}] {level} {source}: {message} {('ip=' + ip) if ip else ''}")
        except Exception:
            pass

    def _snapshot(self) -> MonitorSnapshot:
        ts = datetime.now(timezone.utc).isoformat()
        alerts = [asdict(a) for a in list(self._alerts)[-20:]]
        logs = [asdict(l) for l in list(self._logs)[-50:]]
        devices = list(self._devices.values())
        return MonitorSnapshot(
            ts=ts,
            inbound_mbps=self._latest_in_mbps,
            outbound_mbps=self._latest_out_mbps,
            status=self._status,
            devices=devices,
            alerts=alerts,
            logs=logs,
        )

    async def _broadcast(self, text: str) -> None:
        dead: List[WebSocket] = []
        for ws in list(self._clients):
            try:
                await ws.send_text(text)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.unregister_ws(ws)


# singleton instance
manager = MonitorManager()

# ----------------------------------------------------------------------------
# Routes
# ----------------------------------------------------------------------------
@router.get("/run")
async def run_monitor() -> JSONResponse:
    """
    GET endpoint that *starts* the monitoring engine (if not already running)
    and keeps it running in background. It does not block. Use the WebSocket
    at /monitor/ws to receive continuous updates.
    """
    await manager.start()
    return JSONResponse({
        "status": "running",
        "note": "Monitoring engine is active. Connect to WebSocket /monitor/ws to receive continuous data.",
        "streams": {"websocket": "/monitor/ws"},
        "metrics": {"tick_seconds": SSE_TICK_SEC},
    })


@router.websocket("/ws")
async def ws_monitor(websocket: WebSocket):
    # no auth in this demo; add JWT guard in production
    await manager.register_ws(websocket)
    try:
        while True:
            # Keep the socket alive; receive optional pings from client
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.unregister_ws(websocket)
    except Exception:
        manager.unregister_ws(websocket)


# Optional: status & stop helpers (admin-only in production)
@router.get("/status")
async def monitor_status() -> Dict[str, Any]:
    snap = manager._snapshot()
    return asdict(snap)


@router.get("/stop")
async def stop_monitor() -> Dict[str, Any]:
    await manager.stop()
    return {"status": "stopped"}


# ----------------------------------------------------------------------------
# main.py wiring example
# ----------------------------------------------------------------------------
# from fastapi import FastAPI
# from app.routers import monitor
# app = FastAPI()
# app.include_router(monitor.router)
# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)
