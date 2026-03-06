"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Users, Search, Package, MapPin } from "lucide-react"
import { type Shipment } from "@/lib/api"

interface CustomerSummary {
  name: string
  address: string
  shipmentCount: number
  lastStatus: string
  lastShipmentLabel: string
  lastContainerId: string
}

export function CustomersView({ shipments }: { shipments: Shipment[] }) {
  const [search, setSearch] = useState("")

  // Derive unique customers from shipment data
  const customers = useMemo(() => {
    const map = new Map<string, CustomerSummary>()

    for (const s of shipments) {
      const name = s.consumerName?.trim()
      if (!name) continue

      const existing = map.get(name)
      if (existing) {
        existing.shipmentCount++
        // Keep the latest shipment info
        if (s.createdAt > existing.lastShipmentLabel) {
          existing.lastStatus = s.status
          existing.lastShipmentLabel = s.label
          existing.address = s.deliveryAddress || existing.address
          existing.lastContainerId = s.containerId || existing.lastContainerId
        }
      } else {
        map.set(name, {
          name,
          address: s.deliveryAddress || "—",
          shipmentCount: 1,
          lastStatus: s.status,
          lastShipmentLabel: s.label,
          lastContainerId: s.containerId || "—",
        })
      }
    }

    return Array.from(map.values())
  }, [shipments])

  const filtered = useMemo(() => {
    if (!search) return customers
    const q = search.toLowerCase()
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q) ||
      c.lastContainerId.toLowerCase().includes(q)
    )
  }, [customers, search])

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      TRANSIT: "bg-blue-500/15 text-blue-400 border-blue-500/30",
      DELIVERED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      DELAYED: "bg-red-500/15 text-red-400 border-red-500/30",
      IN_QUEUE: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    }
    return colors[status] || "bg-muted text-muted-foreground border-border"
  }

  if (customers.length === 0) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Card className="bg-card border-border max-w-md">
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No Customers Yet</h2>
            <p className="text-muted-foreground">
              Customer data will appear here once shipments with consumer information are created.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/15">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{customers.length}</p>
              <p className="text-xs text-muted-foreground">Total Customers</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/15">
              <Package className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{shipments.filter(s => s.consumerName).length}</p>
              <p className="text-xs text-muted-foreground">Total Shipments</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/15">
              <MapPin className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {new Set(customers.map(c => c.address).filter(a => a !== "—")).size}
              </p>
              <p className="text-xs text-muted-foreground">Unique Addresses</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search + table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-foreground">Customer Directory</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-secondary/50 border-border"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[500px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card border-b border-border">
                <tr className="text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="text-left py-3 px-4 font-medium">Customer</th>
                  <th className="text-left py-3 px-4 font-medium">Delivery Address</th>
                  <th className="text-center py-3 px-4 font-medium">Shipments</th>
                  <th className="text-left py-3 px-4 font-medium">Last Container</th>
                  <th className="text-left py-3 px-4 font-medium">Last Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((customer) => (
                  <tr key={customer.name} className="hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/15 text-primary text-xs font-semibold">
                          {customer.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-foreground">{customer.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{customer.address}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-secondary text-foreground text-xs font-medium">
                        {customer.shipmentCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{customer.lastContainerId}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusBadge(customer.lastStatus)}`}>
                        {customer.lastStatus}
                      </span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No customers match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
