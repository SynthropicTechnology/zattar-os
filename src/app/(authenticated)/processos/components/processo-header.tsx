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
import type { ProcessoUnificado } from '@/app/(authenticated)/processos';
import type { GrauProcesso } from '@/app/(authenticated)/partes';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { GrauBadgesSimple } from './grau-badges';
import { CopyButton } from '@/app/(authenticated)/partes';
import { ProximaAudienciaPopover } from './proxima-audiencia-popover';
import { GRAU_LABELS } from '@/lib/design-system';
import { actionListarUsuarios } from '@/app/(authenticated)/usuarios';
import { ProcessosAlterarResponsavelDialog } from './processos-alterar-responsavel-dialog';
import { SemanticBadge } from '@/components/ui/semantic-badge';

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
  /** Lista de usuários pré-carregada (evita fetch duplicado se fornecida) */
  usuarios?: Usuario[];
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
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsDialogOpen(true);
              }}
              className="rounded-full transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              aria-label={responsavel ? `Alterar responsável: ${nomeExibicao}` : 'Atribuir responsável'}
            >
              <Avatar className="h-8 w-8 shrink-0 border">
                <AvatarImage src={responsavel?.avatarUrl || undefined} alt={nomeExibicao} />
                <AvatarFallback className="text-[10px] font-medium">
                  {responsavel ? getInitials(responsavel.nomeExibicao) : 'NA'}
                </AvatarFallback>
              </Avatar>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            {responsavel ? nomeExibicao : 'Não atribuído'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

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

export function ProcessoHeader({
  processo,
  instancias,
  duplicatasRemovidas,
  onAtualizarTimeline,
  isCapturing,
  onVoltar,
  usuarios: usuariosExternos,
}: ProcessoHeaderProps) {
  const [usuariosLocais, setUsuariosLocais] = React.useState<Usuario[]>([]);

  // Fetch apenas se não recebeu usuarios via prop
  React.useEffect(() => {
    if (usuariosExternos && usuariosExternos.length > 0) return;
    const fetchUsuarios = async () => {
      try {
        const result = await actionListarUsuarios({ ativo: true, limite: 200 });
        if (result.success && result.data?.usuarios) {
          const usuariosList = (result.data.usuarios as Array<{ id: number; nomeExibicao?: string; nome_exibicao?: string; nome?: string; avatarUrl?: string | null }>).map((u) => ({
            id: u.id,
            nomeExibicao: u.nomeExibicao || u.nome_exibicao || u.nome || `Usuário ${u.id}`,
            avatarUrl: u.avatarUrl ?? null,
          }));
          setUsuariosLocais(usuariosList);
        }
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
      }
    };
    fetchUsuarios();
  }, [usuariosExternos]);

  const usuarios = usuariosExternos && usuariosExternos.length > 0 ? usuariosExternos : usuariosLocais;

  const trt = processo.trtOrigem || processo.trt;
  const classeJudicial = processo.classeJudicial || '';
  const numeroProcesso = processo.numeroProcesso;
  const orgaoJulgador = processo.descricaoOrgaoJulgador || '-';
  const segredoJustica = processo.segredoJustica;
  const dataProximaAudiencia = processo.dataProximaAudiencia;
  const isUnificado = !!processo.grausAtivos?.length;
  const parteAutora = processo.nomeParteAutoraOrigem || processo.nomeParteAutora || '-';
  const parteRe = processo.nomeParteReOrigem || processo.nomeParteRe || '-';
  const tituloPartes = parteRe && parteRe !== '-' ? `${parteAutora} vs ${parteRe}` : parteAutora;

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-center gap-3">
            {onVoltar && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onVoltar}
                title="Voltar para Processos"
                className="mt-0.5 shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}

            <div className="min-w-0 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground min-w-0 sm:text-[2rem]">
                  <span className="block truncate">{tituloPartes}</span>
                </h1>
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
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
                <SemanticBadge category="tribunal" value={trt} className="text-xs">
                  {trt}
                </SemanticBadge>

                {isUnificado && processo.grausAtivos ? (
                  <GrauBadgesSimple grausAtivos={processo.grausAtivos} />
                ) : (
                  processo.grauAtual && (
                    <SemanticBadge category="grau" value={processo.grauAtual} className="text-xs">
                      {formatarGrau(processo.grauAtual)}
                    </SemanticBadge>
                  )
                )}

                {classeJudicial && <span className="text-muted-foreground">{classeJudicial}</span>}

                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-medium text-foreground">{numeroProcesso}</span>
                  <CopyButton text={numeroProcesso} label="Copiar número do processo" />
                </div>

                <span className="truncate text-muted-foreground">{orgaoJulgador}</span>

                <div className="ml-0 flex items-center gap-2 sm:ml-auto">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Responsável
                  </span>
                  <ProcessoResponsavelCell processo={processo} usuarios={usuarios} onSuccess={() => {}} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            {dataProximaAudiencia && <ProximaAudienciaPopover dataAudiencia={dataProximaAudiencia} />}
            {instancias && instancias.length > 1 && (
              <span className="inline-flex items-center gap-1 rounded-full border bg-muted/20 px-2 py-1">
                <Layers className="h-3 w-3" />
                {instancias.length} instâncias
              </span>
            )}
            {duplicatasRemovidas !== undefined && duplicatasRemovidas > 0 && (
              <span>{duplicatasRemovidas} duplicatas removidas</span>
            )}
          </div>

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

      <div className="flex items-center gap-2 flex-wrap text-sm sm:hidden">
        {dataProximaAudiencia && <ProximaAudienciaPopover dataAudiencia={dataProximaAudiencia} />}
        {instancias && instancias.length > 1 && (
          <span className="inline-flex items-center gap-1 rounded-full border bg-muted/20 px-2.5 py-1 text-xs text-muted-foreground">
            <Layers className="h-3 w-3" />
            {instancias.length} instâncias
          </span>
        )}
      </div>

      {instancias && instancias.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap text-sm">
          {instancias.map((inst) => (
            <div key={inst.id} className="flex items-center gap-1.5 rounded-full border bg-muted/20 px-2.5 py-1">
              <SemanticBadge category="grau" value={inst.grau} className="text-[10px]">
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
