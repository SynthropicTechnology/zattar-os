"use client";

import React, { useEffect } from "react";
import { Search } from "lucide-react";
import { ChatItem } from "../domain";

import { Input } from "@/components/ui/input";
import { ChatListItem } from "./chat-list-item";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader
} from "@/components/ui/card";
import { ActionDropdown } from "./action-dropdown";

interface ChatSidebarProps {
  salas: ChatItem[];
  salaAtiva: ChatItem | null;
  onSelecionarSala: (sala: ChatItem) => void;
  currentUserId?: number;
}

export function ChatSidebar({ salas, salaAtiva, onSelecionarSala }: ChatSidebarProps) {
  const [filteredChats, setFilteredChats] = React.useState<ChatItem[]>(salas);

  useEffect(() => {
    setFilteredChats(salas);
  }, [salas]);

  const changeHandle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value.trim().toLowerCase();

    if (!searchTerm) {
      setFilteredChats(salas);
      return;
    }

    const filteredItems = salas.filter((chat) => {
      const name = chat.name || chat.nome || "";
      return name.toLowerCase().includes(searchTerm);
    });
    setFilteredChats(filteredItems);
  };

  return (
    <Card className="w-full pb-0 lg:w-96 flex flex-col h-full border-0 border-r rounded-none">
      <CardHeader>
        <CardDescription className="relative flex w-full items-center gap-2">
          <Search className="text-muted-foreground absolute start-4 size-4 pointer-events-none" />
          <Input
            type="text"
            className="ps-10 flex-1"
            placeholder="Buscar conversas..."
            onChange={changeHandle}
          />
          <div className="shrink-0">
            <ActionDropdown variant="default" />
          </div>
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto p-0">
        <div className="block min-w-0 divide-y">
          {filteredChats.length ? (
            filteredChats.map((chat) => (
              <ChatListItem
                chat={chat}
                key={chat.id}
                active={salaAtiva?.id === chat.id}
                onClick={() => onSelecionarSala(chat)}
              />
            ))
          ) : (
            <div className="text-muted-foreground mt-4 text-center text-sm">Nenhuma conversa encontrada</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}