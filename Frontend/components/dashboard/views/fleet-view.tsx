import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Truck, Package, MapPin } from "lucide-react"
import { type Shipment } from "@/lib/api"

// Helper to normalize status values from DB
function normalizeStatus(status: string): string {
  const s = status?.toLowerCase().replace(/_/g, "-") || "pending"
  if (s.includes("transit")) return "in-transit"
  if (s.includes("deliver")) return "delivered"
  if (s.includes("delay")) return "delayed"
  if (s.includes("pend")) return "pending"
  if (s.includes("queue")) return "pending"
  return s
}

interface FleetViewProps {
  shipments: Shipment[]
}

export function FleetView({ shipments }: FleetViewProps) {
  const stats = useMemo(() => {
    const locations = new Set<string>()
    shipments.forEach((s: Shipment) => {
      if (s.currentHub) locations.add(s.currentHub)
      if (s.destinationHub) locations.add(s.destinationHub)
    })
    return {
      total: shipments.length,
      inTransit: shipments.filter((s: Shipment) => normalizeStatus(s.status) === "in-transit").length,
      delivered: shipments.filter((s: Shipment) => normalizeStatus(s.status) === "delivered").length,
      locations,
    }
  }, [shipments])

  const recentShipments = useMemo(() => shipments.slice(0, 10), [shipments])

  const statusColors: Record<string, string> = {
    "in-transit": "bg-blue-500/20 text-blue-400",
    "delivered": "bg-emerald-500/20 text-emerald-400",
    "pending": "bg-amber-500/20 text-amber-400",
    "delayed": "bg-red-500/20 text-red-400",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Fleet Overview</h1>
        <p className="text-muted-foreground">Track your shipment fleet in real-time</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">
                  {stats.total}
                </p>
                <p className="text-sm text-muted-foreground">Total Shipments</p>
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
                  {stats.inTransit}
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
                <Package className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">
                  {stats.delivered}
                </p>
                <p className="text-sm text-muted-foreground">Delivered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <MapPin className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">
                  {stats.locations.size}
                </p>
                <p className="text-sm text-muted-foreground">Unique Locations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Shipments */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Recent Shipments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentShipments.map((shipment) => {
              const normalized = normalizeStatus(shipment.status)
              return (
                <div
                  key={shipment.shipmentId}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Truck className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">{shipment.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {shipment.currentHub} → {shipment.destinationHub}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[normalized] || "bg-gray-500/20 text-gray-400"
                    }`}>
                    {normalized.replace("-", " ")}
                  </span>
                </div>
              )
            })}
            {recentShipments.length === 0 && (
              <p className="text-center py-4 text-muted-foreground">No shipments found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
