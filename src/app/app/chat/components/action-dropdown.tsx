"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { NovoChatDialog } from "./novo-chat-dialog";
import { CriarGrupoDialog } from "./criar-grupo-dialog";

interface ActionDropdownProps {
  variant?: "default" | "outline";
}

export function ActionDropdown({ variant = "default" }: ActionDropdownProps) {
  const [showNovoChatDialog, setShowNovoChatDialog] = useState(false);
  const [showCriarGrupoDialog, setShowCriarGrupoDialog] = useState(false);
  const router = useRouter();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size="icon" className="rounded-full">
            <Plus className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setShowNovoChatDialog(true)}>Novo chat</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowCriarGrupoDialog(true)}>Criar grupo</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/chat/historico-chamadas')}>
              Histórico de chamadas
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <NovoChatDialog
        open={showNovoChatDialog}
        onOpenChange={setShowNovoChatDialog}
      />

      <CriarGrupoDialog
        open={showCriarGrupoDialog}
        onOpenChange={setShowCriarGrupoDialog}
      />
    </>
  );
}
