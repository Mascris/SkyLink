"use client"

import React from "react"
import {
  LayoutDashboard,
  Package,
  Truck,
  Globe,
  BarChart3,
  Settings,
  Users,
  FileText,
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  PlusCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  icon: React.ElementType
  label: string
  id: string
  badge?: number
  highlight?: boolean
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Overview", id: "overview" },
  { icon: PlusCircle, label: "Add Shipment", id: "add-shipment", highlight: true },
  { icon: Package, label: "Shipments", id: "shipments" },
  { icon: Truck, label: "Fleet", id: "fleet" },
  { icon: Globe, label: "Tracking", id: "tracking" },
  { icon: BarChart3, label: "Analytics", id: "analytics" },
  { icon: Users, label: "Customers", id: "customers" },
  { icon: FileText, label: "Reports", id: "reports" },
]

const bottomItems: NavItem[] = [
  { icon: Bell, label: "Notifications", id: "notifications", badge: 3 },
  { icon: Settings, label: "Settings", id: "settings" },
]

interface SidebarProps {
  activeView: string
  onViewChange: (view: string) => void
  onNotificationsClick: () => void
  onLogout: () => void
}

export function Sidebar({ activeView, onViewChange, onNotificationsClick, onLogout }: SidebarProps) {
  const [collapsed, setCollapsed] = React.useState(false)

  const handleNavClick = (item: NavItem) => {
    if (item.id === "notifications") {
      onNotificationsClick()
    } else {
      onViewChange(item.id)
    }
  }

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
            <Globe className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-lg font-semibold text-sidebar-foreground">
              GlobalTrack
            </span>
          )}
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            collapsed={collapsed}
            isActive={activeView === item.id}
            onClick={() => handleNavClick(item)}
          />
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="px-3 py-4 space-y-1 border-t border-sidebar-border">
        {bottomItems.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            collapsed={collapsed}
            isActive={activeView === item.id}
            onClick={() => handleNavClick(item)}
          />
        ))}

        {/* User Profile */}
        <div className={cn(
          "flex items-center gap-3 px-3 py-2 mt-4 rounded-lg bg-sidebar-accent",
          collapsed && "justify-center px-2"
        )}>
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary text-sm font-medium">
            JD
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">John Doe</p>
              <p className="text-xs text-muted-foreground truncate">Operations Manager</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={onLogout}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
              aria-label="Log out"
            >
              <LogOut className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-10 border-t border-sidebar-border hover:bg-sidebar-accent transition-colors"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
    </aside>
  )
}

interface NavButtonProps {
  item: NavItem
  collapsed: boolean
  isActive: boolean
  onClick: () => void
}

function NavButton({ item, collapsed, isActive, onClick }: NavButtonProps) {
  const Icon = item.icon

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors text-left",
        item.highlight && !isActive
          ? "bg-primary/10 text-primary hover:bg-primary/20"
          : isActive
            ? "bg-sidebar-accent text-sidebar-foreground"
            : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
        collapsed && "justify-center px-2"
      )}
    >
      <Icon className={cn("w-5 h-5 flex-shrink-0", item.highlight && !isActive && "text-primary")} />
      {!collapsed && (
        <>
          <span className="flex-1 text-sm font-medium">{item.label}</span>
          {item.badge && (
            <span className="flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-medium rounded-full bg-primary text-primary-foreground">
              {item.badge}
            </span>
          )}
        </>
      )}
    </button>
  )
}
