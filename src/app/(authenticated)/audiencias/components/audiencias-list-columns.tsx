'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, Pencil, FileText, ExternalLink, MessageSquareText, Loader2, Check, Copy, MapPin } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ParteBadge } from '@/components/ui/parte-badge';

import { Input } from '@/components/ui/input';
import type { Audiencia, EnderecoPresencial, GrauTribunal } from '../domain';
import { GRAU_TRIBUNAL_LABELS, ModalidadeAudiencia, StatusAudiencia } from '../domain';
import { AudienciaStatusBadge } from './audiencia-status-badge';
import { AudienciaModalidadeBadge } from './audiencia-modalidade-badge';
import { Textarea } from '@/components/ui/textarea';
import { AudienciasAlterarResponsavelDialog } from './audiencias-alterar-responsavel-dialog';
import { actionAtualizarObservacoes, actionAtualizarUrlVirtual, actionAtualizarEnderecoPresencial } from '../actions';

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

/**
 * Botão de Ata de Audiência
 * Aparece apenas para audiências realizadas que possuem ata disponível
 */
function AtaAudienciaButton({ audiencia }: { audiencia: AudienciaComResponsavel }) {
  const isRealizada = audiencia.status === StatusAudiencia.Finalizada;
  const hasAta = audiencia.ataAudienciaId || audiencia.urlAtaAudiencia;

  if (!isRealizada || !hasAta) {
    return null;
  }

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon" aria-label="Ver ata de audiência"
              className="h-6 w-6 text-success hover:text-success hover:bg-success/15"
            >
              <FileText className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Ata de Audiência</TooltipContent>
      </Tooltip>
      <PopoverContent className="w-72 p-4" align="start">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-success" />
            <h4 className="font-semibold text-sm">Ata de Audiência</h4>
          </div>
          <p className="text-xs text-muted-foreground">
            A ata desta audiência está disponível para visualização.
          </p>
          {audiencia.urlAtaAudiencia ? (
            <Button variant="outline" size="sm" className="w-full" asChild>
              <a
                href={audiencia.urlAtaAudiencia}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Abrir Ata
              </a>
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Ata registrada (ID: {audiencia.ataAudienciaId})
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Badge composto para Tribunal + Grau
 * Metade esquerda mostra o TRT (azul), metade direita mostra o Grau (cor por nível)
 * Baseado no padrão de expedientes
 */
function TribunalGrauBadge({ trt, grau }: { trt: string; grau: GrauTribunal }) {
  const grauLabel = GRAU_TRIBUNAL_LABELS[grau] || grau;

  // Classes de cor baseadas no grau
  const grauColorClasses: Record<GrauTribunal, string> = {
    primeiro_grau: 'bg-success/15 text-success',
    segundo_grau: 'bg-warning/15 text-warning',
    tribunal_superior: 'bg-violet-500/15 text-violet-700 dark:text-violet-400',
  };

  return (
    <div className="inline-flex items-center text-xs font-medium shrink-0">
      {/* Tribunal (lado esquerdo - azul, arredondado à esquerda) */}
      <span className="bg-sky-500/15 text-sky-700 dark:text-sky-400 px-2 py-0.5 rounded-l-full">
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

// Types
export interface AudienciaComResponsavel extends Audiencia {
  responsavelNome?: string | null;
  responsavelAvatar?: string | null;
}

interface Usuario {
  id: number;
  nomeExibicao?: string;
  nomeCompleto?: string;
  avatarUrl?: string | null;
}

// =============================================================================
// OBSERVAÇÕES CELL - Edição inline via Popover
// =============================================================================

function ObservacoesCell({
  audiencia,
  onSuccessAction,
}: {
  audiencia: AudienciaComResponsavel;
  onSuccessAction?: () => void;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [value, setValue] = React.useState(audiencia.observacoes || '');
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setValue(audiencia.observacoes || '');
    }
  }, [isOpen, audiencia.observacoes]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const obs = value.trim() || null;
      const result = await actionAtualizarObservacoes(audiencia.id, obs);
      if (result.success) {
        setIsOpen(false);
        onSuccessAction?.();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const hasObservacoes = !!audiencia.observacoes?.trim();

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'text-sm w-full min-w-0 text-left rounded px-1 -mx-1 transition-colors',
            'hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
            hasObservacoes ? 'text-foreground' : 'text-muted-foreground'
          )}
          title={hasObservacoes ? audiencia.observacoes! : 'Clique para adicionar observações'}
        >
          {hasObservacoes ? (
            <span className="whitespace-normal wrap-break-word">{audiencia.observacoes}</span>
          ) : (
            <span className="italic">Sem observações</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquareText className="h-4 w-4 text-primary" />
            <h4 className="font-semibold text-sm">Observações</h4>
          </div>
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Adicionar observações..."
            className="min-h-25 resize-y"
            disabled={isSaving}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <Check className="mr-1 h-3 w-3" />
              )}
              Salvar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// =============================================================================
// MODALIDADE CELL - Badge clicável com Popover para link/endereço
// =============================================================================

function formatEndereco(endereco: EnderecoPresencial): string {
  const parts = [
    endereco.logradouro,
    endereco.numero,
    endereco.complemento,
    endereco.bairro,
    `${endereco.cidade} - ${endereco.uf}`,
    endereco.cep ? `CEP: ${endereco.cep}` : null,
  ].filter(Boolean);
  return parts.join(', ');
}

function ModalidadeCell({
  audiencia,
  onSuccessAction,
}: {
  audiencia: AudienciaComResponsavel;
  onSuccessAction?: () => void;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [urlValue, setUrlValue] = React.useState(audiencia.urlAudienciaVirtual || '');
  const [enderecoValue, setEnderecoValue] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const isVirtual = audiencia.modalidade === ModalidadeAudiencia.Virtual || audiencia.modalidade === ModalidadeAudiencia.Hibrida;
  const isPresencial = audiencia.modalidade === ModalidadeAudiencia.Presencial || audiencia.modalidade === ModalidadeAudiencia.Hibrida;

  React.useEffect(() => {
    if (isOpen) {
      setUrlValue(audiencia.urlAudienciaVirtual || '');
      setEnderecoValue(
        audiencia.enderecoPresencial ? formatEndereco(audiencia.enderecoPresencial) : ''
      );
      setCopied(false);
    }
  }, [isOpen, audiencia.urlAudienciaVirtual, audiencia.enderecoPresencial]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveUrl = async () => {
    setIsSaving(true);
    try {
      const url = urlValue.trim() || null;
      const result = await actionAtualizarUrlVirtual(audiencia.id, url);
      if (result.success) {
        onSuccessAction?.();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEndereco = async () => {
    setIsSaving(true);
    try {
      // Para endereço, só suportamos texto livre formatado como logradouro
      // (endereço completo fica no formulário de edição da audiência)
      const texto = enderecoValue.trim();
      const endereco: EnderecoPresencial | null = texto
        ? { logradouro: texto, numero: '', bairro: '', cidade: '', uf: '', cep: '' }
        : null;
      const result = await actionAtualizarEnderecoPresencial(audiencia.id, endereco);
      if (result.success) {
        onSuccessAction?.();
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Determinar o que mostrar baseado na modalidade
  const _currentValue = isVirtual
    ? audiencia.urlAudienciaVirtual
    : audiencia.enderecoPresencial
      ? formatEndereco(audiencia.enderecoPresencial)
      : null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded">
          <AudienciaModalidadeBadge modalidade={audiencia.modalidade} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="space-y-3">
          {/* Seção Virtual */}
          {isVirtual && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-primary" />
                Link da Audiência Virtual
              </h4>
              {audiencia.urlAudienciaVirtual ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <a
                      href={audiencia.urlAudienciaVirtual}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary underline truncate flex-1"
                      title={audiencia.urlAudienciaVirtual}
                    >
                      {audiencia.urlAudienciaVirtual}
                    </a>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon" aria-label="Confirmar"
                          className="h-7 w-7 shrink-0"
                          onClick={() => copyToClipboard(audiencia.urlAudienciaVirtual!)}
                        >
                          {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{copied ? 'Copiado!' : 'Copiar link'}</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ) : null}
              <Input
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                placeholder="https://..."
                className="h-8 text-xs"
                disabled={isSaving}
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} disabled={isSaving}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleSaveUrl} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Check className="mr-1 h-3 w-3" />}
                  Salvar
                </Button>
              </div>
            </div>
          )}

          {/* Seção Presencial */}
          {isPresencial && (
            <div className="space-y-2">
              {isVirtual && <div className="border-t pt-3" />}
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Endereço Presencial
              </h4>
              {audiencia.enderecoPresencial ? (
                <div className="flex items-start gap-2">
                  <p className="text-xs text-muted-foreground flex-1">
                    {formatEndereco(audiencia.enderecoPresencial)}
                  </p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon" aria-label="Confirmar"
                        className="h-7 w-7 shrink-0"
                        onClick={() => copyToClipboard(formatEndereco(audiencia.enderecoPresencial!))}
                      >
                        {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{copied ? 'Copiado!' : 'Copiar endereço'}</TooltipContent>
                  </Tooltip>
                </div>
              ) : null}
              <Textarea
                value={enderecoValue}
                onChange={(e) => setEnderecoValue(e.target.value)}
                placeholder="Endereço completo..."
                className="min-h-16 resize-y text-xs"
                disabled={isSaving}
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} disabled={isSaving}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleSaveEndereco} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Check className="mr-1 h-3 w-3" />}
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// =============================================================================
// RESPONSÁVEL CELL - Edição inline
// =============================================================================

function getUsuarioNome(u: Usuario): string {
  return u.nomeExibicao || u.nomeCompleto || `Usuário ${u.id}`;
}

export function ResponsavelCell({
  audiencia,
  usuarios = [],
  onSuccessAction,
}: {
  audiencia: AudienciaComResponsavel;
  usuarios?: Usuario[];
  onSuccessAction?: () => void;
}) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const responsavel = usuarios.find((u) => u.id === audiencia.responsavelId);
  const nomeExibicao = responsavel ? getUsuarioNome(responsavel) : audiencia.responsavelNome || '-';

  return (
    <>
      <button
        type="button"
        onClick={() => setIsDialogOpen(true)}
        className="flex items-center justify-start gap-2 text-sm w-full min-w-0 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded px-1 -mx-1 cursor-pointer"
        title={nomeExibicao !== '-' ? `Clique para alterar responsável: ${nomeExibicao}` : 'Clique para atribuir responsável'}
      >
        {responsavel || audiencia.responsavelId ? (
          <>
            <Avatar size="sm">
              <AvatarImage src={responsavel?.avatarUrl || undefined} alt={nomeExibicao} />
              <AvatarFallback className="text-[10px] font-medium">
                {getInitials(nomeExibicao)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{nomeExibicao}</span>
          </>
        ) : (
          <span className="text-muted-foreground">Sem responsável</span>
        )}
      </button>

      <AudienciasAlterarResponsavelDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        audiencia={audiencia}
        usuarios={usuarios}
        onSuccess={() => {
          onSuccessAction?.();
        }}
      />
    </>
  );
}

// Actions Component
function AudienciaActions({
  audiencia,
  onView,
  onEdit,
}: {
  audiencia: AudienciaComResponsavel;
  onView: (audiencia: AudienciaComResponsavel) => void;
  onEdit: (audiencia: AudienciaComResponsavel) => void;
}) {
  return (
    <ButtonGroup>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon" aria-label="Visualizar audiência"
            className="h-8 w-8"
            onClick={() => onView(audiencia)}
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">Visualizar audiência</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Visualizar</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon" aria-label="Editar audiência"
            className="h-8 w-8"
            onClick={() => onEdit(audiencia)}
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Editar audiência</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Editar</TooltipContent>
      </Tooltip>
    </ButtonGroup>
  );
}

// Helper functions
function formatarDataHora(dataISO: string): string {
  try {
    const data = new Date(dataISO);
    return format(data, 'dd/MM/yyyy HH:mm', { locale: ptBR });
  } catch {
    return '-';
  }
}

function getInitials(name: string | null | undefined): string {
  if (!name) return 'SR';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Factory function for columns
export function getAudienciasColumns(
  onView: (audiencia: AudienciaComResponsavel) => void,
  onEdit: (audiencia: AudienciaComResponsavel) => void
): ColumnDef<AudienciaComResponsavel>[] {
  return [
    {
      accessorKey: 'dataInicio',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Data/Hora" />
      ),
      meta: {
        align: 'left' as const,
        headerLabel: 'Data/Hora',
      },
      size: 160,
      cell: ({ row }) => {
        const audiencia = row.original;
        const hasAta = audiencia.status === StatusAudiencia.Finalizada &&
          (audiencia.ataAudienciaId || audiencia.urlAtaAudiencia);

        return (
          <div className="flex items-start gap-2 py-2">
            {/* Botão de Ata (aparece apenas se disponível) */}
            {hasAta && <AtaAudienciaButton audiencia={audiencia} />}

            <div className="flex flex-col items-start gap-1.5">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {formatarDataHora(audiencia.dataInicio)}
              </span>
              {audiencia.status && (
                <AudienciaStatusBadge status={audiencia.status} />
              )}
            </div>
          </div>
        );
      },
      enableSorting: true,
    },
    // Coluna composta: Processo (igual ao padrão de Expedientes)
    {
      id: 'processo',
      accessorKey: 'numeroProcesso',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Processo" />
      ),
      meta: {
        align: 'left' as const,
        headerLabel: 'Processo',
      },
      size: 300,
      cell: ({ row }) => {
        const a = row.original;
        return (
          <div className="flex flex-col gap-1.5 items-start py-2 max-w-[min(92vw,20rem)] min-w-0">
            {/* Linha 1: Badge Tribunal + Grau */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <TribunalGrauBadge trt={a.trt} grau={a.grau} />
            </div>

            {/* Linha 2: Número do processo */}
            <span className="text-xs font-mono font-medium text-foreground break-all" title={a.numeroProcesso}>
              {a.numeroProcesso}
            </span>

            {/* Partes com badges de polo */}
            <div className="flex flex-col gap-0.5">
              <ParteBadge
                polo="ATIVO"
                className="flex whitespace-normal wrap-break-word text-left font-normal text-xs"
              >
                {a.poloAtivoOrigem || a.poloAtivoNome || '-'}
              </ParteBadge>
              <ParteBadge
                polo="PASSIVO"
                className="flex whitespace-normal wrap-break-word text-left font-normal text-xs"
              >
                {a.poloPassivoOrigem || a.poloPassivoNome || '-'}
              </ParteBadge>
            </div>
          </div>
        );
      },
      enableSorting: true,
    },
    {
      id: 'detalhes',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Detalhes" />
      ),
      meta: {
        align: 'left' as const,
        headerLabel: 'Detalhes',
      },
      size: 220,
      cell: ({ row, table }) => {
        const audiencia = row.original;
        const meta = table.options.meta as { onSuccessAction?: () => void } | undefined;
        const onSuccessAction = meta?.onSuccessAction;

        return (
          <div className="flex flex-col gap-1.5 py-2 min-w-0">
            {/* Modalidade - clicável com popover para link/endereço */}
            {audiencia.modalidade ? (
              <ModalidadeCell audiencia={audiencia} onSuccessAction={onSuccessAction} />
            ) : null}
            {/* Tipo segundo */}
            {audiencia.tipoDescricao ? (
              <span className="text-sm text-muted-foreground whitespace-normal wrap-break-word">
                {audiencia.tipoDescricao}
              </span>
            ) : null}
            {/* Fallback se ambos estiverem vazios */}
            {!audiencia.modalidade && !audiencia.tipoDescricao && (
              <span className="text-sm text-muted-foreground">-</span>
            )}
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: 'observacoes',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Observações" />
      ),
      meta: {
        align: 'left' as const,
        headerLabel: 'Observações',
      },
      size: 220,
      cell: ({ row, table }) => {
        const audiencia = row.original;
        const meta = table.options.meta as { onSuccessAction?: () => void } | undefined;
        const onSuccessAction = meta?.onSuccessAction;

        return (
          <div className="py-2">
            <ObservacoesCell
              audiencia={audiencia}
              onSuccessAction={onSuccessAction}
            />
          </div>
        );
      },
      enableSorting: false,
    },
    {
      id: 'responsavel',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Responsável" />
      ),
      meta: {
        align: 'left' as const,
        headerLabel: 'Responsável',
      },
      size: 200,
      cell: ({ row, table }) => {
        const audiencia = row.original;
        const meta = table.options.meta as { usuarios?: Usuario[]; onSuccessAction?: () => void } | undefined;
        const usuarios = meta?.usuarios || [];
        const onSuccessAction = meta?.onSuccessAction;

        return (
          <div className="flex items-center py-2">
            <ResponsavelCell
              audiencia={audiencia}
              usuarios={usuarios}
              onSuccessAction={onSuccessAction}
            />
          </div>
        );
      },
      enableSorting: false,
    },
    {
      id: 'actions',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Ações" />
      ),
      meta: {
        align: 'left' as const,
        headerLabel: 'Ações',
      },
      size: 100,
      cell: ({ row }) => (
        <div className="flex items-center py-2">
          <AudienciaActions
            audiencia={row.original}
            onView={onView}
            onEdit={onEdit}
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
