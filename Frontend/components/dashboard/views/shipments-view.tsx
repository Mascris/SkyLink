"use client"

import { useState, useEffect } from "react"
import { fetchActiveShipments, type Shipment as ApiShipment } from "@/lib/api"
import {
  Search,
  Plus,
  MoreVertical,
  Package,
  Truck,
  Ship,
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface Shipment {
  id: string
  trackingNumber: string
  origin: string
  destination: string
  status: string
  carrier: string
  weight: string
  customer: string
  eta: string
  createdAt: string
}

// Helper to normalize status values from DB
function normalizeStatus(status: string): string {
  const s = status?.toLowerCase().replace(/_/g, "-") || "pending"
  // Map common variations
  if (s.includes("transit")) return "in-transit"
  if (s.includes("deliver")) return "delivered"
  if (s.includes("delay")) return "delayed"
  if (s.includes("pend")) return "pending"
  return s
}

function getStatusStyle(status: string): { label: string; color: string } {
  const normalized = normalizeStatus(status)
  const config: Record<string, { label: string; color: string }> = {
    "in-transit": { label: "In Transit", color: "bg-blue-500/20 text-blue-400" },
    "delivered": { label: "Delivered", color: "bg-emerald-500/20 text-emerald-400" },
    "pending": { label: "Pending", color: "bg-amber-500/20 text-amber-400" },
    "delayed": { label: "Delayed", color: "bg-red-500/20 text-red-400" },
  }
  return config[normalized] || { label: status || "Unknown", color: "bg-gray-500/20 text-gray-400" }
}

export function ShipmentsView() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    const loadShipments = async () => {
      try {
        const data = await fetchActiveShipments()
        const mappedShipments: Shipment[] = data.map((s: ApiShipment) => ({
          id: s.shipmentId,
          trackingNumber: s.label,
          origin: s.currentHub || "N/A",
          destination: s.destinationHub || "N/A",
          status: s.status || "pending",
          carrier: "SkyLink Logistics",
          weight: "N/A",
          customer: "N/A",
          eta: s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "N/A",
          createdAt: s.createdAt || "",
        }))
        setShipments(mappedShipments)
        setLoading(false)
      } catch (err) {
        console.error("Failed to load shipments", err)
        setLoading(false)
      }
    }
    loadShipments()
  }, [])

  const filteredShipments = shipments.filter((s) => {
    const matchesSearch =
      s.trackingNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.origin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.destination?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || normalizeStatus(s.status) === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredShipments.length / itemsPerPage)
  const paginatedShipments = filteredShipments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const stats = {
    total: shipments.length,
    inTransit: shipments.filter((s) => normalizeStatus(s.status) === "in-transit").length,
    delivered: shipments.filter((s) => normalizeStatus(s.status) === "delivered").length,
    delayed: shipments.filter((s) => normalizeStatus(s.status) === "delayed").length,
  }

  // Pagination helper - show max 7 page numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i)
        pages.push("...")
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 3) {
        pages.push(1)
        pages.push("...")
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push("...")
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push("...")
        pages.push(totalPages)
      }
    }
    return pages
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Shipments</h1>
          <p className="text-muted-foreground">Manage all your shipments in one place</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          New Shipment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Truck className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{stats.inTransit}</p>
                <p className="text-sm text-muted-foreground">In Transit</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Package className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{stats.delivered}</p>
                <p className="text-sm text-muted-foreground">Delivered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <Package className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{stats.delayed}</p>
                <p className="text-sm text-muted-foreground">Delayed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by tracking number or location..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-9 bg-input border-border"
          />
        </div>
        <div className="flex items-center gap-2">
          {["all", "in-transit", "delivered", "pending", "delayed"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setStatusFilter(status)
                setCurrentPage(1)
              }}
              className={cn(statusFilter !== status && "text-muted-foreground")}
            >
              {status === "all" ? "All" : getStatusStyle(status).label}
            </Button>
          ))}
        </div>
      </div>

      {/* Shipments Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Tracking</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Route</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {paginatedShipments.map((shipment) => {
                  const statusStyle = getStatusStyle(shipment.status)
                  return (
                    <tr key={shipment.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <p className="font-mono text-sm text-foreground">{shipment.trackingNumber}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground truncate max-w-[120px]">
                            {shipment.origin?.split(",")[0] || "N/A"}
                          </span>
                          <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          <span className="text-foreground truncate max-w-[120px]">
                            {shipment.destination?.split(",")[0] || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={cn("px-2 py-1 rounded-full text-xs font-medium", statusStyle.color)}>
                          {statusStyle.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {shipment.eta}
                        </div>
                      </td>
                      <td className="p-4">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredShipments.length)} of {filteredShipments.length} shipments
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-transparent"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {getPageNumbers().map((page, index) => (
                typeof page === "number" ? (
                  <Button
                    key={index}
                    variant={currentPage === page ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ) : (
                  <span key={index} className="px-2 text-muted-foreground">...</span>
                )
              ))}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-transparent"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
