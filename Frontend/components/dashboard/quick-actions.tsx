"use client";

import { useState } from "react";
import {
  Plus,
  Package,
  Truck,
  MapPin,
  FileText,
  X,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface QuickActionsProps {
  onAction: (action: string) => void;
}

const actions = [
  {
    id: "new-shipment",
    label: "New Shipment",
    icon: Package,
    color: "bg-primary hover:bg-primary/90 text-primary-foreground",
  },
  {
    id: "add-vehicle",
    label: "Add Vehicle",
    icon: Truck,
    color: "bg-info hover:bg-info/90 text-info-foreground",
  },
  {
    id: "track-package",
    label: "Track Package",
    icon: MapPin,
    color: "bg-success hover:bg-success/90 text-success-foreground",
  },
  {
    id: "generate-report",
    label: "Quick Report",
    icon: FileText,
    color: "bg-warning hover:bg-warning/90 text-warning-foreground",
  },
];

export function QuickActions({ onAction }: QuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-3">
      <div
        className={cn(
          "flex flex-col gap-2 transition-all duration-300",
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => {
                onAction(action.id);
                setIsOpen(false);
              }}
              className={cn(
                "flex items-center gap-3 rounded-full px-4 py-2.5 shadow-lg transition-all duration-300",
                action.color
              )}
              style={{
                transitionDelay: isOpen ? `${index * 50}ms` : "0ms",
              }}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium whitespace-nowrap">{action.label}</span>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-300 hover:bg-primary/90 hover:scale-105",
          isOpen && "rotate-45"
        )}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </button>
    </div>
  );
}
