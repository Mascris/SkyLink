"use client"

import React, { useState, useMemo } from "react"
import { Package, Truck, CheckCircle, Clock, AlertCircle, ChevronRight, Search, Filter, CloudLightning, Container } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { type ApiShipment } from "./dashboard-content"

const statusConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  "TRANSIT": { label: "Underway", icon: Truck, className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  "DELIVERED": { label: "Delivered", icon: CheckCircle, className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  "IN_QUEUE": { label: "Queued", icon: Clock, className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  "DELAYED": { label: "Delayed", icon: AlertCircle, className: "bg-red-500/15 text-red-400 border-red-500/30" },
  "SHELTERING": { label: "Storm", icon: CloudLightning, className: "bg-amber-500/15 text-amber-500 border-amber-500/30" },
}

interface ShipmentsListProps {
  apiShipments: ApiShipment[]
  onShipmentClick: (shipment: any) => void
  filterStatus?: string | null
}

const PAGE_SIZE = 8

export function ShipmentsList({ apiShipments = [], onShipmentClick, filterStatus }: ShipmentsListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)

  React.useEffect(() => {
    if (filterStatus) {
      const map: Record<string, string> = {
        "in-transit": "TRANSIT", "delivered": "DELIVERED",
        "pending": "IN_QUEUE", "delayed": "DELAYED",
      }
      setSelectedStatuses([map[filterStatus] || filterStatus.toUpperCase()])
    } else {
      setSelectedStatuses([])
    }
    setCurrentPage(1)
  }, [filterStatus])

  const filteredShipments = useMemo(() => {
    if (!Array.isArray(apiShipments)) return []
    return apiShipments.filter((s) => {
      const q = searchQuery.toLowerCase()
      const matchesSearch = !q ||
        s.shipmentId?.toLowerCase().includes(q) ||
        s.label?.toLowerCase().includes(q) ||
        s.consumerName?.toLowerCase().includes(q) ||
        s.containerId?.toLowerCase().includes(q)
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(s.status)
      return matchesSearch && matchesStatus
    })
  }, [apiShipments, searchQuery, selectedStatuses])

  const totalPages = Math.ceil(filteredShipments.length / PAGE_SIZE)
  const paginatedShipments = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredShipments.slice(start, start + PAGE_SIZE)
  }, [filteredShipments, currentPage])

  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    )
    setCurrentPage(1)
  }

  return (
    <Card className="h-full flex flex-col border-cyan-900/30 bg-[#050b14]/70 backdrop-blur-md">
      <CardHeader className="pb-3 border-b border-cyan-900/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-mono tracking-widest text-cyan-500 uppercase mb-1">Live Logistics Ledger</p>
            <CardTitle className="text-sm font-semibold text-white">Vessel Registry</CardTitle>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-mono text-cyan-500 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
              {filteredShipments.length} Active
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <Input
              placeholder="ID, Cargo, Consignee..."
              className="pl-8 h-8 text-xs bg-[#0a1628]/80 border-cyan-900/30 text-slate-200 placeholder:text-slate-600 focus:border-cyan-500/40 font-mono"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className={cn("h-8 w-8 border-cyan-900/30 bg-transparent hover:bg-cyan-500/5 hover:border-cyan-500/40", showFilters && "border-cyan-500/50 bg-cyan-500/5")}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-3.5 h-3.5 text-slate-400" />
          </Button>
        </div>

        {showFilters && (
          <div className="mt-2 p-2.5 rounded-lg bg-[#0a1628]/80 border border-cyan-900/30 animate-in slide-in-from-top-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-mono tracking-widest text-cyan-500/70 uppercase">Status Filter</p>
              <button onClick={() => { setSelectedStatuses([]); setCurrentPage(1) }} className="text-[9px] text-cyan-400 font-mono hover:underline">Clear</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(statusConfig).map((status) => (
                <button
                  key={status}
                  onClick={() => toggleStatus(status)}
                  className={cn(
                    "px-2 py-0.5 text-[9px] font-mono font-bold rounded border tracking-wider transition-all uppercase",
                    selectedStatuses.includes(status)
                      ? "bg-cyan-600/30 border-cyan-400/50 text-cyan-400"
                      : "bg-[#1e293b] border-[#334155] text-slate-500 hover:text-slate-300"
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-auto px-3 py-3">
        {paginatedShipments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 opacity-40">
            <Container className="w-8 h-8 mb-2 text-cyan-500" />
            <p className="text-xs font-mono text-slate-500 tracking-widest uppercase">No Vessels in Radius</p>
          </div>
        ) : (
          <div className="space-y-2">
            {paginatedShipments.map((s) => (
              <ShipmentRow key={s.shipmentId} shipment={s} onClick={() => onShipmentClick(s)} />
            ))}
          </div>
        )}
      </CardContent>

      {totalPages > 1 && (
        <div className="px-4 py-2.5 border-t border-cyan-900/20 flex items-center justify-between bg-[#050b14]/40">
          <p className="text-[9px] font-mono tracking-widest text-slate-600 uppercase">
            {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredShipments.length)} of {filteredShipments.length}
          </p>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" className="h-6 px-2 text-[9px] font-mono border-cyan-900/30 bg-transparent text-slate-400 hover:text-white hover:border-cyan-500/40"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>PREV</Button>
            <Button variant="outline" size="sm" className="h-6 px-2 text-[9px] font-mono border-cyan-900/30 bg-transparent text-slate-400 hover:text-white hover:border-cyan-500/40"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>NEXT</Button>
          </div>
        </div>
      )}
    </Card>
  )
}

function ShipmentRow({ shipment, onClick }: { shipment: ApiShipment; onClick: () => void }) {
  const config = statusConfig[shipment.status] || statusConfig["IN_QUEUE"]
  const StatusIcon = config.icon

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 rounded-lg border transition-all duration-200 group relative overflow-hidden",
        // Glow hover effect — Task 2
        "bg-[#0a1628]/60 border-[#1e293b]",
        "hover:bg-[#0f1e35]/80 hover:border-cyan-500/50",
        "hover:shadow-[0_0_12px_rgba(6,182,212,0.08),inset_0_0_20px_rgba(6,182,212,0.03)]",
      )}
    >
      {/* Bottom progress line */}
      <div
        className="absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-cyan-500/60 to-blue-500/40 transition-all duration-1000"
        style={{ width: `${shipment.progressPercent ?? 0}%` }}
      />

      <div className="flex justify-between items-start">
        <div className="flex gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-md bg-[#0f172a] flex items-center justify-center shrink-0 border border-[#1e293b] group-hover:border-cyan-900/50 transition-colors">
            <Package className="w-4 h-4 text-slate-500 group-hover:text-cyan-500/70 transition-colors" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              {/* Mono ID — Task 1 */}
              <span className="text-[9px] font-mono text-slate-600 tracking-widest">
                #{shipment.shipmentId?.substring(0, 8).toUpperCase()}
              </span>
              <span className={cn("px-1.5 py-px rounded text-[8px] font-bold border uppercase flex items-center gap-0.5 tracking-wider", config.className)}>
                <StatusIcon className="w-2 h-2" />
                {config.label}
              </span>
            </div>
            <h4 className="text-xs font-semibold text-slate-200 truncate max-w-[140px]">{shipment.label}</h4>
            <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
              <span className="text-slate-600">{shipment.currentHub}</span>
              <span className="text-cyan-600 mx-1">→</span>
              <span className="text-slate-400">{shipment.destinationHub}</span>
            </p>
          </div>
        </div>

        <div className="text-right flex flex-col items-end shrink-0 ml-2">
          <p className="text-[8px] font-mono tracking-widest text-slate-600 uppercase">Progress</p>
          <p className="text-sm font-mono font-bold text-cyan-400">{shipment.progressPercent ?? 0}%</p>
          <ChevronRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-cyan-500 transition-colors mt-1" />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-2.5 pt-2 border-t border-[#1e293b]/70 flex justify-between items-center">
        <div className="space-y-0.5">
          {shipment.consumerName && (
            <p className="text-[9px] text-slate-500 font-mono">
              RCPT <span className="text-slate-300">{shipment.consumerName}</span>
            </p>
          )}
          {shipment.shipName && (
            <p className="text-[9px] text-slate-500 font-mono">
              VSL <span className="text-cyan-400">{shipment.shipName}</span>
            </p>
          )}
          {shipment.estimatedArrival && (
            <p className="text-[9px] text-slate-500 font-mono">
              ETA <span className="text-emerald-400">
                {new Date(shipment.estimatedArrival).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            </p>
          )}
          {shipment.containerId && (
            <p className="text-[9px] font-mono tracking-widest text-slate-600">{shipment.containerId}</p>
          )}
        </div>
        <span className="text-[8px] font-mono text-slate-700 italic self-end">v21.0_Engine</span>
      </div>
    </button>
  )
}
