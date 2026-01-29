"use client"

import { X, Package, AlertTriangle, CheckCircle, Clock, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  type: "alert" | "success" | "warning" | "info"
  title: string
  message: string
  time: string
  read: boolean
}

const notifications: Notification[] = [
  {
    id: "1",
    type: "alert",
    title: "Shipment Delayed",
    message: "SHP-2024-004 from Dubai has been delayed due to weather conditions.",
    time: "10 minutes ago",
    read: false,
  },
  {
    id: "2",
    type: "success",
    title: "Delivery Complete",
    message: "SHP-2024-002 has been successfully delivered to New York.",
    time: "1 hour ago",
    read: false,
  },
  {
    id: "3",
    type: "warning",
    title: "Customs Hold",
    message: "SHP-2024-007 is currently held at customs in Rotterdam.",
    time: "3 hours ago",
    read: false,
  },
  {
    id: "4",
    type: "info",
    title: "New Shipment Created",
    message: "SHP-2024-008 has been registered and is awaiting pickup.",
    time: "5 hours ago",
    read: true,
  },
  {
    id: "5",
    type: "success",
    title: "Fleet Update",
    message: "Vessel MV Pacific Star has completed maintenance.",
    time: "1 day ago",
    read: true,
  },
]

const typeConfig = {
  alert: { icon: AlertTriangle, className: "text-destructive bg-destructive/15" },
  success: { icon: CheckCircle, className: "text-success bg-success/15" },
  warning: { icon: Clock, className: "text-warning bg-warning/15" },
  info: { icon: Package, className: "text-info bg-info/15" },
}

interface NotificationsPanelProps {
  open: boolean
  onClose: () => void
  onMarkAllRead: () => void
}

export function NotificationsPanel({ open, onClose, onMarkAllRead }: NotificationsPanelProps) {
  if (!open) return null

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/15">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
              <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-secondary/30">
          <Button variant="ghost" size="sm" onClick={onMarkAllRead} className="text-xs">
            Mark all as read
          </Button>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
            Clear all
          </Button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-auto">
          {notifications.map((notification) => {
            const config = typeConfig[notification.type]
            const Icon = config.icon

            return (
              <button
                key={notification.id}
                className={cn(
                  "w-full text-left p-4 border-b border-border hover:bg-secondary/50 transition-colors",
                  !notification.read && "bg-secondary/30"
                )}
              >
                <div className="flex gap-3">
                  <div className={cn(
                    "flex items-center justify-center w-9 h-9 rounded-lg shrink-0",
                    config.className
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn(
                        "text-sm font-medium text-foreground",
                        !notification.read && "font-semibold"
                      )}>
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-2">
                      {notification.time}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Button variant="outline" className="w-full bg-transparent">
            View All Notifications
          </Button>
        </div>
      </div>
    </div>
  )
}
