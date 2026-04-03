"use client"

import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { UserProvider } from "@/providers/user-provider"

const MINIMAL_ROUTES = [
  "/chat/call",
]

// Lazy-load CopilotKit + Dashboard shell (evita compilar 108MB de módulos no startup)
const CopilotDashboard = dynamic(
  () => import("@/components/layout/copilot-dashboard"),
  { ssr: false }
)

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const isMinimalRoute = MINIMAL_ROUTES.some(route => pathname?.startsWith(route))
  if (isMinimalRoute) {
    return <>{children}</>
  }

  return (
    <UserProvider>
      <CopilotDashboard>{children}</CopilotDashboard>
    </UserProvider>
  )
}
