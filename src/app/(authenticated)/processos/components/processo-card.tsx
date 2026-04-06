'use client';

import { Scale, Building2, Calendar, AlertTriangle, Clock } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CopyButton } from '@/app/(authenticated)/partes';
import { timeAgo } from '@/components/dashboard/entity-card';
import { cn } from '@/lib/utils';
import { IconContainer } from '@/components/ui/icon-container';
import type { ProcessoUnificado } from '../domain';
import { GRAU_LABELS } from '@/lib/design-system';

interface Usuario {
  id: number;
  nomeExibicao: string;
  avatarUrl?: string | null;
}

interface Tag {
  id: number;
  nome: string;
}

interface ProcessoCardProps {
  processo: ProcessoUnificado;
  tags?: Tag[];
  responsavel?: Usuario;
  isSelected?: boolean;
  onClick: () => void;
}

const STATUS_CLASSES: Record<string, { bg: string; text: string }> = {
  ATIVO: { bg: 'bg-primary/8', text: 'text-primary/50' },
  DISTRIBUIDO: { bg: 'bg-primary/8', text: 'text-primary/50' },
  EM_ANDAMENTO: { bg: 'bg-primary/8', text: 'text-primary/50' },
  PENDENTE: { bg: 'bg-warning/8', text: 'text-warning/50' },
  SUSPENSO: { bg: 'bg-muted-foreground/8', text: 'text-muted-foreground/50' },
  EM_RECURSO: { bg: 'bg-info/8', text: 'text-info/50' },
  ARQUIVADO: { bg: 'bg-muted-foreground/8', text: 'text-muted-foreground/50' },
  EXTINTO: { bg: 'bg-muted-foreground/8', text: 'text-muted-foreground/50' },
  BAIXADO: { bg: 'bg-muted-foreground/8', text: 'text-muted-foreground/50' },
  OUTRO: { bg: 'bg-muted-foreground/8', text: 'text-muted-foreground/50' },
};

function getInitials(name: string): string {
  if (!name) return 'NA';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function ProcessoCard({
  processo,
  tags,
  responsavel,
  isSelected,
  onClick,
}: ProcessoCardProps) {
  const defaultClasses = { bg: 'bg-muted-foreground/8', text: 'text-muted-foreground/50' };
  const statusClasses = STATUS_CLASSES[processo.codigoStatusProcesso] || defaultClasses;
  const trt = processo.trtOrigem || processo.trt;
  const parteAutora = processo.nomeParteAutoraOrigem || processo.nomeParteAutora || '-';
  const parteRe = processo.nomeParteReOrigem || processo.nomeParteRe || '-';
  const tituloPartes = parteRe !== '-' ? `${parteAutora} vs ${parteRe}` : parteAutora;
  const orgaoJulgador = processo.descricaoOrgaoJulgador || '-';
  const dataAut = processo.dataAutuacaoOrigem || processo.dataAutuacao;
  const hasUrgency = !!processo.dataProximaAudiencia;

  return (
    <GlassPanel
      className={cn(
        'p-4 cursor-pointer group',
        isSelected && 'border-primary/20 bg-primary/3'
      )}
    >
      <div onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onClick()}>
        <div className="flex items-start gap-3">
          <IconContainer size="lg" className={statusClasses.bg}>
            <Scale className={cn('size-5', statusClasses.text)} />
          </IconContainer>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold truncate">{tituloPartes}</h3>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px] font-mono text-muted-foreground/55 tabular-nums truncate">
                {processo.numeroProcesso}
              </span>
              <CopyButton text={processo.numeroProcesso} label="Copiar número" />
            </div>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <SemanticBadge category="tribunal" value={trt} className="text-[9px]">
                {trt}
              </SemanticBadge>
              {processo.grauAtual && (
                <SemanticBadge category="grau" value={processo.grauAtual} className="text-[9px]">
                  {GRAU_LABELS[processo.grauAtual as keyof typeof GRAU_LABELS] || processo.grauAtual}
                </SemanticBadge>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/55">
            <Building2 className="size-3 shrink-0" />
            <span className="truncate">{orgaoJulgador}</span>
          </div>
          {dataAut && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/55">
              <Calendar className="size-3 shrink-0" />
              <span>Autuação: {new Date(dataAut).toLocaleDateString('pt-BR')}</span>
            </div>
          )}
        </div>

        {hasUrgency && (
          <div className="mt-3 pt-3 border-t border-border/10">
            <div className="flex items-center gap-1.5 text-[10px] text-warning font-medium">
              <AlertTriangle className="size-3" />
              <span>Audiência em {processo.dataProximaAudiencia ? new Date(processo.dataProximaAudiencia).toLocaleDateString('pt-BR') : ''}</span>
            </div>
          </div>
        )}

        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.slice(0, 3).map((tag) => (
              <span key={tag.id} className="text-[9px] px-1.5 py-0.5 rounded bg-primary/5 text-primary/50 border border-primary/10">
                {tag.nome}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-[9px] text-muted-foreground/40">+{tags.length - 3}</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/10">
          <div className="flex items-center gap-1.5">
            <Avatar size="xs" className="border">
              <AvatarImage src={responsavel?.avatarUrl || undefined} />
              <AvatarFallback className="text-[8px]">
                {responsavel ? getInitials(responsavel.nomeExibicao) : 'NA'}
              </AvatarFallback>
            </Avatar>
            <span className="text-[9px] text-muted-foreground/50">
              {responsavel?.nomeExibicao || 'Sem resp.'}
            </span>
          </div>
          <span className="text-[9px] text-muted-foreground/40 flex items-center gap-1">
            <Clock className="size-2.5" />
            {timeAgo(processo.updatedAt)}
          </span>
        </div>
      </div>
    </GlassPanel>
  );
}
