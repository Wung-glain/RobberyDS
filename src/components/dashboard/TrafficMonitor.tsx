import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Network, Signal } from 'lucide-react';

interface TrafficData {
  timestamp: string;
  inbound: number;
  outbound: number;
  threats: number;
  status: 'normal' | 'warning' | 'critical';
}

export const TrafficMonitor = ({ monitoring }: { monitoring: boolean }) => {
  const [trafficData, setTrafficData] = useState<TrafficData[]>([
    { timestamp: new Date().toLocaleTimeString(), inbound: 0, outbound: 0, threats: 0, status: 'normal' }
  ]);
  const [connected, setConnected] = useState(false);

  // WebSocket connection
  useEffect(() => {
    if (!monitoring) return; // only connect if monitoring has started

    const socket = new WebSocket("ws://localhost:8050/monitor/ws");

    socket.onopen = () => {
      setConnected(true);
      // Ask backend for live status
      socket.send(JSON.stringify({ command: "status" }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Expected backend response shape:
        // { inbound: number, outbound: number, threats: number, status: "normal"|"warning"|"critical" }

        const newData: TrafficData = {
          timestamp: new Date().toLocaleTimeString(),
          inbound: data.inbound_mbps ?? 0,
          outbound: data.outbound_mbps ?? 0,
          threats: data.threats ?? 0,
          status: data.status ?? 'normal',
        };

        setTrafficData((prev) => [...prev.slice(-9), newData]); // keep last 10
      } catch (err) {
        console.error("Invalid WS message:", event.data);
      }
    };

    socket.onclose = () => setConnected(false);
    socket.onerror = () => setConnected(false);

    return () => socket.close();
  }, [monitoring]);

  const latestData = trafficData[trafficData.length - 1];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'destructive';
      case 'warning': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Real-time Traffic Monitor
            </CardTitle>
            <CardDescription>Live network traffic and threat detection</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Signal className={`h-4 w-4 ${connected ? 'text-green-500' : 'text-gray-400'}`} />
            <Badge variant={connected ? 'default' : 'secondary'}>
              {connected ? 'LIVE' : 'PAUSED'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Status */}
          {latestData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Network className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Inbound</span>
                </div>
                <span className="text-lg font-bold" text-blue-500>{latestData.inbound} MB/s</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Network className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Outbound</span>
                </div>
                <span className="text-lg font-bold text-green-500">{latestData.outbound} MB/s</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium">Status</span>
                </div>
                <Badge variant={getStatusColor(latestData.status)}>
                  {latestData.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          )}

          {/* Traffic History */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Recent Activity</h4>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {trafficData.slice(-10).reverse().map((data, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 text-sm bg-card border rounded"
                >
                  <span className="text-muted-foreground">{data.timestamp}</span>
                  <div className="flex items-center gap-4">
                    <span>↓ {data.inbound} MB/s</span>
                    <span>↑ {data.outbound} MB/s</span>
                    {data.threats > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {data.threats} threats
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
