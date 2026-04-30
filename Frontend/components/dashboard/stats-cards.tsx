import React from "react"
import { Container, Ship, Anchor, AlertTriangle } from "lucide-react"
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
      title: "Total Cargo",
      value: stats.total.toLocaleString(),
      icon: Container,
      iconBg: "bg-cyan-500/15",
      iconColor: "text-cyan-400",
      borderColor: "border-cyan-500/20",
      filterId: null as FilterType,
    },
    {
      title: "Vessels Active",
      value: stats.inTransit.toLocaleString(),
      icon: Ship,
      iconBg: "bg-blue-500/15",
      iconColor: "text-blue-400",
      borderColor: "border-blue-500/20",
      filterId: "in-transit" as FilterType,
    },
    {
      title: "Port Delivered",
      value: stats.delivered.toLocaleString(),
      icon: Anchor,
      iconBg: "bg-emerald-500/15",
      iconColor: "text-emerald-400",
      borderColor: "border-emerald-500/20",
      filterId: "delivered" as FilterType,
    },
    {
      title: "Storm Delayed",
      value: stats.delayed.toLocaleString(),
      icon: AlertTriangle,
      iconBg: "bg-amber-500/15",
      iconColor: "text-amber-400",
      borderColor: "border-amber-500/20",
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
              "group cursor-pointer transition-all duration-300 bg-card border-border",
              isActive
                ? "border-sky-400/50 shadow-[0_0_16px_rgba(56,189,248,0.1)]"
                : `hover:${stat.borderColor} hover:shadow-[0_0_10px_rgba(56,189,248,0.06)]`
            )}
            onClick={() => onFilterClick(stat.filterId === activeFilter ? null : stat.filterId)}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className={`flex items-center justify-center w-11 h-11 rounded-lg ${stat.iconBg} border ${stat.borderColor}`}>
                  <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
                {isActive && (
                  <div className="w-2 h-2 rounded-full bg-sky-400 maritime-glow" />
                )}
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-foreground font-mono">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.title}</p>
              </div>
              {isActive && (
                <div className="mt-3 pt-3 border-t border-sky-400/20">
                  <p className="text-xs text-sky-400 font-mono uppercase">Click to clear filter</p>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
