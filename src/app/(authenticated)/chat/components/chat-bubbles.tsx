import { cn } from "@/lib/utils";
import { Ellipsis, FileIcon, Download } from "lucide-react";
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
import Image from "next/image";
import { format } from "date-fns";

// Helper for time formatting
function formatTime(dateStr: string) {
  try {
    return format(new Date(dateStr), "HH:mm");
  } catch {
    return "";
  }
}

interface ChatBubbleProps {
  message: MensagemComUsuario;
  isFirstInGroup?: boolean; // controls top corner radius
  isLastInGroup?: boolean;  // controls whether to show timestamp
  showTimestamp?: boolean;  // explicit override
}

function TextChatBubble({
  message,
  isFirstInGroup = true,
  isLastInGroup = true,
  showTimestamp,
}: ChatBubbleProps) {
  // If showTimestamp is explicitly set, use it; otherwise fall back to isLastInGroup
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
          // Received bubble
          !message.ownMessage && [
            "bg-(--chat-bubble-received) border border-white/[0.05]",
            isFirstInGroup
              ? "rounded-[0.875rem]"
              : "rounded-[0.25rem_0.875rem_0.875rem_0.875rem]"
          ],
          // Sent bubble
          message.ownMessage && [
            "bg-primary text-white shadow-lg shadow-primary/20",
            isFirstInGroup
              ? "rounded-[0.875rem]"
              : "rounded-[0.875rem_0.25rem_0.875rem_0.875rem]"
          ]
        )}
        style={{ overflowWrap: "anywhere" }}
      >
        {message.conteudo}
      </div>

      {/* Timestamp — only on last bubble */}
      {shouldShowTimestamp && (
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
      )}
    </div>
  );
}

function FileChatBubble({ message }: ChatBubbleProps) {
  const fileUrl = message.data?.fileUrl;
  const fileName = message.data?.fileName || "Arquivo";
  const size = message.data?.size ? `${(Number(message.data.size) / 1024 / 1024).toFixed(2)} MB` : "";

  return (
    <div
      className={cn("max-w-[80%] lg:max-w-[60%] space-y-1", {
        "self-end": message.ownMessage
      })}>
      <div className="flex items-center gap-2">
        <div
          className={cn("bg-chat-bubble-received inline-flex items-start rounded-md border p-4", {
            "order-1 bg-primary/10": message.ownMessage
          })}>
          <FileIcon className="me-4 mt-1 size-8 opacity-50 shrink-0" strokeWidth={1.5} />
          <div className="flex flex-col gap-2 min-w-0">
            <div className="text-sm font-medium wrap-break-word" style={{ overflowWrap: "anywhere" }}>
              {fileName}
              <span className="text-muted-foreground ms-2 text-xs">({size})</span>
            </div>
            {fileUrl && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={fileUrl} target="_blank" rel="noopener noreferrer" download>
                    <Download className="mr-2 h-3 w-3" /> Download
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div
        className={cn("flex items-center gap-2", {
          "justify-end": message.ownMessage
        })}>
        <time className="text-muted-foreground mt-1 flex items-center text-xs">
          {formatTime(message.createdAt)}
        </time>
        {message.ownMessage && <MessageStatusIcon status={message.status || 'sent'} />}
      </div>
    </div>
  );
}

function VideoChatBubble({ message }: ChatBubbleProps) {
  const videoUrl = message.data?.fileUrl;
  return (
    <div
      className={cn("max-w-[80%] lg:max-w-[60%] space-y-1", {
        "self-end": message.ownMessage
      })}>
      <div className="flex items-center gap-4">
        <div className={cn("relative order-1 overflow-hidden rounded-lg bg-black", {
            "order-1": message.ownMessage
          })}>
          <video
            src={videoUrl}
            controls
            className="max-w-full rounded-lg max-h-75"
            preload="metadata"
          />
        </div>
      </div>
      <div
        className={cn("flex items-center gap-2", {
          "justify-end": message.ownMessage
        })}>
        <time className="text-muted-foreground mt-1 flex items-center text-xs">
          {formatTime(message.createdAt)}
        </time>
        {message.ownMessage && <MessageStatusIcon status={message.status || 'sent'} />}
      </div>
    </div>
  );
}

function AudioChatBubble({ message }: ChatBubbleProps) {
  const audioUrl = message.data?.fileUrl;
  return (
    <div
      className={cn("max-w-[80%] lg:max-w-[60%]", {
        "self-end": message.ownMessage
      })}>
      <div className="flex items-center gap-2">
        <div
          className={cn("bg-chat-bubble-received inline-flex gap-4 rounded-md p-4", {
            "relative order-1 flex items-center justify-center": message.ownMessage
          })}>
          <audio controls className="w-full min-w-50 max-w-full">
            <source src={audioUrl} />
            Seu navegador não suporta áudio.
          </audio>
        </div>
      </div>
      <div
        className={cn("flex items-center gap-2", {
          "justify-end": message.ownMessage
        })}>
        <time className="text-muted-foreground mt-1 flex items-center text-xs">
          {formatTime(message.createdAt)}
        </time>
        {message.ownMessage && <MessageStatusIcon status={message.status || 'sent'} />}
      </div>
    </div>
  );
}

function ImageChatBubble({ message }: ChatBubbleProps) {
  const imageUrl = message.data?.fileUrl;

  return (
    <div
      className={cn("max-w-[80%] lg:max-w-[60%]", {
        "self-end": message.ownMessage
      })}>
      <div className="flex items-center gap-2">
        <div
          className={cn("bg-chat-bubble-received inline-flex gap-4 rounded-md border p-2", {
            "relative order-1 flex items-center justify-center": message.ownMessage
          })}>
          <figure className="relative overflow-hidden rounded-lg">
             {imageUrl && (
              <Image
                src={imageUrl}
                className="max-w-full rounded-lg object-cover"
                width={300}
                height={200}
                alt="Image attachment"
                unoptimized // For external URLs
              />
             )}
          </figure>
        </div>
      </div>
      <div
        className={cn("mt-1 flex items-center gap-2", {
          "justify-end": message.ownMessage
        })}>
        <time className="text-muted-foreground mt-1 flex items-center text-xs">
          {formatTime(message.createdAt)}
        </time>
        {message.ownMessage && <MessageStatusIcon status={message.status || 'sent'} />}
      </div>
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
    default:
      if (message.data?.fileUrl) {
        if (message.data.mimeType?.startsWith('image/')) {
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
