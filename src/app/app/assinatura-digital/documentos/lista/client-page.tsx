"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Table as TanstackTable, SortingState, RowSelectionState, VisibilityState } from "@tanstack/react-table";
import {
  CheckCircle2,
  Clock,
  FileText,
  Plus,
  XCircle,
  Loader2,
  Download,
  Trash2,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DataTable,
  DataShell,
  DataTableToolbar,
  DataPagination,
} from "@/components/shared/data-shell";
import { DialogFormShell } from "@/components/shared/dialog-shell/dialog-form-shell";
import { FilterPopover, type FilterOption } from "@/app/app/partes";
import { useDebounce } from "@/hooks/use-debounce";

import {
  actionListDocumentos,
  actionGetPresignedPdfUrl,
  actionDeleteDocumento,
} from "../../feature";
import { createColumns, type DocumentoListItem } from "./components/columns";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DocumentosTableWrapperProps {
  initialData?: DocumentoListItem[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_FILTER_OPTIONS: readonly FilterOption[] = [
  { value: "rascunho", label: "Rascunho" },
  { value: "pronto", label: "Pronto" },
  { value: "concluido", label: "Concluído" },
  { value: "cancelado", label: "Cancelado" },
];

const ORIGEM_FILTER_OPTIONS: readonly FilterOption[] = [
  { value: "documento", label: "Documento" },
  { value: "formulario", label: "Formulário" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DocumentosTableWrapper({
  initialData = [],
}: DocumentosTableWrapperProps) {
  const router = useRouter();

  // -- State: Data
  const [documentos, setDocumentos] = React.useState<DocumentoListItem[]>(initialData);
  const [table, setTable] = React.useState<TanstackTable<DocumentoListItem> | null>(null);

  // -- State: Pagination (0-based for UI)
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(50);

  // -- State: Loading/Error
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // -- State: Selection & Column Visibility
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({ id: false });

  // -- State: Filters
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [origemFilter, setOrigemFilter] = React.useState<string>("all");
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // -- State: Dialogs
  const [documentoParaDeletar, setDocumentoParaDeletar] =
    React.useState<DocumentoListItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // -- Debounce search
  const buscaDebounced = useDebounce(globalFilter, 500);

  // -- Data fetching
  const refetch = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resultado = await actionListDocumentos({
        page: 1,
        pageSize: 100, // Máximo permitido pelo schema
      });

      if (resultado.success && resultado.data && "documentos" in resultado.data) {
        const { documentos: docs } = resultado.data as {
          documentos: DocumentoListItem[];
        };
        setDocumentos(docs ?? []);
      } else {
        const errorMessage =
          !resultado.success && "error" in resultado
            ? resultado.error
            : "Erro desconhecido ao carregar documentos";
        setError(typeof errorMessage === "string" ? errorMessage : "Erro ao carregar");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar documentos");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Skip first render if initialData provided
  const isFirstRender = React.useRef(true);

  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (initialData.length > 0) return;
    }
    refetch();
  }, [refetch, initialData.length]);

  // -- Client-side search + status + origem filter
  const filteredDocumentos = React.useMemo(() => {
    let result = documentos;

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((d) => d.status === statusFilter);
    }

    // Origem filter
    if (origemFilter !== "all") {
      result = result.filter((d) => (d._origem ?? "documento") === origemFilter);
    }

    // Search filter
    if (buscaDebounced) {
      const lower = buscaDebounced.toLowerCase();
      result = result.filter(
        (d) =>
          d.titulo?.toLowerCase().includes(lower) ||
          d.documento_uuid.toLowerCase().includes(lower) ||
          String(d.id).includes(lower) ||
          d._protocolo?.toLowerCase().includes(lower) ||
          d._cliente_nome?.toLowerCase().includes(lower)
      );
    }

    return result;
  }, [documentos, statusFilter, origemFilter, buscaDebounced]);

  // -- Client-side pagination
  const totalFiltered = filteredDocumentos.length;
  const totalPages = Math.ceil(totalFiltered / pageSize);
  const paginatedDocumentos = React.useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredDocumentos.slice(start, start + pageSize);
  }, [filteredDocumentos, pageIndex, pageSize]);

  // -- Stats (always from full dataset, not filtered)
  const stats = React.useMemo(() => ({
    total: documentos.length,
    rascunho: documentos.filter((d) => d.status === "rascunho").length,
    pronto: documentos.filter((d) => d.status === "pronto").length,
    concluido: documentos.filter((d) => d.status === "concluido").length,
    cancelado: documentos.filter((d) => d.status === "cancelado").length,
  }), [documentos]);

  // -- Handlers: Actions
  const handleDownloadPdf = React.useCallback(async (url: string, titulo: string) => {
    try {
      const result = await actionGetPresignedPdfUrl({ url });
      const presignedUrl =
        result.success && result.data && "presignedUrl" in result.data
          ? (result.data as { presignedUrl: string }).presignedUrl
          : null;

      if (!presignedUrl) {
        toast.error("Erro ao gerar link de download");
        return;
      }

      const link = document.createElement("a");
      link.href = presignedUrl;
      link.download = `${titulo || "documento"}.pdf`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      toast.error("Erro ao baixar documento");
    }
  }, []);

  const handleVerDetalhes = React.useCallback(
    (uuid: string) => {
      router.push(`/app/assinatura-digital/documentos/${uuid}`);
    },
    [router]
  );

  const handleEditarDocumento = React.useCallback(
    (uuid: string) => {
      router.push(`/app/assinatura-digital/documentos/editar/${uuid}`);
    },
    [router]
  );

  const handleConfirmarDelete = React.useCallback((doc: DocumentoListItem) => {
    setDocumentoParaDeletar(doc);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDeletarDocumento = React.useCallback(async () => {
    if (!documentoParaDeletar) return;
    setIsDeleting(true);
    try {
      const resultado = await actionDeleteDocumento({
        uuid: documentoParaDeletar.documento_uuid,
      });
      if (resultado.success) {
        toast.success("Documento deletado com sucesso");
        setIsDeleteDialogOpen(false);
        setDocumentoParaDeletar(null);
        refetch();
      } else {
        const errorMessage =
          "error" in resultado ? resultado.error : "Erro ao deletar documento";
        toast.error(typeof errorMessage === "string" ? errorMessage : "Erro ao deletar");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao deletar documento"
      );
    } finally {
      setIsDeleting(false);
    }
  }, [documentoParaDeletar, refetch]);

  // -- Selected rows
  const selectedCount = Object.keys(rowSelection).length;

  const handleBulkDownload = React.useCallback(async () => {
    const selectedIndices = Object.keys(rowSelection).map(Number);
    const selectedDocs = selectedIndices
      .map((i) => paginatedDocumentos[i])
      .filter(Boolean);

    for (const doc of selectedDocs) {
      const pdfUrl = doc.pdf_final_url || doc.pdf_original_url;
      await handleDownloadPdf(pdfUrl, doc.titulo || "documento");
    }
  }, [rowSelection, paginatedDocumentos, handleDownloadPdf]);

  const handleBulkDelete = React.useCallback(async () => {
    const selectedIndices = Object.keys(rowSelection).map(Number);
    const selectedDocs = selectedIndices
      .map((i) => paginatedDocumentos[i])
      .filter(Boolean)
      .filter(
        (doc) =>
          doc._origem !== "formulario" &&
          doc.status !== "concluido" &&
          (doc._assinantes_concluidos ?? 0) === 0
      );

    if (selectedDocs.length === 0) {
      toast.error("Nenhum documento selecionado pode ser deletado");
      return;
    }

    setIsDeleting(true);
    let successCount = 0;
    for (const doc of selectedDocs) {
      try {
        const resultado = await actionDeleteDocumento({
          uuid: doc.documento_uuid,
        });
        if (resultado.success) successCount++;
      } catch {
        // continua com os próximos
      }
    }
    setIsDeleting(false);
    setRowSelection({});

    if (successCount > 0) {
      toast.success(`${successCount} documento(s) deletado(s) com sucesso`);
      refetch();
    } else {
      toast.error("Nenhum documento foi deletado");
    }
  }, [rowSelection, paginatedDocumentos, refetch]);

  // -- Columns
  const columns = React.useMemo(
    () =>
      createColumns({
        onEdit: handleEditarDocumento,
        onView: handleVerDetalhes,
        onDelete: handleConfirmarDelete,
        onDownload: handleDownloadPdf,
      }),
    [handleEditarDocumento, handleVerDetalhes, handleConfirmarDelete, handleDownloadPdf]
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      {/* Row 1: Título + Botão "Novo Documento" */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight font-heading">
          Assinatura Digital
        </h1>
        <Button
          size="sm"
          className="h-9"
          onClick={() =>
            router.push("/app/assinatura-digital/documentos/novo")
          }
        >
          <Plus className="h-4 w-4" />
          Novo Documento
        </Button>
      </div>

      {/* Row 2: Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rascunhos</CardTitle>
            <FileText className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rascunho}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prontos</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pronto}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.concluido}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelados</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cancelado}</div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: DataShell (Toolbar + Table + Pagination) */}
      <DataShell
        header={
          table ? (
            <DataTableToolbar
              table={table}
              searchValue={globalFilter}
              onSearchValueChange={(value) => {
                setGlobalFilter(value);
                setPageIndex(0);
              }}
              searchPlaceholder="Buscar por título, protocolo, cliente..."
              filtersSlot={
                <div className="flex items-center gap-2">
                  <FilterPopover
                    label="Status"
                    options={STATUS_FILTER_OPTIONS}
                    value={statusFilter}
                    onValueChange={(v) => {
                      setStatusFilter(v);
                      setPageIndex(0);
                    }}
                    defaultValue="all"
                  />
                  <FilterPopover
                    label="Origem"
                    options={ORIGEM_FILTER_OPTIONS}
                    value={origemFilter}
                    onValueChange={(v) => {
                      setOrigemFilter(v);
                      setPageIndex(0);
                    }}
                    defaultValue="all"
                  />
                </div>
              }
              actionSlot={
                <div className="flex items-center gap-2">
                  {selectedCount > 0 && (
                    <>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {selectedCount} selecionado(s)
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9"
                        onClick={handleBulkDownload}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 text-destructive hover:text-destructive"
                        onClick={handleBulkDelete}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Deletar
                      </Button>
                    </>
                  )}
                  <DropdownMenu>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 bg-card"
                            aria-label="Configurações de assinatura digital"
                          >
                            <Settings className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent>Configurações</TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href="/app/assinatura-digital/templates">Templates</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/app/assinatura-digital/formularios">Formulários</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              }
            />
          ) : (
            <div className="p-6" />
          )
        }
        footer={
          totalPages > 0 ? (
            <DataPagination
              pageIndex={pageIndex}
              pageSize={pageSize}
              total={totalFiltered}
              totalPages={totalPages}
              onPageChange={setPageIndex}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPageIndex(0);
              }}
              isLoading={isLoading}
            />
          ) : null
        }
      >
        <DataTable
          data={paginatedDocumentos}
          columns={columns}
          pagination={{
            pageIndex,
            pageSize,
            total: totalFiltered,
            totalPages,
            onPageChange: setPageIndex,
            onPageSizeChange: setPageSize,
          }}
          sorting={sorting}
          onSortingChange={setSorting}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
          rowSelection={{
            state: rowSelection,
            onRowSelectionChange: setRowSelection,
          }}
          isLoading={isLoading}
          error={error}
          emptyMessage="Nenhum documento encontrado."
          onTableReady={(t) =>
            setTable(t as TanstackTable<DocumentoListItem>)
          }
          hidePagination
        />
      </DataShell>

      {/* Dialog de Confirmação de Exclusão */}
      <DialogFormShell
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!isDeleting) {
            setIsDeleteDialogOpen(open);
            if (!open) setDocumentoParaDeletar(null);
          }
        }}
        title="Confirmar Exclusão"
        maxWidth="md"
        footer={
          <Button
            variant="destructive"
            onClick={handleDeletarDocumento}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deletando...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Deletar
              </>
            )}
          </Button>
        }
      >
        {documentoParaDeletar && (
          <div className="space-y-4">
            <p>
              Tem certeza que deseja deletar o documento{" "}
              <strong>
                {documentoParaDeletar.titulo || `#${documentoParaDeletar.id}`}
              </strong>
              ?
            </p>
            <div className="rounded-md bg-muted p-4 text-sm">
              <p className="text-muted-foreground">
                O documento e todos os dados relacionados (assinantes, âncoras)
                serão permanentemente removidos.
              </p>
            </div>
          </div>
        )}
      </DialogFormShell>
    </>
  );
}
