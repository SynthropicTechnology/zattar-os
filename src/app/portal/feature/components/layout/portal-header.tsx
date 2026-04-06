"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

function getInitials(name: string): string {
  if (!name?.trim()) return "C"
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "C"
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase() || "C"
}

export function PortalHeader({ clientName }: { clientName: string }) {
  const initials = getInitials(clientName)

  return (
    <div className="flex h-16 shrink-0 items-center gap-4 px-4 md:px-8 lg:px-12 pt-2">
      {/* Mobile sidebar trigger */}
      <SidebarTrigger className="md:hidden" />
      <Separator orientation="vertical" className="mr-2 h-4 md:hidden" />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Client info */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-foreground truncate max-w-48">
            {clientName}
          </p>
          <p className="text-xs text-portal-text-muted">Portal do Cliente</p>
        </div>
        <Avatar>
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </div>
    </div>
  )
}
