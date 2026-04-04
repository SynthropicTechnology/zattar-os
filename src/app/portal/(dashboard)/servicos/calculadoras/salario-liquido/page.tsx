"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  calcularSalarioLiquido,
  type GrauInsalubridade,
  type ResultadoSalarioLiquido,
  CalculatorShell,
  CurrencyInput,
  NumberInput,
  SelectOption,
  ToggleOption,
  ResultRow,
  ActionButtons,
  VerifiedBadge,
  Disclaimer,
  formatBRL,
  formatPercent,
  generateServicePDF,
  type PDFSection,
} from "@/app/portal/feature/servicos";

// ─── Options ─────────────────────────────────────────────────────────────────

type TipoAdicional = "nenhum" | "insalubridade" | "periculosidade" | "noturno";

const TIPOS_ADICIONAL: { value: TipoAdicional; label: string }[] = [
  { value: "nenhum", label: "Nenhum" },
  { value: "insalubridade", label: "Insalubridade" },
  { value: "periculosidade", label: "Periculosidade" },
  { value: "noturno", label: "Adicional Noturno" },
];

const GRAUS_INSALUBRIDADE: { value: GrauInsalubridade; label: string }[] = [
  { value: "minimo", label: "Mínimo (10%)" },
  { value: "medio", label: "Médio (20%)" },
  { value: "maximo", label: "Máximo (40%)" },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SalarioLiquidoCalculatorPage() {
  // Currency inputs — dual state (raw string + parsed number)
  const [salarioRaw, setSalarioRaw] = useState("");
  const [salarioBruto, setSalarioBruto] = useState(0);

  const [pensaoRaw, setPensaoRaw] = useState("");
  const [pensaoAlimenticia, setPensaoAlimenticia] = useState(0);

  // Number inputs
  const [dependentesRaw, setDependentesRaw] = useState("");
  const [dependentes, setDependentes] = useState(0);

  const [horasNoturnasRaw, setHorasNoturnasRaw] = useState("");
  const [horasNoturnas, setHorasNoturnas] = useState(0);

  // Selects
  const [tipoAdicional, setTipoAdicional] = useState<TipoAdicional>("nenhum");
  const [grauInsalubridade, setGrauInsalubridade] = useState<GrauInsalubridade>("medio");

  // Toggles
  const [descontoVT, setDescontoVT] = useState(false);

  // Reactive calculation
  const resultado: ResultadoSalarioLiquido | null = useMemo(() => {
    if (salarioBruto <= 0) return null;

    return calcularSalarioLiquido({
      salarioBruto,
      dependentes,
      descontoVT,
      pensaoAlimenticia,
      insalubridade: tipoAdicional === "insalubridade" ? grauInsalubridade : undefined,
      periculosidade: tipoAdicional === "periculosidade",
      adicionalNoturno: tipoAdicional === "noturno",
      horasNoturnas: tipoAdicional === "noturno" ? horasNoturnas : 0,
    });
  }, [
    salarioBruto,
    dependentes,
    descontoVT,
    pensaoAlimenticia,
    tipoAdicional,
    grauInsalubridade,
    horasNoturnas,
  ]);

  // PDF download
  const handleDownloadPDF = useCallback(async () => {
    if (!resultado) return;

    const sections: PDFSection[] = [];

    // Proventos header
    sections.push({ label: "Proventos", value: "", type: "header" });
    sections.push({ label: "Salário Bruto", value: formatBRL(resultado.salarioBruto), type: "row" });
    if (resultado.adicionalInsalubridade > 0) {
      sections.push({ label: "Adicional Insalubridade", value: formatBRL(resultado.adicionalInsalubridade), type: "row" });
    }
    if (resultado.adicionalPericulosidade > 0) {
      sections.push({ label: "Adicional Periculosidade", value: formatBRL(resultado.adicionalPericulosidade), type: "row" });
    }
    if (resultado.adicionalNoturno > 0) {
      sections.push({ label: "Adicional Noturno", value: formatBRL(resultado.adicionalNoturno), type: "row" });
    }
    sections.push({ label: "Total Proventos", value: formatBRL(resultado.totalProventos), type: "row" });

    // Descontos header
    sections.push({ label: "Descontos", value: "", type: "header" });
    sections.push({
      label: `INSS (${formatPercent(resultado.inss.aliquotaEfetiva)})`,
      value: `- ${formatBRL(resultado.inss.total)}`,
      type: "deduction",
    });
    if (!resultado.irrf.isento) {
      sections.push({
        label: `IRRF (${formatPercent(resultado.irrf.aliquotaEfetiva)})`,
        value: `- ${formatBRL(resultado.irrf.imposto)}`,
        type: "deduction",
      });
    }
    if (resultado.descontoVT > 0) {
      sections.push({ label: "Vale-Transporte", value: `- ${formatBRL(resultado.descontoVT)}`, type: "deduction" });
    }
    if (resultado.pensaoAlimenticia > 0) {
      sections.push({ label: "Pensão Alimentar", value: `- ${formatBRL(resultado.pensaoAlimenticia)}`, type: "deduction" });
    }

    // Total
    sections.push({ label: "Salário Líquido", value: formatBRL(resultado.salarioLiquido), type: "total" });

    const disclaimer =
      "Este cálculo tem caráter meramente informativo e estimativo. Os valores exatos podem variar conforme convenções coletivas, acordos individuais e interpretações jurídicas. Consulte um advogado trabalhista para análise detalhada do seu caso.";

    const pdfBytes = await generateServicePDF({
      title: "Cálculo de Salário Líquido",
      sections,
      disclaimer,
      date: new Date(),
    });

    const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "calculo-salario-liquido.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }, [resultado]);

  // Share
  const handleShare = useCallback(async () => {
    if (!resultado) return;
    if (navigator.share) {
      await navigator.share({
        title: "Cálculo de Salário Líquido",
        text: `Salário Líquido estimado: ${formatBRL(resultado.salarioLiquido)}`,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  }, [resultado]);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <CalculatorShell
      inputPanel={
        <>
          {/* Salário Bruto */}
          <CurrencyInput
            label="Salário Bruto"
            value={salarioRaw}
            onChange={(raw, parsed) => {
              setSalarioRaw(raw);
              setSalarioBruto(parsed);
            }}
          />

          {/* Dependentes para IR */}
          <NumberInput
            label="Dependentes para IR"
            value={dependentesRaw}
            onChange={(raw, parsed) => {
              setDependentesRaw(raw);
              setDependentes(Math.max(0, Math.floor(parsed)));
            }}
            placeholder="0"
            suffix="dep."
          />

          {/* Vale-Transporte */}
          <ToggleOption
            label="Vale-Transporte"
            description="Desconto de 6% sobre o salário bruto"
            checked={descontoVT}
            onChange={setDescontoVT}
          />

          {/* Tipo de Adicional */}
          <SelectOption
            label="Adicional"
            options={TIPOS_ADICIONAL}
            value={tipoAdicional}
            onChange={(v) => setTipoAdicional(v as TipoAdicional)}
          />

          {/* Grau Insalubridade (condicional) */}
          {tipoAdicional === "insalubridade" && (
            <SelectOption
              label="Grau de Insalubridade"
              options={GRAUS_INSALUBRIDADE}
              value={grauInsalubridade}
              onChange={(v) => setGrauInsalubridade(v as GrauInsalubridade)}
            />
          )}

          {/* Horas Noturnas (condicional) */}
          {tipoAdicional === "noturno" && (
            <NumberInput
              label="Horas Noturnas"
              value={horasNoturnasRaw}
              onChange={(raw, parsed) => {
                setHorasNoturnasRaw(raw);
                setHorasNoturnas(Math.max(0, parsed));
              }}
              placeholder="0"
              suffix="hrs"
            />
          )}

          {/* Pensão Alimentar */}
          <CurrencyInput
            label="Pensão Alimentar"
            value={pensaoRaw}
            onChange={(raw, parsed) => {
              setPensaoRaw(raw);
              setPensaoAlimenticia(parsed);
            }}
          />

          {/* Verified Badge */}
          <VerifiedBadge />
        </>
      }
      resultPanel={
        <>
          <Card>
            <CardContent className="p-6 relative overflow-hidden">
              {/* Decorative glow */}
              <div className="absolute -top-20 -right-20 w-56 h-56 bg-primary/10 blur-[70px] rounded-full pointer-events-none" />

              <span className="text-xs font-bold tracking-widest text-primary uppercase block mb-6 relative z-10">
                Detalhamento do Cálculo
              </span>

              <div className="space-y-0 relative z-10">
                {/* Proventos */}
                <div className="py-2">
                  <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                    Proventos
                  </span>
                </div>

                <ResultRow
                  label="Salário Bruto"
                  value={resultado ? formatBRL(resultado.salarioBruto) : "--"}
                  dimmed={!resultado}
                />

                {resultado && resultado.adicionalInsalubridade > 0 && (
                  <ResultRow
                    label="Adicional Insalubridade"
                    value={formatBRL(resultado.adicionalInsalubridade)}
                  />
                )}

                {resultado && resultado.adicionalPericulosidade > 0 && (
                  <ResultRow
                    label="Adicional Periculosidade"
                    value={formatBRL(resultado.adicionalPericulosidade)}
                  />
                )}

                {resultado && resultado.adicionalNoturno > 0 && (
                  <ResultRow
                    label="Adicional Noturno"
                    value={formatBRL(resultado.adicionalNoturno)}
                  />
                )}

                <ResultRow
                  label="Total Proventos"
                  value={resultado ? formatBRL(resultado.totalProventos) : "--"}
                  dimmed={!resultado}
                />

                {/* Descontos */}
                <div className="py-2 mt-2">
                  <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                    Descontos
                  </span>
                </div>

                <ResultRow
                  label={resultado ? `INSS (${formatPercent(resultado.inss.aliquotaEfetiva)} ef.)` : "INSS"}
                  value={resultado ? `- ${formatBRL(resultado.inss.total)}` : "--"}
                  negative={!!resultado}
                  dimmed={!resultado}
                />

                {resultado && !resultado.irrf.isento && (
                  <ResultRow
                    label={`IRRF (${formatPercent(resultado.irrf.aliquotaEfetiva)} ef.)`}
                    value={`- ${formatBRL(resultado.irrf.imposto)}`}
                    negative
                  />
                )}

                {resultado && resultado.descontoVT > 0 && (
                  <ResultRow
                    label="Vale-Transporte (6%)"
                    value={`- ${formatBRL(resultado.descontoVT)}`}
                    negative
                  />
                )}

                {resultado && resultado.pensaoAlimenticia > 0 && (
                  <ResultRow
                    label="Pensão Alimentar"
                    value={`- ${formatBRL(resultado.pensaoAlimenticia)}`}
                    negative
                  />
                )}

                {/* Separator */}
                <div className="border-t border-border mt-2" />
              </div>

              {/* Salário Líquido highlight */}
              <div className="mt-6 pt-4 relative z-10">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Salário Líquido
                  </span>
                  <span className="text-3xl font-black text-primary font-headline tabular-nums">
                    {resultado ? formatBRL(resultado.salarioLiquido) : formatBRL(0)}
                  </span>
                </div>
              </div>

              {/* Nota Lei 15.270/2025 */}
              {resultado && resultado.salarioBruto <= 7_350 && (
                <p className="mt-4 text-[11px] text-muted-foreground/70 leading-relaxed relative z-10">
                  * Redutor da Lei 15.270/2025 aplicado para salários até R$ 7.350,00.
                </p>
              )}

              {/* Disclaimer */}
              <Disclaimer
                text="*Estimativa baseada na legislação trabalhista vigente. Valores exatos podem variar conforme convenções coletivas, acordos individuais e interpretações jurídicas. Consulte um advogado trabalhista para análise do seu caso."
              />
            </CardContent>
          </Card>

          {/* Action buttons */}
          <ActionButtons
            onDownloadPDF={handleDownloadPDF}
            onShare={handleShare}
          />
        </>
      }
    />
  );
}
