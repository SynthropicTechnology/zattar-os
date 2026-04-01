'use client'

import { useCallback, useRef, useState } from 'react'
import { Mic, Send, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAttachments } from '../hooks/use-attachments'
import { useAudioRecorder } from '../hooks/use-audio-recorder'
import { AttachmentMenu } from './attachment-menu'
import { AttachmentStrip } from './attachment-strip'
import { AudioRecorder } from './audio-recorder'
import type { MultimodalRequest } from '../types'

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
  const { attachments, error, addFiles, addAudioBlob, remove, clear, openFilePicker, toBase64Array } =
    useAttachments()
  const recorder = useAudioRecorder()
  const isRecording = recorder.status === 'recording'

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
      <AttachmentStrip attachments={attachments} onRemove={remove} />

      {error && (
        <div className="px-3 py-1">
          <p className="text-[11px] text-destructive/80">{error}</p>
        </div>
      )}

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
            <AttachmentMenu onSelect={openFilePicker} disabled={isAgentRunning} />

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
