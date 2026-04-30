"use client"

import React from "react"
import {
  Radar, Anchor, Users, Bell,
  ChevronLeft, ChevronRight,
  PlusCircle, Container, Activity, Layers,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  icon: React.ElementType; label: string; id: string; badge?: number; highlight?: boolean
}

const navItems: NavItem[] = [
  { icon: Radar, label: "Command Center", id: "overview" },
  { icon: PlusCircle, label: "New Manifest", id: "add-shipment", highlight: true },
  { icon: Container, label: "Container Inventory", id: "shipments" },
  { icon: Layers, label: "Live Global Radar", id: "tracking" },
  { icon: Activity, label: "Telemetry & Intelligence", id: "telemetry" },
  { icon: Users, label: "Corporate Partners", id: "customers" },
]

interface SidebarProps {
  activeView: string
  onViewChange: (view: string) => void
  onNotificationsClick: () => void
  notificationCount?: number
}

export function Sidebar({ activeView, onViewChange, onNotificationsClick, notificationCount = 0 }: SidebarProps) {
  const [collapsed, setCollapsed] = React.useState(false)

  return (
    <aside className={cn(
      "flex flex-col h-screen border-r border-[#1e3050] transition-all duration-300 shrink-0",
      "bg-[#0a1120]",
      collapsed ? "w-14" : "w-60"
    )}>
      {/* Logo */}
      <div className={cn("flex items-center h-14 border-b border-[#1e3050]", collapsed ? "justify-center px-0" : "px-4 gap-3")}>
        <div className="relative flex items-center justify-center w-7 h-7 rounded-md bg-blue-400/10 border border-blue-400/30 shrink-0">
          <Anchor className="w-4 h-4 text-blue-400" />
          <div className="absolute inset-0 rounded-md maritime-glow" />
        </div>
        {!collapsed && (
          <div>
            <span className="text-sm font-bold text-blue-400 tracking-tight leading-none">SkyLink</span>
            <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">Maritime Net</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            collapsed={collapsed}
            isActive={activeView === item.id}
            onClick={() => onViewChange(item.id)}
          />
        ))}
      </nav>

      {/* Bell */}
      <div className="px-2 py-1 border-t border-[#1e3050]">
        <NavButton
          item={{ icon: Bell, label: "Notifications", id: "notifications", badge: notificationCount || undefined }}
          collapsed={collapsed}
          isActive={false}
          onClick={onNotificationsClick}
        />
      </div>

      {/* Avatar */}
      <div className={cn(
        "flex items-center gap-2.5 mx-2 mb-2 px-2 py-2 rounded-md border border-[#1e3050] bg-[#111d35]/60",
        collapsed && "justify-center"
      )}>
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-blue-400/10 text-blue-400 text-[10px] font-bold border border-blue-400/20 shrink-0">
          AS
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">Amine Serrar</p>
            <p className="text-[9px] text-slate-500 font-mono tracking-widest truncate uppercase">Fleet Commander</p>
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="flex items-center justify-center h-8 border-t border-[#1e3050] hover:bg-blue-400/5 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5 text-slate-500" /> : <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />}
      </button>
    </aside>
  )
}

function NavButton({ item, collapsed, isActive, onClick }: {
  item: NavItem; collapsed: boolean; isActive: boolean; onClick: () => void
}) {
  const Icon = item.icon
  return (
    <button
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex items-center gap-2.5 w-full px-2 py-2 rounded-md transition-all text-left group",
        item.highlight && !isActive
          ? "bg-blue-400/8 text-blue-400 hover:bg-blue-400/12 border border-blue-400/20"
          : isActive
            ? "bg-[#172036] text-blue-400 border border-blue-400/25"
            : "text-slate-400 hover:bg-[#172036]/70 hover:text-slate-200 border border-transparent hover:border-[#1e3050]",
        collapsed && "justify-center"
      )}
    >
      <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-blue-400" : "group-hover:text-slate-200")} />
      {!collapsed && (
        <>
          <span className="flex-1 text-xs font-medium truncate">{item.label}</span>
          {item.badge && (
            <span className="flex items-center justify-center min-w-4 h-4 px-1 text-[9px] font-bold rounded-full bg-blue-400 text-[#0a1120]">
              {item.badge}
            </span>
          )}
        </>
      )}
    </button>
  )
}
