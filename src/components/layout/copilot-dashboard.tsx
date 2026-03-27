"use client"

import Image from "next/image"
import CommandMenu from "@/components/layout/header/search"
import Notifications from "@/components/layout/header/notifications"
import { AuthenticatorPopover } from "@/components/layout/header/authenticator-popover"
import { HeaderUserMenu } from "@/components/layout/header/header-user-menu"
import { Separator } from "@/components/ui/separator"
import { GooeySearchBar } from "@/components/ui/animated-search-bar"
import { AppDock } from "@/components/layout/dock/app-dock"
import "@copilotkit/react-core/v2/styles.css"
import { CopilotKitProvider, CopilotPopup } from "@copilotkit/react-core/v2"
import { X } from "lucide-react"
import { CopilotGlobalActions } from "@/lib/copilotkit/components/copilot-global-actions"
import { PageSearchProvider, usePageSearch } from "@/contexts/page-search-context"
import { useUser } from "@/providers/user-provider"

function HeaderSearchBar() {
  const { value, setValue, placeholder } = usePageSearch()

  return (
    <GooeySearchBar
      value={value}
      onChange={setValue}
      placeholder={placeholder}
    />
  )
}

function DashboardHeader() {
  return (
    <div className="flex h-16 shrink-0 items-center gap-4 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 pt-2 z-40">
      {/* Esquerda: Logo */}
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
      </div>

      {/* Centro: Search Bar (ocupa espaço flexível, conteúdo centralizado) */}
      <div className="flex-1 flex justify-center">
        <HeaderSearchBar />
      </div>

      {/* Direita: Ações */}
      <div className="flex items-center gap-2">
        <AuthenticatorPopover />
        <Notifications />
        <Separator orientation="vertical" className="h-4 bg-border" />
        <HeaderUserMenu />
      </div>

      {/* Command Palette (invisível, apenas Cmd+K) */}
      <CommandMenu />
    </div>
  )
}

export default function CopilotDashboard({ children }: { children: React.ReactNode }) {
  const { id: userId } = useUser()

  return (
    <CopilotKitProvider
      runtimeUrl="/api/copilotkit"
      publicApiKey={process.env.NEXT_PUBLIC_COPILOTKIT_API_KEY}
    >
      {/* Registra ações globais + contexto de rota como readable state */}
      <CopilotGlobalActions />

      {/* Conteúdo do app — fora do CopilotPopup (v2 é standalone) */}
      <PageSearchProvider>
        <div className="fixed inset-0 flex flex-col bg-background canvas-dots">
          <DashboardHeader />
          <div
            id="portal-content"
            className="flex min-h-0 flex-1 flex-col overflow-y-auto scroll-smooth gap-6 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-6 pb-24 scrollbar-macos"
          >
            {children}
          </div>
          <AppDock />
        </div>
      </PageSearchProvider>

      {/* Chat popup — card flutuante expansível, sem sidebar lateral */}
      <CopilotPopup
        defaultOpen={false}
        threadId={`user-${userId}`}
        labels={{
          modalHeaderTitle: "Pedrinho",
          welcomeMessageText: "Olá! Como posso ajudar você hoje?",
          chatDisclaimerText: "",
        }}
        toggleButton={{
          className: "copilot-toggle-btn",
          openIcon: () => (
            <span className="flex items-center justify-center px-3.5 py-2 bg-foreground rounded-full transition-transform duration-200 group-hover:scale-105">
              <span className="flex gap-2">
                <span className="size-2 rounded-full bg-background" />
                <span className="size-2 rounded-full bg-background" />
              </span>
            </span>
          ),
          closeIcon: () => <X className="size-5 text-foreground" />,
        }}
      />
    </CopilotKitProvider>
  )
}
