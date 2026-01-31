"use client"

import React, { useState, useMemo } from "react"
import { Package, Truck, CheckCircle, Clock, AlertCircle, ChevronRight, Search, Filter, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { type ApiShipment } from "./dashboard-content"

// Map Java Backend Statuses to UI Labels and Colors
const statusConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  "TRANSIT": {
    label: "In Transit",
    icon: Truck,
    className: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  },
  "DELIVERED": {
    label: "Delivered",
    icon: CheckCircle,
    className: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  },
  "IN_QUEUE": {
    label: "Pending",
    icon: Clock,
    className: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  },
  "DELAYED": {
    label: "Delayed",
    icon: AlertCircle,
    className: "bg-red-500/15 text-red-500 border-red-500/30",
  },
}

interface ShipmentsListProps {
  apiShipments: ApiShipment[]
  onShipmentClick: (shipment: any) => void
  filterStatus?: string | null
}

export function ShipmentsList({ apiShipments = [], onShipmentClick, filterStatus }: ShipmentsListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])

  // Update internal filter if external filter (from StatsCards) changes
  React.useEffect(() => {
    if (filterStatus) {
      setSelectedStatuses([filterStatus.toUpperCase()])
    } else {
      setSelectedStatuses([])
    }
  }, [filterStatus])

  // Filter the live data from Java
  const filteredShipments = useMemo(() => {
    if (!Array.isArray(apiShipments)) return [];
    return apiShipments.filter((s) => {
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch = searchQuery === "" ||
        s.shipmentId.toLowerCase().includes(searchLower) ||
        s.label.toLowerCase().includes(searchLower) ||
        (s.consumerName && s.consumerName.toLowerCase().includes(searchLower))

      const matchesStatus = selectedStatuses.length === 0 ||
        selectedStatuses.includes(s.status)

      return matchesSearch && matchesStatus
    })
  }, [apiShipments, searchQuery, selectedStatuses])

  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    )
  }

  return (
    <Card className="h-full flex flex-col border-slate-800 bg-slate-950/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-white">Live Logistics Ledger</CardTitle>
            <p className="text-xs text-slate-500 font-mono mt-1">REAL-TIME DATA STREAM ACTIVE</p>
          </div>
          <span className="text-xs font-mono bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20">
            {apiShipments ? filteredShipments.length : 0} Active
          </span>
        </div>
        
        <div className="flex items-center gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search by ID, Cargo or Customer..."
              className="pl-9 bg-slate-900 border-slate-800 text-slate-200 placeholder:text-slate-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className={cn("border-slate-800 bg-slate-900 hover:bg-slate-800", showFilters && "border-blue-500")}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 text-slate-400" />
          </Button>
        </div>

        {showFilters && (
          <div className="mt-3 p-3 rounded-lg bg-slate-900/80 border border-slate-800 animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase">System Filters</p>
              <button onClick={() => setSelectedStatuses([])} className="text-[10px] text-blue-400 hover:underline">Clear</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.keys(statusConfig).map((status) => (
                <button
                  key={status}
                  onClick={() => toggleStatus(status)}
                  className={cn(
                    "px-2.5 py-1 text-[10px] font-bold rounded-md border transition-all",
                    selectedStatuses.includes(status) 
                      ? "bg-blue-600 border-blue-400 text-white" 
                      : "bg-slate-800 border-slate-700 text-slate-400"
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-auto px-4 pb-4">
        {filteredShipments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 opacity-50">
            <Package className="w-10 h-10 mb-2" />
            <p className="text-sm font-mono">No Shipments Found in Current Radius</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredShipments.map((s) => (
              <ShipmentRow
                key={s.shipmentId}
                shipment={s}
                onClick={() => onShipmentClick(s)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ShipmentRow({ shipment, onClick }: { shipment: ApiShipment; onClick: () => void }) {
  const config = statusConfig[shipment.status] || statusConfig["IN_QUEUE"]
  const StatusIcon = config.icon

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-xl bg-slate-900/40 border border-slate-800/50 hover:border-blue-500/50 hover:bg-slate-900/80 transition-all group relative overflow-hidden"
    >
      {/* Background Progress Glow */}
      <div 
        className="absolute bottom-0 left-0 h-[2px] bg-blue-500/50 transition-all duration-1000"
        style={{ width: `${shipment.progressPercent}%` }}
      />

      <div className="flex justify-between items-start">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
             <Package className="w-5 h-5 text-slate-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-slate-500">#{shipment.shipmentId.substring(0, 8)}</span>
              <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase flex items-center gap-1", config.className)}>
                <StatusIcon className="w-2.5 h-2.5" />
                {config.label}
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-200 truncate">{shipment.label}</h4>
            <p className="text-xs text-slate-500 mt-1">
              {shipment.currentHub} <span className="text-blue-500 mx-1">→</span> {shipment.destinationHub}
            </p>
          </div>
        </div>
        
        <div className="text-right flex flex-col items-end">
          <p className="text-[10px] text-slate-500 uppercase font-bold">Progress</p>
          <p className="text-sm font-mono text-blue-400">{shipment.progressPercent}%</p>
          <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-blue-500 transition-colors mt-2" />
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="mt-3 pt-3 border-t border-slate-800/50 flex justify-between items-center">
        <span className="text-[10px] text-slate-500 truncate max-w-[150px]">
          Recipient: <span className="text-slate-300 font-medium">{shipment.consumerName}</span>
        </span>
        <span className="text-[10px] font-mono text-slate-600 italic">
          v21.0_Engine_Stable
        </span>
      </div>
    </button>
  )
}
