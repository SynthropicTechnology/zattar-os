"use client";

import React, { useEffect, useRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Archive,
  ArchiveX,
  Forward,
  Loader2,
  MoreVertical,
  Reply,
  ReplyAll,
  Trash2,
} from "lucide-react";
import { useMailStore } from "../use-mail";
import { useMailActions } from "../hooks/use-mail-api";

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
import { Separator } from "@/components/ui/separator";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import type { MailMessagePreview } from "@/lib/mail/types";
import { useMailDisplay } from "../hooks/use-mail-display";
import { MailEditor } from "./mail-editor";

interface MailDisplayProps {
  mail: MailMessagePreview | null;
}

function MailBodyMobile({ mail }: { mail: MailMessagePreview }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { fullMessage } = useMailStore();
  const { fetchMessage } = useMailActions();
  const [isLoadingBody, setIsLoadingBody] = React.useState(true);

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

  return <div className="text-sm whitespace-pre-wrap">{textContent}</div>;
}

export function MailDisplayMobile({ mail }: MailDisplayProps) {
  const [open, setOpen] = React.useState(false);
  const { selectedMail, setSelectedMail } = useMailStore();
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
  } = useMailDisplay(mail);

  const replyAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedMail) {
      setOpen(true);
    }
  }, [selectedMail]);

  useEffect(() => {
    if (!open) {
      setSelectedMail(null);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to reply editor when entering reply mode
  useEffect(() => {
    if (replyMode) {
      const timer = setTimeout(() => {
        replyAreaRef.current?.scrollIntoView({ behavior: "smooth" });
        editorRef.current?.focus();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [replyMode, editorRef]);

  const handleMobileAction = async (action: (() => Promise<void>) | undefined) => {
    if (!action) return;
    await action();
    setOpen(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent>
        <VisuallyHidden>
          <DialogHeader>
            <DialogTitle>Visualizar e-mail</DialogTitle>
          </DialogHeader>
        </VisuallyHidden>

        <div className="flex h-full flex-col">
          <div className="flex items-center p-2">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                disabled={!mail || actionLoading === "archive"}
                aria-label="Arquivar"
                onClick={() => handleMobileAction(actions?.archive)}>
                {actionLoading === "archive" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Archive className="h-4 w-4" />
                )}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={!mail || actionLoading === "junk"}
                    aria-label="Lixo eletrônico">
                    {actionLoading === "junk" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArchiveX className="h-4 w-4" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Mover para lixo eletrônico?</AlertDialogTitle>
                    <AlertDialogDescription>
                      O e-mail será movido para a pasta de lixo eletrônico.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleMobileAction(actions?.junk)}>
                      Mover
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={!mail || actionLoading === "delete"}
                    aria-label="Excluir">
                    {actionLoading === "delete" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </AlertDialogTrigger>
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
                      onClick={() => handleMobileAction(actions?.delete)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                disabled={!mail}
                aria-label="Responder"
                onClick={() => startReply("reply")}>
                <Reply className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={!mail}
                aria-label="Responder a todos"
                onClick={() => startReply("reply-all")}>
                <ReplyAll className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={!mail}
                aria-label="Encaminhar">
                <Forward className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="mx-2 h-6" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={!mail} aria-label="Mais opções">
                  <MoreVertical className="h-4 w-4" />
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

          {mail && (
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex flex-wrap items-start gap-3 p-4">
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

              <div className="flex-1 overflow-auto p-4">
                <MailBodyMobile mail={mail} />
              </div>

              <Separator className="mt-auto" />

              {replyMode ? (
                <div ref={replyAreaRef} className="p-4">
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
                <div className="p-4">
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
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
