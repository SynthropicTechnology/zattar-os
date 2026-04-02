"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { DialogFormShell } from "@/components/shared/dialog-shell";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { actionCriarSala } from "../actions/chat-actions";
import { actionListarUsuarios } from "@/app/app/usuarios";
import { TipoSalaChat, type ChatItem } from "../domain";
import useChatStore from "./useChatStore";

interface NovoChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChatCreated?: (chat: ChatItem) => void;
}

interface UsuarioOption {
  id: number;
  nome: string;
}

export function NovoChatDialog({ open, onOpenChange, onChatCreated }: NovoChatDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [usuarios, setUsuarios] = useState<UsuarioOption[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [selectedUsuarioId, setSelectedUsuarioId] = useState<string>("");
  const { setSelectedChat, adicionarSala } = useChatStore();

  // Carregar usuários quando o dialog abrir
  useEffect(() => {
    if (!open || usuarios.length > 0) return;

    let cancelled = false;

    const loadUsers = async () => {
      try {
        const result = await actionListarUsuarios({ ativo: true, limite: 100 });
        if (cancelled) return;

        if (result.success && result.data) {
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

    setLoadingUsuarios(true);
    loadUsers();

    return () => {
      cancelled = true;
    };
  }, [open, usuarios.length]);

  // Handle dialog close - reset selection
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedUsuarioId("");
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = () => {
    if (!selectedUsuarioId) {
      toast.error("Selecione uma pessoa para conversar");
      return;
    }

    const usuarioSelecionado = usuarios.find(u => u.id.toString() === selectedUsuarioId);
    if (!usuarioSelecionado) return;

    const formData = new FormData();
    // Nome será o nome da pessoa (para exibição na lista do criador)
    formData.append("nome", usuarioSelecionado.nome);
    formData.append("tipo", TipoSalaChat.Privado);
    formData.append("participanteId", selectedUsuarioId);

    startTransition(async () => {
      const result = await actionCriarSala(null, formData);

      if (result.success) {
        toast.success("Conversa iniciada!");
        handleOpenChange(false);

        if (result.data) {
          // O service retorna SalaChat (sem name/image/usuario).
          // Precisamos montar o ChatItem completo para exibição correta.
          const salaBase = result.data as ChatItem;
          const novoChat: ChatItem = {
            ...salaBase,
            name: usuarioSelecionado.nome,
            usuario: {
              id: Number(selectedUsuarioId),
              nomeCompleto: usuarioSelecionado.nome,
              nomeExibicao: null,
              emailCorporativo: null,
            },
          };
          adicionarSala(novoChat);
          setSelectedChat(novoChat);
          onChatCreated?.(novoChat);
        }
      } else {
        if ("error" in result) {
          toast.error(result.error || "Erro ao iniciar conversa");
        }
      }
    });
  };

  return (
    <DialogFormShell
      open={open}
      onOpenChange={handleOpenChange}
      title="Nova Conversa"
      maxWidth="sm"
      footer={
        <Button
          onClick={handleSubmit}
          disabled={isPending || !selectedUsuarioId}
        >
          {isPending ? "Iniciando..." : "Iniciar Conversa"}
        </Button>
      }
    >
      <div className="space-y-2 px-6 py-4">
        <Label>Com quem você quer conversar?</Label>
        <Select
          onValueChange={setSelectedUsuarioId}
          value={selectedUsuarioId}
        >
          <SelectTrigger>
            <SelectValue placeholder={loadingUsuarios ? "Carregando..." : "Selecione uma pessoa"} />
          </SelectTrigger>
          <SelectContent>
            {usuarios.map((usuario) => (
              <SelectItem key={usuario.id} value={usuario.id.toString()}>
                {usuario.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </DialogFormShell>
  );
}
