"use client";

/**
 * NovoDocumentoClient — Etapa 1: Upload do PDF
 *
 * Layout split: dropzone à esquerda, painel de contexto à direita (desktop).
 * Mobile: stack vertical, dropzone no topo.
 * Integrado com DocumentFlowShell (stepper no header).
 */

import {
  FileSignature,
  Shield,
  Users,
  MousePointerClick,
} from "lucide-react";
import { DocumentFlowShell } from "../../feature/components/flow";
import { DocumentUploadDropzone } from "../../feature/components/upload";
import { Heading } from "@/components/ui/typography";

// ─── Context Panel ─────────────────────────────────────────────────────

const FLOW_STEPS_INFO = [
  {
    icon: FileSignature,
    title: "Envie o PDF",
    description: "Faça upload do documento que será assinado digitalmente.",
  },
  {
    icon: Users,
    title: "Adicione assinantes",
    description:
      "Defina quem vai assinar e posicione os campos de assinatura no PDF.",
  },
  {
    icon: MousePointerClick,
    title: "Compartilhe os links",
    description:
      "Cada assinante recebe um link único e seguro para assinar.",
  },
  {
    icon: Shield,
    title: "Validade jurídica",
    description:
      "Assinaturas com hash SHA-256, geolocalização, IP e aceite de termos (MP 2.200-2).",
  },
];

function ContextPanel() {
  return (
    <div className="flex flex-col justify-center space-y-6">
      <div>
        <Heading level="section" className="text-lg">
          Como funciona
        </Heading>
        <p className="text-sm text-muted-foreground mt-1">
          Envie, configure e compartilhe em 3 passos simples.
        </p>
      </div>

      <div className="space-y-4">
        {FLOW_STEPS_INFO.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={idx} className="flex gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="size-4.5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────

export function NovoDocumentoClient() {
  return (
    <DocumentFlowShell>
      <div className="flex h-full min-h-0 flex-col lg:flex-row gap-6 lg:gap-10 max-w-6xl mx-auto w-full">
        {/* Dropzone — principal */}
        <div className="flex-1 min-h-0 flex flex-col">
          <DocumentUploadDropzone />
        </div>

        {/* Context panel — lateral no desktop, abaixo no mobile */}
        <div className="w-full lg:w-80 shrink-0 lg:py-8">
          <ContextPanel />
        </div>
      </div>
    </DocumentFlowShell>
  );
}
