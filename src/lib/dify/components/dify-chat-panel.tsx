'use client';

import React, { useEffect, useRef } from 'react';
import { useDifyChat, Message } from '../hooks/use-dify-chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Bot, User, StopCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface DifyChatPanelProps {
    conversationId?: string;
    initialMessages?: Message[];
    user?: string;
    onFinish?: (message: Message) => void;
    className?: string;
    assistantName?: string;
    assistantAvatar?: string;
}

export function DifyChatPanel({
    conversationId,
    initialMessages,
    user,
    onFinish,
    className,
    assistantName = 'Assistente',
    assistantAvatar,
}: DifyChatPanelProps) {
    const { messages, input, setInput, sendMessage, isLoading, stop } = useDifyChat({
        conversationId,
        initialMessages,
        user,
        onFinish,
    });

    const _scrollRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isLoading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        await sendMessage(input);
    };

    return (
        <div className={cn("flex flex-col h-full border rounded-lg bg-background", className)}>
            <div className="flex items-center p-4 border-b">
                <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={assistantAvatar} />
                    <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                </Avatar>
                <div>
                    <h3 className="text-sm font-medium">{assistantName}</h3>
                    {isLoading && <span className="text-xs text-muted-foreground animate-pulse">Digitando...</span>}
                </div>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.length === 0 && (
                        <div className="flex h-full items-center justify-center text-muted-foreground text-sm p-8">
                            Inicie uma conversa...
                        </div>
                    )}

                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex w-full items-start gap-2",
                                msg.role === 'user' ? "justify-end" : "justify-start"
                            )}
                        >
                            {msg.role === 'assistant' && (
                                <Avatar className="h-8 w-8 mt-1 border">
                                    <AvatarImage src={assistantAvatar} />
                                    <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                                </Avatar>
                            )}

                            <div
                                className={cn(
                                    "rounded-lg px-4 py-2 max-w-[80%] text-sm",
                                    msg.role === 'user'
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-foreground"
                                )}
                            >
                                {msg.role === 'assistant' ? (
                                    <div className="prose dark:prose-invert prose-sm max-w-none wrap-break-words">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    <div className="wrap-break-words whitespace-pre-wrap">{msg.content}</div>
                                )}
                                {msg.id.startsWith('-') && ( // Identificador de temp/loading se usasse id negativo
                                    <span className="ml-2 inline-block h-2 w-2 rounded-full bg-current opacity-50 animate-pulse" />
                                )}
                            </div>

                            {msg.role === 'user' && (
                                <Avatar className="h-8 w-8 mt-1 border">
                                    <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>
            </ScrollArea>

            <div className="p-4 border-t">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Digite sua mensagem..."
                        disabled={isLoading}
                        className="flex-1"
                        autoFocus
                    />
                    {isLoading ? (
                        <Button type="button" size="icon" variant="destructive" onClick={stop}>
                            <StopCircle className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button type="submit" size="icon" disabled={!input.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    )}
                </form>
            </div>
        </div>
    );
}
