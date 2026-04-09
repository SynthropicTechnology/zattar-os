"use client";

import React, { useEffect, useState, useMemo } from "react";
import { ChatItem, TipoSalaChat } from "../domain";
import { ChatSidebar } from "./chat-sidebar";
import useChatStore from "../hooks/use-chat-store";
import type { TabPillOption } from "@/components/dashboard/tab-pills";

interface ChatSidebarWrapperProps {
  salas: ChatItem[];
  currentUserId: number;
}

export function ChatSidebarWrapper({ salas: salasIniciais, currentUserId }: ChatSidebarWrapperProps) {
  const { selectedChat, setSelectedChat, salas, setSalas } = useChatStore();

  // Tab + search state
  const [activeTab, setActiveTab] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [novoChatOpen, setNovoChatOpen] = useState(false);

  // Inicializar salas no store quando o componente montar
  useEffect(() => {
    setSalas(salasIniciais);
  }, [salasIniciais, setSalas]);

  const handleSelectSala = (sala: ChatItem) => {
    setSelectedChat(sala);
  };

  // Usar salas do store (reativas) ou as iniciais se o store ainda nao foi populado
  const salasParaExibir = salas.length > 0 ? salas : salasIniciais;

  // Tab definitions with reactive counters (per D-01, D-02, D-03)
  const tabs: TabPillOption[] = useMemo(() => {
    const base = searchTerm
      ? salasParaExibir.filter(s => (s.name || s.nome || '').toLowerCase().includes(searchTerm.toLowerCase()))
      : salasParaExibir;
    return [
      { id: 'todas', label: 'Todas', count: base.length },
      { id: 'privadas', label: 'Privadas', count: base.filter(s => s.tipo === TipoSalaChat.Privado).length },
      { id: 'grupos', label: 'Grupos', count: base.filter(s => s.tipo === TipoSalaChat.Grupo).length },
      { id: 'processos', label: 'Processos', count: base.filter(s => s.tipo === TipoSalaChat.Documento).length },
    ];
  }, [salasParaExibir, searchTerm]);

  // Filtering logic (per D-01, D-03)
  const filteredSalas = useMemo(() => {
    let result = salasParaExibir;
    // Search filter
    if (searchTerm) {
      result = result.filter(s =>
        (s.name || s.nome || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    // Tab filter
    if (activeTab !== 'todas') {
      const tipoMap: Record<string, TipoSalaChat> = {
        privadas: TipoSalaChat.Privado,
        grupos: TipoSalaChat.Grupo,
        processos: TipoSalaChat.Documento,
      };
      result = result.filter(s => s.tipo === tipoMap[activeTab]);
    }
    return result;
  }, [salasParaExibir, activeTab, searchTerm]);

  // Section grouping (per D-04, D-05, D-06)
  const { fixadas, recentes } = useMemo(() => {
    const sorted = [...filteredSalas].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA; // Most recent first
    });
    return {
      fixadas: sorted.filter(s => s.fixada),
      recentes: sorted.filter(s => !s.fixada),
    };
  }, [filteredSalas]);

  return (
    <ChatSidebar
      fixadas={fixadas}
      recentes={recentes}
      salaAtiva={selectedChat}
      onSelecionarSala={handleSelectSala}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      novoChatOpen={novoChatOpen}
      onNovoChatOpenChange={setNovoChatOpen}
    />
  );
}
