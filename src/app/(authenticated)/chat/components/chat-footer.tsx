"use client";

import React, { useRef, useState } from "react";
import { Mic, Paperclip, PlusCircleIcon, SendIcon, SmileIcon, X, FileIcon, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { actionUploadFile, actionDeleteFile } from "../actions/file-actions";
import { ChatMessageData } from "../domain";

interface ChatFooterProps {
  salaId: number;
  onEnviarMensagem: (conteudo: string, tipo?: string, data?: ChatMessageData | null) => Promise<void>;
  onTyping?: () => void;
  typingIndicatorText?: string | null;
}

export function ChatFooter({ salaId, onEnviarMensagem, onTyping, typingIndicatorText }: ChatFooterProps) {
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<ChatMessageData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Não foi possível acessar o microfone. Verifique as permissões do seu navegador.");
    }
  };

  const stopRecording = async (shouldSend: boolean) => {
    if (!mediaRecorderRef.current) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return new Promise<void>((resolve) => {
      const recorder = mediaRecorderRef.current!; // Non-null assertion strictly within this scope

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        // Stop all tracks
        recorder.stream.getTracks().forEach(track => track.stop());

        if (shouldSend) {
          setIsUploading(true);
          // Convert Blob to File
          const audioFile = new File([audioBlob], `audio_${Date.now()}.webm`, { type: 'audio/webm' });

          const formData = new FormData();
          formData.append("file", audioFile);

          try {
            const result = await actionUploadFile(salaId, formData);

            if (!result.success) {
              console.error("Audio upload failed:", result.error);
              alert("Falha ao enviar áudio.");
              setIsUploading(false);
              return;
            }

            if (result.success && result.data) {
              // Send message with audio data
              const audioData: ChatMessageData = {
                fileUrl: result.data.fileUrl,
                fileKey: result.data.fileKey,
                fileName: result.data.fileName,
                mimeType: result.data.mimeType,
                size: result.data.fileSize,
              };
              await onEnviarMensagem("", "audio", audioData);
            }
          } catch (error) {
            console.error("Audio upload error:", error);
          } finally {
            setIsUploading(false);
          }
        }

        // Reset state
        setIsRecording(false);
        setRecordingDuration(0);
        mediaRecorderRef.current = null;
        audioChunksRef.current = [];
        resolve();
      };

      recorder.stop();
    });
  };

  const cancelRecording = () => {
    stopRecording(false);
  };

  const handleSendAudio = () => {
    stopRecording(true);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await actionUploadFile(salaId, formData);
      if (result.success) {
        if (result.data) {
          setUploadedFile({
            fileUrl: result.data.fileUrl,
            fileKey: result.data.fileKey,
            fileName: result.data.fileName,
            mimeType: result.data.mimeType,
            size: result.data.fileSize,
          });
          if (!message) {
            setMessage(result.data.fileName);
          }
        }
      } else {
        console.error("Upload failed:", result.error);
        alert("Falha no upload: " + (result.message || "Erro desconhecido"));
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = async () => {
    if (uploadedFile?.fileKey) {
      await actionDeleteFile(uploadedFile.fileKey);
    }
    setUploadedFile(null);
  };

  const handleSend = async () => {
    if ((!message.trim() && !uploadedFile) || isUploading) return;

    const conteudo = message;
    let tipo = 'texto';
    let data = undefined;

    if (uploadedFile) {
      tipo = uploadedFile.mimeType?.startsWith('image/') ? 'imagem' :
        uploadedFile.mimeType?.startsWith('video/') ? 'video' :
          uploadedFile.mimeType?.startsWith('audio/') ? 'audio' : 'arquivo';
      data = uploadedFile;
    }

    setMessage("");
    setUploadedFile(null);

    await onEnviarMensagem(conteudo, tipo, data);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    onTyping?.();
  };

  return (
    <div className="px-5 pb-4 pt-3 bg-chat-thread">
      {/* Typing Indicator */}
      {typingIndicatorText && !isRecording && (
        <div className="flex items-center gap-1.5 text-[0.65rem] text-muted-foreground/50 px-2 mb-1.5">
          <div className="flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1 h-1 rounded-full bg-primary/40 animate-[typingBounce_1.4s_infinite]"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
          <span>{typingIndicatorText}</span>
        </div>
      )}

      {/* File Preview Area */}
      {uploadedFile && (
        <div className="mb-2 p-2 bg-muted rounded-md flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <FileIcon className="h-5 w-5 text-info dark:text-info shrink-0" />
            <span className="text-sm truncate max-w-50">{uploadedFile.fileName}</span>
          </div>
          <Button variant="ghost" size="icon" aria-label="Fechar" className="h-6 w-6" onClick={handleRemoveFile}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Glass input wrapper */}
        <div
          className="flex-1 flex items-end rounded-2xl border transition-all duration-200 px-3.5 pb-1 pt-1 min-h-[44px] focus-within:border-primary/25 focus-within:shadow-[0_0_0_3px_rgba(139,92,246,0.06)] border-white/[0.08]"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          {isRecording ? (
            // Recording UI — unchanged
            <div className="flex-1 flex items-center justify-between h-[36px] w-full">
              <div className="flex items-center gap-3">
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive dark:bg-destructive opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive dark:bg-destructive"></span>
                </div>
                <span className="font-mono text-destructive dark:text-destructive font-medium">{formatDuration(recordingDuration)}</span>
                <span className="text-xs text-destructive dark:text-destructive animate-pulse hidden sm:inline-block">Gravando áudio...</span>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={cancelRecording} className="text-muted-foreground hover:text-destructive hover:bg-destructive/15 dark:hover:text-destructive rounded-full px-4">
                  Cancelar
                </Button>
                <Button size="icon" aria-label="Enviar" onClick={handleSendAudio} className="rounded-full bg-destructive hover:bg-destructive dark:bg-destructive dark:hover:bg-destructive text-white h-9 w-9">
                  <SendIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            // Default Text Input UI
            <>
              <Textarea
                value={message}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                disabled={isUploading}
                placeholder={isUploading ? "Enviando arquivo..." : "Digite uma mensagem..."}
                rows={1}
                className="flex-1 bg-transparent border-none shadow-none ring-0 focus-visible:ring-0 resize-none min-h-8 max-h-[120px] overflow-y-auto text-[0.825rem] leading-relaxed py-1 px-0 placeholder:text-muted-foreground/40"
              />

              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileSelect}
                aria-label="Anexar arquivo à mensagem"
              />

              {/* Action buttons — desktop inline, mobile dropdown */}
              <div className="flex items-center self-end pb-0.5">
                {/* Mobile: dropdown */}
                <div className="block lg:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="size-11 rounded-full p-0">
                        <PlusCircleIcon className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>Emoji</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                        Anexar Arquivo
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={startRecording}>
                        Gravar Áudio
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {/* Desktop: inline icon buttons */}
                <div className="hidden lg:flex items-center gap-0.5">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Emoji" className="rounded-full size-8">
                          <SmileIcon className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">Emoji</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Anexar arquivo"
                          className="rounded-full size-8"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                        >
                          {isUploading ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">Anexar Arquivo</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Microfone"
                          className="rounded-full size-8 hover:bg-destructive/15 hover:text-destructive transition-colors"
                          onClick={startRecording}
                        >
                          <Mic className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">Gravar Audio</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Send button — OUTSIDE glass wrapper, always visible when not recording */}
        {!isRecording && (
          <Button
            size="icon"
            className="size-9 rounded-[0.625rem] bg-primary text-primary-foreground shadow-[0_2px_10px_rgba(139,92,246,0.3)] hover:shadow-[0_4px_15px_rgba(139,92,246,0.4)] hover:-translate-y-px transition-all shrink-0 self-end"
            onClick={handleSend}
            disabled={(!message && !uploadedFile) || isUploading}
            aria-label="Enviar mensagem"
          >
            <SendIcon className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
