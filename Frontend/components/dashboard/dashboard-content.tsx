"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { fetchHubs, type Hub, type Shipment } from "@/lib/api"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { ShipmentsList } from "@/components/dashboard/shipments-list"
import { WorldMap } from "@/components/dashboard/world-map"
import { CargoManifestPanel } from "@/components/dashboard/shipment-modal"
import { NotificationsPanel, type ShipmentNotification } from "@/components/dashboard/notifications-panel"
import { CommandPalette } from "@/components/dashboard/command-palette"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { ToastNotification, type Toast } from "@/components/dashboard/toast-notification"
import { KeyboardShortcuts } from "@/components/dashboard/keyboard-shortcuts"
import { TrackingView } from "@/components/dashboard/views/tracking-view"
import { CustomersView } from "@/components/dashboard/views/customers-view"
import { ShipmentsView } from "@/components/dashboard/views/shipments-view"
import { AddShipmentView } from "@/components/dashboard/views/add-shipment-view"
import { TelemetryView } from "@/components/dashboard/views/telemetry-view"

export type ApiShipment = Shipment
type StatusFilter = "in-transit" | "delivered" | "pending" | "delayed" | null

export default function DashboardContent() {
    const [shipments, setShipments] = useState<Shipment[]>([])
    const [hubs, setHubs] = useState<Hub[]>([])
    const [loading, setLoading] = useState(true)
    const [notifications, setNotifications] = useState<ShipmentNotification[]>([])
    const previousShipmentsRef = useRef<Map<string, string>>(new Map())

    const detectStatusChanges = useCallback((newShipments: Shipment[]) => {
        const prev = previousShipmentsRef.current
        if (prev.size === 0) {
            const map = new Map<string, string>()
            newShipments.forEach(s => map.set(s.shipmentId, s.status))
            previousShipmentsRef.current = map
            return
        }
        const next: ShipmentNotification[] = []
        for (const s of newShipments) {
            const old = prev.get(s.shipmentId)
            if (old && old !== s.status) {
                if (s.status === "DELIVERED") next.push({ id: `${s.shipmentId}-${Date.now()}`, type: "arrived", title: "Ship Arrived", message: `${s.label} delivered to ${s.destinationHub}.`, timestamp: new Date(), read: false })
                else if (s.status === "TRANSIT") next.push({ id: `${s.shipmentId}-${Date.now()}`, type: "departed", title: "Ship Departed", message: `${s.label} departed from ${s.currentHub}.`, timestamp: new Date(), read: false })
                else if (s.status === "DELAYED") next.push({ id: `${s.shipmentId}-${Date.now()}`, type: "delayed", title: "Shipment Delayed", message: `${s.label} has been delayed.`, timestamp: new Date(), read: false })
                else if (s.status === "SHELTERING") next.push({ id: `${s.shipmentId}-${Date.now()}`, type: "delayed", title: "Storm Alert", message: `${s.label} is sheltering from a storm.`, timestamp: new Date(), read: false })
            } else if (!old) {
                next.push({ id: `${s.shipmentId}-${Date.now()}`, type: "created", title: "New Manifest", message: `${s.label} registered (${s.currentHub} → ${s.destinationHub}).`, timestamp: new Date(), read: false })
            }
        }
        const map = new Map<string, string>(); newShipments.forEach(s => map.set(s.shipmentId, s.status)); previousShipmentsRef.current = map
        if (next.length > 0) setNotifications(prev => [...next, ...prev].slice(0, 100))
    }, [])

    // *** DO NOT TOUCH THIS POLLING EFFECT ***
    useEffect(() => {
        console.log("⚓ Pulse Started");
        const fetchData = async () => {
            try {
                const response = await fetch("/api/shipment/active");
                if (!response.ok) throw new Error("Backend offline");
                const data = await response.json();
                console.log("📦 Data Received:", data.length, "shipments");
                setShipments(data);
                setLoading(false);
                detectStatusChanges(data);
            } catch (err) { console.error("📡 Signal Lost:", err); }
        };
        fetchData();
        fetchHubs().then(setHubs).catch(() => { });
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, [detectStatusChanges]);

    const normalizeStatus = useCallback((status: string): string => {
        const s = status?.toLowerCase().replace(/_/g, "-") || "pending"
        if (s.includes("transit")) return "in-transit"
        if (s.includes("deliver")) return "delivered"
        if (s.includes("delay")) return "delayed"
        if (s.includes("shelter")) return "delayed"
        if (s.includes("pend")) return "pending"
        if (s.includes("queue")) return "pending"
        return s
    }, [])

    const stats = useMemo(() => ({
        total: shipments.length,
        inTransit: shipments.filter(s => normalizeStatus(s.status) === "in-transit").length,
        delivered: shipments.filter(s => normalizeStatus(s.status) === "delivered").length,
        pending: shipments.filter(s => normalizeStatus(s.status) === "pending").length,
        delayed: shipments.filter(s => normalizeStatus(s.status) === "delayed").length,
    }), [shipments, normalizeStatus])

    const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications])
    const markAllRead = useCallback(() => setNotifications(p => p.map(n => ({ ...n, read: true }))), [])
    const clearAll = useCallback(() => setNotifications([]), [])

    const [activeView, setActiveView] = useState("overview")
    const [showNotifications, setShowNotifications] = useState(false)
    const [showCommandPalette, setShowCommandPalette] = useState(false)
    const [showActivityFeed, setShowActivityFeed] = useState(false)
    const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
    const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)
    const [statusFilter, setStatusFilter] = useState<StatusFilter>(null)
    const [toasts, setToasts] = useState<Toast[]>([])
    const [focusedShipmentId, setFocusedShipmentId] = useState<string | null>(null)

    const addToast = useCallback((type: Toast["type"], title: string, desc?: string) => {
        const id = Date.now().toString()
        setToasts(p => [...p, { id, type, title, description: desc }])
    }, [])
    const removeToast = useCallback((id: string) => setToasts(p => p.filter(t => t.id !== id)), [])

    useEffect(() => {
        const handle = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setShowCommandPalette(true) }
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "N") { e.preventDefault(); setActiveView("add-shipment") }
            if (e.key === "Escape") { setShowCommandPalette(false); setShowNotifications(false); setShowActivityFeed(false); setShowKeyboardShortcuts(false); setSelectedShipment(null); setFocusedShipmentId(null) }
        }
        window.addEventListener("keydown", handle)
        return () => window.removeEventListener("keydown", handle)
    }, [])

    const handleShipmentClick = (shipment: Shipment) => {
        setSelectedShipment(shipment)
        setFocusedShipmentId(shipment.shipmentId)
    }

    const handleCloseManifest = () => {
        setSelectedShipment(null)
        setFocusedShipmentId(null) // Release isolation on close
    }

    const titles: Record<string, string> = {
        overview: "Command Center",
        "add-shipment": "New Manifest",
        shipments: "Container Inventory",
        tracking: "Live Global Radar",
        telemetry: "Telemetry & Intelligence",
        customers: "Corporate Partners",
    }

    const renderMain = () => {
        switch (activeView) {
            case "add-shipment": return <AddShipmentView />
            case "shipments": return <ShipmentsView shipments={shipments} />
            case "tracking": return (
                /* Live Global Radar — 90% fullscreen map with floating search overlay */
                <div className="relative" style={{ height: "calc(100vh - 56px - 48px)" }}>
                    <div className="h-full rounded-xl overflow-hidden">
                        <WorldMap shipments={shipments} hubs={hubs} focusedShipmentId={focusedShipmentId} fullscreen />
                    </div>
                    {/* Floating search overlay */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-80">
                        <div className="bg-[#050b14]/90 backdrop-blur-md rounded-lg border border-cyan-500/20 px-3 py-2 flex items-center gap-2 shadow-xl">
                            <div className="w-2 h-2 bg-cyan-400 rounded-full maritime-glow shrink-0" />
                            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">Live Global Radar</span>
                            <span className="ml-auto text-[9px] font-mono text-slate-600">{shipments.length} vessels tracked</span>
                        </div>
                    </div>
                    <TrackingView shipments={shipments} hubs={hubs} />
                </div>
            )
            case "telemetry": return <TelemetryView shipments={shipments} hubs={hubs} />
            case "customers": return <CustomersView shipments={shipments} />

            default: return (
                /* OVERVIEW — strict flex row: 30% ledger | 70% stats+map */
                <div className="flex gap-4 h-full animate-in fade-in duration-300">
                    {/* LEFT PANEL — Ledger 30% */}
                    <div className="w-[30%] shrink-0 flex flex-col overflow-hidden">
                        <ShipmentsList
                            apiShipments={shipments}
                            onShipmentClick={handleShipmentClick}
                            filterStatus={statusFilter}
                        />
                    </div>
                    {/* RIGHT PANEL — Stats + Map 70% */}
                    <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-hidden">
                        <StatsCards
                            onFilterClick={(f) => setStatusFilter(f)}
                            activeFilter={statusFilter}
                            stats={stats}
                        />
                        <div className="flex-1 min-h-0">
                            <WorldMap
                                shipments={shipments}
                                hubs={hubs}
                                focusedShipmentId={focusedShipmentId}
                            />
                        </div>
                    </div>
                </div>
            )
        }
    }

    return (
        <div className="flex h-screen bg-[#050b14] text-foreground overflow-hidden">
            <Sidebar
                activeView={activeView}
                onViewChange={(v) => { setActiveView(v); setStatusFilter(null) }}
                onNotificationsClick={() => setShowNotifications(true)}
                notificationCount={unreadCount}
            />

            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                <Header
                    onNotificationsClick={() => setShowNotifications(true)}
                    onSearch={() => { }}
                    onCommandPalette={() => setShowCommandPalette(true)}
                    onActivityFeed={() => setShowActivityFeed(true)}
                    onKeyboardShortcuts={() => setShowKeyboardShortcuts(true)}
                    title={titles[activeView] || "Command Center"}
                    notificationCount={unreadCount}
                />

                <main className={`flex-1 min-h-0 ${activeView === "overview"
                        ? "overflow-hidden p-4"
                        : activeView === "tracking"
                            ? "overflow-auto p-0"
                            : "overflow-auto p-5"
                    } relative`}>
                    {renderMain()}

                    {/* Live indicator */}
                    {!loading && activeView !== "tracking" && (
                        <div className="fixed bottom-4 right-4 z-30 bg-[#050b14]/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-cyan-500/20 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                            <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-tighter">Radar Link Active</span>
                        </div>
                    )}
                </main>
            </div>

            {/* Digital Cargo Manifest Sliding Panel */}
            <CargoManifestPanel
                shipment={selectedShipment}
                onClose={handleCloseManifest}
            />

            <NotificationsPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} notifications={notifications} onMarkAllRead={markAllRead} onClearAll={clearAll} />
            <CommandPalette isOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)} onNavigate={setActiveView} onAction={(a) => { if (a === "new-shipment") setActiveView("add-shipment") }} />
            <ActivityFeed isOpen={showActivityFeed} onClose={() => setShowActivityFeed(false)} />
            <KeyboardShortcuts isOpen={showKeyboardShortcuts} onClose={() => setShowKeyboardShortcuts(false)} />
            <ToastNotification toasts={toasts} onRemove={removeToast} />
        </div>
    )
}
