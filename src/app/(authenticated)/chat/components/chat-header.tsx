"use client";

import React from "react";
import { ArrowLeft, Ellipsis, Video, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateAvatarFallback } from "@/lib/utils";
import useChatStore from "../hooks/use-chat-store";

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

export function ChatHeader({ sala, onVideoCall, onAudioCall, onScreenshare: _onScreenshare }: ChatHeaderProps) {
  const { setSelectedChat } = useChatStore();

  const isGroup = sala.tipo === 'grupo' || sala.tipo === 'geral';
  const name = sala.name;
  const image = sala.image;
  const onlineStatus = sala.usuario?.onlineStatus || 'offline';
  const lastSeen = sala.usuario?.lastSeen;

  return (
    <div
      className="relative z-10 flex items-center justify-between px-5 py-3 border-b border-white/[0.06] dark:border-white/[0.06] light:border-border backdrop-blur-[20px]"
      style={{
        backgroundColor: 'rgba(22,18,34,0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex gap-3 items-center">
        <Button
          size="icon"
          variant="ghost"
          className="size-8 lg:hidden text-muted-foreground/55 hover:bg-foreground/[0.04] hover:text-foreground transition-colors duration-200"
          onClick={() => setSelectedChat(null)}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="relative size-9 rounded-xl overflow-hidden shrink-0">
          <Avatar
            className="size-9 rounded-xl overflow-visible"
          >
            <AvatarImage src={image} alt={name} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold rounded-xl">
              {generateAvatarFallback(name)}
            </AvatarFallback>
            {!isGroup && <AvatarIndicator variant={onlineStatus} />}
          </Avatar>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[0.8125rem] font-semibold text-foreground leading-[1.2]">{name}</span>
          {!isGroup && (
            onlineStatus === "online" ? (
              <span
                className="text-[0.625rem] leading-[1.4]"
                style={{ color: 'rgba(52,211,153,0.7)' }}
              >
                Online
              </span>
            ) : (
              <span className="text-[0.625rem] text-muted-foreground/50 leading-[1.4]">
                {lastSeen ? `Visto por ultimo ${new Date(lastSeen).toLocaleString()}` : 'Offline'}
              </span>
            )
          )}
          {isGroup && (
            <span className="text-[0.625rem] text-muted-foreground/50 leading-[1.4]">
              {sala.tipo === 'geral' ? 'Sala Geral' : 'Grupo'}
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-1 items-center">
        <div className="hidden lg:flex lg:gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  aria-label="Chamada de Video"
                  variant="ghost"
                  className="size-8 text-muted-foreground/55 hover:bg-foreground/[0.04] hover:text-foreground transition-colors duration-200"
                  onClick={onVideoCall}
                >
                  <Video className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Chamada de Video</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  aria-label="Chamada de Audio"
                  variant="ghost"
                  className="size-8 text-muted-foreground/55 hover:bg-foreground/[0.04] hover:text-foreground transition-colors duration-200"
                  onClick={onAudioCall}
                >
                  <Phone className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Chamada de Audio</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <ChatUserDropdown chat={sala}>
          <Button
            size="icon"
            aria-label="Mais opcoes"
            variant="ghost"
            className="size-8 text-muted-foreground/55 hover:bg-foreground/[0.04] hover:text-foreground transition-colors duration-200"
          >
            <Ellipsis className="size-4" />
          </Button>
        </ChatUserDropdown>
      </div>
    </div>
  );
}
