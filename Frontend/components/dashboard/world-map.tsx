"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import dynamic from "next/dynamic"

const MapComponent = dynamic(() => import("./leaflet-map"), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full bg-[#111d35] animate-pulse rounded-lg flex items-center justify-center">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-400/20 border-t-blue-400/60 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-[10px] font-mono text-blue-400/50 uppercase tracking-wider">Initializing Radar</p>
            </div>
        </div>
    )
})

interface WorldMapProps {
    shipments: any[]
    hubs: any[]
    focusedShipmentId?: string | null
    /** When true, fill parent height with no Card wrapper */
    fullscreen?: boolean
}

export function WorldMap({ shipments, hubs, focusedShipmentId, fullscreen = false }: WorldMapProps) {
    /** ISOLATION MODE: if a ship is focused, show only that one */
    const visibleShipments = useMemo(() => {
        if (focusedShipmentId) {
            return shipments.filter(s => s.shipmentId === focusedShipmentId)
        }
        return shipments
    }, [shipments, focusedShipmentId])

    const getPathCoords = (pathString: string) => {
        if (!pathString || !hubs.length) return [];
        return pathString.split(',').map(code => {
            const hub = hubs.find((h: any) => h.hubCode === code);
            return hub ? [hub.latitude, hub.longtitude] : null;
        }).filter((coord): coord is [number, number] => coord !== null);
    };

    const mapEl = (
        <div className="relative h-full w-full">
            {/* Status badge */}
            <div className="absolute top-2 left-2 z-[1000] flex items-center gap-1.5 bg-[#111d35]/90 backdrop-blur-sm px-2 py-1 rounded border border-[#1e3050]">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full maritime-glow" />
                <span className="text-[9px] font-mono text-blue-400 uppercase tracking-wider">
                    {focusedShipmentId ? "Isolation Mode" : "Live Radar"}
                </span>
            </div>
            {/* Isolation label */}
            {focusedShipmentId && (
                <div className="absolute top-2 right-2 z-[1000] flex items-center gap-1.5 bg-amber-400/10 backdrop-blur-sm px-2 py-1 rounded border border-amber-400/30">
                    <span className="text-[9px] font-mono text-amber-400 uppercase tracking-wider">1 Vessel Isolated</span>
                </div>
            )}
            <MapComponent
                shipments={visibleShipments}
                hubs={hubs}
                getPathCoords={getPathCoords}
                focusedShipmentId={focusedShipmentId}
            />
        </div>
    )

    if (fullscreen) {
        return <div className="h-full w-full rounded-lg overflow-hidden">{mapEl}</div>
    }

    return (
        <Card className="h-full border-[#1e3050] bg-[#111d35] overflow-hidden">
            <CardContent className="h-full p-0 relative overflow-hidden rounded-lg">
                {mapEl}
            </CardContent>
        </Card>
    );
}
