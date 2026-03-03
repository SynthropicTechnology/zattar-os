"use client";

import React from "react";
import { addDays, addHours, format, nextSaturday } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Archive,
  ArchiveX,
  Clock,
  Forward,
  MailOpen,
  MoreVertical,
  Reply,
  ReplyAll,
  Trash2
} from "lucide-react";

import { DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { MailMessagePreview } from "@/lib/mail/types";
import { useMailActions } from "../hooks/use-mail-api";
import { useMailStore } from "../use-mail";
import { toast } from "sonner";

interface MailDisplayProps {
  mail: MailMessagePreview | null;
}

export function MailDisplay({ mail }: MailDisplayProps) {
  const today = new Date();
  const [replyText, setReplyText] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const { deleteMessage, moveMessage, markUnread, starMessage, reply } = useMailActions();
  const { setSelectedMail } = useMailStore();

  const senderName = mail ? (mail.from.name || mail.from.address) : "";
  const senderInitials = senderName
    .split(" ")
    .map((chunk) => chunk[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mail || !replyText.trim()) return;
    setIsSending(true);
    try {
      await reply(mail.uid, mail.folder, replyText);
      setReplyText("");
      toast.success("Resposta enviada");
    } catch {
      toast.error("Erro ao enviar resposta");
    } finally {
      setIsSending(false);
    }
  };

  const handleAction = async (action: () => Promise<void>, successMsg: string) => {
    try {
      await action();
      setSelectedMail(null);
      toast.success(successMsg);
    } catch {
      toast.error("Erro ao executar ação");
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-13 shrink-0 items-center gap-2 px-2">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={!mail}
                onClick={() => mail && handleAction(() => moveMessage(mail.uid, mail.folder, "Archive"), "Arquivado")}>
                <Archive />
                <span className="sr-only">Arquivar</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Arquivar</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={!mail}
                onClick={() => mail && handleAction(() => moveMessage(mail.uid, mail.folder, "Junk"), "Movido para lixo eletrônico")}>
                <ArchiveX />
                <span className="sr-only">Lixo eletrônico</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Lixo eletrônico</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={!mail}
                onClick={() => mail && handleAction(() => deleteMessage(mail.uid, mail.folder), "Excluído")}>
                <Trash2 />
                <span className="sr-only">Excluir</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Excluir</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Tooltip>
          <Popover>
            <PopoverTrigger asChild>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" disabled={!mail}>
                  <Clock />
                  <span className="sr-only">Adiar</span>
                </Button>
              </TooltipTrigger>
            </PopoverTrigger>
            <PopoverContent className="flex w-133.75 p-0">
              <div className="flex flex-col gap-2 border-r px-2 py-4">
                <div className="px-4 text-sm font-medium">Adiar até</div>
                <div className="grid min-w-62.5 gap-1">
                  <Button variant="ghost" className="justify-start font-normal">
                    Mais tarde{" "}
                    <span className="text-muted-foreground ml-auto">
                      {format(addHours(today, 4), "E, h:m b")}
                    </span>
                  </Button>
                  <Button variant="ghost" className="justify-start font-normal">
                    Amanhã
                    <span className="text-muted-foreground ml-auto">
                      {format(addDays(today, 1), "E, h:m b")}
                    </span>
                  </Button>
                  <Button variant="ghost" className="justify-start font-normal">
                    Fim de semana
                    <span className="text-muted-foreground ml-auto">
                      {format(nextSaturday(today), "E, h:m b")}
                    </span>
                  </Button>
                  <Button variant="ghost" className="justify-start font-normal">
                    Próxima semana
                    <span className="text-muted-foreground ml-auto">
                      {format(addDays(today, 7), "E, h:m b")}
                    </span>
                  </Button>
                </div>
              </div>
              <div className="p-2">
                <Calendar />
              </div>
            </PopoverContent>
          </Popover>
          <TooltipContent>Adiar</TooltipContent>
        </Tooltip>

        <div className="ml-auto flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!mail}>
                <Reply />
                <span className="sr-only">Responder</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Responder</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!mail}>
                <ReplyAll />
                <span className="sr-only">Responder a todos</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Responder a todos</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!mail}>
                <Forward />
                <span className="sr-only">Encaminhar</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Encaminhar</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={!mail}>
              <MoreVertical />
              <span className="sr-only">Mais</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => mail && markUnread(mail.uid, mail.folder)}>
              Marcar como não lido
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => mail && starMessage(mail.uid, mail.folder)}>
              Marcar com estrela
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Separator />

      {mail ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 items-start p-4">
            <div className="flex items-start gap-4 text-sm">
              <Avatar>
                <AvatarFallback>{senderInitials}</AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <div className="font-semibold">{senderName}</div>
                <div className="line-clamp-1 text-xs">{mail.subject}</div>
                <div className="line-clamp-1 text-xs">
                  <span className="font-medium">De:</span> {mail.from.address}
                </div>
              </div>
            </div>
            <div className="text-muted-foreground ml-auto text-xs">
              {format(new Date(mail.date), "PPpp", { locale: ptBR })}
            </div>
          </div>

          <Separator />

          <div className="min-h-0 flex-1 overflow-auto p-4 text-sm whitespace-pre-wrap">
            {mail.preview}
          </div>

          <Separator />

          <div className="shrink-0 p-4">
            <form onSubmit={handleReply}>
              <div className="grid gap-4">
                <Textarea
                  className="p-4"
                  placeholder={`Responder ${senderName}...`}
                  value={replyText}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReplyText(e.target.value)}
                />
                <div className="flex items-center justify-end">
                  <Button type="submit" size="sm" disabled={isSending || !replyText.trim()}>
                    {isSending ? "Enviando..." : "Enviar"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2 p-8">
          <MailOpen className="h-10 w-10 opacity-40" />
          <p className="text-sm">Selecione um e-mail para visualizar</p>
        </div>
      )}
    </div>
  );
}
