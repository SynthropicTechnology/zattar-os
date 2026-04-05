'use client';

import { Lock, Layers, RefreshCw, ArrowLeft, Search } from 'lucide-react';
import type { ProcessoUnificado } from '@/app/(authenticated)/processos';
import type { GrauProcesso } from '@/app/(authenticated)/partes';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { CopyButton } from '@/app/(authenticated)/partes';
import { ProximaAudienciaPopover } from '../proxima-audiencia-popover';
import { GrauBadgesSimple } from '../grau-badges';
import { GRAU_LABELS } from '@/lib/design-system';
import { ProcessosAlterarResponsavelDialog } from '../processos-alterar-responsavel-dialog';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface InstanciaInfo {
  id: number;
  grau: GrauProcesso;
  trt: string;
  totalItensOriginal: number;
  totalMovimentosProprios?: number;
}

interface Usuario {
  id: number;
  nomeExibicao: string;
  avatarUrl?: string | null;
}

interface CaseIdentityBarProps {
  processo: ProcessoUnificado;
  instancias?: InstanciaInfo[];
  isCapturing?: boolean;
  isReadingFocused?: boolean;
  usuarios: Usuario[];
  onVoltar: () => void;
  onAtualizarTimeline: () => void;
  onOpenSearch: () => void;
}

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function CaseIdentityBar({
  processo,
  instancias,
  isCapturing,
  isReadingFocused,
  usuarios,
  onVoltar,
  onAtualizarTimeline,
  onOpenSearch,
}: CaseIdentityBarProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const trt = processo.trtOrigem || processo.trt;
  const numeroProcesso = processo.numeroProcesso;
  const segredoJustica = processo.segredoJustica;
  const dataProximaAudiencia = processo.dataProximaAudiencia;
  const isUnificado = !!processo.grausAtivos?.length;
  const parteAutora = processo.nomeParteAutoraOrigem || processo.nomeParteAutora || '-';
  const parteRe = processo.nomeParteReOrigem || processo.nomeParteRe || '-';
  const tituloPartes =
    parteRe && parteRe !== '-' ? `${parteAutora} vs ${parteRe}` : parteAutora;
  const responsavel = usuarios.find((u) => u.id === processo.responsavelId);

  if (isReadingFocused) {
    return (
      <header
        role="banner"
        className="glass-widget bg-transparent border-b border-border/20 px-4 py-1.5 flex items-center gap-3 shrink-0"
      >
        <span className="font-mono text-xs text-muted-foreground">{numeroProcesso}</span>
        <span className="w-px h-4 bg-border/10" />
        <span className="text-xs text-muted-foreground/60 truncate">{tituloPartes}</span>
      </header>
    );
  }

  return (
    <header
      role="banner"
      className="glass-widget bg-transparent border-b border-border/20 px-4 py-2.5 flex items-center gap-3 shrink-0"
    >
      <Button variant="ghost" size="icon-sm" onClick={onVoltar} title="Voltar">
        <ArrowLeft className="size-4" />
      </Button>

      <h1 className="text-base font-heading font-semibold tracking-tight truncate max-w-[35%] min-w-0">
        {tituloPartes}
      </h1>

      {segredoJustica && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Lock className="size-3.5 text-destructive shrink-0" />
            </TooltipTrigger>
            <TooltipContent>Segredo de Justiça</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <span className="w-px h-5 bg-border/10 shrink-0" />

      <div className="flex items-center gap-1 shrink-0">
        <span className="font-mono text-sm text-foreground/80">{numeroProcesso}</span>
        <CopyButton text={numeroProcesso} label="Copiar número" />
      </div>

      <SemanticBadge category="tribunal" value={trt} className="text-[10px] shrink-0">
        {trt}
      </SemanticBadge>

      {isUnificado && processo.grausAtivos ? (
        <GrauBadgesSimple grausAtivos={processo.grausAtivos} />
      ) : (
        processo.grauAtual && (
          <SemanticBadge category="grau" value={processo.grauAtual} className="text-[10px] shrink-0">
            {GRAU_LABELS[processo.grauAtual as keyof typeof GRAU_LABELS] || processo.grauAtual}
          </SemanticBadge>
        )
      )}

      <div className="flex-1" />

      {dataProximaAudiencia && (
        <ProximaAudienciaPopover dataAudiencia={dataProximaAudiencia} />
      )}

      {instancias && instancias.length > 1 && (
        <span className="inline-flex items-center gap-1 rounded-full border bg-muted/20 px-2 py-0.5 text-[10px] text-muted-foreground shrink-0">
          <Layers className="size-3" />
          {instancias.length}
        </span>
      )}

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setIsDialogOpen(true)}
              className="rounded-full transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 shrink-0"
              aria-label={responsavel ? `Responsável: ${responsavel.nomeExibicao}` : 'Atribuir responsável'}
            >
              <Avatar className="h-7 w-7 border">
                <AvatarImage src={responsavel?.avatarUrl || undefined} alt={responsavel?.nomeExibicao || 'Não atribuído'} />
                <AvatarFallback className="text-[9px] font-medium">
                  {responsavel ? getInitials(responsavel.nomeExibicao) : 'NA'}
                </AvatarFallback>
              </Avatar>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            {responsavel ? responsavel.nomeExibicao : 'Não atribuído'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon-sm" variant="ghost" onClick={onAtualizarTimeline} disabled={isCapturing}>
              <RefreshCw className={cn('size-3.5', isCapturing && 'animate-spin')} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Atualizar timeline</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon-sm" variant="ghost" onClick={onOpenSearch}>
              <Search className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Buscar na timeline (⌘K)</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <ProcessosAlterarResponsavelDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        processo={processo}
        usuarios={usuarios}
        onSuccess={() => {}}
      />
    </header>
  );
}
