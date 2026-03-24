"use client";

import { Upload, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UploadContextPanelProps } from "../types";

/**
 * UploadContextPanel - Painel informativo lateral com instruções de upload
 *
 * Exibe badge de step, título, descrição dos tipos suportados,
 * botão de seleção de arquivo e informação de segurança.
 *
 * @example
 * ```tsx
 * <UploadContextPanel
 *   onSelectFile={() => inputRef.current?.click()}
 *   isUploading={false}
 * />
 * ```
 */
export function UploadContextPanel({
  onSelectFile,
  isUploading,
}: UploadContextPanelProps) {
  return (
    <div className="group relative flex flex-col justify-center space-y-6 p-6 lg:p-8 animate-fade-in-left animate-duration-500">
      {/* Blob decorativo de fundo */}
      <div
        className={cn(
          "absolute -left-10 -top-10 size-40 rounded-full blur-3xl transition-all duration-700",
          "bg-primary/5 group-hover:bg-primary/10",
          "hidden lg:block",
        )}
        aria-hidden="true"
      />

      {/* Badge Step */}
      <div className="relative">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-3 py-1",
            "bg-primary/10 text-primary",
            "text-xs font-medium uppercase tracking-wider",
          )}
        >
          Passo 1
        </span>
      </div>

      {/* Título */}
      <h2
        className={cn(
          "relative font-heading font-bold leading-tight tracking-tight",
          "text-3xl text-foreground md:text-4xl lg:text-5xl",
        )}
      >
        Vamos assinar seu documento
      </h2>

      {/* Descrição */}
      <p className="relative text-lg leading-relaxed text-muted-foreground">
        Suportamos arquivos <strong className="text-foreground">PDF</strong> com até{" "}
        <strong className="text-foreground">10MB</strong>.
      </p>

      {/* Botão de seleção */}
      <div className="relative">
        <Button
          type="button"
          size="lg"
          onClick={onSelectFile}
          disabled={isUploading}
          className={cn(
            "w-full gap-2 lg:w-auto rounded-xl",
            "bg-primary text-primary-foreground hover:bg-primary/90",
            "shadow-lg shadow-primary/20 hover:shadow-primary/40",
            "hover:-translate-y-0.5 transition-all duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0",
          )}
        >
          <Upload className="size-5" />
          {isUploading ? "Enviando..." : "Selecionar Arquivo do Computador"}
        </Button>
      </div>

      {/* Informação de segurança */}
      <div className="relative flex items-center gap-2 text-xs text-muted-foreground">
        <Shield className="size-4" />
        <span>Seus arquivos são criptografados e seguros</span>
      </div>
    </div >
  );
}
