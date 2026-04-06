'use client'

import { useCallback, useRef, useState } from 'react'
import { ArrowUp, Mic, Paperclip, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAttachments } from '../hooks/use-attachments'
import { useAudioRecorder } from '../hooks/use-audio-recorder'
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
    <div className="px-3 pb-3">
      <AttachmentStrip attachments={attachments} onRemove={remove} />

      {error && (
        <div className="px-1 py-1">
          <p className="text-[11px] text-destructive/80">{error}</p>
        </div>
      )}

      {/* Input container */}
      <div
        className={cn(
          'relative flex flex-col w-full rounded-xl',
          'border border-border/25 dark:border-border/15',
          'bg-muted/40 dark:bg-white/4',
          'transition-colors duration-150',
          'focus-within:border-border/40 dark:focus-within:border-border/25',
        )}
      >
        {isRecording ? (
          <div className="px-3 py-2.5">
            <AudioRecorder
              duration={recorder.duration}
              waveformData={recorder.waveformData}
              onFinish={handleFinishRecording}
              onCancel={recorder.cancel}
            />
          </div>
        ) : (
          <>
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
                'w-full min-h-11 max-h-40 resize-none',
                'bg-transparent text-[13px] text-foreground',
                'placeholder:text-muted-foreground/50',
                'px-3 pt-2.5 pb-0',
                'outline-none',
                'disabled:opacity-50'
              )}
            />

            <div className="flex items-center gap-1 px-2 pb-2 pt-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openFilePicker('document')}
                disabled={isAgentRunning}
                aria-label="Anexar arquivo"
                className="size-7 rounded-lg text-muted-foreground/50 hover:text-foreground/70"
              >
                <Paperclip className="size-4" />
              </Button>

              {recorder.isSupported && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={recorder.start}
                  disabled={isAgentRunning}
                  aria-label="Gravar áudio"
                  className="size-7 rounded-lg text-muted-foreground/50 hover:text-foreground/70"
                >
                  <Mic className="size-4" />
                </Button>
              )}

              <div className="ml-auto">
                {isAgentRunning ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onStopAgent}
                    aria-label="Parar resposta"
                    className="size-7 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive"
                  >
                    <Square className="size-3.5" />
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="icon"
                    onClick={handleSend}
                    disabled={!hasContent}
                    aria-label="Enviar mensagem"
                    className="size-7 rounded-full"
                  >
                    <ArrowUp className="size-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
