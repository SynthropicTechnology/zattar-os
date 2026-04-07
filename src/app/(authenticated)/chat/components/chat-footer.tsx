"use client";

import React, { useRef, useState } from "react";
import { Mic, Paperclip, PlusCircleIcon, SendIcon, SmileIcon, X, FileIcon, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    onTyping?.();
  };

  return (
    <div className="px-4 pb-4 bg-chat-thread">
      {/* Typing Indicator */}
      {typingIndicatorText && !isRecording && (
        <div className="text-xs text-muted-foreground ml-4 mb-1 animate-pulse">
          {typingIndicatorText}
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

      <div className={`relative flex items-center rounded-md border transition-colors duration-300 ${isRecording ? 'bg-destructive/15 border-destructive dark:border-destructive' : 'bg-muted'}`}>

        {isRecording ? (
          // Recording UI
          <div className="flex-1 flex items-center justify-between h-14 px-4">
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
            <Input
              type="text"
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              disabled={isUploading}
              className="h-14 border-transparent bg-white pe-32 text-base! shadow-transparent! ring-transparent! lg:pe-56"
              placeholder={isUploading ? "Enviando arquivo..." : "Digite uma mensagem..."}
            />

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileSelect}
              aria-label="Anexar arquivo à mensagem"
            />

            <div className="absolute inset-e-4 flex items-center">
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
              <div className="hidden lg:block">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Emoji" className="rounded-full">
                        <SmileIcon />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Emoji</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon" aria-label="Anexar arquivo"
                        className="rounded-full"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        {isUploading ? <Loader2 className="animate-spin" /> : <Paperclip />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Anexar Arquivo</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon" aria-label="Microfone"
                        className="rounded-full hover:bg-destructive/15 hover:text-destructive dark:hover:text-destructive transition-colors"
                        onClick={startRecording}
                      >
                        <Mic />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Gravar Audio</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Button
                variant="outline"
                className="ms-3"
                onClick={handleSend}
                disabled={(!message && !uploadedFile) || isUploading}
              >
                <span className="hidden lg:inline">Enviar</span> <SendIcon className="inline lg:hidden" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
