"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Settings } from "lucide-react"

export function SettingsView() {
  return (
    <div className="flex items-center justify-center h-[600px]">
      <Card className="bg-card border-border max-w-md">
        <CardContent className="p-12 text-center">
          <Settings className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Settings
          </h2>
          <p className="text-muted-foreground">
            Application settings and preferences coming soon. Currently focused on shipment tracking.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
