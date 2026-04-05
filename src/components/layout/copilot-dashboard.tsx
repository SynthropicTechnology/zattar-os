"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import Notifications from "@/components/layout/header/notifications"
import { AuthenticatorPopover } from "@/components/layout/header/authenticator-popover"
import { HeaderUserMenu } from "@/components/layout/header/header-user-menu"
import { useNotificacoes } from "@/app/(authenticated)/notificacoes"
import { CommandHub } from "@/components/layout/header/command-hub"
import { Terminal, MessageSquare } from "lucide-react"
import "@copilotkit/react-core/v2/styles.css"
import { CopilotKitProvider } from "@copilotkit/react-core/v2"
import { CopilotGlobalActions } from "@/lib/copilotkit/components/copilot-global-actions"
import { PedrinhoAgent, type PedrinhoMode } from "@/components/layout/pedrinho-agent"
import { PageSearchProvider } from "@/contexts/page-search-context"
import { useUser } from "@/providers/user-provider"
import { useBreakpointBelow } from "@/hooks/use-breakpoint"
import { cn } from "@/lib/utils"
import { DEFAULT_WIDTH } from "@/components/layout/pedrinho-agent/hooks/use-panel-resize"

// ─── Pedrinho Header Toggle ─────────────────────────────────────────────

function PedrinhoHeaderToggle({
  onOpenCommand,
  onOpenBriefing,
}: {
  onOpenCommand: () => void
  onOpenBriefing: () => void
}) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showMenu) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    window.addEventListener("mousedown", handleClick)
    return () => window.removeEventListener("mousedown", handleClick)
  }, [showMenu])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setShowMenu((prev) => !prev)
  }, [])

  const handleMenuAction = useCallback(
    (action: "command" | "briefing") => {
      setShowMenu(false)
      if (action === "command") onOpenCommand()
      else onOpenBriefing()
    },
    [onOpenCommand, onOpenBriefing]
  )

  return (
    <div className="relative">
      {/* Context Menu */}
      {showMenu && (
        <div
          ref={menuRef}
          className="absolute top-full right-0 mt-2 animate-in fade-in zoom-in-95 slide-in-from-top-1 duration-150 z-50"
        >
          <div className="flex flex-col gap-0.5 min-w-40 rounded-xl border border-border/20 bg-card/95 backdrop-blur-xl p-1 shadow-[0_4px_16px_rgba(0,0,0,0.1),0_12px_40px_rgba(0,0,0,0.08)] dark:border-border/10 dark:bg-background/90 dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <button
              onClick={() => handleMenuAction("command")}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-medium text-foreground/70 hover:bg-primary/6 hover:text-foreground/90 transition-colors cursor-pointer"
            >
              <Terminal className="size-3.5 text-primary/50" />
              Comando
              <kbd className="ml-auto text-[8px] text-muted-foreground/50 font-mono">⌘J</kbd>
            </button>
            <button
              onClick={() => handleMenuAction("briefing")}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-medium text-foreground/70 hover:bg-primary/6 hover:text-foreground/90 transition-colors cursor-pointer"
            >
              <MessageSquare className="size-3.5 text-primary/50" />
              Conversa
              <kbd className="ml-auto text-[8px] text-muted-foreground/50 font-mono">⌘⇧J</kbd>
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button — two-dot signature */}
      <button
        onClick={onOpenCommand}
        onContextMenu={handleContextMenu}
        className={cn(
          "pedrinho-header-toggle group/pedrinho relative flex items-center justify-center",
          "size-9 rounded-xl cursor-pointer",
          "bg-card/50 border border-border/30",
          "hover:bg-primary/8 hover:border-primary/25",
          "hover:shadow-[0_0_16px_oklch(var(--primary)/0.12)]",
          "active:scale-95",
          "transition-all duration-200 ease-out"
        )}
        title="Pedrinho · Clique: comando | Botão direito: opções"
      >
        {/* Glow on hover */}
        <div className="absolute inset-0 rounded-xl bg-primary/6 opacity-0 group-hover/pedrinho:opacity-100 transition-opacity duration-300" />

        {/* Two-dot signature */}
        <span className="relative flex items-center justify-center">
          <span className="flex gap-1.5">
            <span className="size-1.5 rounded-full bg-primary/70 group-hover/pedrinho:bg-primary transition-colors duration-200" />
            <span className="size-1.5 rounded-full bg-primary/70 group-hover/pedrinho:bg-primary transition-colors duration-200" />
          </span>
        </span>
      </button>
    </div>
  )
}

// ─── Dashboard Header ────────────────────────────────────────────────────

function DashboardHeader({
  onOpenCommand,
  onOpenBriefing,
}: {
  onOpenCommand: () => void
  onOpenBriefing: () => void
}) {
  const { contador } = useNotificacoes({ pagina: 1, limite: 1, lida: false })
  const hasUnread = contador.total > 0

  return (
    <div className="flex h-16 shrink-0 items-center gap-4 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 pt-2 z-40">
      {/* Esquerda: Avatar + ícones hover-reveal */}
      <div className="group/avatar flex items-center gap-1">
        <div className="relative">
          <HeaderUserMenu />
          {hasUnread && (
            <span className="absolute -right-0.5 -top-0.5 block size-2.5 rounded-full bg-destructive ring-2 ring-background" />
          )}
        </div>

        {/* Ícones aparecem com animação no hover */}
        <div
          className={cn(
            "flex items-center gap-0.5",
            "opacity-0 -translate-x-2 scale-90 pointer-events-none",
            "group-hover/avatar:opacity-100 group-hover/avatar:translate-x-0 group-hover/avatar:scale-100 group-hover/avatar:pointer-events-auto",
            "transition-all duration-250 ease-out",
            // Mantém visível quando um popover/dropdown está aberto
            "group-has-data-[state=open]/avatar:opacity-100",
            "group-has-data-[state=open]/avatar:translate-x-0",
            "group-has-data-[state=open]/avatar:scale-100",
            "group-has-data-[state=open]/avatar:pointer-events-auto"
          )}
        >
          <AuthenticatorPopover />
          <Notifications />
        </div>
      </div>

      {/* Centro: espaçador + Command Hub + espaçador */}
      <div className="flex-1" />
      <CommandHub />
      <div className="flex-1" />

      {/* Direita: Pedrinho toggle */}
      <PedrinhoHeaderToggle
        onOpenCommand={onOpenCommand}
        onOpenBriefing={onOpenBriefing}
      />
    </div>
  )
}

export default function CopilotDashboard({ children }: { children: React.ReactNode }) {
  const { id: userId } = useUser()
  const [pedrinhoMode, setPedrinhoMode] = useState<PedrinhoMode>('orb')
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH)
  const isMobile = useBreakpointBelow('md')

  const isBriefingOpen = pedrinhoMode === 'briefing'

  return (
    <CopilotKitProvider
      runtimeUrl="/api/copilotkit"
      publicApiKey={process.env.NEXT_PUBLIC_COPILOTKIT_API_KEY}
      onError={(event) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[CopilotKit ${event.code}]`, event.error.message)
        }
      }}
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
          style={{ right: isBriefingOpen && !isMobile ? panelWidth : 0 }}
        >
          <DashboardHeader
            onOpenCommand={() => setPedrinhoMode('command')}
            onOpenBriefing={() => setPedrinhoMode('briefing')}
          />
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
        onWidthChange={setPanelWidth}
      />
    </CopilotKitProvider>
  )
}
