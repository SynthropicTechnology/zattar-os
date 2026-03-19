"use client"

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
        <Separator orientation="vertical" className="h-4 bg-border" />
        <Search />
      </div>
      <div className="flex items-center gap-2">
        <AuthenticatorPopover />
        <Notifications />
        <AiSphere onClick={() => setOpen(!open)} size={30} />
        <Separator orientation="vertical" className="h-4 bg-border" />
        <HeaderUserMenu />
      </div>
    </header>
  )
}

export default function CopilotDashboard({ children }: { children: React.ReactNode }) {
  return (
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
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="h-svh min-h-svh overflow-hidden flex flex-col bg-muted/30">
            <DashboardHeader />
            <div
              id="portal-content"
              className="flex min-h-0 flex-1 flex-col overflow-y-auto scroll-smooth gap-6 p-6"
            >
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </CopilotSidebar>
    </CopilotKit>
  )
}
