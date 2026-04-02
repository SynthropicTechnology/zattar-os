"use client";

import * as React from "react";
import Link from "next/link";
import { AppBadge as Badge } from "@/components/ui/app-badge";
import { Button } from "@/components/ui/button";
import {
  DataPagination,
  DataShell,
  DataTable,
  DataTableColumnHeader,
  DataTableToolbar,
  type DataTableDensity,
} from "@/components/shared/data-shell";
import { FilterPopover } from "@/app/app/partes/components/shared";
import type { FilterOption } from "@/app/app/partes/components/shared";
import type { Table as TanstackTable, ColumnDef } from "@tanstack/react-table";
import { CheckCheckIcon, ClockIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  actionListarNotificacoes,
  actionMarcarNotificacaoComoLida,
  actionMarcarTodasComoLidas,
} from "../actions/notificacoes-actions";
import type {
  Notificacao,
  TipoNotificacaoUsuario,
  ListarNotificacoesParams,
} from "../domain";
import { TIPO_NOTIFICACAO_LABELS } from "../domain";

// ============================================================================
// Constantes
// ============================================================================

const TIPO_NOTIFICACAO_VARIANTS: Record<
  TipoNotificacaoUsuario,
  "info" | "warning" | "success" | "destructive" | "secondary"
> = {
  processo_atribuido: "info",
  processo_movimentacao: "info",
  audiencia_atribuida: "success",
  audiencia_alterada: "warning",
  expediente_atribuido: "info",
  expediente_alterado: "warning",
  prazo_vencendo: "warning",
  prazo_vencido: "destructive",
};

const TIPO_OPTIONS: readonly FilterOption[] = Object.entries(
  TIPO_NOTIFICACAO_LABELS
).map(([value, label]) => ({ value, label }));

const STATUS_OPTIONS: readonly FilterOption[] = [
  { value: "nao_lida", label: "Não lidas" },
  { value: "lida", label: "Lidas" },
];

// ============================================================================
// Helpers
// ============================================================================

const formatarData = (dataString: string): string => {
  return formatDistanceToNow(new Date(dataString), {
    addSuffix: true,
    locale: ptBR,
  });
};

const getEntityLink = (entidadeTipo: string, entidadeId: number): string => {
  switch (entidadeTipo) {
    case "processo":
      return `/processos/${entidadeId}`;
    case "audiencia":
      return `/audiencias/${entidadeId}`;
    case "expediente":
      return `/expedientes/lista`;
    case "pericia":
      return `/pericias/${entidadeId}`;
    default:
      return "#";
  }
};

// ============================================================================
// Definição das Colunas
// ============================================================================

function criarColunas(
  onMarcarComoLida: (id: number) => void
): ColumnDef<Notificacao>[] {
  return [
    {
      accessorKey: "tipo",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tipo" />
      ),
      enableSorting: true,
      size: 180,
      cell: ({ row }) => {
        const tipo = row.original.tipo;
        return (
          <Badge variant={TIPO_NOTIFICACAO_VARIANTS[tipo] || "secondary"}>
            {TIPO_NOTIFICACAO_LABELS[tipo]}
          </Badge>
        );
      },
    },
    {
      accessorKey: "titulo",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Título" />
      ),
      enableSorting: true,
      size: 300,
      cell: ({ row }) => {
        const notificacao = row.original;
        const link = getEntityLink(
          notificacao.entidade_tipo,
          notificacao.entidade_id
        );
        return (
          <Link
            href={link}
            className="text-sm font-medium hover:underline"
            onClick={() => {
              if (!notificacao.lida) {
                onMarcarComoLida(notificacao.id);
              }
            }}
          >
            {notificacao.titulo}
          </Link>
        );
      },
    },
    {
      accessorKey: "descricao",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Descrição" />
      ),
      enableSorting: false,
      size: 400,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground line-clamp-2">
          {row.original.descricao}
        </span>
      ),
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <div className="flex justify-center">
          <DataTableColumnHeader column={column} title="Data" />
        </div>
      ),
      enableSorting: true,
      size: 150,
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
          <ClockIcon className="size-3" />
          {formatarData(row.original.created_at)}
        </div>
      ),
    },
    {
      accessorKey: "lida",
      header: ({ column }) => (
        <div className="flex justify-center">
          <DataTableColumnHeader column={column} title="Status" />
        </div>
      ),
      enableSorting: true,
      size: 100,
      cell: ({ row }) => (
        <div className="flex justify-center">
          {row.original.lida ? (
            <Badge variant="outline">Lida</Badge>
          ) : (
            <Badge variant="destructive">Não lida</Badge>
          )}
        </div>
      ),
    },
  ];
}

// ============================================================================
// Componente Principal
// ============================================================================

export function NotificacoesList() {
  const [table, setTable] = React.useState<
    TanstackTable<Notificacao> | undefined
  >(undefined);
  const [density, setDensity] = React.useState<DataTableDensity>("standard");

  // Estado de filtros
  const [pagina, setPagina] = React.useState(1);
  const [limite] = React.useState(20);
  const [tipoFiltro, setTipoFiltro] = React.useState<
    TipoNotificacaoUsuario | "all"
  >("all");
  const [lidaFiltro, setLidaFiltro] = React.useState<
    "all" | "lida" | "nao_lida"
  >("all");

  // Estado de dados
  const [notificacoes, setNotificacoes] = React.useState<Notificacao[]>([]);
  const [total, setTotal] = React.useState(0);
  const [totalPaginas, setTotalPaginas] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Buscar notificações
  const buscarNotificacoes = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params: ListarNotificacoesParams = {
        pagina,
        limite,
        tipo: tipoFiltro !== "all" ? tipoFiltro : undefined,
        lida:
          lidaFiltro === "lida"
            ? true
            : lidaFiltro === "nao_lida"
              ? false
              : undefined,
      };

      const result = await actionListarNotificacoes(params);

      if (!result.success) {
        setError(result.message || "Erro ao buscar notificações");
        return;
      }

      const serviceResult = result.data;
      if (serviceResult.success) {
        const data = serviceResult.data;
        setNotificacoes(data.notificacoes);
        setTotal(data.total);
        setTotalPaginas(data.total_paginas);
      } else {
        setError(
          serviceResult.error.message || "Erro ao buscar notificações"
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  }, [pagina, limite, tipoFiltro, lidaFiltro]);

  // Marcar como lida
  const marcarComoLida = React.useCallback(
    async (id: number) => {
      const result = await actionMarcarNotificacaoComoLida({ id });
      if (result.success) {
        setNotificacoes((prev) =>
          prev.map((n) =>
            n.id === id
              ? { ...n, lida: true, lida_em: new Date().toISOString() }
              : n
          )
        );
        buscarNotificacoes();
      }
    },
    [buscarNotificacoes]
  );

  // Marcar todas como lidas
  const marcarTodasComoLidas = React.useCallback(async () => {
    const result = await actionMarcarTodasComoLidas({});
    if (result.success) {
      buscarNotificacoes();
    }
  }, [buscarNotificacoes]);

  // Efeito para buscar notificações quando filtros mudarem
  React.useEffect(() => {
    buscarNotificacoes();
  }, [buscarNotificacoes]);

  // Colunas
  const colunas = React.useMemo(
    () => criarColunas(marcarComoLida),
    [marcarComoLida]
  );

  // Handlers
  const handlePageChange = (pageIndex: number) => {
    setPagina(pageIndex + 1);
  };

  const handleTipoChange = (value: string) => {
    setTipoFiltro(value as TipoNotificacaoUsuario | "all");
    setPagina(1);
  };

  const handleLidaChange = (value: string) => {
    setLidaFiltro(value as "all" | "lida" | "nao_lida");
    setPagina(1);
  };

  return (
    <DataShell
      header={
        <DataTableToolbar
          table={table}
          title="Notificações"
          density={density}
          onDensityChange={setDensity}
          searchPlaceholder="Buscar notificações..."
          filtersSlot={
            <>
              <FilterPopover
                label="Tipo"
                options={TIPO_OPTIONS}
                value={tipoFiltro}
                onValueChange={handleTipoChange}
              />
              <FilterPopover
                label="Status"
                options={STATUS_OPTIONS}
                value={lidaFiltro}
                onValueChange={handleLidaChange}
              />
            </>
          }
          actionSlot={
            <Button
              variant="outline"
              onClick={marcarTodasComoLidas}
              disabled={isLoading || notificacoes.length === 0}
            >
              <CheckCheckIcon className="size-4" />
              Marcar todas como lidas
            </Button>
          }
        />
      }
      footer={
        totalPaginas > 0 ? (
          <DataPagination
            pageIndex={pagina - 1}
            pageSize={limite}
            total={total}
            totalPages={totalPaginas}
            onPageChange={handlePageChange}
            onPageSizeChange={() => {}}
            isLoading={isLoading}
          />
        ) : null
      }
    >
      <DataTable
        columns={colunas}
        data={notificacoes}
        isLoading={isLoading}
        error={error}
        pagination={{
          pageIndex: pagina - 1,
          pageSize: limite,
          total,
          totalPages: totalPaginas,
          onPageChange: handlePageChange,
          onPageSizeChange: () => {},
        }}
        hidePagination={true}
        onTableReady={setTable}
        density={density}
        emptyMessage="Nenhuma notificação encontrada."
      />
    </DataShell>
  );
}
