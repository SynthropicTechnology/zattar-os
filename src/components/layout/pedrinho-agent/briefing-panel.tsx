'use client'

import { useCallback, useEffect } from 'react'
import { CopilotChat } from '@copilotkit/react-core/v2'
import { useAgent } from '@copilotkit/react-core/v2'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'
import { useBreakpointBelow } from '@/hooks/use-breakpoint'
import { usePanelResize } from './hooks/use-panel-resize'
import { useThreadHistory } from './hooks/use-thread-history'
import { BriefingHeader } from './components/briefing-header'
import { BriefingInput } from './components/briefing-input'
import type { MultimodalRequest } from './types'

/** Null component to disable CopilotKit's white feather gradient */
function HiddenFeather() {
  return null
}

interface BriefingPanelProps {
  onClose: () => void
  onWidthChange?: (width: number) => void
  threadId?: string
}

export function BriefingPanel({ onClose, onWidthChange, threadId: initialThreadId }: BriefingPanelProps) {
  const pathname = usePathname()
  const moduleLabel = getModuleLabel(pathname || '')
  const isMobile = useBreakpointBelow('md')
  const { agent } = useAgent()

  const { width, isResizing, handleMouseDown } = usePanelResize(onWidthChange)
  const panelWidth = isMobile ? '100vw' : width

  const {
    threads,
    activeThreadId,
    createThread,
    switchThread,
    deleteThread,
    ensureTracked,
  } = useThreadHistory(initialThreadId)

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Notify parent of width on mount and changes
  useEffect(() => {
    if (!isMobile) onWidthChange?.(width)
  }, [width, isMobile, onWidthChange])

  // --- Message Handlers ---

  const handleSendText = useCallback(
    async (text: string) => {
      if (!text.trim() || agent.isRunning) return

      // Track thread with first message as title
      ensureTracked(text.trim())

      agent.addMessage({
        id: crypto.randomUUID(),
        role: 'user' as const,
        content: text.trim(),
      })
      try {
        await agent.runAgent()
      } catch {
        // Agent handles errors internally
      }
    },
    [agent, ensureTracked]
  )

  const handleSendMultimodal = useCallback(
    async (request: MultimodalRequest) => {
      if (agent.isRunning) return

      // Track thread
      ensureTracked(request.text || 'Anexo(s)')

      // Show user message in chat
      const userContent = request.text || 'Enviou anexo(s)'
      agent.addMessage({
        id: crypto.randomUUID(),
        role: 'user' as const,
        content: userContent,
      })

      // Call multimodal API
      try {
        const response = await fetch('/api/pedrinho/multimodal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        })

        const data = await response.json()

        if (data.error) {
          agent.addMessage({
            id: crypto.randomUUID(),
            role: 'assistant' as const,
            content: `Erro: ${data.error}`,
          })
          return
        }

        agent.addMessage({
          id: crypto.randomUUID(),
          role: 'assistant' as const,
          content: data.content,
        })
      } catch {
        agent.addMessage({
          id: crypto.randomUUID(),
          role: 'assistant' as const,
          content: 'Erro ao processar os anexos. Tente novamente.',
        })
      }
    },
    [agent, ensureTracked]
  )

  const handleStopAgent = useCallback(() => {
    agent.abortRun()
  }, [agent])

  return (
    <div
      className={cn(
        'fixed top-0 right-0 z-40 h-full',
        'flex flex-col',
        'bg-card border-l border-border/12',
        'shadow-[-4px_0_24px_rgba(0,0,0,0.04)]',
        'dark:bg-card/95 dark:backdrop-blur-2xl dark:border-border/6',
        'dark:shadow-[-8px_0_32px_rgba(0,0,0,0.2)]',
        'animate-in slide-in-from-right duration-300 ease-out',
        isResizing && 'transition-none [&_.copilotKitChat]:pointer-events-none'
      )}
      style={{ width: panelWidth }}
    >
      {/* Resize handle — left edge (hidden on mobile) */}
      {!isMobile && (
        <div
          onMouseDown={handleMouseDown}
          className={cn(
            'absolute left-0 top-0 bottom-0 w-1.5 z-50',
            'cursor-col-resize group/resize',
            'hover:bg-primary/10 active:bg-primary/15',
            'transition-colors duration-150'
          )}
          title="Arrastar para redimensionar"
        >
          <div
            className={cn(
              'absolute left-0 top-1/2 -translate-y-1/2',
              'w-1 h-12 rounded-full',
              'bg-border/0 group-hover/resize:bg-primary/30',
              'transition-all duration-200'
            )}
          />
        </div>
      )}

      {/* Header */}
      <BriefingHeader
        moduleLabel={moduleLabel}
        threads={threads}
        activeThreadId={activeThreadId}
        onNewThread={createThread}
        onSwitchThread={switchThread}
        onDeleteThread={deleteThread}
        onClose={onClose}
      />

      {/* Chat messages — CopilotChat with native v2 slot overrides */}
      <div className="flex-1 min-h-0 pedrinho-chat-wrapper">
        <CopilotChat
          threadId={activeThreadId}
          labels={{
            modalHeaderTitle: 'Pedrinho',
            welcomeMessageText: 'Olá! Como posso ajudar? Envie textos, imagens, documentos ou grave áudios.',
            chatInputPlaceholder: 'Mensagem...',
            chatDisclaimerText: '',
          }}
          className="pedrinho-chat h-full"
          input="hidden"
          welcomeScreen={false}
          scrollView={{
            feather: HiddenFeather,
            scrollToBottomButton: 'hidden',
          }}
          messageView={{
            className: 'gap-3 p-4',
            assistantMessage:
              'bg-muted/40 text-foreground/85 rounded-[14px] border border-border/10 text-[13px] leading-[1.6] px-4 py-3 dark:bg-primary/4 dark:border-primary/6',
            userMessage:
              'bg-primary/7 text-foreground/90 rounded-[14px] rounded-br-[6px] border border-primary/10 text-[13px] leading-[1.6] px-3.5 py-2.5',
          }}
          /* suggestionView hidden via CSS — rendered in BriefingInput instead */
        />
      </div>

      {/* Custom input with multimodal support */}
      <BriefingInput
        onSendText={handleSendText}
        onSendMultimodal={handleSendMultimodal}
        onStopAgent={handleStopAgent}
        isAgentRunning={agent.isRunning}
        threadId={activeThreadId}
      />

      {/* Mobile close hint */}
      {isMobile && (
        <div className="flex justify-center py-1.5 border-t border-border/6">
          <span className="text-[10px] text-muted-foreground/40">Deslize para direita para fechar</span>
        </div>
      )}
    </div>
  )
}

// ─── Helpers ────────────────────────────────────────────────────────

const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  processos: 'Processos',
  audiencias: 'Audiências',
  expedientes: 'Expedientes',
  financeiro: 'Financeiro',
  tarefas: 'Tarefas',
  contratos: 'Contratos',
  partes: 'Partes & Clientes',
  documentos: 'Documentos',
  chat: 'Comunicação',
  rh: 'Recursos Humanos',
  agenda: 'Agenda',
  pericias: 'Perícias',
}

function getModuleLabel(pathname: string): string {
  const match = pathname.match(/^\/app\/([^/]+)/)
  if (!match) return 'Geral'
  return MODULE_LABELS[match[1]] || match[1]
}
