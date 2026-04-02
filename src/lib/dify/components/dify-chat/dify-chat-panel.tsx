'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, StopCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useDifyChat, Message } from '../../hooks/use-dify-chat';
import { SaveAsDocumentDialog } from '../save-as-document-dialog';

interface DifyChatPanelProps {
    appId?: string;
    inputs?: Record<string, unknown>;
    conversationId?: string;
    initialMessages?: Message[];
    user?: string;
    onFinish?: (message: Message) => void;
    className?: string;
}

export function DifyChatPanel({
    appId,
    inputs,
    conversationId,
    initialMessages,
    user,
    onFinish,
    className,
}: DifyChatPanelProps) {
    const { messages, input, setInput, sendMessage, isLoading, stop } = useDifyChat({
        appId,
        conversationId,
        initialMessages,
        user,
        onFinish,
    });

    const bottomRef = useRef<HTMLDivElement>(null);
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [saveContent, setSaveContent] = useState('');

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isLoading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        await sendMessage(input, inputs || {});
    };

    return (
        <div className={cn('flex flex-col h-full', className)}>
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
                                'group flex w-full items-start gap-2',
                                msg.role === 'user' ? 'justify-end' : 'justify-start'
                            )}
                        >
                            {msg.role === 'assistant' && (
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted mt-1">
                                    <Bot className="h-4 w-4" />
                                </div>
                            )}

                            <div
                                className={cn(
                                    'rounded-lg px-4 py-2 max-w-[80%] text-sm',
                                    msg.role === 'user'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-foreground'
                                )}
                            >
                                {msg.role === 'assistant' ? (
                                    <div className="prose dark:prose-invert prose-sm max-w-none wrap-break-word">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    <div className="wrap-break-word whitespace-pre-wrap">
                                        {msg.content}
                                    </div>
                                )}
                            </div>

                            {msg.role === 'user' && (
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground mt-1">
                                    <User className="h-4 w-4" />
                                </div>
                            )}

                            {/* Save as document button for assistant messages */}
                            {msg.role === 'assistant' && msg.content && !isLoading && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Salvar como Documento"
                                    onClick={() => {
                                        setSaveContent(msg.content);
                                        setSaveDialogOpen(true);
                                    }}
                                >
                                    <FileText className="h-3.5 w-3.5" />
                                </Button>
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
            <SaveAsDocumentDialog
                open={saveDialogOpen}
                onOpenChange={setSaveDialogOpen}
                content={saveContent}
            />
        </div>
    );
}
