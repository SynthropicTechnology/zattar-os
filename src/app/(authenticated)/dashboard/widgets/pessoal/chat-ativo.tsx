'use client';

import { MessageCircle } from 'lucide-react';
import { WidgetContainer } from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard } from '../../hooks';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

export function WidgetChatAtivo() {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <WidgetSkeleton size="sm" />;

  const chat = data?.chatResumo;
  const naoLidas = chat?.naoLidas ?? 0;
  const salasAtivas = chat?.salasAtivas ?? 0;
  const ultimaMsg = chat?.ultimaMensagem;

  const tempoRelativo = ultimaMsg
    ? formatDistanceToNow(new Date(ultimaMsg.tempo), {
        addSuffix: true,
        locale: ptBR,
      })
    : null;

  return (
    <WidgetContainer
      title="Chat"
      icon={MessageCircle}
      subtitle="Mensagens e salas ativas"
      depth={1}
    >
      {/* Contador de não lidas */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <div className="size-10 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center">
            <MessageCircle className="size-4 text-primary/50" />
          </div>
          {naoLidas > 0 && (
            <span className="absolute -top-1 -right-1 size-4 rounded-full bg-primary text-[8px] font-bold text-background flex items-center justify-center tabular-nums">
              {naoLidas > 9 ? '9+' : naoLidas}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-muted-foreground/50">Não lidas</p>
          <p className="text-lg font-bold tabular-nums">{naoLidas}</p>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">salas</span>
          <span className="text-base font-bold tabular-nums">{salasAtivas}</span>
          <span className="text-[9px] text-muted-foreground/55">ativas</span>
        </div>
      </div>

      {/* Preview da última mensagem */}
      {ultimaMsg ? (
        <div className="px-3 py-2.5 rounded-xl bg-white/3 border border-border/10">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="size-1.5 rounded-full bg-success/60" />
            <span className="text-[10px] font-semibold text-foreground/70">{ultimaMsg.autor}</span>
            <span className="text-[9px] text-muted-foreground/55 ml-auto tabular-nums">{tempoRelativo}</span>
          </div>
          <p className="text-[10px] text-muted-foreground/55 leading-relaxed line-clamp-2">{ultimaMsg.preview}</p>
        </div>
      ) : (
        <div className="px-3 py-2.5 rounded-xl bg-white/3 border border-border/10">
          <p className="text-[10px] text-muted-foreground/40 text-center">Nenhuma mensagem recente</p>
        </div>
      )}

      <div className="mt-3 pt-2 border-t border-border/10 flex items-center justify-between">
        <span className="text-[9px] text-muted-foreground/55 uppercase tracking-wider">
          {salasAtivas} salas — {naoLidas} pendentes
        </span>
        <Link
          href="/chat"
          className="text-[9px] text-primary/50 font-medium hover:text-primary/70 transition-colors cursor-pointer"
        >
          ver todas
        </Link>
      </div>
    </WidgetContainer>
  );
}
