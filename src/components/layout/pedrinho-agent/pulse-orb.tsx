'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
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

  useEffect(() => {
    if (hasProactiveNudge && nudgeMessage && !nudgeDismissed) {
      const timer = setTimeout(() => setShowNudge(true), 3000)
      return () => clearTimeout(timer)
    }
    setShowNudge(false)
  }, [hasProactiveNudge, nudgeMessage, nudgeDismissed])

  function handleDismissNudge() {
    setShowNudge(false)
    setNudgeDismissed(true)
    onDismissNudge?.()
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Proactive Nudge Tooltip */}
      {showNudge && nudgeMessage && (
        <div className="pedrinho-nudge animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-start gap-2.5 max-w-[280px] rounded-2xl border border-border/8 bg-background/80 backdrop-blur-xl px-3.5 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-[0.15em] text-primary/40 font-semibold mb-1">
                Pedrinho
              </p>
              <p className="text-[11px] text-foreground/70 leading-relaxed">
                {nudgeMessage}
              </p>
            </div>
            <button
              onClick={handleDismissNudge}
              className="shrink-0 mt-0.5 p-0.5 rounded-md text-muted-foreground/20 hover:text-muted-foreground/50 hover:bg-white/4 transition-colors cursor-pointer"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      {/* The Orb */}
      <button
        onClick={onOpenCommandBar}
        onDoubleClick={onOpenBriefing}
        className={cn(
          'pedrinho-orb group relative size-12 rounded-2xl cursor-pointer',
          'bg-background/85 backdrop-blur-xl',
          'border border-border/15',
          'shadow-[0_4px_24px_rgba(0,0,0,0.2)]',
          'transition-all duration-300 ease-out',
          'hover:scale-110 hover:shadow-[0_4px_32px_rgba(139,92,246,0.25)]',
          'hover:border-primary/20',
          'active:scale-95',
          hasProactiveNudge && !nudgeDismissed && 'pedrinho-orb-pulse'
        )}
        title="Pedrinho — Clique para comando, duplo-clique para conversa"
      >
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-2xl bg-primary/8 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Two-dot signature */}
        <span className="relative flex items-center justify-center size-full">
          <span className="flex gap-1.5">
            <span className="size-[7px] rounded-full bg-primary/60 group-hover:bg-primary transition-colors duration-200" />
            <span className="size-[7px] rounded-full bg-primary/60 group-hover:bg-primary transition-colors duration-200" />
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
