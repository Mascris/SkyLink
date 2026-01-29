"use client"

import React, { useState, useMemo } from "react"
import { Package, Truck, CheckCircle, Clock, AlertCircle, ChevronRight, Search, Filter, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

import { fetchActiveShipments, type Shipment as ApiShipment } from "@/lib/api"

type ShipmentStatus = "in-transit" | "delivered" | "pending" | "delayed"

export interface Shipment {
  id: string
  origin: string
  destination: string
  status: ShipmentStatus
  eta: string
  carrier: string
  weight: string
}



const statusConfig: Record<ShipmentStatus, { label: string; icon: React.ElementType; className: string }> = {
  "in-transit": {
    label: "In Transit",
    icon: Truck,
    className: "bg-info/15 text-info border-info/30",
  },
  delivered: {
    label: "Delivered",
    icon: CheckCircle,
    className: "bg-success/15 text-success border-success/30",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-warning/15 text-warning border-warning/30",
  },
  delayed: {
    label: "Delayed",
    icon: AlertCircle,
    className: "bg-destructive/15 text-destructive border-destructive/30",
  },
}

const statusOptions: ShipmentStatus[] = ["in-transit", "delivered", "pending", "delayed"]

interface ShipmentsListProps {
  onShipmentClick: (shipment: Shipment) => void
  filterStatus?: ShipmentStatus | null
}

export function ShipmentsList({ onShipmentClick, filterStatus }: ShipmentsListProps) {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedStatuses, setSelectedStatuses] = useState<ShipmentStatus[]>(
    filterStatus ? [filterStatus] : []
  )

  React.useEffect(() => {
    const loadShipments = async () => {
      try {
        const data = await fetchActiveShipments()
        const mappedShipments: Shipment[] = data.map((s: ApiShipment) => ({
          id: s.shipmentId,
          origin: s.currentHub, // Using currentHub as origin for now as per data availability
          destination: s.destinationHub,
          status: s.status.toLowerCase() as ShipmentStatus,
          eta: new Date(s.createdAt).toLocaleDateString(), // Placeholder for ETA
          carrier: "SkyLink Logistics", // Placeholder
          weight: "N/A", // Placeholder
        }))
        setShipments(mappedShipments)
        setLoading(false)
      } catch (err) {
        setError("Failed to load shipments")
        setLoading(false)
      }
    }
    loadShipments()
  }, [])

  // Update filter when external filterStatus changes
  React.useEffect(() => {
    if (filterStatus) {
      setSelectedStatuses([filterStatus])
    }
  }, [filterStatus])

  const filteredShipments = useMemo(() => {
    return shipments.filter((shipment) => {
      // Search filter
      const matchesSearch = searchQuery === "" ||
        shipment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shipment.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shipment.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shipment.carrier.toLowerCase().includes(searchQuery.toLowerCase())

      // Status filter
      const matchesStatus = selectedStatuses.length === 0 ||
        selectedStatuses.includes(shipment.status)

      return matchesSearch && matchesStatus
    })
  }, [searchQuery, selectedStatuses])

  const toggleStatus = (status: ShipmentStatus) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    )
  }

  const clearFilters = () => {
    setSelectedStatuses([])
    setSearchQuery("")
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Active Shipments</CardTitle>
          <span className="text-sm text-muted-foreground">
            {loading ? "Loading..." : `${filteredShipments.length} of ${shipments.length}`}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search shipments..."
              className="pl-9 bg-secondary border-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "shrink-0 bg-transparent",
              showFilters && "bg-secondary"
            )}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
            <span className="sr-only">Filter shipments</span>
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-3 p-3 rounded-lg bg-secondary/50 border border-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground">Filter by Status</p>
              {selectedStatuses.length > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-primary hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((status) => {
                const config = statusConfig[status]
                const isSelected = selectedStatuses.includes(status)
                return (
                  <button
                    key={status}
                    onClick={() => toggleStatus(status)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border transition-colors",
                      isSelected ? config.className : "border-border text-muted-foreground hover:border-muted-foreground"
                    )}
                  >
                    {config.label}
                    {isSelected && <X className="w-3 h-3" />}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 overflow-auto px-4 pb-4">
        {filteredShipments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <Package className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No shipments found</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Try adjusting your search or filters</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 bg-transparent"
              onClick={clearFilters}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredShipments.map((shipment) => (
              <ShipmentCard
                key={shipment.id}
                shipment={shipment}
                onClick={() => onShipmentClick(shipment)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface ShipmentCardProps {
  shipment: Shipment
  onClick: () => void
}

function ShipmentCard({ shipment, onClick }: ShipmentCardProps) {
  const config = statusConfig[shipment.status]
  const StatusIcon = config.icon

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-lg bg-secondary/50 border border-border hover:bg-secondary hover:border-border/80 transition-all group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted shrink-0">
            <Package className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-foreground">{shipment.id}</span>
              <span className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border",
                config.className
              )}>
                <StatusIcon className="w-3 h-3" />
                {config.label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 truncate">
              {shipment.origin} → {shipment.destination}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span>{shipment.carrier}</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
              <span>{shipment.weight}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">ETA</p>
            <p className="text-sm font-medium text-foreground">{shipment.eta}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </button>
  )
}
