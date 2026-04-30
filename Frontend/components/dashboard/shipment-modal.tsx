"use client"

import {
  X, Package, MapPin, Calendar, User, Navigation, Signal,
  Anchor, Ship, Container, Clock, AlertTriangle, CheckCircle,
  Cpu, Radio, Globe
} from "lucide-react"
import { cn } from "@/lib/utils"
import { type Shipment } from "@/lib/api"

interface CargoManifestPanelProps {
  shipment: Shipment | null
  onClose: () => void
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  TRANSIT: { label: "Underway", color: "text-blue-600 border-blue-300 bg-blue-50", icon: Ship },
  DELIVERED: { label: "Delivered", color: "text-emerald-600 border-emerald-300 bg-emerald-50", icon: CheckCircle },
  IN_QUEUE: { label: "Queued", color: "text-slate-600 border-slate-300 bg-slate-100", icon: Clock },
  DELAYED: { label: "Delayed", color: "text-red-600 border-red-300 bg-red-50", icon: AlertTriangle },
  SHELTERING: { label: "Sheltering", color: "text-amber-600 border-amber-300 bg-amber-50", icon: AlertTriangle },
}

export function CargoManifestPanel({ shipment, onClose }: CargoManifestPanelProps) {
  if (!shipment) return null

  const cfg = STATUS_CONFIG[shipment.status] || STATUS_CONFIG["IN_QUEUE"]
  const StatusIcon = cfg.icon

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sliding panel from right */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md flex flex-col bg-white border-l border-slate-200 manifest-panel shadow-xl">

        {/* Panel Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-blue-50 border border-blue-200">
              <Container className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Digital Cargo Manifest</p>
              <h2 className="text-sm font-bold text-slate-900 font-mono truncate max-w-[220px]">
                {shipment.label || shipment.shipmentId}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase border", cfg.color)}>
              <StatusIcon className="w-3 h-3" />
              {cfg.label}
            </span>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto">

          {/* Section 1: Vessel Telemetry */}
          <Section title="Vessel Telemetry" icon={Cpu}>
            <TelemetryGrid>
              <TelemetryCell label="Latitude" value={shipment.currentLat ? shipment.currentLat.toFixed(5) : "—"} icon={Globe} mono />
              <TelemetryCell label="Longitude" value={shipment.currentLng ? shipment.currentLng.toFixed(5) : "—"} icon={Globe} mono />
              <TelemetryCell label="Progress" value={`${shipment.progressPercent ?? 0}%`} icon={Signal} />
              <TelemetryCell
                label="Vessel"
                value={shipment.shipName || "Auto-assigned"}
                icon={Ship}
              />
              {shipment.containerId && (
                <TelemetryCell label="Container ID" value={shipment.containerId} icon={Container} mono full />
              )}
              {shipment.estimatedArrival && (
                <TelemetryCell
                  label="ETA"
                  value={new Date(shipment.estimatedArrival).toLocaleString(undefined, {
                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                  })}
                  icon={Clock}
                  full
                />
              )}
            </TelemetryGrid>
          </Section>

          {/* Progress bar */}
          <div className="px-5 pb-4">
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-1 uppercase">
              <span>Voyage Progress</span>
              <span className="text-blue-600">{shipment.progressPercent ?? 0}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-700"
                style={{ width: `${shipment.progressPercent ?? 0}%` }}
              />
            </div>
          </div>

          <div className="h-px bg-slate-200 mx-5" />

          {/* Section 2: Routing Protocol */}
          <Section title="Routing Protocol" icon={Radio}>
            <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
              <div className="p-3 border-b border-slate-200">
                <p className="text-[9px] text-slate-400 uppercase tracking-widest font-mono mb-1">Origin Port</p>
                <div className="flex items-center gap-2">
                  <Anchor className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-sm font-semibold text-slate-900">{shipment.currentHub || "—"}</span>
                </div>
              </div>
              <div className="px-3 py-1.5 flex items-center gap-2">
                <Navigation className="w-3.5 h-3.5 text-slate-400" />
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[9px] font-mono text-slate-400 uppercase">Routing</span>
                <div className="flex-1 h-px bg-slate-200" />
                <Navigation className="w-3.5 h-3.5 text-slate-400 rotate-180" />
              </div>
              <div className="p-3">
                <p className="text-[9px] text-slate-400 uppercase tracking-widest font-mono mb-1">Destination Port</p>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-sm font-semibold text-slate-900">{shipment.destinationHub || "—"}</span>
                </div>
              </div>
            </div>

            {/* Registry info */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <InfoCell label="Manifest ID" value={shipment.shipmentId?.slice(0, 16) || "—"} mono />
              <InfoCell label="Created" value={shipment.createdAt ? new Date(shipment.createdAt).toLocaleDateString() : "—"} />
            </div>
          </Section>

          <div className="h-px bg-slate-200 mx-5" />

          {/* Section 3: Consignee Details */}
          <Section title="Consignee Details" icon={User}>
            <div className="space-y-2.5">
              <InfoRow label="Recipient" value={shipment.consumerName || "—"} icon={User} />
              <InfoRow label="Address" value={shipment.deliveryAddress || "—"} icon={MapPin} />
            </div>
          </Section>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600 maritime-glow" />
              <span className="text-[9px] font-mono text-slate-500 uppercase">SkyLink Maritime Authority</span>
            </div>
            <button
              onClick={onClose}
              className="h-7 px-3 rounded text-xs font-mono text-slate-500 hover:text-slate-900 border border-slate-200 hover:border-blue-400 transition-all"
            >
              Close Panel
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="px-5 py-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-px h-4 bg-blue-600 rounded-full" />
        <Icon className="w-3.5 h-3.5 text-blue-600" />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{title}</span>
      </div>
      {children}
    </div>
  )
}

function TelemetryGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>
}

function TelemetryCell({ label, value, icon: Icon, mono, full }: { label: string; value: string; icon: React.ElementType; mono?: boolean; full?: boolean }) {
  return (
    <div className={cn("p-2.5 rounded bg-slate-50 border border-slate-200", full && "col-span-2")}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3 h-3 text-slate-400" />
        <span className="text-[9px] text-slate-400 uppercase tracking-widest font-mono">{label}</span>
      </div>
      <p className={cn("text-sm font-semibold text-slate-900 truncate", mono && "font-mono text-blue-600")}>{value}</p>
    </div>
  )
}

function InfoCell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
      <p className="text-[9px] text-slate-400 uppercase tracking-widest font-mono mb-1">{label}</p>
      <p className={cn("text-xs font-semibold text-slate-800 truncate", mono && "font-mono text-blue-600")}>{value}</p>
    </div>
  )
}

function InfoRow({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded bg-slate-50 border border-slate-200">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[9px] text-slate-400 uppercase tracking-widest font-mono">{label}</p>
        <p className="text-sm text-slate-800 mt-0.5 truncate">{value}</p>
      </div>
    </div>
  )
}
