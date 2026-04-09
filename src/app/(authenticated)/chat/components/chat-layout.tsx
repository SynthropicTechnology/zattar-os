"use client";

import React, { useEffect, Suspense, lazy } from "react";
import { cn } from "@/lib/utils";
import useChatStore from "../hooks/use-chat-store";
import { ChatSidebarWrapper } from "./chat-sidebar-wrapper";
import { ChatItem } from "../domain";
import { useChatPresence } from "../hooks/use-chat-presence";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load ChatWindow to defer Dyte SDK loading until chat is selected
const ChatWindow = lazy(() =>
  import('./chat-window').then(m => ({ default: m.ChatWindow }))
);

interface ChatLayoutProps {
  salas: ChatItem[];
  currentUserId: number;
  currentUserName: string;
  initialSelectedChat?: ChatItem | null;
}

export function ChatLayout({ salas, currentUserId, currentUserName, initialSelectedChat }: ChatLayoutProps) {
  const { selectedChat, setSelectedChat, showProfileSheet } = useChatStore();

  // Ativar presenca do usuario no chat
  useChatPresence({ userId: currentUserId, enabled: true });

  useEffect(() => {
    if (initialSelectedChat && !selectedChat) {
      setSelectedChat(initialSelectedChat);
    }
  }, [initialSelectedChat, selectedChat, setSelectedChat]);

  return (
    <div className="flex h-[calc(100vh-2rem)] m-4 rounded-2xl border border-border overflow-hidden bg-(--surface-container-low)">
      {/* Sidebar column (LAYOUT-01, LAYOUT-02) */}
      <div
        className={cn(
          "h-full flex flex-col border-r border-white/[0.06] bg-(--surface-container-low)",
          "w-full md:w-[360px] md:min-w-[360px] shrink-0",
          selectedChat ? "hidden md:flex" : "flex"
        )}
      >
        <ChatSidebarWrapper salas={salas} currentUserId={currentUserId} />
      </div>

      {/* Chat area column (LAYOUT-04) */}
      <div
        className={cn(
          "h-full flex-1 min-w-0 flex flex-col relative bg-(--chat-thread-bg) overflow-hidden",
          !selectedChat ? "hidden md:flex" : "flex"
        )}
      >
        {/* Ambient glow - top right */}
        <div
          className="absolute top-0 right-0 w-[300px] h-[300px] pointer-events-none z-0"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 70%)' }}
        />
        {/* Ambient glow - bottom left */}
        <div
          className="absolute bottom-0 left-0 w-[250px] h-[250px] pointer-events-none z-0"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.02) 0%, transparent 70%)' }}
        />
        {/* Content at z-10 */}
        <div className="relative z-10 flex-1 flex flex-col">
          {selectedChat ? (
            <Suspense
              fallback={
                <div className="flex-1 flex flex-col">
                  <Skeleton className="h-16 w-full" />
                  <div className="flex-1 p-4 space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                  <Skeleton className="h-20 w-full" />
                </div>
              }
            >
              <ChatWindow currentUserId={currentUserId} currentUserName={currentUserName} />
            </Suspense>
          ) : null}
        </div>
      </div>

      {/* Detail panel placeholder (LAYOUT-03, D-07, D-09) */}
      {showProfileSheet && (
        <div className="hidden xl:flex w-[320px] shrink-0 border-l border-white/[0.06] bg-(--surface-container-low)">
          {/* Phase 4 content — placeholder only */}
        </div>
      )}
    </div>
  );
}
