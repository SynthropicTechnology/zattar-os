"use client";

import React, { useEffect, Suspense, lazy } from "react";
import { cn } from "@/lib/utils";
import useChatStore from "./useChatStore";
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
  const { selectedChat, setSelectedChat } = useChatStore();

  // Ativar presença do usuário no chat
  useChatPresence({ userId: currentUserId, enabled: true });

  useEffect(() => {
    // Only set if not set (or force? usually init only)
    // If deep linking is important, we force it.
    if (initialSelectedChat && !selectedChat) {
      setSelectedChat(initialSelectedChat);
    }
  }, [initialSelectedChat, selectedChat, setSelectedChat]);

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-background border rounded-lg shadow-sm">
      {/* Sidebar - Hidden on mobile if chat selected */}
      <div
        className={cn(
          "h-full w-full md:w-80 lg:w-96 shrink-0 transition-all duration-300",
          selectedChat ? "hidden md:block" : "block"
        )}
      >
        <ChatSidebarWrapper salas={salas} currentUserId={currentUserId} />
      </div>

      {/* Window - Hidden on mobile if no chat selected */}
      <div
        className={cn(
          "h-full flex-1 min-w-0 bg-background transition-all duration-300",
          !selectedChat ? "hidden md:flex" : "flex"
        )}
      >
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
  );
}
