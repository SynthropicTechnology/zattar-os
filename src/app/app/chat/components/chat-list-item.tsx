import { cn, generateAvatarFallback } from "@/lib/utils";
import { ChatItem } from "../domain";
import { Ellipsis } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ChatUserDropdown } from "./chat-list-item-dropdown";
import { MessageStatusIcon } from "./message-status-icon";
import { Avatar, AvatarFallback, AvatarImage, AvatarIndicator } from "@/components/ui/avatar";

interface ChatListItemProps {
  chat: ChatItem;
  active: boolean;
  onClick: () => void;
}

export function ChatListItem({ chat, active, onClick }: ChatListItemProps) {
  const unreadCount = chat.unreadCount || 0;
  const showStatus = false;

  return (
    <div
      className={cn(
        "group/item hover:bg-chat-sidebar-active relative flex min-w-0 cursor-pointer items-center gap-4 px-6 py-4 transition-colors",
        { "bg-chat-sidebar-active": active }
      )}
      onClick={onClick}>
      <Avatar className="overflow-visible md:size-10">
        <AvatarImage src={chat.image} alt={chat.name} />
        <AvatarIndicator variant={chat.usuario?.onlineStatus || 'offline'} />
        <AvatarFallback>{generateAvatarFallback(chat.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 grow">
        <div className="flex items-center justify-between">
          <span className="truncate text-sm font-medium">{chat.name}</span>
          <span className="text-muted-foreground flex-none text-xs">
            {chat.date ? new Date(chat.date).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {showStatus && <MessageStatusIcon status="read" />}
          {chat.lastMessage && (
            <span className="text-muted-foreground truncate text-start text-sm">
              {chat.lastMessage}
            </span>
          )}
          {unreadCount > 0 && (
            <div className="ms-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500 text-sm text-white">
              {unreadCount}
            </div>
          )}
        </div>
      </div>
      <div
        className="absolute end-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <ChatUserDropdown chat={chat}>
          <Button size="icon" variant="ghost" className="rounded-full h-8 w-8">
            <Ellipsis className="h-4 w-4" />
          </Button>
        </ChatUserDropdown>
      </div>
    </div>
  );
}
