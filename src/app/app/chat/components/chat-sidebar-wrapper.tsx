"use client";

import React, { useEffect } from "react";
import { ChatItem } from "../domain";
import { ChatSidebar } from "./chat-sidebar";
import useChatStore from "./useChatStore";

interface ChatSidebarWrapperProps {
  salas: ChatItem[];
  currentUserId: number;
}

export function ChatSidebarWrapper({ salas: salasIniciais, currentUserId }: ChatSidebarWrapperProps) {
  const { selectedChat, setSelectedChat, salas, setSalas } = useChatStore();

  // Inicializar salas no store quando o componente montar
  useEffect(() => {
    setSalas(salasIniciais);
  }, [salasIniciais, setSalas]);

  const handleSelectSala = (sala: ChatItem) => {
    setSelectedChat(sala);
  };

  // Usar salas do store (reativas) ou as iniciais se o store ainda não foi populado
  const salasParaExibir = salas.length > 0 ? salas : salasIniciais;

  return (
    <ChatSidebar
      salas={salasParaExibir}
      salaAtiva={selectedChat}
      onSelecionarSala={handleSelectSala}
      currentUserId={currentUserId}
    />
  );
}
