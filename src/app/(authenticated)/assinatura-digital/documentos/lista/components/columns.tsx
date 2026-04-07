"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  Eye,
  Download,
  Pencil,
  Trash2,
  Users,
  Calendar,
  FileText,
  ClipboardList,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { AppBadge as Badge } from "@/components/ui/app-badge";
import { Button } from "@/components/ui/button";
import { getSemanticBadgeVariant } from "@/lib/design-system";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DataTableColumnHeader } from "@/components/shared/data-shell/data-table-column-header";
import type { AssinaturaDigitalDocumentoStatus } from "../../../feature/domain";
import { statuses } from "./data/data";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DocumentoListItem = {
  id: number;
  documento_uuid: string;
  titulo: string | null;
  status: AssinaturaDigitalDocumentoStatus;
  selfie_habilitada: boolean;
  pdf_original_url: string;
  pdf_final_url: string | null;
  hash_original_sha256: string | null;
  hash_final_sha256: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  contrato_id: number | null;
  _assinantes_count?: number;
  _assinantes_concluidos?: number;
  _origem?: 'documento' | 'formulario';
  _cliente_nome?: string;
  _protocolo?: string;
};

interface ColumnActions {
  onEdit: (uuid: string) => void;
  onView: (uuid: string) => void;
  onDelete: (doc: DocumentoListItem) => void;
  onDownload: (url: string, titulo: string) => void;
}

// ---------------------------------------------------------------------------
// Column factory
// ---------------------------------------------------------------------------

export function createColumns(actions: ColumnActions): ColumnDef<DocumentoListItem>[] {
  return [
    {
      accessorKey: "id",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="ID" />
      ),
      cell: ({ row }) => (
        <div className="min-h-10 flex items-center text-sm font-medium">
          #{row.getValue("id")}
        </div>
      ),
      enableSorting: false,
      enableHiding: true,
      size: 80,
      meta: { align: "left" as const, headerLabel: "ID" },
    },
    {
      accessorKey: "titulo",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Título" />
      ),
      cell: ({ row }) => {
        const titulo = row.getValue("titulo") as string | null;
        const id = row.original.id;
        return (
          <div className="min-h-10 flex items-center text-sm">
            <span className="max-w-75 truncate font-medium">
              {titulo || `Documento #${id}`}
            </span>
          </div>
        );
      },
      enableSorting: true,
      size: 250,
      meta: { align: "left" as const, headerLabel: "Título" },
    },
    {
      id: "origem",
      accessorFn: (row) => row._origem ?? "documento",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Origem" />
      ),
      cell: ({ row }) => {
        const origem = row.original._origem ?? "documento";
        const isFormulario = origem === "formulario";
        return (
          <div className="min-h-10 flex items-center">
            <Badge
              variant="outline"
              className={
                isFormulario
                  ? "border-success/30 bg-success/10 text-success dark:text-success"
                  : "border-info/30 bg-info/10 text-info dark:text-info"
              }
            >
              <span className="flex items-center gap-1.5">
                {isFormulario ? (
                  <ClipboardList className="h-3 w-3" />
                ) : (
                  <FileText className="h-3 w-3" />
                )}
                {isFormulario ? "Formulário" : "Documento"}
              </span>
            </Badge>
          </div>
        );
      },
      filterFn: (row, _id, value) => {
        return value.includes(row.original._origem ?? "documento");
      },
      enableSorting: false,
      size: 140,
      meta: { align: "left" as const, headerLabel: "Origem" },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const statusValue = row.getValue("status") as AssinaturaDigitalDocumentoStatus;
        const status = statuses.find((s) => s.value === statusValue);
        if (!status) return null;

        return (
          <div className="min-h-10 flex items-center">
            <Badge variant={getSemanticBadgeVariant("document_signature_status", statusValue)}>
              <span className="flex items-center gap-1.5">
                {status.icon && <status.icon className="h-3.5 w-3.5" />}
                {status.label}
              </span>
            </Badge>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
      enableSorting: true,
      size: 180,
      meta: { align: "left" as const, headerLabel: "Status" },
    },
    {
      id: "assinantes",
      accessorFn: (row) =>
        `${row._assinantes_concluidos ?? 0}/${row._assinantes_count ?? 0}`,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Assinantes" />
      ),
      cell: ({ row }) => {
        const concluidos = row.original._assinantes_concluidos ?? 0;
        const total = row.original._assinantes_count ?? 0;
        return (
          <div className="min-h-10 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {concluidos}/{total}
          </div>
        );
      },
      enableSorting: false,
      size: 120,
      meta: { align: "left" as const, headerLabel: "Assinantes" },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Criado em" />
      ),
      cell: ({ row }) => {
        const date = row.getValue("created_at") as string;
        return (
          <div className="min-h-10 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
          </div>
        );
      },
      enableSorting: true,
      size: 180,
      meta: { align: "left" as const, headerLabel: "Criado em" },
    },
    {
      id: "acoes",
      header: () => <span className="text-sm font-medium">Ações</span>,
      cell: ({ row }) => {
        const doc = row.original;
        const isFormulario = doc._origem === "formulario";
        const podeEditar =
          !isFormulario &&
          (doc.status === "rascunho" ||
            (doc.status === "pronto" && (doc._assinantes_concluidos ?? 0) === 0));
        const podeDeletar =
          !isFormulario &&
          doc.status !== "concluido" &&
          (doc._assinantes_concluidos ?? 0) === 0;
        const pdfUrl = doc.pdf_final_url || doc.pdf_original_url;

        return (
          <div className="min-h-10 flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon" aria-label="Ver detalhes"
                  className="h-8 w-8"
                  onClick={() => actions.onView(doc.documento_uuid)}
                >
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">Ver detalhes</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ver detalhes</TooltipContent>
            </Tooltip>

            {podeEditar && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon" aria-label="Editar"
                    className="h-8 w-8"
                    onClick={() => actions.onEdit(doc.documento_uuid)}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Editar</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Editar</TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon" aria-label="Download PDF"
                  className="h-8 w-8"
                  onClick={() =>
                    actions.onDownload(pdfUrl, doc.titulo || "documento")
                  }
                >
                  <Download className="h-4 w-4" />
                  <span className="sr-only">Download PDF</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download PDF</TooltipContent>
            </Tooltip>

            {podeDeletar && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon" aria-label="Deletar"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => actions.onDelete(doc)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Deletar</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Deletar</TooltipContent>
              </Tooltip>
            )}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
      size: 160,
      meta: { headerLabel: "Ações" },
    },
  ];
}
