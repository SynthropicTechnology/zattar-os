'use client'

import { useCallback, useEffect, useRef } from 'react'
import { Minus, Paperclip, X } from 'lucide-react'
import { CopilotChat } from '@copilotkit/react-core/v2'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'

interface BriefingPanelProps {
  onClose: () => void
  onMinimize: () => void
  threadId?: string
}

/** Largura do painel — deve combinar com PANEL_WIDTH em copilot-dashboard.tsx */
const PANEL_W = 380

export function BriefingPanel({ onClose, onMinimize, threadId }: BriefingPanelProps) {
  const pathname = usePathname()
  const panelRef = useRef<HTMLDivElement>(null)
  const moduleLabel = getModuleLabel(pathname || '')

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // File attachment handler
  const handleAddFile = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt'
    input.multiple = true
    input.onchange = () => {
      // TODO: integrate with file upload when CopilotKit adds native support
      // For now files can be processed via MCP tools
      const files = input.files
      if (files?.length) {
        console.log('[Pedrinho] Files selected:', Array.from(files).map((f) => f.name))
      }
    }
    input.click()
  }, [])

  return (
    <div
      ref={panelRef}
      className={cn(
        'fixed top-0 right-0 z-40 h-full',
        'flex flex-col',
        // Light mode: solid card surface
        'bg-card border-l border-border/15',
        'shadow-[-8px_0_32px_rgba(0,0,0,0.04)]',
        // Dark mode: glass surface
        'dark:bg-card/95 dark:backdrop-blur-2xl dark:border-border/6',
        'dark:shadow-[-12px_0_40px_rgba(0,0,0,0.2)]',
        // Animation
        'animate-in slide-in-from-right duration-300 ease-out',
        // This class targets all CopilotChat overrides
        'pedrinho-briefing-panel'
      )}
      style={{ width: PANEL_W }}
    >
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/8 dark:border-border/6">
        <div className="flex items-center gap-3">
          {/* Pedrinho avatar */}
          <div className="size-7 rounded-xl bg-linear-to-br from-primary/25 to-primary/8 border border-primary/12 flex items-center justify-center">
            <span className="flex gap-0.75">
              <span className="size-1.25 rounded-full bg-primary/70" />
              <span className="size-1.25rounded-full bg-primary/70" />
            </span>
          </div>
          <div>
            <h2 className="text-[13px] font-heading font-semibold text-foreground/90 leading-tight">
              Pedrinho
            </h2>
            <p className="text-[9px] text-muted-foreground/55 mt-0.5">
              Contexto: {moduleLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            onClick={onMinimize}
            className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-muted-foreground/60 hover:bg-muted/50 dark:hover:bg-white/4 transition-colors cursor-pointer"
            title="Minimizar (Esc)"
          >
            <Minus className="size-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-muted-foreground/60 hover:bg-muted/50 dark:hover:bg-white/4 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      {/* ─── CopilotChat ────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 pedrinho-chat-wrapper">
        <CopilotChat
          threadId={threadId}
          labels={{
            modalHeaderTitle: 'Pedrinho',
            welcomeMessageText: 'Olá! Como posso ajudar você hoje?',
            chatInputPlaceholder: 'Mensagem...',
            chatDisclaimerText: '',
          }}
          className="pedrinho-chat h-full"
          input={{
            onAddFile: handleAddFile,
          }}
        />
      </div>

      {/* ─── Attachment indicator (footer accent) ───────────────── */}
      <div className="flex items-center gap-2 px-5 py-2 border-t border-border/6 dark:border-border/4">
        <button
          onClick={handleAddFile}
          className="flex items-center gap-1.5 text-[9px] text-muted-foreground/50 hover:text-muted-foreground/50 transition-colors cursor-pointer"
          title="Anexar arquivo"
        >
          <Paperclip className="size-3" />
          <span>Anexar</span>
        </button>
        <div className="flex-1" />
        <kbd className="text-[8px] text-muted-foreground/60 font-mono">Esc para fechar</kbd>
      </div>
    </div>
  )
}

// ─── Helpers ────────────────────────────────────────────────────────

const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  processos: 'Processos',
  audiencias: 'Audiencias',
  expedientes: 'Expedientes',
  financeiro: 'Financeiro',
  tarefas: 'Tarefas',
  contratos: 'Contratos',
  partes: 'Partes & Clientes',
  documentos: 'Documentos',
  chat: 'Comunicacao',
  rh: 'Recursos Humanos',
  agenda: 'Agenda',
  pericias: 'Pericias',
}

function getModuleLabel(pathname: string): string {
  const match = pathname.match(/^\/app\/([^/]+)/)
  if (!match) return 'Geral'
  return MODULE_LABELS[match[1]] || match[1]
}
