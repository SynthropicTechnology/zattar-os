'use client'

import { FileText, Image, Music, Plus } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { AttachmentType } from '../types'

interface AttachmentMenuProps {
  onSelect: (type: AttachmentType) => void
  disabled?: boolean
}

const MENU_ITEMS: Array<{ type: AttachmentType; label: string; icon: typeof FileText }> = [
  { type: 'document', label: 'Arquivo', icon: FileText },
  { type: 'image', label: 'Imagem', icon: Image },
  { type: 'audio', label: 'Arquivo de áudio', icon: Music },
]

export function AttachmentMenu({ onSelect, disabled }: AttachmentMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          disabled={disabled}
          className={cn(
            'flex items-center justify-center size-8 rounded-lg',
            'text-muted-foreground/60 hover:text-foreground/80',
            'hover:bg-muted/60 dark:hover:bg-white/5',
            'transition-colors duration-150 cursor-pointer',
            'disabled:opacity-30 disabled:cursor-not-allowed'
          )}
          title="Anexar arquivo"
        >
          <Plus className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="min-w-44">
        {MENU_ITEMS.map(({ type, label, icon: Icon }) => (
          <DropdownMenuItem
            key={type}
            onClick={() => onSelect(type)}
            className="gap-2.5 text-[13px] cursor-pointer"
          >
            <Icon className="size-4 text-muted-foreground" />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
