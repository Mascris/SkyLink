"use client"

import { X, Package, Truck, MapPin, Calendar, Weight, User, Phone, Mail, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ShipmentStatus = "in-transit" | "delivered" | "pending" | "delayed"

export interface ShipmentDetail {
  id: string
  origin: string
  destination: string
  status: ShipmentStatus
  eta: string
  carrier: string
  weight: string
  customer?: string
  phone?: string
  email?: string
  trackingHistory?: { date: string; location: string; status: string }[]
}

interface ShipmentModalProps {
  shipment: ShipmentDetail | null
  onClose: () => void
}

const statusConfig: Record<ShipmentStatus, { label: string; className: string }> = {
  "in-transit": {
    label: "In Transit",
    className: "bg-info/15 text-info border-info/30",
  },
  delivered: {
    label: "Delivered",
    className: "bg-success/15 text-success border-success/30",
  },
  pending: {
    label: "Pending",
    className: "bg-warning/15 text-warning border-warning/30",
  },
  delayed: {
    label: "Delayed",
    className: "bg-destructive/15 text-destructive border-destructive/30",
  },
}

export function ShipmentModal({ shipment, onClose }: ShipmentModalProps) {
  if (!shipment) return null

  const config = statusConfig[shipment.status]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/15">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{shipment.id}</h2>
              <span className={cn(
                "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border mt-1",
                config.className
              )}>
                {config.label}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Route */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Origin</p>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{shipment.origin}</span>
              </div>
            </div>
            <div className="flex items-center justify-center w-8">
              <div className="w-full h-px bg-border relative">
                <Truck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground bg-card" />
              </div>
            </div>
            <div className="flex-1 text-right">
              <p className="text-xs text-muted-foreground mb-1">Destination</p>
              <div className="flex items-center justify-end gap-2">
                <span className="text-sm font-medium text-foreground">{shipment.destination}</span>
                <MapPin className="w-4 h-4 text-success" />
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-xs">ETA</span>
              </div>
              <p className="text-sm font-medium text-foreground">{shipment.eta}</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Truck className="w-3.5 h-3.5" />
                <span className="text-xs">Carrier</span>
              </div>
              <p className="text-sm font-medium text-foreground">{shipment.carrier}</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Weight className="w-3.5 h-3.5" />
                <span className="text-xs">Weight</span>
              </div>
              <p className="text-sm font-medium text-foreground">{shipment.weight}</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <User className="w-3.5 h-3.5" />
                <span className="text-xs">Customer</span>
              </div>
              <p className="text-sm font-medium text-foreground">{shipment.customer || "Acme Corp"}</p>
            </div>
          </div>

          {/* Contact */}
          <div className="p-4 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground mb-3">Customer Contact</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-foreground">{shipment.phone || "+1 (555) 123-4567"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-foreground">{shipment.email || "contact@acme.com"}</span>
              </div>
            </div>
          </div>

          {/* Tracking History */}
          <div>
            <p className="text-xs text-muted-foreground mb-3">Tracking History</p>
            <div className="space-y-3">
              {(shipment.trackingHistory || [
                { date: "Jan 19, 2026 - 14:30", location: "In Transit - Pacific Ocean", status: "On schedule" },
                { date: "Jan 17, 2026 - 08:00", location: "Departed Shanghai Port", status: "Cleared customs" },
                { date: "Jan 15, 2026 - 16:45", location: "Shanghai Warehouse", status: "Loaded to vessel" },
              ]).map((event, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      index === 0 ? "bg-primary" : "bg-muted-foreground/30"
                    )} />
                    {index < 2 && <div className="w-px h-full bg-border" />}
                  </div>
                  <div className="pb-3">
                    <p className="text-xs text-muted-foreground">{event.date}</p>
                    <p className="text-sm font-medium text-foreground">{event.location}</p>
                    <p className="text-xs text-muted-foreground">{event.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border bg-secondary/30">
          <Button variant="outline" onClick={onClose} className="bg-transparent">
            Close
          </Button>
          <Button className="gap-2">
            <ExternalLink className="w-4 h-4" />
            Full Tracking
          </Button>
        </div>
      </div>
    </div>
  )
}
