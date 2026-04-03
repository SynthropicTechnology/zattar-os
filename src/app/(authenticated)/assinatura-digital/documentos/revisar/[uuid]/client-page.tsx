"use client";

/**
 * RevisarDocumentoClient — Etapa 3: Revisar e enviar para assinatura
 *
 * Layout flat alinhado ao design system do command center.
 * Grid responsivo: resumo à esquerda, PDF preview à direita.
 * Integrado com DocumentFlowShell (stepper no header).
 */

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  FileText,
  Users,
  Loader2,
  ExternalLink,
  Pen,
  Stamp,
  ChevronLeft,
  ChevronRight,
  Camera,
  Link as LinkIcon,
  ArrowLeft,
  Send,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppBadge as Badge } from "@/components/ui/app-badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  actionGetDocumento,
  usePresignedPdfUrl,
  PdfPreviewDynamic,
} from "../../../feature";
import { actionFinalizeDocumento } from "../../../feature/actions/documentos-actions";
import { DocumentFlowShell } from "../../../feature/components/flow";
import type { AssinaturaDigitalDocumentoAssinanteTipo } from "../../../feature/domain";

// ─── Types ─────────────────────────────────────────────────────────────

interface DocumentoRevisar {
  id: number;
  documento_uuid: string;
  titulo: string | null;
  status: string;
  selfie_habilitada: boolean;
  pdf_original_url: string;
  assinantes: Array<{
    id: number;
    assinante_tipo: AssinaturaDigitalDocumentoAssinanteTipo;
    dados_snapshot: Record<string, unknown>;
    token: string;
    public_link: string;
    status: "pendente" | "concluido";
  }>;
  ancoras: Array<{
    id: number;
    documento_assinante_id: number;
    tipo: "assinatura" | "rubrica";
    pagina: number;
    x_norm: number;
    y_norm: number;
    w_norm: number;
    h_norm: number;
  }>;
}

// ─── Constants ─────────────────────────────────────────────────────────

const CHART_COLORS = [
  { bg: "bg-chart-1/15", border: "border-chart-1/40", text: "text-chart-1", solid: "bg-chart-1" },
  { bg: "bg-chart-2/15", border: "border-chart-2/40", text: "text-chart-2", solid: "bg-chart-2" },
  { bg: "bg-chart-3/15", border: "border-chart-3/40", text: "text-chart-3", solid: "bg-chart-3" },
  { bg: "bg-chart-4/15", border: "border-chart-4/40", text: "text-chart-4", solid: "bg-chart-4" },
  { bg: "bg-chart-5/15", border: "border-chart-5/40", text: "text-chart-5", solid: "bg-chart-5" },
];

function getColor(index: number) {
  return CHART_COLORS[index % CHART_COLORS.length];
}

const STATUS_LABELS: Record<string, string> = {
  rascunho: "Rascunho",
  pronto: "Pronto",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

const TIPO_LABELS: Record<string, string> = {
  cliente: "Cliente",
  parte_contraria: "Parte Contrária",
  representante: "Representante",
  terceiro: "Terceiro",
  usuario: "Usuário",
  convidado: "Convidado",
};

function getSignerName(assinante: DocumentoRevisar["assinantes"][0]): string {
  const nome =
    (assinante.dados_snapshot?.nome_completo as string) ||
    (assinante.dados_snapshot?.nome as string);
  return nome || TIPO_LABELS[assinante.assinante_tipo] || `Assinante ${assinante.id}`;
}

// ─── Section Header ────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
  action,
}: {
  icon: React.ElementType;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="size-4 text-primary" />
        </div>
        <h2 className="text-sm font-heading font-semibold text-foreground">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

// ─── Stats Row ─────────────────────────────────────────────────────────

function StatsRow({
  documento,
}: {
  documento: DocumentoRevisar;
}) {
  const pendentes = documento.assinantes.filter((a) => a.status === "pendente").length;
  const concluidos = documento.assinantes.filter((a) => a.status === "concluido").length;

  const stats = [
    { label: "Assinantes", value: documento.assinantes.length, icon: Users },
    { label: "Âncoras", value: documento.ancoras.length, icon: Pen },
    { label: "Pendentes", value: pendentes, icon: Send },
    ...(concluidos > 0
      ? [{ label: "Concluídos", value: concluidos, icon: Check }]
      : []),
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="flex items-center gap-2.5 rounded-lg border bg-background p-3"
          >
            <Icon className="size-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-lg font-semibold font-heading leading-none">
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {stat.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Signer Link Card ──────────────────────────────────────────────────

function SignerLinkCard({
  assinante,
  index,
  onCopyLink,
}: {
  assinante: DocumentoRevisar["assinantes"][0];
  index: number;
  onCopyLink: (assinante: DocumentoRevisar["assinantes"][0]) => void;
}) {
  const color = getColor(index);
  const isConcluido = assinante.status === "concluido";
  const nome = getSignerName(assinante);

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-xl border p-3.5 transition-colors",
        isConcluido
          ? "bg-chart-4/10 border-chart-4/30"
          : `${color.bg} ${color.border}`
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Avatar */}
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-medium text-primary-foreground",
            isConcluido ? "bg-chart-4" : color.solid
          )}
        >
          {isConcluido ? (
            <Check className="size-5" />
          ) : (
            nome.charAt(0).toUpperCase()
          )}
        </div>

        {/* Info */}
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{nome}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {TIPO_LABELS[assinante.assinante_tipo]?.toLowerCase() ?? assinante.assinante_tipo}
            {isConcluido && " · Assinado"}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => onCopyLink(assinante)}
        >
          <Copy className="size-3.5" />
          <span className="sr-only">Copiar link</span>
        </Button>
        <Button variant="ghost" size="icon" className="size-8" asChild>
          <a
            href={assinante.public_link}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="size-3.5" />
            <span className="sr-only">Abrir link</span>
          </a>
        </Button>
      </div>
    </div>
  );
}

// ─── PDF Preview Section ───────────────────────────────────────────────

function PdfPreviewSection({
  documento,
  pdfUrl,
}: {
  documento: DocumentoRevisar;
  pdfUrl: string | null | undefined;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(1);

  const anchorsOnPage = documento.ancoras.filter(
    (a) => a.pagina === currentPage
  );

  return (
    <div className="rounded-xl border bg-background overflow-hidden">
      {/* PDF com âncoras (read-only) */}
      <div className="relative bg-muted/30">
        <PdfPreviewDynamic
          pdfUrl={pdfUrl ?? undefined}
          mode="background"
          initialPage={currentPage}
          onPageChange={setCurrentPage}
          onLoadSuccess={setNumPages}
          showControls={false}
          showPageIndicator={false}
        />

        {/* Âncoras sobrepostas */}
        <div className="absolute inset-0 pointer-events-none">
          {anchorsOnPage.map((anchor) => {
            const signerIdx = documento.assinantes.findIndex(
              (s) => s.id === anchor.documento_assinante_id
            );
            const color = getColor(signerIdx);
            const assinante = documento.assinantes.find(
              (s) => s.id === anchor.documento_assinante_id
            );

            return (
              <div
                key={anchor.id}
                className={cn(
                  "absolute border-2 rounded-sm",
                  color.bg,
                  color.border.replace("/40", "")
                )}
                style={{
                  left: `${anchor.x_norm * 100}%`,
                  top: `${anchor.y_norm * 100}%`,
                  width: `${anchor.w_norm * 100}%`,
                  height: `${anchor.h_norm * 100}%`,
                }}
              >
                <div
                  className={cn(
                    "absolute -top-6 left-0 px-2 py-0.5 rounded text-xs font-medium text-primary-foreground flex items-center gap-1",
                    color.solid
                  )}
                >
                  {anchor.tipo === "assinatura" ? (
                    <Pen className="size-3" />
                  ) : (
                    <Stamp className="size-3" />
                  )}
                  {assinante && getSignerName(assinante).split(" ")[0]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Controles de página */}
      <div className="flex items-center justify-center gap-3 p-3 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-sm min-w-25 text-center tabular-nums">
          Página {currentPage} de {numPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
          disabled={currentPage >= numPages}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────

export function RevisarDocumentoClient({ uuid }: { uuid: string }) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [documento, setDocumento] = useState<DocumentoRevisar | null>(null);

  const { presignedUrl: pdfPresignedUrl } = usePresignedPdfUrl(
    documento?.pdf_original_url,
    uuid
  );

  // Carregar documento
  useEffect(() => {
    async function carregar() {
      setIsLoading(true);
      try {
        const resultado = await actionGetDocumento({ uuid });

        if (!resultado.success) {
          toast.error(resultado.error || "Erro ao carregar documento");
          router.push("/app/assinatura-digital/documentos/lista");
          return;
        }

        const docData = resultado.data as {
          documento: Omit<DocumentoRevisar, "assinantes" | "ancoras">;
          assinantes: DocumentoRevisar["assinantes"];
          ancoras: DocumentoRevisar["ancoras"];
        };

        if (!docData?.documento) {
          toast.error("Documento não encontrado");
          router.push("/app/assinatura-digital/documentos/lista");
          return;
        }

        setDocumento({
          ...docData.documento,
          assinantes: docData.assinantes,
          ancoras: docData.ancoras,
        });
      } catch (error) {
        toast.error("Erro ao carregar documento");
        console.error(error);
        router.push("/app/assinatura-digital/documentos/lista");
      } finally {
        setIsLoading(false);
      }
    }

    carregar();
  }, [uuid, router]);

  // Copiar link individual
  const handleCopyLink = useCallback(
    async (assinante: DocumentoRevisar["assinantes"][0]) => {
      try {
        const fullUrl = `${window.location.origin}${assinante.public_link}`;
        await navigator.clipboard.writeText(fullUrl);
        toast.success(`Link copiado para ${getSignerName(assinante)}`);
      } catch {
        toast.error("Erro ao copiar link");
      }
    },
    []
  );

  // Copiar todos os links
  const handleCopyAllLinks = useCallback(async () => {
    if (!documento) return;

    try {
      const linksList = documento.assinantes
        .map((a) => {
          const nome = getSignerName(a);
          const fullUrl = `${window.location.origin}${a.public_link}`;
          return `${nome}: ${fullUrl}`;
        })
        .join("\n\n");

      await navigator.clipboard.writeText(linksList);
      toast.success("Todos os links foram copiados!");
    } catch {
      toast.error("Erro ao copiar links");
    }
  }, [documento]);

  // Finalizar
  const handleFinalize = useCallback(async () => {
    if (!documento) return;

    setIsFinalizing(true);
    try {
      const resultado = await actionFinalizeDocumento({
        uuid: documento.documento_uuid,
      });

      if (!resultado.success) {
        toast.error(resultado.error || "Erro ao finalizar documento");
        return;
      }

      toast.success(
        "Documento pronto para assinatura! Os links foram gerados."
      );
      router.push("/app/assinatura-digital/documentos/lista");
    } catch (error) {
      console.error("Erro ao finalizar documento:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao finalizar documento"
      );
    } finally {
      setIsFinalizing(false);
    }
  }, [documento, router]);

  // Loading
  if (isLoading) {
    return (
      <DocumentFlowShell>
        <div className="flex items-center justify-center min-h-100">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      </DocumentFlowShell>
    );
  }

  if (!documento) return null;

  return (
    <DocumentFlowShell>
      <div className="max-w-350 mx-auto w-full space-y-5">
        {/* ── Header ─────────────────────────────────── */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading font-semibold tracking-tight">
              {documento.titulo || "Documento sem título"}
            </h1>
            <p className="text-sm text-muted-foreground/50 mt-0.5">
              Confira as configurações antes de compartilhar
            </p>
          </div>
          <Badge
            variant={
              documento.status === "pronto" ? "default" : "secondary"
            }
          >
            {STATUS_LABELS[documento.status] ?? documento.status}
          </Badge>
        </div>

        {/* ── Stats ──────────────────────────────────── */}
        <StatsRow documento={documento} />

        {/* ── Settings Summary ───────────────────────── */}
        {documento.selfie_habilitada && (
          <div className="flex items-center gap-2 rounded-lg border border-chart-2/30 bg-chart-2/10 px-4 py-3">
            <Camera className="size-4 text-chart-2 shrink-0" />
            <p className="text-sm">
              <span className="font-medium">Selfie de verificação</span>{" "}
              <span className="text-muted-foreground">
                habilitada para este documento
              </span>
            </p>
          </div>
        )}

        {/* ── Grid: Links + PDF Preview ──────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
          {/* Coluna esquerda — Links de assinatura */}
          <div className="space-y-4">
            <SectionHeader
              icon={LinkIcon}
              title="Links de Assinatura"
              action={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handleCopyAllLinks}
                >
                  <Copy className="size-3 mr-1.5" />
                  Copiar Todos
                </Button>
              }
            />

            <p className="text-xs text-muted-foreground -mt-1">
              Compartilhe o link com cada assinante. Cada link é único e
              seguro.
            </p>

            <div className="space-y-2">
              {documento.assinantes.map((assinante, idx) => (
                <SignerLinkCard
                  key={assinante.id}
                  assinante={assinante}
                  index={idx}
                  onCopyLink={handleCopyLink}
                />
              ))}
            </div>

            {/* Segurança info */}
            <div className="flex items-start gap-2.5 rounded-lg bg-muted/50 p-3 mt-2">
              <Shield className="size-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Cada assinatura coleta hash SHA-256, IP, geolocalização,
                device fingerprint e aceite de termos conforme MP 2.200-2/2001.
              </p>
            </div>
          </div>

          {/* Coluna direita — PDF Preview */}
          <div className="space-y-4">
            <SectionHeader icon={FileText} title="Preview do Documento" />
            <PdfPreviewSection
              documento={documento}
              pdfUrl={pdfPresignedUrl}
            />
          </div>
        </div>

        {/* ── Actions Bar ────────────────────────────── */}
        <Separator />
        <div className="flex items-center justify-between pb-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() =>
              router.push(
                `/app/assinatura-digital/documentos/editar/${uuid}`
              )
            }
          >
            <ArrowLeft className="size-4 mr-1.5" />
            Voltar para Edição
          </Button>
          <Button
            onClick={handleFinalize}
            disabled={isFinalizing}
            className="shadow-sm"
          >
            {isFinalizing ? (
              <>
                <Loader2 className="size-4 mr-1.5 animate-spin" />
                Finalizando...
              </>
            ) : (
              <>
                <Send className="size-4 mr-1.5" />
                Finalizar e Enviar
              </>
            )}
          </Button>
        </div>
      </div>
    </DocumentFlowShell>
  );
}
