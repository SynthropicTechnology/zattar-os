"use client"

import Image from "next/image"
import Search from "@/components/layout/header/search"
import Notifications from "@/components/layout/header/notifications"
import { AiSphere } from "@/components/layout/header/ai-sphere"
import { AuthenticatorPopover } from "@/components/layout/header/authenticator-popover"
import { HeaderUserMenu } from "@/components/layout/header/header-user-menu"
import { Separator } from "@/components/ui/separator"
import { AppDock } from "@/components/layout/dock/app-dock"
import { CopilotKit } from "@copilotkit/react-core"
import "@copilotkit/react-ui/styles.css"
import { CopilotSidebar, useChatContext } from "@copilotkit/react-ui"
import { SYSTEM_PROMPT } from "@/lib/copilotkit/system-prompt"
import { CopilotGlobalActions } from "@/lib/copilotkit/components/copilot-global-actions"

function DashboardHeader() {
  const { open, setOpen } = useChatContext()

  return (
    <div className="flex h-16 shrink-0 items-center justify-between gap-4 px-6 pt-2 z-40">
      <div className="flex items-center gap-3">
        <Image
          src="/logos/logo-small-light.svg"
          alt="Zattar"
          width={32}
          height={32}
          className="h-8 w-8 object-contain dark:hidden"
          priority
        />
        <Image
          src="/logos/logo-small-dark.svg"
          alt="Zattar"
          width={32}
          height={32}
          className="h-8 w-8 object-contain hidden dark:block"
          priority
        />
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
    </div>
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
        {/* Registra ações globais + contexto de rota como readable state */}
        <CopilotGlobalActions />
        <div className="fixed inset-0 flex flex-col bg-background canvas-dots">
          <DashboardHeader />
          <div
            id="portal-content"
            className="flex min-h-0 flex-1 flex-col overflow-y-auto scroll-smooth gap-6 p-6 pb-24 scrollbar-macos"
          >
            {children}
          </div>
          <AppDock />
        </div>
      </CopilotSidebar>
    </CopilotKit>
  )
}
