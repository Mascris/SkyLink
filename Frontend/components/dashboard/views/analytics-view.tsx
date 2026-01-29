"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Truck, CheckCircle, AlertTriangle, TrendingUp, Clock, MapPin } from "lucide-react"
import { fetchActiveShipments, type Shipment } from "@/lib/api"

// Helper to normalize status values from DB
function normalizeStatus(status: string): string {
  const s = status?.toLowerCase().replace(/_/g, "-") || "pending"
  if (s.includes("transit")) return "in-transit"
  if (s.includes("deliver")) return "delivered"
  if (s.includes("delay")) return "delayed"
  if (s.includes("pend")) return "pending"
  return s
}

export function AnalyticsView() {
  const [stats, setStats] = useState({
    total: 0,
    inTransit: 0,
    delivered: 0,
    pending: 0,
    delayed: 0,
    locations: new Map<string, number>(),
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchActiveShipments()
        const locations = new Map<string, number>()

        data.forEach((s: Shipment) => {
          if (s.currentHub) {
            locations.set(s.currentHub, (locations.get(s.currentHub) || 0) + 1)
          }
        })

        setStats({
          total: data.length,
          inTransit: data.filter((s: Shipment) => normalizeStatus(s.status) === "in-transit").length,
          delivered: data.filter((s: Shipment) => normalizeStatus(s.status) === "delivered").length,
          pending: data.filter((s: Shipment) => normalizeStatus(s.status) === "pending").length,
          delayed: data.filter((s: Shipment) => normalizeStatus(s.status) === "delayed").length,
          locations,
        })
        setLoading(false)
      } catch (err) {
        console.error("Failed to load analytics", err)
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const deliveryRate = stats.total > 0
    ? ((stats.delivered / stats.total) * 100).toFixed(1)
    : "0"

  const topLocations = Array.from(stats.locations.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
        <p className="text-muted-foreground">Shipment analytics and insights from your database</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">
                  {loading ? "..." : stats.total}
                </p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Truck className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">
                  {loading ? "..." : stats.inTransit}
                </p>
                <p className="text-sm text-muted-foreground">In Transit</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">
                  {loading ? "..." : stats.delivered}
                </p>
                <p className="text-sm text-muted-foreground">Delivered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">
                  {loading ? "..." : stats.delayed}
                </p>
                <p className="text-sm text-muted-foreground">Delayed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Delivery Rate */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Delivery Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-5xl font-bold text-emerald-400">{deliveryRate}%</p>
              <p className="text-muted-foreground mt-2">
                {stats.delivered} of {stats.total} shipments delivered
              </p>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${deliveryRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">In Transit</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${stats.total > 0 ? (stats.inTransit / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-foreground font-medium w-12 text-right">{stats.inTransit}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Delivered</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${stats.total > 0 ? (stats.delivered / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-foreground font-medium w-12 text-right">{stats.delivered}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Pending</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-foreground font-medium w-12 text-right">{stats.pending}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Delayed</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${stats.total > 0 ? (stats.delayed / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-foreground font-medium w-12 text-right">{stats.delayed}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Locations */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Top Hub Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : topLocations.length > 0 ? (
            <div className="space-y-3">
              {topLocations.map(([location, count], index) => (
                <div key={location} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                    <span className="font-medium text-foreground">{location}</span>
                  </div>
                  <span className="text-muted-foreground">{count} shipments</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No location data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
