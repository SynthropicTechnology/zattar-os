import { create, StateCreator } from "zustand";
import type { ChatItem, MensagemComUsuario } from "../domain";

interface UseChatStore {
  selectedChat: ChatItem | null;
  mensagens: MensagemComUsuario[];
  salas: ChatItem[];
  showProfileSheet: boolean;

  // Actions
  setSelectedChat: (chat: ChatItem | null) => void;
  setMensagens: (mensagens: MensagemComUsuario[]) => void;
  adicionarMensagem: (mensagem: MensagemComUsuario) => void;
  atualizarMensagem: (id: number, updates: Partial<MensagemComUsuario>) => void;
  toggleProfileSheet: (value: boolean) => void;
  // Salas actions
  setSalas: (salas: ChatItem[]) => void;
  adicionarSala: (sala: ChatItem) => void;
  removerSala: (salaId: number) => void;
  atualizarSala: (salaId: number, updates: Partial<ChatItem>) => void;
}

const chatStore: StateCreator<UseChatStore> = (set) => ({
  selectedChat: null,
  mensagens: [],
  salas: [],
  showProfileSheet: false,

  setSelectedChat: (chat) => set(() => ({ selectedChat: chat })),

  setMensagens: (mensagens) => set(() => ({ mensagens })),

  adicionarMensagem: (mensagem) =>
    set((state) => {
      // Evitar duplicação: verificar se já existe pelo ID real
      // ou se existe uma mensagem temporária com mesmo conteúdo/usuário
      const existsById = state.mensagens.some((m) => m.id === mensagem.id);
      if (existsById) return state;

      // Se mensagem vem do Realtime, verificar se já temos uma versão temporária
      // (IDs temporários são negativos)
      const tempIndex = state.mensagens.findIndex(
        (m) => m.id < 0 &&
               m.conteudo === mensagem.conteudo &&
               m.usuarioId === mensagem.usuarioId &&
               m.salaId === mensagem.salaId
      );

      if (tempIndex !== -1) {
        // Substituir mensagem temporária pela real
        const updatedMensagens = [...state.mensagens];
        updatedMensagens[tempIndex] = mensagem;
        return { mensagens: updatedMensagens };
      }

      return { mensagens: [...state.mensagens, mensagem] };
    }),

  atualizarMensagem: (id, updates) =>
    set((state) => ({
      mensagens: state.mensagens.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg
      ),
    })),

  toggleProfileSheet: (value) => set({ showProfileSheet: value }),

  // Salas actions
  setSalas: (salas) => set(() => ({ salas })),

  adicionarSala: (sala) =>
    set((state) => ({
      salas: [sala, ...state.salas],
    })),

  removerSala: (salaId) =>
    set((state) => ({
      salas: state.salas.filter((s) => s.id !== salaId),
      // Se a sala removida estava selecionada, limpar seleção
      selectedChat: state.selectedChat?.id === salaId ? null : state.selectedChat,
    })),

  atualizarSala: (salaId, updates) =>
    set((state) => ({
      salas: state.salas.map((s) =>
        s.id === salaId ? { ...s, ...updates } : s
      ),
    })),
});

const useChatStore = create(chatStore);

export default useChatStore;