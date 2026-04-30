"use client"

import { useEffect, useMemo } from "react"
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface Hub {
    hubCode: string; city: string; country: string; latitude: number; longtitude: number
}
interface ApiShipment {
    shipmentId: string; label: string; currentHub: string; destinationHub: string
    status: string; progressPercent: number; currentLat: number; currentLng: number
    routePathJson: string; shipName?: string
}
interface LeafletMapProps {
    shipments: ApiShipment[]
    hubs: Hub[]
    getPathCoords?: (path: string) => any[]
    focusedShipmentId?: string | null
}

const MAX_MAP_SHIPMENTS = 50

// ─── ICONS ──────────────────────────────────────────────────────────────────

/** Tiny hub dot — shown only in isolation mode to avoid clutter */
const hubDotIcon = new L.DivIcon({
    className: "",
    html: `<div style="width:10px;height:10px;border-radius:50%;background:#38bdf8;box-shadow:0 0 6px rgba(56,189,248,0.5);border:1.5px solid #0e1621"></div>`,
    iconSize: [10, 10], iconAnchor: [5, 5],
})

const destDotIcon = new L.DivIcon({
    className: "",
    html: `<div style="width:10px;height:10px;border-radius:50%;background:#34d399;box-shadow:0 0 6px rgba(52,211,153,0.5);border:1.5px solid #0e1621"></div>`,
    iconSize: [10, 10], iconAnchor: [5, 5],
})

const shipIcon = new L.DivIcon({
    className: "",
    html: `<div style="width:20px;height:20px;background:#152030;border:1.5px solid #38bdf8;border-radius:5px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 8px rgba(56,189,248,0.35)">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round">
        <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
        <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/>
        <path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/><path d="M12 10v4"/>
      </svg>
    </div>`,
    iconSize: [20, 20], iconAnchor: [10, 10],
})

/** Focused/isolated vessel — sonar-ping class triggers CSS pulse rings */
const focusedShipIcon = new L.DivIcon({
    className: "focused-ship-marker",
    html: `<div style="position:relative;width:28px;height:28px">
      <div class="ping-ring" style="position:absolute;inset:-2px;border-radius:50%;border:1.5px solid #38bdf8;"></div>
      <div style="position:absolute;inset:3px;background:#152030;border:2px solid #38bdf8;border-radius:8px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 18px rgba(56,189,248,0.45)">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round">
          <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
          <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/>
          <path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/><path d="M12 10v4"/>
        </svg>
      </div>
    </div>`,
    iconSize: [28, 28], iconAnchor: [14, 14],
})

const shelteringIcon = new L.DivIcon({
    className: "",
    html: `<div style="position:relative;width:24px;height:24px">
      <div style="position:absolute;inset:0;background:rgba(251,191,36,0.15);border-radius:50%;animation:storm-pulse 1s ease-in-out infinite"></div>
      <div style="position:absolute;inset:3px;background:#152030;border:1.5px solid #fbbf24;border-radius:5px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px rgba(251,191,36,0.4)">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round">
          <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
          <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/>
          <path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/>
        </svg>
      </div>
    </div>`,
    iconSize: [24, 24], iconAnchor: [12, 12],
})

// ─── SEA-LANE GRAPH (Dijkstra) ────────────────────────────────────────────────
interface SeaNode { id: string; lat: number; lng: number }

const SEA_NODES: SeaNode[] = [
    { id: "english_channel", lat: 50, lng: -1 }, { id: "biscay", lat: 45, lng: -5 },
    { id: "lisbon_offshore", lat: 38.5, lng: -10 }, { id: "gibraltar", lat: 36, lng: -5.5 },
    { id: "north_sea", lat: 55, lng: 5 }, { id: "west_med", lat: 38, lng: 2 },
    { id: "sardinia_south", lat: 37.5, lng: 9 }, { id: "sicily_south", lat: 35.5, lng: 14 },
    { id: "crete_south", lat: 34, lng: 24 }, { id: "east_med", lat: 33, lng: 32 },
    { id: "suez_north", lat: 31, lng: 32.5 }, { id: "suez_south", lat: 28, lng: 33.5 },
    { id: "red_sea_mid", lat: 20, lng: 38 }, { id: "bab_el_mandeb", lat: 12.5, lng: 43.5 },
    { id: "gulf_of_aden", lat: 12, lng: 48 }, { id: "arabian_sea", lat: 15, lng: 60 },
    { id: "mumbai_offshore", lat: 18, lng: 70 }, { id: "mid_indian", lat: 0, lng: 75 },
    { id: "sri_lanka", lat: 6, lng: 80 }, { id: "hormuz", lat: 26, lng: 56.5 },
    { id: "persian_gulf", lat: 27, lng: 51 }, { id: "malacca_west", lat: 4, lng: 95 },
    { id: "malacca_east", lat: 1.5, lng: 104 }, { id: "singapore", lat: 1.2, lng: 103.8 },
    { id: "south_china_sea", lat: 10, lng: 112 }, { id: "hong_kong_offshore", lat: 21, lng: 114.5 },
    { id: "taiwan_strait", lat: 24, lng: 119 }, { id: "east_china_sea", lat: 30, lng: 125 },
    { id: "korea_strait", lat: 34, lng: 129 }, { id: "japan_east", lat: 35, lng: 140 },
    { id: "west_pacific", lat: 25, lng: 150 }, { id: "mid_pacific", lat: 30, lng: -170 },
    { id: "hawaii", lat: 20, lng: -155 }, { id: "mozambique", lat: -20, lng: 40 },
    { id: "south_africa_east", lat: -33, lng: 30 }, { id: "cape_good_hope", lat: -35, lng: 18 },
    { id: "south_africa_west", lat: -32, lng: 15 }, { id: "west_africa", lat: 5, lng: -5 },
    { id: "canary_islands", lat: 28, lng: -15 }, { id: "mid_atlantic_south", lat: -15, lng: -20 },
    { id: "brazil_offshore", lat: -23, lng: -40 }, { id: "us_east_north", lat: 40, lng: -70 },
    { id: "us_east_south", lat: 30, lng: -78 }, { id: "caribbean", lat: 18, lng: -75 },
    { id: "panama_atlantic", lat: 9.5, lng: -79.5 }, { id: "panama_pacific", lat: 8.5, lng: -79.5 },
    { id: "us_west", lat: 34, lng: -120 }, { id: "mid_atlantic_north", lat: 42, lng: -40 },
    { id: "rotterdam_offshore", lat: 52, lng: 4 }, { id: "hamburg_offshore", lat: 54, lng: 8 },
]

const SEA_EDGES: [string, string][] = [
    ["north_sea", "english_channel"], ["north_sea", "rotterdam_offshore"], ["north_sea", "hamburg_offshore"],
    ["english_channel", "biscay"], ["biscay", "lisbon_offshore"], ["lisbon_offshore", "gibraltar"],
    ["lisbon_offshore", "canary_islands"], ["gibraltar", "west_med"], ["west_med", "sardinia_south"],
    ["sardinia_south", "sicily_south"], ["sicily_south", "crete_south"], ["crete_south", "east_med"],
    ["east_med", "suez_north"], ["suez_north", "suez_south"], ["suez_south", "red_sea_mid"],
    ["red_sea_mid", "bab_el_mandeb"], ["bab_el_mandeb", "gulf_of_aden"], ["gulf_of_aden", "arabian_sea"],
    ["arabian_sea", "mumbai_offshore"], ["arabian_sea", "mid_indian"], ["mumbai_offshore", "sri_lanka"],
    ["sri_lanka", "mid_indian"], ["mid_indian", "malacca_west"], ["gulf_of_aden", "hormuz"],
    ["arabian_sea", "hormuz"], ["hormuz", "persian_gulf"], ["malacca_west", "malacca_east"],
    ["malacca_east", "singapore"], ["singapore", "south_china_sea"], ["south_china_sea", "hong_kong_offshore"],
    ["hong_kong_offshore", "taiwan_strait"], ["taiwan_strait", "east_china_sea"],
    ["east_china_sea", "korea_strait"], ["korea_strait", "japan_east"], ["japan_east", "west_pacific"],
    ["west_pacific", "mid_pacific"], ["mid_pacific", "hawaii"], ["hawaii", "us_west"],
    ["us_west", "panama_pacific"], ["gulf_of_aden", "mozambique"], ["mozambique", "south_africa_east"],
    ["south_africa_east", "cape_good_hope"], ["cape_good_hope", "south_africa_west"],
    ["south_africa_west", "west_africa"], ["west_africa", "canary_islands"], ["canary_islands", "gibraltar"],
    ["canary_islands", "caribbean"], ["mid_atlantic_north", "us_east_north"],
    ["mid_atlantic_north", "lisbon_offshore"], ["us_east_north", "us_east_south"],
    ["us_east_south", "caribbean"], ["caribbean", "panama_atlantic"],
    ["panama_atlantic", "panama_pacific"], ["south_africa_west", "mid_atlantic_south"],
    ["mid_atlantic_south", "brazil_offshore"], ["brazil_offshore", "caribbean"],
    ["us_east_north", "mid_atlantic_north"], ["english_channel", "mid_atlantic_north"],
    ["rotterdam_offshore", "north_sea"], ["hamburg_offshore", "north_sea"],
]

const adjacency = new Map<string, Set<string>>()
const nodeById = new Map<string, SeaNode>()
SEA_NODES.forEach(n => nodeById.set(n.id, n))
SEA_EDGES.forEach(([a, b]) => {
    if (!adjacency.has(a)) adjacency.set(a, new Set())
    if (!adjacency.has(b)) adjacency.set(b, new Set())
    adjacency.get(a)!.add(b); adjacency.get(b)!.add(a)
})

function dist(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
    return Math.sqrt((a.lat - b.lat) ** 2 + (a.lng - b.lng) ** 2)
}
function nearestNode(pos: { lat: number; lng: number }): string {
    let best = SEA_NODES[0], bestD = dist(pos, best)
    for (const n of SEA_NODES) { const d = dist(pos, n); if (d < bestD) { best = n; bestD = d } }
    return best.id
}
function dijkstra(startId: string, endId: string): SeaNode[] {
    if (startId === endId) { const n = nodeById.get(startId); return n ? [n] : [] }
    const distances = new Map<string, number>()
    const previous = new Map<string, string | null>()
    const visited = new Set<string>()
    SEA_NODES.forEach(n => { distances.set(n.id, Infinity); previous.set(n.id, null) })
    distances.set(startId, 0)
    while (true) {
        let current: string | null = null, cd = Infinity
        for (const [id, d] of distances) { if (!visited.has(id) && d < cd) { current = id; cd = d } }
        if (!current || current === endId) break
        visited.add(current)
        for (const nb of (adjacency.get(current) || new Set())) {
            if (visited.has(nb)) continue
            const nn = nodeById.get(nb), cn = nodeById.get(current)
            if (!nn || !cn) continue
            const alt = cd + dist(cn, nn)
            if (alt < (distances.get(nb) ?? Infinity)) { distances.set(nb, alt); previous.set(nb, current) }
        }
    }
    const path: SeaNode[] = []; let step: string | null = endId
    while (step) { const n = nodeById.get(step); if (n) path.unshift(n); step = previous.get(step) ?? null }
    if (!path.length || path[0].id !== startId) return []
    return path
}
function smoothPath(pts: { lat: number; lng: number }[]): [number, number][] {
    if (pts.length < 2) return pts.map(p => [p.lat, p.lng])
    const out: [number, number][] = []
    const N = 6
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)]
        for (let s = 0; s <= (i === pts.length - 2 ? N : N - 1); s++) {
            const t = s / N
            const lat = 0.5 * (2 * p1.lat + (-p0.lat + p2.lat) * t + (2 * p0.lat - 5 * p1.lat + 4 * p2.lat - p3.lat) * t * t + (-p0.lat + 3 * p1.lat - 3 * p2.lat + p3.lat) * t * t * t)
            const lng = 0.5 * (2 * p1.lng + (-p0.lng + p2.lng) * t + (2 * p0.lng - 5 * p1.lng + 4 * p2.lng - p3.lng) * t * t + (-p0.lng + 3 * p1.lng - 3 * p2.lng + p3.lng) * t * t * t)
            out.push([lat, lng])
        }
    }
    return out
}
function buildSeaRoute(start: { lat: number; lng: number }, end: { lat: number; lng: number }): [number, number][] {
    if (dist(start, end) < 8) {
        const pts: [number, number][] = []
        const mid = { lat: (start.lat + end.lat) / 2, lng: (start.lng + end.lng) / 2 }
        const d = dist(start, end), h = d * 0.2
        const ang = Math.atan2(end.lng - start.lng, end.lat - start.lat)
        const oLat = h * Math.cos(ang + Math.PI / 2), oLng = h * Math.sin(ang + Math.PI / 2)
        for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push([(1 - t) * (1 - t) * start.lat + 2 * (1 - t) * t * (mid.lat + oLat) + t * t * end.lat, (1 - t) * (1 - t) * start.lng + 2 * (1 - t) * t * (mid.lng + oLng) + t * t * end.lng]) }
        return pts
    }
    const seaPath = dijkstra(nearestNode(start), nearestNode(end))
    if (seaPath.length < 2) return [[start.lat, start.lng], [end.lat, end.lng]]
    return smoothPath([start, ...seaPath, end])
}

// ─── CONTROLLERS ─────────────────────────────────────────────────────────────
function MapController() {
    const map = useMap()
    useEffect(() => {
        map.scrollWheelZoom.disable()
        map.on("click", () => map.scrollWheelZoom.enable())
        map.on("mouseout", () => map.scrollWheelZoom.disable())
    }, [map])
    return null
}

function FlyToController({ focusedShipmentId, shipments, routes }: {
    focusedShipmentId?: string | null
    shipments: ApiShipment[]
    routes: { id: string; path: [number, number][]; progressPercent: number }[]
}) {
    const map = useMap()
    useEffect(() => {
        if (!focusedShipmentId) return
        const route = routes.find(r => r.id === focusedShipmentId)
        if (route && route.path.length >= 2 && route.progressPercent < 100) {
            const path = route.path, t = route.progressPercent / 100
            const exact = t * (path.length - 1), idx = Math.min(Math.floor(exact), path.length - 2)
            const frac = exact - idx
            map.flyTo([path[idx][0] + (path[idx + 1][0] - path[idx][0]) * frac, path[idx][1] + (path[idx + 1][1] - path[idx][1]) * frac], 6, { duration: 2 })
            return
        }
        const s = shipments.find(s => s.shipmentId === focusedShipmentId)
        if (s?.currentLat && s?.currentLng) map.flyTo([s.currentLat, s.currentLng], 6, { duration: 2 })
    }, [focusedShipmentId, shipments, routes, map])
    return null
}

// ─── MAIN MAP ─────────────────────────────────────────────────────────────────
export default function LeafletMap({ shipments, hubs, focusedShipmentId }: LeafletMapProps) {
    const isIsolationMode = !!focusedShipmentId

    const hubMap = useMemo(() => {
        const m = new Map<string, Hub>()
        hubs.forEach(h => m.set(h.hubCode, h))
        return m
    }, [hubs])

    // In isolation mode: only the focused shipment; global: all (capped)
    const visibleShipments = useMemo(() => {
        if (isIsolationMode) {
            return shipments.filter(s => s.shipmentId === focusedShipmentId)
        }
        return [...shipments]
            .sort((a, b) => {
                const p: Record<string, number> = { TRANSIT: 0, SHELTERING: 1, DELAYED: 2, IN_QUEUE: 3, DELIVERED: 4 }
                return (p[a.status] ?? 99) - (p[b.status] ?? 99)
            })
            .slice(0, MAX_MAP_SHIPMENTS)
    }, [shipments, isIsolationMode, focusedShipmentId])

    const { routes, visibleHubs } = useMemo(() => {
        const routeList: any[] = []
        const hubSet = new Map<string, { hub: Hub; role: string }>()
        for (const s of visibleShipments) {
            const o = hubMap.get(s.currentHub), d = hubMap.get(s.destinationHub)
            if (!o || !d) continue
            const path = buildSeaRoute({ lat: o.latitude, lng: o.longtitude }, { lat: d.latitude, lng: d.longtitude })
            routeList.push({ id: s.shipmentId, path, status: s.status, progressPercent: s.progressPercent ?? 0, label: s.label, originHub: o, destHub: d })
            if (!hubSet.has(o.hubCode)) hubSet.set(o.hubCode, { hub: o, role: "origin" })
            if (!hubSet.has(d.hubCode)) hubSet.set(d.hubCode, { hub: d, role: "destination" })
        }
        return { routes: routeList, visibleHubs: Array.from(hubSet.values()) }
    }, [visibleShipments, hubMap])

    const shipMarkers = useMemo(() => {
        return routes
            .filter(r => ["TRANSIT", "SHELTERING"].includes(r.status) && r.progressPercent < 100)
            .map(r => {
                const path = r.path, t = r.progressPercent / 100
                const exact = t * (path.length - 1), idx = Math.min(Math.floor(exact), path.length - 2)
                const frac = exact - idx
                return {
                    id: r.id, status: r.status, label: r.label, progress: r.progressPercent,
                    from: r.originHub.city, to: r.destHub.city,
                    lat: path[idx][0] + (path[idx + 1][0] - path[idx][0]) * frac,
                    lng: path[idx][1] + (path[idx + 1][1] - path[idx][1]) * frac,
                }
            })
    }, [routes])

    return (
        <MapContainer center={[20, 0]} zoom={2} style={{ height: "100%", width: "100%" }} className="rounded-lg">
            <MapController />
            <FlyToController
                focusedShipmentId={focusedShipmentId}
                shipments={shipments}
                routes={routes.map(r => ({ id: r.id, path: r.path, progressPercent: r.progressPercent }))}
            />
            <TileLayer
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {/* ── ROUTE LINES ─────────────────────────────────────────────────
                GLOBAL VIEW: extremely faint (opacity 0.1, weight 1) — no spaghetti
                ISOLATION MODE: single bright cyan line (opacity 0.85, weight 3)
            ──────────────────────────────────────────────────────────────── */}
            {routes.map(r => {
                const lineColor = r.status === "SHELTERING" ? "#f59e0b"
                    : r.status === "DELAYED" ? "#ef4444"
                        : r.status === "DELIVERED" ? "#10b981"
                            : isIsolationMode ? "#06b6d4"  // bright cyan when isolated
                                : "#94a3b8"                              // muted slate in global view

                return (
                    <Polyline
                        key={r.id}
                        positions={r.path}
                        pathOptions={{
                            color: lineColor,
                            weight: isIsolationMode ? 3 : 1,
                            opacity: isIsolationMode ? 0.85 : 0.1,
                            dashArray: isIsolationMode ? "10, 15" : undefined,
                        }}
                    />
                )
            })}

            {/* ── HUB MARKERS ─────────────────────────────────────────────────
                Shown only in isolation mode — tiny dots, no clutter in global view
            ──────────────────────────────────────────────────────────────── */}
            {isIsolationMode && visibleHubs.map(({ hub, role }) => (
                <Marker
                    key={hub.hubCode}
                    position={[hub.latitude, hub.longtitude]}
                    icon={role === "destination" ? destDotIcon : hubDotIcon}
                >
                    <Popup>
                        <p className="font-mono text-[11px] font-semibold" style={{ color: "#38bdf8" }}>
                            {hub.city}, {hub.country}
                        </p>
                        <p className="font-mono text-[10px]" style={{ color: "#6b7f9a" }}>{hub.hubCode}</p>
                    </Popup>
                </Marker>
            ))}

            {/* ── SHIP MARKERS ─────────────────────────────────────────────── */}
            {shipMarkers.map(m => {
                const isFocused = focusedShipmentId === m.id
                const icon = m.status === "SHELTERING" ? shelteringIcon
                    : isFocused ? focusedShipIcon : shipIcon
                return (
                    <Marker key={`ship-${m.id}`} position={[m.lat, m.lng]} icon={icon}>
                        <Popup>
                            <p className="font-mono font-semibold" style={{ color: isFocused ? "#38bdf8" : m.status === "SHELTERING" ? "#fbbf24" : "#38bdf8" }}>
                                {isFocused ? "◉ " : ""}{m.label}
                            </p>
                            <p className="font-mono text-[10px]" style={{ color: "#6b7f9a" }}>{m.from} → {m.to}</p>
                            <p className="font-mono text-[10px]" style={{ color: "#38bdf8" }}>{m.progress}% complete</p>
                            {isFocused && <p className="font-mono text-[10px]" style={{ color: "#fbbf24" }}>⚡ Sonar Lock Active</p>}
                        </Popup>
                    </Marker>
                )
            })}
        </MapContainer>
    )
}
