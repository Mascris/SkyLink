"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users } from "lucide-react"

export function CustomersView() {
  return (
    <div className="flex items-center justify-center h-[600px]">
      <Card className="bg-card border-border max-w-md">
        <CardContent className="p-12 text-center">
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Customers Module
          </h2>
          <p className="text-muted-foreground">
            Customer management features coming soon. Currently focused on shipment tracking.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
