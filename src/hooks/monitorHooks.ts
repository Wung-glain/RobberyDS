import { useState, useEffect } from "react"
import axios from "axios"

// 1️⃣ Hook for starting monitoring
export function useStartMonitoring() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const startMonitoring = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(false)
      await axios.get("http://localhost:8050/monitor/run")
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || "Failed to start monitoring")
      console.log(err);
    } finally {
      setLoading(false)
    }
  }

  return { startMonitoring, loading, error, success }
}

// 2️⃣ Hook for WebSocket status monitoring (connect only when enabled)
export function useMonitorStatus(enabled: boolean) {
  const [status, setStatus] = useState<any>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!enabled) return

    const socket = new WebSocket("ws://localhost:8050/monitor/ws")

    socket.onopen = () => {
      setConnected(true)
      socket.send(JSON.stringify({ command: "status" }))
    }

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setStatus(data)
      } catch {
        setStatus(event.data)
      }
    }

    socket.onclose = () => setConnected(false)
    socket.onerror = () => setConnected(false)

    return () => {
      socket.close()
    }
  }, [enabled])

  return { status, connected }
}
