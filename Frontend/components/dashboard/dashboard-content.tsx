"use client"

import { useState, useEffect, useCallback } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { ShipmentsList, type Shipment } from "@/components/dashboard/shipments-list"
import { WorldMap } from "@/components/dashboard/world-map"
import { ShipmentModal } from "@/components/dashboard/shipment-modal"
import { NotificationsPanel } from "@/components/dashboard/notifications-panel"
import { CommandPalette } from "@/components/dashboard/command-palette"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { ToastNotification, type Toast } from "@/components/dashboard/toast-notification"
import { KeyboardShortcuts } from "@/components/dashboard/keyboard-shortcuts"
import { FleetView } from "@/components/dashboard/views/fleet-view"
import { TrackingView } from "@/components/dashboard/views/tracking-view"
import { AnalyticsView } from "@/components/dashboard/views/analytics-view"
import { CustomersView } from "@/components/dashboard/views/customers-view"
import { ReportsView } from "@/components/dashboard/views/reports-view"
import { SettingsView } from "@/components/dashboard/views/settings-view"
import { ShipmentsView } from "@/components/dashboard/views/shipments-view"
import { AddShipmentView } from "@/components/dashboard/views/add-shipment-view"

type StatusFilter = "in-transit" | "delivered" | "pending" | "delayed" | null

export default function DashboardContent() {
    const [activeView, setActiveView] = useState("overview")
    const [showNotifications, setShowNotifications] = useState(false)
    const [showCommandPalette, setShowCommandPalette] = useState(false)
    const [showActivityFeed, setShowActivityFeed] = useState(false)
    const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
    const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)
    const [statusFilter, setStatusFilter] = useState<StatusFilter>(null)
    const [toasts, setToasts] = useState<Toast[]>([])

    const addToast = useCallback((type: Toast["type"], title: string, description?: string) => {
        const id = Date.now().toString()
        setToasts((prev) => [...prev, { id, type, title, description }])
    }, [])

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Command palette: Cmd/Ctrl + K
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault()
                setShowCommandPalette(true)
            }

            // New shipment: Cmd/Ctrl + Shift + N
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "N") {
                e.preventDefault()
                setActiveView("add-shipment")
            }

            // Notifications: Cmd/Ctrl + Shift + .
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === ".") {
                e.preventDefault()
                setShowNotifications(true)
            }

            // Help / shortcuts: ?
            if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
                const target = e.target as HTMLElement
                if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
                    e.preventDefault()
                    setShowKeyboardShortcuts(true)
                }
            }

            // Escape to close modals
            if (e.key === "Escape") {
                setShowCommandPalette(false)
                setShowNotifications(false)
                setShowActivityFeed(false)
                setShowKeyboardShortcuts(false)
                setSelectedShipment(null)
            }

            if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
                const target = e.target as HTMLElement
                if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
                    const views = ["overview", "add-shipment", "shipments", "fleet", "tracking", "analytics", "customers", "reports"]
                    const num = parseInt(e.key)
                    if (num >= 1 && num <= views.length) {
                        setActiveView(views[num - 1])
                    }
                }
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


    const renderMainContent = () => {
        switch (activeView) {
            case "add-shipment":
                return <AddShipmentView />
            case "shipments":
                return <ShipmentsView />
            case "fleet":
                return <FleetView />
            case "tracking":
                return <TrackingView />
            case "analytics":
                return <AnalyticsView />
            case "customers":
                return <CustomersView />
            case "reports":
                return <ReportsView />
            case "settings":
                return <SettingsView />
            default:
                return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <StatsCards onFilterClick={handleFilterClick} activeFilter={statusFilter} />
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            <WorldMap />
                            <ShipmentsList
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
            settings: "Settings",
        }
        return titles[activeView] || "Dashboard"
    }

    return (
        <div className="flex h-screen bg-background">
            <Sidebar
                activeView={activeView}
                onViewChange={handleViewChange}
                onNotificationsClick={() => setShowNotifications(true)}
                onSettingsClick={() => setActiveView("settings")}
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

                <main className="flex-1 overflow-auto p-6">
                    {renderMainContent()}
                </main>
            </div>

            {/* Modals and Overlays */}
            <ShipmentModal
                shipment={selectedShipment}
                isOpen={!!selectedShipment}
                onClose={() => setSelectedShipment(null)}
            />

            <NotificationsPanel
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
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


            {/* Toast Notifications */}
            <div className="fixed bottom-4 right-4 z-50 space-y-2">
                {toasts.map((toast) => (
                    <ToastNotification key={toast.id} {...toast} onClose={removeToast} />
                ))}
            </div>
        </div>
    )
}
