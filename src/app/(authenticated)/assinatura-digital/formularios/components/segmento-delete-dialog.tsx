"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle } from "lucide-react";
import type { AssinaturaDigitalSegmento } from '@/shared/assinatura-digital';

interface SegmentoDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segmentos: AssinaturaDigitalSegmento[];
  onSuccess: () => void;
}

export function SegmentoDeleteDialog({
  open,
  onOpenChange,
  segmentos,
  onSuccess,
}: SegmentoDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBulk = segmentos.length > 1;
  const segmentoCount = segmentos.length;
  const hasAssociatedFormularios = segmentos.some(s => (s.formularios_count ?? 0) > 0);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const results = await Promise.allSettled(
        segmentos.map(async (segmento) => {
          const response = await fetch(
            `/api/assinatura-digital/segmentos/${segmento.id}`,
            {
              method: "DELETE",
            }
          );
          if (!response.ok) {
            if (response.status === 409) {
              throw new Error(`Segmento '${segmento.nome}' possui formulários associados e não pode ser deletado`);
            }
            throw new Error(`Falha ao deletar segmento ${segmento.nome}`);
          }
          return segmento;
        })
      );

      const successful = results.filter(
        (result) => result.status === "fulfilled"
      ).length;
      const failed = results.length - successful;

      if (failed === 0) {
        toast.success(
          isBulk
            ? `${successful} segmento(s) deletado(s) com sucesso`
            : "Segmento deletado com sucesso"
        );
      } else if (successful > 0) {
        toast.warning(
          `${successful} de ${results.length} deletados, ${failed} falharam`
        );
      } else {
        throw new Error("Falha ao deletar todos os segmentos");
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const getSegmentoNamesList = () => {
    if (!isBulk) return null;
    const names = segmentos.slice(0, 5).map((s) => s.nome);
    const remaining = segmentoCount - 5;
    return (
      <ul className="list-disc list-inside mt-2">
        {names.map((name, index) => (
          <li key={index}>{name}</li>
        ))}
        {remaining > 0 && <li>E mais {remaining}...</li>}
      </ul>
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isBulk ? `Deletar ${segmentoCount} Segmentos` : "Deletar Segmento"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isBulk
              ? `Tem certeza que deseja excluir ${segmentoCount} segmento(s) selecionado(s)?`
              : `Tem certeza que deseja excluir o segmento '${segmentos[0]?.nome ?? ''}'?`}
            {getSegmentoNamesList()}
            {error && (
              <p className="text-destructive text-sm mt-2">{error}</p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {hasAssociatedFormularios && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Alguns segmentos possuem formulários associados e não podem ser deletados.
            </AlertDescription>
          </Alert>
        )}
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Esta ação não pode ser desfeita. Os segmentos serão permanentemente removidos.
          </AlertDescription>
        </Alert>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deletando...
              </>
            ) : (
              `Deletar ${isBulk ? `${segmentoCount} item(s)` : ""}`
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}