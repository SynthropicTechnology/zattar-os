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
import type { AssinaturaDigitalFormulario } from '@/shared/assinatura-digital';

interface FormularioDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formularios: AssinaturaDigitalFormulario[];
  onSuccess: () => void;
}

export function FormularioDeleteDialog({
  open,
  onOpenChange,
  formularios,
  onSuccess,
}: FormularioDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBulk = formularios.length > 1;
  const formularioCount = formularios.length;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const results = await Promise.allSettled(
        formularios.map(async (formulario) => {
          const response = await fetch(
            `/api/assinatura-digital/formularios/${formulario.id}`,
            {
              method: "DELETE",
            }
          );
          if (!response.ok) {
            throw new Error(`Falha ao deletar formulário ${formulario.nome}`);
          }
          return formulario;
        })
      );

      const successful = results.filter(
        (result) => result.status === "fulfilled"
      ).length;
      const failed = results.length - successful;

      if (failed === 0) {
        toast.success(
          isBulk
            ? `${successful} formulário(s) deletado(s) com sucesso`
            : "Formulário deletado com sucesso"
        );
      } else if (successful > 0) {
        toast.warning(
          `${successful} de ${results.length} deletados, ${failed} falharam`
        );
      } else {
        throw new Error("Falha ao deletar todos os formulários");
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

  const getFormularioNamesList = () => {
    if (!isBulk) return null;
    const names = formularios.slice(0, 5).map((f) => f.nome);
    const remaining = formularioCount - 5;
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
            {isBulk ? `Deletar ${formularioCount} Formulários` : "Deletar Formulário"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isBulk
              ? `Tem certeza que deseja excluir ${formularioCount} formulário(s) selecionado(s)?`
              : `Tem certeza que deseja excluir o formulário '${formularios[0]?.nome ?? ''}'?`}
            {getFormularioNamesList()}
            {error && (
              <p className="text-destructive text-sm mt-2">{error}</p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Esta ação não pode ser desfeita. O formulário será permanentemente removido.
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
              `Deletar ${isBulk ? `${formularioCount} item(s)` : ""}`
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}