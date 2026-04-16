"use client";

import * as React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Download, ArrowLeft, FileText, Eye, Share2, CheckCircle, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/typography";

export interface SuccessStepProps {
  documento: {
    titulo?: string | null;
    pdf_final_url?: string | null;
  };
  onDownload?: () => void;
  onReturnToDashboard?: () => void;
}

export function SuccessStep({
  documento,
  onDownload,
  onReturnToDashboard,
}: SuccessStepProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      if (!documento.pdf_final_url) {
        throw new Error("URL do PDF não disponível");
      }

      // Download efetivo via fetch + blob
      const response = await fetch(documento.pdf_final_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${documento.titulo || "documento-assinado"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onDownload?.();
      toast.success("Download iniciado");
    } catch (error) {
      console.error("Erro ao baixar documento:", error);
      // Fallback: abrir em nova aba
      if (documento.pdf_final_url) {
        window.open(documento.pdf_final_url, "_blank");
      }
      toast.error("Erro no download. Abrindo em nova aba.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleView = () => {
    if (documento.pdf_final_url) {
      window.open(documento.pdf_final_url, "_blank");
    }
  };

  const handleShare = async () => {
    if (navigator.share && documento.pdf_final_url) {
      try {
        await navigator.share({
          title: documento.titulo || "Documento Assinado",
          url: documento.pdf_final_url,
        });
      } catch {
        // Usuário cancelou
      }
    } else if (documento.pdf_final_url) {
      await navigator.clipboard.writeText(documento.pdf_final_url);
      toast.success("Link copiado para a área de transferência");
    }
  };

  const fileName = documento.titulo || "Documento Assinado";

  return (
    <div className="max-w-md mx-auto flex flex-col h-full justify-center gap-5 sm:gap-6 animate-in fade-in duration-500 px-1">
      {/* Seção de Sucesso */}
      <div className="text-center space-y-3">
        {/* Ícone Animado - ping para após 2 iterações */}
        <div className="relative flex items-center justify-center mx-auto w-16 h-16 sm:w-20 sm:h-20">
          <div className="absolute inset-0 bg-success/20 rounded-full animate-ping repeat-2" />
          <div className="relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-success/10 rounded-full text-success">
            <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10" aria-hidden="true" />
          </div>
        </div>

        <Heading level="page" className="text-2xl sm:text-3xl tracking-tight text-foreground">
          Assinatura Confirmada!
        </Heading>

        <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
          Documento assinado com sucesso e protegido. Uma cópia foi enviada para
          seu e-mail.
        </p>
      </div>

      {/* Card do Documento */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {/* Thumbnail PDF */}
        <div className="relative h-24 sm:h-32 bg-linear-to-br from-muted to-muted/80 flex items-center justify-center">
          <div className="absolute inset-0 bg-linear-to-t from-black/10 to-transparent" />
          <div className="relative z-10 flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-destructive/10 rounded-lg text-destructive">
            <FileText className="w-6 h-6 sm:w-8 sm:h-8" aria-hidden="true" />
          </div>
          {/* Badge de Status */}
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 bg-success/10 text-success text-xs font-medium rounded-full">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Assinado
          </div>
        </div>

        {/* Informações do Documento */}
        <div className="p-3 sm:p-4 space-y-2">
          <div>
            <Heading level="card" className="text-sm text-foreground truncate">
              {fileName}
            </Heading>
            <p className="text-xs text-muted-foreground mt-0.5">
              Assinado agora
            </p>
          </div>

          {/* Ações Rápidas */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={handleView}
              className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              Visualizar
            </button>
            <span className="text-border">|</span>
            <button
              onClick={handleShare}
              className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
              Compartilhar
            </button>
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="space-y-2">
        <Button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading || !documento.pdf_final_url}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] transition-all min-h-11"
        >
          <Download
            className="w-4 h-4 mr-2"
            aria-hidden="true"
          />
          {isDownloading ? "Baixando..." : "Baixar PDF Assinado"}
        </Button>

        {onReturnToDashboard && (
          <Button
            type="button"
            variant="outline"
            onClick={onReturnToDashboard}
            className="w-full border-border text-foreground hover:bg-muted min-h-11"
          >
            <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
            Voltar ao Início
          </Button>
        )}
      </div>

      {/* Footer Legal */}
      <p className="text-xs text-muted-foreground text-center pb-2">
        Assinado eletronicamente conforme MP 2.200-2/2001.
        <br />
        &copy; {new Date().getFullYear()} Zattar Advogados.
      </p>
    </div>
  );
}
