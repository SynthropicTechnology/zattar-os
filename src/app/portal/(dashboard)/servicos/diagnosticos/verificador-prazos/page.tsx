"use client";

import { useState } from "react";
import { Clock, RotateCcw, ChevronRight, CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ActionButtons,
  CtaZattar,
  Disclaimer,
  generateServicePDF,
  type PDFSection,
} from "@/app/portal/feature/servicos";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function VerificadorPrazosPage() {
  const [step, setStep] = useState<"empregado" | "data" | "resultado">("empregado");
  const [dataRescisaoInput, setDataRescisaoInput] = useState("");

  // ---------------------------------------------------------------------------
  // Calculation
  // ---------------------------------------------------------------------------

  function calcularPrazos(dataRescisaoStr: string) {
    const dataRescisao = new Date(dataRescisaoStr + "T00:00:00");

    const prazoAcao = new Date(dataRescisao);
    prazoAcao.setFullYear(prazoAcao.getFullYear() + 2);

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const diasRestantes = Math.floor(
      (prazoAcao.getTime() - hoje.getTime()) / 86400000
    );
    const dentroDoprAzo = diasRestantes > 0;

    const inicioReclamavel = new Date(hoje);
    inicioReclamavel.setFullYear(inicioReclamavel.getFullYear() - 5);

    const inicioFGTS = new Date(hoje);
    inicioFGTS.setFullYear(inicioFGTS.getFullYear() - 5);

    return {
      dataRescisao,
      prazoAcao,
      diasRestantes,
      dentroDoprAzo,
      inicioReclamavel,
      inicioFGTS,
      hoje,
    };
  }

  const prazos =
    step === "resultado" && dataRescisaoInput
      ? calcularPrazos(dataRescisaoInput)
      : null;

  // ---------------------------------------------------------------------------
  // PDF
  // ---------------------------------------------------------------------------

  async function handleDownloadPDF() {
    if (!prazos) return;

    const sections: PDFSection[] = [
      { label: "Informacoes Calculadas", value: "", type: "header" },
      { label: "Data de Rescisao", value: formatDate(prazos.dataRescisao), type: "row" },
      { label: "Prazo para Ajuizar Acao", value: formatDate(prazos.prazoAcao), type: "row" },
      {
        label: "Situacao do Prazo",
        value: prazos.dentroDoprAzo
          ? `Faltam ${prazos.diasRestantes} dias`
          : `Expirado ha ${Math.abs(prazos.diasRestantes)} dias`,
        type: "row",
      },
      { label: "Periodo Reclamavel", value: "", type: "header" },
      {
        label: "Inicio do Periodo",
        value: formatDate(prazos.inicioReclamavel),
        type: "row",
      },
      { label: "Fim do Periodo", value: formatDate(prazos.dataRescisao), type: "row" },
      { label: "FGTS Nao Depositado", value: "", type: "header" },
      {
        label: "Periodo para Reclamacao FGTS",
        value: `${formatDate(prazos.inicioFGTS)} a ${formatDate(prazos.hoje)}`,
        type: "row",
      },
    ];

    const disclaimer =
      "Este diagnostico tem carater meramente informativo. Consulte um advogado trabalhista para analise detalhada do seu caso.";

    const pdfBytes = await generateServicePDF({
      title: "Verificador de Prazos Trabalhistas",
      sections,
      disclaimer,
      date: new Date(),
    });

    const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "verificador-prazos-trabalhistas.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }

  // ---------------------------------------------------------------------------
  // Reset
  // ---------------------------------------------------------------------------

  function handleReset() {
    setStep("empregado");
    setDataRescisaoInput("");
  }

  // ---------------------------------------------------------------------------
  // Render: Step 1 — Empregado?
  // ---------------------------------------------------------------------------

  function renderStepEmpregado() {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">
            Voce esta empregado atualmente?
          </h2>
          <p className="text-sm text-muted-foreground">
            Isso determina se os prazos prescricionais ja estao correndo.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Sim */}
          <button
            type="button"
            onClick={() => setStep("resultado")}
            className="w-full text-left p-6 rounded-xl border-2 border-transparent bg-muted hover:bg-muted/80 transition-all"
          >
            <span className="block text-lg font-bold text-foreground">
              Sim, estou empregado
            </span>
            <span className="block text-xs text-muted-foreground mt-1">
              Ainda tenho vinculo empregaticio ativo
            </span>
          </button>

          {/* Nao */}
          <button
            type="button"
            onClick={() => setStep("data")}
            className="w-full text-left p-6 rounded-xl border-2 border-transparent bg-muted hover:bg-muted/80 transition-all"
          >
            <span className="block text-lg font-bold text-foreground">
              Nao, fui desligado
            </span>
            <span className="block text-xs text-muted-foreground mt-1">
              Meu contrato de trabalho foi encerrado
            </span>
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Empregado info (still employed)
  // ---------------------------------------------------------------------------

  function renderEmpregadoInfo() {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">
            Voce esta empregado atualmente?
          </h2>
        </div>

        {/* Selected card */}
        <div className="p-6 rounded-xl border-2 border-primary bg-primary/10">
          <span className="block text-lg font-bold text-foreground">
            Sim, estou empregado
          </span>
          <span className="block text-xs text-muted-foreground mt-1">
            Ainda tenho vinculo empregaticio ativo
          </span>
        </div>

        {/* Info message */}
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-foreground">
                  Prazos nao estao correndo
                </p>
                <p className="text-sm text-muted-foreground">
                  Enquanto voce estiver empregado, os prazos prescricionais nao
                  correm. A contagem inicia apos o termino do vinculo
                  empregaticio.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <CtaZattar
          title="Conheca seus direitos trabalhistas"
          description="Nossos advogados podem orientar voce sobre seus direitos durante o emprego e como se proteger em caso de desligamento."
          buttonText="Falar com um advogado"
        />

        <button
          type="button"
          onClick={handleReset}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Refazer Verificacao
        </button>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Step 2 — Data de Rescisao
  // ---------------------------------------------------------------------------

  function renderStepData() {
    const isValid = dataRescisaoInput.length > 0;

    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">
            Quando foi desligado?
          </h2>
          <p className="text-sm text-muted-foreground">
            Informe a data de rescisao do seu contrato de trabalho.
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="data-rescisao"
            className="block text-sm font-bold text-foreground"
          >
            Data de Rescisao
          </label>
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              id="data-rescisao"
              type="date"
              value={dataRescisaoInput}
              onChange={(e) => setDataRescisaoInput(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setStep("resultado")}
          disabled={!isValid}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-bold transition-all",
            isValid
              ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_20px_rgba(204,151,255,0.2)]"
              : "bg-muted text-muted-foreground/40 cursor-not-allowed"
          )}
        >
          Verificar Prazos
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Resultado
  // ---------------------------------------------------------------------------

  function renderResultado() {
    if (!prazos) return null;

    const { prazoAcao, diasRestantes, dentroDoprAzo, inicioReclamavel, dataRescisao, inicioFGTS, hoje } = prazos;
    const diasAbs = Math.abs(diasRestantes);

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">
            Verificacao de Prazos
          </h2>
          <p className="text-sm text-muted-foreground">
            Baseado na data de rescisao{" "}
            <strong>{formatDate(dataRescisao)}</strong>, veja os prazos
            aplicaveis ao seu caso.
          </p>
        </div>

        {/* Card 1: Prazo para Ajuizar Acao */}
        <div
          className={cn(
            "rounded-xl border p-6 space-y-4",
            dentroDoprAzo
              ? "border-emerald-500/30 bg-emerald-500/5"
              : "border-red-500/30 bg-red-500/5"
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase block mb-1">
                Prazo para Ajuizar Acao
              </span>
              <p className="text-sm text-muted-foreground">
                Voce tem 2 anos apos a rescisao para ingressar com acao
                trabalhista.
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 text-xs font-black tracking-wider px-3 py-1 rounded-full border",
                dentroDoprAzo
                  ? "text-emerald-600 border-emerald-500/40 bg-emerald-500/10"
                  : "text-red-600 border-red-500/40 bg-red-500/10"
              )}
            >
              {dentroDoprAzo ? "DENTRO DO PRAZO" : "PRAZO EXPIRADO"}
            </span>
          </div>

          {/* Countdown */}
          <div className="flex items-end gap-2">
            <span
              className={cn(
                "text-5xl font-black tabular-nums leading-none",
                dentroDoprAzo ? "text-emerald-500" : "text-red-500"
              )}
            >
              {diasAbs.toLocaleString("pt-BR")}
            </span>
            <span className="text-sm font-bold text-muted-foreground mb-1">
              dias
            </span>
          </div>

          <p
            className={cn(
              "text-sm font-medium",
              dentroDoprAzo ? "text-emerald-600" : "text-red-600"
            )}
          >
            {dentroDoprAzo
              ? `Faltam ${diasAbs.toLocaleString("pt-BR")} dias — ate ${formatDate(prazoAcao)}`
              : `EXPIRADO ha ${diasAbs.toLocaleString("pt-BR")} dias — venceu em ${formatDate(prazoAcao)}`}
          </p>
        </div>

        {/* Card 2: Periodo Reclamavel */}
        <div className="rounded-xl border border-border bg-muted/40 p-6 space-y-4">
          <div>
            <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase block mb-1">
              Periodo Reclamavel
            </span>
            <p className="text-sm text-muted-foreground">
              Mesmo dentro do prazo para ajuizar, so e possivel reclamar
              direitos dos ultimos 5 anos.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-background border border-border">
              <span className="text-xs text-muted-foreground block mb-1">
                Inicio do periodo
              </span>
              <span className="text-sm font-bold text-foreground">
                {formatDate(inicioReclamavel)}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-background border border-border">
              <span className="text-xs text-muted-foreground block mb-1">
                Data de rescisao
              </span>
              <span className="text-sm font-bold text-foreground">
                {formatDate(dataRescisao)}
              </span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Direitos anteriores a{" "}
            <strong>{formatDate(inicioReclamavel)}</strong> nao podem mais ser
            reclamados.
          </p>
        </div>

        {/* Card 3: FGTS Nao Depositado */}
        <div className="rounded-xl border border-border bg-muted/40 p-6 space-y-4">
          <div>
            <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase block mb-1">
              FGTS Nao Depositado
            </span>
            <p className="text-sm text-muted-foreground">
              Voce pode reclamar depositos de FGTS dos ultimos 5 anos a contar
              de hoje.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-background border border-border">
              <span className="text-xs text-muted-foreground block mb-1">
                Depositos a partir de
              </span>
              <span className="text-sm font-bold text-foreground">
                {formatDate(inicioFGTS)}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-background border border-border">
              <span className="text-xs text-muted-foreground block mb-1">
                Ate hoje
              </span>
              <span className="text-sm font-bold text-foreground">
                {formatDate(hoje)}
              </span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Prazo prescricional do FGTS e de 5 anos para cada deposito nao
            realizado.
          </p>
        </div>

        {/* CTA */}
        <CtaZattar
          title={
            dentroDoprAzo
              ? "Ainda ha tempo — nao perca seu prazo"
              : "Prazo expirado — ainda podemos ajudar"
          }
          description={
            dentroDoprAzo
              ? "Voce ainda esta dentro do prazo para ajuizar acao. Nossos advogados podem analisar seu caso e orientar os proximos passos."
              : "Mesmo com o prazo expirado, existem situacoes em que a prescricao pode ser discutida. Consulte um advogado."
          }
          buttonText="Falar com um advogado"
        />

        {/* Action Buttons */}
        <ActionButtons onDownloadPDF={handleDownloadPDF} />

        {/* Disclaimer */}
        <Disclaimer text="*Este diagnostico tem carater meramente informativo. Os prazos podem variar conforme a natureza da acao, existencia de causas suspensivas ou interruptivas da prescricao. Consulte um advogado trabalhista para analise detalhada do seu caso." />

        {/* Reset */}
        <button
          type="button"
          onClick={handleReset}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Refazer Verificacao
        </button>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  // Special case: user said "Sim, estou empregado" -> show info, not step 2
  const isEmpregadoSelected = step === "resultado" && !dataRescisaoInput;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          Verificador de Prazos Trabalhistas
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Saiba se voce ainda esta dentro do prazo para ajuizar acao trabalhista
          e quais direitos podem ser reclamados.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          {step === "empregado" && renderStepEmpregado()}
          {step === "data" && renderStepData()}
          {isEmpregadoSelected && renderEmpregadoInfo()}
          {step === "resultado" && dataRescisaoInput && renderResultado()}
        </CardContent>
      </Card>
    </div>
  );
}
