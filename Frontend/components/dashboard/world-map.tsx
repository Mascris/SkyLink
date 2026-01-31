"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type ApiShipment } from "./dashboard-content"
import dynamic from "next/dynamic"

const MapComponent = dynamic(() => import("./leaflet-map"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-900 animate-pulse rounded-lg" />
})

export function WorldMap({ shipments, hubs }: { shipments: any[], hubs: any[] }) {
    // 1. Function to turn "SHA,SIN,DXB" into coordinates [[lat, lng], [lat, lng]]
    const getPathCoords = (pathString: string) => {
        if (!pathString || !hubs.length) return [];
        
        return pathString.split(',').map(code => {
            const hub = hubs.find(h => h.hubCode === code);
            // Remember your DB typo "longtitude"!
            return hub ? [hub.latitude, hub.longtitude] : null;
        }).filter(coord => coord !== null);
    };

    return (
        <Card className="h-full">
            <CardContent className="h-[400px] p-0">
                {/* Ensure your MapComponent (the one with Leaflet) gets everything */}
                <MapComponent 
                    shipments={shipments} 
                    hubs={hubs} 
                    getPathCoords={getPathCoords} 
                />
            </CardContent>
        </Card>
    );
}
