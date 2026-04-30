"use client"

import React from "react"
import { Bell, Calendar, Command, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"

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
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [localTheme, setLocalTheme] = React.useState<string | null>(null)

  React.useEffect(() => {
    setMounted(true)
    setLocalTheme(document.documentElement.classList.contains('light') ? 'light' : 'dark')
  }, [])

  const currentTheme = localTheme || (theme === 'system' ? resolvedTheme : theme)
  const isDark = currentTheme === "dark"

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  return (
    <header className="flex items-center justify-between h-14 px-6 border-b border-[var(--sidebar-border)] bg-[var(--sidebar)] shrink-0">
      {/* Left — Title + date */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-sm font-semibold text-sidebar-foreground uppercase tracking-widest">{title}</h1>
          <div className="flex items-center gap-1.5 text-[10px] text-sidebar-accent-foreground font-mono mt-0.5">
            <Calendar className="w-3 h-3" />
            <span>{today}</span>
            <span className="mx-1 opacity-40">·</span>
            <span className="text-blue-400/70">UTC {new Date().toISOString().slice(11, 19)}</span>
          </div>
        </div>
      </div>

      {/* Right — Actions */}
      <div className="flex items-center gap-2">
        {/* Command Palette trigger */}
        <button
          onClick={onCommandPalette}
          className="hidden md:flex items-center gap-2 h-8 px-3 rounded-lg bg-[var(--sidebar-accent)] border border-[var(--sidebar-border)] text-sidebar-accent-foreground hover:text-blue-400 hover:border-blue-400/30 transition-all text-xs font-mono"
        >
          <Command className="w-3.5 h-3.5" />
          <span>⌘K</span>
        </button>



        {/* Bell / Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative w-8 h-8 text-sidebar-accent-foreground hover:text-blue-400 hover:bg-blue-400/5"
          onClick={onNotificationsClick}
        >
          <Bell className="w-4 h-4" />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 text-[9px] font-bold bg-blue-400 text-[#0d1526] rounded-full">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </Button>
      </div>
    </header>
  )
}
