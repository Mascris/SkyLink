"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchActiveShipments, fetchHubs, type Shipment, type Hub } from "@/lib/api"
import dynamic from "next/dynamic"

// Dynamically import the map to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import("./leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-[300px] flex items-center justify-center bg-secondary/30 rounded-lg">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  ),
})

interface ShipmentLocation {
  id: string
  label: string
  origin: { lat: number; lng: number; name: string }
  destination: { lat: number; lng: number; name: string }
  status: string
  progress: number
}

function getHubCoordinates(hubCode: string, hubs: Hub[]): { lat: number; lng: number } | null {
  const hub = hubs.find(h => h.hubCode === hubCode)
  if (hub && hub.latitude && hub.longtitude) {
    return { lat: hub.latitude, lng: hub.longtitude }
  }
  return null
}

function normalizeStatus(status: string): string {
  const s = status?.toLowerCase().replace(/_/g, "-") || "pending"
  if (s.includes("transit")) return "in-transit"
  if (s.includes("deliver")) return "delivered"
  if (s.includes("delay")) return "delayed"
  if (s.includes("pend")) return "pending"
  return s
}

export function WorldMap() {
  const [shipments, setShipments] = useState<ShipmentLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, inTransit: 0 })

  useEffect(() => {
    const loadShipments = async () => {
      try {
        // Fetch both shipments and hubs
        const [shipmentsData, hubsData] = await Promise.all([
          fetchActiveShipments(),
          fetchHubs()
        ])

        const mapped: ShipmentLocation[] = shipmentsData
          .map((s: Shipment) => {
            const originCoords = getHubCoordinates(s.currentHub, hubsData)
            const destCoords = getHubCoordinates(s.destinationHub, hubsData)

            if (!originCoords || !destCoords) return null

            return {
              id: s.shipmentId,
              label: s.label,
              origin: { ...originCoords, name: s.currentHub },
              destination: { ...destCoords, name: s.destinationHub },
              status: normalizeStatus(s.status),
              progress: s.progressPercent || Math.floor(Math.random() * 100),
            }
          })
          .filter((s): s is ShipmentLocation => s !== null)
          .slice(0, 50) // Limit to 50 routes for performance

        setShipments(mapped)
        setStats({
          total: shipmentsData.length,
          inTransit: shipmentsData.filter((s: Shipment) => normalizeStatus(s.status) === "in-transit").length,
        })
        setLoading(false)
      } catch (err) {
        console.error("Failed to load shipments for map", err)
        setLoading(false)
      }
    }
    loadShipments()
  }, [])

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Global Tracking</CardTitle>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-muted-foreground">Origin</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">In Transit ({stats.inTransit})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Destination</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-4">
        <div className="h-full min-h-[300px] rounded-lg overflow-hidden border border-border">
          {loading ? (
            <div className="h-full flex items-center justify-center bg-secondary/30">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <MapComponent shipments={shipments} />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
