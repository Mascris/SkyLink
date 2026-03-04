"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface Hub {
    hubCode: string
    city: string
    country: string
    latitude: number
    longtitude: number // note: DB typo preserved
}

interface ApiShipment {
    shipmentId: string
    label: string
    currentHub: string
    destinationHub: string
    status: string
    progressPercent: number
    currentLat: number
    currentLng: number
    routePathJson: string
}

interface LeafletMapProps {
    shipments: ApiShipment[]
    hubs: Hub[]
    getPathCoords?: (path: string) => any[]
}

// Marker icons
const originIcon = new L.DivIcon({
    className: "custom-div-icon",
    html: `<div style="background-color: hsl(var(--primary)); width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
})

const destinationIcon = new L.DivIcon({
    className: "custom-div-icon",
    html: `<div style="background-color: #10b981; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
})

const transitIcon = new L.DivIcon({
    className: "custom-div-icon",
    html: `<div style="background-color: #3b82f6; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
})

// Create curved path between two lat/lng points
function createCurvedPath(
    start: { lat: number; lng: number },
    end: { lat: number; lng: number }
): [number, number][] {
    const points: [number, number][] = []
    const midLat = (start.lat + end.lat) / 2
    const midLng = (start.lng + end.lng) / 2

    const distance = Math.sqrt(
        Math.pow(end.lat - start.lat, 2) + Math.pow(end.lng - start.lng, 2)
    )
    const curveHeight = distance * 0.15
    const angle = Math.atan2(end.lng - start.lng, end.lat - start.lat)
    const offsetLat = curveHeight * Math.cos(angle + Math.PI / 2)
    const offsetLng = curveHeight * Math.sin(angle + Math.PI / 2)

    const segments = 20
    for (let i = 0; i <= segments; i++) {
        const t = i / segments
        const lat = (1 - t) * (1 - t) * start.lat + 2 * (1 - t) * t * (midLat + offsetLat) + t * t * end.lat
        const lng = (1 - t) * (1 - t) * start.lng + 2 * (1 - t) * t * (midLng + offsetLng) + t * t * end.lng
        points.push([lat, lng])
    }
    return points
}

function MapController() {
    const map = useMap()
    useEffect(() => {
        map.scrollWheelZoom.disable()
        map.on("click", () => map.scrollWheelZoom.enable())
        map.on("mouseout", () => map.scrollWheelZoom.disable())
    }, [map])
    return null
}

export default function LeafletMap({ shipments, hubs }: LeafletMapProps) {
    // Build a hub lookup map for fast code → coords resolution
    const hubMap = new Map<string, Hub>()
    hubs.forEach(h => hubMap.set(h.hubCode, h))

    const statusColor = (status: string) => {
        switch (status) {
            case "TRANSIT": return "#3b82f6"
            case "DELIVERED": return "#10b981"
            case "DELAYED": return "#ef4444"
            default: return "#f59e0b"
        }
    }

    return (
        <MapContainer
            center={[20, 0]}
            zoom={2}
            style={{ height: "100%", width: "100%", minHeight: "300px" }}
            className="rounded-lg"
        >
            <MapController />
            <TileLayer
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {shipments.map((shipment) => {
                const originHub = hubMap.get(shipment.currentHub)
                const destHub = hubMap.get(shipment.destinationHub)

                // Skip drawing if we can't resolve hub coordinates
                if (!originHub || !destHub) return null

                const origin = { lat: originHub.latitude, lng: originHub.longtitude }
                const dest = { lat: destHub.latitude, lng: destHub.longtitude }
                const curvedPath = createCurvedPath(origin, dest)

                // Interpolated current position
                const t = (shipment.progressPercent ?? 0) / 100
                const currentPos = {
                    lat: origin.lat + (dest.lat - origin.lat) * t,
                    lng: origin.lng + (dest.lng - origin.lng) * t,
                }

                return (
                    <div key={shipment.shipmentId}>
                        {/* Route curve */}
                        <Polyline
                            positions={curvedPath}
                            pathOptions={{
                                color: statusColor(shipment.status),
                                weight: 2,
                                opacity: 0.7,
                                dashArray: shipment.status === "TRANSIT" ? "5, 10" : undefined,
                            }}
                        />

                        {/* Origin marker */}
                        <Marker position={[origin.lat, origin.lng]} icon={originIcon}>
                            <Popup>
                                <div className="text-sm">
                                    <p className="font-semibold">{originHub.city}, {originHub.country}</p>
                                    <p className="text-gray-600">Origin Hub · {shipment.currentHub}</p>
                                    <p className="text-xs text-gray-500">{shipment.label}</p>
                                </div>
                            </Popup>
                        </Marker>

                        {/* Destination marker */}
                        <Marker position={[dest.lat, dest.lng]} icon={destinationIcon}>
                            <Popup>
                                <div className="text-sm">
                                    <p className="font-semibold">{destHub.city}, {destHub.country}</p>
                                    <p className="text-gray-600">Destination Hub · {shipment.destinationHub}</p>
                                    <p className="text-xs text-gray-500">{shipment.label}</p>
                                </div>
                            </Popup>
                        </Marker>

                        {/* Current position marker (in transit only) */}
                        {shipment.status === "TRANSIT" && (shipment.progressPercent ?? 0) < 100 && (
                            <Marker position={[currentPos.lat, currentPos.lng]} icon={transitIcon}>
                                <Popup>
                                    <div className="text-sm">
                                        <p className="font-semibold">{shipment.label}</p>
                                        <p className="text-gray-600">In Transit — {shipment.progressPercent}%</p>
                                        <p className="text-xs text-gray-500">
                                            {originHub.city} → {destHub.city}
                                        </p>
                                    </div>
                                </Popup>
                            </Marker>
                        )}
                    </div>
                )
            })}
        </MapContainer>
    )
}
