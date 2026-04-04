"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  calcularAdicionalNoturno,
  type TipoTrabalhoNoturno,
  type ResultadoAdicionalNoturno,
  CalculatorShell,
  CurrencyInput,
  NumberInput,
  SelectOption,
  ResultRow,
  ActionButtons,
  VerifiedBadge,
  Disclaimer,
  formatBRL,
  generateServicePDF,
  type PDFSection,
} from "@/app/portal/feature/servicos";

// ─── Options ─────────────────────────────────────────────────────────────────

const TIPOS_NOTURNO: { value: TipoTrabalhoNoturno; label: string }[] = [
  { value: "urbano", label: "Urbano (22h-5h)" },
  { value: "rural_pecuaria", label: "Rural Pecuária (20h-4h)" },
  { value: "rural_lavoura", label: "Rural Lavoura (21h-5h)" },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AdicionalNoturnoPag() {
  // Currency inputs
  const [salarioRaw, setSalarioRaw] = useState("");
  const [salarioBruto, setSalarioBruto] = useState(0);

  // Number inputs
  const [horasRaw, setHorasRaw] = useState("");
  const [horasNoturnas, setHorasNoturnas] = useState(0);

  // Select
  const [tipo, setTipo] = useState<TipoTrabalhoNoturno>("urbano");

  // Reactive calculation
  const resultado: ResultadoAdicionalNoturno | null = useMemo(() => {
    if (salarioBruto <= 0 || horasNoturnas <= 0) return null;
    return calcularAdicionalNoturno({ salarioBruto, horasNoturnas, tipo });
  }, [salarioBruto, horasNoturnas, tipo]);

  // PDF download
  const handleDownloadPDF = useCallback(async () => {
    if (!resultado) return;

    const sections: PDFSection[] = [
      { label: "Salário Bruto", value: formatBRL(salarioBruto), type: "row" },
      { label: "Horas Noturnas", value: `${horasNoturnas} hrs`, type: "row" },
      { label: "Período Noturno", value: resultado.periodoNoturno, type: "row" },
      { label: "Resultados", value: "", type: "header" },
      { label: "Valor Hora Normal", value: formatBRL(resultado.valorHoraNormal), type: "row" },
      { label: "Valor Hora Noturna (+20%)", value: formatBRL(resultado.valorHoraNormal * 1.2), type: "row" },
    ];

    if (tipo === "urbano") {
      sections.push({ label: "Horas Fictas", value: `${resultado.horasFictas.toFixed(2)} hrs`, type: "row" });
    }

    sections.push({ label: "Total Adicional Noturno", value: formatBRL(resultado.totalAdicional), type: "total" });

    const disclaimer =
      "Este cálculo tem caráter meramente informativo e estimativo. Os valores exatos podem variar conforme convenções coletivas, acordos individuais e interpretações jurídicas. Consulte um advogado trabalhista para análise detalhada do seu caso.";

    const pdfBytes = await generateServicePDF({
      title: "Cálculo de Adicional Noturno",
      sections,
      disclaimer,
      date: new Date(),
    });

    const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "calculo-adicional-noturno.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }, [resultado, salarioBruto, horasNoturnas, tipo]);

  // Share
  const handleShare = useCallback(async () => {
    if (!resultado) return;
    if (navigator.share) {
      await navigator.share({
        title: "Cálculo de Adicional Noturno",
        text: `Total Adicional Noturno estimado: ${formatBRL(resultado.totalAdicional)}`,
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

          {/* Horas Noturnas */}
          <NumberInput
            label="Horas Noturnas Trabalhadas"
            value={horasRaw}
            onChange={(raw, parsed) => {
              setHorasRaw(raw);
              setHorasNoturnas(Math.max(0, parsed));
            }}
            placeholder="0"
            suffix="hrs"
          />

          {/* Tipo de Trabalho Noturno */}
          <SelectOption
            label="Tipo"
            options={TIPOS_NOTURNO}
            value={tipo}
            onChange={(v) => setTipo(v as TipoTrabalhoNoturno)}
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
                <ResultRow
                  label="Valor Hora Normal"
                  value={resultado ? formatBRL(resultado.valorHoraNormal) : "--"}
                  dimmed={!resultado}
                />
                <ResultRow
                  label="Valor Hora Noturna (+20%)"
                  value={resultado ? formatBRL(resultado.valorHoraNormal * 1.2) : "--"}
                  dimmed={!resultado}
                />

                {/* Horas Fictas — only for urbano */}
                {tipo === "urbano" && (
                  <ResultRow
                    label="Horas Fictas (52min30s)"
                    value={resultado ? `${resultado.horasFictas.toFixed(2)} hrs` : "--"}
                    dimmed={!resultado}
                  />
                )}

                {/* Separator */}
                <div className="border-t border-border mt-2" />
              </div>

              {/* Total Adicional highlight */}
              <div className="mt-6 pt-4 relative z-10">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Total Adicional
                  </span>
                  <span className="text-3xl font-black text-primary font-headline tabular-nums">
                    {resultado ? formatBRL(resultado.totalAdicional) : formatBRL(0)}
                  </span>
                </div>
              </div>

              {/* Periodo Noturno card */}
              {resultado && (
                <div className="mt-4 relative z-10">
                  <div className="rounded-lg bg-muted px-4 py-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      Período Noturno
                    </span>
                    <span className="text-sm font-semibold text-foreground font-mono">
                      {resultado.periodoNoturno}
                    </span>
                  </div>
                </div>
              )}

              {/* Formula card */}
              <div className="mt-4 relative z-10">
                <div className="rounded-lg bg-muted/50 border border-border px-4 py-3 space-y-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest block mb-2">
                    Fórmulas Aplicadas
                  </span>
                  <div className="text-xs text-muted-foreground font-mono space-y-1">
                    <div>Hora Normal = Salário / 220</div>
                    <div>Hora Noturna = Hora Normal × 1,20</div>
                    {tipo === "urbano" && (
                      <div>Horas Fictas = Horas Reais × (60 / 52,5)</div>
                    )}
                    {tipo === "urbano" ? (
                      <div>Total = Horas Fictas × Hora Normal × 0,20</div>
                    ) : (
                      <div>Total = Horas Reais × Hora Normal × 0,20</div>
                    )}
                  </div>
                  {tipo !== "urbano" && (
                    <p className="text-[10px] text-muted-foreground/60 pt-1 border-t border-border mt-2">
                      * Trabalhadores rurais não possuem redução da hora noturna (hora ficta). O cômputo é feito com as horas reais trabalhadas.
                    </p>
                  )}
                </div>
              </div>

              {/* Disclaimer */}
              <Disclaimer
                text="*Estimativa baseada na legislação CLT vigente (Art. 73 CLT). Valores exatos podem variar conforme convenções coletivas, acordos individuais e interpretações jurídicas. Consulte um advogado trabalhista para análise do seu caso."
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
