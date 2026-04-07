'use client';

/**
 * Color semantics:
 * - green-* (success, início de prazo, primeiro grau)
 * - orange-* (warnings, segundo grau)
 * - red-* (errors, fim de prazo)
 * - violet-* (tribunal superior)
 * - sky-* (tribunal badges)
 */

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { AppBadge } from '@/components/ui/app-badge';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { FileText, CheckCircle2, RotateCcw, Eye, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import { cn } from '@/lib/utils';
import { Expediente, GrauTribunal, GRAU_TRIBUNAL_LABELS } from '../domain';
import { actionAtualizarExpediente } from '../actions';
import { ExpedienteVisualizarDialog } from './expediente-visualizar-dialog';
import { ExpedientesBaixarDialog } from './expedientes-baixar-dialog';
import { ExpedientesReverterBaixaDialog } from './expedientes-reverter-baixa-dialog';
import { PdfViewerDialog } from './pdf-viewer-dialog';
import { DialogFormShell } from '@/components/shared/dialog-shell';
import { EditableTextCell } from '@/components/shared/data-shell';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getSemanticBadgeVariant } from '@/lib/design-system';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ExpedientesAlterarResponsavelDialog } from './expedientes-alterar-responsavel-dialog';
import { ParteBadge } from '@/components/ui/parte-badge';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { toast } from 'sonner';

// =============================================================================
// TYPES
// =============================================================================

import type { Usuario } from '@/app/(authenticated)/usuarios';

interface TipoExpediente {
  id: number;
  tipoExpediente: string;
}

// =============================================================================
// HELPER COMPONENTS (CELL RENDERERS)
// =============================================================================

// Função getTipoExpedienteColorClass removida.
// Agora usamos getSemanticBadgeVariant('expediente_tipo', tipoId) de @/lib/design-system

/**
 * Badge composto para Tribunal + Grau
 * Metade esquerda mostra o TRT (azul), metade direita mostra o Grau (cor por nível)
 * Baseado no padrão OabSituacaoBadge de representantes
 */
function TribunalGrauBadge({ trt, grau }: { trt: string; grau: GrauTribunal }) {
  const grauLabel = GRAU_TRIBUNAL_LABELS[grau] || grau;

  // Classes de cor baseadas no grau
  const grauColorClasses: Record<GrauTribunal, string> = {
    primeiro_grau: 'bg-success/15 text-success',
    segundo_grau: 'bg-warning/15 text-warning',
    tribunal_superior: 'bg-primary/15 text-primary',
  };

  return (
    <div className="inline-flex items-center text-xs font-medium shrink-0">
      {/* Tribunal (lado esquerdo - azul, arredondado à esquerda) */}
      <span className="bg-info/15 text-info px-2 py-0.5 rounded-l-full">
        {trt}
      </span>
      {/* Grau (lado direito - cor baseada no grau, arredondado à direita) */}
      <span className={cn(
        'px-2 py-0.5 border-l border-background/50 rounded-r-full',
        grauColorClasses[grau] || 'bg-muted text-muted-foreground'
      )}>
        {grauLabel}
      </span>
    </div>
  );
}

export function TipoDescricaoCell({
  expediente,
  onSuccessAction,
  tiposExpedientes = [],
  isLoadingTipos
}: {
  expediente: Expediente;
  onSuccessAction: () => void;
  tiposExpedientes?: TipoExpediente[];
  isLoadingTipos?: boolean;
}) {
  // Estados separados para cada interação
  const [isDescricaoDialogOpen, setIsDescricaoDialogOpen] = React.useState(false);
  const [isTipoPopoverOpen, setIsTipoPopoverOpen] = React.useState(false);
  const [isPdfViewerOpen, setIsPdfViewerOpen] = React.useState(false);

  const [isLoadingTipo, setIsLoadingTipo] = React.useState(false);
  const [isLoadingDescricao, setIsLoadingDescricao] = React.useState(false);

  const [descricao, setDescricao] = React.useState<string>(
    expediente.descricaoArquivos || ''
  );

  React.useEffect(() => {
    setDescricao(expediente.descricaoArquivos || '');
  }, [expediente.descricaoArquivos]);

  // Salvar apenas tipo
  const handleSaveTipo = async (tipoId: string) => {
    setIsLoadingTipo(true);
    try {
      const tipoExpedienteId = tipoId === 'null' ? null : parseInt(tipoId, 10);
      const formData = new FormData();
      if (tipoExpedienteId !== null) {
        formData.append('tipoExpedienteId', tipoExpedienteId.toString());
      } else {
        formData.append('tipoExpedienteId', '');
      }

      const result = await actionAtualizarExpediente(expediente.id, null, formData);
      if (!result.success) {
        throw new Error(result.message || 'Erro ao atualizar tipo');
      }
      setIsTipoPopoverOpen(false);
      toast.success('Tipo atualizado');
      onSuccessAction();
    } catch (error) {
      console.error('Erro ao atualizar tipo:', error);
      toast.error('Erro ao atualizar tipo do expediente');
    } finally {
      setIsLoadingTipo(false);
    }
  };

  // Salvar apenas descrição
  const handleSaveDescricao = async () => {
    setIsLoadingDescricao(true);
    try {
      const descricaoArquivos = descricao.trim() || null;
      const formData = new FormData();
      formData.append('descricaoArquivos', descricaoArquivos || '');

      const result = await actionAtualizarExpediente(expediente.id, null, formData);
      if (!result.success) {
        throw new Error(result.message || 'Erro ao atualizar descrição');
      }
      setIsDescricaoDialogOpen(false);
      toast.success('Descrição atualizada');
      onSuccessAction();
    } catch (error) {
      console.error('Erro ao atualizar descrição:', error);
      toast.error('Erro ao atualizar descrição do expediente');
    } finally {
      setIsLoadingDescricao(false);
    }
  };

  const tipoExpediente = tiposExpedientes?.find(t => t.id === expediente.tipoExpedienteId);
  const tipoNome = tipoExpediente ? tipoExpediente.tipoExpediente : 'Sem tipo';
  const descricaoExibicao = expediente.descricaoArquivos || '-';
  const temDocumento = !!expediente.arquivoKey;

  const badgeVariant = expediente.tipoExpedienteId
    ? getSemanticBadgeVariant('expediente_tipo', expediente.tipoExpedienteId)
    : 'outline';

  return (
    <>
      <div className="flex flex-col items-start gap-0.5 w-full">
        {/* Badge de tipo (clicável - abre popover) + ícone de documento */}
        <div className="flex items-center gap-1.5">
          <Popover open={isTipoPopoverOpen} onOpenChange={setIsTipoPopoverOpen}>
            <PopoverTrigger asChild>
              <button type="button" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded">
                {badgeVariant === 'outline' ? (
                  <AppBadge
                    variant="outline"
                    className="w-fit text-xs shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    {tipoNome}
                  </AppBadge>
                ) : (
                  <SemanticBadge
                    category="expediente_tipo"
                    value={expediente.tipoExpedienteId}
                    className="w-fit text-xs shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    {tipoNome}
                  </SemanticBadge>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="start" onInteractOutside={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Tipo de Expediente</p>
                <Select
                  value={expediente.tipoExpedienteId?.toString() || 'null'}
                  onValueChange={handleSaveTipo}
                  disabled={isLoadingTipo || tiposExpedientes.length === 0}
                >
                  <SelectTrigger className="w-full h-8 text-sm">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent className="max-h-50">
                    <SelectItem value="null">Sem tipo</SelectItem>
                    {tiposExpedientes.length > 0 ? (
                      tiposExpedientes.map((tipo) => (
                        <SelectItem key={tipo.id} value={tipo.id.toString()}>{tipo.tipoExpediente}</SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        {isLoadingTipos ? 'Carregando...' : 'Nenhum tipo'}
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </PopoverContent>
          </Popover>
          {temDocumento && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsPdfViewerOpen(true); }}
              className="p-1 hover:bg-accent rounded-md transition-colors"
              title="Visualizar documento"
            >
              <FileText className="h-3.5 w-3.5 text-primary" />
            </button>
          )}
        </div>

        {/* Descrição (clicável - abre dialog) */}
        <button
          type="button"
          onClick={() => setIsDescricaoDialogOpen(true)}
          className="text-xs text-muted-foreground w-full text-justify whitespace-pre-wrap leading-relaxed cursor-pointer hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded"
        >
          {descricaoExibicao}
        </button>
      </div>

      <DialogFormShell
        open={isDescricaoDialogOpen}
        onOpenChange={setIsDescricaoDialogOpen}
        title="Editar Descrição"
        maxWidth="md"
        footer={
          <Button onClick={handleSaveDescricao} disabled={isLoadingDescricao}>
            {isLoadingDescricao && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        }
      >
        <div className="py-2">
          <Textarea
            value={descricao}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescricao(e.target.value)}
            placeholder="Descreva o conteúdo do expediente..."
            className="resize-none"
            rows={5}
            disabled={isLoadingDescricao}
          />
        </div>
      </DialogFormShell>

      <PdfViewerDialog
        open={isPdfViewerOpen}
        onOpenChange={setIsPdfViewerOpen}
        fileKey={expediente.arquivoKey}
        documentTitle={`Documento - ${expediente.numeroProcesso}`}
      />
    </>
  );
}

/**
 * Badge composto para Prazo (Início + Fim)
 * Layout vertical: início em cima (verde), fim embaixo (vermelho)
 * Sem bordas, cores semânticas
 */
function PrazoBadge({ dataInicio, dataFim, baixado }: {
  dataInicio: string | null;
  dataFim: string | null;
  baixado: boolean;
}) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  // Se não tem nenhuma data, mostra placeholder
  if (!dataInicio && !dataFim) {
    return <span className="text-xs text-muted-foreground">-</span>;
  }

  const opacityClass = baixado ? 'opacity-50' : '';

  return (
    <div className={cn("inline-flex flex-col items-center text-xs font-medium shrink-0 gap-0.5", opacityClass)}>
      {/* Data Início (verde - arredondado) */}
      <span className="bg-success/15 text-success px-2 py-0.5 rounded-full">
        {formatDate(dataInicio)}
      </span>
      {/* Data Fim (vermelho - arredondado) */}
      <span className="bg-destructive/15 text-destructive px-2 py-0.5 rounded-full">
        {formatDate(dataFim)}
      </span>
    </div>
  );
}

export function PrazoCell({ expediente }: { expediente: Expediente }) {
  const baixado = !!expediente.baixadoEm;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <PrazoBadge
        dataInicio={expediente.dataCienciaParte}
        dataFim={expediente.dataPrazoLegalParte}
        baixado={baixado}
      />
      {baixado && (
        <span className="text-xs text-muted-foreground">
          (Baixado)
        </span>
      )}
    </div>
  );
}

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ResponsavelCell({ expediente, usuarios = [], onSuccessAction }: { expediente: Expediente; usuarios?: Usuario[]; onSuccessAction?: () => void }) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const responsavel = usuarios.find(u => u.id === expediente.responsavelId);
  const nomeExibicao = responsavel?.nomeExibicao || '-';
  const handleSuccess = React.useCallback(() => {
    onSuccessAction?.();
  }, [onSuccessAction]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsDialogOpen(true)}
        className="flex items-center justify-start gap-2 text-sm w-full min-w-0 hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded px-1 -mx-1 cursor-pointer"
        title={nomeExibicao !== '-' ? `Clique para alterar responsável: ${nomeExibicao}` : 'Clique para atribuir responsável'}
      >
        {responsavel ? (
          <>
            <Avatar size="sm">
              <AvatarImage src={responsavel.avatarUrl || undefined} alt={responsavel.nomeExibicao} />
              <AvatarFallback className="text-[10px] font-medium">
                {getInitials(responsavel.nomeExibicao)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{responsavel.nomeExibicao}</span>
          </>
        ) : (
          <span className="text-muted-foreground">Sem responsável</span>
        )}
      </button>

      <ExpedientesAlterarResponsavelDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        expediente={expediente}
        usuarios={usuarios}
        onSuccess={handleSuccess}
      />
    </>
  );
}

export function ObservacoesCell({ expediente, onSuccessAction }: { expediente: Expediente; onSuccessAction: () => void }) {
  const handleSave = async (newText: string) => {
    try {
      const formData = new FormData();
      formData.append('observacoes', newText);
      const result = await actionAtualizarExpediente(expediente.id, null, formData);
      if (result.success) {
        onSuccessAction();
      } else {
        throw new Error(result.message || 'Erro ao atualizar observações');
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  return (
    <EditableTextCell
      value={expediente.observacoes}
      onSave={handleSave}
      title="Observações"
      placeholder="Adicione observações aqui..."
    />
  );
}

// =============================================================================
// ACTIONS COLUMN
// =============================================================================

export function ExpedienteActions({
  expediente,
  onSuccessAction,
  usuarios,
  tiposExpedientes,
}: {
  expediente: Expediente;
  onSuccessAction: () => void;
  usuarios: Usuario[];
  tiposExpedientes: TipoExpediente[];
}) {
  const [showVisualizar, setShowVisualizar] = React.useState(false);
  const [showBaixar, setShowBaixar] = React.useState(false);
  const [showReverter, setShowReverter] = React.useState(false);

  return (
    <>
      <ButtonGroup>
        {/* Visualizar */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon" aria-label="Visualizar"
              className="h-8 w-8"
              onClick={() => setShowVisualizar(true)}
            >
              <Eye className="h-4 w-4" />
              <span className="sr-only">Visualizar</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Visualizar</TooltipContent>
        </Tooltip>

        {/* Baixar (se não baixado) */}
        {!expediente.baixadoEm && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon" aria-label="Baixar Expediente"
                className="h-8 w-8 text-success hover:text-success"
                onClick={() => setShowBaixar(true)}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span className="sr-only">Baixar Expediente</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Baixar Expediente</TooltipContent>
          </Tooltip>
        )}

        {/* Reverter (se baixado) */}
        {expediente.baixadoEm && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon" aria-label="Reverter Baixa"
                className="h-8 w-8 text-warning hover:text-warning"
                onClick={() => setShowReverter(true)}
              >
                <RotateCcw className="h-4 w-4" />
                <span className="sr-only">Reverter Baixa</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reverter Baixa</TooltipContent>
          </Tooltip>
        )}
      </ButtonGroup>

      <ExpedienteVisualizarDialog
        open={showVisualizar}
        onOpenChange={setShowVisualizar}
        expediente={expediente}
        usuarios={usuarios}
        tiposExpedientes={tiposExpedientes.map(t => ({ 
          id: t.id, 
          tipoExpediente: t.tipoExpediente,
          createdBy: 0,
          createdAt: '',
          updatedAt: ''
        })) as import('@/app/(authenticated)/tipos-expedientes').TipoExpediente[]}
      />

      <ExpedientesBaixarDialog
        open={showBaixar}
        onOpenChange={setShowBaixar}
        expediente={expediente}
        onSuccess={onSuccessAction}
      />

      <ExpedientesReverterBaixaDialog
        open={showReverter}
        onOpenChange={setShowReverter}
        expediente={expediente}
        onSuccess={onSuccessAction}
      />
    </>
  );
}

// =============================================================================
// COLUMN DEFINITIONS
// =============================================================================

export interface ExpedientesTableMeta {
  usuarios: Usuario[];
  tiposExpedientes: TipoExpediente[];
  onSuccessAction: () => void;
}

export const columns: ColumnDef<Expediente>[] = [
  // 1. Prazo (badge vertical: início verde em cima, fim vermelho embaixo)
  {
    accessorKey: "dataPrazoLegalParte",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Prazo" />
    ),
    meta: {
      align: 'left' as const,
      headerLabel: 'Prazo',
    },
    cell: ({ row }) => (
      <div className="flex items-center py-2">
        <PrazoCell expediente={row.original} />
      </div>
    ),
    size: 100,
    enableSorting: true,
  },
  // 2. Expediente (tipo + descrição)
  {
    accessorKey: "tipoDescricao",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Expediente" />
    ),
    meta: {
      align: 'left' as const,
      headerLabel: 'Expediente',
    },
    cell: ({ row, table }) => {
      const meta = table.options.meta as ExpedientesTableMeta;
      return (
        <div className="flex items-center py-2">
          <TipoDescricaoCell
            expediente={row.original}
            onSuccessAction={meta?.onSuccessAction || (() => { })}
            tiposExpedientes={meta?.tiposExpedientes || []}
          />
        </div>
      );
    },
    size: 280,
    enableSorting: true,
  },
  // 3. Processo (coluna composta: Tribunal+Grau, Classe+Número, Órgão Julgador, Partes)
  {
    id: "processo",
    accessorKey: "numeroProcesso",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Processo" />
    ),
    meta: {
      align: 'left' as const,
      headerLabel: 'Processo',
    },
    cell: ({ row }) => {
      const e = row.original;
      return (
        <div className="flex flex-col gap-1.5 items-start py-2 max-w-[min(92vw,20rem)] min-w-0">
          {/* Linha 1: Badge Tribunal + Grau */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <TribunalGrauBadge trt={e.trt} grau={e.grau} />
          </div>

          {/* Linha 2: Número do processo */}
          <span className="text-xs font-mono font-medium text-foreground break-all" title={e.numeroProcesso}>
            {e.numeroProcesso}
          </span>

          {/* Partes com badges de polo */}
          <div className="flex flex-col gap-0.5">
            <ParteBadge
              polo="ATIVO"
              className="flex whitespace-normal wrap-break-word text-left font-normal text-xs"
            >
              {e.nomeParteAutoraOrigem || e.nomeParteAutora || '-'}
            </ParteBadge>
            <ParteBadge
              polo="PASSIVO"
              className="flex whitespace-normal wrap-break-word text-left font-normal text-xs"
            >
              {e.nomeParteReOrigem || e.nomeParteRe || '-'}
            </ParteBadge>
          </div>
        </div>
      );
    },
    size: 300,
    enableSorting: true,
  },
  // 4. Observações
  {
    accessorKey: "observacoes",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Observações" />
    ),
    meta: {
      align: 'left' as const,
      headerLabel: 'Observações',
    },
    cell: ({ row, table }) => {
      const meta = table.options.meta as ExpedientesTableMeta;
      return (
        <div className="flex items-center py-2">
          <ObservacoesCell expediente={row.original} onSuccessAction={meta?.onSuccessAction} />
        </div>
      );
    },
    size: 180,
    enableSorting: true,
  },
  // 5. Responsável
  {
    id: "responsavel",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Responsável" />
    ),
    meta: {
      align: 'left' as const,
      headerLabel: 'Responsável',
    },
    cell: ({ row, table }) => {
      const meta = table.options.meta as ExpedientesTableMeta;
      return (
        <div className="flex items-center py-2">
          <ResponsavelCell expediente={row.original} usuarios={meta?.usuarios} onSuccessAction={meta?.onSuccessAction} />
        </div>
      );
    },
    size: 200,
    enableSorting: false,
  },
  // 6. Ações
  {
    id: "actions",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ações" />
    ),
    meta: {
      align: 'left' as const,
      headerLabel: 'Ações',
    },
    cell: ({ row, table }) => {
      const meta = table.options.meta as ExpedientesTableMeta;
      return (
        <div className="flex items-center py-2">
          <ExpedienteActions
            expediente={row.original}
            onSuccessAction={meta?.onSuccessAction}
            usuarios={meta?.usuarios}
            tiposExpedientes={meta?.tiposExpedientes}
          />
        </div>
      );
    },
    size: 100,
    enableSorting: false,
    enableHiding: false,
  },
];
