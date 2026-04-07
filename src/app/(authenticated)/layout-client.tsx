"use client"

import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { UserProvider, type UserData } from "@/providers/user-provider"
import type { Permissao } from "@/app/(authenticated)/usuarios"

const MINIMAL_ROUTES = [
  "/app/chat/call",
  "/chat/call",
]

const CopilotDashboard = dynamic(
  () => import("@/components/layout/copilot-dashboard"),
  { ssr: false }
)

export function AuthenticatedLayoutClient({ 
  children,
  initialUser,
  initialPermissoes
}: { 
  children: React.ReactNode;
  initialUser: UserData | null;
  initialPermissoes: Permissao[];
}) {
  const pathname = usePathname()

  const isMinimalRoute = MINIMAL_ROUTES.some(route => pathname?.startsWith(route))
  if (isMinimalRoute) {
    return <>{children}</>
  }

  return (
    <UserProvider initialUser={initialUser} initialPermissoes={initialPermissoes}>
      <CopilotDashboard>{children}</CopilotDashboard>
    </UserProvider>
  )
}
