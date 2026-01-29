"use client"

import React from "react"

import { useState } from "react"
import { Search, Bell, Calendar, X, Command, Activity, Keyboard } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  onNotificationsClick: () => void
  onSearch: (query: string) => void
  onCommandPalette: () => void
  onActivityFeed: () => void
  onKeyboardShortcuts: () => void
}

export function Header({ onNotificationsClick, onSearch, onCommandPalette, onActivityFeed, onKeyboardShortcuts }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(searchQuery)
  }

  const clearSearch = () => {
    setSearchQuery("")
    onSearch("")
  }

  return (
    <header className="flex items-center justify-between h-16 px-6 border-b border-border bg-background">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
          <Calendar className="w-3.5 h-3.5" />
          <span>{today}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Mobile Search Toggle */}
        <Button 
          variant="outline" 
          size="icon" 
          className="md:hidden bg-transparent"
          onClick={() => setShowSearch(!showSearch)}
        >
          <Search className="w-4 h-4" />
          <span className="sr-only">Search</span>
        </Button>

        {/* Desktop Search */}
        <form onSubmit={handleSearch} className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="w-64 pl-9 pr-9 bg-secondary border-border"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        
        {/* Command Palette Trigger */}
        <Button
          variant="outline"
          className="hidden md:flex items-center gap-2 bg-transparent text-muted-foreground hover:text-foreground"
          onClick={onCommandPalette}
        >
          <Command className="w-4 h-4" />
          <span className="text-sm">Search...</span>
          <kbd className="ml-2 rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">⌘K</kbd>
        </Button>

        {/* Keyboard Shortcuts */}
        <Button
          variant="outline"
          size="icon"
          className="hidden md:flex bg-transparent"
          onClick={onKeyboardShortcuts}
        >
          <Keyboard className="w-4 h-4" />
          <span className="sr-only">Keyboard Shortcuts</span>
        </Button>

        {/* Activity Feed */}
        <Button 
          variant="outline" 
          size="icon" 
          className="relative bg-transparent"
          onClick={onActivityFeed}
        >
          <Activity className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <span className="sr-only">Activity Feed</span>
        </Button>

        <Button 
          variant="outline" 
          size="icon" 
          className="relative bg-transparent"
          onClick={onNotificationsClick}
        >
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-[10px] font-medium bg-destructive text-destructive-foreground rounded-full">
            3
          </span>
          <span className="sr-only">Notifications</span>
        </Button>
      </div>

      {/* Mobile Search Overlay */}
      {showSearch && (
        <div className="absolute inset-x-0 top-16 p-4 bg-background border-b border-border md:hidden z-40">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search shipments, customers..."
              className="w-full pl-9 pr-9 bg-secondary border-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>
      )}
    </header>
  )
}
