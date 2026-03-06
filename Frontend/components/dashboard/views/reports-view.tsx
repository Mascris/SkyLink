import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart3,
  TrendingUp,
  Package,
  MapPin,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Ship
} from "lucide-react"
import { cn } from "@/lib/utils"
import { type Shipment as ApiShipment, type Hub } from "@/lib/api"

interface ReportsViewProps {
  shipments: ApiShipment[]
  hubs: Hub[]
}

export function ReportsView({ shipments, hubs }: ReportsViewProps) {
  const stats = useMemo(() => {
    const total = shipments.length
    const statusCounts = {
      TRANSIT: shipments.filter(s => s.status === "TRANSIT").length,
      DELIVERED: shipments.filter(s => s.status === "DELIVERED").length,
      DELAYED: shipments.filter(s => s.status === "DELAYED").length,
      IN_QUEUE: shipments.filter(s => s.status === "IN_QUEUE").length,
    }

    const avgProgress = total > 0
      ? Math.round(shipments.reduce((acc, s) => acc + (s.progressPercent || 0), 0) / total)
      : 0

    const onTimeRate = total > 0
      ? Math.round((statusCounts.DELIVERED / (total - statusCounts.DELAYED || 1)) * 100)
      : 0

    // Top Routes
    const routeMap = new Map<string, number>()
    shipments.forEach(s => {
      const key = `${s.currentHub} → ${s.destinationHub}`
      routeMap.set(key, (routeMap.get(key) || 0) + 1)
    })
    const topRoutes = Array.from(routeMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    // Volume by Hub
    const hubVolume = new Map<string, number>()
    shipments.forEach(s => {
      hubVolume.set(s.currentHub, (hubVolume.get(s.currentHub) || 0) + 1)
      hubVolume.set(s.destinationHub, (hubVolume.get(s.destinationHub) || 0) + 1)
    })
    const topHubs = Array.from(hubVolume.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    return {
      total,
      statusCounts,
      avgProgress,
      onTimeRate,
      topRoutes,
      topHubs
    }
  }, [shipments])

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Logistics Reports</h1>
        <p className="text-muted-foreground">Comprehensive analytics and performance metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Shipments"
          value={stats.total}
          icon={Package}
          trend="+12% from last week"
          color="text-primary"
        />
        <MetricCard
          title="On-Time Delivery"
          value={`${stats.onTimeRate}%`}
          icon={CheckCircle2}
          trend="Stable"
          color="text-emerald-400"
        />
        <MetricCard
          title="Avg. Progress"
          value={`${stats.avgProgress}%`}
          icon={TrendingUp}
          trend="+5% improvement"
          color="text-blue-400"
        />
        <MetricCard
          title="Active Routes"
          value={stats.topRoutes.length}
          icon={MapPin}
          trend="Expanding"
          color="text-amber-400"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatusProgressBar label="In Transit" count={stats.statusCounts.TRANSIT} total={stats.total} color="bg-blue-500" icon={Ship} />
            <StatusProgressBar label="Delivered" count={stats.statusCounts.DELIVERED} total={stats.total} color="bg-emerald-500" icon={CheckCircle2} />
            <StatusProgressBar label="Pending" count={stats.statusCounts.IN_QUEUE} total={stats.total} color="bg-amber-500" icon={Clock} />
            <StatusProgressBar label="Delayed" count={stats.statusCounts.DELAYED} total={stats.total} color="bg-red-500" icon={AlertTriangle} />
          </CardContent>
        </Card>

        {/* Top Routes */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              High-Volume Routes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topRoutes.map(([route, count], i) => (
                <div key={route} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                    <span className="text-sm font-medium text-foreground">{route}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{count}</span>
                    <span className="text-xs text-muted-foreground">shipments</span>
                  </div>
                </div>
              ))}
              {stats.topRoutes.length === 0 && (
                <p className="text-center py-8 text-muted-foreground">No route data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Volume by Hub */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Top Hub Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topHubs.map(([hubCode, count]) => {
                const hub = hubs.find(h => h.hubCode === hubCode)
                return (
                  <div key={hubCode} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {hubCode}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{hub?.city || hubCode}</p>
                        <p className="text-xs text-muted-foreground">{hub?.country || "Global"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">{count}</p>
                      <p className="text-xs text-muted-foreground">Total Ops</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Performance Insights */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Performance Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg border border-blue-500/20 bg-blue-500/5">
              <h4 className="text-sm font-semibold text-blue-400 mb-1">Network Efficiency</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The current average progress of {stats.avgProgress}% indicates a healthy flow of goods.
                Consider optimizing the {stats.topRoutes[0]?.[0] || "main"} route to reduce transit times.
              </p>
            </div>
            <div className="p-4 rounded-lg border border-amber-500/20 bg-amber-500/5">
              <h4 className="text-sm font-semibold text-amber-400 mb-1">Delay Mitigation</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {stats.statusCounts.DELAYED} shipments are currently delayed. Most delays are occurring
                near high-traffic hubs. Real-time rerouting could improve on-time rates.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MetricCard({ title, value, icon: Icon, trend, color }: any) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-2 rounded-lg bg-secondary/50", color)}>
            <Icon className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium text-emerald-400">{trend}</span>
        </div>
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-foreground">{value}</h3>
      </CardContent>
    </Card>
  )
}

function StatusProgressBar({ label, count, total, color, icon: Icon }: any) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="text-foreground font-medium">{label}</span>
        </div>
        <span className="text-muted-foreground">{count} ({percent}%)</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
