"use client"

import { useEffect, useMemo } from "react"
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

/** Maximum shipments to render on the map at once */
const MAX_MAP_SHIPMENTS = 50

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

// ─────────────────────────────────────────────────────────────────────────────
// SEA-LANE GRAPH — Maritime waypoints connected as ships actually sail
// ─────────────────────────────────────────────────────────────────────────────

interface SeaNode {
    id: string
    lat: number
    lng: number
}

// Key maritime nodes covering major shipping lanes
const SEA_NODES: SeaNode[] = [
    // North Atlantic & Europe
    { id: "english_channel", lat: 50, lng: -1 },
    { id: "biscay", lat: 45, lng: -5 },
    { id: "lisbon_offshore", lat: 38.5, lng: -10 },
    { id: "gibraltar", lat: 36, lng: -5.5 },
    { id: "north_sea", lat: 55, lng: 5 },

    // Mediterranean — detailed chain to avoid land
    { id: "west_med", lat: 38, lng: 2 },
    { id: "sardinia_south", lat: 37.5, lng: 9 },
    { id: "sicily_south", lat: 35.5, lng: 14 },
    { id: "crete_south", lat: 34, lng: 24 },
    { id: "east_med", lat: 33, lng: 32 },

    // Suez & Red Sea
    { id: "suez_north", lat: 31, lng: 32.5 },
    { id: "suez_south", lat: 28, lng: 33.5 },
    { id: "red_sea_mid", lat: 20, lng: 38 },
    { id: "bab_el_mandeb", lat: 12.5, lng: 43.5 },

    // Arabian Sea & Indian Ocean
    { id: "gulf_of_aden", lat: 12, lng: 48 },
    { id: "arabian_sea", lat: 15, lng: 60 },
    { id: "mumbai_offshore", lat: 18, lng: 70 },
    { id: "mid_indian", lat: 0, lng: 75 },
    { id: "sri_lanka", lat: 6, lng: 80 },

    // Persian Gulf
    { id: "hormuz", lat: 26, lng: 56.5 },
    { id: "persian_gulf", lat: 27, lng: 51 },

    // Southeast Asia
    { id: "malacca_west", lat: 4, lng: 95 },
    { id: "malacca_east", lat: 1.5, lng: 104 },
    { id: "singapore", lat: 1.2, lng: 103.8 },
    { id: "south_china_sea", lat: 10, lng: 112 },
    { id: "hong_kong_offshore", lat: 21, lng: 114.5 },
    { id: "taiwan_strait", lat: 24, lng: 119 },
    { id: "east_china_sea", lat: 30, lng: 125 },
    { id: "korea_strait", lat: 34, lng: 129 },
    { id: "japan_east", lat: 35, lng: 140 },

    // Pacific
    { id: "west_pacific", lat: 25, lng: 150 },
    { id: "mid_pacific", lat: 30, lng: -170 },
    { id: "hawaii", lat: 20, lng: -155 },

    // African coast & Cape route
    { id: "mozambique", lat: -20, lng: 40 },
    { id: "south_africa_east", lat: -33, lng: 30 },
    { id: "cape_good_hope", lat: -35, lng: 18 },
    { id: "south_africa_west", lat: -32, lng: 15 },
    { id: "west_africa", lat: 5, lng: -5 },
    { id: "canary_islands", lat: 28, lng: -15 },

    // South Atlantic
    { id: "mid_atlantic_south", lat: -15, lng: -20 },
    { id: "brazil_offshore", lat: -23, lng: -40 },

    // Americas
    { id: "us_east_north", lat: 40, lng: -70 },
    { id: "us_east_south", lat: 30, lng: -78 },
    { id: "caribbean", lat: 18, lng: -75 },
    { id: "panama_atlantic", lat: 9.5, lng: -79.5 },
    { id: "panama_pacific", lat: 8.5, lng: -79.5 },
    { id: "us_west", lat: 34, lng: -120 },
    { id: "mid_atlantic_north", lat: 42, lng: -40 },

    // North Europe / Baltic
    { id: "rotterdam_offshore", lat: 52, lng: 4 },
    { id: "hamburg_offshore", lat: 54, lng: 8 },
]

// Adjacency graph: which nodes connect to which
const SEA_EDGES: [string, string][] = [
    // North Sea / English Channel chain
    ["north_sea", "english_channel"],
    ["north_sea", "rotterdam_offshore"],
    ["north_sea", "hamburg_offshore"],
    ["english_channel", "biscay"],
    ["biscay", "lisbon_offshore"],
    ["lisbon_offshore", "gibraltar"],
    ["lisbon_offshore", "canary_islands"],

    // Mediterranean chain (hugging the sea, avoiding land)
    ["gibraltar", "west_med"],
    ["west_med", "sardinia_south"],
    ["sardinia_south", "sicily_south"],
    ["sicily_south", "crete_south"],
    ["crete_south", "east_med"],
    ["east_med", "suez_north"],

    // Suez Canal & Red Sea
    ["suez_north", "suez_south"],
    ["suez_south", "red_sea_mid"],
    ["red_sea_mid", "bab_el_mandeb"],
    ["bab_el_mandeb", "gulf_of_aden"],

    // Indian Ocean
    ["gulf_of_aden", "arabian_sea"],
    ["arabian_sea", "mumbai_offshore"],
    ["arabian_sea", "mid_indian"],
    ["mumbai_offshore", "sri_lanka"],
    ["sri_lanka", "mid_indian"],
    ["mid_indian", "malacca_west"],

    // Persian Gulf
    ["gulf_of_aden", "hormuz"],
    ["arabian_sea", "hormuz"],
    ["hormuz", "persian_gulf"],

    // Southeast Asia chain
    ["malacca_west", "malacca_east"],
    ["malacca_east", "singapore"],
    ["singapore", "south_china_sea"],
    ["south_china_sea", "hong_kong_offshore"],
    ["hong_kong_offshore", "taiwan_strait"],
    ["taiwan_strait", "east_china_sea"],
    ["east_china_sea", "korea_strait"],
    ["korea_strait", "japan_east"],

    // Pacific
    ["japan_east", "west_pacific"],
    ["west_pacific", "mid_pacific"],
    ["mid_pacific", "hawaii"],
    ["hawaii", "us_west"],
    ["us_west", "panama_pacific"],

    // Cape route (Africa)
    ["gulf_of_aden", "mozambique"],
    ["mozambique", "south_africa_east"],
    ["south_africa_east", "cape_good_hope"],
    ["cape_good_hope", "south_africa_west"],
    ["south_africa_west", "west_africa"],
    ["west_africa", "canary_islands"],
    ["canary_islands", "gibraltar"],

    // Atlantic crossings
    ["canary_islands", "caribbean"],
    ["mid_atlantic_north", "us_east_north"],
    ["mid_atlantic_north", "lisbon_offshore"],
    ["us_east_north", "us_east_south"],
    ["us_east_south", "caribbean"],
    ["caribbean", "panama_atlantic"],
    ["panama_atlantic", "panama_pacific"],
    ["south_africa_west", "mid_atlantic_south"],
    ["mid_atlantic_south", "brazil_offshore"],
    ["brazil_offshore", "caribbean"],
    ["us_east_north", "mid_atlantic_north"],
    ["english_channel", "mid_atlantic_north"],

    // Direct Europe-Americas links
    ["rotterdam_offshore", "north_sea"],
    ["hamburg_offshore", "north_sea"],
]

// Build adjacency map once
const adjacency = new Map<string, Set<string>>()
const nodeById = new Map<string, SeaNode>()
SEA_NODES.forEach(n => nodeById.set(n.id, n))
SEA_EDGES.forEach(([a, b]) => {
    if (!adjacency.has(a)) adjacency.set(a, new Set())
    if (!adjacency.has(b)) adjacency.set(b, new Set())
    adjacency.get(a)!.add(b)
    adjacency.get(b)!.add(a)
})

/** Haversine-style Euclidean distance */
function dist(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
    return Math.sqrt(Math.pow(a.lat - b.lat, 2) + Math.pow(a.lng - b.lng, 2))
}

/** Find the nearest sea node to a given lat/lng */
function nearestNode(pos: { lat: number; lng: number }): string {
    let best = SEA_NODES[0]
    let bestDist = dist(pos, best)
    for (const n of SEA_NODES) {
        const d = dist(pos, n)
        if (d < bestDist) {
            best = n
            bestDist = d
        }
    }
    return best.id
}

/**
 * Dijkstra's shortest path through the sea-lane graph.
 * Returns list of sea nodes from startNode to endNode.
 */
function dijkstra(startId: string, endId: string): SeaNode[] {
    if (startId === endId) {
        const node = nodeById.get(startId)
        return node ? [node] : []
    }

    const distances = new Map<string, number>()
    const previous = new Map<string, string | null>()
    const visited = new Set<string>()

    for (const node of SEA_NODES) {
        distances.set(node.id, Infinity)
        previous.set(node.id, null)
    }
    distances.set(startId, 0)

    while (true) {
        // Find unvisited node with smallest distance
        let current: string | null = null
        let currentDist = Infinity
        for (const [id, d] of distances) {
            if (!visited.has(id) && d < currentDist) {
                current = id
                currentDist = d
            }
        }

        if (!current || current === endId) break

        visited.add(current)
        const neighbors = adjacency.get(current) || new Set()

        for (const neighbor of neighbors) {
            if (visited.has(neighbor)) continue
            const nNode = nodeById.get(neighbor)
            const cNode = nodeById.get(current)
            if (!nNode || !cNode) continue

            const alt = currentDist + dist(cNode, nNode)
            if (alt < (distances.get(neighbor) ?? Infinity)) {
                distances.set(neighbor, alt)
                previous.set(neighbor, current)
            }
        }
    }

    // Reconstruct path
    const path: SeaNode[] = []
    let step: string | null = endId
    while (step) {
        const node = nodeById.get(step)
        if (node) path.unshift(node)
        step = previous.get(step) ?? null
    }

    // If no path found, return empty
    if (path.length === 0 || path[0].id !== startId) return []
    return path
}

/** Creates a smooth Catmull-Rom curve through waypoints. */
function createSmoothPath(waypoints: { lat: number; lng: number }[]): [number, number][] {
    if (waypoints.length < 2) return waypoints.map(w => [w.lat, w.lng] as [number, number])

    const result: [number, number][] = []
    const segmentsPerLeg = 6

    for (let i = 0; i < waypoints.length - 1; i++) {
        const p0 = waypoints[Math.max(0, i - 1)]
        const p1 = waypoints[i]
        const p2 = waypoints[i + 1]
        const p3 = waypoints[Math.min(waypoints.length - 1, i + 2)]

        for (let s = 0; s <= (i === waypoints.length - 2 ? segmentsPerLeg : segmentsPerLeg - 1); s++) {
            const t = s / segmentsPerLeg
            const lat = 0.5 * (
                2 * p1.lat +
                (-p0.lat + p2.lat) * t +
                (2 * p0.lat - 5 * p1.lat + 4 * p2.lat - p3.lat) * t * t +
                (-p0.lat + 3 * p1.lat - 3 * p2.lat + p3.lat) * t * t * t
            )
            const lng = 0.5 * (
                2 * p1.lng +
                (-p0.lng + p2.lng) * t +
                (2 * p0.lng - 5 * p1.lng + 4 * p2.lng - p3.lng) * t * t +
                (-p0.lng + 3 * p1.lng - 3 * p2.lng + p3.lng) * t * t * t
            )
            result.push([lat, lng])
        }
    }

    return result
}

/**
 * Builds a sea route between two coastal hubs.
 * Uses Dijkstra on the sea-lane graph so routes follow real waterways.
 */
function buildSeaRoute(
    start: { lat: number; lng: number },
    end: { lat: number; lng: number }
): [number, number][] {
    const directDist = dist(start, end)

    // Very short routes — simple arc (same port area)
    if (directDist < 8) {
        return createSimpleArc(start, end)
    }

    // Find nearest sea-graph nodes
    const startNodeId = nearestNode(start)
    const endNodeId = nearestNode(end)

    // Get shortest path through sea-lane graph
    const seaPath = dijkstra(startNodeId, endNodeId)

    if (seaPath.length < 2) {
        // Fallback: simple arc if graph can't route
        return createSimpleArc(start, end)
    }

    // Build full path: actual start → sea route → actual end
    const fullPath: { lat: number; lng: number }[] = [
        start,
        ...seaPath,
        end,
    ]

    return createSmoothPath(fullPath)
}

/** Simple arc for very short-distance routes. */
function createSimpleArc(
    start: { lat: number; lng: number },
    end: { lat: number; lng: number }
): [number, number][] {
    const points: [number, number][] = []
    const midLat = (start.lat + end.lat) / 2
    const midLng = (start.lng + end.lng) / 2
    const distance = dist(start, end)
    const curveHeight = distance * 0.2
    const angle = Math.atan2(end.lng - start.lng, end.lat - start.lat)
    const offsetLat = curveHeight * Math.cos(angle + Math.PI / 2)
    const offsetLng = curveHeight * Math.sin(angle + Math.PI / 2)

    const segments = 10
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
    const hubMap = useMemo(() => {
        const m = new Map<string, Hub>()
        hubs.forEach(h => m.set(h.hubCode, h))
        return m
    }, [hubs])

    const statusColor = (status: string) => {
        switch (status) {
            case "TRANSIT": return "#3b82f6"
            case "DELIVERED": return "#10b981"
            case "DELAYED": return "#ef4444"
            default: return "#f59e0b"
        }
    }

    // Prioritize TRANSIT shipments, then cap to MAX_MAP_SHIPMENTS
    const visibleShipments = useMemo(() => {
        const sorted = [...shipments].sort((a, b) => {
            const priority: Record<string, number> = { TRANSIT: 0, DELAYED: 1, IN_QUEUE: 2, DELIVERED: 3 }
            return (priority[a.status] ?? 99) - (priority[b.status] ?? 99)
        })
        return sorted.slice(0, MAX_MAP_SHIPMENTS)
    }, [shipments])

    // Pre-compute route data + deduplicate hub markers
    const { routes, uniqueHubs } = useMemo(() => {
        const routeList: {
            id: string
            path: [number, number][]
            color: string
            dashed: boolean
            label: string
            originHub: Hub
            destHub: Hub
            progressPercent: number
            status: string
        }[] = []

        const hubSet = new Map<string, { hub: Hub; role: "origin" | "destination" | "both" }>()

        for (const shipment of visibleShipments) {
            const originHub = hubMap.get(shipment.currentHub)
            const destHub = hubMap.get(shipment.destinationHub)
            if (!originHub || !destHub) continue

            const origin = { lat: originHub.latitude, lng: originHub.longtitude }
            const dest = { lat: destHub.latitude, lng: destHub.longtitude }

            routeList.push({
                id: shipment.shipmentId,
                path: buildSeaRoute(origin, dest),
                color: statusColor(shipment.status),
                dashed: shipment.status === "TRANSIT",
                label: shipment.label,
                originHub,
                destHub,
                progressPercent: shipment.progressPercent ?? 0,
                status: shipment.status,
            })

            if (!hubSet.has(originHub.hubCode)) {
                hubSet.set(originHub.hubCode, { hub: originHub, role: "origin" })
            }
            if (!hubSet.has(destHub.hubCode)) {
                hubSet.set(destHub.hubCode, { hub: destHub, role: "destination" })
            } else if (hubSet.get(destHub.hubCode)!.role === "origin") {
                hubSet.set(destHub.hubCode, { hub: destHub, role: "both" })
            }
        }

        return { routes: routeList, uniqueHubs: Array.from(hubSet.values()) }
    }, [visibleShipments, hubMap])

    // Transit markers interpolated along the sea route path
    const transitMarkers = useMemo(() => {
        return routes
            .filter(r => r.status === "TRANSIT" && r.progressPercent < 100)
            .map(r => {
                const path = r.path
                const t = r.progressPercent / 100
                const totalPoints = path.length
                const exactIdx = t * (totalPoints - 1)
                const idx = Math.floor(exactIdx)
                const frac = exactIdx - idx

                const safeIdx = Math.min(idx, totalPoints - 2)
                const lat = path[safeIdx][0] + (path[safeIdx + 1][0] - path[safeIdx][0]) * frac
                const lng = path[safeIdx][1] + (path[safeIdx + 1][1] - path[safeIdx][1]) * frac

                return {
                    id: r.id,
                    lat,
                    lng,
                    label: r.label,
                    progress: r.progressPercent,
                    from: r.originHub.city,
                    to: r.destHub.city,
                }
            })
    }, [routes])

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

            {/* Sea route lines */}
            {routes.map((route) => (
                <Polyline
                    key={route.id}
                    positions={route.path}
                    pathOptions={{
                        color: route.color,
                        weight: 2,
                        opacity: 0.7,
                        dashArray: route.dashed ? "5, 10" : undefined,
                    }}
                />
            ))}

            {/* Deduplicated hub markers */}
            {uniqueHubs.map(({ hub, role }) => (
                <Marker
                    key={hub.hubCode}
                    position={[hub.latitude, hub.longtitude]}
                    icon={role === "destination" ? destinationIcon : originIcon}
                >
                    <Popup>
                        <div className="text-sm">
                            <p className="font-semibold">{hub.city}, {hub.country}</p>
                            <p className="text-gray-600">
                                {role === "both" ? "Origin & Destination" : role === "origin" ? "Origin Hub" : "Destination Hub"} · {hub.hubCode}
                            </p>
                        </div>
                    </Popup>
                </Marker>
            ))}

            {/* Transit position markers — follow the sea route */}
            {transitMarkers.map((tm) => (
                <Marker key={`transit-${tm.id}`} position={[tm.lat, tm.lng]} icon={transitIcon}>
                    <Popup>
                        <div className="text-sm">
                            <p className="font-semibold">{tm.label}</p>
                            <p className="text-gray-600">In Transit — {tm.progress}%</p>
                            <p className="text-xs text-gray-500">{tm.from} → {tm.to}</p>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    )
}
