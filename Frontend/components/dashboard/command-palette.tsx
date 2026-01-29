"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Package,
  Truck,
  MapPin,
  BarChart3,
  Users,
  FileText,
  Settings,
  Plus,
  ArrowRight,
  Clock,
  Command,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
  onAction: (action: string) => void;
}

const commands = [
  {
    category: "Navigation",
    items: [
      { id: "overview", label: "Go to Overview", icon: BarChart3, view: "overview" },
      { id: "shipments", label: "Go to Shipments", icon: Package, view: "shipments" },
      { id: "fleet", label: "Go to Fleet", icon: Truck, view: "fleet" },
      { id: "tracking", label: "Go to Tracking", icon: MapPin, view: "tracking" },
      { id: "analytics", label: "Go to Analytics", icon: BarChart3, view: "analytics" },
      { id: "customers", label: "Go to Customers", icon: Users, view: "customers" },
      { id: "reports", label: "Go to Reports", icon: FileText, view: "reports" },
      { id: "settings", label: "Go to Settings", icon: Settings, view: "settings" },
    ],
  },
  {
    category: "Quick Actions",
    items: [
      { id: "new-shipment", label: "Create New Shipment", icon: Plus, action: "new-shipment" },
      { id: "track-package", label: "Track a Package", icon: MapPin, action: "track-package" },
      { id: "add-vehicle", label: "Add New Vehicle", icon: Truck, action: "add-vehicle" },
      { id: "generate-report", label: "Generate Report", icon: FileText, action: "generate-report" },
    ],
  },
  {
    category: "Recent Shipments",
    items: [
      { id: "shp-001", label: "SHP-2024-001 - Shanghai → Los Angeles", icon: Package, action: "view-shp-001" },
      { id: "shp-002", label: "SHP-2024-002 - Rotterdam → New York", icon: Package, action: "view-shp-002" },
      { id: "shp-003", label: "SHP-2024-003 - Dubai → London", icon: Package, action: "view-shp-003" },
    ],
  },
];

export function CommandPalette({ isOpen, onClose, onNavigate, onAction }: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredCommands = commands
    .map((category) => ({
      ...category,
      items: category.items.filter((item) =>
        item.label.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((category) => category.items.length > 0);

  const allItems = filteredCommands.flatMap((c) => c.items);

  const handleSelect = useCallback(
    (item: (typeof allItems)[0]) => {
      if ("view" in item && item.view) {
        onNavigate(item.view);
      } else if ("action" in item && item.action) {
        onAction(item.action);
      }
      onClose();
      setSearch("");
      setSelectedIndex(0);
    },
    [onNavigate, onAction, onClose]
  );

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        setSearch("");
        setSelectedIndex(0);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % allItems.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + allItems.length) % allItems.length);
      } else if (e.key === "Enter" && allItems[selectedIndex]) {
        handleSelect(allItems[selectedIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, allItems, selectedIndex, handleSelect, onClose]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  if (!isOpen) return null;

  let flatIndex = 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search commands, shipments, or navigate..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
            autoFocus
          />
          <kbd className="hidden rounded bg-secondary px-2 py-1 font-mono text-xs text-muted-foreground sm:inline-block">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Search className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p>No results found</p>
            </div>
          ) : (
            filteredCommands.map((category) => (
              <div key={category.category} className="mb-2">
                <div className="mb-1 px-2 py-1 text-xs font-medium text-muted-foreground">
                  {category.category}
                </div>
                {category.items.map((item) => {
                  const currentIndex = flatIndex++;
                  const isSelected = currentIndex === selectedIndex;
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-secondary"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="flex-1">{item.label}</span>
                      <ArrowRight
                        className={cn(
                          "h-4 w-4 opacity-0 transition-opacity",
                          isSelected && "opacity-100"
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-secondary px-1.5 py-0.5 font-mono">↑</kbd>
              <kbd className="rounded bg-secondary px-1.5 py-0.5 font-mono">↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-secondary px-1.5 py-0.5 font-mono">↵</kbd>
              select
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Command className="h-3 w-3" />
            <span>K to open</span>
          </div>
        </div>
      </div>
    </div>
  );
}
