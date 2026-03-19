"use client";

/**
 * RevisarDocumentoClient - Página de revisão final do documento
 *
 * Fluxo:
 * 1. Mostra resumo do documento e assinantes
 * 2. Preview do PDF com âncoras (read-only)
 * 3. Links de assinatura para compartilhar
 * 4. Botão para finalizar e voltar à lista
 */

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  actionGetDocumento,
  usePresignedPdfUrl,
  PdfPreviewDynamic,
} from "../../../feature";
import { actionFinalizeDocumento } from "../../../feature/actions/documentos-actions";

// Tipos
interface DocumentoCompleto {
  id: number;
  documento_uuid: string;
  titulo: string | null;
  status: string;
  selfie_habilitada: boolean;
  pdf_original_url: string;
  assinantes: Array<{
    id: number;
    assinante_tipo: string;
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

// Cores para assinantes usando tokens do design system (chart-*)
const SIGNER_COLORS = [
  { bg: "bg-chart-1/20", border: "border-chart-1", text: "text-chart-1", solid: "bg-chart-1" },
  { bg: "bg-chart-2/20", border: "border-chart-2", text: "text-chart-2", solid: "bg-chart-2" },
  { bg: "bg-chart-3/20", border: "border-chart-3", text: "text-chart-3", solid: "bg-chart-3" },
  { bg: "bg-chart-4/20", border: "border-chart-4", text: "text-chart-4", solid: "bg-chart-4" },
  { bg: "bg-chart-5/20", border: "border-chart-5", text: "text-chart-5", solid: "bg-chart-5" },
];

function getSignerColor(index: number) {
  return SIGNER_COLORS[index % SIGNER_COLORS.length];
}

const STATUS_LABELS: Record<string, string> = {
  rascunho: "Rascunho",
  pronto: "Pronto",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

function getSignerName(assinante: DocumentoCompleto["assinantes"][0]): string {
  const nome =
    (assinante.dados_snapshot?.nome_completo as string | undefined) ||
    (assinante.dados_snapshot?.nome as string | undefined);
  if (nome) return nome;

  const tipoLabels: Record<string, string> = {
    cliente: "Cliente",
    parte_contraria: "Parte Contrária",
    representante: "Representante",
    terceiro: "Terceiro",
    usuario: "Usuário",
    convidado: "Convidado",
  };

  return tipoLabels[assinante.assinante_tipo] || `Assinante ${assinante.id}`;
}

export function RevisarDocumentoClient({ uuid }: { uuid: string }) {
  const router = useRouter();

  // Estado
  const [isLoading, setIsLoading] = useState(true);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [documento, setDocumento] = useState<DocumentoCompleto | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(1);

  // PDF URL via proxy route (avoids CORS with Backblaze)
  const { presignedUrl: pdfPresignedUrl } = usePresignedPdfUrl(documento?.pdf_original_url, uuid);

  // Carregar documento
  useEffect(() => {
    async function carregarDocumento() {
      setIsLoading(true);
      try {
        const resultado = await actionGetDocumento({ uuid });

        if (!resultado.success) {
          toast.error(resultado.error || "Erro ao carregar documento");
          router.push("/app/assinatura-digital/documentos/lista");
          return;
        }

        const docData = resultado.data as {
          documento: Omit<DocumentoCompleto, "assinantes" | "ancoras">;
          assinantes: DocumentoCompleto["assinantes"];
          ancoras: DocumentoCompleto["ancoras"];
        };
        if (!docData?.documento) {
          toast.error("Documento não encontrado");
          router.push("/app/assinatura-digital/documentos/lista");
          return;
        }

        const doc: DocumentoCompleto = {
          id: docData.documento.id,
          documento_uuid: docData.documento.documento_uuid,
          titulo: docData.documento.titulo,
          status: docData.documento.status,
          selfie_habilitada: docData.documento.selfie_habilitada,
          pdf_original_url: docData.documento.pdf_original_url,
          assinantes: docData.assinantes,
          ancoras: docData.ancoras,
        };

        setDocumento(doc);
      } catch (error) {
        toast.error("Erro ao carregar documento");
        console.error(error);
        router.push("/app/assinatura-digital/documentos/lista");
      } finally {
        setIsLoading(false);
      }
    }

    carregarDocumento();
  }, [uuid, router]);

  // Copiar link individual
  const handleCopyLink = useCallback(async (assinante: DocumentoCompleto["assinantes"][0]) => {
    try {
      const fullUrl = `${window.location.origin}${assinante.public_link}`;
      await navigator.clipboard.writeText(fullUrl);
      toast.success(`Link copiado para ${getSignerName(assinante)}`);
    } catch {
      toast.error("Erro ao copiar link");
    }
  }, []);

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

  // Finalizar e voltar à lista
  const handleFinalize = useCallback(async () => {
    if (!documento) return;

    setIsFinalizing(true);
    try {
      const resultado = await actionFinalizeDocumento({ uuid: documento.documento_uuid });

      if (!resultado.success) {
        toast.error(resultado.error || "Erro ao finalizar documento");
        return;
      }

      toast.success("Documento pronto para assinatura! Os links foram gerados.");
      router.push("/app/assinatura-digital/documentos/lista");
    } catch (error) {
      console.error("Erro ao finalizar documento:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao finalizar documento");
    } finally {
      setIsFinalizing(false);
    }
  }, [documento, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!documento) {
    return null;
  }

  const anchorsOnPage = documento.ancoras.filter((a) => a.pagina === currentPage);
  const assinantesPendentes = documento.assinantes.filter((a) => a.status === "pendente").length;
  const assinantesConcluidos = documento.assinantes.filter((a) => a.status === "concluido").length;

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">
            {documento.titulo || "Documento sem título"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Confira as configurações antes de compartilhar os links
          </p>
        </div>
        <Badge
          variant={documento.status === "pronto" ? "default" : "secondary"}
        >
          {STATUS_LABELS[documento.status] ?? documento.status}
        </Badge>
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna esquerda - Informações */}
        <div className="space-y-6">
          {/* Card de informações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                Informações do Documento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Título</p>
                  <p className="font-medium">{documento.titulo || "Sem título"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant="outline" className="mt-1">
                    {STATUS_LABELS[documento.status] ?? documento.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Selfie de Verificação</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Camera className="h-4 w-4" />
                    <span>{documento.selfie_habilitada ? "Habilitada" : "Desabilitada"}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Âncoras Definidas</p>
                  <p className="font-medium">{documento.ancoras.length}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">Assinantes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{assinantesPendentes} pendentes</Badge>
                  {assinantesConcluidos > 0 && (
                    <Badge variant="default" className="bg-chart-4">
                      {assinantesConcluidos} concluídos
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card de links */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <LinkIcon className="h-4 w-4" />
                  Links de Assinatura
                </CardTitle>
                <Button variant="outline" size="sm" onClick={handleCopyAllLinks}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Todos
                </Button>
              </div>
              <CardDescription>
                Compartilhe os links com cada assinante para que possam assinar o documento.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {documento.assinantes.map((assinante, idx) => {
                const color = getSignerColor(idx);
                const isConcluido = assinante.status === "concluido";

                return (
                  <div
                    key={assinante.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border",
                      isConcluido ? "bg-chart-4/10 border-chart-4/30" : color.bg,
                      !isConcluido && color.border
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium shrink-0",
                          isConcluido ? "bg-chart-4" : color.solid
                        )}
                      >
                        {isConcluido ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          getSignerName(assinante).charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{getSignerName(assinante)}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {assinante.assinante_tipo.replace("_", " ")}
                          {isConcluido && " • Assinado"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyLink(assinante)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a
                          href={assinante.public_link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Coluna direita - Preview PDF */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Preview do Documento</CardTitle>
            <CardDescription>
              Visualização do PDF com as áreas de assinatura definidas.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative bg-muted/30 rounded-b-lg overflow-hidden">
              {/* PDF com âncoras (read-only) */}
              <div className="relative">
                <PdfPreviewDynamic
                  pdfUrl={pdfPresignedUrl ?? undefined}
                  mode="background"
                  initialPage={currentPage}
                  onPageChange={setCurrentPage}
                  onLoadSuccess={setNumPages}
                  showControls={false}
                  showPageIndicator={false}
                />

                {/* Âncoras sobrepostas (read-only) */}
                <div className="absolute inset-0 pointer-events-none">
                  {anchorsOnPage.map((anchor) => {
                    const assinanteIdx = documento.assinantes.findIndex(
                      (s) => s.id === anchor.documento_assinante_id
                    );
                    const color = getSignerColor(assinanteIdx);
                    const assinante = documento.assinantes.find(
                      (s) => s.id === anchor.documento_assinante_id
                    );

                    return (
                      <div
                        key={anchor.id}
                        className={cn("absolute border-2", color.bg, color.border)}
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
                            <Pen className="h-3 w-3" />
                          ) : (
                            <Stamp className="h-3 w-3" />
                          )}
                          {assinante && getSignerName(assinante).split(" ")[0]}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Controles de página */}
              <div className="flex items-center justify-center gap-3 p-3 bg-background border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm min-w-25 text-center">
                  Página {currentPage} de {numPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                  disabled={currentPage >= numPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de acoes */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          onClick={() => router.push(`/app/assinatura-digital/documentos/editar/${uuid}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Edição
        </Button>
        <Button onClick={handleFinalize} disabled={isFinalizing}>
          {isFinalizing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Finalizando...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Finalizar e Enviar
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
