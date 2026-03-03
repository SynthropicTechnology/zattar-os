"use client";

import { useState, useCallback, useMemo } from "react";
import { useMailActions } from "./use-mail-api";
import { useMailStore } from "../use-mail";
import type { MailMessagePreview } from "@/lib/mail/types";
import { toast } from "sonner";

export function useMailDisplay(mail: MailMessagePreview | null) {
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { deleteMessage, moveMessage, markUnread, starMessage, reply } =
    useMailActions();
  const { setSelectedMail } = useMailStore();

  const senderName = useMemo(
    () => (mail ? mail.from.name || mail.from.address : ""),
    [mail]
  );

  const senderInitials = useMemo(
    () =>
      senderName
        .split(" ")
        .map((chunk) => chunk[0])
        .filter(Boolean)
        .join("")
        .substring(0, 2)
        .toUpperCase(),
    [senderName]
  );

  const handleAction = useCallback(
    async (
      actionId: string,
      action: () => Promise<void>,
      successMsg: string,
      opts?: { closeAfter?: boolean }
    ) => {
      setActionLoading(actionId);
      try {
        await action();
        if (opts?.closeAfter !== false) {
          setSelectedMail(null);
        }
        toast.success(successMsg);
      } catch {
        toast.error("Erro ao executar ação");
      } finally {
        setActionLoading(null);
      }
    },
    [setSelectedMail]
  );

  const handleReply = useCallback(
    async (e: React.FormEvent, replyAll: boolean = false) => {
      e.preventDefault();
      if (!mail || !replyText.trim()) return;
      setIsSending(true);
      try {
        await reply(mail.uid, mail.folder, replyText, replyAll);
        setReplyText("");
        toast.success(replyAll ? "Resposta enviada a todos" : "Resposta enviada");
      } catch {
        toast.error("Erro ao enviar resposta");
      } finally {
        setIsSending(false);
      }
    },
    [mail, replyText, reply]
  );

  const actions = useMemo(() => {
    if (!mail) return null;
    return {
      archive: () =>
        handleAction("archive", () => moveMessage(mail.uid, mail.folder, "Archive"), "Arquivado"),
      junk: () =>
        handleAction("junk", () => moveMessage(mail.uid, mail.folder, "Junk"), "Movido para lixo eletrônico"),
      delete: () =>
        handleAction("delete", () => deleteMessage(mail.uid, mail.folder), "Excluído"),
      markUnread: () =>
        handleAction("markUnread", () => markUnread(mail.uid, mail.folder), "Marcado como não lido"),
      star: () =>
        handleAction("star", () => starMessage(mail.uid, mail.folder), "Marcado com estrela", {
          closeAfter: false,
        }),
    };
  }, [mail, handleAction, moveMessage, deleteMessage, markUnread, starMessage]);

  return {
    replyText,
    setReplyText,
    isSending,
    actionLoading,
    senderName,
    senderInitials,
    handleReply,
    handleAction,
    actions,
  };
}
