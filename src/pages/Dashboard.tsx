import { TrafficMonitor } from '@/components/dashboard/TrafficMonitor';
import { AlertsSection } from '@/components/dashboard/AlertsSection';
import { SystemActions } from '@/components/dashboard/SystemActions';
import { StatisticsCharts } from '@/components/dashboard/StatisticsCharts';
import { useStartMonitoring, useMonitorStatus } from "@/hooks/monitorHooks";

export const Dashboard = () => {
  const { startMonitoring, loading, error, success } = useStartMonitoring()
  const { status, connected } = useMonitorStatus(success)
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
            <h1 className="text-3xl font-bold text-foreground">IPS Dashboar</h1>
            <p className="text-muted-foreground">
              Real-time monitoring and control of your network security
            </p>
        </div>
        <div>
          {/* WebSocket Status */}
              {success && (
                <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                  <h2 className="font-bold">WebSocket Status:</h2>
                  <p>Connected: {connected ? "✅ Yes" : "❌ No"}</p>
                  <pre className="bg-white p-2 rounded mt-2 text-sm overflow-x-auto">
                    {status ? JSON.stringify(status, null, 2) : "Waiting for data..."}
                  </pre>
                </div>
              )}
        </div>
        <div>
 {/* Start Monitoring Button */}
      <button
        onClick={startMonitoring}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        {loading ? "Starting..." : "Start Monitoring"}
      </button>
      {error && <p className="text-red-500">{error}</p>}
      {success && <p className="text-green-600">Monitoring started! Connecting WebSocket...</p>}

        </div>
      </div>



      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <TrafficMonitor monitoring={success} />
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