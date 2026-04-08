"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Mail,
  Phone,
  CreditCard,
  Clock,
  Copy,
  ExternalLink,
  Check,
  Shield,
  PenLine,
  Camera,
  Stamp,
  ImageIcon,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { AppBadge as Badge } from "@/components/ui/app-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SignatarioVerificacaoData } from "../../../feature/types/types";
import { actionGetPresignedPdfUrl } from "../../../feature/actions/documentos-actions";
import { SegurancaSection } from "./seguranca-section";
import { Heading } from "@/components/ui/typography";

interface AssinanteCardProps {
  signatario: SignatarioVerificacaoData;
  index: number;
}

/**
 * Busca presigned URL para uma imagem armazenada no Backblaze.
 */
function usePresignedImageUrl(originalUrl: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!originalUrl) {
      setUrl(null);
      return;
    }

    let cancelled = false;

    async function fetch() {
      setIsLoading(true);
      try {
        const result = await actionGetPresignedPdfUrl({ url: originalUrl! });
        if (!cancelled && result?.success && result.data?.presignedUrl) {
          setUrl(result.data.presignedUrl);
        }
      } catch {
        // Silently fail for images
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetch();
    return () => {
      cancelled = true;
    };
  }, [originalUrl]);

  return { url, isLoading };
}

function ImagePreview({
  originalUrl,
  label,
  icon: Icon,
}: {
  originalUrl: string | null | undefined;
  label: string;
  icon: React.ElementType;
}) {
  const { url, isLoading } = usePresignedImageUrl(originalUrl);
  const [showDialog, setShowDialog] = useState(false);

  if (!originalUrl) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => url && setShowDialog(true)}
        className="flex min-w-24 flex-col items-center gap-2 rounded-2xl border border-dashed border-border/70 bg-background/80 px-3 py-3 transition-colors hover:bg-muted/40 cursor-pointer"
      >
        {isLoading ? (
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        ) : url ? (
          <img
            src={url}
            alt={label}
            className="h-16 w-16 rounded-xl object-cover"
          />
        ) : (
          <Icon className="h-8 w-8 text-muted-foreground" />
        )}
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
          </DialogHeader>
          {url && (
            <img
              src={url}
              alt={label}
              className="w-full h-auto rounded-md"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function AssinanteCard({ signatario, index }: AssinanteCardProps) {
  const [linkCopied, setLinkCopied] = useState(false);

  const isConcluido = signatario.status === "concluido";

  const handleCopyLink = useCallback(() => {
    if (!signatario.token) return;
    const link = `${window.location.origin}/assinatura/${signatario.token}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setLinkCopied(false), 2000);
  }, [signatario.token]);

  const TIPO_LABELS: Record<string, string> = {
    cliente: "Cliente",
    parte_contraria: "Parte Contrária",
    representante: "Representante",
    terceiro: "Terceiro",
    usuario: "Usuário",
    convidado: "Convidado",
  };

  return (
    <Card className="overflow-hidden rounded-3xl border-border/60 bg-muted/15 py-0 shadow-none hover:shadow-sm">
      <CardHeader className="border-b border-border/60 px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base">
              {signatario.nome || `Assinante ${index + 1}`}
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {TIPO_LABELS[signatario.tipo] || signatario.tipo}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Registro individual com evidências e telemetria da assinatura.
            </p>
          </div>
          <Badge
            variant="secondary"
            className={
              isConcluido
                ? "bg-success/10 text-success"
                : "bg-warning/10 text-warning"
            }
          >
            {isConcluido ? "Concluído" : "Pendente"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-5 py-4">
        {/* Dados pessoais */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {signatario.cpf && (
            <div className="rounded-2xl border border-border/50 bg-background/80 px-4 py-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CreditCard className="h-3.5 w-3.5 shrink-0" />
                <span>CPF</span>
              </div>
              <p className="mt-1 font-medium text-foreground">{signatario.cpf}</p>
            </div>
          )}
          {signatario.email && (
            <div className="rounded-2xl border border-border/50 bg-background/80 px-4 py-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span>Email</span>
              </div>
              <p className="mt-1 truncate font-medium text-foreground">{signatario.email}</p>
            </div>
          )}
          {signatario.telefone && (
            <div className="rounded-2xl border border-border/50 bg-background/80 px-4 py-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span>Telefone</span>
              </div>
              <p className="mt-1 font-medium text-foreground">{signatario.telefone}</p>
            </div>
          )}
          {signatario.concluidoEm && (
            <div className="rounded-2xl border border-border/50 bg-background/80 px-4 py-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>Assinado em</span>
              </div>
              <p className="mt-1 font-medium text-foreground">
                {format(new Date(signatario.concluidoEm), "dd/MM/yyyy HH:mm", {
                  locale: ptBR,
                })}
              </p>
            </div>
          )}
        </div>

        {/* Imagens: Assinatura, Selfie, Rubrica */}
        {(signatario.assinaturaUrl ||
          signatario.selfieUrl ||
          signatario.rubricaUrl) && (
          <>
            <Separator />
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
              <Heading level="subsection" className="mb-3 flex items-center gap-1.5 text-sm">
                <ImageIcon className="h-3.5 w-3.5" />
                Evidências Visuais
              </Heading>
              <div className="flex flex-wrap gap-3">
                <ImagePreview
                  originalUrl={signatario.assinaturaUrl}
                  label="Assinatura"
                  icon={PenLine}
                />
                <ImagePreview
                  originalUrl={signatario.selfieUrl}
                  label="Selfie"
                  icon={Camera}
                />
                <ImagePreview
                  originalUrl={signatario.rubricaUrl}
                  label="Rubrica"
                  icon={Stamp}
                />
              </div>
            </div>
          </>
        )}

        {/* Dados de Segurança */}
        {isConcluido && (
          <>
            <Separator />
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
              <Heading level="subsection" className="mb-3 flex items-center gap-1.5 text-sm">
                <Shield className="h-3.5 w-3.5" />
                Dados de Segurança
              </Heading>
              <SegurancaSection signatario={signatario} />
            </div>
          </>
        )}

        {/* Ações (link) */}
        {signatario.token && !isConcluido && (
          <>
            <Separator />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
              >
                {linkCopied ? (
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                )}
                Copiar Link
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(`/assinatura/${signatario.token}`, "_blank")
                }
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Abrir Link
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
