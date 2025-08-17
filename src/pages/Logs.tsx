import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Search, Download, Filter } from 'lucide-react';
import { useState } from 'react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  source: string;
  message: string;
  ip?: string;
}

export const Logs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');

  // Mock log data
  const logs: LogEntry[] = [
    {
      id: '1',
      timestamp: new Date().toLocaleString(),
      level: 'critical',
      source: 'Firewall',
      message: 'Multiple failed authentication attempts detected from 192.168.1.100',
      ip: '192.168.1.100'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toLocaleString(),
      level: 'warning',
      source: 'IDS',
      message: 'Suspicious port scanning activity detected',
      ip: '10.0.0.45'
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toLocaleString(),
      level: 'info',
      source: 'System',
      message: 'IPS rules updated successfully',
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toLocaleString(),
      level: 'error',
      source: 'Network',
      message: 'DDoS attack mitigation activated',
      ip: '203.0.113.45'
    },
    {
      id: '5',
      timestamp: new Date(Date.now() - 20 * 60 * 1000).toLocaleString(),
      level: 'warning',
      source: 'Malware Scanner',
      message: 'Potentially malicious file quarantined',
    },
  ];

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      case 'info': return 'default';
      default: return 'default';
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (log.ip && log.ip.includes(searchTerm));
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">System Logs</h1>
        <p className="text-muted-foreground">
          View detailed system logs and security events
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Security Logs
          </CardTitle>
          <CardDescription>Real-time system and security event logs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Filter Controls */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                  className="px-3 py-2 border border-input rounded-md bg-background text-foreground"
                >
                  <option value="all">All Levels</option>
                  <option value="critical">Critical</option>
                  <option value="error">Error</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-1" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </div>
            </div>

            {/* Log Level Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['critical', 'error', 'warning', 'info'].map(level => {
                const count = logs.filter(log => log.level === level).length;
                return (
                  <div key={level} className="p-3 bg-muted rounded-lg text-center">
                    <Badge variant={getLevelColor(level)} className="mb-2 capitalize">
                      {level}
                    </Badge>
                    <div className="text-2xl font-bold">{count}</div>
                  </div>
                );
              })}
            </div>

            {/* Logs Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {log.timestamp}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getLevelColor(log.level)} className="capitalize">
                          {log.level}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {log.source}
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {log.message}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.ip || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredLogs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No logs found matching your search criteria.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};