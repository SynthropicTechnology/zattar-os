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
    return format(new Date(dateStr), "hh:mm a");
  } catch {
    return "";
  }
}

function TextChatBubble({ message }: { message: MensagemComUsuario }) {
  return (
    <div
      className={cn("max-w-[80%] lg:max-w-[60%] space-y-1", {
        "self-end": message.ownMessage
      })}>
      <div className="flex items-center gap-2">
        <div
          className={cn("bg-chat-bubble-received inline-flex rounded-md border p-3 wrap-break-word", {
            "order-1 bg-primary text-primary-foreground": message.ownMessage
          })}
          style={{ overflowWrap: "anywhere" }}>
          {message.conteudo}
        </div>
        <div className={cn({ "order-2": !message.ownMessage, "hidden group-hover:block": true })}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-6 w-6">
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
      </div>
      <div
        className={cn("flex items-center gap-2", {
          "justify-end": message.ownMessage
        })}>
        <time
          className={cn("text-muted-foreground mt-1 flex items-center text-xs", {
            "justify-end": message.ownMessage
          })}>
          {formatTime(message.createdAt)}
        </time>
        {message.ownMessage && <MessageStatusIcon status={message.status || 'sent'} />}
      </div>
    </div>
  );
}

function FileChatBubble({ message }: { message: MensagemComUsuario }) {
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

function VideoChatBubble({ message }: { message: MensagemComUsuario }) {
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

function AudioChatBubble({ message }: { message: MensagemComUsuario }) {
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

function ImageChatBubble({ message }: { message: MensagemComUsuario }) {
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

export function ChatBubble({ message }: { message: MensagemComUsuario }) {
  // Use message.tipo from enum (texto, arquivo, etc)
  // or infer from message.data?.mimeType if necessary
  // But type is stored in DB.
  
  // Mapping TipoMensagemChat to component
  switch (message.tipo) {
    case "texto":
      return <TextChatBubble message={message} />;
    case "video":
      return <VideoChatBubble message={message} />;
    case "audio":
      return <AudioChatBubble message={message} />;
    case "imagem":
      return <ImageChatBubble message={message} />;
    case "arquivo":
      return <FileChatBubble message={message} />;
    default:
      // Fallback
      if (message.data?.fileUrl) {
         if (message.data.mimeType?.startsWith('image/')) return <ImageChatBubble message={message} />;
         return <FileChatBubble message={message} />;
      }
      return <TextChatBubble message={message} />;
  }
}