import React from "react"
import { Package, Truck, CheckCircle, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type FilterType = "in-transit" | "delivered" | "pending" | "delayed" | null

interface StatsCardsProps {
  onFilterClick: (filter: FilterType) => void
  activeFilter: FilterType
  stats: {
    total: number
    inTransit: number
    delivered: number
    pending: number
    delayed: number
  }
}

export function StatsCards({ onFilterClick, activeFilter, stats }: StatsCardsProps) {
  const statCards = [
    {
      title: "Total Shipments",
      value: stats.total.toLocaleString(),
      icon: Package,
      iconBg: "bg-primary/15",
      iconColor: "text-primary",
      filterId: null as FilterType,
    },
    {
      title: "In Transit",
      value: stats.inTransit.toLocaleString(),
      icon: Truck,
      iconBg: "bg-blue-500/15",
      iconColor: "text-blue-400",
      filterId: "in-transit" as FilterType,
    },
    {
      title: "Delivered",
      value: stats.delivered.toLocaleString(),
      icon: CheckCircle,
      iconBg: "bg-emerald-500/15",
      iconColor: "text-emerald-400",
      filterId: "delivered" as FilterType,
    },
    {
      title: "Delayed",
      value: stats.delayed.toLocaleString(),
      icon: AlertTriangle,
      iconBg: "bg-amber-500/15",
      iconColor: "text-amber-400",
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
