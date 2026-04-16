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
import { Loader2 } from "lucide-react";
import type { Template as AssinaturaDigitalTemplate } from '@/shared/assinatura-digital';

interface TemplateDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: AssinaturaDigitalTemplate | AssinaturaDigitalTemplate[];
  onSuccess: () => void;
}

export function TemplateDeleteDialog({
  open,
  onOpenChange,
  templates,
  onSuccess,
}: TemplateDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBulk = Array.isArray(templates);
  const templateList = isBulk ? templates : [templates];
  const templateCount = templateList.length;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const results = await Promise.allSettled(
        templateList.map(async (template) => {
          const response = await fetch(
            `/api/assinatura-digital/templates/${template.id}`,
            {
              method: "DELETE",
            }
          );
          if (!response.ok) {
            throw new Error(`Falha ao deletar template ${template.nome}`);
          }
          return template;
        })
      );

      const successful = results.filter(
        (result) => result.status === "fulfilled"
      ).length;
      const failed = results.length - successful;

      if (failed === 0) {
        toast.success(
          isBulk
            ? `${successful} template(s) excluído(s) com sucesso`
            : "Template excluído com sucesso"
        );
      } else if (successful > 0) {
        toast.warning(
          `${successful} de ${results.length} template(s) excluído(s) com sucesso. ${failed} falhou(aram).`
        );
      } else {
        throw new Error("Falha ao excluir todos os templates");
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

  const getTemplateNamesList = () => {
    if (!isBulk) return null;
    const names = templateList.slice(0, 5).map((t) => t.nome);
    const remaining = templateCount - 5;
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
            {isBulk ? "Confirmar exclusão em lote" : "Confirmar exclusão"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isBulk
              ? `Tem certeza que deseja excluir ${templateCount} template(s) selecionado(s)? Esta ação não pode ser desfeita.`
              : `Tem certeza que deseja excluir o template '${templateList[0].nome}'? Esta ação não pode ser desfeita.`}
            {getTemplateNamesList()}
            {error && (
              <p className="text-destructive text-sm mt-2">{error}</p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
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
                Excluindo...
              </>
            ) : (
              `Excluir ${isBulk ? `${templateCount} item(s)` : ""}`
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}