"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { fetchHubs, type Hub, type Shipment } from "@/lib/api"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { ShipmentsList } from "@/components/dashboard/shipments-list"
import { WorldMap } from "@/components/dashboard/world-map"
import { ShipmentModal } from "@/components/dashboard/shipment-modal"
import { NotificationsPanel, type ShipmentNotification } from "@/components/dashboard/notifications-panel"
import { CommandPalette } from "@/components/dashboard/command-palette"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { ToastNotification, type Toast } from "@/components/dashboard/toast-notification"
import { KeyboardShortcuts } from "@/components/dashboard/keyboard-shortcuts"
import { FleetView } from "@/components/dashboard/views/fleet-view"
import { TrackingView } from "@/components/dashboard/views/tracking-view"
import { AnalyticsView } from "@/components/dashboard/views/analytics-view"
import { CustomersView } from "@/components/dashboard/views/customers-view"
import { ReportsView } from "@/components/dashboard/views/reports-view"
import { ShipmentsView } from "@/components/dashboard/views/shipments-view"
import { AddShipmentView } from "@/components/dashboard/views/add-shipment-view"

type StatusFilter = "in-transit" | "delivered" | "pending" | "delayed" | null

// Export the ApiShipment type so other components can import it
export type ApiShipment = Shipment

export default function DashboardContent() {
    // --- LIVE DATA FETCHING LOGIC ---
    const [shipments, setShipments] = useState<Shipment[]>([])
    const [hubs, setHubs] = useState<Hub[]>([])
    const [loading, setLoading] = useState(true)

    // --- NOTIFICATIONS ---
    const [notifications, setNotifications] = useState<ShipmentNotification[]>([])
    const previousShipmentsRef = useRef<Map<string, string>>(new Map())

    /** Generate notifications when shipment statuses change */
    const detectStatusChanges = useCallback((newShipments: Shipment[]) => {
        const prev = previousShipmentsRef.current
        if (prev.size === 0) {
            // First load — just populate the map, don't generate notifications
            const map = new Map<string, string>()
            newShipments.forEach(s => map.set(s.shipmentId, s.status))
            previousShipmentsRef.current = map
            return
        }

        const newNotifications: ShipmentNotification[] = []

        for (const shipment of newShipments) {
            const oldStatus = prev.get(shipment.shipmentId)

            if (oldStatus && oldStatus !== shipment.status) {
                if (shipment.status === "DELIVERED") {
                    newNotifications.push({
                        id: `${shipment.shipmentId}-${Date.now()}`,
                        type: "arrived",
                        title: "Ship Arrived",
                        message: `${shipment.label} has been delivered to ${shipment.destinationHub}.`,
                        timestamp: new Date(),
                        read: false,
                    })
                } else if (shipment.status === "TRANSIT") {
                    newNotifications.push({
                        id: `${shipment.shipmentId}-${Date.now()}`,
                        type: "departed",
                        title: "Ship Departed",
                        message: `${shipment.label} has departed from ${shipment.currentHub} heading to ${shipment.destinationHub}.`,
                        timestamp: new Date(),
                        read: false,
                    })
                } else if (shipment.status === "DELAYED") {
                    newNotifications.push({
                        id: `${shipment.shipmentId}-${Date.now()}`,
                        type: "delayed",
                        title: "Shipment Delayed",
                        message: `${shipment.label} has been delayed.`,
                        timestamp: new Date(),
                        read: false,
                    })
                }
            } else if (!oldStatus) {
                // New shipment appeared
                newNotifications.push({
                    id: `${shipment.shipmentId}-${Date.now()}`,
                    type: "created",
                    title: "New Shipment",
                    message: `${shipment.label} has been registered (${shipment.currentHub} → ${shipment.destinationHub}).`,
                    timestamp: new Date(),
                    read: false,
                })
            }
        }

        // Update the ref
        const map = new Map<string, string>()
        newShipments.forEach(s => map.set(s.shipmentId, s.status))
        previousShipmentsRef.current = map

        if (newNotifications.length > 0) {
            setNotifications(prev => [...newNotifications, ...prev].slice(0, 100)) // Keep max 100
        }
    }, [])

    useEffect(() => {
        console.log("⚓ Pulse Started");

        const fetchData = async () => {
            try {
                const response = await fetch("/api/shipment/active");
                if (!response.ok) throw new Error("Backend offline");
                const data = await response.json();

                console.log("📦 Data Received:", data.length, "shipments");
                setShipments(data);
                detectStatusChanges(data);
            } catch (err) {
                console.error("📡 Signal Lost:", err);
            }
        };

        fetchData();
        // Fetch hubs once (they rarely change)
        fetchHubs().then(setHubs).catch(() => { });
        const interval = setInterval(fetchData, 10000); // 10 seconds
        return () => clearInterval(interval);
    }, [detectStatusChanges]);

    // Helper to normalize status values from DB
    const normalizeStatus = useCallback((status: string): string => {
        const s = status?.toLowerCase().replace(/_/g, "-") || "pending"
        if (s.includes("transit")) return "in-transit"
        if (s.includes("deliver")) return "delivered"
        if (s.includes("delay")) return "delayed"
        if (s.includes("pend")) return "pending"
        if (s.includes("queue")) return "pending"
        return s
    }, [])

    const stats = useMemo(() => {
        return {
            total: shipments.length,
            inTransit: shipments.filter(s => normalizeStatus(s.status) === 'in-transit').length,
            delivered: shipments.filter(s => normalizeStatus(s.status) === 'delivered').length,
            pending: shipments.filter(s => normalizeStatus(s.status) === 'pending').length,
            delayed: shipments.filter(s => normalizeStatus(s.status) === 'delayed').length
        }
    }, [shipments, normalizeStatus])

    const unreadNotificationCount = useMemo(() =>
        notifications.filter(n => !n.read).length
        , [notifications])

    const markAllNotificationsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }, [])

    const clearAllNotifications = useCallback(() => {
        setNotifications([])
    }, [])

    // --- ORIGINAL V0 STATES ---
    const [activeView, setActiveView] = useState("overview")
    const [showNotifications, setShowNotifications] = useState(false)
    const [showCommandPalette, setShowCommandPalette] = useState(false)
    const [showActivityFeed, setShowActivityFeed] = useState(false)
    const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
    const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)
    const [statusFilter, setStatusFilter] = useState<StatusFilter>(null)
    const [toasts, setToasts] = useState<Toast[]>([])

    // --- ORIGINAL V0 HANDLERS ---
    const addToast = useCallback((type: Toast["type"], title: string, description?: string) => {
        const id = Date.now().toString()
        setToasts((prev) => [...prev, { id, type, title, description }])
    }, [])

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    // Keyboard shortcuts logic (restored)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault()
                setShowCommandPalette(true)
            }
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "N") {
                e.preventDefault()
                setActiveView("add-shipment")
            }
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === ".") {
                e.preventDefault()
                setShowNotifications(true)
            }
            if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
                const target = e.target as HTMLElement
                if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
                    e.preventDefault()
                    setShowKeyboardShortcuts(true)
                }
            }
            if (e.key === "Escape") {
                setShowCommandPalette(false)
                setShowNotifications(false)
                setShowActivityFeed(false)
                setShowKeyboardShortcuts(false)
                setSelectedShipment(null)
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [])

    const handleViewChange = (view: string) => {
        setActiveView(view)
        setStatusFilter(null)
    }

    const handleFilterClick = (filter: StatusFilter) => {
        setStatusFilter(filter)
    }

    const handleShipmentClick = (shipment: Shipment) => {
        setSelectedShipment(shipment)
    }

    const handleSearch = (query: string) => {
        if (query && activeView !== "shipments") {
            setActiveView("shipments")
        }
    }

    // Map Shipment to ShipmentDetail for the modal
    const mappedSelectedShipment = useMemo(() => {
        if (!selectedShipment) return null
        return {
            id: selectedShipment.shipmentId,
            origin: selectedShipment.currentHub || "N/A",
            destination: selectedShipment.destinationHub || "N/A",
            status: normalizeStatus(selectedShipment.status) as any,
            eta: selectedShipment.createdAt ? new Date(selectedShipment.createdAt).toLocaleDateString() : "N/A",
            carrier: "SkyLink Logistics",
            weight: "N/A",
            customer: selectedShipment.consumerName,
            email: "N/A",
            phone: "N/A",
        }
    }, [selectedShipment, normalizeStatus])

    // --- RENDER LOGIC (NOW INJECTED WITH LIVE DATA) ---
    const renderMainContent = () => {
        switch (activeView) {
            case "add-shipment":
                return <AddShipmentView />
            case "shipments":
                return <ShipmentsView shipments={shipments} />
            case "fleet":
                return <FleetView shipments={shipments} />
            case "tracking":
                return <TrackingView shipments={shipments} hubs={hubs} />
            case "analytics":
                return <AnalyticsView shipments={shipments} />
            case "customers":
                return <CustomersView shipments={shipments} />
            case "reports":
                return <ReportsView shipments={shipments} hubs={hubs} />
            default:
                return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <StatsCards
                            onFilterClick={handleFilterClick}
                            activeFilter={statusFilter}
                            stats={stats}
                        />
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            <WorldMap shipments={shipments} hubs={hubs} />
                            <ShipmentsList
                                apiShipments={shipments}
                                onShipmentClick={handleShipmentClick}
                                filterStatus={statusFilter}
                            />
                        </div>
                    </div>
                )
        }
    }

    const getViewTitle = () => {
        const titles: Record<string, string> = {
            overview: "Dashboard Overview",
            "add-shipment": "Add Shipment",
            shipments: "Shipments",
            fleet: "Fleet Management",
            tracking: "Tracking",
            analytics: "Analytics",
            customers: "Customers",
            reports: "Reports",
        }
        return titles[activeView] || "Dashboard"
    }

    return (
        <div className="flex h-screen bg-background text-foreground">
            <Sidebar
                activeView={activeView}
                onViewChange={handleViewChange}
                onNotificationsClick={() => setShowNotifications(true)}
                notificationCount={unreadNotificationCount}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                <Header
                    onNotificationsClick={() => setShowNotifications(true)}
                    onSearch={handleSearch}
                    onCommandPalette={() => setShowCommandPalette(true)}
                    onActivityFeed={() => setShowActivityFeed(true)}
                    onKeyboardShortcuts={() => setShowKeyboardShortcuts(true)}
                    title={getViewTitle()}
                />

                <main className="flex-1 overflow-auto p-6 relative">
                    {renderMainContent()}

                    {/* Live Indicator Overlay */}
                    {!loading && (
                        <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-green-500/30 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-mono text-green-500 uppercase tracking-tighter">Live Connection Established</span>
                        </div>
                    )}
                </main>
            </div>

            <ShipmentModal
                shipment={mappedSelectedShipment}
                onClose={() => setSelectedShipment(null)}
            />

            <NotificationsPanel
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                notifications={notifications}
                onMarkAllRead={markAllNotificationsRead}
                onClearAll={clearAllNotifications}
            />

            <CommandPalette
                isOpen={showCommandPalette}
                onClose={() => setShowCommandPalette(false)}
                onNavigate={handleViewChange}
                onAction={(action) => {
                    if (action === "new-shipment") setActiveView("add-shipment")
                }}
            />

            <ActivityFeed
                isOpen={showActivityFeed}
                onClose={() => setShowActivityFeed(false)}
            />

            <KeyboardShortcuts
                isOpen={showKeyboardShortcuts}
                onClose={() => setShowKeyboardShortcuts(false)}
            />

            <ToastNotification toasts={toasts} onRemove={removeToast} />
        </div>
    )
}
