import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Shield, Activity } from 'lucide-react';

interface StatData {
  time: string;
  blocked: number;
  allowed: number;
  threats: number;
}

export const StatisticsCharts = () => {
  const [stats, setStats] = useState<StatData[]>([]);
  const [timeframe, setTimeframe] = useState('24h');

  useEffect(() => {
    // Generate mock statistics data
    const generateStats = () => {
      const now = new Date();
      const data: StatData[] = [];
      
      for (let i = 23; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60 * 60 * 1000);
        data.push({
          time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          blocked: Math.floor(Math.random() * 100) + 10,
          allowed: Math.floor(Math.random() * 500) + 100,
          threats: Math.floor(Math.random() * 20),
        });
      }
      
      setStats(data);
    };

    generateStats();
    const interval = setInterval(generateStats, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [timeframe]);

  const totalBlocked = stats.reduce((sum, stat) => sum + stat.blocked, 0);
  const totalAllowed = stats.reduce((sum, stat) => sum + stat.allowed, 0);
  const totalThreats = stats.reduce((sum, stat) => sum + stat.threats, 0);
  const blockRate = totalBlocked + totalAllowed > 0 ? (totalBlocked / (totalBlocked + totalAllowed) * 100).toFixed(1) : '0';

  const maxValue = Math.max(...stats.map(s => Math.max(s.blocked, s.allowed, s.threats * 10)));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Network Statistics
        </CardTitle>
        <CardDescription>Traffic trends and security metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={timeframe} onValueChange={setTimeframe}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="24h">24 Hours</TabsTrigger>
            <TabsTrigger value="7d">7 Days</TabsTrigger>
            <TabsTrigger value="30d">30 Days</TabsTrigger>
          </TabsList>

          <TabsContent value={timeframe} className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Allowed</span>
                </div>
                <div className="text-2xl font-bold text-green-600">{totalAllowed.toLocaleString()}</div>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Blocked</span>
                </div>
                <div className="text-2xl font-bold text-red-600">{totalBlocked.toLocaleString()}</div>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Threats</span>
                </div>
                <div className="text-2xl font-bold text-orange-600">{totalThreats}</div>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Block Rate</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">{blockRate}%</div>
              </div>
            </div>

            {/* Simple Bar Chart */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Traffic Overview (Last 24 Hours)</h4>
              <div className="h-48 bg-muted rounded-lg p-4">
                <div className="h-full flex items-end justify-between gap-1">
                  {stats.slice(-12).map((stat, index) => {
                    const allowedHeight = (stat.allowed / maxValue) * 100;
                    const blockedHeight = (stat.blocked / maxValue) * 100;
                    
                    return (
                      <div key={index} className="flex flex-col items-center gap-1 flex-1">
                        <div className="flex flex-col justify-end h-32 gap-1">
                          <div 
                            className="bg-green-500 rounded-t min-h-[2px]"
                            style={{ height: `${allowedHeight}%` }}
                            title={`Allowed: ${stat.allowed}`}
                          />
                          <div 
                            className="bg-red-500 rounded-t min-h-[2px]"
                            style={{ height: `${blockedHeight}%` }}
                            title={`Blocked: ${stat.blocked}`}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground transform -rotate-45 origin-top-left">
                          {stat.time}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Legend */}
              <div className="flex items-center justify-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Allowed Traffic</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>Blocked Traffic</span>
                </div>
              </div>
            </div>

            {/* Threat Analysis */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Threat Detection Trends</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Badge variant="outline" className="justify-center">
                  Malware: {Math.floor(totalThreats * 0.4)}
                </Badge>
                <Badge variant="outline" className="justify-center">
                  DDoS: {Math.floor(totalThreats * 0.3)}
                </Badge>
                <Badge variant="outline" className="justify-center">
                  Intrusion: {Math.floor(totalThreats * 0.2)}
                </Badge>
                <Badge variant="outline" className="justify-center">
                  Other: {Math.floor(totalThreats * 0.1)}
                </Badge>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};