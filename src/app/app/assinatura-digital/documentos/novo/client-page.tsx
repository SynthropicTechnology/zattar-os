"use client";

/**
 * NovoDocumentoClient - Criação de novo documento de assinatura digital
 *
 * Layout full-width focado no upload (passo 1).
 * Após upload, cria o documento e redireciona para /editar/[uuid]
 * onde o PDF é renderizado com a sidebar de configuração.
 */

import { FileSignature } from "lucide-react";
import { DocumentUploadDropzone } from "../../feature/components/upload";

export function NovoDocumentoClient() {
  return (
    <div className="-m-6 h-[calc(100svh-(--spacing(14))-(--spacing(12)))] flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="shrink-0 border-b bg-background px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
            <FileSignature className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold font-heading text-foreground">
              Novo Documento
            </h1>
            <p className="text-sm text-muted-foreground">
              Envie um PDF para configurar assinantes e posicionar campos
            </p>
          </div>
        </div>
      </div>

      {/* Área principal — dropzone centralizado */}
      <div className="flex-1 overflow-auto bg-muted/30">
        <DocumentUploadDropzone />
      </div>
    </div>
  );
}
