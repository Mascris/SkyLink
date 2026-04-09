"use client"

import { useState, useMemo } from "react"
import { Search, Users, Container, Building2, MapPin, TrendingUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { type Shipment } from "@/lib/api"

interface Partner {
  name: string
  address: string
  activeInTransit: number
  totalShipments: number
  deliveredCount: number
  lastContainerId: string
  lastStatus: string
  initials: string
}

const STATUS_COLORS: Record<string, string> = {
  TRANSIT: "bg-blue-500/10 text-blue-400 border-blue-500/25",
  DELIVERED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  DELAYED: "bg-red-500/10 text-red-400 border-red-500/25",
  SHELTERING: "bg-amber-500/10 text-amber-400 border-amber-500/25",
  IN_QUEUE: "bg-slate-500/10 text-slate-400 border-slate-500/25",
}

const ACCENT_PALETTE = [
  "border-cyan-500/30 bg-cyan-500/5",
  "border-blue-500/30 bg-blue-500/5",
  "border-violet-500/30 bg-violet-500/5",
  "border-emerald-500/30 bg-emerald-500/5",
  "border-amber-500/30 bg-amber-500/5",
  "border-rose-500/30 bg-rose-500/5",
]

const ICON_PALETTE = [
  "bg-cyan-500/15 text-cyan-400",
  "bg-blue-500/15 text-blue-400",
  "bg-violet-500/15 text-violet-400",
  "bg-emerald-500/15 text-emerald-400",
  "bg-amber-500/15 text-amber-400",
  "bg-rose-500/15 text-rose-400",
]

export function CustomersView({ shipments }: { shipments: Shipment[] }) {
  const [search, setSearch] = useState("")

  const partners = useMemo(() => {
    const map = new Map<string, Partner>()
    for (const s of shipments) {
      const name = s.consumerName?.trim()
      if (!name) continue
      const existing = map.get(name)
      if (existing) {
        existing.totalShipments++
        if (s.status === "TRANSIT") existing.activeInTransit++
        if (s.status === "DELIVERED") existing.deliveredCount++
        if (!existing.lastContainerId && s.containerId) existing.lastContainerId = s.containerId
        existing.lastStatus = s.status
      } else {
        map.set(name, {
          name,
          address: s.deliveryAddress || "—",
          activeInTransit: s.status === "TRANSIT" ? 1 : 0,
          totalShipments: 1,
          deliveredCount: s.status === "DELIVERED" ? 1 : 0,
          lastContainerId: s.containerId || "—",
          lastStatus: s.status,
          initials: name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase(),
        })
      }
    }
    return Array.from(map.values()).sort((a, b) => b.totalShipments - a.totalShipments)
  }, [shipments])

  const filtered = useMemo(() => {
    if (!search) return partners
    const q = search.toLowerCase()
    return partners.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q)
    )
  }, [partners, search])

  const totalInTransit = shipments.filter(s => s.status === "TRANSIT").length

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-400" />
            Corporate Partners
          </h1>
          <p className="text-muted-foreground text-xs mt-0.5 font-mono">
            {partners.length} REGISTERED ENTITIES · {totalInTransit} ACTIVE CONTAINERS IN TRANSIT
          </p>
        </div>
        <div className="relative w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <Input
            placeholder="Search partners..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm bg-[#0f172a] border-[#1e293b] placeholder:text-slate-600 focus:border-cyan-500/40"
          />
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-[#0f172a] border border-[#1e293b] flex items-center gap-3">
          <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/20">
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-white font-mono">{partners.length}</p>
            <p className="text-[10px] text-slate-500 uppercase">Total Partners</p>
          </div>
        </div>
        <div className="p-3 rounded-lg bg-[#0f172a] border border-[#1e293b] flex items-center gap-3">
          <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20">
            <Container className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-white font-mono">{totalInTransit}</p>
            <p className="text-[10px] text-slate-500 uppercase">In Transit</p>
          </div>
        </div>
        <div className="p-3 rounded-lg bg-[#0f172a] border border-[#1e293b] flex items-center gap-3">
          <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-white font-mono">
              {shipments.filter(s => s.consumerName).length}
            </p>
            <p className="text-[10px] text-slate-500 uppercase">Total Orders</p>
          </div>
        </div>
      </div>

      {/* Corporate Identity Cards Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Building2 className="w-10 h-10 mb-3 opacity-30" />
          <p className="font-mono text-sm">No partners match your search</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((partner, i) => {
            const accent = ACCENT_PALETTE[i % ACCENT_PALETTE.length]
            const iconCls = ICON_PALETTE[i % ICON_PALETTE.length]
            const statusCls = STATUS_COLORS[partner.lastStatus] || STATUS_COLORS["IN_QUEUE"]
            const deliveryRate = partner.totalShipments > 0
              ? Math.round((partner.deliveredCount / partner.totalShipments) * 100)
              : 0

            return (
              <div
                key={partner.name}
                className={cn(
                  "relative p-4 rounded-xl border bg-[#0a1628] hover:bg-[#0f172a] transition-all duration-200 group cursor-default",
                  accent
                )}
              >
                {/* Top: Avatar + name */}
                <div className="flex items-start gap-3 mb-4">
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-lg text-sm font-bold border border-current/30 shrink-0",
                    iconCls
                  )}>
                    {partner.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-white truncate">{partner.name}</h3>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                      <p className="text-[10px] text-slate-500 truncate">{partner.address}</p>
                    </div>
                  </div>
                  <span className={cn("shrink-0 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border", statusCls)}>
                    {partner.lastStatus === "IN_QUEUE" ? "QUEUED" : partner.lastStatus}
                  </span>
                </div>

                {/* Big number: Active containers */}
                <div className="mb-3">
                  <div className="flex items-end gap-1.5">
                    <span className="text-4xl font-bold font-mono text-white leading-none">
                      {partner.activeInTransit}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase pb-1 font-mono">Active in Transit</span>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="p-2 rounded bg-[#050b14]/60 text-center">
                    <p className="text-sm font-bold font-mono text-white">{partner.totalShipments}</p>
                    <p className="text-[9px] text-slate-600 uppercase">Total</p>
                  </div>
                  <div className="p-2 rounded bg-[#050b14]/60 text-center">
                    <p className="text-sm font-bold font-mono text-emerald-400">{partner.deliveredCount}</p>
                    <p className="text-[9px] text-slate-600 uppercase">Delivered</p>
                  </div>
                  <div className="p-2 rounded bg-[#050b14]/60 text-center">
                    <p className="text-sm font-bold font-mono text-cyan-400">{deliveryRate}%</p>
                    <p className="text-[9px] text-slate-600 uppercase">Rate</p>
                  </div>
                </div>

                {/* Delivery rate bar */}
                <div>
                  <div className="h-1 bg-[#1e293b] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-600 to-emerald-500 rounded-full transition-all duration-700"
                      style={{ width: `${deliveryRate}%` }}
                    />
                  </div>
                </div>

                {/* Last container */}
                {partner.lastContainerId !== "—" && (
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[9px] text-slate-600 uppercase font-mono">Last Container</span>
                    <span className="text-[10px] font-mono text-cyan-500/70">{partner.lastContainerId}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
