"use client";

import { cn } from "@/lib/utils";
import { Ellipsis, FileIcon, Download, Play, Pause } from "lucide-react";
import { MensagemComUsuario } from "../domain";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MessageStatusIcon } from "./message-status-icon";
import { IconContainer } from "@/components/ui/icon-container";
import Image from "next/image";
import { format } from "date-fns";
import { useState, useRef, useCallback } from "react";

// Helper for time formatting
function formatTime(dateStr: string) {
  try {
    return format(new Date(dateStr), "HH:mm");
  } catch {
    return "";
  }
}

// Helper for duration formatting
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Helper to parse duration string (e.g., "1:45" -> 105 seconds)
function parseDuration(duration: string | undefined): number {
  if (!duration) return 0;
  const parts = duration.split(":").map(Number);
  if (parts.length === 2) return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
  return 0;
}

interface ChatBubbleProps {
  message: MensagemComUsuario;
  isFirstInGroup?: boolean; // controls top corner radius
  isLastInGroup?: boolean;  // controls whether to show timestamp
  showTimestamp?: boolean;  // explicit override
}

// Timestamp row — shared across all bubble types
function TimestampRow({ message, shouldShow }: { message: MensagemComUsuario; shouldShow: boolean }) {
  if (!shouldShow) return null;
  return (
    <div
      className={cn(
        "flex items-center gap-[0.25rem] mt-[0.25rem] px-[0.125rem]",
        message.ownMessage && "justify-end"
      )}
    >
      <time className="text-[0.625rem] text-muted-foreground/35 tabular-nums font-mono">
        {formatTime(message.createdAt)}
      </time>
      {message.ownMessage && (
        <MessageStatusIcon status={message.status || "sent"} />
      )}
    </div>
  );
}

// Bubble corner helper — returns className string for asymmetric corners
function bubbleCornerClass(isOwn: boolean, isFirstInGroup: boolean): string {
  if (isOwn) {
    return isFirstInGroup
      ? "rounded-[0.875rem]"
      : "rounded-[0.875rem_0.25rem_0.875rem_0.875rem]";
  }
  return isFirstInGroup
    ? "rounded-[0.875rem]"
    : "rounded-[0.25rem_0.875rem_0.875rem_0.875rem]";
}

function TextChatBubble({
  message,
  isFirstInGroup = true,
  isLastInGroup = true,
  showTimestamp,
}: ChatBubbleProps) {
  const shouldShowTimestamp = showTimestamp !== undefined ? showTimestamp : isLastInGroup;

  return (
    <div className="group relative">
      {/* Context menu trigger — group-hover */}
      <div className={cn(
        "absolute top-1/2 -translate-y-1/2 hidden group-hover:block z-10",
        message.ownMessage ? "-left-8" : "-right-8"
      )}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" aria-label="Mais opções" variant="ghost" className="h-6 w-6">
              <Ellipsis className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={message.ownMessage ? "start" : "end"}>
            <DropdownMenuGroup>
              <DropdownMenuItem>Encaminhar</DropdownMenuItem>
              <DropdownMenuItem>Deletar</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "px-4 py-2 text-[0.8125rem] leading-[1.5]",
          bubbleCornerClass(!!message.ownMessage, isFirstInGroup),
          // Received bubble
          !message.ownMessage && "bg-(--chat-bubble-received) border border-white/[0.05]",
          // Sent bubble
          message.ownMessage && "bg-primary text-white shadow-lg shadow-primary/20"
        )}
        style={{ overflowWrap: "anywhere" }}
      >
        {message.conteudo}
      </div>

      <TimestampRow message={message} shouldShow={shouldShowTimestamp} />
    </div>
  );
}

function FileChatBubble({
  message,
  isFirstInGroup = true,
  isLastInGroup = true,
  showTimestamp,
}: ChatBubbleProps) {
  const fileUrl = message.data?.fileUrl;
  const fileName = message.data?.fileName || "Arquivo";
  const rawSize = message.data?.size;
  const fileSizeLabel = rawSize
    ? `${(Number(rawSize) / 1024 / 1024).toFixed(2)} MB`
    : "";
  const isOwn = !!message.ownMessage;
  const shouldShowTimestamp = showTimestamp !== undefined ? showTimestamp : isLastInGroup;

  return (
    <div>
      {/* File bubble container */}
      <div
        className={cn(
          "flex items-center gap-3 p-3 pr-4 min-w-[240px]",
          bubbleCornerClass(isOwn, isFirstInGroup),
          // Received
          !isOwn && "bg-foreground/[0.03] border border-foreground/[0.06]",
          // Sent
          isOwn && "bg-primary/[0.08] border border-primary/[0.12]"
        )}
      >
        {/* File icon container — 36px, rounded-lg */}
        <IconContainer
          size="md"
          className={cn(
            "rounded-lg size-9",
            isOwn ? "bg-primary/12 text-primary" : "bg-info/10 text-info"
          )}
        >
          <FileIcon className="size-4" />
        </IconContainer>

        {/* File info */}
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[0.75rem] font-semibold text-foreground truncate">
            {fileName}
          </span>
          {fileSizeLabel && (
            <span className="text-[0.625rem] text-muted-foreground/40 mt-0.5">
              {fileSizeLabel}
            </span>
          )}
        </div>

        {/* Download button */}
        {fileUrl && (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            aria-label={`Baixar ${fileName}`}
            className={cn(
              "size-7 rounded-md flex items-center justify-center shrink-0 transition-colors",
              "bg-foreground/[0.04] text-muted-foreground/50",
              "hover:bg-foreground/[0.08] hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            )}
          >
            <Download className="size-3.5" />
          </a>
        )}
      </div>

      <TimestampRow message={message} shouldShow={shouldShowTimestamp} />
    </div>
  );
}

function AudioChatBubble({
  message,
  isFirstInGroup = true,
  isLastInGroup = true,
  showTimestamp,
}: ChatBubbleProps) {
  const audioUrl = message.data?.fileUrl;
  const totalDuration = parseDuration(message.data?.duration);
  const isOwn = !!message.ownMessage;
  const shouldShowTimestamp = showTimestamp !== undefined ? showTimestamp : isLastInGroup;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handlePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  }, [isPlaying]);

  const handleTimeUpdate = useCallback(() => {
    setCurrentTime(audioRef.current?.currentTime ?? 0);
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const handlePlay = useCallback(() => setIsPlaying(true), []);
  const handlePause = useCallback(() => setIsPlaying(false), []);

  // Waveform bar generation — deterministic based on message id chars
  const messageIdSeed = message.id
    ? String(message.id).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
    : 42;
  const BAR_COUNT = 30;
  const barHeights: number[] = Array.from({ length: BAR_COUNT }, (_, i) => {
    const raw = Math.sin(messageIdSeed * (i + 1) * 0.7) * 0.5 + 0.5;
    // Scale to 4-20px range
    return Math.round(4 + raw * 16);
  });

  // Progress ratio
  const effectiveDuration = totalDuration > 0 ? totalDuration : (audioRef.current?.duration ?? 0);
  const progressRatio = effectiveDuration > 0 ? currentTime / effectiveDuration : 0;
  const progressBarIndex = Math.round(progressRatio * BAR_COUNT);

  // Duration label
  const displayCurrent = formatDuration(currentTime);
  const displayTotal = formatDuration(effectiveDuration);
  const durationLabel = effectiveDuration > 0
    ? `${displayCurrent} / ${displayTotal}`
    : displayCurrent;

  return (
    <div>
      <div
        className={cn(
          "px-4 py-2 flex items-center gap-[0.625rem] min-w-[220px]",
          bubbleCornerClass(isOwn, isFirstInGroup),
          !isOwn && "bg-(--chat-bubble-received) border border-white/[0.05]",
          isOwn && "bg-primary text-white shadow-lg shadow-primary/20"
        )}
      >
        {/* Hidden audio element */}
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onPlay={handlePlay}
          onPause={handlePause}
          className="sr-only"
        >
          Seu navegador não suporta áudio.
        </audio>

        {/* Play/Pause button */}
        <button
          type="button"
          onClick={handlePlayPause}
          aria-label="Reproduzir audio"
          className={cn(
            "size-8 rounded-full shrink-0 flex items-center justify-center transition-transform active:scale-95",
            isOwn ? "bg-white/20 text-white" : "bg-primary/15 text-primary"
          )}
        >
          {isPlaying
            ? <Pause className="size-[0.875rem] fill-current" />
            : <Play className="size-[0.875rem] fill-current" />
          }
        </button>

        {/* Waveform bars */}
        <div className="flex-1 h-6 flex items-center gap-1" aria-hidden="true">
          {barHeights.map((height, i) => (
            <div
              key={i}
              className={cn(
                "w-1 rounded-full shrink-0",
                i < progressBarIndex
                  ? (isOwn ? "bg-white/60" : "bg-primary/60")
                  : (isOwn ? "bg-white/35" : "bg-primary/30")
              )}
              style={{ height: `${height}px` }}
            />
          ))}
        </div>

        {/* Duration label */}
        <span className="text-[0.625rem] tabular-nums opacity-60 shrink-0 font-mono">
          {durationLabel}
        </span>
      </div>

      <TimestampRow message={message} shouldShow={shouldShowTimestamp} />
    </div>
  );
}

function ImageChatBubble({
  message,
  isFirstInGroup = true,
  isLastInGroup = true,
  showTimestamp,
}: ChatBubbleProps) {
  const imageUrl = message.data?.fileUrl;
  const isOwn = !!message.ownMessage;
  const shouldShowTimestamp = showTimestamp !== undefined ? showTimestamp : isLastInGroup;

  return (
    <div>
      <div
        className={cn(
          "p-2",
          bubbleCornerClass(isOwn, isFirstInGroup),
          !isOwn && "bg-(--chat-bubble-received) border border-white/[0.05]",
          isOwn && "bg-primary shadow-lg shadow-primary/20"
        )}
      >
        <div className="rounded-xl overflow-hidden max-w-[280px]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              className="w-full h-auto block rounded-xl object-cover"
              width={280}
              height={200}
              alt={message.data?.fileName || "Imagem anexada"}
              unoptimized
            />
          ) : (
            <div className="w-[280px] h-32 bg-foreground/10 rounded-xl flex items-center justify-center">
              <span className="text-[0.625rem] text-muted-foreground/40">Imagem anexada</span>
            </div>
          )}
        </div>
      </div>

      <TimestampRow message={message} shouldShow={shouldShowTimestamp} />
    </div>
  );
}

function VideoChatBubble({
  message,
  isFirstInGroup = true,
  isLastInGroup = true,
  showTimestamp,
}: ChatBubbleProps) {
  const videoUrl = message.data?.fileUrl;
  const isOwn = !!message.ownMessage;
  const shouldShowTimestamp = showTimestamp !== undefined ? showTimestamp : isLastInGroup;

  return (
    <div>
      <div
        className={cn(
          "rounded-xl overflow-hidden bg-black",
          bubbleCornerClass(isOwn, isFirstInGroup)
        )}
      >
        <video
          src={videoUrl}
          controls
          className="max-w-full rounded-xl max-h-[300px]"
          preload="metadata"
        />
      </div>

      <TimestampRow message={message} shouldShow={shouldShowTimestamp} />
    </div>
  );
}

export function ChatBubble({
  message,
  isFirstInGroup,
  isLastInGroup,
  showTimestamp,
}: ChatBubbleProps) {
  switch (message.tipo) {
    case "texto":
      return (
        <TextChatBubble
          message={message}
          isFirstInGroup={isFirstInGroup}
          isLastInGroup={isLastInGroup}
          showTimestamp={showTimestamp}
        />
      );
    case "video":
      return (
        <VideoChatBubble
          message={message}
          isFirstInGroup={isFirstInGroup}
          isLastInGroup={isLastInGroup}
          showTimestamp={showTimestamp}
        />
      );
    case "audio":
      return (
        <AudioChatBubble
          message={message}
          isFirstInGroup={isFirstInGroup}
          isLastInGroup={isLastInGroup}
          showTimestamp={showTimestamp}
        />
      );
    case "imagem":
      return (
        <ImageChatBubble
          message={message}
          isFirstInGroup={isFirstInGroup}
          isLastInGroup={isLastInGroup}
          showTimestamp={showTimestamp}
        />
      );
    case "arquivo":
      return (
        <FileChatBubble
          message={message}
          isFirstInGroup={isFirstInGroup}
          isLastInGroup={isLastInGroup}
          showTimestamp={showTimestamp}
        />
      );
    case "sistema":
      return (
        <div className="text-[0.625rem] text-muted-foreground/40 text-center py-2">
          {message.conteudo}
        </div>
      );
    default:
      if (message.data?.fileUrl) {
        if (message.data.mimeType?.startsWith("image/")) {
          return (
            <ImageChatBubble
              message={message}
              isFirstInGroup={isFirstInGroup}
              isLastInGroup={isLastInGroup}
              showTimestamp={showTimestamp}
            />
          );
        }
        return (
          <FileChatBubble
            message={message}
            isFirstInGroup={isFirstInGroup}
            isLastInGroup={isLastInGroup}
            showTimestamp={showTimestamp}
          />
        );
      }
      return (
        <TextChatBubble
          message={message}
          isFirstInGroup={isFirstInGroup}
          isLastInGroup={isLastInGroup}
          showTimestamp={showTimestamp}
        />
      );
  }
}
