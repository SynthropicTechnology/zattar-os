/**
 * Header do Processo
 *
 * Exibe metadados completos do processo seguindo a mesma organização
 * da coluna "Processo" na tabela de processos.
 * Suporta exibição de múltiplas instâncias (unificado).
 */

'use client';

import React from 'react';
import { Lock, Layers, RefreshCw } from 'lucide-react';
import type { ProcessoUnificado, Processo } from '@/features/processos/domain';
import type { GrauProcesso } from '@/features/partes';
import { Card } from '@/components/ui/card';
import { AppBadge } from '@/components/ui/app-badge';
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
  totalMovimentosProprios?: number; // Apenas movimentos próprios (sem mala direta)
}

interface ProcessoHeaderProps {
  processo: ProcessoUnificado;
  /** Instâncias do processo (quando usando timeline unificada) */
  instancias?: InstanciaInfo[];
  /** Quantidade de duplicatas removidas na timeline */
  duplicatasRemovidas?: number;
  /** Função para atualizar timeline */
  onAtualizarTimeline?: () => void;
  /** Se está capturando timeline */
  isCapturing?: boolean;
}

/**
 * Retorna o órgão julgador do processo de forma segura
 */
function getOrgaoJulgador(processo: ProcessoUnificado): string {
  return processo.descricaoOrgaoJulgador || '-';
}

/**
 * Formata grau para exibição
 */
function formatarGrau(grau: string): string {
  return GRAU_LABELS[grau as keyof typeof GRAU_LABELS] || grau;
}

/**
 * Formata grau com ordinal para exibição nas instâncias
 */
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

/**
 * Retorna as iniciais do nome para o Avatar
 */
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
}

/**
 * Célula de Responsável (similar à tabela)
 */
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

  // Atualizar processo local quando o processo prop mudar
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
        className="flex items-center gap-2 text-sm w-full min-w-0 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded px-1 -mx-1"
        title={responsavel ? `Clique para alterar responsável: ${nomeExibicao}` : 'Clique para atribuir responsável'}
      >
        {responsavel ? (
          <>
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarImage src={responsavel.avatarUrl || undefined} alt={responsavel.nomeExibicao} />
              <AvatarFallback className="text-xs font-medium">
                {getInitials(responsavel.nomeExibicao)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{responsavel.nomeExibicao}</span>
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

export function ProcessoHeader({ processo, instancias, duplicatasRemovidas, onAtualizarTimeline, isCapturing }: ProcessoHeaderProps) {
  const [usuarios, setUsuarios] = React.useState<Usuario[]>([]);

  // Buscar usuários para mostrar nome do responsável
  React.useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const result = await actionListarUsuarios({ ativo: true, limite: 100 });
        if (result.success && result.data?.usuarios) {
          const usuariosList = (result.data.usuarios as Array<{ id: number; nomeExibicao?: string; nome_exibicao?: string; nome?: string }>).map((u) => ({
            id: u.id,
            nomeExibicao: u.nomeExibicao || u.nome_exibicao || u.nome || `Usuário ${u.id}`,
          }));
          setUsuarios(usuariosList);
        }
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
      }
    };
    fetchUsuarios();
  }, []);

  // FONTE DA VERDADE: Usar trtOrigem (1º grau) ao invés de trt (grau atual)
  const trt = processo.trtOrigem || processo.trt;
  const classeJudicial = processo.classeJudicial || '';
  const numeroProcesso = processo.numeroProcesso;
  const orgaoJulgador = getOrgaoJulgador(processo);
  const segredoJustica = processo.segredoJustica;
  const dataProximaAudiencia = processo.dataProximaAudiencia;
  const isUnificado = isProcessoUnificado(processo);

  // FONTE DA VERDADE: Usar nomes do 1º grau para evitar inversão por recursos
  const parteAutora = processo.nomeParteAutoraOrigem || processo.nomeParteAutora || '-';
  const parteRe = processo.nomeParteReOrigem || processo.nomeParteRe || '-';

  return (
    <Card className="p-6 relative">
      {/* Botão de atualizar timeline (canto superior direito) */}
      {onAtualizarTimeline && (
        <div className="absolute top-4 right-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={onAtualizarTimeline}
                  disabled={isCapturing}
                  className="h-8 w-8"
                >
                  <RefreshCw className={`h-4 w-4 ${isCapturing ? 'animate-spin' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Atualizar timeline do processo</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {/* Primeiro Grupo: Badges, Classe+Número, Órgão (com espaçamento compacto) */}
      <div className="space-y-1.5">
        {/* Linha 1: Badge Tribunal + Badges Graus */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <SemanticBadge category="tribunal" value={trt} className="w-fit text-xs">
            {trt}
          </SemanticBadge>
          {isUnificado && processo.grausAtivos ? (
            <GrauBadgesSimple grausAtivos={processo.grausAtivos} />
          ) : (
            processo.grauAtual && (
              <SemanticBadge category="grau" value={processo.grauAtual} className="w-fit text-xs">
                {formatarGrau(processo.grauAtual)}
              </SemanticBadge>
            )
          )}
        </div>

        {/* Linha 2: Classe Judicial (texto) + Número Processo + CopyButton + Ícone Segredo Justiça */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight whitespace-nowrap">
            {classeJudicial && `${classeJudicial} `}
            {numeroProcesso}
          </h1>
          <CopyButton text={numeroProcesso} label="Copiar número do processo" />
          {segredoJustica && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Lock className="h-5 w-5 text-destructive" />
                </TooltipTrigger>
                <TooltipContent>Segredo de Justiça</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Linha 3: Órgão Julgador + Popover Próxima Audiência */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm text-muted-foreground max-w-full truncate">{orgaoJulgador}</span>
          <ProximaAudienciaPopover dataAudiencia={dataProximaAudiencia} />
        </div>
      </div>

      {/* Segundo Grupo: Partes + Responsável (com espaçamento maior antes) */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Partes */}
        <div className="flex flex-col gap-1.5">
          <AppBadge
            variant="secondary"
            className="block whitespace-normal wrap-break-word text-left font-normal bg-blue-100 text-blue-700 hover:bg-blue-200 border-none text-sm"
          >
            {parteAutora}
          </AppBadge>
          <AppBadge
            variant="secondary"
            className="block whitespace-normal wrap-break-word text-left font-normal bg-red-100 text-red-700 hover:bg-red-200 border-none text-sm"
          >
            {parteRe}
          </AppBadge>
        </div>

        {/* Responsável */}
        <div className="flex items-center">
          <ProcessoResponsavelCell processo={processo} usuarios={usuarios} onSuccess={() => { }} />
        </div>
      </div>

      {/* Instâncias do Processo (modo unificado) */}
      {instancias && instancias.length > 1 && (
        <>
          <Separator className="my-4" />
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">
                Instâncias do Processo ({instancias.length})
              </h3>
              {duplicatasRemovidas !== undefined && duplicatasRemovidas > 0 && (
                <AppBadge variant="outline" className="text-xs">
                  {duplicatasRemovidas} eventos duplicados removidos
                </AppBadge>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {instancias.map((inst) => (
                <div
                  key={inst.id}
                  className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2"
                >
                  <SemanticBadge category="grau" value={inst.grau}>
                    {formatarGrauComOrdinal(inst.grau)}
                  </SemanticBadge>
                  <span className="text-xs font-medium">
                    {inst.totalMovimentosProprios ?? inst.totalItensOriginal} movimentos
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
