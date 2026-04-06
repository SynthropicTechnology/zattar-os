"use client";

import * as React from "react";
import { Loader2, Pencil, Copy, Trash2, Plus } from "lucide-react";

import { DialogFormShell } from "@/components/shared/dialog-shell/dialog-form-shell";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AppBadge as Badge } from "@/components/ui/app-badge";
import type { AssinaturaDigitalSegmento } from "../../feature";

import { SegmentoCreateDialog } from "./segmento-create-dialog";

interface SegmentosManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  onEdit: (segmento: AssinaturaDigitalSegmento) => void;
  onDuplicate: (segmento: AssinaturaDigitalSegmento) => void;
  onDelete: (segmento: AssinaturaDigitalSegmento) => void;
}

type SegmentosState = {
  segmentos: AssinaturaDigitalSegmento[];
  isLoading: boolean;
  error: string | null;
};

export function SegmentosManagerDialog({
  open,
  onOpenChange,
  onCreated,
  onEdit,
  onDuplicate,
  onDelete,
}: SegmentosManagerDialogProps) {
  const [state, setState] = React.useState<SegmentosState>({
    segmentos: [],
    isLoading: false,
    error: null,
  });
  const [createOpen, setCreateOpen] = React.useState(false);

  const fetchSegmentos = React.useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const res = await fetch(`/api/assinatura-digital/segmentos`);
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Erro ao carregar segmentos");
      }
      setState({ segmentos: json.data || [], isLoading: false, error: null });
    } catch (err) {
      setState({
        segmentos: [],
        isLoading: false,
        error: err instanceof Error ? err.message : "Erro desconhecido",
      });
    }
  }, []);

  React.useEffect(() => {
    if (!open) return;
    void fetchSegmentos();
  }, [open, fetchSegmentos]);

  const handleCreated = React.useCallback(() => {
    onCreated();
    void fetchSegmentos();
  }, [onCreated, fetchSegmentos]);

  return (
    <>
      <DialogFormShell
        open={open}
        onOpenChange={onOpenChange}
        title="Segmentos"
        maxWidth="3xl"
        footer={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo segmento
          </Button>
        }
      >
        <div className="space-y-4">
          {state.error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}

          {state.isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : state.segmentos.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Nenhum segmento encontrado.
            </div>
          ) : (
            <div className="divide-y rounded-md border">
              {state.segmentos.map((segmento) => (
                <div
                  key={segmento.id}
                  className="flex items-center justify-between gap-3 p-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {segmento.nome}
                      </span>
                      <Badge variant={segmento.ativo ? "success" : "secondary"}>
                        {segmento.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    {segmento.descricao ? (
                      <div className="truncate text-xs text-muted-foreground">
                        {segmento.descricao}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onEdit(segmento)}
                          aria-label="Editar segmento"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Editar</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onDuplicate(segmento)}
                          aria-label="Duplicar segmento"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Duplicar</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onDelete(segmento)}
                          aria-label="Deletar segmento"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Deletar</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogFormShell>

      <SegmentoCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => {
          setCreateOpen(false);
          handleCreated();
        }}
      />
    </>
  );
}


