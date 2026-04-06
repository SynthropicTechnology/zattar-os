'use client';

import { Scale, ChevronRight } from 'lucide-react';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { IconContainer } from '@/components/ui/icon-container';
import type { ProcessoUnificado } from '../domain';

interface Usuario {
  id: number;
  nomeExibicao: string;
  avatarUrl?: string | null;
}

interface ProcessoListRowProps {
  processo: ProcessoUnificado;
  responsavel?: Usuario;
  isSelected?: boolean;
  onClick: () => void;
}

const STATUS_DOT_COLOR: Record<string, string> = {
  ATIVO: 'bg-primary/50',
  DISTRIBUIDO: 'bg-primary/50',
  EM_ANDAMENTO: 'bg-primary/50',
  PENDENTE: 'bg-warning/50',
  EM_RECURSO: 'bg-info/50',
  ARQUIVADO: 'bg-muted-foreground/20',
  default: 'bg-muted-foreground/20',
};

export function ProcessoListRow({
  processo,
  responsavel,
  isSelected,
  onClick,
}: ProcessoListRowProps) {
  const trt = processo.trtOrigem || processo.trt;
  const parteAutora = processo.nomeParteAutoraOrigem || processo.nomeParteAutora || '-';
  const parteRe = processo.nomeParteReOrigem || processo.nomeParteRe || '-';
  const tituloPartes = parteRe !== '-' ? `${parteAutora} vs ${parteRe}` : parteAutora;
  const dotColor = STATUS_DOT_COLOR[processo.codigoStatusProcesso] || STATUS_DOT_COLOR.default;
  const dataAut = processo.dataAutuacaoOrigem || processo.dataAutuacao;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all',
        isSelected
          ? 'bg-primary/6 border border-primary/15'
          : 'hover:bg-white/4 border border-transparent'
      )}
    >
      <div className={cn('size-2.5 rounded-full shrink-0', dotColor)} />
      <IconContainer size="md" className="bg-primary/8">
        <Scale className="size-3.5 text-primary/50" />
      </IconContainer>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-xs font-medium truncate">{tituloPartes}</p>
        <p className="text-[10px] text-muted-foreground/55 font-mono tabular-nums truncate">
          {processo.numeroProcesso}
        </p>
      </div>
      <SemanticBadge category="tribunal" value={trt} className="text-[9px] shrink-0 hidden sm:flex">
        {trt}
      </SemanticBadge>
      <Avatar size="sm" className="border">
        <AvatarImage src={responsavel?.avatarUrl || undefined} />
        <AvatarFallback className="text-[8px]">
          {responsavel?.nomeExibicao?.slice(0, 2).toUpperCase() || 'NA'}
        </AvatarFallback>
      </Avatar>
      {dataAut && (
        <span className="text-[10px] font-medium text-muted-foreground/55 w-20 text-right hidden lg:block tabular-nums">
          {new Date(dataAut).toLocaleDateString('pt-BR')}
        </span>
      )}
      <ChevronRight className="size-3.5 text-muted-foreground/15 shrink-0" />
    </button>
  );
}
