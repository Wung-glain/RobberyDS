import { TrafficMonitor } from '@/components/dashboard/TrafficMonitor';
import { AlertsSection } from '@/components/dashboard/AlertsSection';
import { SystemActions } from '@/components/dashboard/SystemActions';
import { StatisticsCharts } from '@/components/dashboard/StatisticsCharts';

export const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">IPS Dashboard</h1>
        <p className="text-muted-foreground">
          Real-time monitoring and control of your network security
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <TrafficMonitor />
          <SystemActions />
        </div>
        <div className="space-y-6">
          <AlertsSection />
          <StatisticsCharts />
        </div>
      </div>
    </div>
  );
};