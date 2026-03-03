"use client";

import React, { useEffect, useRef, useState } from "react";
import { addDays, addHours, format, nextSaturday } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Archive,
  ArchiveX,
  Clock,
  Forward,
  Loader2,
  MailOpen,
  MoreVertical,
  Reply,
  ReplyAll,
  Trash2,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { MailMessagePreview } from "@/lib/mail/types";
import { useMailActions } from "../hooks/use-mail-api";
import { useMailStore } from "../use-mail";
import { useMailDisplay } from "../hooks/use-mail-display";
import { toast } from "sonner";

interface MailDisplayProps {
  mail: MailMessagePreview | null;
}

function MailBody({ mail }: { mail: MailMessagePreview }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { fullMessage } = useMailStore();
  const { fetchMessage } = useMailActions();
  const [isLoadingBody, setIsLoadingBody] = useState(true);

  useEffect(() => {
    setIsLoadingBody(true);
    fetchMessage(mail.uid, mail.folder).finally(() => setIsLoadingBody(false));
  }, [mail.uid, mail.folder, fetchMessage]);

  const isLoaded = fullMessage?.uid === mail.uid;
  const htmlContent = isLoaded ? fullMessage.html : null;
  const textContent = isLoaded ? (fullMessage.text || mail.preview) : mail.preview;

  useEffect(() => {
    if (!htmlContent || !iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 14px;
            line-height: 1.6;
            color: #1a1a1a;
            margin: 0;
            padding: 0;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          img { max-width: 100%; height: auto; }
          a { color: #2563eb; }
          pre { overflow-x: auto; }
          table { max-width: 100%; }
        </style>
      </head>
      <body>${htmlContent}</body>
      </html>
    `);
    doc.close();

    const resizeObserver = new ResizeObserver(() => {
      if (iframeRef.current && doc.body) {
        iframeRef.current.style.height = doc.body.scrollHeight + "px";
      }
    });
    if (doc.body) resizeObserver.observe(doc.body);
    return () => resizeObserver.disconnect();
  }, [htmlContent]);

  if (isLoadingBody && !isLoaded) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/6" />
      </div>
    );
  }

  if (htmlContent) {
    return (
      <iframe
        ref={iframeRef}
        className="w-full border-0"
        sandbox="allow-same-origin"
        title="Conteúdo do e-mail"
      />
    );
  }

  return (
    <div className="text-sm whitespace-pre-wrap">{textContent}</div>
  );
}

function ForwardDialog({
  mail,
  children,
}: {
  mail: MailMessagePreview;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState("");
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { forwardMessage } = useMailActions();

  const handleForward = async () => {
    if (!to.trim()) return;
    setIsSending(true);
    try {
      await forwardMessage(
        mail.uid,
        mail.folder,
        to.split(",").map((e) => e.trim()),
        text
      );
      toast.success("E-mail encaminhado");
      setOpen(false);
      setTo("");
      setText("");
    } catch {
      toast.error("Erro ao encaminhar");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="grid gap-3">
          <div className="text-sm font-medium">Encaminhar e-mail</div>
          <div className="grid gap-2">
            <Label htmlFor="forward-to" className="text-xs">
              Para (separar com vírgula)
            </Label>
            <Input
              id="forward-to"
              type="email"
              placeholder="email@exemplo.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="forward-text" className="text-xs">
              Mensagem adicional
            </Label>
            <Textarea
              id="forward-text"
              placeholder="Opcional..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
            />
          </div>
          <Button
            size="sm"
            onClick={handleForward}
            disabled={isSending || !to.trim()}>
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Encaminhando...
              </>
            ) : (
              "Encaminhar"
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function MailDisplay({ mail }: MailDisplayProps) {
  const today = new Date();
  const {
    replyText,
    setReplyText,
    isSending,
    actionLoading,
    senderName,
    senderInitials,
    handleReply,
    actions,
  } = useMailDisplay(mail);

  const replyRef = useRef<HTMLTextAreaElement>(null);

  const scrollToReply = () => {
    replyRef.current?.focus();
    replyRef.current?.scrollIntoView({ behavior: "smooth" });
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
                disabled={!mail || actionLoading === "archive"}
                onClick={() => actions?.archive()}>
                {actionLoading === "archive" ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Archive />
                )}
                <span className="sr-only">Arquivar</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Arquivar</TooltipContent>
          </Tooltip>

          {/* Junk — with confirmation */}
          <AlertDialog>
            <Tooltip>
              <AlertDialogTrigger asChild>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={!mail || actionLoading === "junk"}>
                    {actionLoading === "junk" ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <ArchiveX />
                    )}
                    <span className="sr-only">Lixo eletrônico</span>
                  </Button>
                </TooltipTrigger>
              </AlertDialogTrigger>
              <TooltipContent>Lixo eletrônico</TooltipContent>
            </Tooltip>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Mover para lixo eletrônico?</AlertDialogTitle>
                <AlertDialogDescription>
                  O e-mail será movido para a pasta de lixo eletrônico.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => actions?.junk()}>
                  Mover
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Delete — with confirmation */}
          <AlertDialog>
            <Tooltip>
              <AlertDialogTrigger asChild>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={!mail || actionLoading === "delete"}>
                    {actionLoading === "delete" ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Trash2 />
                    )}
                    <span className="sr-only">Excluir</span>
                  </Button>
                </TooltipTrigger>
              </AlertDialogTrigger>
              <TooltipContent>Excluir</TooltipContent>
            </Tooltip>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir e-mail?</AlertDialogTitle>
                <AlertDialogDescription>
                  O e-mail será movido para a lixeira.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => actions?.delete()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
                  <Button
                    variant="ghost"
                    className="justify-start font-normal"
                    onClick={() => toast.info("Adiado para mais tarde")}>
                    Mais tarde{" "}
                    <span className="text-muted-foreground ml-auto">
                      {format(addHours(today, 4), "E, HH:mm", { locale: ptBR })}
                    </span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start font-normal"
                    onClick={() => toast.info("Adiado para amanhã")}>
                    Amanhã
                    <span className="text-muted-foreground ml-auto">
                      {format(addDays(today, 1), "E, HH:mm", { locale: ptBR })}
                    </span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start font-normal"
                    onClick={() => toast.info("Adiado para o fim de semana")}>
                    Fim de semana
                    <span className="text-muted-foreground ml-auto">
                      {format(nextSaturday(today), "E, HH:mm", { locale: ptBR })}
                    </span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start font-normal"
                    onClick={() => toast.info("Adiado para a próxima semana")}>
                    Próxima semana
                    <span className="text-muted-foreground ml-auto">
                      {format(addDays(today, 7), "E, HH:mm", { locale: ptBR })}
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
              <Button
                variant="ghost"
                size="icon"
                disabled={!mail}
                onClick={scrollToReply}>
                <Reply />
                <span className="sr-only">Responder</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Responder</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={!mail}
                onClick={scrollToReply}>
                <ReplyAll />
                <span className="sr-only">Responder a todos</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Responder a todos</TooltipContent>
          </Tooltip>

          {mail ? (
            <ForwardDialog mail={mail}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Forward />
                    <span className="sr-only">Encaminhar</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Encaminhar</TooltipContent>
              </Tooltip>
            </ForwardDialog>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" disabled>
                  <Forward />
                  <span className="sr-only">Encaminhar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Encaminhar</TooltipContent>
            </Tooltip>
          )}
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
            <DropdownMenuItem onClick={() => actions?.markUnread()}>
              Marcar como não lido
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions?.star()}>
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

          <div className="min-h-0 flex-1 overflow-auto p-4">
            <MailBody mail={mail} />
          </div>

          <Separator />

          <div className="shrink-0 p-4">
            <form onSubmit={(e) => handleReply(e)}>
              <div className="grid gap-4">
                <Textarea
                  ref={replyRef}
                  className="p-4"
                  placeholder={`Responder ${senderName}...`}
                  value={replyText}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setReplyText(e.target.value)
                  }
                />
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSending || !replyText.trim()}
                    onClick={(e) => handleReply(e, true)}>
                    {isSending ? "Enviando..." : "Responder a todos"}
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSending || !replyText.trim()}>
                    {isSending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      "Enviar"
                    )}
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
