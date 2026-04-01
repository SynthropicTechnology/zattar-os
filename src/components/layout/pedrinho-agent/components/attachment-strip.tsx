'use client'

import { FileText, Mic, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PedrinhoAttachment } from '../types'
import { formatDuration, formatFileSize } from '../types'

interface AttachmentStripProps {
  attachments: PedrinhoAttachment[]
  onRemove: (id: string) => void
}

export function AttachmentStrip({ attachments, onRemove }: AttachmentStripProps) {
  if (attachments.length === 0) return null

  return (
    <div className="flex gap-1.5 px-3 py-2 overflow-x-auto scrollbar-none animate-in fade-in slide-in-from-bottom-1 duration-200">
      {attachments.map((attachment) => (
        <AttachmentChip key={attachment.id} attachment={attachment} onRemove={onRemove} />
      ))}
    </div>
  )
}

function AttachmentChip({
  attachment,
  onRemove,
}: {
  attachment: PedrinhoAttachment
  onRemove: (id: string) => void
}) {
  return (
    <div
      className={cn(
        'group/chip flex items-center gap-1.5 shrink-0',
        'rounded-lg border border-border/15 dark:border-border/8',
        'bg-muted/40 dark:bg-white/4',
        'pl-1.5 pr-1 py-1',
        'animate-in fade-in zoom-in-95 duration-150'
      )}
    >
      {attachment.type === 'image' && attachment.preview ? (
        <img
          src={attachment.preview}
          alt={attachment.name}
          className="size-7 rounded object-cover"
        />
      ) : attachment.type === 'audio' ? (
        <div className="size-7 rounded bg-primary/8 flex items-center justify-center">
          <Mic className="size-3.5 text-primary/70" />
        </div>
      ) : (
        <div className="size-7 rounded bg-muted/60 dark:bg-white/6 flex items-center justify-center">
          <FileText className="size-3.5 text-muted-foreground/60" />
        </div>
      )}

      <div className="flex flex-col min-w-0 max-w-24">
        <span className="text-[11px] text-foreground/70 truncate leading-tight">
          {attachment.type === 'audio'
            ? `Áudio ${attachment.duration ? formatDuration(attachment.duration) : ''}`
            : attachment.name}
        </span>
        <span className="text-[9px] text-muted-foreground/50 leading-tight">
          {formatFileSize(attachment.size)}
        </span>
      </div>

      <button
        onClick={() => onRemove(attachment.id)}
        className={cn(
          'size-5 rounded flex items-center justify-center shrink-0',
          'text-muted-foreground/40 hover:text-destructive',
          'hover:bg-destructive/8',
          'opacity-0 group-hover/chip:opacity-100',
          'transition-all duration-150 cursor-pointer'
        )}
        title="Remover"
      >
        <X className="size-3" />
      </button>
    </div>
  )
}
