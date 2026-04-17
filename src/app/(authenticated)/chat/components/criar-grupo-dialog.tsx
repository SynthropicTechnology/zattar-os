"use client";

import { useState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { X } from "lucide-react";
import { DialogFormShell } from "@/components/shared/dialog-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppBadge as Badge } from "@/components/ui/app-badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { actionCriarGrupo } from "../actions/chat-actions";
import { actionListarUsuarios } from "@/app/(authenticated)/usuarios";
import { type ChatItem } from "../domain";
import useChatStore from "../hooks/use-chat-store";

// Schema para criação de grupo
const criarGrupoSchema = z.object({
  nome: z.string().min(1, "Nome do grupo é obrigatório").max(100, "Nome muito longo"),
  membros: z.array(z.number()).min(1, "Adicione pelo menos um membro ao grupo"),
});

type CriarGrupoInput = z.infer<typeof criarGrupoSchema>;

interface CriarGrupoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGrupoCreated?: (grupo: ChatItem) => void;
}

interface UsuarioOption {
  id: number;
  nome: string;
}

export function CriarGrupoDialog({ open, onOpenChange, onGrupoCreated }: CriarGrupoDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [usuarios, setUsuarios] = useState<UsuarioOption[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [membrosSelecionados, setMembrosSelecionados] = useState<UsuarioOption[]>([]);
  const { setSelectedChat, adicionarSala } = useChatStore();

  const form = useForm<CriarGrupoInput>({
    resolver: zodResolver(criarGrupoSchema),
    defaultValues: {
      nome: "",
      membros: [],
    },
  });

  // Carregar usuários quando o dialog abrir
  useEffect(() => {
    if (open && usuarios.length === 0) {
      let cancelled = false;

      const loadUsuarios = async () => {
        setLoadingUsuarios(true);
        try {
          const result = await actionListarUsuarios({ ativo: true, limite: 100 });
          if (!cancelled && result.success && result.data) {
            const usuariosList = result.data.usuarios?.map((u: { id: number; nomeCompleto: string }) => ({
              id: u.id,
              nome: u.nomeCompleto,
            })) || [];
            setUsuarios(usuariosList);
          }
        } catch {
          if (!cancelled) {
            toast.error("Erro ao carregar usuários");
          }
        } finally {
          if (!cancelled) {
            setLoadingUsuarios(false);
          }
        }
      };

      loadUsuarios();

      return () => {
        cancelled = true;
      };
    }
  }, [open, usuarios.length]);

  // Resetar form quando fechar
  useEffect(() => {
    if (!open) {
      // Usar cleanup function para resetar quando o dialog fecha
      return () => {
        form.reset();
        setMembrosSelecionados([]);
      };
    }
  }, [open, form]);

  // Usuários disponíveis (não selecionados ainda)
  const usuariosDisponiveis = usuarios.filter(
    u => !membrosSelecionados.some(m => m.id === u.id)
  );

  const handleAddMembro = (usuarioId: string) => {
    const usuario = usuarios.find(u => u.id.toString() === usuarioId);
    if (usuario && !membrosSelecionados.some(m => m.id === usuario.id)) {
      const novosMembros = [...membrosSelecionados, usuario];
      setMembrosSelecionados(novosMembros);
      form.setValue("membros", novosMembros.map(m => m.id));
    }
  };

  const handleRemoveMembro = (usuarioId: number) => {
    const novosMembros = membrosSelecionados.filter(m => m.id !== usuarioId);
    setMembrosSelecionados(novosMembros);
    form.setValue("membros", novosMembros.map(m => m.id));
  };

  const handleSubmit = (data: CriarGrupoInput) => {
    startTransition(async () => {
      const result = await actionCriarGrupo(data.nome, data.membros);

      if (result.success) {
        toast.success("Grupo criado com sucesso!");
        onOpenChange(false);

        if (result.data) {
          const novoGrupo = result.data as ChatItem;
          adicionarSala(novoGrupo);
          setSelectedChat(novoGrupo);
          onGrupoCreated?.(novoGrupo);
        }
      } else {
        if ("error" in result) {
          toast.error(result.error || "Erro ao criar grupo");
        }
      }
    });
  };

  return (
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title="Criar Grupo"
      maxWidth="md"
      footer={
        <Button
          type="submit"
          form="criar-grupo-form"
          disabled={isPending || membrosSelecionados.length === 0}
        >
          {isPending ? "Criando..." : "Criar Grupo"}
        </Button>
      }
    >
      <Form {...form}>
        <form
          id="criar-grupo-form"
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-4 p-6"
        >
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Grupo</FormLabel>
                <FormControl>
                  <Input
                    variant="glass"
                    placeholder="Ex: Equipe de Vendas"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <FormLabel>Adicionar Membros</FormLabel>
            <Select onValueChange={handleAddMembro} value="">
              <SelectTrigger>
                <SelectValue placeholder={loadingUsuarios ? "Carregando..." : "Selecione um membro"} />
              </SelectTrigger>
              <SelectContent>
                {usuariosDisponiveis.map((usuario) => (
                  <SelectItem key={usuario.id} value={usuario.id.toString()}>
                    {usuario.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Lista de membros selecionados */}
            {membrosSelecionados.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {membrosSelecionados.map((membro) => (
                  <Badge key={membro.id} variant="secondary" className="flex items-center gap-1 pr-1">
                    {membro.nome}
                    <button
                      type="button"
                      onClick={() => handleRemoveMembro(membro.id)}
                      className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                      aria-label={`Remover ${membro.nome} do grupo`}
                      title={`Remover ${membro.nome} do grupo`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {form.formState.errors.membros && (
              <p className="text-sm text-destructive">{form.formState.errors.membros.message}</p>
            )}
          </div>
        </form>
      </Form>
    </DialogFormShell>
  );
}
