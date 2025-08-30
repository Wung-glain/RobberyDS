import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Shield, Ban, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BlockedIP {
  ip: string;
  reason: string;
  timestamp: string;
  status: 'active' | 'temporary';
}

export const SystemActions = () => {
  const [ipToBlock, setIpToBlock] = useState('');
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([
    // { ip: '192.168.1.100', reason: 'Malicious activity', timestamp: new Date().toLocaleString(), status: 'active' },
    // { ip: '10.0.0.50', reason: 'Unauthorized access', timestamp: new Date().toLocaleString(), status: 'temporary' },
  ]);
  const [systemStatus, setSystemStatus] = useState<'normal' | 'lockdown' | 'maintenance'>('normal');
  const { toast } = useToast();

  const handleBlockIP = () => {
    if (!ipToBlock) return;
    
    const newBlock: BlockedIP = {
      ip: ipToBlock,
      reason: 'Manual block',
      timestamp: new Date().toLocaleString(),
      status: 'active',
    };
    
    setBlockedIPs(prev => [newBlock, ...prev]);
    setIpToBlock('');
    
    toast({
      title: "IP Blocked",
      description: `IP address ${ipToBlock} has been blocked`,
    });
  };

  const handleUnblockIP = (ip: string) => {
    setBlockedIPs(prev => prev.filter(blocked => blocked.ip !== ip));
    toast({
      title: "IP Unblocked",
      description: `IP address ${ip} has been unblocked`,
    });
  };

  const handleSystemLockdown = () => {
    setSystemStatus('lockdown');
    toast({
      title: "System Lockdown Activated",
      description: "All external connections have been blocked",
      variant: "destructive",
    });
  };

  const handleSystemNormal = () => {
    setSystemStatus('normal');
    toast({
      title: "System Status Normal",
      description: "All security measures restored to normal operation",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'lockdown': return 'destructive';
      case 'maintenance': return 'secondary';
      case 'normal': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'lockdown': return <Lock className="h-4 w-4" />;
      case 'maintenance': return <AlertCircle className="h-4 w-4" />;
      case 'normal': return <CheckCircle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          System Actions Panel
        </CardTitle>
        <CardDescription>Emergency controls and IP management</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* System Status */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">System Status</h4>
            <Badge variant={getStatusColor(systemStatus)} className="flex items-center gap-1">
              {getStatusIcon(systemStatus)}
              {systemStatus.toUpperCase()}
            </Badge>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={systemStatus === 'normal' ? 'default' : 'outline'}
              size="sm"
              onClick={handleSystemNormal}
              className="flex items-center gap-1"
            >
              <CheckCircle className="h-3 w-3" />
              Normal Operation
            </Button>
            <Button
              variant={systemStatus === 'lockdown' ? 'destructive' : 'outline'}
              size="sm"
              onClick={handleSystemLockdown}
              className="flex items-center gap-1"
            >
              <Lock className="h-3 w-3" />
              Emergency Lockdown
            </Button>
          </div>
        </div>

        {/* IP Blocking */}
        <div className="space-y-4">
          <h4 className="font-medium">IP Address Management</h4>
          
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="ipBlock" className="sr-only">IP Address</Label>
              <Input
                id="ipBlock"
                placeholder="Enter IP address to block"
                value={ipToBlock}
                onChange={(e) => setIpToBlock(e.target.value)}
              />
            </div>
            <Button onClick={handleBlockIP} className="flex items-center gap-1">
              <Ban className="h-3 w-3" />
              Block IP
            </Button>
          </div>

          <div className="space-y-2">
            <h5 className="text-sm font-medium text-muted-foreground">Currently Blocked IPs</h5>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {blockedIPs.map((blocked, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex-1">
                    <div className="font-mono text-sm">{blocked.ip}</div>
                    <div className="text-xs text-muted-foreground">{blocked.reason}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={blocked.status === 'active' ? 'destructive' : 'secondary'} className="text-xs">
                      {blocked.status}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUnblockIP(blocked.ip)}
                    >
                      Unblock
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h4 className="font-medium">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Ban className="h-3 w-3" />
              Block All Traffic
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Quarantine Network
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Allow All Traffic
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Reset Firewall
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};