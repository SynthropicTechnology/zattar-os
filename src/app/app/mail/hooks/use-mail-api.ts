"use client";

import { useCallback, useEffect, useRef } from "react";
import { useMailStore } from "../use-mail";

/** Adiciona accountId como query param se disponível. */
function withAccountId(url: string, accountId: number | null): string {
  if (!accountId) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}accountId=${accountId}`;
}

export function useMailFolders() {
  const { setFolders, setError, setServiceUnavailable, setAccounts, setSelectedAccountId, selectedAccountId } =
    useMailStore();
  const fetched = useRef(false);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/mail/credentials");
      if (!res.ok) return;
      const data = await res.json();
      if (data.configured && data.accounts?.length > 0) {
        setAccounts(
          data.accounts.map((acc: { id: number; nome_conta: string; imap_user: string; imap_host: string; active: boolean }) => ({
            id: acc.id,
            nome_conta: acc.nome_conta,
            email: acc.imap_user,
            imapHost: acc.imap_host,
            active: acc.active,
          }))
        );
        // Seleciona a primeira conta se nenhuma estiver selecionada
        if (!selectedAccountId) {
          setSelectedAccountId(data.accounts[0].id);
        }
      }
    } catch {
      // Silent
    }
  }, [setAccounts, setSelectedAccountId, selectedAccountId]);

  const fetchFolders = useCallback(async () => {
    try {
      const res = await fetch(withAccountId("/api/mail/folders", selectedAccountId));
      if (res.status === 503 || res.status === 422) {
        setServiceUnavailable(true);
        return;
      }
      if (!res.ok) throw new Error("Erro ao carregar pastas");
      const data = await res.json();
      setServiceUnavailable(false);
      setFolders(data.folders);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar pastas");
    }
  }, [selectedAccountId, setFolders, setError, setServiceUnavailable]);

  useEffect(() => {
    if (!fetched.current) {
      fetched.current = true;
      fetchAccounts();
    }
  }, [fetchAccounts]);

  // Recarrega pastas quando a conta selecionada muda
  useEffect(() => {
    if (selectedAccountId) {
      fetchFolders();
    }
  }, [selectedAccountId]); // eslint-disable-line react-hooks/exhaustive-deps

  return { refetchFolders: fetchFolders, refetchAccounts: fetchAccounts };
}

export function useMailMessages() {
  const {
    selectedFolder,
    selectedAccountId,
    setMessages,
    setTotalMessages,
    setHasMore,
    setCurrentPage,
    setIsLoading,
    setError,
    setServiceUnavailable,
  } = useMailStore();

  const fetchMessages = useCallback(
    async (folder?: string, page: number = 1) => {
      const targetFolder = folder ?? selectedFolder;
      setIsLoading(true);
      setError(null);
      try {
        const url = withAccountId(
          `/api/mail/messages?folder=${encodeURIComponent(targetFolder)}&page=${page}&limit=50`,
          selectedAccountId
        );
        const res = await fetch(url);
        if (res.status === 503 || res.status === 422) {
          setServiceUnavailable(true);
          return;
        }
        if (!res.ok) throw new Error("Erro ao carregar mensagens");
        const data = await res.json();
        setServiceUnavailable(false);
        setMessages(data.data);
        setTotalMessages(data.total);
        setHasMore(data.hasMore);
        setCurrentPage(1);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar mensagens");
      } finally {
        setIsLoading(false);
      }
    },
    [selectedFolder, selectedAccountId, setMessages, setTotalMessages, setHasMore, setCurrentPage, setIsLoading, setError, setServiceUnavailable]
  );

  useEffect(() => {
    if (selectedAccountId) {
      fetchMessages();
    }
  }, [selectedFolder, selectedAccountId]); // eslint-disable-line react-hooks/exhaustive-deps

  return { refetchMessages: fetchMessages };
}

export function useMailActions() {
  const {
    selectedFolder,
    selectedAccountId,
    setMessages,
    setTotalMessages,
    setHasMore,
    appendMessages,
    currentPage,
    setCurrentPage,
    setIsLoadingMore,
    setFullMessage,
    clearSelectedUids,
  } = useMailStore();

  const refreshMessages = useCallback(async () => {
    try {
      const url = withAccountId(
        `/api/mail/messages?folder=${encodeURIComponent(selectedFolder)}&page=1&limit=50`,
        selectedAccountId
      );
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.data);
      setTotalMessages(data.total);
      setHasMore(data.hasMore);
      setCurrentPage(1);
    } catch {
      // Silent refresh failure
    }
  }, [selectedFolder, selectedAccountId, setMessages, setTotalMessages, setHasMore, setCurrentPage]);

  const loadMoreMessages = useCallback(async () => {
    const nextPage = currentPage + 1;
    setIsLoadingMore(true);
    try {
      const url = withAccountId(
        `/api/mail/messages?folder=${encodeURIComponent(selectedFolder)}&page=${nextPage}&limit=50`,
        selectedAccountId
      );
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      appendMessages(data.data);
      setTotalMessages(data.total);
      setHasMore(data.hasMore);
      setCurrentPage(nextPage);
    } catch {
      // Silent
    } finally {
      setIsLoadingMore(false);
    }
  }, [selectedFolder, selectedAccountId, currentPage, appendMessages, setTotalMessages, setHasMore, setCurrentPage, setIsLoadingMore]);

  const fetchMessage = useCallback(
    async (uid: number, folder: string) => {
      try {
        const url = withAccountId(
          `/api/mail/messages/${uid}?folder=${encodeURIComponent(folder)}`,
          selectedAccountId
        );
        const res = await fetch(url);
        if (!res.ok) throw new Error("Erro ao carregar mensagem");
        const data = await res.json();
        setFullMessage(data);
        return data;
      } catch {
        return null;
      }
    },
    [selectedAccountId, setFullMessage]
  );

  const deleteMessage = useCallback(
    async (uid: number, folder: string) => {
      const url = withAccountId(
        `/api/mail/messages/${uid}?folder=${encodeURIComponent(folder)}`,
        selectedAccountId
      );
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao deletar mensagem");
      await refreshMessages();
    },
    [selectedAccountId, refreshMessages]
  );

  const moveMessage = useCallback(
    async (uid: number, fromFolder: string, toFolder: string) => {
      const url = withAccountId(`/api/mail/messages/${uid}/move`, selectedAccountId);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromFolder, toFolder }),
      });
      if (!res.ok) throw new Error("Erro ao mover mensagem");
      await refreshMessages();
    },
    [selectedAccountId, refreshMessages]
  );

  const markRead = useCallback(
    async (uid: number, folder: string) => {
      try {
        const url = withAccountId(`/api/mail/messages/${uid}/flags`, selectedAccountId);
        await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folder, add: ["\\Seen"] }),
        });
        await refreshMessages();
      } catch {
        // Silent
      }
    },
    [selectedAccountId, refreshMessages]
  );

  const markUnread = useCallback(
    async (uid: number, folder: string) => {
      const url = withAccountId(`/api/mail/messages/${uid}/flags`, selectedAccountId);
      await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder, remove: ["\\Seen"] }),
      });
      await refreshMessages();
    },
    [selectedAccountId, refreshMessages]
  );

  const starMessage = useCallback(
    async (uid: number, folder: string) => {
      const url = withAccountId(`/api/mail/messages/${uid}/flags`, selectedAccountId);
      await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder, add: ["\\Flagged"] }),
      });
      await refreshMessages();
    },
    [selectedAccountId, refreshMessages]
  );

  const reply = useCallback(
    async (uid: number, folder: string, text: string, replyAll: boolean = false, html?: string) => {
      const url = withAccountId("/api/mail/messages/reply", selectedAccountId);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, folder, text, replyAll, html }),
      });
      if (!res.ok) throw new Error("Erro ao enviar resposta");
    },
    [selectedAccountId]
  );

  const forwardMessage = useCallback(
    async (uid: number, folder: string, to: string[], text: string, html?: string) => {
      const url = withAccountId("/api/mail/messages/forward", selectedAccountId);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, folder, to, text, html }),
      });
      if (!res.ok) throw new Error("Erro ao encaminhar mensagem");
    },
    [selectedAccountId]
  );

  const sendNewEmail = useCallback(
    async (to: string[], subject: string, text: string, html?: string, cc?: string[], bcc?: string[]) => {
      const url = withAccountId("/api/mail/messages/send", selectedAccountId);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, text, html, cc, bcc }),
      });
      if (!res.ok) throw new Error("Erro ao enviar e-mail");
    },
    [selectedAccountId]
  );

  const searchMessages = useCallback(
    async (query: string, folder?: string) => {
      const targetFolder = folder ?? selectedFolder;
      const url = withAccountId(
        `/api/mail/messages/search?q=${encodeURIComponent(query)}&folder=${encodeURIComponent(targetFolder)}`,
        selectedAccountId
      );
      const res = await fetch(url);
      if (!res.ok) throw new Error("Erro na busca");
      const data = await res.json();
      setMessages(data.messages);
      setTotalMessages(data.total);
      setHasMore(false);
    },
    [selectedFolder, selectedAccountId, setMessages, setTotalMessages, setHasMore]
  );

  const bulkDelete = useCallback(
    async (uids: number[], folder: string) => {
      await Promise.all(uids.map((uid) => {
        const url = withAccountId(
          `/api/mail/messages/${uid}?folder=${encodeURIComponent(folder)}`,
          selectedAccountId
        );
        return fetch(url, { method: "DELETE" });
      }));
      clearSelectedUids();
      await refreshMessages();
    },
    [selectedAccountId, clearSelectedUids, refreshMessages]
  );

  const bulkMove = useCallback(
    async (uids: number[], fromFolder: string, toFolder: string) => {
      await Promise.all(uids.map((uid) => {
        const url = withAccountId(`/api/mail/messages/${uid}/move`, selectedAccountId);
        return fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fromFolder, toFolder }),
        });
      }));
      clearSelectedUids();
      await refreshMessages();
    },
    [selectedAccountId, clearSelectedUids, refreshMessages]
  );

  const bulkMarkRead = useCallback(
    async (uids: number[], folder: string) => {
      await Promise.all(uids.map((uid) => {
        const url = withAccountId(`/api/mail/messages/${uid}/flags`, selectedAccountId);
        return fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folder, add: ["\\Seen"] }),
        });
      }));
      clearSelectedUids();
      await refreshMessages();
    },
    [selectedAccountId, clearSelectedUids, refreshMessages]
  );

  const bulkMarkUnread = useCallback(
    async (uids: number[], folder: string) => {
      await Promise.all(uids.map((uid) => {
        const url = withAccountId(`/api/mail/messages/${uid}/flags`, selectedAccountId);
        return fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folder, remove: ["\\Seen"] }),
        });
      }));
      clearSelectedUids();
      await refreshMessages();
    },
    [selectedAccountId, clearSelectedUids, refreshMessages]
  );

  return {
    deleteMessage,
    moveMessage,
    markRead,
    markUnread,
    starMessage,
    reply,
    forwardMessage,
    sendNewEmail,
    searchMessages,
    refreshMessages,
    loadMoreMessages,
    fetchMessage,
    bulkDelete,
    bulkMove,
    bulkMarkRead,
    bulkMarkUnread,
  };
}
