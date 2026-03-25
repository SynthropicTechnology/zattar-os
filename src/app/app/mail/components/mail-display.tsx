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
  Maximize2,
  Minimize2,
  MoreVertical,
  Reply,
  ReplyAll,
  Trash2,
} from "lucide-react";

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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { MailMessagePreview } from "@/lib/mail/types";
import { useMailActions } from "../hooks/use-mail-api";
import { useMailStore } from "../use-mail";
import { useMailDisplay } from "../hooks/use-mail-display";
import { MailEditor, type MailEditorRef } from "./mail-editor";
import { toast } from "sonner";

interface MailDisplayProps {
  mail: MailMessagePreview | null;
}

function MailBody({ mail }: { mail: MailMessagePreview }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { fullMessage } = useMailStore();
  const { fetchMessage } = useMailActions();
  const [isLoadingBody, setIsLoadingBody] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingBody(true);
    setFetchError(false);

    fetchMessage(mail.uid, mail.folder)
      .then((data) => {
        if (!cancelled && !data) setFetchError(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingBody(false);
      });

    return () => { cancelled = true; };
  }, [mail.uid, mail.folder, fetchMessage]);

  const isLoaded = fullMessage?.uid === mail.uid;
  const htmlContent = isLoaded ? fullMessage.html : null;
  const textContent = isLoaded ? (fullMessage.text || mail.preview) : mail.preview;

  // Build srcdoc for HTML emails
  const srcdoc = htmlContent
    ? `<!DOCTYPE html>
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
</html>`
    : null;

  // Auto-resize iframe to fit content (including after images load)
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!srcdoc || !iframe) return;

    let resizeObserver: ResizeObserver | null = null;
    const imgCleanups: (() => void)[] = [];

    const updateHeight = () => {
      const doc = iframe.contentDocument;
      if (doc?.body) {
        iframe.style.height = doc.body.scrollHeight + "px";
      }
    };

    const handleLoad = () => {
      updateHeight();
      const doc = iframe.contentDocument;
      if (!doc) return;

      // Make links open in a new browser tab
      doc.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          const href = link.getAttribute("href");
          if (href) {
            window.open(href, "_blank", "noopener,noreferrer");
          }
        });
      });

      // Listen for image loads that affect layout height
      doc.querySelectorAll("img").forEach((img) => {
        if (!img.complete) {
          const onImgLoad = () => updateHeight();
          img.addEventListener("load", onImgLoad);
          img.addEventListener("error", onImgLoad);
          imgCleanups.push(() => {
            img.removeEventListener("load", onImgLoad);
            img.removeEventListener("error", onImgLoad);
          });
        }
      });

      // ResizeObserver for any other layout changes
      if (doc.body) {
        resizeObserver = new ResizeObserver(updateHeight);
        resizeObserver.observe(doc.body);
      }
    };

    iframe.addEventListener("load", handleLoad);

    return () => {
      iframe.removeEventListener("load", handleLoad);
      resizeObserver?.disconnect();
      imgCleanups.forEach((fn) => fn());
    };
  }, [srcdoc]);

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

  if (fetchError && !isLoaded) {
    return (
      <div className="text-sm whitespace-pre-wrap">{mail.preview || "Não foi possível carregar o conteúdo do e-mail."}</div>
    );
  }

  if (srcdoc) {
    return (
      <iframe
        ref={iframeRef}
        srcDoc={srcdoc}
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
  const [isSending, setIsSending] = useState(false);
  const { forwardMessage } = useMailActions();
  const fwdEditorRef = useRef<MailEditorRef | null>(null);

  const handleForward = async () => {
    if (!to.trim()) return;
    setIsSending(true);
    try {
      const text = fwdEditorRef.current?.getText() || "";
      const html = fwdEditorRef.current?.getHtml() || "";
      await forwardMessage(
        mail.uid,
        mail.folder,
        to.split(",").map((e) => e.trim()),
        text,
        html || undefined
      );
      toast.success("E-mail encaminhado");
      setOpen(false);
      setTo("");
      fwdEditorRef.current?.reset();
    } catch {
      toast.error("Erro ao encaminhar");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-2rem)] sm:w-96" align="end">
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
            <Label className="text-xs">
              Mensagem adicional
            </Label>
            <MailEditor
              editorRef={fwdEditorRef}
              placeholder="Opcional..."
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
    editorRef,
    isSending,
    actionLoading,
    participantName,
    participantInitials,
    participantLabel,
    participantLine,
    replyMode,
    startReply,
    cancelReply,
    handleReply,
    actions,
    isMailExpanded,
    toggleMailExpanded,
  } = useMailDisplay(mail);

  const replyAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to reply editor and focus when entering reply mode
  useEffect(() => {
    if (replyMode) {
      const timer = setTimeout(() => {
        replyAreaRef.current?.scrollIntoView({ behavior: "smooth" });
        editorRef.current?.focus();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [replyMode, editorRef]);

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

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={!mail || actionLoading === "junk"}
                onClick={() => actions?.junk()}>
                {actionLoading === "junk" ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <ArchiveX />
                )}
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
                disabled={!mail || actionLoading === "delete"}
                onClick={() => actions?.delete()}>
                {actionLoading === "delete" ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Trash2 />
                )}
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
            <PopoverContent className="flex w-[calc(100vw-2rem)] sm:w-133.75 p-0">
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
                onClick={toggleMailExpanded}>
                {isMailExpanded ? <Minimize2 /> : <Maximize2 />}
                <span className="sr-only">
                  {isMailExpanded ? "Minimizar" : "Expandir"}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isMailExpanded ? "Minimizar" : "Tela cheia"}
            </TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="mx-1 h-6" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={!mail}
                onClick={() => startReply("reply")}>
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
                onClick={() => startReply("reply-all")}>
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
          <div className="flex shrink-0 flex-wrap items-start gap-3 p-4">
            <div className="flex min-w-0 flex-1 items-start gap-4 text-sm">
              <Avatar>
                <AvatarFallback>{participantInitials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 grid flex-1 gap-1">
                <div className="whitespace-normal wrap-break-word font-semibold">{participantName}</div>
                <div className="text-xs whitespace-normal wrap-break-word">{mail.subject}</div>
                <div className="text-xs whitespace-normal wrap-break-word">
                  <span className="font-medium">{participantLabel}:</span> {participantLine}
                </div>
              </div>
            </div>
            <div className="text-muted-foreground text-xs whitespace-normal wrap-break-word sm:ml-auto sm:pl-4 sm:text-right">
              {format(new Date(mail.date), "PPpp", { locale: ptBR })}
            </div>
          </div>

          <Separator />

          <div className="min-h-0 flex-1 overflow-auto p-4">
            <MailBody mail={mail} />
          </div>

          <Separator />

          {replyMode ? (
            <div ref={replyAreaRef} className="shrink-0 p-4">
              <form onSubmit={handleReply}>
                <div className="grid gap-3">
                  <div className="text-sm text-muted-foreground">
                    {replyMode === "reply-all"
                      ? "Responder a todos"
                      : "Responder para"}{" "}
                    <span className="font-medium text-foreground">
                      {participantName}
                    </span>
                  </div>
                  <MailEditor
                    variant="inline"
                    editorRef={editorRef}
                    placeholder="Escreva sua resposta..."
                  />
                  <div className="flex items-center gap-2 justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={cancelReply}
                      disabled={isSending}>
                      Cancelar
                    </Button>
                    <Button type="submit" size="sm" disabled={isSending}>
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
          ) : (
            <div className="shrink-0 p-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!mail}
                  onClick={() => startReply("reply")}>
                  <Reply className="mr-2 h-4 w-4" />
                  Responder
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!mail}
                  onClick={() => startReply("reply-all")}>
                  <ReplyAll className="mr-2 h-4 w-4" />
                  Responder a todos
                </Button>
                {mail && (
                  <ForwardDialog mail={mail}>
                    <Button variant="outline" size="sm">
                      <Forward className="mr-2 h-4 w-4" />
                      Encaminhar
                    </Button>
                  </ForwardDialog>
                )}
              </div>
            </div>
          )}
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
