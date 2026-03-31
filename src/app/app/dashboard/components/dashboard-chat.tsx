'use client';

import * as React from 'react';
import { Send, MessageSquare, ExternalLink, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  actionListarSalas,
  actionEnviarMensagem,
  actionBuscarHistorico,
  useChatSubscription,
  type SalaChat,
  type MensagemComUsuario,
} from '@/features/chat';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChatWidgetProps {
  currentUserId: number;
  currentUserName: string;
}

export function ChatWidget({ currentUserId, currentUserName: _currentUserName }: ChatWidgetProps) {
  const [salas, setSalas] = React.useState<SalaChat[]>([]);
  const [salaAtiva, setSalaAtiva] = React.useState<SalaChat | null>(null);
  const [mensagens, setMensagens] = React.useState<MensagemComUsuario[]>([]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [sending, setSending] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const carregarSalas = async (tentativa = 1) => {
      try {
        setLoading(true);
        const result = await actionListarSalas({ limite: 5, arquivadas: false });
        if (result.success && result.data) {
          const salasArray = Array.isArray(result.data) ? result.data : [];
          setSalas(salasArray);
          if (salasArray.length > 0) setSalaAtiva(salasArray[0]);
        } else if (!result.success && tentativa < 3) {
          await new Promise((r) => setTimeout(r, tentativa * 1500));
          return carregarSalas(tentativa + 1);
        }
      } catch (error) {
        if (tentativa < 3) {
          await new Promise((r) => setTimeout(r, tentativa * 1500));
          return carregarSalas(tentativa + 1);
        }
        console.error('Erro ao carregar salas após 3 tentativas:', error);
        toast.error('Erro ao carregar conversas. Tente recarregar a página.');
      } finally {
        setLoading(false);
      }
    };
    carregarSalas();
  }, []);

  React.useEffect(() => {
    if (salaAtiva) carregarMensagens(salaAtiva.id);
  }, [salaAtiva]);

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [mensagens]);

  const { isConnected } = useChatSubscription({
    salaId: salaAtiva?.id || 0,
    currentUserId,
    enabled: !!salaAtiva,
    onNewMessage: (novaMensagem) => {
      setMensagens((prev) => {
        if (prev.some((m) => m.id === novaMensagem.id)) return prev;
        return [...prev, novaMensagem];
      });
    },
  });

  const carregarMensagens = async (salaId: number) => {
    try {
      const result = await actionBuscarHistorico(salaId, 20, undefined);
      if (result.success && result.data) {
        setMensagens(Array.isArray(result.data) ? result.data : []);
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  };

  const enviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !salaAtiva) return;
    const conteudo = input.trim();
    setInput('');
    setSending(true);
    try {
      const result = await actionEnviarMensagem(salaAtiva.id, conteudo, 'texto');
      if (!result.success) {
        toast.error('Erro ao enviar mensagem');
        setInput(conteudo);
      }
    } catch {
      toast.error('Erro ao enviar mensagem');
      setInput(conteudo);
    } finally {
      setSending(false);
    }
  };

  const formatarHora = (dataISO: string): string => {
    try {
      return format(parseISO(dataISO), 'HH:mm', { locale: ptBR });
    } catch {
      return '';
    }
  };

  const obterIniciais = (nome: string): string => {
    const partes = nome.split(' ');
    return partes.length >= 2 ? `${partes[0][0]}${partes[1][0]}`.toUpperCase() : nome.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <Card className="row-span-2 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="size-5" />
            Chat
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <Skeleton className="h-full min-h-75 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (salas.length === 0) {
    return (
      <Card className="row-span-2 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="size-5" />
            Chat
          </CardTitle>
          <CardAction>
            <Link href="/app/chat">
              <Button size="icon" variant="ghost" className="size-8 text-muted-foreground hover:text-foreground">
                <PlusCircle className="size-5" />
                <span className="sr-only">Nova conversa</span>
              </Button>
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center justify-center text-center">
            <MessageSquare className="size-12 text-muted-foreground/55" />
            <p className="mt-4 text-sm text-muted-foreground">Nenhuma conversa iniciada!</p>
            <p className="text-sm text-muted-foreground">
              Clique no <span className="font-medium text-primary">+</span> para começar.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="row-span-2 flex flex-col glass-widget bg-transparent transition-all duration-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="size-5" />
          {salaAtiva?.nome || 'Chat'}
          {isConnected && <span className="ml-1 size-2 rounded-full bg-success" title="Conectado" />}
        </CardTitle>
        <CardAction>
          <Link href="/app/chat">
            <Button variant="ghost" size="icon" title="Abrir chat completo">
              <ExternalLink className="size-4" />
            </Button>
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full px-4" ref={scrollRef}>
          <div className="space-y-3 py-2">
            {mensagens.length === 0 ? (
              <div className="flex h-full items-center justify-center py-8 text-center text-sm text-muted-foreground">
                Sem mensagens ainda. Seja o primeiro a enviar!
              </div>
            ) : (
              mensagens.map((mensagem) => {
                const isOwn = mensagem.usuarioId === currentUserId;
                return (
                  <div key={mensagem.id} className={cn('flex gap-2', isOwn ? 'flex-row-reverse' : 'flex-row')}>
                    {!isOwn && (
                      <Avatar className="size-8">
                        <AvatarImage src={mensagem.usuario.avatar || undefined} />
                        <AvatarFallback className="text-xs">
                          {obterIniciais(mensagem.usuario.nomeExibicao || mensagem.usuario.nomeCompleto)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        'flex max-w-[75%] flex-col gap-1 rounded-lg px-3 py-2 text-sm',
                        isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      )}
                    >
                      {!isOwn && <span className="text-xs font-medium opacity-70">{mensagem.usuario.nomeExibicao}</span>}
                      <p className="wrap-break-word">{mensagem.conteudo}</p>
                      <span className="text-xs opacity-60">{formatarHora(mensagem.createdAt)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="border-t p-3">
        <form onSubmit={enviarMensagem} className="flex w-full gap-2">
          <Input
            placeholder="Digite sua mensagem..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={sending || !input.trim()}>
            <Send className="size-4" />
            <span className="sr-only">Enviar</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
