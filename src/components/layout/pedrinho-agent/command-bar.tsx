'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, Loader2, Square } from 'lucide-react'
import { useAgent, useSuggestions } from '@copilotkit/react-core/v2'
import { cn } from '@/lib/utils'

interface CommandBarProps {
  onClose: () => void
  onExpandToBriefing: () => void
}

export function CommandBar({ onClose, onExpandToBriefing }: CommandBarProps) {
  const { agent } = useAgent()
  const { suggestions } = useSuggestions()
  const inputRef = useRef<HTMLInputElement>(null)
  const [input, setInput] = useState('')
  const [hasResponse, setHasResponse] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100)
    return () => clearTimeout(timer)
  }, [])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [agent.messages])

  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim() || agent.isRunning) return

      const userMessage = {
        id: crypto.randomUUID(),
        role: 'user' as const,
        content: text.trim(),
      }

      agent.addMessage(userMessage)
      setInput('')
      setHasResponse(true)

      try {
        await agent.runAgent()
      } catch {
        // Agent handles errors internally
      }
    },
    [agent]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend(input)
      }
      if (e.key === 'Escape') {
        onClose()
      }
    },
    [input, handleSend, onClose]
  )

  // Get the latest assistant messages (after the last user message)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const latestMessages = getLatestExchange(agent.messages as any[])

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[6px] animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Command Bar */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4 pointer-events-none">
        <div
          className={cn(
            'pointer-events-auto w-full max-w-[560px]',
            'bg-background/60 backdrop-blur-2xl',
            'border border-border/10',
            'rounded-2xl',
            'shadow-[0_25px_60px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.03)]',
            'animate-in fade-in zoom-in-95 duration-200',
            'flex flex-col overflow-hidden',
            hasResponse && 'max-h-[60vh]'
          )}
        >
          {/* Input Area */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            {/* Listening indicator */}
            <div className="shrink-0">
              {agent.isRunning ? (
                <Loader2 className="size-4 text-primary animate-spin" />
              ) : (
                <div className="size-2 rounded-full bg-primary animate-pulse" />
              )}
            </div>

            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte ao Pedrinho..."
              className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/30 outline-none"
              autoComplete="off"
              spellCheck={false}
            />

            <div className="flex items-center gap-2 shrink-0">
              {agent.isRunning ? (
                <button
                  onClick={() => agent.abortRun()}
                  className="p-1.5 rounded-lg text-muted-foreground/30 hover:text-destructive/60 hover:bg-destructive/6 transition-colors cursor-pointer"
                  title="Parar"
                >
                  <Square className="size-3.5" />
                </button>
              ) : input.trim() ? (
                <button
                  onClick={() => handleSend(input)}
                  className="p-1.5 rounded-lg text-primary/60 hover:text-primary hover:bg-primary/8 transition-colors cursor-pointer"
                >
                  <ArrowRight className="size-3.5" />
                </button>
              ) : (
                <kbd className="text-[9px] text-muted-foreground/15 px-1.5 py-0.5 rounded border border-border/10 bg-white/2 font-mono">
                  ⌘J
                </kbd>
              )}
            </div>
          </div>

          {/* Quick Action Chips (show when no response yet) */}
          {!hasResponse && suggestions.length > 0 && (
            <>
              <div className="h-px bg-border/6 mx-4" />
              <div className="flex flex-wrap gap-1.5 px-4 py-3">
                {suggestions.slice(0, 5).map((suggestion) => (
                  <button
                    key={suggestion.title}
                    onClick={() => handleSend(suggestion.message)}
                    className={cn(
                      'text-[10px] font-medium px-2.5 py-1 rounded-lg',
                      'bg-primary/6 border border-primary/10 text-primary/50',
                      'hover:bg-primary/12 hover:text-primary/70 hover:border-primary/20',
                      'transition-all duration-150 cursor-pointer'
                    )}
                  >
                    {suggestion.title}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Response Area */}
          {hasResponse && (
            <>
              <div className="h-px bg-border/6" />
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-macos min-h-0">
                {latestMessages.map((msg) => (
                  <CommandBarMessage key={msg.id} message={msg} />
                ))}

                {/* Typing indicator */}
                {agent.isRunning && latestMessages.every((m) => m.role !== 'assistant') && (
                  <div className="flex items-center gap-2 py-2">
                    <PedrinhoAvatar size="sm" />
                    <div className="flex gap-1">
                      <span className="size-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:0ms]" />
                      <span className="size-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:150ms]" />
                      <span className="size-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Bottom bar: expand to briefing */}
              <div className="h-px bg-border/6" />
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-[9px] text-muted-foreground/15">
                  {agent.messages.length} mensagens na conversa
                </span>
                <button
                  onClick={onExpandToBriefing}
                  className="text-[10px] text-primary/40 hover:text-primary/70 transition-colors cursor-pointer"
                >
                  Expandir conversa →
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────

function PedrinhoAvatar({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'size-5' : 'size-6'
  const dotSize = size === 'sm' ? 'size-[3px]' : 'size-1'

  return (
    <div
      className={cn(
        sizeClass,
        'rounded-lg bg-linear-to-br from-primary/30 to-primary/10',
        'border border-primary/15 flex items-center justify-center shrink-0'
      )}
    >
      <span className="flex gap-0.5">
        <span className={cn(dotSize, 'rounded-full bg-primary/60')} />
        <span className={cn(dotSize, 'rounded-full bg-primary/60')} />
      </span>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CommandBarMessage({ message }: { message: any }) {
  if (message.role === 'user') {
    const content =
      typeof message.content === 'string'
        ? message.content
        : Array.isArray(message.content)
          ? message.content
              .filter((c: { type?: string; text?: string }) => c.text)
              .map((c: { text: string }) => c.text)
              .join('')
          : ''

    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-primary/8 border border-primary/10 rounded-2xl rounded-br-lg px-3.5 py-2">
          <p className="text-[12px] text-foreground/80">{content}</p>
        </div>
      </div>
    )
  }

  if (message.role === 'assistant' && message.content) {
    return (
      <div className="flex items-start gap-2">
        <PedrinhoAvatar size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] text-muted-foreground/25 font-semibold">Pedrinho</span>
          </div>
          <div className="text-[12px] text-foreground/70 leading-relaxed pedrinho-markdown">
            {message.content}
          </div>
        </div>
      </div>
    )
  }

  return null
}

// ─── Helpers ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getLatestExchange(messages: any[]): any[] {
  if (messages.length === 0) return []

  // Find the last user message index
  let lastUserIdx = -1
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      lastUserIdx = i
      break
    }
  }

  if (lastUserIdx === -1) return messages.slice(-3)

  // Return from last user message onwards
  return messages.slice(lastUserIdx)
}
