'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MessageSquare, Terminal, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PulseOrbProps {
  onOpenCommandBar: () => void
  onOpenBriefing: () => void
  hasProactiveNudge?: boolean
  nudgeMessage?: string
  onDismissNudge?: () => void
}

export function PulseOrb({
  onOpenCommandBar,
  onOpenBriefing,
  hasProactiveNudge = false,
  nudgeMessage,
  onDismissNudge,
}: PulseOrbProps) {
  const [showNudge, setShowNudge] = useState(false)
  const [nudgeDismissed, setNudgeDismissed] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (hasProactiveNudge && nudgeMessage && !nudgeDismissed) {
      const timer = setTimeout(() => setShowNudge(true), 3000)
      return () => clearTimeout(timer)
    }
    setShowNudge(false)
  }, [hasProactiveNudge, nudgeMessage, nudgeDismissed])

  // Close menu on click outside
  useEffect(() => {
    if (!showMenu) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    window.addEventListener('mousedown', handleClick)
    return () => window.removeEventListener('mousedown', handleClick)
  }, [showMenu])

  function handleDismissNudge() {
    setShowNudge(false)
    setNudgeDismissed(true)
    onDismissNudge?.()
  }

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setShowMenu((prev) => !prev)
  }, [])

  const handleMenuAction = useCallback(
    (action: 'command' | 'briefing') => {
      setShowMenu(false)
      if (action === 'command') onOpenCommandBar()
      else onOpenBriefing()
    },
    [onOpenCommandBar, onOpenBriefing]
  )

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Proactive Nudge Tooltip */}
      {showNudge && nudgeMessage && !showMenu && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-start gap-2.5 max-w-70 rounded-2xl border border-border/20 bg-card/95 backdrop-blur-xl px-3.5 py-2.5 shadow-[0_4px_16px_rgba(0,0,0,0.1),0_8px_32px_rgba(0,0,0,0.08)] dark:border-border/8 dark:bg-background/80 dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-[0.15em] text-primary/50 font-semibold mb-1">
                Pedrinho
              </p>
              <p className="text-[11px] text-foreground/70 leading-relaxed">
                {nudgeMessage}
              </p>
            </div>
            <button
              onClick={handleDismissNudge}
              className="shrink-0 mt-0.5 p-0.5 rounded-md text-muted-foreground/55 hover:text-muted-foreground/60 hover:bg-muted/50 dark:hover:bg-white/4 transition-colors cursor-pointer"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      {/* Context Menu — right-click on Orb */}
      {showMenu && (
        <div
          ref={menuRef}
          className="animate-in fade-in zoom-in-95 slide-in-from-bottom-1 duration-150"
        >
          <div className="flex flex-col gap-0.5 min-w-40 rounded-xl border border-border/20 bg-card/95 backdrop-blur-xl p-1 shadow-[0_4px_16px_rgba(0,0,0,0.1),0_12px_40px_rgba(0,0,0,0.08)] dark:border-border/10 dark:bg-background/90 dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <button
              onClick={() => handleMenuAction('command')}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-medium text-foreground/70 hover:bg-primary/6 hover:text-foreground/90 transition-colors cursor-pointer"
            >
              <Terminal className="size-3.5 text-primary/50" />
              Comando
              <kbd className="ml-auto text-[8px] text-muted-foreground/50 font-mono">⌘J</kbd>
            </button>
            <button
              onClick={() => handleMenuAction('briefing')}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-medium text-foreground/70 hover:bg-primary/6 hover:text-foreground/90 transition-colors cursor-pointer"
            >
              <MessageSquare className="size-3.5 text-primary/50" />
              Conversa
              <kbd className="ml-auto text-[8px] text-muted-foreground/50 font-mono">⌘⇧J</kbd>
            </button>
          </div>
        </div>
      )}

      {/* The Orb */}
      <button
        onClick={onOpenCommandBar}
        onContextMenu={handleContextMenu}
        className={cn(
          'pedrinho-orb group relative size-12 rounded-2xl cursor-pointer',
          // Light mode: solid card with prominent shadow
          'bg-card border border-border/40',
          'shadow-[0_2px_8px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.12)]',
          // Dark mode: glass
          'dark:bg-background/85 dark:backdrop-blur-xl dark:border-border/15',
          'dark:shadow-[0_4px_24px_rgba(0,0,0,0.25)]',
          'transition-all duration-300 ease-out',
          'hover:scale-110 hover:border-primary/30',
          'hover:shadow-[0_4px_16px_rgba(139,92,246,0.15),0_8px_32px_rgba(0,0,0,0.12)]',
          'dark:hover:shadow-[0_4px_32px_rgba(139,92,246,0.25)]',
          'active:scale-95',
          hasProactiveNudge && !nudgeDismissed && 'pedrinho-orb-pulse'
        )}
        title="Clique: comando rápido | Botão direito: opções"
      >
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-2xl bg-primary/8 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Two-dot signature */}
        <span className="relative flex items-center justify-center size-full">
          <span className="flex gap-1.5">
            <span className="size-1.75 rounded-full bg-primary transition-colors duration-200" />
            <span className="size-1.75 rounded-full bg-primary transition-colors duration-200" />
          </span>
        </span>

        {/* Pulse ring for proactive state */}
        {hasProactiveNudge && !nudgeDismissed && (
          <span className="absolute inset-0 rounded-2xl border border-primary/20 animate-ping opacity-75" />
        )}
      </button>
    </div>
  )
}
