'use client'

import { useEffect, useRef } from 'react'
import { Minus, X } from 'lucide-react'
import { CopilotChat } from '@copilotkit/react-core/v2'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'

interface BriefingPanelProps {
  onClose: () => void
  onMinimize: () => void
  threadId?: string
}

export function BriefingPanel({ onClose, onMinimize, threadId }: BriefingPanelProps) {
  const pathname = usePathname()
  const panelRef = useRef<HTMLDivElement>(null)

  // Extract current module for context display
  const moduleLabel = getModuleLabel(pathname || '')

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <>
      {/* Backdrop — subtle, doesn't block interaction */}
      <div
        className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[2px] animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          'fixed top-0 right-0 z-50 h-full w-95 max-w-[90vw]',
          'bg-background/90 backdrop-blur-3xl',
          'border-l border-border/6',
          'shadow-[-20px_0_60px_rgba(0,0,0,0.25)]',
          'animate-in slide-in-from-right duration-300 ease-out',
          'flex flex-col',
          // This class will be targeted by our CSS overrides
          'pedrinho-briefing-panel'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/6">
          <div className="flex items-center gap-2.5">
            {/* Pedrinho avatar */}
            <div className="size-6 rounded-lg bg-linear-to-br from-primary/30 to-primary/10 border border-primary/15 flex items-center justify-center">
              <span className="flex gap-0.5">
                <span className="size-1 rounded-full bg-primary/60" />
                <span className="size-1 rounded-full bg-primary/60" />
              </span>
            </div>
            <div>
              <h2 className="text-[13px] font-semibold text-foreground/90">Pedrinho</h2>
              <p className="text-[9px] text-muted-foreground/20">
                Contexto: {moduleLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onMinimize}
              className="p-1.5 rounded-lg text-muted-foreground/20 hover:text-muted-foreground/50 hover:bg-white/4 transition-colors cursor-pointer"
              title="Minimizar"
            >
              <Minus className="size-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground/20 hover:text-muted-foreground/50 hover:bg-white/4 transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>

        {/* CopilotChat — the actual chat, fully styled via CSS overrides */}
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
          />
        </div>
      </div>
    </>
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
