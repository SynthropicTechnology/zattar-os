"use client";

import { useState } from "react";
import { useFormularioStore } from '@/shared/assinatura-digital/store';
import FormStepLayout from "./form-step-layout";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { TERMOS_TEXTO_DECLARACAO, TERMOS_VERSAO_ATUAL } from '@/shared/assinatura-digital/constants/termos';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Info } from "lucide-react";

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
    console.log("📜 Termos de aceite salvos no store:", {
      versao: TERMOS_VERSAO_ATUAL,
      data: timestamp,
    });
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
      <div className="space-y-6">
        <Alert variant="default" className="border-info/15 bg-info/10">
          <Info className="h-4 w-4 text-info" />
          <AlertTitle className="text-info font-semibold">
            Importância Legal do seu Acordo
          </AlertTitle>
          <AlertDescription className="text-info">
            Ao marcar a caixa abaixo, você está concordando legalmente com os
            termos do documento. Esta ação tem validade jurídica e é um passo
            essencial para a conclusão do processo.
          </AlertDescription>
        </Alert>

        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center space-x-4 bg-muted/50">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <div className="flex-1">
              <CardTitle>Declaração de Aceite</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Baseado na Medida Provisória nº 2.200-2/2001.
              </p>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4 rounded-md border p-4 bg-background">
              <Checkbox
                id="termos-aceite"
                checked={aceiteCheckbox}
                onCheckedChange={(checked) => setAceiteCheckbox(checked === true)}
                className="min-w-11 min-h-11 shrink-0 mt-1"
                aria-label="Aceitar os termos e condições"
              />
              <Label
                htmlFor="termos-aceite"
                className="flex-1 text-base font-normal text-foreground leading-relaxed cursor-pointer"
              >
                {TERMOS_TEXTO_DECLARACAO}
              </Label>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground">
          <p>
            As informações coletadas nesta etapa, incluindo data, hora e
            versão dos termos, serão armazenadas de forma segura como parte da
            evidência de sua assinatura.
          </p>
        </div>
      </div>
    </FormStepLayout>
  );
}
