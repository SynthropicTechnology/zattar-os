"use client"

import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/layout/sidebar/app-sidebar"
import Search from "@/components/layout/header/search"
import Notifications from "@/components/layout/header/notifications"
import { AiSphere } from "@/components/layout/header/ai-sphere"
import { AuthenticatorPopover } from "@/components/layout/header/authenticator-popover"
import { HeaderUserMenu } from "@/components/layout/header/header-user-menu"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { CopilotKit } from "@copilotkit/react-core"
import "@copilotkit/react-ui/styles.css"
import { CopilotSidebar, useChatContext } from "@copilotkit/react-ui"
import { SYSTEM_PROMPT } from "@/lib/copilotkit/system-prompt"
import { cn } from "@/lib/utils"
import { UserProvider } from "@/providers/user-provider"

const AUTH_ROUTES = [
  "/app/login",
  "/app/sign-up",
  "/app/sign-up-success",
  "/app/forgot-password",
  "/app/update-password",
  "/app/confirm",
  "/app/error",
]

const MINIMAL_ROUTES = [
  "/app/chat/call",
]

function DashboardHeader() {
  const { open, setOpen } = useChatContext()

  return (
    <header
      className={cn(
        "flex h-14 shrink-0 items-center justify-between gap-4 px-4 transition-all duration-200",
        "bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-white/20 dark:border-slate-700/50 shadow-sm"
      )}
    >
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1 hover:bg-muted transition-colors" />
        <Separator orientation="vertical" className="h-5 bg-border/50" />
        <Search />
      </div>
      <div className="flex items-center gap-2">
        <AuthenticatorPopover />
        <Notifications />
        <AiSphere onClick={() => setOpen(!open)} />
        <Separator orientation="vertical" className="h-5 bg-border/50" />
        <HeaderUserMenu />
      </div>
    </header>
  )
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="h-screen overflow-hidden flex flex-col bg-muted/30">
        <DashboardHeader />
        <div
          id="portal-content"
          className="flex min-h-0 flex-1 flex-col overflow-y-auto scroll-smooth gap-6 p-6"
        >
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthRoute = AUTH_ROUTES.some(route => pathname?.startsWith(route))

  if (isAuthRoute) {
    return <div className="min-h-svh bg-background">{children}</div>
  }

  const isMinimalRoute = MINIMAL_ROUTES.some(route => pathname?.startsWith(route))
  if (isMinimalRoute) {
    return <>{children}</>
  }

  return (
    <UserProvider>
      <CopilotKit runtimeUrl="/api/copilotkit" useSingleEndpoint>
        <CopilotSidebar
          defaultOpen={false}
          instructions={SYSTEM_PROMPT}
          labels={{
            title: "Pedrinho",
            initial: "Olá! Como posso ajudar você hoje?",
          }}
          Button={() => null}
        >
          <DashboardContent>{children}</DashboardContent>
        </CopilotSidebar>
      </CopilotKit>
    </UserProvider>
  )
}
