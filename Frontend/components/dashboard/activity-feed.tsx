"use client";

import { useState, useEffect } from "react";
import {
  Package,
  Truck,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Clock,
  X,
  ChevronRight,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ActivityFeedProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ActivityItem {
  id: string;
  type: "shipment" | "delivery" | "alert" | "update";
  title: string;
  description: string;
  timestamp: Date;
  isNew: boolean;
}

const initialActivities: ActivityItem[] = [
  {
    id: "1",
    type: "delivery",
    title: "Shipment Delivered",
    description: "SHP-2024-008 delivered to Tokyo, Japan",
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    isNew: true,
  },
  {
    id: "2",
    type: "alert",
    title: "Delay Alert",
    description: "SHP-2024-003 experiencing customs delay in Dubai",
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    isNew: true,
  },
  {
    id: "3",
    type: "shipment",
    title: "New Shipment Created",
    description: "SHP-2024-015 from Berlin to Sydney",
    timestamp: new Date(Date.now() - 32 * 60 * 1000),
    isNew: false,
  },
  {
    id: "4",
    type: "update",
    title: "Location Update",
    description: "SHP-2024-001 arrived at Los Angeles port",
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    isNew: false,
  },
  {
    id: "5",
    type: "delivery",
    title: "Shipment Delivered",
    description: "SHP-2024-006 delivered to Paris, France",
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    isNew: false,
  },
];

const liveUpdates = [
  {
    type: "update" as const,
    title: "Location Update",
    description: "SHP-2024-002 passing through Atlantic Ocean",
  },
  {
    type: "shipment" as const,
    title: "New Shipment Created",
    description: "SHP-2024-016 from Mumbai to Singapore",
  },
  {
    type: "delivery" as const,
    title: "Out for Delivery",
    description: "SHP-2024-010 out for final delivery in London",
  },
  {
    type: "alert" as const,
    title: "Weather Advisory",
    description: "Storm warning affecting Pacific routes",
  },
];

export function ActivityFeed({ isOpen, onClose }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>(initialActivities);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const randomUpdate = liveUpdates[Math.floor(Math.random() * liveUpdates.length)];
      const newActivity: ActivityItem = {
        id: Date.now().toString(),
        ...randomUpdate,
        timestamp: new Date(),
        isNew: true,
      };

      setActivities((prev) => [newActivity, ...prev.slice(0, 19)]);
    }, 8000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const getIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "shipment":
        return Package;
      case "delivery":
        return CheckCircle2;
      case "alert":
        return AlertTriangle;
      case "update":
        return MapPin;
    }
  };

  const getIconColor = (type: ActivityItem["type"]) => {
    switch (type) {
      case "shipment":
        return "text-info bg-info/10";
      case "delivery":
        return "text-success bg-success/10";
      case "alert":
        return "text-warning bg-warning/10";
      case "update":
        return "text-primary bg-primary/10";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col border-l border-border bg-card shadow-xl">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">Live Activity</h2>
          <span className="flex h-2 w-2">
            <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPaused(!isPaused)}
            className="text-xs"
          >
            {isPaused ? "Resume" : "Pause"}
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activities.map((activity, index) => {
          const Icon = getIcon(activity.type);
          return (
            <div
              key={activity.id}
              className={cn(
                "flex gap-3 border-b border-border p-4 transition-colors hover:bg-secondary/50",
                activity.isNew && index === 0 && "animate-pulse bg-primary/5"
              )}
            >
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-full", getIconColor(activity.type))}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-foreground text-sm">{activity.title}</p>
                  {activity.isNew && index < 2 && (
                    <span className="shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                      NEW
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground truncate">{activity.description}</p>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatTime(activity.timestamp)}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
            </div>
          );
        })}
      </div>

      <div className="border-t border-border p-3">
        <Button variant="outline" className="w-full bg-transparent" size="sm">
          View All Activity
        </Button>
      </div>
    </div>
  );
}
