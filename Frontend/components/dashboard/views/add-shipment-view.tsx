"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Package, CheckCircle, AlertCircle } from "lucide-react"
import { createShipment } from "@/lib/api"

export function AddShipmentView() {
    const [formData, setFormData] = useState({
        label: "",
        currentHub: "",
        destinationHub: "",
        status: "pending",
    })
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState("")

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
            })
            setSuccess(true)
            setFormData({
                label: "",
                currentHub: "",
                destinationHub: "",
                status: "pending",
            })
        } catch (err: any) {
            setError(err.message || "Failed to create shipment")
        } finally {
            setLoading(false)
        }
    }

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

                        {/* Origin Hub */}
                        <div className="space-y-2">
                            <Label htmlFor="currentHub">Origin Hub</Label>
                            <Input
                                id="currentHub"
                                placeholder="e.g., New York, USA"
                                value={formData.currentHub}
                                onChange={(e) => setFormData({ ...formData, currentHub: e.target.value })}
                                required
                                className="bg-input border-border"
                            />
                        </div>

                        {/* Destination Hub */}
                        <div className="space-y-2">
                            <Label htmlFor="destinationHub">Destination Hub</Label>
                            <Input
                                id="destinationHub"
                                placeholder="e.g., Los Angeles, USA"
                                value={formData.destinationHub}
                                onChange={(e) => setFormData({ ...formData, destinationHub: e.target.value })}
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
                                className="w-full h-10 px-3 rounded-md bg-input border border-border text-foreground"
                            >
                                <option value="pending">Pending</option>
                                <option value="in-transit">In Transit</option>
                                <option value="delivered">Delivered</option>
                                <option value="delayed">Delayed</option>
                            </select>
                        </div>

                        {/* Submit Button */}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Creating...
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
