# Pedrinho Sidebar Multimodal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Pedrinho Briefing Panel into a resizable, multimodal chat sidebar supporting file attachments, image uploads, audio recording, and direct Gemini multimodal processing — with a polished, professional UI.

**Architecture:** The sidebar uses CopilotChat for message display/streaming and a fully custom input component for multimodal capture. Text-only messages flow through the normal CopilotKit agent pipeline. Messages with attachments bypass CopilotKit and call a dedicated `/api/pedrinho/multimodal` endpoint that sends content parts directly to Gemini via the AI SDK. The panel is resizable via mouse drag on its left edge, with width persisted in localStorage.

**Tech Stack:** CopilotKit v2 (react-core), @ai-sdk/google (Gemini 3.1 Pro), MediaRecorder API, react-resizable-panels (already installed), Tailwind CSS 4, shadcn/ui, Lucide icons

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `src/components/layout/pedrinho-agent/types.ts` | Shared types: Attachment, RecorderState, PanelConfig |
| `src/components/layout/pedrinho-agent/hooks/use-attachments.ts` | Manages pending file/image/audio attachments before send |
| `src/components/layout/pedrinho-agent/hooks/use-audio-recorder.ts` | MediaRecorder wrapper with waveform data extraction |
| `src/components/layout/pedrinho-agent/hooks/use-panel-resize.ts` | Mouse-drag resize logic for the sidebar panel |
| `src/components/layout/pedrinho-agent/components/attachment-menu.tsx` | Dropdown menu: attach file, image, or audio file |
| `src/components/layout/pedrinho-agent/components/audio-recorder.tsx` | Inline audio recorder with waveform visualization + timer |
| `src/components/layout/pedrinho-agent/components/attachment-strip.tsx` | Horizontal strip of attachment previews with remove buttons |
| `src/components/layout/pedrinho-agent/components/briefing-header.tsx` | Custom header with avatar, module context, resize affordance |
| `src/components/layout/pedrinho-agent/components/briefing-input.tsx` | Orchestrator: textarea + attachment menu + mic + send button |
| `src/app/api/pedrinho/multimodal/route.ts` | Processes multimodal messages via Gemini AI SDK directly |

### Modified Files

| File | Changes |
|------|---------|
| `src/components/layout/pedrinho-agent/briefing-panel.tsx` | Full rewrite: resizable layout, CopilotChat with hidden input, custom input below |
| `src/components/layout/copilot-dashboard.tsx` | Accept dynamic width from BriefingPanel, mobile fullscreen |
| `src/app/globals.css` (lines 1259-1430) | Remove ~170 lines of `.pedrinho-chat-wrapper` CSS overrides, replace with ~40 lines using CopilotKit CSS vars + minimal overrides |
| `src/components/layout/pedrinho-agent/index.ts` | Add new exports |

---

## Task 1: Shared Types

**Files:**
- Create: `src/components/layout/pedrinho-agent/types.ts`

- [ ] **Step 1: Create the types file**

```typescript
// src/components/layout/pedrinho-agent/types.ts

export type AttachmentType = 'image' | 'audio' | 'document'

export interface PedrinhoAttachment {
  id: string
  file: File
  type: AttachmentType
  mediaType: string // MIME: 'image/png', 'audio/webm', 'application/pdf'
  name: string
  size: number
  preview?: string // data URL for images, undefined for others
  duration?: number // seconds, for audio only
}

export interface AudioRecorderState {
  status: 'idle' | 'recording' | 'paused'
  duration: number // seconds elapsed
  waveformData: number[] // 0-1 normalized amplitude values
}

export interface MultimodalRequest {
  text: string
  attachments: Array<{
    data: string // base64
    mediaType: string
    name: string
  }>
  threadId?: string
}

export interface MultimodalResponse {
  content: string
  error?: string
}

/** Accepted file types by category */
export const ACCEPTED_TYPES: Record<AttachmentType, string> = {
  image: '.png,.jpg,.jpeg,.gif,.webp,.bmp',
  audio: '.mp3,.wav,.ogg,.m4a,.webm,.flac,.aac',
  document: '.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.rtf',
}

/** Max file size: 15MB (leaves room under Gemini's 20MB inline limit) */
export const MAX_FILE_SIZE = 15 * 1024 * 1024

/** Max attachments per message */
export const MAX_ATTACHMENTS = 5

export function getAttachmentType(mimeType: string): AttachmentType {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('audio/')) return 'audio'
  return 'document'
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/pedrinho-agent/types.ts
git commit -m "feat(pedrinho): add shared types for multimodal sidebar"
```

---

## Task 2: useAttachments Hook

**Files:**
- Create: `src/components/layout/pedrinho-agent/hooks/use-attachments.ts`

- [ ] **Step 1: Create the hook**

```typescript
// src/components/layout/pedrinho-agent/hooks/use-attachments.ts
'use client'

import { useCallback, useState } from 'react'
import {
  type AttachmentType,
  type PedrinhoAttachment,
  ACCEPTED_TYPES,
  MAX_ATTACHMENTS,
  MAX_FILE_SIZE,
  getAttachmentType,
} from '../types'

interface UseAttachmentsReturn {
  attachments: PedrinhoAttachment[]
  error: string | null
  addFiles: (files: FileList | File[]) => Promise<void>
  addAudioBlob: (blob: Blob, duration: number) => void
  remove: (id: string) => void
  clear: () => void
  openFilePicker: (type: AttachmentType) => void
  toBase64Array: () => Promise<Array<{ data: string; mediaType: string; name: string }>>
}

function generateId(): string {
  return crypto.randomUUID()
}

async function fileToPreview(file: File): Promise<string | undefined> {
  if (!file.type.startsWith('image/')) return undefined
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = () => resolve(undefined)
    reader.readAsDataURL(file)
  })
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      // Remove the data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function useAttachments(): UseAttachmentsReturn {
  const [attachments, setAttachments] = useState<PedrinhoAttachment[]>([])
  const [error, setError] = useState<string | null>(null)

  const addFiles = useCallback(async (files: FileList | File[]) => {
    setError(null)
    const fileArray = Array.from(files)

    for (const file of fileArray) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`"${file.name}" excede o limite de 15MB`)
        continue
      }

      setAttachments((prev) => {
        if (prev.length >= MAX_ATTACHMENTS) {
          setError(`Máximo de ${MAX_ATTACHMENTS} anexos por mensagem`)
          return prev
        }
        const type = getAttachmentType(file.type)
        // Generate preview synchronously for state, update async
        const attachment: PedrinhoAttachment = {
          id: generateId(),
          file,
          type,
          mediaType: file.type,
          name: file.name,
          size: file.size,
        }
        // Async preview generation for images
        if (type === 'image') {
          fileToPreview(file).then((preview) => {
            setAttachments((current) =>
              current.map((a) => (a.id === attachment.id ? { ...a, preview } : a))
            )
          })
        }
        return [...prev, attachment]
      })
    }
  }, [])

  const addAudioBlob = useCallback((blob: Blob, duration: number) => {
    setError(null)
    if (blob.size > MAX_FILE_SIZE) {
      setError('Gravação excede o limite de 15MB')
      return
    }
    setAttachments((prev) => {
      if (prev.length >= MAX_ATTACHMENTS) {
        setError(`Máximo de ${MAX_ATTACHMENTS} anexos por mensagem`)
        return prev
      }
      const file = new File([blob], `gravacao-${Date.now()}.webm`, { type: blob.type || 'audio/webm' })
      return [
        ...prev,
        {
          id: generateId(),
          file,
          type: 'audio' as const,
          mediaType: file.type,
          name: file.name,
          size: file.size,
          duration,
        },
      ]
    })
  }, [])

  const remove = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
    setError(null)
  }, [])

  const clear = useCallback(() => {
    setAttachments([])
    setError(null)
  }, [])

  const openFilePicker = useCallback(
    (type: AttachmentType) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = ACCEPTED_TYPES[type]
      input.multiple = true
      input.onchange = () => {
        if (input.files?.length) {
          addFiles(input.files)
        }
      }
      input.click()
    },
    [addFiles]
  )

  const toBase64Array = useCallback(async () => {
    return Promise.all(
      attachments.map(async (a) => ({
        data: await fileToBase64(a.file),
        mediaType: a.mediaType,
        name: a.name,
      }))
    )
  }, [attachments])

  return { attachments, error, addFiles, addAudioBlob, remove, clear, openFilePicker, toBase64Array }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/pedrinho-agent/hooks/use-attachments.ts
git commit -m "feat(pedrinho): add useAttachments hook for file/image/audio management"
```

---

## Task 3: useAudioRecorder Hook

**Files:**
- Create: `src/components/layout/pedrinho-agent/hooks/use-audio-recorder.ts`

- [ ] **Step 1: Create the hook**

```typescript
// src/components/layout/pedrinho-agent/hooks/use-audio-recorder.ts
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { AudioRecorderState } from '../types'

interface UseAudioRecorderReturn extends AudioRecorderState {
  start: () => Promise<void>
  stop: () => Promise<Blob>
  cancel: () => void
  isSupported: boolean
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [status, setStatus] = useState<AudioRecorderState['status']>('idle')
  const [duration, setDuration] = useState(0)
  const [waveformData, setWaveformData] = useState<number[]>([])

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const resolveStopRef = useRef<((blob: Blob) => void) | null>(null)

  const isSupported = typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      audioContextRef.current?.close()
    }
  }, [])

  const updateWaveform = useCallback(() => {
    const analyser = analyserRef.current
    if (!analyser || status !== 'recording') return

    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteTimeDomainData(dataArray)

    // Downsample to 32 bars, normalize to 0-1
    const bars = 32
    const step = Math.floor(dataArray.length / bars)
    const normalized: number[] = []
    for (let i = 0; i < bars; i++) {
      const val = dataArray[i * step]
      // Convert from 0-255 centered at 128 to 0-1 amplitude
      normalized.push(Math.abs(val - 128) / 128)
    }
    setWaveformData(normalized)
    animFrameRef.current = requestAnimationFrame(updateWaveform)
  }, [status])

  const start = useCallback(async () => {
    if (status === 'recording') return

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    streamRef.current = stream

    // Setup analyser for waveform
    const audioContext = new AudioContext()
    audioContextRef.current = audioContext
    const source = audioContext.createMediaStreamSource(stream)
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 256
    source.connect(analyser)
    analyserRef.current = analyser

    // Setup recorder
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm'
    const recorder = new MediaRecorder(stream, { mimeType })
    mediaRecorderRef.current = recorder
    chunksRef.current = []

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType })
      resolveStopRef.current?.(blob)
      resolveStopRef.current = null
    }

    recorder.start(250) // Collect chunks every 250ms
    setStatus('recording')
    setDuration(0)

    // Start timer
    const startTime = Date.now()
    timerRef.current = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTime) / 1000))
    }, 200)

    // Start waveform animation
    animFrameRef.current = requestAnimationFrame(updateWaveform)
  }, [status, updateWaveform])

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    audioContextRef.current?.close()
    audioContextRef.current = null
    analyserRef.current = null
    setStatus('idle')
    setDuration(0)
    setWaveformData([])
  }, [])

  const stop = useCallback(async (): Promise<Blob> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current
      if (!recorder || recorder.state !== 'recording') {
        resolve(new Blob())
        return
      }
      resolveStopRef.current = (blob) => {
        cleanup()
        resolve(blob)
      }
      recorder.stop()
    })
  }, [cleanup])

  const cancel = useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state === 'recording') {
      recorder.stop()
    }
    resolveStopRef.current = null
    cleanup()
  }, [cleanup])

  return { status, duration, waveformData, start, stop, cancel, isSupported }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/pedrinho-agent/hooks/use-audio-recorder.ts
git commit -m "feat(pedrinho): add useAudioRecorder hook with waveform visualization"
```

---

## Task 4: usePanelResize Hook

**Files:**
- Create: `src/components/layout/pedrinho-agent/hooks/use-panel-resize.ts`

- [ ] **Step 1: Create the hook**

```typescript
// src/components/layout/pedrinho-agent/hooks/use-panel-resize.ts
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'pedrinho-panel-width'
const DEFAULT_WIDTH = 400
const MIN_WIDTH = 320
const MAX_WIDTH = 720

function getStoredWidth(): number {
  if (typeof window === 'undefined') return DEFAULT_WIDTH
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return DEFAULT_WIDTH
  const parsed = parseInt(stored, 10)
  return isNaN(parsed) ? DEFAULT_WIDTH : Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, parsed))
}

interface UsePanelResizeReturn {
  width: number
  isResizing: boolean
  handleMouseDown: (e: React.MouseEvent) => void
}

export function usePanelResize(onWidthChange?: (width: number) => void): UsePanelResizeReturn {
  const [width, setWidth] = useState(getStoredWidth)
  const [isResizing, setIsResizing] = useState(false)
  const widthRef = useRef(width)

  // Sync ref with state
  useEffect(() => {
    widthRef.current = width
  }, [width])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, window.innerWidth - e.clientX))
      setWidth(newWidth)
      onWidthChange?.(newWidth)
    },
    [onWidthChange]
  )

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    // Persist
    localStorage.setItem(STORAGE_KEY, String(widthRef.current))
  }, [])

  // Bind/unbind global listeners
  useEffect(() => {
    if (!isResizing) return
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  return { width, isResizing, handleMouseDown }
}

export { DEFAULT_WIDTH, MIN_WIDTH, MAX_WIDTH }
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/pedrinho-agent/hooks/use-panel-resize.ts
git commit -m "feat(pedrinho): add usePanelResize hook with localStorage persistence"
```

---

## Task 5: AttachmentMenu Component

**Files:**
- Create: `src/components/layout/pedrinho-agent/components/attachment-menu.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/layout/pedrinho-agent/components/attachment-menu.tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/pedrinho-agent/components/attachment-menu.tsx
git commit -m "feat(pedrinho): add AttachmentMenu dropdown component"
```

---

## Task 6: AudioRecorder Component

**Files:**
- Create: `src/components/layout/pedrinho-agent/components/audio-recorder.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/layout/pedrinho-agent/components/audio-recorder.tsx
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
      {/* Cancel button */}
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

      {/* Recording indicator */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="size-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-xs font-mono text-muted-foreground/80 tabular-nums w-8">
          {formatDuration(duration)}
        </span>
      </div>

      {/* Waveform visualization */}
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
        {/* Fill remaining bars if waveform is short */}
        {waveformData.length < 32 &&
          Array.from({ length: 32 - waveformData.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex-1 rounded-full bg-muted/40"
              style={{ height: 3 }}
            />
          ))}
      </div>

      {/* Send button */}
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/pedrinho-agent/components/audio-recorder.tsx
git commit -m "feat(pedrinho): add AudioRecorder inline component with waveform"
```

---

## Task 7: AttachmentStrip Component

**Files:**
- Create: `src/components/layout/pedrinho-agent/components/attachment-strip.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/layout/pedrinho-agent/components/attachment-strip.tsx
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
      {/* Thumbnail or icon */}
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

      {/* Info */}
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

      {/* Remove */}
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/pedrinho-agent/components/attachment-strip.tsx
git commit -m "feat(pedrinho): add AttachmentStrip preview component"
```

---

## Task 8: BriefingHeader Component

**Files:**
- Create: `src/components/layout/pedrinho-agent/components/briefing-header.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/layout/pedrinho-agent/components/briefing-header.tsx
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
        {/* Pedrinho avatar — two-dot signature */}
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/pedrinho-agent/components/briefing-header.tsx
git commit -m "feat(pedrinho): add BriefingHeader component"
```

---

## Task 9: BriefingInput Component

**Files:**
- Create: `src/components/layout/pedrinho-agent/components/briefing-input.tsx`

This is the main orchestrator component. It combines the text area, attachment menu, audio recorder, and send button.

- [ ] **Step 1: Create the component**

```tsx
// src/components/layout/pedrinho-agent/components/briefing-input.tsx
'use client'

import { useCallback, useRef, useState } from 'react'
import { Mic, Send, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAttachments } from '../hooks/use-attachments'
import { useAudioRecorder } from '../hooks/use-audio-recorder'
import { AttachmentMenu } from './attachment-menu'
import { AttachmentStrip } from './attachment-strip'
import { AudioRecorder } from './audio-recorder'
import type { MultimodalRequest, PedrinhoAttachment } from '../types'

interface BriefingInputProps {
  onSendText: (text: string) => void
  onSendMultimodal: (request: MultimodalRequest) => void
  onStopAgent: () => void
  isAgentRunning: boolean
  threadId?: string
}

export function BriefingInput({
  onSendText,
  onSendMultimodal,
  onStopAgent,
  isAgentRunning,
  threadId,
}: BriefingInputProps) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { attachments, error, addAudioBlob, remove, clear, openFilePicker, toBase64Array } =
    useAttachments()
  const recorder = useAudioRecorder()
  const isRecording = recorder.status === 'recording'

  // Auto-resize textarea
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [])

  const handleSend = useCallback(async () => {
    const trimmed = text.trim()
    if (!trimmed && attachments.length === 0) return
    if (isAgentRunning) return

    if (attachments.length > 0) {
      const base64Attachments = await toBase64Array()
      onSendMultimodal({
        text: trimmed,
        attachments: base64Attachments,
        threadId,
      })
    } else {
      onSendText(trimmed)
    }

    setText('')
    clear()
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [text, attachments, isAgentRunning, toBase64Array, onSendMultimodal, onSendText, clear, threadId])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const handleFinishRecording = useCallback(async () => {
    const blob = await recorder.stop()
    if (blob.size > 0) {
      addAudioBlob(blob, recorder.duration)
    }
  }, [recorder, addAudioBlob])

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      const imageFiles: File[] = []
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) imageFiles.push(file)
        }
      }
      if (imageFiles.length > 0) {
        e.preventDefault()
        const { addFiles } = require('../hooks/use-attachments') as { addFiles: never }
        // Direct access: we call openFilePicker on paste but actually addFiles is on the hook
        // Use a different approach: dispatch through the attachments hook
        void (async () => {
          const { useAttachments: _ } = await import('../hooks/use-attachments')
          // We already have addFiles from destructured hook above — but we need the actual one
        })()
      }
    },
    []
  )

  // Actually, let's simplify paste handling by using the addFiles from hook directly
  const { addFiles } = useAttachments()

  const handlePasteImages = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      const imageFiles: File[] = []
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) imageFiles.push(file)
        }
      }
      if (imageFiles.length > 0) {
        e.preventDefault()
        addFiles(imageFiles)
      }
    },
    [addFiles]
  )

  const hasContent = text.trim().length > 0 || attachments.length > 0

  return (
    <div className="border-t border-border/8 dark:border-border/5">
      {/* Attachment previews */}
      <AttachmentStrip attachments={attachments} onRemove={remove} />

      {/* Error message */}
      {error && (
        <div className="px-3 py-1">
          <p className="text-[11px] text-destructive/80">{error}</p>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-1 px-3 py-2.5">
        {isRecording ? (
          <AudioRecorder
            duration={recorder.duration}
            waveformData={recorder.waveformData}
            onFinish={handleFinishRecording}
            onCancel={recorder.cancel}
          />
        ) : (
          <>
            {/* Attachment menu */}
            <AttachmentMenu onSelect={openFilePicker} disabled={isAgentRunning} />

            {/* Mic button */}
            {recorder.isSupported && (
              <button
                onClick={recorder.start}
                disabled={isAgentRunning}
                className={cn(
                  'flex items-center justify-center size-8 rounded-lg shrink-0',
                  'text-muted-foreground/60 hover:text-foreground/80',
                  'hover:bg-muted/60 dark:hover:bg-white/5',
                  'transition-colors duration-150 cursor-pointer',
                  'disabled:opacity-30 disabled:cursor-not-allowed'
                )}
                title="Gravar áudio"
              >
                <Mic className="size-4" />
              </button>
            )}

            {/* Text input */}
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePasteImages}
              placeholder="Mensagem para Pedrinho..."
              disabled={isAgentRunning}
              rows={1}
              className={cn(
                'flex-1 min-h-[36px] max-h-40 resize-none',
                'bg-transparent text-[13px] text-foreground/85',
                'placeholder:text-muted-foreground/40',
                'outline-none',
                'disabled:opacity-50'
              )}
            />

            {/* Send / Stop button */}
            {isAgentRunning ? (
              <button
                onClick={onStopAgent}
                className={cn(
                  'flex items-center justify-center size-8 rounded-lg shrink-0',
                  'text-muted-foreground/60 hover:text-destructive/70',
                  'hover:bg-destructive/8',
                  'transition-colors duration-150 cursor-pointer'
                )}
                title="Parar"
              >
                <Square className="size-3.5" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!hasContent}
                className={cn(
                  'flex items-center justify-center size-8 rounded-lg shrink-0',
                  'transition-colors duration-150 cursor-pointer',
                  hasContent
                    ? 'text-primary hover:text-primary/80 hover:bg-primary/8'
                    : 'text-muted-foreground/30 cursor-default'
                )}
                title="Enviar (Enter)"
              >
                <Send className="size-4" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Fix the duplicate useAttachments call**

The component above has a bug: it calls `useAttachments()` twice. Fix by using a single instance. Replace the entire component content — remove the second `useAttachments()` call and the broken `handlePaste`. The `handlePasteImages` callback already uses `addFiles` from the second call. We need to merge into one:

In the destructuring at the top, add `addFiles`:
```typescript
const { attachments, error, addFiles, addAudioBlob, remove, clear, openFilePicker, toBase64Array } =
    useAttachments()
```

Remove the second `const { addFiles } = useAttachments()` line entirely.

Remove the unused `handlePaste` callback entirely.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/pedrinho-agent/components/briefing-input.tsx
git commit -m "feat(pedrinho): add BriefingInput with attach, audio, and send"
```

---

## Task 10: Multimodal API Route

**Files:**
- Create: `src/app/api/pedrinho/multimodal/route.ts`

- [ ] **Step 1: Create the API route**

```typescript
// src/app/api/pedrinho/multimodal/route.ts

import { google } from '@ai-sdk/google'
import { generateText, type CoreMessage } from 'ai'
import { NextRequest, NextResponse } from 'next/server'
import type { MultimodalRequest, MultimodalResponse } from '@/components/layout/pedrinho-agent/types'

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GOOGLE_API_KEY

export async function POST(req: NextRequest): Promise<NextResponse<MultimodalResponse>> {
  if (!apiKey) {
    return NextResponse.json(
      { content: '', error: 'API key não configurada' },
      { status: 503 }
    )
  }

  try {
    const body = (await req.json()) as MultimodalRequest
    const { text, attachments } = body

    if (!attachments?.length && !text) {
      return NextResponse.json(
        { content: '', error: 'Nenhum conteúdo enviado' },
        { status: 400 }
      )
    }

    // Build multipart content parts for the AI SDK
    const contentParts: CoreMessage['content'] = []

    // Add text part
    if (text) {
      ;(contentParts as Array<{ type: string; text?: string }>).push({
        type: 'text',
        text,
      })
    }

    // Add attachment parts
    for (const attachment of attachments) {
      const buffer = Buffer.from(attachment.data, 'base64')

      if (attachment.mediaType.startsWith('image/')) {
        ;(contentParts as Array<unknown>).push({
          type: 'image',
          image: buffer,
        })
      } else {
        // audio, pdf, documents — use 'file' type
        ;(contentParts as Array<unknown>).push({
          type: 'file',
          data: buffer,
          mediaType: attachment.mediaType,
        })
      }
    }

    const model = google('gemini-2.5-flash', { apiKey })

    const result = await generateText({
      model,
      messages: [
        {
          role: 'system',
          content:
            'Você é o Pedrinho, assistente jurídico da Synthropic. Responda em português brasileiro. ' +
            'Quando receber arquivos, analise seu conteúdo em detalhes. ' +
            'Quando receber áudio, transcreva e responda ao que foi dito. ' +
            'Quando receber imagens, descreva e analise o conteúdo.',
        },
        {
          role: 'user',
          content: contentParts as CoreMessage['content'],
        },
      ],
      maxTokens: 4096,
    })

    return NextResponse.json({ content: result.text })
  } catch (error) {
    console.error('[Pedrinho Multimodal] Error:', error)
    return NextResponse.json(
      { content: '', error: 'Erro ao processar mensagem multimodal' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/pedrinho/multimodal/route.ts
git commit -m "feat(pedrinho): add multimodal API route with Gemini AI SDK"
```

---

## Task 11: Rewrite BriefingPanel

**Files:**
- Modify: `src/components/layout/pedrinho-agent/briefing-panel.tsx` (full rewrite)

- [ ] **Step 1: Rewrite the briefing panel**

```tsx
// src/components/layout/pedrinho-agent/briefing-panel.tsx
'use client'

import { useCallback, useEffect, useRef } from 'react'
import { CopilotChat } from '@copilotkit/react-core/v2'
import { useAgent } from '@copilotkit/react-core/v2'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'
import { useBreakpointBelow } from '@/hooks/use-breakpoint'
import { usePanelResize } from './hooks/use-panel-resize'
import { BriefingHeader } from './components/briefing-header'
import { BriefingInput } from './components/briefing-input'
import type { MultimodalRequest } from './types'

interface BriefingPanelProps {
  onClose: () => void
  onMinimize: () => void
  onWidthChange?: (width: number) => void
  threadId?: string
}

export function BriefingPanel({ onClose, onMinimize, onWidthChange, threadId }: BriefingPanelProps) {
  const pathname = usePathname()
  const panelRef = useRef<HTMLDivElement>(null)
  const moduleLabel = getModuleLabel(pathname || '')
  const isMobile = useBreakpointBelow('md')
  const { agent } = useAgent()

  const { width, isResizing, handleMouseDown } = usePanelResize(onWidthChange)
  const panelWidth = isMobile ? '100vw' : width

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
    [agent]
  )

  const handleSendMultimodal = useCallback(
    async (request: MultimodalRequest) => {
      if (agent.isRunning) return

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
    [agent]
  )

  const handleStopAgent = useCallback(() => {
    agent.abortRun()
  }, [agent])

  return (
    <div
      ref={panelRef}
      className={cn(
        'fixed top-0 right-0 z-40 h-full',
        'flex flex-col',
        'bg-card border-l border-border/12',
        'shadow-[-4px_0_24px_rgba(0,0,0,0.04)]',
        'dark:bg-card/95 dark:backdrop-blur-2xl dark:border-border/6',
        'dark:shadow-[-8px_0_32px_rgba(0,0,0,0.2)]',
        'animate-in slide-in-from-right duration-300 ease-out',
        // During resize, disable transitions and pointer events on chat
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
          {/* Visual indicator on hover */}
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
      <BriefingHeader moduleLabel={moduleLabel} onMinimize={onMinimize} onClose={onClose} />

      {/* Chat messages — CopilotChat with hidden input */}
      <div className="flex-1 min-h-0 pedrinho-chat-wrapper">
        <CopilotChat
          threadId={threadId}
          labels={{
            modalHeaderTitle: 'Pedrinho',
            welcomeMessageText: 'Olá! Como posso ajudar? Envie textos, imagens, documentos ou grave áudios.',
            chatInputPlaceholder: 'Mensagem...',
            chatDisclaimerText: '',
          }}
          className="pedrinho-chat h-full"
        />
      </div>

      {/* Custom input with multimodal support */}
      <BriefingInput
        onSendText={handleSendText}
        onSendMultimodal={handleSendMultimodal}
        onStopAgent={handleStopAgent}
        isAgentRunning={agent.isRunning}
        threadId={threadId}
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/pedrinho-agent/briefing-panel.tsx
git commit -m "feat(pedrinho): rewrite BriefingPanel with resize, multimodal input"
```

---

## Task 12: Update CopilotDashboard for Dynamic Width

**Files:**
- Modify: `src/components/layout/copilot-dashboard.tsx`

- [ ] **Step 1: Add state for dynamic panel width**

In `copilot-dashboard.tsx`, replace the fixed `PANEL_WIDTH = 380` with dynamic state. Add `panelWidth` state and pass `onWidthChange` to `BriefingPanel`.

Replace:
```typescript
/** Largura do Briefing Panel */
const PANEL_WIDTH = 380
```

With:
```typescript
import { DEFAULT_WIDTH as PANEL_DEFAULT_WIDTH } from '@/components/layout/pedrinho-agent/hooks/use-panel-resize'
```

In the `CopilotDashboard` component, add:
```typescript
const [panelWidth, setPanelWidth] = useState(PANEL_DEFAULT_WIDTH)
```

Replace `style={{ right: isBriefingOpen ? PANEL_WIDTH : 0 }}` with:
```typescript
style={{ right: isBriefingOpen ? panelWidth : 0 }}
```

In the `PedrinhoAgent` component rendering, pass the width callback. Since `PedrinhoAgent` wraps `BriefingPanel`, we need to thread the prop through. Update the `PedrinhoAgent` interface and component:

- [ ] **Step 2: Update PedrinhoAgent to forward onWidthChange**

In `src/components/layout/pedrinho-agent/pedrinho-agent.tsx`, add `onWidthChange?: (width: number) => void` to props and pass it to `BriefingPanel`:

```typescript
interface PedrinhoAgentProps {
  userId: string
  mode: PedrinhoMode
  onModeChange: (mode: PedrinhoMode) => void
  onWidthChange?: (width: number) => void
}

export function PedrinhoAgent({ userId, mode, onModeChange, onWidthChange }: PedrinhoAgentProps) {
```

In the BriefingPanel rendering:
```tsx
<BriefingPanel
  onClose={handleCloseToOrb}
  onMinimize={handleCloseToOrb}
  onWidthChange={onWidthChange}
  threadId={`user-${userId}`}
/>
```

In `copilot-dashboard.tsx`, pass it:
```tsx
<PedrinhoAgent
  userId={String(userId ?? '')}
  mode={pedrinhoMode}
  onModeChange={setPedrinhoMode}
  onWidthChange={setPanelWidth}
/>
```

- [ ] **Step 3: Add mobile detection to hide push behavior**

Import `useBreakpointBelow` and don't push content on mobile:

```typescript
import { useBreakpointBelow } from '@/hooks/use-breakpoint'
// In component:
const isMobile = useBreakpointBelow('md')
// In style:
style={{ right: isBriefingOpen && !isMobile ? panelWidth : 0 }}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/copilot-dashboard.tsx src/components/layout/pedrinho-agent/pedrinho-agent.tsx
git commit -m "feat(pedrinho): support dynamic sidebar width and mobile overlay"
```

---

## Task 13: CSS Migration

**Files:**
- Modify: `src/app/globals.css` (lines 1259-1430)

- [ ] **Step 1: Replace the old CSS overrides**

Remove everything from line 1259 (`/* --- Briefing Panel: CopilotChat overrides dentro do wrapper --- */`) through line 1430 (`.pedrinho-chat-wrapper .copilotKitInputControls button:hover`).

Replace with this minimal set that uses CopilotKit's class names but with better values:

```css
/* --- Briefing Panel: CopilotChat minimal overrides --- */

/* Hide built-in header (we use BriefingHeader) */
.pedrinho-chat-wrapper .copilotKitHeader {
  display: none !important;
}

/* Hide built-in input (we use BriefingInput) */
.pedrinho-chat-wrapper .copilotKitInput {
  display: none !important;
}

/* Chat container: transparent bg, proper font */
.pedrinho-chat-wrapper .copilotKitChat {
  background-color: transparent !important;
  font-family: var(--font-inter), system-ui, sans-serif !important;
}

/* Messages area */
.pedrinho-chat-wrapper .copilotKitMessages {
  background: transparent !important;
  scrollbar-width: thin !important;
  scrollbar-color: hsl(var(--border) / 0.15) transparent !important;
  padding: 1rem !important;
  gap: 0.75rem !important;
}

/* Assistant message */
.pedrinho-chat-wrapper .copilotKitAssistantMessage {
  background-color: hsl(var(--muted) / 0.4) !important;
  color: hsl(var(--foreground) / 0.85) !important;
  border-radius: 0.875rem !important;
  border: 1px solid hsl(var(--border) / 0.1) !important;
  font-size: 0.8125rem !important;
  line-height: 1.6 !important;
  padding: 0.75rem 1rem !important;
}

:is(.dark) .pedrinho-chat-wrapper .copilotKitAssistantMessage {
  background-color: hsl(var(--primary) / 0.04) !important;
  border-color: hsl(var(--primary) / 0.06) !important;
}

/* User message */
.pedrinho-chat-wrapper .copilotKitUserMessage {
  background-color: hsl(var(--primary) / 0.07) !important;
  color: hsl(var(--foreground) / 0.9) !important;
  border-radius: 0.875rem !important;
  border-bottom-right-radius: 0.375rem !important;
  border: 1px solid hsl(var(--primary) / 0.1) !important;
  font-size: 0.8125rem !important;
  line-height: 1.6 !important;
  padding: 0.625rem 0.875rem !important;
}

/* Markdown content */
.pedrinho-chat-wrapper .copilotKitMarkdown {
  font-size: 0.8125rem !important;
  line-height: 1.6 !important;
  color: inherit !important;
}

.pedrinho-chat-wrapper .copilotKitMarkdown code {
  font-size: 0.75rem !important;
  background-color: hsl(var(--foreground) / 0.05) !important;
  border-radius: 0.25rem !important;
  padding: 0.125rem 0.375rem !important;
}

/* Code blocks */
.pedrinho-chat-wrapper .copilotKitCodeBlock {
  border-radius: 0.625rem !important;
  border: 1px solid hsl(var(--border) / 0.08) !important;
  overflow: hidden !important;
}

.pedrinho-chat-wrapper .copilotKitCodeBlockToolbar {
  background-color: hsl(var(--foreground) / 0.03) !important;
  border-bottom: 1px solid hsl(var(--border) / 0.06) !important;
  font-size: 0.6875rem !important;
}

/* Activity dots */
.pedrinho-chat-wrapper .copilotKitActivityDot1,
.pedrinho-chat-wrapper .copilotKitActivityDot2,
.pedrinho-chat-wrapper .copilotKitActivityDot3 {
  background-color: hsl(var(--primary) / 0.4) !important;
}

/* Welcome/suggestion styles */
.pedrinho-chat-wrapper [class*="suggestion"],
.pedrinho-chat-wrapper [class*="Suggestion"] {
  font-size: 0.6875rem !important;
  padding: 0.3rem 0.625rem !important;
  border-radius: 0.5rem !important;
  background-color: hsl(var(--primary) / 0.06) !important;
  border: 1px solid hsl(var(--primary) / 0.1) !important;
  color: hsl(var(--primary) / 0.6) !important;
  transition: all 0.15s ease !important;
  cursor: pointer !important;
}

.pedrinho-chat-wrapper [class*="suggestion"]:hover,
.pedrinho-chat-wrapper [class*="Suggestion"]:hover {
  background-color: hsl(var(--primary) / 0.12) !important;
  color: hsl(var(--primary) / 0.8) !important;
  border-color: hsl(var(--primary) / 0.2) !important;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/globals.css
git commit -m "refactor(pedrinho): migrate CSS to minimal overrides, hide built-in input"
```

---

## Task 14: Update Barrel Exports

**Files:**
- Modify: `src/components/layout/pedrinho-agent/index.ts`

- [ ] **Step 1: Update exports**

```typescript
// src/components/layout/pedrinho-agent/index.ts
export { PedrinhoAgent } from './pedrinho-agent'
export type { PedrinhoMode } from './pedrinho-agent'
export type { PedrinhoAttachment, AttachmentType, MultimodalRequest } from './types'
```

- [ ] **Step 2: Create hooks/index.ts barrel**

Not needed — hooks are imported directly by sibling components within the same feature. Cross-feature imports use the top-level barrel.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/pedrinho-agent/index.ts
git commit -m "chore(pedrinho): update barrel exports"
```

---

## Task 15: Verify Build

- [ ] **Step 1: Run type-check**

```bash
npm run type-check
```

Expected: No TypeScript errors. If errors appear, fix them.

- [ ] **Step 2: Run dev server and manually test**

```bash
npm run dev
```

Test checklist:
- [ ] Panel opens via ⌘⇧J
- [ ] Panel is resizable by dragging left edge
- [ ] Width persists after closing/reopening
- [ ] Text messages send and receive normally
- [ ] Attachment menu opens and allows file selection
- [ ] Selected files show as chips in the attachment strip
- [ ] Audio recording starts with mic button
- [ ] Waveform visualization shows during recording
- [ ] Recorded audio appears as attachment chip
- [ ] Sending with attachments calls multimodal API
- [ ] Response appears in chat
- [ ] Panel goes fullscreen on mobile viewport (< 768px)
- [ ] Escape closes the panel

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat(pedrinho): complete multimodal sidebar with resize, attachments, audio"
```

---

## Architecture Notes for the Implementing Agent

### Message Flow (Text-only)
```
BriefingInput → handleSendText → agent.addMessage() + agent.runAgent()
  → CopilotKit runtime → Gemini → streaming response → CopilotChat renders
```

### Message Flow (Multimodal)
```
BriefingInput → handleSendMultimodal → agent.addMessage() (display only)
  → fetch('/api/pedrinho/multimodal') → Gemini with content parts
  → response → agent.addMessage() (display assistant response)
```

### Why Two Paths?
CopilotKit v2 does not support multipart content in messages (`agent.addMessage` only accepts `{ role, content: string }`). The multimodal bypass sends attachments directly to Gemini via the AI SDK, then injects the response back into the chat display.

### Resize Behavior
- Desktop (≥ 768px): Draggable left edge, width stored in localStorage
- Mobile (< 768px): Fullscreen overlay, no resize handle
- Main content shifts left by `panelWidth` on desktop only

### CopilotChat Input Hidden
We hide CopilotChat's built-in input via CSS (`.copilotKitInput { display: none }`) and render `BriefingInput` below the chat. This gives us full control over the input UX while keeping CopilotChat's message rendering.
