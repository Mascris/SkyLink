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
  CheckCircle,
  Anchor,
  Shield,
  Navigation,
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
  rawStatus: string
  carrier: string
  eta: string
  progress: number
  estimatedArrival?: string
}

function normalizeStatus(status: string): string {
  const s = status?.toLowerCase().replace(/_/g, "-") || "pending"
  if (s.includes("transit")) return "in-transit"
  if (s.includes("deliver")) return "delivered"
  if (s.includes("delay")) return "delayed"
  if (s.includes("shelter")) return "sheltering"
  if (s.includes("pend")) return "pending"
  if (s.includes("queue")) return "pending"
  return s
}

const statusColors: Record<string, string> = {
  "in-transit": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  delivered: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  pending: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  delayed: "bg-red-500/20 text-red-400 border-red-500/30",
  sheltering: "bg-amber-500/20 text-amber-400 border-amber-500/30",
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
      rawStatus: s.status,
      carrier: "SkyLink Logistics",
      eta: s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "N/A",
      progress: s.progressPercent || 0,
      estimatedArrival: s.estimatedArrival,
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

  // Check if the selected shipment is delivered
  const isDelivered = selectedShipment?.status === "delivered"

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Navigation className="w-7 h-7 text-cyan-400" />
            Vessel Tracking
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Track your cargo across global shipping lanes</p>
        </div>
      </div>

      {/* Search & Filters */}
      <Card className="bg-card/80 backdrop-blur-sm border-cyan-500/10">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Enter tracking number or port code..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-12 h-12 text-base bg-slate-800/50 border-slate-700 focus:ring-cyan-500/50 focus:border-cyan-500/50 font-mono"
                />
              </div>
              <Button onClick={handleSearch} className="h-12 px-8 bg-cyan-600 hover:bg-cyan-500">
                <Ship className="w-4 h-4 mr-2" />
                Track Vessel
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-700/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="w-4 h-4 text-cyan-400" />
                <span className="text-xs uppercase tracking-wider font-semibold">Filters:</span>
              </div>

              <div className="w-48">
                <Select value={originFilter} onValueChange={(val) => { setOriginFilter(val); setCurrentPage(1); }}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700">
                    <SelectValue placeholder="Origin Port" />
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
                  <SelectTrigger className="bg-slate-800/50 border-slate-700">
                    <SelectValue placeholder="Destination Port" />
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
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Manifests ({filteredShipments.length})
            </h2>
          </div>

          <div className="space-y-3">
            {paginatedShipments.map((shipment) => (
              <Card
                key={shipment.id}
                className={cn(
                  "bg-card/80 backdrop-blur-sm cursor-pointer transition-all hover:border-cyan-500/30",
                  selectedShipment?.id === shipment.id ? "border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.1)]" : "border-slate-700/50"
                )}
                onClick={() => setSelectedShipmentId(shipment.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Ship className="w-4 h-4 text-cyan-400" />
                      <span className="font-mono text-sm text-foreground">{shipment.trackingNumber}</span>
                    </div>
                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase border", statusColors[shipment.status] || "bg-gray-500/20 text-gray-400")}>
                      {shipment.status.replace("-", " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="truncate">{shipment.origin}</span>
                    <ArrowRight className="w-3 h-3 flex-shrink-0 text-cyan-500" />
                    <span className="truncate">{shipment.destination}</span>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="text-foreground font-mono">{shipment.status === "delivered" ? "100" : shipment.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          shipment.status === "delivered" ? "bg-emerald-500" : "bg-cyan-500"
                        )}
                        style={{ width: `${shipment.status === "delivered" ? 100 : shipment.progress}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredShipments.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No vessels found matching your filters.
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 pt-4">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 border-slate-700 bg-slate-800/50"
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
                    className={cn(
                      "h-8 w-8",
                      currentPage === page ? "bg-cyan-600 border-cyan-500" : "border-slate-700 bg-slate-800/50"
                    )}
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
                className="h-8 w-8 border-slate-700 bg-slate-800/50"
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
            isDelivered ? (
              /* ═══════════════════════════════════════════════════════════════
                 DELIVERED — "Delivery Manifest Confirmed" Receipt UI
                 ═══════════════════════════════════════════════════════════════ */
              <Card className="bg-card/80 backdrop-blur-sm border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                <CardContent className="p-8">
                  {/* Receipt Header */}
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 mb-4">
                      <CheckCircle className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-emerald-400 mb-1">Delivery Manifest Confirmed</h2>
                    <p className="text-muted-foreground text-sm">Cargo has been successfully received at destination port</p>
                  </div>

                  {/* Receipt Body */}
                  <div className="space-y-4 max-w-md mx-auto">
                    <div className="border border-emerald-500/20 rounded-lg overflow-hidden">
                      {/* Progress — Locked at 100% */}
                      <div className="bg-emerald-500/10 px-4 py-3 border-b border-emerald-500/20">
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <span className="text-emerald-400 font-semibold">Shipment Progress</span>
                          <span className="text-emerald-400 font-bold font-mono">100%</span>
                        </div>
                        <div className="h-2 bg-emerald-900/30 rounded-full overflow-hidden">
                          <div className="h-full w-full bg-emerald-500 rounded-full" />
                        </div>
                      </div>

                      {/* Receipt details */}
                      <div className="divide-y divide-slate-700/50">
                        <ReceiptRow label="Tracking Number" value={selectedShipment.trackingNumber} mono />
                        <ReceiptRow label="Origin Port" value={selectedShipment.origin} />
                        <ReceiptRow label="Destination Port" value={selectedShipment.destination} />
                        <ReceiptRow label="Carrier" value={selectedShipment.carrier} />
                        <ReceiptRow
                          label="Touchdown Confirmed"
                          value={
                            selectedShipment.estimatedArrival
                              ? new Date(selectedShipment.estimatedArrival).toLocaleString(undefined, {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                              : selectedShipment.eta
                          }
                          highlight
                        />
                      </div>
                    </div>

                    {/* Seal */}
                    <div className="flex items-center justify-center gap-2 py-3">
                      <Shield className="w-4 h-4 text-emerald-500/50" />
                      <span className="text-[10px] font-mono text-emerald-500/50 uppercase tracking-widest">
                        Verified by SkyLink Maritime Authority
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* ═══════════════════════════════════════════════════════════════
                 NON-DELIVERED — Standard tracking detail card
                 ═══════════════════════════════════════════════════════════════ */
              <Card className="bg-card/80 backdrop-blur-sm border-cyan-500/10">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl font-mono text-cyan-400">{selectedShipment.trackingNumber}</CardTitle>
                      <p className="text-muted-foreground mt-1">{selectedShipment.carrier}</p>
                    </div>
                    <span className={cn("px-3 py-1 rounded text-sm font-bold uppercase border w-fit", statusColors[selectedShipment.status] || "bg-gray-500/20 text-gray-400")}>
                      {selectedShipment.status.replace("-", " ")}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Route Info */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/30">
                    <div className="flex-1">
                      <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Origin Port</p>
                      <div className="flex items-center gap-2">
                        <Anchor className="w-4 h-4 text-cyan-400" />
                        <span className="text-foreground font-medium">{selectedShipment.origin}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-cyan-500 hidden sm:block" />
                    <div className="flex-1">
                      <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Destination Port</p>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-400" />
                        <span className="text-foreground font-medium">{selectedShipment.destination}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">ETA</p>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span className="text-foreground font-medium font-mono">
                          {selectedShipment.estimatedArrival
                            ? new Date(selectedShipment.estimatedArrival).toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                            : selectedShipment.eta}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Shipment Progress</span>
                      <span className="text-foreground font-mono font-bold">{selectedShipment.progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
                        style={{ width: `${selectedShipment.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Timeline */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      Voyage Timeline
                    </h3>
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                          <div className="w-0.5 flex-1 mt-2 bg-cyan-500/50" />
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="font-medium text-foreground">Manifest Registered</p>
                          <p className="text-sm text-muted-foreground">{selectedShipment.origin}</p>
                          <p className="text-xs text-muted-foreground mt-1 font-mono">{selectedShipment.eta}</p>
                        </div>
                      </div>
                      {selectedShipment.progress >= 50 && (
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                            <div className="w-0.5 flex-1 mt-2 bg-slate-700" />
                          </div>
                          <div className="flex-1 pb-4">
                            <p className="font-medium text-foreground">Vessel Underway</p>
                            <p className="text-sm text-muted-foreground">En route to destination port</p>
                          </div>
                        </div>
                      )}
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <Circle className={cn("w-5 h-5", selectedShipment.progress >= 100 ? "text-cyan-400" : "text-slate-600")} />
                        </div>
                        <div className="flex-1">
                          <p className={cn("font-medium", selectedShipment.progress >= 100 ? "text-foreground" : "text-muted-foreground")}>
                            Port Arrival
                          </p>
                          <p className="text-sm text-muted-foreground">{selectedShipment.destination}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          ) : (
            <Card className="bg-card/80 backdrop-blur-sm border-cyan-500/10 h-full flex items-center justify-center">
              <CardContent className="text-center py-12">
                <Ship className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a vessel to view tracking details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function ReceiptRow({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className={cn(
        "text-sm font-medium",
        highlight ? "text-emerald-400 font-bold" : "text-foreground",
        mono && "font-mono"
      )}>
        {value}
      </span>
    </div>
  )
}
