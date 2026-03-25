"use client";

import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMailActions } from "../hooks/use-mail-api";
import { MailEditor, type MailEditorRef } from "./mail-editor";

interface ComposeMailDialogProps {
  children: React.ReactNode;
}

export function ComposeMailDialog({ children }: ComposeMailDialogProps) {
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const editorRef = useRef<MailEditorRef | null>(null);
  const { sendNewEmail } = useMailActions();

  const parseEmails = (value: string) =>
    value
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

  const resetForm = () => {
    setTo("");
    setCc("");
    setBcc("");
    setSubject("");
    setShowCcBcc(false);
    editorRef.current?.reset();
  };

  const handleSend = async () => {
    const toEmails = parseEmails(to);
    if (toEmails.length === 0) {
      toast.error("Informe pelo menos um destinatário");
      return;
    }
    if (!subject.trim()) {
      toast.error("Informe o assunto do e-mail");
      return;
    }

    if (!editorRef.current) {
      toast.error("Editor não está pronto. Tente novamente.");
      return;
    }

    const text = editorRef.current.getText();
    if (!text.trim()) {
      toast.error("Escreva o conteúdo do e-mail");
      return;
    }

    const html = editorRef.current.getHtml();

    setIsSending(true);
    try {
      const ccEmails = parseEmails(cc);
      const bccEmails = parseEmails(bcc);
      await sendNewEmail(
        toEmails,
        subject.trim(),
        text,
        html || undefined,
        ccEmails.length > 0 ? ccEmails : undefined,
        bccEmails.length > 0 ? bccEmails : undefined
      );
      toast.success("E-mail enviado com sucesso");
      resetForm();
      setOpen(false);
    } catch {
      toast.error("Erro ao enviar e-mail");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo E-mail</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="compose-to">Para</Label>
              {!showCcBcc && (
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowCcBcc(true)}>
                  Cc / Cco
                </button>
              )}
            </div>
            <Input
              id="compose-to"
              type="text"
              placeholder="email@exemplo.com (separar com vírgula)"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          {showCcBcc && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="compose-cc">Cc</Label>
                <Input
                  id="compose-cc"
                  type="text"
                  placeholder="email@exemplo.com"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="compose-bcc">Cco</Label>
                <Input
                  id="compose-bcc"
                  type="text"
                  placeholder="email@exemplo.com"
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="grid gap-2">
            <Label htmlFor="compose-subject">Assunto</Label>
            <Input
              id="compose-subject"
              type="text"
              placeholder="Assunto do e-mail"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>Mensagem</Label>
            <MailEditor editorRef={editorRef} placeholder="Escreva sua mensagem..." />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => { resetForm(); setOpen(false); }}
            disabled={isSending}>
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={isSending}>
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
