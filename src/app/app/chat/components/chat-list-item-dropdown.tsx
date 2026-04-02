"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
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
import { toast } from "sonner";
import useChatStore from "./useChatStore";
import { ChatItem } from "../domain";
import { actionRemoverConversa } from "../actions/chat-actions";

interface ChatUserDropdownProps {
  children: React.ReactNode;
  chat?: ChatItem;
}

export function ChatUserDropdown({ children, chat }: ChatUserDropdownProps) {
  const { toggleProfileSheet, removerSala } = useChatStore();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleArchive = async () => {
    if (!chat) return;
    // TODO: Call actionArquivarSala(chat.id)
  };

  const handleDeleteClick = () => {
    if (!chat) return;
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!chat) return;
    setIsDeleting(true);
    try {
      const result = await actionRemoverConversa(chat.id);
      if (result.success) {
        toast.success("Conversa removida com sucesso");
        // Remover a sala do store (atualiza a lista automaticamente)
        removerSala(chat.id);
      } else {
        toast.error(result.error || "Erro ao remover conversa");
      }
    } catch {
      toast.error("Erro ao remover conversa");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => toggleProfileSheet(true)}>Ver perfil</DropdownMenuItem>
            <DropdownMenuItem onClick={handleArchive}>Arquivar</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Bloquear</DropdownMenuItem>
            <DropdownMenuItem onClick={handleDeleteClick} className="text-red-500">Deletar</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Conversa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta conversa da sua lista? A conversa continuará disponível para os outros participantes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}