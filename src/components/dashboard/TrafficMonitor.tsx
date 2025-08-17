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

export const TrafficMonitor = () => {
  const [trafficData, setTrafficData] = useState<TrafficData[]>([]);
  const [isLive, setIsLive] = useState(true);

  // Simulate real-time traffic data
  useEffect(() => {
    const generateTrafficData = (): TrafficData => {
      const inbound = Math.floor(Math.random() * 1000) + 100;
      const outbound = Math.floor(Math.random() * 800) + 50;
      const threats = Math.floor(Math.random() * 10);
      
      let status: 'normal' | 'warning' | 'critical' = 'normal';
      if (threats > 5) status = 'critical';
      else if (threats > 2) status = 'warning';

      return {
        timestamp: new Date().toLocaleTimeString(),
        inbound,
        outbound,
        threats,
        status,
      };
    };

    const interval = setInterval(() => {
      if (isLive) {
        setTrafficData(prev => [...prev.slice(-9), generateTrafficData()]);
      }
    }, 2000);

    // Initialize with some data
    if (trafficData.length === 0) {
      const initialData = Array.from({ length: 10 }, generateTrafficData);
      setTrafficData(initialData);
    }

    return () => clearInterval(interval);
  }, [isLive, trafficData.length]);

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
            <Signal className={`h-4 w-4 ${isLive ? 'text-green-500' : 'text-gray-400'}`} />
            <Badge variant={isLive ? 'default' : 'secondary'}>
              {isLive ? 'LIVE' : 'PAUSED'}
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
                <span className="text-lg font-bold">{latestData.inbound} MB/s</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Network className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Outbound</span>
                </div>
                <span className="text-lg font-bold">{latestData.outbound} MB/s</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
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