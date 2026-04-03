'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { DataPagination, DataShell, DataTable, DataTableToolbar } from '@/components/shared/data-shell';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Button, buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import { FilterPopover } from '@/app/(authenticated)/partes';
import { TIPOS_CAPTURA, STATUS_CAPTURA } from './captura-filters';
import { useCapturasLog } from '../hooks/use-capturas-log';
import { useAdvogadosMap } from '../hooks/use-advogados-map';
import { useCredenciaisMap } from '../hooks/use-credenciais-map';
import { deletarCapturaLog } from '@/app/(authenticated)/captura/services/api-client';
import type { ColumnDef, RowSelectionState, Table as TanstackTable } from '@tanstack/react-table';
import type { CapturaLog, TipoCaptura, StatusCaptura } from '@/app/(authenticated)/captura/types';
import type { CodigoTRT } from '@/app/(authenticated)/captura';
import { Eye, Settings, Trash2 } from 'lucide-react';
import { getSemanticBadgeVariant, CAPTURA_STATUS_LABELS } from '@/lib/design-system';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

/**
 * Formata data e hora ISO para formato brasileiro (DD/MM/YYYY HH:mm)
 */
const formatarDataHora = (dataISO: string | null): string => {
  if (!dataISO) return '-';
  try {
    const data = new Date(dataISO);
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
};

/**
 * Formata tipo de captura para exibição
 */
const formatarTipoCaptura = (tipo: TipoCaptura): string => {
  const tipos: Record<TipoCaptura, string> = {
    acervo_geral: 'Acervo Geral',
    arquivados: 'Arquivados',
    audiencias: 'Audiências',
    pendentes: 'Expedientes',
    partes: 'Partes',
    combinada: 'Combinada',
    timeline: 'Timeline',
    audiencias_designadas: 'Audiências Designadas',
    audiencias_realizadas: 'Audiências Realizadas',
    audiencias_canceladas: 'Audiências Canceladas',
    expedientes_no_prazo: 'Expedientes no Prazo',
    expedientes_sem_prazo: 'Expedientes sem Prazo',
    pericias: 'Perícias',
  };
  return tipos[tipo] || tipo;
};

/**
 * Retorna badge de status com cor apropriada usando o sistema semântico.
 *
 * @ai-context Este componente usa getSemanticBadgeVariant() do design system.
 */
const StatusBadge = ({ status }: { status: StatusCaptura }) => {
  const variant = getSemanticBadgeVariant('captura_status', status);
  const label = CAPTURA_STATUS_LABELS[status] || status;

  return <Badge variant={variant}>{label}</Badge>;
};

/**
 * Formata grau para exibição curta
 */
const formatarGrauCurto = (grau: string | undefined | null): string => {
  if (!grau) return '1G'; // Fallback para primeiro grau se undefined/null
  if (grau === '1' || grau === 'primeiro_grau') return '1G';
  if (grau === '2' || grau === 'segundo_grau') return '2G';
  return grau;
};

/**
 * Extrai informações de tribunais/graus que tiveram erro do campo resultado
 */
const extrairTribunaisComErro = (
  resultado: CapturaLog['resultado'],
  credenciaisMap: Map<number, CredencialInfo>
): Array<{ tribunal: CodigoTRT; grau: string }> => {
  const tribunaisComErro: Array<{ tribunal: CodigoTRT; grau: string }> = [];

  if (!resultado || typeof resultado !== 'object') {
    return tribunaisComErro;
  }

  // Verificar se resultado tem a propriedade 'resultados' (array)
  if ('resultados' in resultado && Array.isArray(resultado.resultados)) {
    // Filtrar apenas resultados que têm erro
    const resultadosComErro = resultado.resultados.filter(
      (r: unknown) => r && typeof r === 'object' && 'erro' in r && r.erro
    );

    // Extrair tribunal e grau de cada resultado com erro
    resultadosComErro.forEach((r: unknown) => {
      if (r && typeof r === 'object') {
        const resultadoItem = r as {
          credencial_id?: number;
          tribunal?: string;
          grau?: string;
          erro?: string;
        };

        // Prioridade 1: usar tribunal e grau diretamente do resultado
        if (resultadoItem.tribunal && resultadoItem.grau) {
          tribunaisComErro.push({
            tribunal: resultadoItem.tribunal as CodigoTRT,
            grau: resultadoItem.grau,
          });
        }
        // Prioridade 2: usar credencial_id para buscar no mapa
        else if (resultadoItem.credencial_id) {
          const info = credenciaisMap.get(resultadoItem.credencial_id);
          if (info) {
            tribunaisComErro.push({
              tribunal: info.tribunal,
              grau: info.grau || 'primeiro_grau',
            });
          }
        }
      }
    });
  }

  return tribunaisComErro;
};

/**
 * Tenta extrair informações de credencial_id do texto de erro
 * Formato esperado: "TRT7 segundo_grau (ID 14) - ..." ou múltiplos erros separados por quebra de linha
 */
const extrairCredenciaisDoTextoErro = (
  erro: string,
  credenciaisMap: Map<number, CredencialInfo>
): Array<{ tribunal: CodigoTRT; grau: string }> => {
  const tribunaisComErro: Array<{ tribunal: CodigoTRT; grau: string }> = [];
  const uniqueKey = new Set<string>();

  // Padrão: "TRT7 segundo_grau (ID 14)" ou "TST tribunal_superior (ID 49)"
  // Suporta múltiplos erros no mesmo texto (separados por quebra de linha)
  const padrao = /(\w+)\s+(\S+)\s+\(ID\s+(\d+)\)/g;
  let match;

  while ((match = padrao.exec(erro)) !== null) {
    const tribunal = match[1] as CodigoTRT;
    const grau = match[2];
    const credencialId = parseInt(match[3], 10);

    if (!isNaN(credencialId)) {
      // Criar chave única para evitar duplicatas
      const key = `${tribunal}-${grau}-${credencialId}`;
      if (uniqueKey.has(key)) continue;
      uniqueKey.add(key);

      // Tentar buscar no mapa primeiro
      const info = credenciaisMap.get(credencialId);
      if (info) {
        tribunaisComErro.push({
          tribunal: info.tribunal,
          grau: info.grau || grau || 'primeiro_grau',
        });
      } else {
        // Se não encontrar no mapa, usar os valores extraídos do texto
        tribunaisComErro.push({
          tribunal,
          grau: grau || 'primeiro_grau',
        });
      }
    }
  }

  return tribunaisComErro;
};

/**
 * Tipo para info de credencial
 */
type CredencialInfo = { tribunal: CodigoTRT; grau: string };

/**
 * Colunas da tabela de histórico
 */
function criarColunas(
  router: ReturnType<typeof useRouter>,
  onDelete: (captura: CapturaLog) => void,
  advogadosMap: Map<number, string>,
  credenciaisMap: Map<number, CredencialInfo>
): ColumnDef<CapturaLog>[] {
  return [
    {
      accessorKey: 'tipo_captura',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tipo" />
      ),
      enableSorting: true,
      size: 140,
      meta: { align: 'left' },
      cell: ({ row }) => (
        <span className="text-sm">{formatarTipoCaptura(row.getValue('tipo_captura'))}</span>
      ),
    },
    {
      accessorKey: 'advogado_id',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Advogado" />
      ),
      enableSorting: true,
      size: 220,
      minSize: 200,
      meta: { align: 'left' },
      cell: ({ row }) => {
        const advogadoId = row.getValue('advogado_id') as number | null;
        const nomeAdvogado = advogadoId ? advogadosMap.get(advogadoId) : null;
        return (
          <span className="text-sm">
            {nomeAdvogado || '-'}
          </span>
        );
      },
    },
    {
      accessorKey: 'credencial_ids',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tribunais" />
      ),
      enableSorting: false,
      size: 220,
      meta: { align: 'left' },
      cell: ({ row }) => {
        const credencialIds = row.getValue('credencial_ids') as number[] | null | undefined;

        // Validar que credencial_ids existe e é um array válido
        if (!credencialIds || !Array.isArray(credencialIds) || credencialIds.length === 0) {
          return <span className="text-sm text-muted-foreground">-</span>;
        }

        // Mapear credencial_ids para { tribunal, grau }
        const tribunaisInfo = credencialIds
          .map((id) => {
            if (typeof id !== 'number' || isNaN(id)) return null;
            return credenciaisMap.get(id);
          })
          .filter((info): info is CredencialInfo => info !== undefined);

        // Remover duplicatas por tribunal+grau
        const uniqueKey = new Set<string>();
        const tribunaisUnicos = tribunaisInfo.filter((info) => {
          // Garantir que grau sempre tenha um valor válido
          const grau = info.grau || 'primeiro_grau';
          const key = `${info.tribunal}-${grau}`;
          if (uniqueKey.has(key)) return false;
          uniqueKey.add(key);
          return true;
        });

        if (tribunaisUnicos.length === 0) {
          // Se não encontrou nenhum tribunal, pode ser que as credenciais ainda estejam carregando
          if (credenciaisMap.size === 0) {
            return <span className="text-sm text-muted-foreground">Carregando...</span>;
          }
          return <span className="text-sm text-muted-foreground">-</span>;
        }

        return (
          <div className="flex flex-wrap gap-1">
            {tribunaisUnicos.slice(0, 3).map((info, idx) => {
              const grau = info.grau || 'primeiro_grau';
              return (
                <Badge
                  key={`${info.tribunal}-${grau}-${idx}`}
                  variant={getSemanticBadgeVariant('tribunal', info.tribunal)}
                  className="text-xs"
                >
                  {info.tribunal} {formatarGrauCurto(grau)}
                </Badge>
              );
            })}
            {tribunaisUnicos.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{tribunaisUnicos.length - 3}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      enableSorting: true,
      size: 130,
      meta: { align: 'left' },
      cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
    },
    {
      accessorKey: 'iniciado_em',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Período" />
      ),
      enableSorting: true,
      size: 200,
      meta: { align: 'left' },
      cell: ({ row }) => {
        const iniciadoEm = row.getValue('iniciado_em') as string | null;
        const concluidoEm = row.original.concluido_em;
        return (
          <div className="flex flex-col text-sm">
            <span>
              <span className="text-muted-foreground">Início:</span> {formatarDataHora(iniciadoEm)}
            </span>
            {concluidoEm && (
              <span>
                <span className="text-muted-foreground">Fim:</span> {formatarDataHora(concluidoEm)}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'erro',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Erros" />
      ),
      enableSorting: false,
      size: 200,
      meta: { align: 'left' },
      cell: ({ row }) => {
        const erro = row.getValue('erro') as string | null;
        const resultado = row.original.resultado;
        const credencialIds = row.original.credencial_ids;

        if (!erro) {
          return <span className="text-sm text-muted-foreground">-</span>;
        }

        // Prioridade 1: Extrair tribunais com erro do campo resultado
        let tribunaisComErro = extrairTribunaisComErro(resultado, credenciaisMap);

        // Prioridade 2: Se não encontrou no resultado, tentar extrair do texto do erro
        if (tribunaisComErro.length === 0 && erro) {
          tribunaisComErro = extrairCredenciaisDoTextoErro(erro, credenciaisMap);
        }

        // Prioridade 3: Fallback - se ainda não encontrou, usar todas as credenciais (comportamento antigo)
        if (tribunaisComErro.length === 0) {
          if (!credencialIds || !Array.isArray(credencialIds) || credencialIds.length === 0) {
            return (
              <Badge variant="destructive" className="text-xs">
                1 erro
              </Badge>
            );
          }

          // Mapear todas as credenciais (fallback)
          const tribunaisInfo = credencialIds
            .map((id) => {
              if (typeof id !== 'number' || isNaN(id)) {
                return null;
              }
              return credenciaisMap.get(id);
            })
            .filter((info): info is CredencialInfo => info !== undefined);

          if (tribunaisInfo.length === 0) {
            return (
              <Badge variant="destructive" className="text-xs">
                1 erro
              </Badge>
            );
          }

          tribunaisComErro = tribunaisInfo.map((info) => ({
            tribunal: info.tribunal,
            grau: info.grau || 'primeiro_grau',
          }));
        }

        // Remover duplicatas por tribunal+grau
        const uniqueKey = new Set<string>();
        const tribunaisUnicos = tribunaisComErro.filter((info) => {
          const grau = info.grau || 'primeiro_grau';
          const key = `${info.tribunal}-${grau}`;
          if (uniqueKey.has(key)) return false;
          uniqueKey.add(key);
          return true;
        });

        if (tribunaisUnicos.length === 0) {
          return (
            <Badge variant="destructive" className="text-xs">
              1 erro
            </Badge>
          );
        }

        // Agrupar por tribunal+grau (para contagem se houver múltiplos erros do mesmo tribunal/grau)
        const contagem = new Map<string, { tribunal: CodigoTRT; grau: string; count: number }>();
        tribunaisUnicos.forEach((info) => {
          const grau = info.grau || 'primeiro_grau';
          const key = `${info.tribunal}-${grau}`;
          const existing = contagem.get(key);
          if (existing) {
            existing.count++;
          } else {
            contagem.set(key, { tribunal: info.tribunal, grau, count: 1 });
          }
        });

        return (
          <div className="flex flex-wrap gap-1">
            {Array.from(contagem.values()).slice(0, 2).map((info, idx) => {
              const grau = info.grau || 'primeiro_grau';
              return (
                <Badge
                  key={`${info.tribunal}-${grau}-${idx}`}
                  variant="destructive"
                  className="text-xs"
                >
                  {info.tribunal} {formatarGrauCurto(grau)}
                </Badge>
              );
            })}
            {contagem.size > 2 && (
              <Badge variant="destructive" className="text-xs">
                +{contagem.size - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: 'acoes',
      header: () => <span>Ações</span>,
      size: 100,
      meta: { align: 'left' },
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const captura = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => router.push(`/captura/historico/${captura.id}`)}
              title="Visualizar detalhes"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Deletar">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja deletar esta captura? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(captura)}
                    className={buttonVariants({ variant: 'destructive' })}
                  >
                    Deletar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      },
    },
  ];
}

interface CapturaListProps {
  onNewClick?: () => void;
}

export function CapturaList({ onNewClick }: CapturaListProps = {}) {
  const router = useRouter();

  // Estados de busca e paginação
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);

  // Estados de filtros individuais
  const [tipoCaptura, setTipoCaptura] = React.useState<'all' | TipoCaptura>('all');
  const [statusCaptura, setStatusCaptura] = React.useState<'all' | StatusCaptura>('all');
  const [advogadoId, setAdvogadoId] = React.useState<'all' | string>('all');

  // Estados para DataTableToolbar
  const [table, setTable] = React.useState<TanstackTable<CapturaLog> | null>(null);
  const [density, setDensity] = React.useState<'compact' | 'standard' | 'relaxed'>('standard');

  // Row selection state for bulk actions
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [isDeletingBulk, setIsDeletingBulk] = React.useState(false);

  // Buscar advogados e credenciais via Route Handlers (fetch) para paralelismo real
  const { advogadosMap, advogadoOptions } = useAdvogadosMap();
  const { credenciaisMap } = useCredenciaisMap();

  // Parâmetros para buscar capturas
  const params = React.useMemo(
    () => ({
      pagina: pagina + 1, // API usa 1-indexed
      limite,
      tipo_captura: tipoCaptura !== 'all' ? tipoCaptura : undefined,
      status: statusCaptura !== 'all' ? statusCaptura : undefined,
      advogado_id: advogadoId !== 'all' ? Number(advogadoId) : undefined,
    }),
    [pagina, limite, tipoCaptura, statusCaptura, advogadoId]
  );

  // Buscar histórico de capturas
  const { capturas, paginacao, isLoading, error, refetch } = useCapturasLog(params);

  const handleDelete = React.useCallback(
    async (captura: CapturaLog) => {
      try {
        await deletarCapturaLog(captura.id);
        refetch();
      } catch (error) {
        console.error('Erro ao deletar captura:', error);
      }
    },
    [refetch]
  );

  const handleBulkDelete = React.useCallback(async () => {
    setIsDeletingBulk(true);
    try {
      const selectedIds = Object.keys(rowSelection)
        .filter((key) => rowSelection[key])
        .map((key) => Number(key));

      await Promise.all(selectedIds.map((id) => deletarCapturaLog(id)));
      setRowSelection({});
      refetch();
    } catch (error) {
      console.error('Erro ao deletar capturas em massa:', error);
    } finally {
      setIsDeletingBulk(false);
    }
  }, [rowSelection, refetch]);

  const selectedCount = Object.keys(rowSelection).filter((k) => rowSelection[k]).length;

  // Options for FilterPopover components
  const tipoOptions = React.useMemo(
    () => TIPOS_CAPTURA.map((t) => ({ value: t.value, label: t.label })),
    []
  );

  const statusOptions = React.useMemo(
    () => STATUS_CAPTURA.map((s) => ({ value: s.value, label: s.label })),
    []
  );

  const colunas = React.useMemo(
    () => criarColunas(router, handleDelete, advogadosMap, credenciaisMap),
    [router, handleDelete, advogadosMap, credenciaisMap]
  );

  // Ocultar coluna advogado por padrão quando table estiver pronta
  React.useEffect(() => {
    if (table) {
      table.setColumnVisibility((prev) => ({
        ...prev,
        advogado_id: false,
      }));
    }
  }, [table]);

  return (
    <DataShell
      header={
        table ? (
          <DataTableToolbar
            table={table}
            title="Histórico de Capturas"
            density={density}
            onDensityChange={setDensity}
            searchValue={busca}
            onSearchValueChange={(value) => {
              setBusca(value);
              setPagina(0);
            }}
            searchPlaceholder="Buscar capturas..."
            actionButton={
              onNewClick
                ? {
                    label: 'Nova Captura',
                    onClick: onNewClick,
                  }
                : undefined
            }
            actionSlot={
              <div className="flex items-center gap-2">
                {selectedCount > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 gap-2 bg-card text-destructive hover:text-destructive"
                        disabled={isDeletingBulk}
                      >
                        <Trash2 className="h-4 w-4" />
                        {isDeletingBulk ? 'Excluindo...' : `Excluir (${selectedCount})`}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão em massa</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja deletar {selectedCount}{' '}
                          {selectedCount === 1 ? 'captura' : 'capturas'}? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleBulkDelete}
                          className={buttonVariants({ variant: 'destructive' })}
                        >
                          Deletar {selectedCount} {selectedCount === 1 ? 'captura' : 'capturas'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 bg-card"
                          aria-label="Configurações de captura"
                        >
                          <Settings className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Configurações</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/app/captura/agendamentos">Agendamentos</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/app/captura/advogados">Advogados</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/app/captura/credenciais">Credenciais</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            }
            filtersSlot={
              <>
                <FilterPopover
                  label="Tipo"
                  placeholder="Buscar tipo..."
                  options={tipoOptions}
                  value={tipoCaptura}
                  onValueChange={(val) => {
                    setTipoCaptura(val as 'all' | TipoCaptura);
                    setPagina(0);
                  }}
                />
                <FilterPopover
                  label="Status"
                  placeholder="Buscar status..."
                  options={statusOptions}
                  value={statusCaptura}
                  onValueChange={(val) => {
                    setStatusCaptura(val as 'all' | StatusCaptura);
                    setPagina(0);
                  }}
                />
                <FilterPopover
                  label="Advogado"
                  placeholder="Buscar advogado..."
                  options={advogadoOptions}
                  value={advogadoId}
                  onValueChange={(val) => {
                    setAdvogadoId(val);
                    setPagina(0);
                  }}
                />
              </>
            }
          />
        ) : (
          <div className="p-6" />
        )
      }
      footer={
        paginacao && paginacao.totalPaginas > 0 ? (
          <DataPagination
            pageIndex={paginacao.pagina - 1}
            pageSize={paginacao.limite}
            total={paginacao.total}
            totalPages={paginacao.totalPaginas}
            onPageChange={setPagina}
            onPageSizeChange={setLimite}
            isLoading={isLoading}
          />
        ) : null
      }
    >
      <DataTable
        data={capturas}
        columns={colunas}
        pagination={
          paginacao
            ? {
                pageIndex: paginacao.pagina - 1,
                pageSize: paginacao.limite,
                total: paginacao.total,
                totalPages: paginacao.totalPaginas,
                onPageChange: setPagina,
                onPageSizeChange: setLimite,
              }
            : undefined
        }
        isLoading={isLoading}
        error={error}
        density={density}
        onTableReady={(t) => setTable(t as TanstackTable<CapturaLog>)}
        emptyMessage="Nenhuma captura encontrada no histórico."
        rowSelection={{
          state: rowSelection,
          onRowSelectionChange: setRowSelection,
          getRowId: (row) => row.id.toString(),
        }}
      />
    </DataShell>
  );
}
