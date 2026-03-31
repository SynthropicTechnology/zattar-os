"use client"

import { useState } from "react"
import Notifications from "@/components/layout/header/notifications"
import { AuthenticatorPopover } from "@/components/layout/header/authenticator-popover"
import { HeaderUserMenu } from "@/components/layout/header/header-user-menu"
import { CommandHub } from "@/components/layout/header/command-hub"
import { Separator } from "@/components/ui/separator"
import "@copilotkit/react-core/v2/styles.css"
import { CopilotKitProvider } from "@copilotkit/react-core/v2"
import { CopilotGlobalActions } from "@/lib/copilotkit/components/copilot-global-actions"
import { PedrinhoAgent, type PedrinhoMode } from "@/components/layout/pedrinho-agent"
import { PageSearchProvider } from "@/contexts/page-search-context"
import { useUser } from "@/providers/user-provider"
import { cn } from "@/lib/utils"

function DashboardHeader() {
  return (
    <div className="flex h-16 shrink-0 items-center gap-4 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 pt-2 z-40">
      {/* Esquerda: espaçador */}
      <div className="flex-1" />

      {/* Centro: Logo Z + Command Hub */}
      <CommandHub />

      {/* Direita: Ações */}
      <div className="flex-1 flex items-center justify-end gap-2">
        <AuthenticatorPopover />
        <Notifications />
        <Separator orientation="vertical" className="h-4 bg-border" />
        <HeaderUserMenu />
      </div>
    </div>
  )
}

/** Largura do Briefing Panel */
const PANEL_WIDTH = 380

export default function CopilotDashboard({ children }: { children: React.ReactNode }) {
  const { id: userId } = useUser()
  const [pedrinhoMode, setPedrinhoMode] = useState<PedrinhoMode>('orb')

  const isBriefingOpen = pedrinhoMode === 'briefing'

  return (
    <CopilotKitProvider
      runtimeUrl="/api/copilotkit"
      publicApiKey={process.env.NEXT_PUBLIC_COPILOTKIT_API_KEY}
    >
      {/* Registra ações globais + contexto de rota como readable state */}
      <CopilotGlobalActions />

      {/* Conteúdo do app — empurra para a esquerda quando Briefing está aberto */}
      <PageSearchProvider>
        <div
          className={cn(
            "fixed top-0 left-0 bottom-0 flex flex-col bg-background canvas-dots",
            "transition-[right] duration-300 ease-out"
          )}
          style={{ right: isBriefingOpen ? PANEL_WIDTH : 0 }}
        >
          <DashboardHeader />
          <div
            id="portal-content"
            className="flex min-h-0 flex-1 flex-col overflow-y-auto scroll-smooth gap-6 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-6 pb-8 scrollbar-macos"
          >
            {children}
          </div>
          {/* AppDock removido — navegação agora via Command Hub na logo */}
        </div>
      </PageSearchProvider>

      {/* Pedrinho Ambient Agent — 3 modos: Orb, Command Bar, Briefing Panel */}
      <PedrinhoAgent
        userId={String(userId ?? '')}
        mode={pedrinhoMode}
        onModeChange={setPedrinhoMode}
      />
    </CopilotKitProvider>
  )
}
