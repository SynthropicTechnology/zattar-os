"use client";

/**
 * RevisarDocumentoClient — Etapa 3: Revisar e enviar para assinatura
 *
 * Alinhado ao Design System Glass Briefing (POC novo-documento):
 * - KPI strip com label-overline + icon-tile + meta-label
 * - GlassPanel depth={1|2} em cards e preview
 * - Links de signatário com cores chart-N por assinante
 * - Ambient-divider em vez de Separator
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
  Hash,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  actionGetDocumento,
  usePresignedPdfUrl,
  PdfPreviewDynamic,
} from '@/shared/assinatura-digital';
import { actionFinalizeDocumento } from '@/shared/assinatura-digital/actions/documentos-actions';
import { DocumentFlowShell } from '@/app/(authenticated)/assinatura-digital/components/flow';
import type { AssinaturaDigitalDocumentoAssinanteTipo } from '@/shared/assinatura-digital/domain';
import { GlassPanel } from "@/components/shared/glass-panel";

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
  { bg: "bg-chart-1/8", border: "border-chart-1/30", text: "text-chart-1", solid: "bg-chart-1" },
  { bg: "bg-chart-2/8", border: "border-chart-2/30", text: "text-chart-2", solid: "bg-chart-2" },
  { bg: "bg-chart-3/8", border: "border-chart-3/30", text: "text-chart-3", solid: "bg-chart-3" },
  { bg: "bg-chart-4/8", border: "border-chart-4/30", text: "text-chart-4", solid: "bg-chart-4" },
  { bg: "bg-chart-5/8", border: "border-chart-5/30", text: "text-chart-5", solid: "bg-chart-5" },
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

// ─── KPI Card (padrao POC) ─────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  meta,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  tone?: "primary" | "info" | "warning" | "success";
  meta?: string;
}) {
  const toneMap = {
    primary: { tile: "bg-primary/8", iconColor: "text-primary/70", valueColor: "" },
    info: { tile: "bg-info/10", iconColor: "text-info/70", valueColor: "" },
    warning: { tile: "bg-warning/12", iconColor: "text-warning/75", valueColor: "text-warning" },
    success: { tile: "bg-success/10", iconColor: "text-success/70", valueColor: "text-success" },
  } as const;
  const t = toneMap[tone];

  return (
    <GlassPanel depth={2} className="px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground/60">
            {label}
          </p>
          <p
            className={cn(
              "font-heading text-xl font-bold leading-none mt-1 tabular-nums",
              t.valueColor,
            )}
          >
            {value}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex size-8 items-center justify-center rounded-lg shrink-0",
            t.tile,
          )}
        >
          <Icon className={cn("size-4", t.iconColor)} />
        </span>
      </div>
      {meta && (
        <p className="text-[11px] font-medium text-muted-foreground/70 mt-2.5">
          {meta}
        </p>
      )}
    </GlassPanel>
  );
}

// ─── Stats Row (KPI strip estilo POC) ──────────────────────────────────

function StatsRow({ documento }: { documento: DocumentoRevisar }) {
  const pendentes = documento.assinantes.filter((a) => a.status === "pendente").length;
  const concluidos = documento.assinantes.filter((a) => a.status === "concluido").length;
  const paginas = new Set(documento.ancoras.map((a) => a.pagina)).size;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <KpiCard
        label="Assinantes"
        value={documento.assinantes.length}
        icon={Users}
        tone="primary"
        meta="serão notificados por email"
      />
      <KpiCard
        label="Âncoras"
        value={documento.ancoras.length}
        icon={Pen}
        tone="info"
        meta={`posicionadas em ${paginas} ${paginas === 1 ? "página" : "páginas"}`}
      />
      <KpiCard
        label="Pendentes"
        value={pendentes}
        icon={Clock}
        tone="warning"
        meta="aguardando assinatura"
      />
      {concluidos > 0 ? (
        <KpiCard
          label="Concluídos"
          value={concluidos}
          icon={Check}
          tone="success"
          meta="assinaturas coletadas"
        />
      ) : (
        <KpiCard
          label="Integridade"
          value="SHA-256"
          icon={Hash}
          tone="success"
          meta="hash criptográfico"
        />
      )}
    </div>
  );
}

// ─── Section Header ────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
  action,
  tone = "primary",
}: {
  icon: React.ElementType;
  title: string;
  action?: React.ReactNode;
  tone?: "primary" | "info";
}) {
  const tile = tone === "info" ? "bg-info/10 text-info/70" : "bg-primary/8 text-primary/70";
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className={cn("inline-flex size-8 items-center justify-center rounded-lg", tile)}>
          <Icon className="size-4" />
        </span>
        <h2 className="font-heading text-base font-bold leading-none">{title}</h2>
      </div>
      {action}
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
  const tipoLabel = TIPO_LABELS[assinante.assinante_tipo] ?? assinante.assinante_tipo;

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-xl border p-3.5 backdrop-blur-sm transition-colors",
        isConcluido
          ? "bg-success/8 border-success/30"
          : `${color.bg} ${color.border}`,
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-primary-foreground",
            isConcluido ? "bg-success" : color.solid,
          )}
        >
          {isConcluido ? (
            <Check className="size-5" strokeWidth={2.5} />
          ) : (
            nome.charAt(0).toUpperCase()
          )}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{nome}</p>
          <p className="text-xs text-muted-foreground">
            <span className="capitalize">{tipoLabel.toLowerCase()}</span>
            {isConcluido && " · Assinado"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Copiar link"
          className="size-8"
          onClick={() => onCopyLink(assinante)}
        >
          <Copy className="size-3.5" />
          <span className="sr-only">Copiar link</span>
        </Button>
        <Button variant="ghost" size="icon" aria-label="Abrir link" className="size-8" asChild>
          <a href={assinante.public_link} target="_blank" rel="noopener noreferrer">
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

  const anchorsOnPage = documento.ancoras.filter((a) => a.pagina === currentPage);

  return (
    <GlassPanel depth={1} className="overflow-hidden p-0">
      <div className="relative bg-muted/20">
        <PdfPreviewDynamic
          pdfUrl={pdfUrl ?? undefined}
          mode="background"
          initialPage={currentPage}
          onPageChange={setCurrentPage}
          onLoadSuccess={setNumPages}
          showControls={false}
          showPageIndicator={false}
        />

        <div className="absolute inset-0 pointer-events-none">
          {anchorsOnPage.map((anchor) => {
            const signerIdx = documento.assinantes.findIndex(
              (s) => s.id === anchor.documento_assinante_id,
            );
            const color = getColor(signerIdx);
            const assinante = documento.assinantes.find(
              (s) => s.id === anchor.documento_assinante_id,
            );

            return (
              <div
                key={anchor.id}
                className={cn("absolute border-2 rounded-sm", color.bg, color.border)}
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
                    color.solid,
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

      <div className="h-px bg-linear-to-r from-transparent via-border/50 to-transparent" />

      <div className="flex items-center justify-between px-4 py-2.5">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="size-3.5" />
          Anterior
        </Button>
        <span className="text-xs font-medium tabular-nums">
          Página {currentPage} de {numPages}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
          disabled={currentPage >= numPages}
        >
          Próxima
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </GlassPanel>
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
    uuid,
  );

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
    [],
  );

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
        "Documento pronto para assinatura! Os links foram gerados.",
      );
      router.push("/app/assinatura-digital/documentos/lista");
    } catch (error) {
      console.error("Erro ao finalizar documento:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao finalizar documento",
      );
    } finally {
      setIsFinalizing(false);
    }
  }, [documento, router]);

  // ── Primary action (no header do shell) ────────────────────────────
  const primaryAction = documento ? (
    <Button
      onClick={handleFinalize}
      disabled={isFinalizing}
      size="sm"
      className="gap-1.5"
    >
      {isFinalizing ? (
        <>
          <Loader2 className="size-3.5 animate-spin" />
          Finalizando...
        </>
      ) : (
        <>
          <Send className="size-3.5" />
          Finalizar e Enviar
        </>
      )}
    </Button>
  ) : null;

  // ── Loading ─────────────────────────────────────────────────────────
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

  // ── Main ────────────────────────────────────────────────────────────
  return (
    <DocumentFlowShell primaryAction={primaryAction}>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* ── Header ─────────────────────────────────── */}
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-heading text-[26px] font-bold leading-tight truncate">
                {documento.titulo || "Documento sem título"}
              </h1>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                  documento.status === "pronto"
                    ? "bg-success/12 text-success"
                    : "bg-foreground/8 text-muted-foreground",
                )}
              >
                <Check className="size-3" strokeWidth={2.5} />
                {STATUS_LABELS[documento.status] ?? documento.status}
              </span>
              {documento.selfie_habilitada && (
                <span className="inline-flex items-center gap-1 rounded-full bg-info/12 text-info px-2 py-0.5 text-[11px] font-medium">
                  <Camera className="size-3" />
                  Selfie ativa
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Confira as configurações antes de compartilhar
            </p>
          </div>
        </div>

        {/* ── KPI Strip ───────────────────────────────── */}
        <StatsRow documento={documento} />

        {/* ── Selfie banner (legado — mantém texto testado) ── */}
        {documento.selfie_habilitada && (
          <GlassPanel
            depth={2}
            className="px-4 py-3 flex items-center gap-2.5 border-info/25"
          >
            <span className="inline-flex size-7 items-center justify-center rounded-lg bg-info/10 shrink-0">
              <Camera className="size-3.5 text-info/70" />
            </span>
            <p className="text-sm">
              <span className="font-medium">Selfie de verificação</span>{" "}
              <span className="text-muted-foreground">
                habilitada para este documento
              </span>
            </p>
          </GlassPanel>
        )}

        {/* ── Grid: Links + PDF Preview ──────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
          {/* Links */}
          <section className="space-y-4">
            <SectionHeader
              icon={LinkIcon}
              title="Links de Assinatura"
              tone="primary"
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

            <p className="text-xs text-muted-foreground">
              Compartilhe o link com cada assinante. Cada link é único e seguro.
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

            {/* Segurança */}
            <GlassPanel depth={2} className="flex items-start gap-3 p-4 mt-2">
              <span className="inline-flex size-8 items-center justify-center rounded-lg bg-success/10 shrink-0">
                <Shield className="size-4 text-success/70" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium">Conformidade MP 2.200-2/2001</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                  Cada assinatura coleta hash SHA-256, IP, geolocalização,
                  device fingerprint e aceite de termos. Trilha de auditoria
                  completa após finalização.
                </p>
              </div>
            </GlassPanel>
          </section>

          {/* Preview */}
          <section className="space-y-4">
            <SectionHeader
              icon={FileText}
              title="Preview do Documento"
              tone="info"
            />
            <PdfPreviewSection
              documento={documento}
              pdfUrl={pdfPresignedUrl}
            />
          </section>
        </div>

        {/* ── Ambient divider + voltar ───────────────── */}
        <div className="h-px bg-linear-to-r from-transparent via-border/50 to-transparent my-2" />
        <div className="flex items-center justify-between pb-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() =>
              router.push(`/app/assinatura-digital/documentos/editar/${uuid}`)
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
