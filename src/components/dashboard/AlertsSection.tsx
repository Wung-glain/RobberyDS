import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Clock, MapPin, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Alert {
  id: string;
  type: 'intrusion' | 'malware' | 'ddos' | 'unauthorized';
  severity: 'low' | 'medium' | 'high' | 'critical';
  sourceIP: string;
  targetIP: string;
  timestamp: string;
  description: string;
  status: 'active' | 'investigating' | 'resolved';
  actionTaken?: string;
}

export const AlertsSection = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const { toast } = useToast();

  // Generate mock alerts
  useEffect(() => {
    const generateAlert = (): Alert => {
      const types: Alert['type'][] = ['intrusion', 'malware', 'ddos', 'unauthorized'];
      const severities: Alert['severity'][] = ['low', 'medium', 'high', 'critical'];
      const statuses: Alert['status'][] = ['active', 'investigating', 'resolved'];
      
      const type = types[Math.floor(Math.random() * types.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      
      return {
        id: Math.random().toString(36).substr(2, 9),
        type,
        severity,
        sourceIP: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        targetIP: `192.168.1.${Math.floor(Math.random() * 255)}`,
        timestamp: new Date().toLocaleString(),
        description: getAlertDescription(type),
        status: statuses[Math.floor(Math.random() * statuses.length)],
      };
    };

    const getAlertDescription = (type: Alert['type']) => {
      const descriptions = {
        intrusion: 'Unauthorized access attempt detected',
        malware: 'Malicious file detected in network traffic',
        ddos: 'Distributed denial of service attack identified',
        unauthorized: 'Unauthorized connection attempt from external IP',
      };
      return descriptions[type];
    };

    // Initialize with some alerts
    const initialAlerts = Array.from({ length: 8 }, generateAlert);
    setAlerts(initialAlerts);

    // Simulate new alerts
    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance of new alert
        const newAlert = generateAlert();
        setAlerts(prev => [newAlert, ...prev.slice(0, 19)]); // Keep last 20 alerts
        
        if (newAlert.severity === 'critical' || newAlert.severity === 'high') {
          toast({
            title: "Security Alert",
            description: `${newAlert.severity.toUpperCase()}: ${newAlert.description}`,
            variant: newAlert.severity === 'critical' ? 'destructive' : 'default',
          });
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [toast]);

  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getStatusColor = (status: Alert['status']) => {
    switch (status) {
      case 'active': return 'destructive';
      case 'investigating': return 'secondary';
      case 'resolved': return 'default';
      default: return 'default';
    }
  };

  const handleTakeAction = (alertId: string, action: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: 'investigating', actionTaken: action }
        : alert
    ));
    
    toast({
      title: "Action Taken",
      description: `${action} action applied to alert`,
    });
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
        <div className="space-y-4">
          {/* Alert Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['critical', 'high', 'medium', 'low'].map(severity => {
              const count = alerts.filter(a => a.severity === severity && a.status === 'active').length;
              return (
                <div key={severity} className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-lg font-bold">{count}</div>
                  <div className="text-sm text-muted-foreground capitalize">{severity}</div>
                </div>
              );
            })}
          </div>

          {/* Alerts Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Source IP</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.slice(0, 10).map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {alert.timestamp.split(' ')[1]}
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
                        {alert.sourceIP}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(alert.status)} className="capitalize">
                        {alert.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {alert.status === 'active' && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTakeAction(alert.id, 'Block IP')}
                          >
                            Block
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTakeAction(alert.id, 'Quarantine')}
                          >
                            Quarantine
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};