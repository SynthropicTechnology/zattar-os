'use client'

import { Send, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDuration } from '../types'

interface AudioRecorderProps {
  duration: number
  waveformData: number[]
  onFinish: () => void
  onCancel: () => void
}

export function AudioRecorder({ duration, waveformData, onFinish, onCancel }: AudioRecorderProps) {
  return (
    <div className="flex items-center gap-2 w-full animate-in fade-in slide-in-from-bottom-1 duration-200">
      <button
        onClick={onCancel}
        className={cn(
          'flex items-center justify-center size-8 rounded-lg shrink-0',
          'text-muted-foreground/70 hover:text-destructive',
          'hover:bg-destructive/8',
          'transition-colors duration-150 cursor-pointer'
        )}
        title="Cancelar gravação"
      >
        <X className="size-4" />
      </button>

      <div className="flex items-center gap-2 shrink-0">
        <span className="size-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-xs font-mono text-muted-foreground/80 tabular-nums w-8">
          {formatDuration(duration)}
        </span>
      </div>

      <div className="flex-1 flex items-center gap-px h-8 overflow-hidden">
        {waveformData.map((val, i) => (
          <div
            key={i}
            className="flex-1 rounded-full bg-primary/60 transition-[height] duration-75"
            style={{
              height: `${Math.max(8, val * 100)}%`,
              minHeight: 3,
              maxHeight: 32,
            }}
          />
        ))}
        {waveformData.length < 32 &&
          Array.from({ length: 32 - waveformData.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex-1 rounded-full bg-muted/40"
              style={{ height: 3 }}
            />
          ))}
      </div>

      <button
        onClick={onFinish}
        className={cn(
          'flex items-center justify-center size-8 rounded-lg shrink-0',
          'text-primary hover:text-primary/80',
          'hover:bg-primary/8',
          'transition-colors duration-150 cursor-pointer'
        )}
        title="Enviar gravação"
      >
        <Send className="size-4" />
      </button>
    </div>
  )
}
