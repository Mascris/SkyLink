"use client"

import { X, Ship, AlertTriangle, CheckCircle, Clock, Bell, Anchor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface ShipmentNotification {
  id: string
  type: "departed" | "arrived" | "delayed" | "created"
  title: string
  message: string
  timestamp: Date
  read: boolean
}

const typeConfig = {
  departed: { icon: Ship, className: "text-blue-400 bg-blue-500/15" },
  arrived: { icon: Anchor, className: "text-emerald-400 bg-emerald-500/15" },
  delayed: { icon: AlertTriangle, className: "text-red-400 bg-red-500/15" },
  created: { icon: Clock, className: "text-amber-400 bg-amber-500/15" },
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return "Just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

interface NotificationsPanelProps {
  isOpen: boolean
  onClose: () => void
  notifications: ShipmentNotification[]
  onMarkAllRead: () => void
  onClearAll: () => void
}

export function NotificationsPanel({ isOpen, onClose, notifications, onMarkAllRead, onClearAll }: NotificationsPanelProps) {
  if (!isOpen) return null

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/15">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
              <p className="text-xs text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
              </p>
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
          <Button variant="ghost" size="sm" onClick={onClearAll} className="text-xs text-muted-foreground">
            Clear all
          </Button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <Bell className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                You'll be notified when ships depart, arrive, or experience delays.
              </p>
            </div>
          ) : (
            notifications.map((notification) => {
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
                        {timeAgo(notification.timestamp)}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <p className="text-center text-xs text-muted-foreground">
            {notifications.length} notification{notifications.length !== 1 ? "s" : ""} total
          </p>
        </div>
      </div>
    </div>
  )
}
