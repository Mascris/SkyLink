import { useState, useMemo } from "react"
import {
  Search,
  MapPin,
  Package,
  Clock,
  CheckCircle2,
  Circle,
  Ship,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { type Shipment as ApiShipment, type Hub } from "@/lib/api"

interface TrackedShipment {
  id: string
  trackingNumber: string
  origin: string
  destination: string
  status: string
  carrier: string
  eta: string
  progress: number
}

function normalizeStatus(status: string): string {
  const s = status?.toLowerCase().replace(/_/g, "-") || "pending"
  if (s.includes("transit")) return "in-transit"
  if (s.includes("deliver")) return "delivered"
  if (s.includes("delay")) return "delayed"
  if (s.includes("pend")) return "pending"
  if (s.includes("queue")) return "pending"
  return s
}

const statusColors: Record<string, string> = {
  "in-transit": "bg-blue-500/20 text-blue-400",
  delivered: "bg-emerald-500/20 text-emerald-400",
  pending: "bg-amber-500/20 text-amber-400",
  delayed: "bg-red-500/20 text-red-400",
}

interface TrackingViewProps {
  shipments: ApiShipment[]
  hubs: Hub[]
}

export function TrackingView({ shipments: apiShipments, hubs }: TrackingViewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [originFilter, setOriginFilter] = useState<string>("all")
  const [destFilter, setDestFilter] = useState<string>("all")
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  const trackedShipments = useMemo(() => {
    return apiShipments.map((s) => ({
      id: s.shipmentId,
      trackingNumber: s.label,
      origin: s.currentHub || "N/A",
      destination: s.destinationHub || "N/A",
      status: normalizeStatus(s.status),
      carrier: "SkyLink Logistics",
      eta: s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "N/A",
      progress: s.progressPercent || 0,
    }))
  }, [apiShipments])

  const filteredShipments = useMemo(() => {
    return trackedShipments.filter((s) => {
      const matchesSearch =
        s.trackingNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.origin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.destination?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesOrigin = originFilter === "all" || s.origin === originFilter
      const matchesDest = destFilter === "all" || s.destination === destFilter

      return matchesSearch && matchesOrigin && matchesDest
    })
  }, [trackedShipments, searchQuery, originFilter, destFilter])

  const selectedShipment = useMemo(() => {
    if (selectedShipmentId) {
      return filteredShipments.find(s => s.id === selectedShipmentId) || filteredShipments[0]
    }
    return filteredShipments[0]
  }, [selectedShipmentId, filteredShipments])

  const totalPages = Math.ceil(filteredShipments.length / itemsPerPage)
  const paginatedShipments = filteredShipments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSearch = () => {
    const found = filteredShipments.find(
      (s) =>
        s.trackingNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.id.includes(searchQuery)
    )
    if (found) {
      setSelectedShipmentId(found.id)
    }
  }

  // Pagination helper
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i)
        pages.push("...")
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 3) {
        pages.push(1)
        pages.push("...")
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push("...")
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push("...")
        pages.push(totalPages)
      }
    }
    return pages
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Shipment Tracking</h1>
        <p className="text-muted-foreground">Track your shipments in real-time</p>
      </div>

      {/* Search & Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Enter tracking number..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-12 h-12 text-base bg-input border-border"
                />
              </div>
              <Button onClick={handleSearch} className="h-12 px-8">
                Track Shipment
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="w-4 h-4" />
                <span>Filters:</span>
              </div>

              <div className="w-48">
                <Select value={originFilter} onValueChange={(val) => { setOriginFilter(val); setCurrentPage(1); }}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Origin Hub" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Origins</SelectItem>
                    {hubs.map(hub => (
                      <SelectItem key={`origin-${hub.hubCode}`} value={hub.hubCode}>
                        {hub.city} ({hub.hubCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-48">
                <Select value={destFilter} onValueChange={(val) => { setDestFilter(val); setCurrentPage(1); }}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Destination Hub" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Destinations</SelectItem>
                    {hubs.map(hub => (
                      <SelectItem key={`dest-${hub.hubCode}`} value={hub.hubCode}>
                        {hub.city} ({hub.hubCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(originFilter !== "all" || destFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setOriginFilter("all"); setDestFilter("all"); }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shipment List with Pagination */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-foreground">Shipments ({filteredShipments.length})</h2>
          </div>

          <div className="space-y-3">
            {paginatedShipments.map((shipment) => (
              <Card
                key={shipment.id}
                className={cn(
                  "bg-card border-border cursor-pointer transition-all hover:border-primary/50",
                  selectedShipment?.id === shipment.id && "border-primary"
                )}
                onClick={() => setSelectedShipmentId(shipment.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Ship className="w-4 h-4 text-muted-foreground" />
                      <span className="font-mono text-sm text-foreground">{shipment.trackingNumber}</span>
                    </div>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", statusColors[shipment.status] || "bg-gray-500/20 text-gray-400")}>
                      {shipment.status.replace("-", " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="truncate">{shipment.origin}</span>
                    <ArrowRight className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{shipment.destination}</span>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="text-foreground">{shipment.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${shipment.progress}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredShipments.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No shipments found matching your filters.
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 pt-4">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {getPageNumbers().map((page, index) => (
                typeof page === "number" ? (
                  <Button
                    key={index}
                    variant={currentPage === page ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ) : (
                  <span key={index} className="px-1 text-muted-foreground">...</span>
                )
              ))}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Tracking Details */}
        <div className="lg:col-span-2">
          {selectedShipment ? (
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl font-mono">{selectedShipment.trackingNumber}</CardTitle>
                    <p className="text-muted-foreground mt-1">{selectedShipment.carrier}</p>
                  </div>
                  <span className={cn("px-3 py-1 rounded-full text-sm font-medium w-fit", statusColors[selectedShipment.status] || "bg-gray-500/20 text-gray-400")}>
                    {selectedShipment.status.replace("-", " ")}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Route Info */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Origin</p>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="text-foreground font-medium">{selectedShipment.origin}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground hidden sm:block" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Destination</p>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-400" />
                      <span className="text-foreground font-medium">{selectedShipment.destination}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">ETA</p>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground font-medium">{selectedShipment.eta}</span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Shipment Progress</span>
                    <span className="text-foreground font-medium">{selectedShipment.progress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${selectedShipment.progress}%` }}
                    />
                  </div>
                </div>

                {/* Timeline Placeholder */}
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-4">Tracking History</h3>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                        <div className="w-0.5 flex-1 mt-2 bg-primary" />
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium text-foreground">Shipment Created</p>
                        <p className="text-sm text-muted-foreground">{selectedShipment.origin}</p>
                        <p className="text-xs text-muted-foreground mt-1">{selectedShipment.eta}</p>
                      </div>
                    </div>
                    {selectedShipment.progress >= 50 && (
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                          <div className="w-0.5 flex-1 mt-2 bg-muted" />
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="font-medium text-foreground">In Transit</p>
                          <p className="text-sm text-muted-foreground">On the way to destination</p>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <Circle className={cn("w-5 h-5", selectedShipment.progress >= 100 ? "text-primary" : "text-muted-foreground")} />
                      </div>
                      <div className="flex-1">
                        <p className={cn("font-medium", selectedShipment.progress >= 100 ? "text-foreground" : "text-muted-foreground")}>
                          Delivery
                        </p>
                        <p className="text-sm text-muted-foreground">{selectedShipment.destination}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border h-full flex items-center justify-center">
              <CardContent className="text-center py-12">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a shipment to see details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
