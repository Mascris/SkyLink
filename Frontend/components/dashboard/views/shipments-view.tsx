"use client"

import { useMemo, useState } from "react"
import {
  Search, Container, ChevronLeft, ChevronRight,
  Ship, AlertTriangle, CheckCircle, Clock, CloudLightning, ArrowRight,
  X, Globe, Navigation, User, MapPin, Signal, Cpu, Hash
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { type Shipment as ApiShipment } from "@/lib/api"

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  TRANSIT: { label: "Underway", color: "text-blue-500 bg-blue-500/10 border-blue-500/30", icon: Ship },
  DELIVERED: { label: "Delivered", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30", icon: CheckCircle },
  IN_QUEUE: { label: "Queued", color: "text-muted-foreground bg-muted border-border", icon: Clock },
  DELAYED: { label: "Delayed", color: "text-red-500 bg-red-500/10 border-red-500/30", icon: AlertTriangle },
  SHELTERING: { label: "Sheltering", color: "text-amber-500 bg-amber-500/10 border-amber-500/30", icon: CloudLightning },
}

const PAGE_SIZE = 15

// ─── TEU / Weight helpers (deterministic from ID) ────────────────────────────
const TEU_TYPES = ["20ft Dry", "40ft Dry", "40ft High-Cube", "20ft Reefer", "Tank", "Open-Top 20ft"]
const CARGO_TYPES = ["General Merchandise", "Refrigerated Goods", "Hazardous Materials", "Electronics", "Textiles & Apparel", "Automotive Parts", "Raw Materials", "Pharmaceutical"]
const OPERATOR_NAMES = ["Lena Hoffmann", "Marcus Weiß", "Sofia Aerts", "James Okafor", "Mei Lin", "Carlos Rivera", "Aisha Patel", "Kim Sung-Jae"]

const hashN = (id: string, mod: number) =>
  id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % mod

const hashTEU = (id: string) => TEU_TYPES[hashN(id, TEU_TYPES.length)]
const hashCargo = (id: string) => CARGO_TYPES[hashN(id, CARGO_TYPES.length)]
const hashOp = (id: string) => OPERATOR_NAMES[hashN(id, OPERATOR_NAMES.length)]
const hashWeight = (id: string) => `${2000 + hashN(id, 18000)} kg`
const hashTEUnum = (id: string) => (1 + (id.charCodeAt(0) % 2))

// ─── Container Detail Drawer ─────────────────────────────────────────────────
function ContainerDetailDrawer({ shipment, onClose }: { shipment: ApiShipment | null; onClose: () => void }) {
  if (!shipment) return null
  const cfg = STATUS_MAP[shipment.status] || STATUS_MAP["IN_QUEUE"]
  const StatusIcon = cfg.icon

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[520px] flex flex-col bg-card border-l border-border manifest-panel shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <Container className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-[9px] font-mono tracking-widest text-blue-400 uppercase">Container Deep-Dive</p>
              <h2 className="text-sm font-bold text-foreground font-mono">{shipment.containerId || "—"}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase border", cfg.color)}>
              <StatusIcon className="w-3 h-3" />
              {cfg.label}
            </span>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Large Container ID block */}
          <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/10">
            <p className="text-[9px] font-mono tracking-widest text-blue-400 uppercase mb-2">Container Identifier</p>
            <div className="flex items-end gap-3">
              <p className="text-3xl font-bold font-mono text-blue-400">{shipment.containerId || "CONT-UNKNOWN"}</p>
              <div className="mb-1 flex flex-col gap-0.5">
                <span className="text-[9px] font-mono text-muted-foreground">TYPE</span>
                <span className="text-xs font-bold text-foreground">{hashTEU(shipment.shipmentId)}</span>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-[10px] font-mono text-muted-foreground">{hashTEUnum(shipment.shipmentId)} TEU</span>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-[10px] font-mono text-muted-foreground">{hashWeight(shipment.shipmentId)}</span>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-[10px] font-mono text-muted-foreground">{hashCargo(shipment.shipmentId)}</span>
            </div>
          </div>

          {/* 2-column grid */}
          <div className="grid grid-cols-2 gap-3">
            <DetailCell icon={Hash} label="Cargo Label" value={shipment.label} full />
            <DetailCell icon={Navigation} label="Origin Port" value={shipment.currentHub} />
            <DetailCell icon={MapPin} label="Destination" value={shipment.destinationHub} />
            <DetailCell icon={Globe} label="Latitude" value={shipment.currentLat?.toFixed(5) ?? "—"} mono />
            <DetailCell icon={Globe} label="Longitude" value={shipment.currentLng?.toFixed(5) ?? "—"} mono />
            <DetailCell icon={Signal} label="Progress" value={`${shipment.progressPercent ?? 0}%`} mono accent />
            <DetailCell icon={Clock} label="ETA"
              value={shipment.estimatedArrival
                ? new Date(shipment.estimatedArrival).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                : "Calculating…"}
              mono
            />
          </div>

          {/* Voyage progress bar */}
          <div className="p-3 rounded-lg border border-border bg-muted/50">
            <div className="flex justify-between text-[9px] font-mono text-muted-foreground mb-2 uppercase tracking-widest">
              <span>Voyage Progress</span>
              <span className="text-blue-400">{shipment.progressPercent ?? 0}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-700"
                style={{ width: `${shipment.progressPercent ?? 0}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[8px] font-mono text-muted-foreground">
              <span>{shipment.currentHub}</span>
              <span>{shipment.destinationHub}</span>
            </div>
          </div>

          {/* Operator */}
          <div className="p-4 rounded-xl border border-border bg-muted/50">
            <p className="text-[9px] font-mono tracking-widest text-muted-foreground uppercase mb-3">Assigned Operator</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-bold">
                {hashOp(shipment.shipmentId).split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{hashOp(shipment.shipmentId)}</p>
                <p className="text-[10px] font-mono text-muted-foreground">ops-{shipment.shipmentId?.slice(0, 6).toLowerCase()}@skylink.net</p>
              </div>
            </div>
            {shipment.consumerName && (
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  <div>
                    <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">Consignee</p>
                    <p className="text-xs font-semibold text-foreground mt-0.5">{shipment.consumerName}</p>
                    {shipment.deliveryAddress && <p className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">{shipment.deliveryAddress}</p>}
                  </div>
                </div>
              </div>
            )}
            {shipment.shipName && (
              <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
                <Ship className="w-3.5 h-3.5 text-blue-400" />
                <div>
                  <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">Vessel</span>
                  <p className="text-xs font-semibold text-blue-400 mt-0.5">{shipment.shipName}</p>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-muted/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 maritime-glow" />
            <span className="text-[8px] font-mono text-muted-foreground uppercase tracking-widest">SkyLink Cargo Authority</span>
          </div>
          <button onClick={onClose} className="h-7 px-3 rounded text-xs font-mono text-muted-foreground hover:text-foreground border border-border hover:border-blue-400/50 transition-all">
            Close
          </button>
        </div>
      </div>
    </>
  )
}

function DetailCell({ icon: Icon, label, value, mono, full, accent }: {
  icon: React.ElementType; label: string; value: string; mono?: boolean; full?: boolean; accent?: boolean
}) {
  return (
    <div className={cn("p-3 rounded-lg border border-border bg-muted/50", full && "col-span-2")}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="w-3 h-3 text-muted-foreground" />
        <span className="text-[9px] font-mono tracking-widest text-muted-foreground uppercase">{label}</span>
      </div>
      <p className={cn(
        "text-sm font-semibold truncate",
        accent ? "text-blue-400 font-mono text-lg" :
          mono ? "text-blue-400 font-mono" :
            "text-foreground"
      )}>{value}</p>
    </div>
  )
}

// ─── Main ShipmentsView ───────────────────────────────────────────────────────
export function ShipmentsView({ shipments: apiShipments }: { shipments: ApiShipment[] }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedContainer, setSelectedContainer] = useState<ApiShipment | null>(null)

  const filtered = useMemo(() => {
    return apiShipments.filter(s => {
      const q = searchQuery.toLowerCase()
      const matchSearch = !q ||
        s.shipmentId?.toLowerCase().includes(q) ||
        s.label?.toLowerCase().includes(q) ||
        s.currentHub?.toLowerCase().includes(q) ||
        s.destinationHub?.toLowerCase().includes(q) ||
        s.containerId?.toLowerCase().includes(q) ||
        s.consumerName?.toLowerCase().includes(q)
      const matchStatus = statusFilter === "all" || s.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [apiShipments, searchQuery, statusFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const stats = useMemo(() => ({
    total: apiShipments.length,
    transit: apiShipments.filter(s => s.status === "TRANSIT").length,
    delivered: apiShipments.filter(s => s.status === "DELIVERED").length,
    queued: apiShipments.filter(s => s.status === "IN_QUEUE").length,
    delayed: apiShipments.filter(s => ["DELAYED", "SHELTERING"].includes(s.status)).length,
  }), [apiShipments])

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Container className="w-5 h-5 text-blue-400" />
          Container Inventory
        </h1>
        <p className="text-[10px] font-mono tracking-widest text-muted-foreground mt-0.5 uppercase">
          Live Cargo Registry — {apiShipments.length} Entries · Click Row for Deep-Dive
        </p>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-5 gap-2">
        {[
          { label: "Total", value: stats.total, color: "text-foreground" },
          { label: "Underway", value: stats.transit, color: "text-blue-400" },
          { label: "Delivered", value: stats.delivered, color: "text-emerald-400" },
          { label: "Queued", value: stats.queued, color: "text-muted-foreground" },
          { label: "Issues", value: stats.delayed, color: "text-red-400" },
        ].map(s => (
          <div key={s.label} className="p-3 rounded-lg bg-card border border-border text-center">
            <p className={cn("text-xl font-bold font-mono", s.color)}>{s.value}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5 font-mono">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Container ID, Label, Hub, Consignee…"
            className="pl-9 h-9 text-xs bg-muted/50 border-border font-mono focus:border-blue-400/50 placeholder:text-muted-foreground text-foreground"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1) }}
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {["all", "TRANSIT", "DELIVERED", "IN_QUEUE", "DELAYED", "SHELTERING"].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setCurrentPage(1) }}
              className={cn(
                "h-8 px-2.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider transition-all",
                statusFilter === s
                  ? "bg-blue-500 text-white border border-blue-600"
                  : "text-muted-foreground border border-border hover:border-blue-400/50 hover:text-foreground"
              )}>
              {s === "all" ? "All" : s === "IN_QUEUE" ? "Queued" : s === "SHELTERING" ? "Storm" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                {["#", "Container ID", "Cargo Label", "Route", "TEU Type", "Weight", "Progress", "Status", "ETA"].map(col => (
                  <th key={col} className="text-left px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground font-mono whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paged.map((s, i) => {
                const cfg = STATUS_MAP[s.status] || STATUS_MAP["IN_QUEUE"]
                const SIcon = cfg.icon
                const rowIdx = (currentPage - 1) * PAGE_SIZE + i + 1
                return (
                  <tr
                    key={s.shipmentId}
                    onClick={() => setSelectedContainer(s)}
                    className="hover:bg-muted/40 hover:border-l-2 hover:border-blue-500 transition-all group cursor-pointer"
                  >
                    <td className="px-3 py-2 text-[9px] font-mono text-muted-foreground">{String(rowIdx).padStart(3, "0")}</td>
                    <td className="px-3 py-2">
                      <span className="font-mono text-[11px] text-blue-400">{s.containerId || "—"}</span>
                    </td>
                    <td className="px-3 py-2">
                      <p className="text-xs font-medium text-foreground truncate max-w-[130px]">{s.label}</p>
                      <p className="text-[9px] font-mono text-muted-foreground truncate max-w-[130px]">{s.shipmentId?.slice(0, 10)}…</p>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1 font-mono text-[10px]">
                        <span className="text-muted-foreground">{s.currentHub}</span>
                        <ArrowRight className="w-2.5 h-2.5 text-blue-400 shrink-0" />
                        <span className="text-foreground/80">{s.destinationHub}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2"><span className="text-[9px] font-mono text-muted-foreground">{hashTEU(s.shipmentId)}</span></td>
                    <td className="px-3 py-2"><span className="text-[9px] font-mono text-muted-foreground">{hashWeight(s.shipmentId)}</span></td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2 min-w-[80px]">
                        <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${s.progressPercent ?? 0}%` }} />
                        </div>
                        <span className="text-[9px] font-mono text-muted-foreground w-7 text-right">{s.progressPercent ?? 0}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border", cfg.color)}>
                        <SIcon className="w-2.5 h-2.5" />{cfg.label}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-[9px] font-mono text-muted-foreground">
                        {s.estimatedArrival
                          ? new Date(s.estimatedArrival).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                          : "—"}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {paged.length === 0 && (
                <tr><td colSpan={9} className="py-12 text-center text-muted-foreground font-mono text-xs tracking-widest uppercase">No Containers Match Current Filters</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
            <p className="text-[9px] font-mono text-muted-foreground tracking-wider uppercase">
              Rows {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7 border-border bg-transparent text-muted-foreground hover:text-foreground"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <span className="text-[9px] font-mono text-muted-foreground px-2">PAGE {currentPage}/{totalPages}</span>
              <Button variant="outline" size="icon" className="h-7 w-7 border-border bg-transparent text-muted-foreground hover:text-foreground"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Container Detail Drawer */}
      <ContainerDetailDrawer shipment={selectedContainer} onClose={() => setSelectedContainer(null)} />
    </div>
  )
}
