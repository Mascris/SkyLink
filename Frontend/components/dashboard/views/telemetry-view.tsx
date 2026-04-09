"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Anchor,
    Ship,
    Navigation,
    TrendingUp,
    Activity,
    Container,
    Gauge,
    MapPin,
    AlertTriangle,
    CheckCircle,
    Clock,
    Radar,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { type Shipment as ApiShipment, type Hub } from "@/lib/api"

function normalizeStatus(status: string): string {
    const s = status?.toLowerCase().replace(/_/g, "-") || "pending"
    if (s.includes("transit")) return "in-transit"
    if (s.includes("deliver")) return "delivered"
    if (s.includes("delay")) return "delayed"
    if (s.includes("shelter")) return "delayed"
    if (s.includes("pend")) return "pending"
    if (s.includes("queue")) return "pending"
    return s
}

interface TelemetryViewProps {
    shipments: ApiShipment[]
    hubs: Hub[]
}

export function TelemetryView({ shipments, hubs }: TelemetryViewProps) {
    const analytics = useMemo(() => {
        const total = shipments.length
        const transitShipments = shipments.filter(s => s.status === "TRANSIT")
        const shelteringShipments = shipments.filter(s => s.status === "SHELTERING")
        const deliveredShipments = shipments.filter(s => s.status === "DELIVERED")
        const delayedShipments = shipments.filter(s => s.status === "DELAYED")
        const pendingShipments = shipments.filter(s => s.status === "IN_QUEUE")

        // Fleet Velocity — avg progress of TRANSIT shipments
        const avgVelocity = transitShipments.length > 0
            ? Math.round(transitShipments.reduce((acc, s) => acc + (s.progressPercent || 0), 0) / transitShipments.length)
            : 0

        // Overall average progress
        const avgProgress = total > 0
            ? Math.round(shipments.reduce((acc, s) => acc + (s.progressPercent || 0), 0) / total)
            : 0

        // Delivery rate
        const deliveryRate = total > 0 ? ((deliveredShipments.length / total) * 100).toFixed(1) : "0"

        // Most Congested Ports — by destination hub (current ship destinations)
        const destCongestion = new Map<string, number>()
        shipments.forEach(s => {
            if (s.destinationHub) {
                destCongestion.set(s.destinationHub, (destCongestion.get(s.destinationHub) || 0) + 1)
            }
        })
        const congestedPorts = Array.from(destCongestion.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)

        // Active Trade Routes — top route pairs
        const routeMap = new Map<string, number>()
        shipments.forEach(s => {
            if (s.currentHub && s.destinationHub) {
                const key = `${s.currentHub} → ${s.destinationHub}`
                routeMap.set(key, (routeMap.get(key) || 0) + 1)
            }
        })
        const activeRoutes = Array.from(routeMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)

        // Unique ships/vessels in service
        const uniqueShips = new Set(shipments.filter(s => s.shipName).map(s => s.shipName)).size

        return {
            total,
            transit: transitShipments.length,
            delivered: deliveredShipments.length,
            delayed: delayedShipments.length,
            pending: pendingShipments.length,
            sheltering: shelteringShipments.length,
            avgVelocity,
            avgProgress,
            deliveryRate,
            congestedPorts,
            activeRoutes,
            uniqueShips,
        }
    }, [shipments])

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        <Radar className="w-7 h-7 text-cyan-400" />
                        Telemetry & Intelligence
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">Real-time fleet analytics, port congestion, and trade route intelligence</p>
                </div>
                <div className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-3 py-1.5">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">Live Feed</span>
                </div>
            </div>

            {/* Key Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <MetricTile icon={Container} label="Total Cargo" value={analytics.total} color="cyan" />
                <MetricTile icon={Ship} label="Underway" value={analytics.transit} color="blue" />
                <MetricTile icon={Anchor} label="Delivered" value={analytics.delivered} color="emerald" />
                <MetricTile icon={Clock} label="Queued" value={analytics.pending} color="slate" />
                <MetricTile icon={AlertTriangle} label="Delayed" value={analytics.delayed} color="red" />
                <MetricTile icon={Navigation} label="Sheltering" value={analytics.sheltering} color="amber" />
            </div>

            {/* Main Intelligence Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Most Congested Ports */}
                <Card className="bg-card/80 backdrop-blur-sm border-cyan-500/10 xl:col-span-1">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Anchor className="w-5 h-5 text-amber-400" />
                            Most Congested Ports
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">Ranked by inbound vessel traffic</p>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {analytics.congestedPorts.length > 0 ? (
                            analytics.congestedPorts.map(([hubCode, count], i) => {
                                const hub = hubs.find(h => h.hubCode === hubCode)
                                const maxCount = analytics.congestedPorts[0]?.[1] || 1
                                const percent = Math.round((count / maxCount) * 100)
                                return (
                                    <div key={hubCode} className="group">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold",
                                                    i === 0 ? "bg-amber-500/20 text-amber-400" : "bg-slate-800 text-slate-400"
                                                )}>
                                                    {i + 1}
                                                </span>
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">{hub?.city || hubCode}</p>
                                                    <p className="text-[10px] text-muted-foreground">{hub?.country || "—"} · {hubCode}</p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-mono font-bold text-foreground">{count}</span>
                                        </div>
                                        <div className="h-1 bg-slate-800 rounded-full overflow-hidden ml-7">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all duration-700",
                                                    i === 0 ? "bg-amber-500" : i === 1 ? "bg-amber-500/70" : "bg-cyan-500/50"
                                                )}
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <p className="text-center py-8 text-muted-foreground text-sm">No port data available</p>
                        )}
                    </CardContent>
                </Card>

                {/* Fleet Velocity & Performance */}
                <Card className="bg-card/80 backdrop-blur-sm border-cyan-500/10 xl:col-span-1">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Gauge className="w-5 h-5 text-cyan-400" />
                            Fleet Velocity
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">Active vessel performance metrics</p>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {/* Velocity Gauge */}
                        <div className="text-center py-4">
                            <div className="relative inline-flex items-center justify-center">
                                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="42" fill="none" stroke="#1e293b" strokeWidth="8" />
                                    <circle
                                        cx="50" cy="50" r="42" fill="none"
                                        stroke="#06b6d4" strokeWidth="8" strokeLinecap="round"
                                        strokeDasharray={`${analytics.avgVelocity * 2.64} 264`}
                                        className="transition-all duration-1000"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-bold font-mono text-cyan-400">{analytics.avgVelocity}%</span>
                                    <span className="text-[10px] text-muted-foreground uppercase">Avg Speed</span>
                                </div>
                            </div>
                        </div>

                        {/* Sub-metrics */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                                <p className="text-[10px] text-muted-foreground uppercase mb-1">Active Vessels</p>
                                <p className="text-xl font-bold font-mono text-blue-400">{analytics.transit}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                                <p className="text-[10px] text-muted-foreground uppercase mb-1">Fleet Ships</p>
                                <p className="text-xl font-bold font-mono text-cyan-400">{analytics.uniqueShips}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                                <p className="text-[10px] text-muted-foreground uppercase mb-1">Delivery Rate</p>
                                <p className="text-xl font-bold font-mono text-emerald-400">{analytics.deliveryRate}%</p>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                                <p className="text-[10px] text-muted-foreground uppercase mb-1">Avg Progress</p>
                                <p className="text-xl font-bold font-mono text-foreground">{analytics.avgProgress}%</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Active Trade Routes */}
                <Card className="bg-card/80 backdrop-blur-sm border-cyan-500/10 xl:col-span-1">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Navigation className="w-5 h-5 text-blue-400" />
                            Active Trade Routes
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">High-frequency shipping corridors</p>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {analytics.activeRoutes.length > 0 ? (
                            analytics.activeRoutes.map(([route, count], i) => {
                                const maxCount = analytics.activeRoutes[0]?.[1] || 1
                                const percent = Math.round((count / maxCount) * 100)
                                return (
                                    <div key={route} className="p-2.5 rounded-lg bg-slate-800/30 border border-slate-700/30 hover:border-cyan-500/20 transition-colors">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-muted-foreground">#{i + 1}</span>
                                                <span className="text-sm font-medium text-foreground">{route}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-sm font-bold font-mono text-cyan-400">{count}</span>
                                                <Ship className="w-3 h-3 text-muted-foreground" />
                                            </div>
                                        </div>
                                        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-700"
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <p className="text-center py-8 text-muted-foreground text-sm">No route data available</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Status Distribution & Insights */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Status Distribution */}
                <Card className="bg-card/80 backdrop-blur-sm border-cyan-500/10">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Activity className="w-5 h-5 text-cyan-400" />
                            Status Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <StatusBar label="Underway" count={analytics.transit} total={analytics.total} color="bg-blue-500" icon={Ship} />
                        <StatusBar label="Delivered" count={analytics.delivered} total={analytics.total} color="bg-emerald-500" icon={CheckCircle} />
                        <StatusBar label="Queued" count={analytics.pending} total={analytics.total} color="bg-slate-500" icon={Clock} />
                        <StatusBar label="Delayed" count={analytics.delayed} total={analytics.total} color="bg-red-500" icon={AlertTriangle} />
                        <StatusBar label="Sheltering" count={analytics.sheltering} total={analytics.total} color="bg-amber-500" icon={Navigation} />
                    </CardContent>
                </Card>

                {/* Performance Insights */}
                <Card className="bg-card/80 backdrop-blur-sm border-cyan-500/10">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-emerald-400" />
                            Intelligence Brief
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="p-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5">
                            <h4 className="text-sm font-semibold text-cyan-400 mb-1 flex items-center gap-2">
                                <Radar className="w-4 h-4" />
                                Network Efficiency
                            </h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Fleet operating at <span className="text-cyan-400 font-mono font-bold">{analytics.avgVelocity}%</span> average velocity
                                with <span className="text-cyan-400 font-mono font-bold">{analytics.activeRoutes.length}</span> active trade corridors.
                                {analytics.congestedPorts[0] && (
                                    <> Top congestion at <span className="text-amber-400 font-bold">{analytics.congestedPorts[0][0]}</span> port.</>
                                )}
                            </p>
                        </div>
                        <div className="p-4 rounded-lg border border-amber-500/20 bg-amber-500/5">
                            <h4 className="text-sm font-semibold text-amber-400 mb-1 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Risk Assessment
                            </h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                <span className="text-amber-400 font-mono font-bold">{analytics.delayed + analytics.sheltering}</span> vessels impacted
                                ({analytics.delayed} delayed, {analytics.sheltering} sheltering from storms).
                                On-time delivery rate: <span className="text-emerald-400 font-mono font-bold">{analytics.deliveryRate}%</span>.
                            </p>
                        </div>
                        <div className="p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                            <h4 className="text-sm font-semibold text-emerald-400 mb-1 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Delivery Summary
                            </h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                <span className="text-emerald-400 font-mono font-bold">{analytics.delivered}</span> of {analytics.total} shipments
                                successfully delivered. {analytics.uniqueShips > 0 && (
                                    <><span className="text-blue-400 font-mono font-bold">{analytics.uniqueShips}</span> unique vessels in fleet rotation.</>
                                )}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function MetricTile({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
    const colorMap: Record<string, string> = {
        cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
        blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
        emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
        red: "text-red-400 bg-red-500/10 border-red-500/20",
        slate: "text-slate-400 bg-slate-500/10 border-slate-500/20",
    }
    const colorClasses = colorMap[color] || colorMap.cyan
    return (
        <div className={cn("p-3 rounded-lg border backdrop-blur-sm", colorClasses)}>
            <Icon className={cn("w-4 h-4 mb-2", colorClasses.split(" ")[0])} />
            <p className="text-2xl font-bold font-mono text-foreground">{value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        </div>
    )
}

function StatusBar({ label, count, total, color, icon: Icon }: any) {
    const percent = total > 0 ? Math.round((count / total) * 100) : 0
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground font-medium">{label}</span>
                </div>
                <span className="text-muted-foreground font-mono text-xs">{count} ({percent}%)</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                    className={cn("h-full rounded-full transition-all duration-700", color)}
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    )
}
