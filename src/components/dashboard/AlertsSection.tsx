import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Clock, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BackendAlert {
  timestamp: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source_ip?: string | null;
}

export const AlertsSection = () => {
  const [alerts, setAlerts] = useState<BackendAlert[]>([]);
  const { toast } = useToast();

  // Fetch alerts from backend
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch("http://localhost:8050/monitor/run"); 
        const data = await res.json();

        if (data.alerts) {
          setAlerts(data.alerts.slice(0, 5)); // take only first 5
        }
      } catch (err) {
        console.error("Failed to fetch alerts", err);
      }
    };

    fetchAlerts();

    // Optional: refresh alerts every 10s
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, [toast]);

  const getSeverityColor = (severity: BackendAlert['severity']) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Security Alerts
        </CardTitle>
        <CardDescription>Recent intrusion attempts and security events</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Source IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.length > 0 ? (
                alerts.map((alert, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {alert.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getSeverityColor(alert.severity)} className="capitalize">
                        {alert.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {alert.source_ip ?? "N/A"}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                    No alerts available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
