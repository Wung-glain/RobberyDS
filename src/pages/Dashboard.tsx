import React, { useEffect, useRef, useState } from 'react';
import { 
  LayoutDashboard, Video, ShieldAlert, History, 
  BrainCircuit, Scale, FileSearch, FileText, 
  Film, Camera, BarChart3, Activity, 
  Zap, Bell, Settings, LogOut, ChevronRight
} from 'lucide-react';

/**
 * CORE VIDEO COMPONENT
 * Handles WebSocket connection and Canvas drawing for each feed
 */
const VideoCanvas = ({ id, streamUrl, title }) => {
  const canvasRef = useRef(null);
  const [status, setStatus] = useState("CONNECTING");

  useEffect(() => {
    const ws = new WebSocket(streamUrl);
    ws.onopen = () => setStatus("LIVE");
    ws.onclose = () => setStatus("OFFLINE");
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.src = `data:image/jpeg;base64,${data.image}`;
      img.onload = () => {
        // --- CRITICAL FIX 1: MATCHING INTERNAL RESOLUTION ---
        // If we don't do this, the "brush" is drawing on a different scale than the image
        canvas.width = img.width;
        canvas.height = img.height;

        // Clear and Draw Frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // --- CRITICAL FIX 2: VERIFYING DATA EXISTENCE ---
        if (!data.detections || data.detections.length === 0) return;

        data.detections.forEach(det => {
          // Destructure the box [x1, y1, x2, y2]
          const [x1, y1, x2, y2] = det.box;
          const width = x2 - x1;
          const height = y2 - y1;

          // Style Logic
          const isHighSuspicion = det.score > 70;
          const color = isHighSuspicion ? "#ff4444" : "#00ff88"; 
          
          ctx.strokeStyle = color;
          ctx.lineWidth = 4; // Make it thick so it's impossible to miss
          
          // --- CRITICAL FIX 3: THE DRAWING PATH ---
          ctx.beginPath();
          ctx.rect(x1, y1, width, height);
          ctx.stroke();

          // Draw Label
          ctx.fillStyle = color;
          ctx.font = "bold 20px Arial";
          ctx.fillText(`ID:${det.id} | ${det.score}%`, x1, y1 - 10);
          
          console.log(`Drawing Box for ID ${det.id} at:`, x1, y1); // Debug log
        });
      };
    };
    return () => ws.close();
  }, [streamUrl, id]);

  return (
    <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10">
      <div className="absolute top-4 left-4 z-20 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded border border-white/20">
            <p className="text-white text-xs font-black tracking-widest uppercase">CAM {id} - {title}</p>
        </div>
      </div>
      {/* status indicator */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
         <div className={`w-2 h-2 rounded-full ${status === "LIVE" ? "bg-red-500 animate-pulse" : "bg-gray-500"}`}></div>
         <span className="text-[10px] font-mono text-white/80">{status}</span>
      </div>
      <canvas ref={canvasRef} className="w-full h-auto block" />
    </div>
  );
};

/**
 * MAIN DASHBOARD COMPONENT
 */
export default function DashBoard() {
  return (
    <div className="flex h-screen bg-[#0d1117] text-zinc-400 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-white/5 flex flex-col bg-[#0b0e14]">
        <div className="p-6 flex items-center gap-3 text-white border-b border-white/5">
          <ShieldAlert className="text-blue-500" size={24} />
          <h2 className="font-bold tracking-tight text-sm">Robbery Detection</h2>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          <SidebarSection title="Monitoring">
            <SidebarItem icon={<LayoutDashboard size={18} />} label="Dashboard" active />
            <SidebarItem icon={<Video size={18} />} label="Live Monitoring" hasArrow />
            <SidebarItem icon={<ShieldAlert size={18} />} label="Active Incidents" />
            <SidebarItem icon={<History size={18} />} label="Incident Timeline" />
          </SidebarSection>

          <SidebarSection title="Intelligence">
            <SidebarItem icon={<BrainCircuit size={18} />} label="Detection Models" hasArrow />
            <SidebarItem icon={<Settings size={18} />} label="Detection Rules" />
            <SidebarItem icon={<Scale size={18} />} label="False Positive Review" />
          </SidebarSection>

          <SidebarSection title="Investigation">
            <SidebarItem icon={<FileText size={18} />} label="Incident Reports" hasArrow />
            <SidebarItem icon={<Film size={18} />} label="Video Evidence" hasArrow />
            <SidebarItem icon={<Camera size={18} />} label="Snapshots & Frames" hasArrow />
          </SidebarSection>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* TOP HEADER */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#0d1117]">
          <h1 className="text-xl font-semibold text-white">Robbery Detection System</h1>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors">
              <FileText size={16} /> <span className="text-xs uppercase font-bold tracking-wider">Reports</span>
            </div>
            <div className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors">
              <Settings size={16} /> <span className="text-xs uppercase font-bold tracking-wider">Settings</span>
            </div>
            <div className="relative cursor-pointer">
              <Bell size={18} className="text-white/70 hover:text-white" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0d1117]"></div>
            </div>
            <div className="flex items-center gap-3 pl-4 border-l border-white/10 cursor-pointer">
              <img src="https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff" className="w-8 h-8 rounded-full" alt="User" />
              <span className="text-sm font-medium text-white">Admin</span>
            </div>
          </div>
        </header>

        {/* DASHBOARD GRID */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          
          {/* TOP STAT CARDS */}
          <div className="grid grid-cols-4 gap-6">
            <StatCard title="Active Alerts" value="0" subtitle="Critial" color="text-green-500" progress={75} badge={undefined} gridIcon={undefined} />
            <StatCard title="Cameras Online" value="4" subtitle="Active" color="text-white" gridIcon progress={undefined} badge={undefined} />
            <StatCard title="Threat Level" value="LOW" color="text-green-500" badge="LOW" subtitle={undefined} progress={undefined} gridIcon={undefined} />
            <StatCard title="Recent Incidents" value="1" subtitle="Last 24h" color="text-white" progress={undefined} badge={undefined} gridIcon={undefined} />
          </div>

          <div className="grid grid-cols-6 gap-6">
            {/* 4-CAM FEED GRID */}
            <div className="col-span-8 bg-[#161b22] border border-white/5 rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Live Camera Feeds</h3>
                <div className="text-zinc-500 cursor-pointer hover:text-white">...</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <VideoCanvas id="05" title="Store Front" streamUrl="ws://localhost:8000/ws/stream" />
                <VideoCanvas id="12" title="ATM Lobby" streamUrl="ws://localhost:8000/ws/stream" />
                <VideoCanvas id="07" title="Vault Entry" streamUrl="ws://localhost:8000/ws/stream" />
                <VideoCanvas id="14" title="Rear Alley" streamUrl="ws://localhost:8000/ws/stream" />
              </div>
              <button className="w-full mt-4 py-2 text-xs font-bold text-white/70 hover:text-white bg-white/5 rounded transition-colors uppercase">
                View All Cameras
              </button>
            </div>

            {/* TIMELINE */}
            <div className="col-span-4 bg-[#161b22] border border-white/5 rounded-xl p-5 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Incident Timeline</h3>
                <div className="text-zinc-500 cursor-pointer hover:text-white">...</div>
              </div>
              <div className="space-y-6 flex-1">
                <TimelineItem time="10:45 AM" title="Armed Robbery in Store 05" tag="HIGH" color="red" />
                <TimelineItem time="10:30 AM" title="Suspicious Activity near ATM" tag="MEDIUM" color="orange" />
                <TimelineItem time="10:15 AM" title="Attempted Robbery in Alley" tag="HIGH" color="red" />
                <TimelineItem time="09:50 AM" title="False Alarm Reviewed" tag="LOW" color="green" />
              </div>
            </div>
          </div>

          {/* LOWER SECTION */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-5 bg-[#161b22] border border-white/5 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Alert Summary</h3>
              <div className="space-y-3">
                <SummaryRow label="High" count="2" color="bg-red-500" />
                <SummaryRow label="Medium" count="1" color="bg-orange-500" />
                <SummaryRow label="Low" count="3" color="bg-green-500" />
              </div>
            </div>

            <div className="col-span-7 bg-[#161b22] border border-white/5 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Detection Models</h3>
              <div className="grid grid-cols-3 gap-4">
                <ModelCard icon={<ShieldAlert size={20}/>} label="Robbery Detection" />
                <ModelCard icon={<Zap size={20}/>} label="Weapon Detection" />
                <ModelCard icon={<FileSearch size={20}/>} label="Suspicious Behavior" />
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

// COMPONENT HELPERS
const SidebarSection = ({ title, children }) => (
  <div className="px-4 space-y-1">
    <h3 className="px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2">{title}</h3>
    {children}
  </div>
);

const SidebarItem = ({ icon, label, active = false, hasArrow = false }) => (
  <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg cursor-pointer transition-all ${active ? 'bg-blue-500/10 text-white border-l-2 border-blue-500' : 'hover:bg-white/5 text-zinc-400'}`}>
    <div className="flex items-center gap-3">
      {icon}
      <span className="text-[13px] font-medium">{label}</span>
    </div>
    {hasArrow && <ChevronRight size={14} className="opacity-40" />}
  </div>
);

const StatCard = ({ title, value, subtitle, color, progress, badge, gridIcon }) => (
  <div className="bg-[#161b22] border border-white/5 rounded-xl p-5 relative overflow-hidden">
    <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-3">{title}</p>
    <div className="flex items-baseline gap-3">
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
      {badge && <span className="bg-red-500 text-[10px] font-black px-2 py-0.5 rounded text-white">{badge}</span>}
    </div>
    {subtitle && <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-tight">{subtitle}</p>}
    {progress && (
      <div className="mt-4 w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden flex gap-1">
        <div className="bg-red-500 h-full w-1/3"></div>
        <div className="bg-red-500/30 h-full w-1/6"></div>
      </div>
    )}
    {gridIcon && (
      <div className="absolute top-12 right-6 grid grid-cols-3 gap-1 opacity-20">
        {[...Array(9)].map((_, i) => <div key={i} className="w-1 h-1 bg-green-500 rounded-full"></div>)}
      </div>
    )}
  </div>
);

const TimelineItem = ({ time, title, tag, color }) => {
  const colors = {
    red: "bg-red-500 text-red-500 border-red-500",
    orange: "bg-orange-500 text-orange-500 border-orange-500",
    green: "bg-green-500 text-green-500 border-green-500"
  };
  return (
    <div className="flex items-start justify-between border-b border-white/5 pb-4 last:border-0">
      <div>
        <p className="text-[10px] text-zinc-500 font-mono mb-1">{time}</p>
        <p className="text-xs font-semibold text-white/90">{title}</p>
      </div>
      <span className={`text-[9px] font-black px-2 py-0.5 border rounded ${colors[color].split(' ')[1]} ${colors[color].split(' ')[2]}`}>
        {tag}
      </span>
    </div>
  );
};

const SummaryRow = ({ label, count, color }) => (
  <div className="flex items-center justify-between text-xs py-1">
    <div className="flex items-center gap-2">
      <span className="text-zinc-400 font-medium">{label}:</span>
      <span className="text-white font-bold">{count}</span>
    </div>
    <div className="w-48 bg-zinc-800 h-1.5 rounded-full">
      <div className={`${color} h-full rounded-full`} style={{ width: `${(parseInt(count) / 6) * 100}%` }}></div>
    </div>
  </div>
);

const ModelCard = ({ icon, label }) => (
  <div className="bg-white/5 border border-white/5 p-4 rounded-lg flex flex-col items-center justify-center gap-3 text-center cursor-pointer hover:bg-white/10 transition-colors group">
    <div className="p-3 bg-zinc-900 rounded-full text-zinc-400 group-hover:text-blue-500 transition-colors">
      {icon}
    </div>
    <p className="text-[10px] font-bold text-white uppercase tracking-tighter leading-tight">{label}</p>
  </div>
);