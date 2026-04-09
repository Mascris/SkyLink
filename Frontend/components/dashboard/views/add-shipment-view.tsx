"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Ship,
    CheckCircle,
    AlertCircle,
    Anchor,
    Container,
    MapPin,
    Clock,
    FileText,
    User,
    Navigation,
    Calendar,
} from "lucide-react"
import { createShipment, fetchHubs, type Hub } from "@/lib/api"

export function AddShipmentView() {
    const [formData, setFormData] = useState({
        label: "",
        currentHub: "",
        destinationHub: "",
        consumerName: "",
        deliveryAddress: "",
        containerId: "",
        scheduledDeparture: "",
        currentLat: 0,
        currentLng: 0,
    })
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState("")

    // --- DB-driven hub lists ---
    const [hubs, setHubs] = useState<Hub[]>([])
    const [hubsLoading, setHubsLoading] = useState(true)
    const [hubsError, setHubsError] = useState("")

    useEffect(() => {
        const loadHubs = async () => {
            try {
                const data = await fetchHubs()
                setHubs(data)
            } catch (err: any) {
                setHubsError("Could not load hubs from server")
            } finally {
                setHubsLoading(false)
            }
        }
        loadHubs()

        // Pre-generate a Container ID (Faker-style)
        const randomId = Math.floor(1000 + Math.random() * 9000)
        const year = new Date().getFullYear()
        setFormData(prev => ({ ...prev, containerId: `CONT-${year}-${randomId}` }))
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")
        setSuccess(false)

        try {
            await createShipment({
                label: formData.label,
                currentHub: formData.currentHub,
                destinationHub: formData.destinationHub,
                status: "IN_QUEUE",
                progressPercent: 0,
                currentLat: formData.currentLat,
                currentLng: formData.currentLng,
                routePathJson: "[]",
                consumerName: formData.consumerName,
                deliveryAddress: formData.deliveryAddress,
                containerId: formData.containerId,
            })
            setSuccess(true)

            // Generate new container ID for next shipment
            const randomId = Math.floor(1000 + Math.random() * 9000)
            const year = new Date().getFullYear()

            setFormData({
                label: "",
                currentHub: "",
                destinationHub: "",
                consumerName: "",
                deliveryAddress: "",
                containerId: `CONT-${year}-${randomId}`,
                scheduledDeparture: "",
                currentLat: 0,
                currentLng: 0,
            })
        } catch (err: any) {
            setError(err.message || "Failed to create shipment")
        } finally {
            setLoading(false)
        }
    }

    const HubSelect = ({
        id,
        label,
        value,
        onChange,
        isOrigin = false,
        icon: Icon = MapPin,
    }: {
        id: string
        label: string
        value: string
        onChange: (v: string) => void
        isOrigin?: boolean
        icon?: React.ElementType
    }) => (
        <div className="space-y-2">
            <Label htmlFor={id} className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <Icon className="w-3.5 h-3.5 text-cyan-400" />
                {label}
            </Label>
            {hubsLoading ? (
                <div className="flex items-center gap-2 h-10 px-3 rounded-md bg-slate-800/50 border border-slate-700 text-muted-foreground text-sm">
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-cyan-400" />
                    Loading hubs…
                </div>
            ) : hubsError ? (
                <div className="flex items-center gap-2 h-10 px-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {hubsError}
                </div>
            ) : (
                <select
                    id={id}
                    value={value}
                    onChange={(e) => {
                        const code = e.target.value
                        onChange(code)

                        // Auto-fill lat/lng if it's the origin hub
                        if (isOrigin) {
                            const hub = hubs.find(h => h.hubCode === code)
                            if (hub) {
                                setFormData(prev => ({
                                    ...prev,
                                    currentLat: hub.latitude,
                                    currentLng: hub.longtitude // note: DB typo preserved
                                }))
                            }
                        }
                    }}
                    required
                    className="w-full h-10 px-3 rounded-md bg-slate-800/50 border border-slate-700 text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-colors"
                >
                    <option value="" disabled>
                        — Select Port —
                    </option>
                    {hubs.map((hub) => (
                        <option key={hub.hubCode} value={hub.hubCode}>
                            {hub.city}, {hub.country} ({hub.hubCode})
                        </option>
                    ))}
                </select>
            )}
        </div>
    )

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        <FileText className="w-7 h-7 text-cyan-400" />
                        Customs Declaration Form
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">Register a new cargo manifest into the SkyLink network</p>
                </div>
                <div className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded px-2 py-1">
                    <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-wider">Status: IN_QUEUE</span>
                </div>
            </div>

            <Card className="bg-card/80 backdrop-blur-sm border-cyan-500/10">
                <CardHeader className="border-b border-slate-700/50 pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Ship className="w-5 h-5 text-cyan-400" />
                            Shipment Manifest
                        </CardTitle>
                        <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
                            <span>FORM REV: 3.1</span>
                            <span>·</span>
                            <span>SKYLINK-DECL</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Success Message */}
                        {success && (
                            <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-sm">Manifest Registered Successfully</p>
                                    <p className="text-xs text-emerald-400/70">Shipment has been queued for assignment.</p>
                                </div>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-sm">Declaration Failed</p>
                                    <p className="text-xs text-red-400/70">{error}</p>
                                </div>
                            </div>
                        )}

                        {/* Section: Identification */}
                        <div>
                            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                                <div className="w-1 h-4 bg-cyan-500 rounded-full" />
                                Section A — Cargo Identification
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="label" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
                                        <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                                        Tracking Label / ID
                                    </Label>
                                    <Input
                                        id="label"
                                        placeholder="e.g., SHIP-2026-001"
                                        value={formData.label}
                                        onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                        required
                                        className="bg-slate-800/50 border-slate-700 focus:ring-cyan-500/50 focus:border-cyan-500/50 font-mono"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="containerId" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
                                        <Container className="w-3.5 h-3.5 text-cyan-400" />
                                        Container ID
                                    </Label>
                                    <Input
                                        id="containerId"
                                        placeholder="e.g., CONT-2026-1234"
                                        value={formData.containerId}
                                        onChange={(e) => setFormData({ ...formData, containerId: e.target.value })}
                                        required
                                        className="bg-slate-800/50 border-slate-700 focus:ring-cyan-500/50 focus:border-cyan-500/50 font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section: Route */}
                        <div>
                            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                                <div className="w-1 h-4 bg-blue-500 rounded-full" />
                                Section B — Route Declaration
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <HubSelect
                                    id="currentHub"
                                    label="Port of Origin"
                                    value={formData.currentHub}
                                    onChange={(v) => setFormData({ ...formData, currentHub: v })}
                                    isOrigin={true}
                                    icon={Anchor}
                                />
                                <HubSelect
                                    id="destinationHub"
                                    label="Port of Destination"
                                    value={formData.destinationHub}
                                    onChange={(v) => setFormData({ ...formData, destinationHub: v })}
                                    icon={MapPin}
                                />
                            </div>
                        </div>

                        {/* Section: Consignee */}
                        <div>
                            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                                <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                                Section C — Consignee Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="consumerName" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5 text-cyan-400" />
                                        Consignee Name
                                    </Label>
                                    <Input
                                        id="consumerName"
                                        placeholder="e.g., John Doe"
                                        value={formData.consumerName}
                                        onChange={(e) => setFormData({ ...formData, consumerName: e.target.value })}
                                        required
                                        className="bg-slate-800/50 border-slate-700 focus:ring-cyan-500/50 focus:border-cyan-500/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="deliveryAddress" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                                        Delivery Address
                                    </Label>
                                    <Input
                                        id="deliveryAddress"
                                        placeholder="e.g., 123 Main St, Springfield, IL"
                                        value={formData.deliveryAddress}
                                        onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                                        required
                                        className="bg-slate-800/50 border-slate-700 focus:ring-cyan-500/50 focus:border-cyan-500/50"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section: Schedule */}
                        <div>
                            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                                <div className="w-1 h-4 bg-amber-500 rounded-full" />
                                Section D — Scheduled Launch Timer
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="scheduledDeparture" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                                        Estimated Departure Time
                                    </Label>
                                    <Input
                                        id="scheduledDeparture"
                                        type="datetime-local"
                                        value={formData.scheduledDeparture}
                                        onChange={(e) => setFormData({ ...formData, scheduledDeparture: e.target.value })}
                                        className="bg-slate-800/50 border-slate-700 focus:ring-cyan-500/50 focus:border-cyan-500/50 font-mono text-amber-400"
                                    />
                                    <p className="text-[10px] text-muted-foreground">Optional. The vessel will depart at this time if set.</p>
                                </div>
                                <div className="space-y-2 flex items-end">
                                    <div className="w-full p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                            <span className="text-[10px] text-muted-foreground uppercase font-semibold">Auto-Assigned</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Initial status: <span className="text-cyan-400 font-mono font-bold">IN_QUEUE</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Ship & ETA: <span className="text-blue-400 font-mono">Assigned automatically</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4 border-t border-slate-700/50">
                            <Button
                                type="submit"
                                className="w-full h-12 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm tracking-wide transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:shadow-[0_0_25px_rgba(6,182,212,0.3)]"
                                disabled={loading || hubsLoading}
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                        Registering Manifest…
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Ship className="w-5 h-5" />
                                        Submit Customs Declaration
                                    </span>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
