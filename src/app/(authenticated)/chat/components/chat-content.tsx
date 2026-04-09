"use client";

import { useEffect, useMemo, useRef } from "react";
import { ChatItem, MensagemComUsuario, TipoSalaChat } from "../domain";
import { DateSeparator } from "./date-separator";
import { MessageGroup } from "./message-group";
import Image from "next/image";

interface ChatContentProps {
  mensagens: MensagemComUsuario[];
  salaAtiva: ChatItem | null;
}

// --- Grouping types ---

type DateSeparatorItem = {
  type: "date-separator";
  date: string; // ISO date string
};

type MessageGroupItem = {
  type: "message-group";
  messages: MensagemComUsuario[];
  isOwn: boolean;
};

type GroupedItem = DateSeparatorItem | MessageGroupItem;

// --- Grouping logic ---

const FIVE_MINUTES_MS = 5 * 60 * 1000;

function isSameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function groupMessages(mensagens: MensagemComUsuario[]): GroupedItem[] {
  const result: GroupedItem[] = [];

  if (mensagens.length === 0) return result;

  let currentGroup: MensagemComUsuario[] = [];
  let lastMessage: MensagemComUsuario | null = null;

  for (const msg of mensagens) {
    // Insert date separator when day changes
    if (lastMessage && !isSameDay(lastMessage.createdAt, msg.createdAt)) {
      // Flush current group
      if (currentGroup.length > 0) {
        result.push({
          type: "message-group",
          messages: currentGroup,
          isOwn: currentGroup[0].ownMessage === true,
        });
        currentGroup = [];
      }
      result.push({
        type: "date-separator",
        date: msg.createdAt,
      });
    }

    // Check if this message continues the current group
    const sameUser = lastMessage && lastMessage.usuarioId === msg.usuarioId;
    const withinTimeLimit =
      lastMessage &&
      new Date(msg.createdAt).getTime() - new Date(lastMessage.createdAt).getTime() <
        FIVE_MINUTES_MS;

    if (currentGroup.length === 0 || (sameUser && withinTimeLimit)) {
      currentGroup.push(msg);
    } else {
      // Flush and start new group
      if (currentGroup.length > 0) {
        result.push({
          type: "message-group",
          messages: currentGroup,
          isOwn: currentGroup[0].ownMessage === true,
        });
      }
      currentGroup = [msg];
    }

    lastMessage = msg;
  }

  // Flush last group
  if (currentGroup.length > 0) {
    result.push({
      type: "message-group",
      messages: currentGroup,
      isOwn: currentGroup[0].ownMessage === true,
    });
  }

  return result;
}

export function ChatContent({ mensagens, salaAtiva }: ChatContentProps) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [mensagens]);

  const grouped = useMemo(() => groupMessages(mensagens), [mensagens]);

  const isGroupChat =
    salaAtiva?.tipo === TipoSalaChat.Grupo ||
    salaAtiva?.tipo === TipoSalaChat.Geral;

  if (!salaAtiva) {
    return (
      <figure className="hidden h-full items-center justify-center text-center lg:flex flex-1">
        <Image
          width={200}
          height={200}
          className="block max-w-sm dark:hidden"
          src={`/not-selected-chat.svg`}
          alt="No chat selected"
          unoptimized
        />
        <Image
          width={200}
          height={200}
          className="hidden max-w-sm dark:block"
          src={`/not-selected-chat-light.svg`}
          alt="No chat selected"
        />
      </figure>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 lg:px-6 bg-(--chat-thread-bg)">
      <div className="flex flex-col items-start space-y-1 pt-8 pb-4 max-w-full">
        {grouped.map((item, index) => {
          if (item.type === "date-separator") {
            return <DateSeparator key={`sep-${item.date}-${index}`} date={item.date} />;
          }
          return (
            <MessageGroup
              key={`group-${item.messages[0].id}`}
              messages={item.messages}
              isOwn={item.isOwn}
              isGroupChat={isGroupChat}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
