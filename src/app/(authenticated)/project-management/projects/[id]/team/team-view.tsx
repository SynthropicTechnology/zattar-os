"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  MoreHorizontal,
  UserMinus,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ComboboxOption } from "@/components/ui/combobox";
import {
  type MembroProjeto,
  type Projeto,
  type PapelProjeto,
  PAPEL_PROJETO_LABELS,
  PAPEL_PROJETO_VALUES,
} from "../../../lib/domain";
import {
  actionRemoverMembro,
  actionAlterarPapel,
} from "../../../lib/actions";
import { AddMemberDialog } from "../../../components/team/add-member-dialog";
import { toast } from "sonner";

interface TeamViewProps {
  projeto: Projeto;
  membros: MembroProjeto[];
  usuarios: ComboboxOption[];
}

export function TeamView({ projeto, membros, usuarios }: TeamViewProps) {
  const [formOpen, setFormOpen] = React.useState(false);
  const [membroToRemove, setMembroToRemove] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const grouped = React.useMemo(() => {
    const groups: Record<PapelProjeto, MembroProjeto[]> = {
      gerente: [],
      membro: [],
      observador: [],
    };
    for (const m of membros) {
      groups[m.papel].push(m);
    }
    return groups;
  }, [membros]);

  const membrosIds = new Set(membros.map((m) => String(m.usuarioId)));
  const availableUsers = usuarios.filter((u) => !membrosIds.has(u.value));

  const handleRemove = (membroId: string) => {
    startTransition(async () => {
      const result = await actionRemoverMembro(membroId, projeto.id);
      if (result.success) {
        toast.success("Membro removido da equipe.");
      } else {
        toast.error(result.error?.message ?? "Erro ao remover membro. Tente novamente.");
      }
    });
  };

  const handleChangeRole = (membroId: string, papel: PapelProjeto) => {
    startTransition(async () => {
      const result = await actionAlterarPapel(membroId, papel, projeto.id);
      if (result.success) {
        toast.success("Papel atualizado com sucesso.");
      } else {
        toast.error(result.error?.message ?? "Erro ao alterar papel. Tente novamente.");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" aria-label="Voltar" asChild>
            <Link href={`/app/project-management/projects/${projeto.id}`}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Equipe</h1>
            <p className="text-muted-foreground text-sm">{projeto.nome}</p>
          </div>
        </div>

        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-1 size-4" />
          Adicionar Membro
        </Button>
      </div>

      {PAPEL_PROJETO_VALUES.map((papel) => {
        const group = grouped[papel];
        if (group.length === 0) return null;

        return (
          <Card key={papel}>
            <CardHeader>
              <CardTitle className="text-lg">
                {PAPEL_PROJETO_LABELS[papel]}s ({group.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {group.map((membro) => {
                  const initials = (membro.usuarioNome ?? "U")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <div
                      key={membro.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar size="lg">
                          {membro.usuarioAvatar && (
                            <AvatarImage src={membro.usuarioAvatar} />
                          )}
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {membro.usuarioNome ?? "Usuário"}
                          </p>
                          {membro.usuarioEmail && (
                            <p className="text-muted-foreground text-xs">
                              {membro.usuarioEmail}
                            </p>
                          )}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon" aria-label="Mais opções"
                            disabled={isPending}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <Shield className="mr-2 size-4" />
                              Alterar Papel
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              {PAPEL_PROJETO_VALUES.map((p) => (
                                <DropdownMenuItem
                                  key={p}
                                  disabled={p === membro.papel}
                                  onClick={() =>
                                    handleChangeRole(membro.id, p)
                                  }
                                >
                                  {PAPEL_PROJETO_LABELS[p]}
                                  {p === membro.papel && " (atual)"}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setMembroToRemove(membro.id)}
                          >
                            <UserMinus className="mr-2 size-4" />
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {membros.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Nenhum membro na equipe. Clique em &quot;Adicionar Membro&quot;
              para começar.
            </p>
          </CardContent>
        </Card>
      )}

      <AlertDialog
        open={!!membroToRemove}
        onOpenChange={(open) => !open && setMembroToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover membro da equipe?</AlertDialogTitle>
            <AlertDialogDescription>
              O membro será removido do projeto. Esta ação pode ser revertida
              adicionando-o novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (membroToRemove) handleRemove(membroToRemove);
                setMembroToRemove(null);
              }}
            >
              Sim, remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddMemberDialog
        projetoId={projeto.id}
        usuarios={availableUsers}
        open={formOpen}
        onOpenChange={setFormOpen}
      />
    </div>
  );
}
