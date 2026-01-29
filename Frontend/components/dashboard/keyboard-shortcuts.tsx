"use client";

import { X, Command } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  {
    category: "General",
    items: [
      { keys: ["⌘", "K"], description: "Open command palette" },
      { keys: ["⌘", "B"], description: "Toggle sidebar" },
      { keys: ["⌘", "/"], description: "Show keyboard shortcuts" },
      { keys: ["Esc"], description: "Close modals/panels" },
    ],
  },
  {
    category: "Navigation",
    items: [
      { keys: ["G", "O"], description: "Go to Overview" },
      { keys: ["G", "S"], description: "Go to Shipments" },
      { keys: ["G", "F"], description: "Go to Fleet" },
      { keys: ["G", "T"], description: "Go to Tracking" },
      { keys: ["G", "A"], description: "Go to Analytics" },
      { keys: ["G", "C"], description: "Go to Customers" },
    ],
  },
  {
    category: "Actions",
    items: [
      { keys: ["N"], description: "New shipment" },
      { keys: ["⌘", "F"], description: "Focus search" },
      { keys: ["R"], description: "Refresh data" },
      { keys: ["⌘", "E"], description: "Export data" },
    ],
  },
];

export function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
              <Command className="h-5 w-5 text-foreground" />
            </div>
            <h2 className="font-semibold text-foreground">Keyboard Shortcuts</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-6 space-y-6">
          {shortcuts.map((category) => (
            <div key={category.category}>
              <h3 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {category.category}
              </h3>
              <div className="space-y-2">
                {category.items.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-2.5"
                  >
                    <span className="text-sm text-foreground">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex}>
                          <kbd className="min-w-[28px] rounded bg-background border border-border px-2 py-1 text-center font-mono text-xs text-foreground">
                            {key}
                          </kbd>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="mx-1 text-muted-foreground">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border px-6 py-4 text-center text-sm text-muted-foreground">
          Press <kbd className="rounded bg-secondary px-2 py-0.5 font-mono text-xs">⌘</kbd> +{" "}
          <kbd className="rounded bg-secondary px-2 py-0.5 font-mono text-xs">/</kbd> anytime to
          show this dialog
        </div>
      </div>
    </div>
  );
}
