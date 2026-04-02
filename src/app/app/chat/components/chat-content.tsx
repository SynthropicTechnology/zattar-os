"use client";

import { useEffect, useRef } from "react";
import { ChatItem, MensagemComUsuario } from "../domain";
import { ChatBubble } from "./chat-bubbles";
import Image from "next/image";

interface ChatContentProps {
  mensagens: MensagemComUsuario[];
  salaAtiva: ChatItem | null;
}

export function ChatContent({ mensagens, salaAtiva }: ChatContentProps) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensagens]);

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
    <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 bg-chat-thread">
      <div className="flex flex-col items-start space-y-4 py-8 max-w-full">
        {mensagens.map((msg) => (
          <ChatBubble 
            key={msg.id} 
            message={msg} 
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}