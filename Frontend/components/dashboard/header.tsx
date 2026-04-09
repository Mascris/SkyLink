"use client"

import React from "react"
import { Bell, Calendar, Command } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  onNotificationsClick: () => void
  onSearch: (query: string) => void
  onCommandPalette: () => void
  onActivityFeed: () => void
  onKeyboardShortcuts: () => void
  title: string
  notificationCount?: number
}

export function Header({
  onNotificationsClick,
  onCommandPalette,
  title,
  notificationCount = 0,
}: HeaderProps) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  return (
    <header className="flex items-center justify-between h-14 px-6 border-b border-[#1e293b] bg-[#050b14] shrink-0">
      {/* Left — Title + date */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-sm font-semibold text-white uppercase tracking-widest">{title}</h1>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono mt-0.5">
            <Calendar className="w-3 h-3" />
            <span>{today}</span>
            <span className="mx-1 text-slate-700">·</span>
            <span className="text-cyan-500/60">UTC {new Date().toISOString().slice(11, 19)}</span>
          </div>
        </div>
      </div>

      {/* Right — Actions */}
      <div className="flex items-center gap-2">
        {/* Command Palette trigger */}
        <button
          onClick={onCommandPalette}
          className="hidden md:flex items-center gap-2 h-8 px-3 rounded-lg bg-[#0f172a] border border-[#1e293b] text-slate-500 hover:text-cyan-400 hover:border-cyan-500/30 transition-all text-xs font-mono"
        >
          <Command className="w-3.5 h-3.5" />
          <span>⌘K</span>
        </button>

        {/* Bell / Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative w-8 h-8 text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/5"
          onClick={onNotificationsClick}
        >
          <Bell className="w-4 h-4" />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 text-[9px] font-bold bg-cyan-500 text-black rounded-full">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </Button>
      </div>
    </header>
  )
}
