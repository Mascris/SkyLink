"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface ShipmentLocation {
    id: string
    label: string
    origin: { lat: number; lng: number; name: string }
    destination: { lat: number; lng: number; name: string }
    status: string
    progress: number
}

interface LeafletMapProps {
    shipments: ShipmentLocation[]
}

// Fix for Leaflet marker icons in Next.js
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

// Calculate current position based on progress
function getCurrentPosition(origin: { lat: number; lng: number }, dest: { lat: number; lng: number }, progress: number) {
    const t = progress / 100
    return {
        lat: origin.lat + (dest.lat - origin.lat) * t,
        lng: origin.lng + (dest.lng - origin.lng) * t,
    }
}

// Create curved path between two points
function createCurvedPath(start: { lat: number; lng: number }, end: { lat: number; lng: number }): [number, number][] {
    const points: [number, number][] = []
    const midLat = (start.lat + end.lat) / 2
    const midLng = (start.lng + end.lng) / 2

    // Calculate curve height based on distance
    const distance = Math.sqrt(Math.pow(end.lat - start.lat, 2) + Math.pow(end.lng - start.lng, 2))
    const curveHeight = distance * 0.15

    // Add curve offset perpendicular to the line
    const angle = Math.atan2(end.lng - start.lng, end.lat - start.lat)
    const offsetLat = curveHeight * Math.cos(angle + Math.PI / 2)
    const offsetLng = curveHeight * Math.sin(angle + Math.PI / 2)

    const segments = 20
    for (let i = 0; i <= segments; i++) {
        const t = i / segments
        // Quadratic bezier curve
        const lat = (1 - t) * (1 - t) * start.lat + 2 * (1 - t) * t * (midLat + offsetLat) + t * t * end.lat
        const lng = (1 - t) * (1 - t) * start.lng + 2 * (1 - t) * t * (midLng + offsetLng) + t * t * end.lng
        points.push([lat, lng])
    }

    return points
}

function MapController() {
    const map = useMap()

    useEffect(() => {
        // Disable scroll zoom for better UX, enable on click
        map.scrollWheelZoom.disable()

        map.on("click", () => {
            map.scrollWheelZoom.enable()
        })

        map.on("mouseout", () => {
            map.scrollWheelZoom.disable()
        })
    }, [map])

    return null
}

export default function LeafletMap({ shipments }: LeafletMapProps) {
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
                const curvedPath = createCurvedPath(shipment.origin, shipment.destination)
                const currentPos = getCurrentPosition(shipment.origin, shipment.destination, shipment.progress)

                return (
                    <div key={shipment.id}>
                        {/* Route line */}
                        <Polyline
                            positions={curvedPath}
                            pathOptions={{
                                color: shipment.status === "in-transit" ? "#3b82f6" :
                                    shipment.status === "delivered" ? "#10b981" :
                                        shipment.status === "delayed" ? "#ef4444" : "#f59e0b",
                                weight: 2,
                                opacity: 0.7,
                                dashArray: shipment.status === "in-transit" ? "5, 10" : undefined,
                            }}
                        />

                        {/* Origin marker */}
                        <Marker position={[shipment.origin.lat, shipment.origin.lng]} icon={originIcon}>
                            <Popup>
                                <div className="text-sm">
                                    <p className="font-semibold">{shipment.origin.name}</p>
                                    <p className="text-gray-600">Origin</p>
                                    <p className="text-xs text-gray-500">{shipment.label}</p>
                                </div>
                            </Popup>
                        </Marker>

                        {/* Destination marker */}
                        <Marker position={[shipment.destination.lat, shipment.destination.lng]} icon={destinationIcon}>
                            <Popup>
                                <div className="text-sm">
                                    <p className="font-semibold">{shipment.destination.name}</p>
                                    <p className="text-gray-600">Destination</p>
                                    <p className="text-xs text-gray-500">{shipment.label}</p>
                                </div>
                            </Popup>
                        </Marker>

                        {/* Current position marker (if in transit) */}
                        {shipment.status === "in-transit" && shipment.progress < 100 && (
                            <Marker position={[currentPos.lat, currentPos.lng]} icon={transitIcon}>
                                <Popup>
                                    <div className="text-sm">
                                        <p className="font-semibold">{shipment.label}</p>
                                        <p className="text-gray-600">In Transit - {shipment.progress}%</p>
                                        <p className="text-xs text-gray-500">
                                            {shipment.origin.name} → {shipment.destination.name}
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
