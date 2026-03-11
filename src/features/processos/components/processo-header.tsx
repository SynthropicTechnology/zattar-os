/**
 * Header do Processo
 *
 * Layout flat (sem Card) integrado ao design system.
 * Tipografia alinhada ao padrão DataTableToolbar (text-2xl font-heading).
 * Metadados compactados em layout horizontal.
 */

'use client';

import React from 'react';
import { Lock, Layers, RefreshCw, ArrowLeft } from 'lucide-react';
import type { ProcessoUnificado, Processo } from '@/features/processos/domain';
import type { GrauProcesso } from '@/features/partes';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { GrauBadgesSimple } from './grau-badges';
import { CopyButton } from '@/features/partes';
import { ProximaAudienciaPopover } from './proxima-audiencia-popover';
import { GRAU_LABELS } from '@/lib/design-system';
import { actionListarUsuarios } from '@/features/usuarios';
import { ProcessosAlterarResponsavelDialog } from './processos-alterar-responsavel-dialog';
import { SemanticBadge } from '@/components/ui/semantic-badge';

/**
 * Type guard para verificar se é ProcessoUnificado
 */
function isProcessoUnificado(processo: Processo | ProcessoUnificado): processo is ProcessoUnificado {
  return 'instances' in processo && 'grauAtual' in processo;
}

/**
 * Informações de instância para exibição
 */
interface InstanciaInfo {
  id: number;
  grau: GrauProcesso;
  trt: string;
  totalItensOriginal: number;
  totalMovimentosProprios?: number;
}

interface ProcessoHeaderProps {
  processo: ProcessoUnificado;
  instancias?: InstanciaInfo[];
  duplicatasRemovidas?: number;
  onAtualizarTimeline?: () => void;
  isCapturing?: boolean;
  onVoltar?: () => void;
}

function getOrgaoJulgador(processo: ProcessoUnificado): string {
  return processo.descricaoOrgaoJulgador || '-';
}

function formatarGrau(grau: string): string {
  return GRAU_LABELS[grau as keyof typeof GRAU_LABELS] || grau;
}

function formatarGrauComOrdinal(grau: GrauProcesso): string {
  switch (grau) {
    case 'tribunal_superior':
      return 'Tribunal Superior';
    case 'segundo_grau':
      return '2º Grau';
    case 'primeiro_grau':
      return '1º Grau';
    default:
      return formatarGrau(grau);
  }
}

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface Usuario {
  id: number;
  nomeExibicao: string;
  avatarUrl?: string | null;
}

function ProcessoResponsavelCell({
  processo,
  usuarios = [],
  onSuccess,
}: {
  processo: ProcessoUnificado;
  usuarios?: Usuario[];
  onSuccess?: (updatedProcesso?: ProcessoUnificado) => void;
}) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [localProcesso, setLocalProcesso] = React.useState(processo);

  React.useEffect(() => {
    setLocalProcesso(processo);
  }, [processo]);

  const responsavel = usuarios.find((u) => u.id === localProcesso.responsavelId);
  const nomeExibicao = responsavel?.nomeExibicao || 'Não atribuído';

  const handleSuccess = React.useCallback((updatedProcesso?: ProcessoUnificado) => {
    if (updatedProcesso && updatedProcesso.id === localProcesso.id) {
      setLocalProcesso(updatedProcesso);
    }
    onSuccess?.(updatedProcesso);
  }, [onSuccess, localProcesso.id]);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsDialogOpen(true);
        }}
        className="flex items-center gap-2 text-sm min-w-0 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded px-1 -mx-1 cursor-pointer"
        title={responsavel ? `Clique para alterar responsável: ${nomeExibicao}` : 'Clique para atribuir responsável'}
      >
        {responsavel ? (
          <>
            <Avatar className="h-6 w-6 shrink-0">
              <AvatarImage src={responsavel.avatarUrl || undefined} alt={responsavel.nomeExibicao} />
              <AvatarFallback className="text-[10px] font-medium">
                {getInitials(responsavel.nomeExibicao)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-sm">{responsavel.nomeExibicao}</span>
          </>
        ) : (
          <span className="text-muted-foreground text-sm">Não atribuído</span>
        )}
      </button>

      <ProcessosAlterarResponsavelDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        processo={localProcesso}
        usuarios={usuarios}
        onSuccess={handleSuccess}
      />
    </>
  );
}

export function ProcessoHeader({ processo, instancias, duplicatasRemovidas, onAtualizarTimeline, isCapturing, onVoltar }: ProcessoHeaderProps) {
  const [usuarios, setUsuarios] = React.useState<Usuario[]>([]);

  React.useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const result = await actionListarUsuarios({ ativo: true, limite: 100 });
        if (result.success && result.data?.usuarios) {
          const usuariosList = (result.data.usuarios as Array<{ id: number; nomeExibicao?: string; nome_exibicao?: string; nome?: string; avatarUrl?: string | null }>).map((u) => ({
            id: u.id,
            nomeExibicao: u.nomeExibicao || u.nome_exibicao || u.nome || `Usuário ${u.id}`,
            avatarUrl: u.avatarUrl ?? null,
          }));
          setUsuarios(usuariosList);
        }
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
      }
    };
    fetchUsuarios();
  }, []);

  const trt = processo.trtOrigem || processo.trt;
  const classeJudicial = processo.classeJudicial || '';
  const numeroProcesso = processo.numeroProcesso;
  const orgaoJulgador = getOrgaoJulgador(processo);
  const segredoJustica = processo.segredoJustica;
  const dataProximaAudiencia = processo.dataProximaAudiencia;
  const isUnificado = isProcessoUnificado(processo);

  const parteAutora = processo.nomeParteAutoraOrigem || processo.nomeParteAutora || '-';
  const parteRe = processo.nomeParteReOrigem || processo.nomeParteRe || '-';

  return (
    <div className="space-y-3">
      {/* Linha 1: Voltar + Número do Processo + Ações */}
      <div className="flex items-center gap-3">
        {onVoltar && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onVoltar}
            title="Voltar para Processos"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight font-heading truncate">
            {classeJudicial && `${classeJudicial} `}
            {numeroProcesso}
          </h1>
          <CopyButton text={numeroProcesso} label="Copiar número do processo" />
          {segredoJustica && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Lock className="h-4 w-4 text-destructive shrink-0" />
                </TooltipTrigger>
                <TooltipContent>Segredo de Justiça</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <ProximaAudienciaPopover dataAudiencia={dataProximaAudiencia} />
        </div>

        {/* Ações */}
        <div className="flex items-center gap-1 shrink-0">
          {onAtualizarTimeline && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={onAtualizarTimeline}
                    disabled={isCapturing}
                  >
                    <RefreshCw className={`h-4 w-4 ${isCapturing ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Atualizar timeline do processo</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* Linha 2: Badges + Órgão + Responsável — tudo compacto numa linha */}
      <div className="flex items-center gap-2 flex-wrap text-sm">
        {/* Tribunal */}
        <SemanticBadge category="tribunal" value={trt} className="text-xs">
          {trt}
        </SemanticBadge>

        {/* Graus */}
        {isUnificado && processo.grausAtivos ? (
          <GrauBadgesSimple grausAtivos={processo.grausAtivos} />
        ) : (
          processo.grauAtual && (
            <SemanticBadge category="grau" value={processo.grauAtual} className="text-xs">
              {formatarGrau(processo.grauAtual)}
            </SemanticBadge>
          )
        )}

        <Separator orientation="vertical" className="h-4" />

        {/* Órgão Julgador */}
        <span className="text-muted-foreground truncate max-w-xs">{orgaoJulgador}</span>

        <Separator orientation="vertical" className="h-4" />

        {/* Responsável inline */}
        <ProcessoResponsavelCell processo={processo} usuarios={usuarios} onSuccess={() => { }} />
      </div>

      {/* Linha 3: Partes — layout clean com indicadores de polo */}
      <div className="flex items-start gap-4 text-sm">
        <div className="flex items-start gap-1.5 min-w-0 flex-1">
          <SemanticBadge category="polo" value="ativo" className="text-xs shrink-0 mt-0.5">
            Autor
          </SemanticBadge>
          <span className="text-foreground wrap-break-word">{parteAutora}</span>
        </div>
        <div className="flex items-start gap-1.5 min-w-0 flex-1">
          <SemanticBadge category="polo" value="passivo" className="text-xs shrink-0 mt-0.5">
            Réu
          </SemanticBadge>
          <span className="text-foreground wrap-break-word">{parteRe}</span>
        </div>
      </div>

      {/* Instâncias (modo unificado) — compacto */}
      {instancias && instancias.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap text-sm">
          <Layers className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground text-xs font-medium">
            {instancias.length} instâncias
          </span>
          {duplicatasRemovidas !== undefined && duplicatasRemovidas > 0 && (
            <span className="text-muted-foreground text-xs">
              ({duplicatasRemovidas} duplicatas removidas)
            </span>
          )}
          <Separator orientation="vertical" className="h-4" />
          {instancias.map((inst) => (
            <div key={inst.id} className="flex items-center gap-1.5">
              <SemanticBadge category="grau" value={inst.grau} className="text-xs">
                {formatarGrauComOrdinal(inst.grau)}
              </SemanticBadge>
              <span className="text-xs text-muted-foreground">
                {inst.totalMovimentosProprios ?? inst.totalItensOriginal} mov.
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
