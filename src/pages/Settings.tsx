import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings as SettingsIcon, Shield, Bell, User, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Security Settings
  const [autoBlock, setAutoBlock] = useState(true);
  const [realTimeScanning, setRealTimeScanning] = useState(true);
  const [ddosProtection, setDdosProtection] = useState(true);
  const [threatLevel, setThreatLevel] = useState('medium');
  
  // Notification Settings
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState('high');
  
  // System Settings
  const [logRetention, setLogRetention] = useState('30');
  const [backupEnabled, setBackupEnabled] = useState(true);

  const handleSaveSettings = (section: string) => {
    toast({
      title: "Settings Saved",
      description: `${section} settings have been updated successfully`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Configure your IPS system preferences and security policies
        </p>
      </div>

      <Tabs defaultValue="security" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            System
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
        </TabsList>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Configuration
              </CardTitle>
              <CardDescription>
                Configure security policies and threat detection settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Auto-block Threats</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically block detected threats
                    </p>
                  </div>
                  <Switch
                    checked={autoBlock}
                    onCheckedChange={setAutoBlock}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Real-time Scanning</Label>
                    <p className="text-sm text-muted-foreground">
                      Continuously monitor network traffic
                    </p>
                  </div>
                  <Switch
                    checked={realTimeScanning}
                    onCheckedChange={setRealTimeScanning}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">DDoS Protection</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable distributed denial of service protection
                    </p>
                  </div>
                  <Switch
                    checked={ddosProtection}
                    onCheckedChange={setDdosProtection}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="threat-level">Threat Detection Level</Label>
                  <select
                    id="threat-level"
                    value={threatLevel}
                    onChange={(e) => setThreatLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  >
                    <option value="low">Low - Basic protection</option>
                    <option value="medium">Medium - Balanced protection</option>
                    <option value="high">High - Aggressive protection</option>
                    <option value="paranoid">Paranoid - Maximum protection</option>
                  </select>
                </div>
              </div>

              <Button onClick={() => handleSaveSettings('Security')}>
                Save Security Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure how you receive security alerts and notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Email Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive security alerts via email
                    </p>
                  </div>
                  <Switch
                    checked={emailAlerts}
                    onCheckedChange={setEmailAlerts}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">SMS Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive critical alerts via SMS
                    </p>
                  </div>
                  <Switch
                    checked={smsAlerts}
                    onCheckedChange={setSmsAlerts}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alert-threshold">Alert Threshold</Label>
                  <select
                    id="alert-threshold"
                    value={alertThreshold}
                    onChange={(e) => setAlertThreshold(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  >
                    <option value="critical">Critical alerts only</option>
                    <option value="high">High and critical alerts</option>
                    <option value="medium">Medium, high, and critical alerts</option>
                    <option value="all">All alerts</option>
                  </select>
                </div>
              </div>

              <Button onClick={() => handleSaveSettings('Notification')}>
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                System Configuration
              </CardTitle>
              <CardDescription>
                Manage system settings and data retention policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="log-retention">Log Retention (days)</Label>
                  <Input
                    id="log-retention"
                    type="number"
                    value={logRetention}
                    onChange={(e) => setLogRetention(e.target.value)}
                    min="1"
                    max="365"
                  />
                  <p className="text-sm text-muted-foreground">
                    Number of days to retain system logs
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Automatic Backups</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable automatic system configuration backups
                    </p>
                  </div>
                  <Switch
                    checked={backupEnabled}
                    onCheckedChange={setBackupEnabled}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium">System Status</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Database</div>
                    <Badge variant="default">Healthy</Badge>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Storage</div>
                    <Badge variant="default">85% Used</Badge>
                  </div>
                </div>
              </div>

              <Button onClick={() => handleSaveSettings('System')}>
                Save System Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Admin Profile
              </CardTitle>
              <CardDescription>
                Manage your admin account information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value="System Administrator"
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last-login">Last Login</Label>
                  <Input
                    id="last-login"
                    value={new Date().toLocaleString()}
                    disabled
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Security Information</h4>
                <div className="grid gap-2">
                  <div className="flex justify-between text-sm">
                    <span>Two-Factor Authentication</span>
                    <Badge variant="secondary">Not Configured</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Session Timeout</span>
                    <span>8 hours</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline">Change Password</Button>
                <Button variant="outline">Enable 2FA</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};