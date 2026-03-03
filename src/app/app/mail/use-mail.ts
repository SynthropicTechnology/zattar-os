import { create } from "zustand";
import type { MailMessagePreview, MailFolder, MailMessage } from "@/lib/mail/types";

export type MailAccount = {
  id: number;
  nome_conta: string;
  email: string;
  imapHost: string;
  active: boolean;
};

type MailStore = {
  accounts: MailAccount[];
  setAccounts: (accounts: MailAccount[]) => void;
  selectedAccountId: number | null;
  setSelectedAccountId: (id: number | null) => void;
  selectedMail: MailMessagePreview | null;
  setSelectedMail: (mail: MailMessagePreview | null) => void;
  fullMessage: MailMessage | null;
  setFullMessage: (msg: MailMessage | null) => void;
  selectedFolder: string;
  setSelectedFolder: (folder: string) => void;
  messages: MailMessagePreview[];
  setMessages: (messages: MailMessagePreview[]) => void;
  appendMessages: (messages: MailMessagePreview[]) => void;
  folders: MailFolder[];
  setFolders: (folders: MailFolder[]) => void;
  totalMessages: number;
  setTotalMessages: (total: number) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  hasMore: boolean;
  setHasMore: (hasMore: boolean) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isLoadingMore: boolean;
  setIsLoadingMore: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  serviceUnavailable: boolean;
  setServiceUnavailable: (unavailable: boolean) => void;
};

export const useMailStore = create<MailStore>((set) => ({
  accounts: [],
  setAccounts: (accounts) => set({ accounts }),
  selectedAccountId: null,
  setSelectedAccountId: (id) =>
    set({
      selectedAccountId: id,
      selectedMail: null,
      fullMessage: null,
      messages: [],
      folders: [],
      currentPage: 1,
      selectedFolder: "INBOX",
    }),
  selectedMail: null,
  setSelectedMail: (mail) => set({ selectedMail: mail }),
  fullMessage: null,
  setFullMessage: (msg) => set({ fullMessage: msg }),
  selectedFolder: "INBOX",
  setSelectedFolder: (folder) =>
    set({ selectedFolder: folder, selectedMail: null, fullMessage: null, currentPage: 1 }),
  messages: [],
  setMessages: (messages) => set({ messages }),
  appendMessages: (newMessages) =>
    set((state) => ({ messages: [...state.messages, ...newMessages] })),
  folders: [],
  setFolders: (folders) => set({ folders }),
  totalMessages: 0,
  setTotalMessages: (total) => set({ totalMessages: total }),
  currentPage: 1,
  setCurrentPage: (page) => set({ currentPage: page }),
  hasMore: false,
  setHasMore: (hasMore) => set({ hasMore }),
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  isLoadingMore: false,
  setIsLoadingMore: (loading) => set({ isLoadingMore: loading }),
  error: null,
  setError: (error) => set({ error }),
  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),
  serviceUnavailable: false,
  setServiceUnavailable: (unavailable) => set({ serviceUnavailable: unavailable }),
}));
