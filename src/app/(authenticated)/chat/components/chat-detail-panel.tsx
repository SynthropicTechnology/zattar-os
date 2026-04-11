"use client";

import React from "react";
import { X, Mail, Phone, Calendar } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { generateAvatarFallback } from "@/lib/utils";
import useChatStore from "../hooks/use-chat-store";
import { UsuarioChat } from "../domain";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage, AvatarIndicator } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getSemanticBadgeVariant, type BadgeVisualVariant } from "@/lib/design-system";

/**
 * Maps online status to semantic text color classes.
 * Duplicated locally from user-detail-sheet.tsx to avoid cross-component deep imports.
 */
function getOnlineStatusColor(status: string): string {
  const variant = getSemanticBadgeVariant("online_status", status);

  const colorMap: Record<BadgeVisualVariant, string> = {
    success: "text-success",
    warning: "text-warning",
    neutral: "text-muted-foreground",
    destructive: "text-destructive",
    info: "text-info",
    default: "text-muted-foreground",
    secondary: "text-muted-foreground",
    outline: "text-muted-foreground",
    accent: "text-primary",
  };

  return colorMap[variant] || "text-muted-foreground";
}

interface ChatDetailPanelProps {
  user?: UsuarioChat;
}

export function ChatDetailPanel({ user }: ChatDetailPanelProps) {
  const { toggleProfileSheet } = useChatStore();

  if (!user) return null;

  const displayName = user.nomeExibicao || user.nomeCompleto;

  return (
    <div className="flex flex-col h-full w-full">
      {/* Panel header — "Detalhes" per mock */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] shrink-0">
        <span className="text-[0.75rem] font-semibold text-foreground">Detalhes</span>
        <Button
          size="icon"
          variant="ghost"
          className="size-7 text-muted-foreground/50 hover:bg-foreground/[0.04] hover:text-foreground"
          onClick={() => toggleProfileSheet(false)}
          aria-label="Fechar detalhes"
        >
          <X className="size-3.5" />
        </Button>
      </div>

      {/* Scrollable body */}
      <ScrollArea className="flex-1">
        {/* Profile section — 72px avatar centered per mock */}
        <div className="flex flex-col items-center gap-3 py-6 px-5">
          <Avatar className="size-[72px] rounded-2xl overflow-visible">
            <AvatarImage src={user.avatar} alt={displayName} className="rounded-2xl" />
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold rounded-2xl">
              {generateAvatarFallback(displayName)}
            </AvatarFallback>
            <AvatarIndicator
              variant={user.onlineStatus || "offline"}
              className="h-4 w-4 border-2"
            />
          </Avatar>
          <div className="text-center">
            <p className="text-[0.9rem] font-bold text-foreground">{displayName}</p>
            <p className={cn("text-[0.7rem]", getOnlineStatusColor(user.onlineStatus || "offline"))}>
              {user.onlineStatus === "online"
                ? "Online"
                : user.lastSeen
                  ? `Visto ${new Date(user.lastSeen).toLocaleString()}`
                  : "Offline"}
            </p>
          </div>
        </div>

        {/* Informacoes section — icon + label + value per mock */}
        <div className="px-5 py-3.5 border-t border-white/[0.06]">
          <h5 className="text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground/35 mb-3">
            Informacoes
          </h5>
          <div className="space-y-0">
            {/* Email */}
            <div className="flex items-center gap-2.5 py-2">
              <div className="size-7 rounded-md flex items-center justify-center bg-primary/[0.06] shrink-0">
                <Mail className="size-3 text-primary/50" />
              </div>
              <div>
                <p className="text-[0.6rem] text-muted-foreground/40">Email</p>
                <p className="text-[0.725rem] font-medium text-foreground">
                  {user.about || "—"}
                </p>
              </div>
            </div>
            {/* Phone */}
            {user.phone && (
              <div className="flex items-center gap-2.5 py-2">
                <div className="size-7 rounded-md flex items-center justify-center bg-primary/[0.06] shrink-0">
                  <Phone className="size-3 text-primary/50" />
                </div>
                <div>
                  <p className="text-[0.6rem] text-muted-foreground/40">Telefone</p>
                  <p className="text-[0.725rem] font-medium text-foreground">{user.phone}</p>
                </div>
              </div>
            )}
            {/* Country / Membro desde */}
            {user.country && (
              <div className="flex items-center gap-2.5 py-2">
                <div className="size-7 rounded-md flex items-center justify-center bg-primary/[0.06] shrink-0">
                  <Calendar className="size-3 text-primary/50" />
                </div>
                <div>
                  <p className="text-[0.6rem] text-muted-foreground/40">Pais</p>
                  <p className="text-[0.725rem] font-medium text-foreground">{user.country}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Media section — 3-column grid per mock */}
        {user.medias && user.medias.length > 0 && (
          <div className="px-5 py-3.5 border-t border-white/[0.06]">
            <h5 className="text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground/35 mb-3">
              Midia Compartilhada
            </h5>
            <div className="grid grid-cols-3 gap-1.5">
              {user.medias.map(
                (item, i) =>
                  item.type === "image" && (
                    <div key={i} className="aspect-square rounded-lg overflow-hidden bg-foreground/[0.04]">
                      <Image
                        src={item.url}
                        alt="media"
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    </div>
                  )
              )}
            </div>
          </div>
        )}

        {/* Website */}
        {user.website && (
          <div className="px-5 py-3.5 border-t border-white/[0.06]">
            <h5 className="text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground/35 mb-3">
              Website
            </h5>
            <a
              href={user.website}
              target="_blank"
              rel="noreferrer"
              className="text-[0.725rem] text-muted-foreground hover:text-primary hover:underline truncate block"
            >
              {user.website}
            </a>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
