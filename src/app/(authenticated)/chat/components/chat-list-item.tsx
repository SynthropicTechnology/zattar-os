import { cn, generateAvatarFallback } from "@/lib/utils";
import { ChatItem } from "../domain";
import { Ellipsis } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ChatUserDropdown } from "./chat-list-item-dropdown";

interface ChatListItemProps {
  chat: ChatItem;
  active: boolean;
  onClick: () => void;
}

export function ChatListItem({ chat, active, onClick }: ChatListItemProps) {
  const unreadCount = chat.unreadCount || 0;

  return (
    <div
      className={cn(
        "group/item flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200",
        "border border-transparent relative",
        active
          ? "bg-(--chat-sidebar-active) border-primary/[0.08]"
          : "hover:bg-foreground/[0.03]"
      )}
      onClick={onClick}
    >
      {/* Avatar 40px rounded-xl (SIDE-05) */}
      <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0">
        {chat.image ? (
          <img src={chat.image} alt={chat.name || chat.nome} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/12 text-primary text-xs font-semibold">
            {generateAvatarFallback(chat.name || chat.nome)}
          </div>
        )}
        {/* Online indicator dot */}
        <div className={cn(
          "absolute -bottom-px -right-px w-2.5 h-2.5 rounded-full border-2 border-(--surface-container-low) z-10",
          chat.usuario?.onlineStatus === 'online' ? "bg-success" : "bg-muted-foreground/30"
        )} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[0.8rem] font-semibold text-foreground truncate">
            {chat.name || chat.nome}
          </span>
          <span className="text-[0.6rem] text-muted-foreground/40 tabular-nums shrink-0">
            {chat.date ? new Date(chat.date).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-1">
          <span className="text-[0.7rem] text-muted-foreground/50 truncate flex-1">
            {chat.lastMessage}
          </span>
          {unreadCount > 0 && (
            <span className="min-w-[18px] h-[18px] rounded-full bg-primary text-white text-[0.6rem] font-semibold flex items-center justify-center px-1 shrink-0">
              {unreadCount}
            </span>
          )}
        </div>
      </div>

      {/* Hover dropdown (keep existing) */}
      <div
        className="absolute end-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <ChatUserDropdown chat={chat}>
          <Button size="icon" aria-label="Mais opcoes" variant="ghost" className="rounded-full h-8 w-8">
            <Ellipsis className="h-4 w-4" />
          </Button>
        </ChatUserDropdown>
      </div>
    </div>
  );
}
