"use client";

import React from "react";
import { ArrowLeft, Ellipsis, Video, Phone, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateAvatarFallback } from "@/lib/utils";
import useChatStore from "./useChatStore";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChatUserDropdown } from "./chat-list-item-dropdown";
import { Avatar, AvatarFallback, AvatarImage, AvatarIndicator } from "@/components/ui/avatar";
import { ChatItem } from "../domain";

interface ChatHeaderProps {
  sala: ChatItem;
  onVideoCall: () => void | Promise<void>;
  onAudioCall: () => void | Promise<void>;
  onScreenshare?: () => void | Promise<void>;
}

export function ChatHeader({ sala, onVideoCall, onAudioCall, onScreenshare }: ChatHeaderProps) {
  const { setSelectedChat } = useChatStore();

  const isGroup = sala.tipo === 'grupo' || sala.tipo === 'geral';
  const name = sala.name;
  const image = sala.image;
  const onlineStatus = sala.usuario?.onlineStatus || 'offline';
  const lastSeen = sala.usuario?.lastSeen;

  return (
    <div className="flex justify-between gap-4 px-4 py-2 border-b bg-card">
      <div className="flex gap-4 items-center">
        <Button
          size="sm"
          variant="outline"
          className="flex size-10 p-0 lg:hidden"
          onClick={() => setSelectedChat(null)}>
          <ArrowLeft />
        </Button>
        <Avatar className="overflow-visible lg:size-10">
          <AvatarImage src={image} alt={name} />
          {!isGroup && <AvatarIndicator variant={onlineStatus} />}
          <AvatarFallback>{generateAvatarFallback(name)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold">{name}</span>
          {!isGroup && (
            onlineStatus === "online" ? (
              <span className="text-xs text-green-500">Online</span>
            ) : (
              <span className="text-muted-foreground text-xs">
                {lastSeen ? `Visto por último ${new Date(lastSeen).toLocaleString()}` : 'Offline'}
              </span>
            )
          )}
          {isGroup && (
            <span className="text-muted-foreground text-xs">
               {sala.tipo === 'geral' ? 'Sala Geral' : 'Grupo'}
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-2 items-center">
        <div className="hidden lg:flex lg:gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="secondary" onClick={onVideoCall}>
                  <Video className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Chamada de Vídeo</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="secondary" onClick={onAudioCall}>
                  <Phone className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Chamada de Áudio</TooltipContent>
            </Tooltip>
            {onScreenshare && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="secondary" onClick={onScreenshare}>
                    <Monitor className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Compartilhar Tela</TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
        <ChatUserDropdown chat={sala}>
          <Button size="icon" variant="ghost">
            <Ellipsis />
          </Button>
        </ChatUserDropdown>
      </div>
    </div>
  );
}