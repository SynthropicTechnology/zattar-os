"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Loader2 } from "lucide-react";
import {
  PAPEL_PROJETO_VALUES,
  PAPEL_PROJETO_LABELS,
  type PapelProjeto,
} from "../../lib/domain";
import { actionAdicionarMembro } from "../../lib/actions";
import { toast } from "sonner";

interface AddMemberDialogProps {
  projetoId: string;
  usuarios: ComboboxOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddMemberDialog({
  projetoId,
  usuarios,
  open,
  onOpenChange,
}: AddMemberDialogProps) {
  const [isPending, startTransition] = React.useTransition();
  const [selectedUser, setSelectedUser] = React.useState<string>("");
  const [papel, setPapel] = React.useState<PapelProjeto>("membro");

  React.useEffect(() => {
    if (open) {
      setSelectedUser("");
      setPapel("membro");
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    startTransition(async () => {
      const result = await actionAdicionarMembro({
        projetoId,
        usuarioId: Number(selectedUser),
        papel,
      });

      if (result.success) {
        toast.success("Membro adicionado com sucesso!");
        onOpenChange(false);
      } else {
        toast.error(result.error?.message ?? "Erro ao adicionar membro. Tente novamente.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-100">
        <DialogHeader>
          <DialogTitle>Adicionar Membro</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Usuário</label>
            <Combobox
              options={usuarios}
              value={selectedUser ? [selectedUser] : []}
              onValueChange={(vals) => setSelectedUser(vals[0] ?? "")}
              placeholder="Selecione um usuário..."
              searchPlaceholder="Buscar usuário..."
              emptyText="Nenhum usuário encontrado."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Papel</label>
            <Select
              value={papel}
              onValueChange={(v) => setPapel(v as PapelProjeto)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAPEL_PROJETO_VALUES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {PAPEL_PROJETO_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !selectedUser}>
              {isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Adicionar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
