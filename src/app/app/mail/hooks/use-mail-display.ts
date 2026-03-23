"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useMailActions } from "./use-mail-api";
import { useMailStore } from "../use-mail";
import type { MailMessagePreview } from "@/lib/mail/types";
import type { MailEditorRef } from "../components/mail-editor";
import {
  getMailParticipantLabel,
  getMailParticipantLine,
  getMailPrimaryName,
} from "../lib/display";
import { toast } from "sonner";

type ReplyMode = "reply" | "reply-all" | null;

export function useMailDisplay(mail: MailMessagePreview | null) {
  const [isSending, setIsSending] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [replyMode, setReplyMode] = useState<ReplyMode>(null);
  const wasAutoExpandedRef = useRef(false);
  const { deleteMessage, moveMessage, markUnread, starMessage, reply } =
    useMailActions();
  const { setSelectedMail, isMailExpanded, toggleMailExpanded } = useMailStore();
  const editorRef = useRef<MailEditorRef | null>(null);

  // Reset reply mode when the selected mail changes
  useEffect(() => {
    setReplyMode(null);
    if (wasAutoExpandedRef.current) {
      toggleMailExpanded();
      wasAutoExpandedRef.current = false;
    }
  }, [mail?.uid, toggleMailExpanded]);

  const participantName = useMemo(() => (mail ? getMailPrimaryName(mail) : ""), [mail]);

  const participantLabel = useMemo(
    () => (mail ? getMailParticipantLabel(mail) : "De"),
    [mail]
  );

  const participantLine = useMemo(
    () => (mail ? getMailParticipantLine(mail) : ""),
    [mail]
  );

  const participantInitials = useMemo(
    () =>
      participantName
        .split(" ")
        .map((chunk) => chunk[0])
        .filter(Boolean)
        .join("")
        .substring(0, 2)
        .toUpperCase(),
    [participantName]
  );

  const startReply = useCallback(
    (mode: "reply" | "reply-all") => {
      setReplyMode(mode);
      if (!isMailExpanded) {
        toggleMailExpanded();
        wasAutoExpandedRef.current = true;
      }
    },
    [isMailExpanded, toggleMailExpanded]
  );

  const cancelReply = useCallback(() => {
    setReplyMode(null);
    editorRef.current?.reset();
    if (wasAutoExpandedRef.current) {
      toggleMailExpanded();
      wasAutoExpandedRef.current = false;
    }
  }, [toggleMailExpanded]);

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
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!mail || !replyMode) return;

      const editor = editorRef.current;
      if (!editor || editor.isEmpty()) return;

      const text = editor.getText();
      const isReplyAll = replyMode === "reply-all";

      setIsSending(true);
      try {
        await reply(mail.uid, mail.folder, text, isReplyAll);
        editor.reset();
        toast.success(
          isReplyAll ? "Resposta enviada a todos" : "Resposta enviada"
        );
        // Exit reply mode after successful send
        setReplyMode(null);
        if (wasAutoExpandedRef.current) {
          toggleMailExpanded();
          wasAutoExpandedRef.current = false;
        }
      } catch {
        toast.error("Erro ao enviar resposta");
      } finally {
        setIsSending(false);
      }
    },
    [mail, replyMode, reply, toggleMailExpanded]
  );

  const actions = useMemo(() => {
    if (!mail) return null;
    return {
      archive: () =>
        handleAction(
          "archive",
          () => moveMessage(mail.uid, mail.folder, "Archive"),
          "Arquivado"
        ),
      junk: () =>
        handleAction(
          "junk",
          () => moveMessage(mail.uid, mail.folder, "Junk"),
          "Movido para lixo eletrônico"
        ),
      delete: () =>
        handleAction(
          "delete",
          () => deleteMessage(mail.uid, mail.folder),
          "Excluído"
        ),
      markUnread: () =>
        handleAction(
          "markUnread",
          () => markUnread(mail.uid, mail.folder),
          "Marcado como não lido"
        ),
      star: () =>
        handleAction(
          "star",
          () => starMessage(mail.uid, mail.folder),
          "Marcado com estrela",
          { closeAfter: false }
        ),
    };
  }, [mail, handleAction, moveMessage, deleteMessage, markUnread, starMessage]);

  return {
    editorRef,
    isSending,
    actionLoading,
    participantName,
    participantInitials,
    participantLabel,
    participantLine,
    replyMode,
    startReply,
    cancelReply,
    handleReply,
    handleAction,
    actions,
    isMailExpanded,
    toggleMailExpanded,
  };
}
