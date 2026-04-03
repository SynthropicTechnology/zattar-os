"use client";

import { Row } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

import { TarefaDisplayItem, TaskLabel } from "../domain";
import { labels } from "@/app/(authenticated)/tarefas/data/data";
import { useTarefaStore } from "../store";
import * as actions from "../actions/tarefas-actions";
import { toast } from "sonner";
import * as React from "react";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({ row }: DataTableRowActionsProps<TData>) {
  const task = row.original as TarefaDisplayItem;
  const { setSelectedTarefaId, setTarefaSheetOpen, upsertTarefa, removeTarefa } = useTarefaStore();
  const [_isPending, startTransition] = React.useTransition();

  const handleEdit = () => {
    setSelectedTarefaId(task.id);
    setTarefaSheetOpen(true);
  };

  const handleToggleStarred = () => {
    startTransition(async () => {
      const result = await actions.actionAtualizarTarefa({
        id: task.id,
        starred: !task.starred,
      });
      if (result.success) {
        upsertTarefa({ ...task, starred: !task.starred });
        toast.success(task.starred ? "Removido dos favoritos" : "Adicionado aos favoritos");
      }
    });
  };

  const handleDelete = () => {
    if (confirm("Tem certeza que deseja excluir esta tarefa?")) {
      startTransition(async () => {
        const result = await actions.actionRemoverTarefa({ id: task.id });
        if (result.success) {
          removeTarefa(task.id);
          toast.success("Tarefa excluída");
        }
      });
    }
  };

  const handleUpdateLabel = (labelValue: string) => {
    startTransition(async () => {
      const result = await actions.actionAtualizarTarefa({
        id: task.id,
        label: labelValue as TaskLabel,
      });
      if (result.success) {
        upsertTarefa({ ...task, label: labelValue as TaskLabel });
        toast.success("Etiqueta atualizada");
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="data-[state=open]:bg-muted size-8">
          <MoreHorizontal />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={handleEdit}>Detalhes</DropdownMenuItem>
        {!task.source && (
          <DropdownMenuItem onClick={handleToggleStarred}>
            {task.starred ? "Remover favorito" : "Favoritar"}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger disabled={task.isVirtual}>Etiquetas</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={task.label}
              onValueChange={handleUpdateLabel}
            >
              {labels.map((label) => (
                <DropdownMenuRadioItem key={label.value} value={label.value}>
                  {label.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={handleDelete}
          disabled={task.isVirtual}
        >
          Excluir
          <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
