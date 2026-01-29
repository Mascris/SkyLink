"use client"

import dynamic from "next/dynamic"

// Dynamically import the entire dashboard with SSR disabled to prevent hydration mismatches
// from browser extensions like Dark Reader that modify the DOM before React hydrates
const DashboardContent = dynamic(() => import("@/components/dashboard/dashboard-content"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    </div>
  ),
})

export default function DashboardPage() {
  return <DashboardContent />
}
