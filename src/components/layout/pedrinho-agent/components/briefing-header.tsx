'use client'

import { Minus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BriefingHeaderProps {
  moduleLabel: string
  onMinimize: () => void
  onClose: () => void
}

export function BriefingHeader({ moduleLabel, onMinimize, onClose }: BriefingHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-3',
        'border-b border-border/10 dark:border-border/6'
      )}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            'size-8 rounded-xl flex items-center justify-center',
            'bg-gradient-to-br from-primary/20 to-primary/6',
            'border border-primary/12'
          )}
        >
          <span className="flex gap-1">
            <span className="size-1.5 rounded-full bg-primary/70" />
            <span className="size-1.5 rounded-full bg-primary/70" />
          </span>
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-foreground/90 leading-tight">Pedrinho</h2>
          <p className="text-[10px] text-muted-foreground/50 mt-0.5">{moduleLabel}</p>
        </div>
      </div>

      <div className="flex items-center gap-0.5">
        <button
          onClick={onMinimize}
          className={cn(
            'size-7 rounded-lg flex items-center justify-center',
            'text-muted-foreground/50 hover:text-muted-foreground/70',
            'hover:bg-muted/50 dark:hover:bg-white/5',
            'transition-colors duration-150 cursor-pointer'
          )}
          title="Minimizar (Esc)"
        >
          <Minus className="size-3.5" />
        </button>
        <button
          onClick={onClose}
          className={cn(
            'size-7 rounded-lg flex items-center justify-center',
            'text-muted-foreground/50 hover:text-muted-foreground/70',
            'hover:bg-muted/50 dark:hover:bg-white/5',
            'transition-colors duration-150 cursor-pointer'
          )}
          title="Fechar"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
