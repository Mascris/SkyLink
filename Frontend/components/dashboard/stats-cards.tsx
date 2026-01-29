"use client"

import React, { useState, useEffect } from "react"
import { Package, Truck, CheckCircle, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { fetchActiveShipments, type Shipment } from "@/lib/api"

type FilterType = "in-transit" | "delivered" | "pending" | "delayed" | null

interface StatsCardsProps {
  onFilterClick: (filter: FilterType) => void
  activeFilter: FilterType
}

// Helper to normalize status values from DB
function normalizeStatus(status: string): string {
  const s = status?.toLowerCase().replace(/_/g, "-") || "pending"
  if (s.includes("transit")) return "in-transit"
  if (s.includes("deliver")) return "delivered"
  if (s.includes("delay")) return "delayed"
  if (s.includes("pend")) return "pending"
  return s
}

export function StatsCards({ onFilterClick, activeFilter }: StatsCardsProps) {
  const [stats, setStats] = useState({
    total: 0,
    inTransit: 0,
    delivered: 0,
    delayed: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await fetchActiveShipments()
        setStats({
          total: data.length,
          inTransit: data.filter((s: Shipment) => normalizeStatus(s.status) === "in-transit").length,
          delivered: data.filter((s: Shipment) => normalizeStatus(s.status) === "delivered").length,
          delayed: data.filter((s: Shipment) => normalizeStatus(s.status) === "delayed").length,
        })
        setLoading(false)
      } catch (err) {
        console.error("Failed to load stats", err)
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  const statCards = [
    {
      title: "Total Shipments",
      value: loading ? "..." : stats.total.toLocaleString(),
      icon: Package,
      iconBg: "bg-primary/15",
      iconColor: "text-primary",
      filterId: null as FilterType,
    },
    {
      title: "In Transit",
      value: loading ? "..." : stats.inTransit.toLocaleString(),
      icon: Truck,
      iconBg: "bg-info/15",
      iconColor: "text-info",
      filterId: "in-transit" as FilterType,
    },
    {
      title: "Delivered",
      value: loading ? "..." : stats.delivered.toLocaleString(),
      icon: CheckCircle,
      iconBg: "bg-success/15",
      iconColor: "text-success",
      filterId: "delivered" as FilterType,
    },
    {
      title: "Delayed",
      value: loading ? "..." : stats.delayed.toLocaleString(),
      icon: AlertTriangle,
      iconBg: "bg-warning/15",
      iconColor: "text-warning",
      filterId: "delayed" as FilterType,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon
        const isActive = activeFilter === stat.filterId

        return (
          <Card
            key={stat.title}
            className={cn(
              "group cursor-pointer transition-all",
              isActive
                ? "border-primary/50 bg-primary/5"
                : "hover:border-primary/30"
            )}
            onClick={() => onFilterClick(stat.filterId === activeFilter ? null : stat.filterId)}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className={`flex items-center justify-center w-11 h-11 rounded-lg ${stat.iconBg}`}>
                  <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.title}</p>
              </div>
              {isActive && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-primary">Click to clear filter</p>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
