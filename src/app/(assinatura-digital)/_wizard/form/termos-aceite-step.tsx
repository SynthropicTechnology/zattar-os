"use client";

import { useState } from "react";
import { useFormularioStore } from '@/shared/assinatura-digital/store';
import FormStepLayout from "./form-step-layout";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { TERMOS_TEXTO_DECLARACAO, TERMOS_VERSAO_ATUAL } from '@/shared/assinatura-digital/constants/termos';
import { ShieldCheck, Info } from "lucide-react";
import { GlassPanel } from "@/components/shared/glass-panel";
import { Heading, Text } from "@/components/ui/typography";

export default function TermosAceiteStep() {
  const { termosAceite } = useFormularioStore.getState();
  const [aceiteCheckbox, setAceiteCheckbox] = useState(termosAceite === true);

  const {
    setTermosAceite,
    proximaEtapa,
    etapaAnterior,
  } = useFormularioStore();

  const handleContinuar = () => {
    if (!aceiteCheckbox) {
      toast.error("Você deve aceitar os termos para continuar.");
      return;
    }

    const timestamp = new Date().toISOString();
    setTermosAceite(true, TERMOS_VERSAO_ATUAL, timestamp);
    proximaEtapa();
  };

  return (
    <FormStepLayout
      title="Aceite de Termos"
      description="Leia e aceite os termos para prosseguir com a assinatura eletrônica."
      onPrevious={etapaAnterior}
      onNext={handleContinuar}
      nextLabel="Continuar"
      isNextDisabled={!aceiteCheckbox}
    >
      <div className="space-y-5">
        {/* Banner de importância legal — tint info glass */}
        <div className="flex items-start gap-3 rounded-xl border border-info/20 bg-info/10 p-4 backdrop-blur-sm">
          <Info
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0 text-info"
            strokeWidth={2.25}
          />
          <div className="space-y-1">
            <Text variant="label" className="text-info block">
              Importância legal do seu aceite
            </Text>
            <Text variant="caption" className="text-foreground/85 leading-relaxed">
              Ao marcar a caixa abaixo, você está concordando legalmente com os
              termos do documento. Esta ação tem validade jurídica e é um passo
              essencial para a conclusão do processo.
            </Text>
          </div>
        </div>

        {/* Card principal — GlassPanel depth=2 com header tintado primary */}
        <GlassPanel
          depth={2}
          className="overflow-hidden rounded-2xl p-0"
        >
          <header className="flex items-start gap-3 border-b border-outline-variant/20 bg-primary/5 p-5">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
              <ShieldCheck className="h-4.5 w-4.5" strokeWidth={2.25} />
            </span>
            <div className="flex-1 min-w-0">
              <Heading level="section" className="font-display text-lg tracking-tight">
                Declaração de Aceite
              </Heading>
              <Text variant="caption" className="text-muted-foreground mt-0.5">
                Baseado na Medida Provisória nº 2.200-2/2001
              </Text>
            </div>
          </header>

          <div className="p-5">
            <label
              htmlFor="termos-aceite"
              className="flex items-start gap-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest/70 p-4 backdrop-blur-sm cursor-pointer transition-colors hover:border-primary/40 hover:bg-surface-container-lowest"
            >
              <Checkbox
                id="termos-aceite"
                checked={aceiteCheckbox}
                onCheckedChange={(checked) => setAceiteCheckbox(checked === true)}
                className="mt-0.5 size-5 shrink-0"
                aria-label="Aceitar os termos e condições"
              />
              <Label
                htmlFor="termos-aceite"
                className="flex-1 text-sm leading-relaxed text-foreground cursor-pointer font-normal"
              >
                {TERMOS_TEXTO_DECLARACAO}
              </Label>
            </label>
          </div>
        </GlassPanel>

        {/* Footer legal — discrete */}
        <Text variant="micro-caption" className="block text-center text-muted-foreground/70 leading-relaxed">
          As informações coletadas nesta etapa — data, hora e versão dos termos —
          serão armazenadas de forma segura como evidência de sua assinatura.
        </Text>
      </div>
    </FormStepLayout>
  );
}
