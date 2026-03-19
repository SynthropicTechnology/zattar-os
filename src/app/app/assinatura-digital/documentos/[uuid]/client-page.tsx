"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  FileText,
  Calendar,
  Copy,
  ChevronDown,
  ShieldCheck,
  Users,
  Info,
  FileDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DocumentoVerificacaoData } from "../../feature/types/types";
import { usePresignedPdfUrl } from "../../feature/hooks/use-presigned-pdf-url";
import { actionGetPresignedPdfUrl } from "../../feature/actions/documentos-actions";
import PdfPreviewDynamic from "../../feature/components/pdf/PdfPreviewDynamic";
import { AssinanteCard } from "./components/assinante-card";

// =============================================================================
// STATUS DISPLAY
// =============================================================================

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  rascunho: {
    label: "Rascunho",
    className: "bg-gray-600/10 text-gray-700 dark:text-gray-400",
  },
  pronto: {
    label: "Pronto",
    className: "bg-blue-600/10 text-blue-700 dark:text-blue-400",
  },
  concluido: {
    label: "Concluído",
    className: "bg-green-600/10 text-green-700 dark:text-green-400",
  },
  cancelado: {
    label: "Cancelado",
    className: "bg-red-600/10 text-red-700 dark:text-red-400",
  },
};

// =============================================================================
// HASH DISPLAY COMPONENT
// =============================================================================

function HashDisplay({ label, hash }: { label: string; hash: string | null | undefined }) {
  if (!hash) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(hash);
    toast.success("Hash copiado!");
  };

  return (
    <div className="flex items-start justify-between gap-2 group">
      <div className="min-w-0 flex-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <p className="text-xs font-mono break-all text-foreground/80">{hash}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleCopy}
      >
        <Copy className="h-3 w-3" />
      </Button>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

interface DocumentoVerificacaoClientProps {
  data: DocumentoVerificacaoData;
}

export function DocumentoVerificacaoClient({
  data,
}: DocumentoVerificacaoClientProps) {
  const router = useRouter();
  const { presignedUrl, isLoading: isPdfLoading } = usePresignedPdfUrl(
    data.pdfUrl,
    data.uuid
  );

  const statusConfig = STATUS_CONFIG[data.status] ?? STATUS_CONFIG.rascunho;

  // Download handlers
  const handleDownloadPdf = useCallback(
    async (url: string, filename: string) => {
      try {
        const result = await actionGetPresignedPdfUrl({ url });
        if (!result?.success || !result.data?.presignedUrl) {
          toast.error("Erro ao gerar link de download");
          return;
        }
        const link = document.createElement("a");
        link.href = result.data.presignedUrl;
        link.download = `${filename}.pdf`;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch {
        toast.error("Erro ao baixar documento");
      }
    },
    []
  );

  const handleDownloadSemManifesto = useCallback(() => {
    window.open(
      `/api/assinatura-digital/documentos/${data.uuid}/download-sem-manifesto`,
      "_blank"
    );
  }, [data.uuid]);

  const assinantesConcluidos = data.signatarios.filter(
    (s) => s.status === "concluido"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              router.push("/app/assinatura-digital/documentos/lista")
            }
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-heading">
              {data.titulo}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className={statusConfig.className}>
                {statusConfig.label}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {data.tipo === "formulario" ? "Formulário" : "Documento"}
              </Badge>
              {data.protocolo && (
                <span className="text-xs text-muted-foreground font-mono">
                  {data.protocolo}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Download Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Download
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {data.pdfFinalUrl && (
              <DropdownMenuItem
                onClick={() =>
                  handleDownloadPdf(
                    data.pdfFinalUrl!,
                    `${data.titulo}-assinado`
                  )
                }
              >
                <FileDown className="h-4 w-4 mr-2" />
                PDF Assinado
              </DropdownMenuItem>
            )}
            {data.pdfOriginalUrl && data.tipo === "documento" && (
              <DropdownMenuItem
                onClick={() =>
                  handleDownloadPdf(
                    data.pdfOriginalUrl!,
                    `${data.titulo}-original`
                  )
                }
              >
                <FileText className="h-4 w-4 mr-2" />
                PDF Original
              </DropdownMenuItem>
            )}
            {!data.pdfFinalUrl && data.pdfOriginalUrl && (
              <DropdownMenuItem
                onClick={() =>
                  handleDownloadPdf(
                    data.pdfOriginalUrl!,
                    data.titulo
                  )
                }
              >
                <FileDown className="h-4 w-4 mr-2" />
                {data.tipo === "formulario"
                  ? "PDF Assinado"
                  : "PDF do Documento"}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDownloadSemManifesto}>
              <FileText className="h-4 w-4 mr-2" />
              PDF sem Dados de Verificação
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main Content: 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: PDF Preview */}
        <div className="lg:col-span-2">
          <div className="sticky top-4">
            <Card>
              <CardContent className="p-0">
                <div className="h-150 lg:h-[calc(100vh-12rem)]">
                  {presignedUrl ? (
                    <PdfPreviewDynamic
                      pdfUrl={presignedUrl}
                      mode="default"
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  ) : isPdfLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        <p className="text-sm text-muted-foreground">
                          Carregando PDF...
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <FileText className="h-12 w-12" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right: Data Panels */}
        <div className="lg:col-span-3 space-y-4">
          {/* Card: Informações do Documento */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4" />
                Informações do Documento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-muted-foreground">
                    Identificador
                  </span>
                  <p className="text-sm font-mono">
                    {data.protocolo || data.uuid}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">
                    Criado em
                  </span>
                  <p className="text-sm flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    {format(new Date(data.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
                {data.clienteNome && (
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Cliente
                    </span>
                    <p className="text-sm font-medium">{data.clienteNome}</p>
                  </div>
                )}
                {data.clienteCpf && (
                  <div>
                    <span className="text-xs text-muted-foreground">CPF</span>
                    <p className="text-sm font-mono">{data.clienteCpf}</p>
                  </div>
                )}
                {data.tipo === "documento" && (
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Selfie Habilitada
                    </span>
                    <p className="text-sm">
                      {data.selfieHabilitada ? "Sim" : "Não"}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-xs text-muted-foreground">
                    Assinantes
                  </span>
                  <p className="text-sm">
                    {assinantesConcluidos}/{data.signatarios.length} concluídos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card: Integridade */}
          {(data.hashOriginal || data.hashFinal) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Integridade do Documento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <HashDisplay
                  label="Hash Original (SHA-256)"
                  hash={data.hashOriginal}
                />
                {data.hashFinal && (
                  <>
                    <Separator />
                    <HashDisplay
                      label="Hash Final (SHA-256)"
                      hash={data.hashFinal}
                    />
                  </>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Os hashes permitem verificar que o documento não foi alterado
                  após a assinatura. Qualquer modificação geraria um hash
                  diferente.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Assinantes */}
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
              <Users className="h-5 w-5" />
              Assinantes ({data.signatarios.length})
            </h2>
            <div className="space-y-3">
              {data.signatarios.map((signatario, index) => (
                <AssinanteCard
                  key={signatario.id}
                  signatario={signatario}
                  index={index}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
