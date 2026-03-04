"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Package, CheckCircle, AlertCircle, MapPin } from "lucide-react"
import { createShipment, fetchHubs, type Hub } from "@/lib/api"

export function AddShipmentView() {
    const [formData, setFormData] = useState({
        label: "",
        currentHub: "",
        destinationHub: "",
        status: "IN_QUEUE",
        consumerName: "",
        deliveryAddress: "",
        containerId: "",
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
                status: formData.status,
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
                status: "IN_QUEUE",
                consumerName: "",
                deliveryAddress: "",
                containerId: `CONT-${year}-${randomId}`,
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
    }: {
        id: string
        label: string
        value: string
        onChange: (v: string) => void
        isOrigin?: boolean
    }) => (
        <div className="space-y-2">
            <Label htmlFor={id} className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {label}
            </Label>
            {hubsLoading ? (
                <div className="flex items-center gap-2 h-10 px-3 rounded-md bg-input border border-border text-muted-foreground text-sm">
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-current" />
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
                    className="w-full h-10 px-3 rounded-md bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                    <option value="" disabled>
                        — Select a hub —
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
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-foreground">Add New Shipment</h1>
                <p className="text-muted-foreground">Create a new shipment and add it to the system</p>
            </div>

            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        Shipment Details
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Success Message */}
                        {success && (
                            <div className="flex items-center gap-2 p-4 rounded-lg bg-emerald-500/20 text-emerald-400">
                                <CheckCircle className="w-5 h-5" />
                                <span>Shipment created successfully!</span>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center gap-2 p-4 rounded-lg bg-red-500/20 text-red-400">
                                <AlertCircle className="w-5 h-5" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Label / Tracking Number */}
                            <div className="space-y-2">
                                <Label htmlFor="label">Tracking Label / ID</Label>
                                <Input
                                    id="label"
                                    placeholder="e.g., SHIP-2026-001"
                                    value={formData.label}
                                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                    required
                                    className="bg-input border-border"
                                />
                            </div>

                            {/* Container ID */}
                            <div className="space-y-2">
                                <Label htmlFor="containerId">Container ID</Label>
                                <Input
                                    id="containerId"
                                    placeholder="e.g., CONT-2026-1234"
                                    value={formData.containerId}
                                    onChange={(e) => setFormData({ ...formData, containerId: e.target.value })}
                                    required
                                    className="bg-input border-border font-mono"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Origin Hub — DB-driven select */}
                            <HubSelect
                                id="currentHub"
                                label="Origin Hub"
                                value={formData.currentHub}
                                onChange={(v) => setFormData({ ...formData, currentHub: v })}
                                isOrigin={true}
                            />

                            {/* Destination Hub — DB-driven select */}
                            <HubSelect
                                id="destinationHub"
                                label="Destination Hub"
                                value={formData.destinationHub}
                                onChange={(v) => setFormData({ ...formData, destinationHub: v })}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Consumer Name */}
                            <div className="space-y-2">
                                <Label htmlFor="consumerName">Consumer Name</Label>
                                <Input
                                    id="consumerName"
                                    placeholder="e.g., John Doe"
                                    value={formData.consumerName}
                                    onChange={(e) => setFormData({ ...formData, consumerName: e.target.value })}
                                    required
                                    className="bg-input border-border"
                                />
                            </div>

                            {/* Status */}
                            <div className="space-y-2">
                                <Label htmlFor="status">Initial Status</Label>
                                <select
                                    id="status"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full h-10 px-3 rounded-md bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    <option value="IN_QUEUE">Pending</option>
                                    <option value="TRANSIT">In Transit</option>
                                    <option value="DELIVERED">Delivered</option>
                                    <option value="DELAYED">Delayed</option>
                                </select>
                            </div>
                        </div>

                        {/* Delivery Address */}
                        <div className="space-y-2">
                            <Label htmlFor="deliveryAddress">Delivery Address</Label>
                            <Input
                                id="deliveryAddress"
                                placeholder="e.g., 123 Main St, Springfield, IL"
                                value={formData.deliveryAddress}
                                onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                                required
                                className="bg-input border-border"
                            />
                        </div>

                        {/* Submit Button */}
                        <Button type="submit" className="w-full" disabled={loading || hubsLoading}>
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                    Creating…
                                </span>
                            ) : (
                                "Create Shipment"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
