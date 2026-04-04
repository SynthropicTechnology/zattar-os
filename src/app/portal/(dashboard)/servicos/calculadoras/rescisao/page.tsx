"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  calcularRescisao,
  type TipoRescisao,
  type TipoAvisoPrevio,
  type ResultadoRescisao,
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
  generateServicePDF,
  type PDFSection,
} from "@/app/portal/feature/servicos";

// ─── Options ─────────────────────────────────────────────────────────────────

const TIPOS_RESCISAO: { value: TipoRescisao; label: string }[] = [
  { value: "sem_justa_causa", label: "Demissão sem Justa Causa" },
  { value: "pedido_demissao", label: "Pedido de Demissão" },
  { value: "justa_causa", label: "Demissão por Justa Causa" },
  { value: "consensual", label: "Rescisão Consensual" },
  { value: "indireta", label: "Rescisão Indireta" },
  { value: "termino_contrato", label: "Término de Contrato" },
];

const TIPOS_AVISO: { value: TipoAvisoPrevio; label: string }[] = [
  { value: "trabalhado", label: "Trabalhado" },
  { value: "indenizado", label: "Indenizado" },
  { value: "dispensado", label: "Dispensado" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function diasNoMes(dateStr: string): number {
  if (!dateStr) return 0;
  const d = new Date(dateStr + "T00:00:00");
  return d.getDate();
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function RescisaoCalculatorPage() {
  // Currency inputs — dual state (raw string + parsed number)
  const [salarioRaw, setSalarioRaw] = useState("");
  const [salarioBruto, setSalarioBruto] = useState(0);

  const [saldoFGTSRaw, setSaldoFGTSRaw] = useState("");
  const [saldoFGTS, setSaldoFGTS] = useState(0);

  const [mediaHERaw, setMediaHERaw] = useState("");
  const [mediaHE, setMediaHE] = useState(0);

  // Number input
  const [dependentesRaw, setDependentesRaw] = useState("");
  const [dependentes, setDependentes] = useState(0);

  // Selects
  const [tipoRescisao, setTipoRescisao] = useState<TipoRescisao>("sem_justa_causa");
  const [avisoPrevio, setAvisoPrevio] = useState<TipoAvisoPrevio>("indenizado");

  // Dates
  const [dataAdmissao, setDataAdmissao] = useState("");
  const [dataDemissao, setDataDemissao] = useState("");

  // Toggle
  const [feriasVencidas, setFeriasVencidas] = useState(false);

  // Reactive calculation
  const resultado: ResultadoRescisao | null = useMemo(() => {
    if (salarioBruto <= 0 || !dataAdmissao || !dataDemissao) return null;

    const admissao = new Date(dataAdmissao + "T00:00:00");
    const demissao = new Date(dataDemissao + "T00:00:00");

    if (isNaN(admissao.getTime()) || isNaN(demissao.getTime())) return null;
    if (demissao <= admissao) return null;

    return calcularRescisao({
      salarioBruto: salarioBruto + mediaHE,
      tipo: tipoRescisao,
      avisoPrevio,
      dataAdmissao: admissao,
      dataDemissao: demissao,
      diasTrabalhados: diasNoMes(dataDemissao),
      saldoFGTS,
      feriasVencidas,
      dependentes,
    });
  }, [salarioBruto, mediaHE, tipoRescisao, avisoPrevio, dataAdmissao, dataDemissao, saldoFGTS, feriasVencidas, dependentes]);

  // PDF download
  const handleDownloadPDF = useCallback(async () => {
    if (!resultado) return;

    const sections: PDFSection[] = [];

    // Proventos header
    sections.push({ label: "Proventos", value: "", type: "header" });
    for (const verba of resultado.verbas) {
      if (verba.tipo === "provento") {
        sections.push({ label: verba.label, value: formatBRL(verba.valor), type: "row" });
      }
    }

    // Descontos header
    sections.push({ label: "Descontos", value: "", type: "header" });
    for (const verba of resultado.verbas) {
      if (verba.tipo === "desconto") {
        sections.push({ label: verba.label, value: `- ${formatBRL(verba.valor)}`, type: "deduction" });
      }
    }

    // Totals
    sections.push({ label: "Total Bruto", value: formatBRL(resultado.totalBruto), type: "total" });
    sections.push({ label: "Total Líquido", value: formatBRL(resultado.totalLiquido), type: "total" });

    const disclaimer =
      "Este cálculo tem caráter meramente informativo e estimativo. Os valores exatos podem variar conforme convenções coletivas, acordos individuais e interpretações jurídicas. Consulte um advogado trabalhista para análise detalhada do seu caso.";

    const pdfBytes = await generateServicePDF({
      title: "Cálculo de Rescisão Trabalhista",
      sections,
      disclaimer,
      date: new Date(),
    });

    const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "calculo-rescisao-trabalhista.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }, [resultado]);

  // Share
  const handleShare = useCallback(async () => {
    if (!resultado) return;
    if (navigator.share) {
      await navigator.share({
        title: "Cálculo de Rescisão Trabalhista",
        text: `Total Líquido estimado: ${formatBRL(resultado.totalLiquido)}`,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  }, [resultado]);

  // ─── Render ──────────────────────────────────────────────────────────────

  const proventos = resultado?.verbas.filter((v) => v.tipo === "provento") ?? [];
  const descontos = resultado?.verbas.filter((v) => v.tipo === "desconto") ?? [];

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

          {/* Tipo de Rescisão */}
          <SelectOption
            label="Tipo de Rescisão"
            options={TIPOS_RESCISAO}
            value={tipoRescisao}
            onChange={(v) => setTipoRescisao(v as TipoRescisao)}
          />

          {/* Aviso Prévio */}
          <SelectOption
            label="Aviso Prévio"
            options={TIPOS_AVISO}
            value={avisoPrevio}
            onChange={(v) => setAvisoPrevio(v as TipoAvisoPrevio)}
          />

          {/* Data de Admissão */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Data de Admissão
            </label>
            <input
              type="date"
              value={dataAdmissao}
              onChange={(e) => setDataAdmissao(e.target.value)}
              className="w-full bg-muted border-none rounded-lg p-4 text-foreground font-mono text-lg outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>

          {/* Data de Rescisão */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Data de Rescisão
            </label>
            <input
              type="date"
              value={dataDemissao}
              onChange={(e) => setDataDemissao(e.target.value)}
              className="w-full bg-muted border-none rounded-lg p-4 text-foreground font-mono text-lg outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>

          {/* Saldo FGTS */}
          <CurrencyInput
            label="Saldo FGTS"
            value={saldoFGTSRaw}
            onChange={(raw, parsed) => {
              setSaldoFGTSRaw(raw);
              setSaldoFGTS(parsed);
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

          {/* Média Mensal Horas Extras */}
          <CurrencyInput
            label="Média Mensal Horas Extras"
            value={mediaHERaw}
            onChange={(raw, parsed) => {
              setMediaHERaw(raw);
              setMediaHE(parsed);
            }}
          />

          {/* Férias Vencidas */}
          <ToggleOption
            label="Possui Férias Vencidas?"
            description="Período aquisitivo completo sem gozo de férias"
            checked={feriasVencidas}
            onChange={setFeriasVencidas}
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
                {proventos.length > 0 && (
                  <>
                    <div className="py-2">
                      <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                        Proventos
                      </span>
                    </div>
                    {proventos.map((v) => (
                      <ResultRow
                        key={v.label}
                        label={v.label}
                        value={formatBRL(v.valor)}
                        dimmed={v.valor === 0}
                      />
                    ))}
                  </>
                )}

                {/* Descontos */}
                {descontos.length > 0 && (
                  <>
                    <div className="py-2 mt-2">
                      <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                        Descontos
                      </span>
                    </div>
                    {descontos.map((v) => (
                      <ResultRow
                        key={v.label}
                        label={v.label}
                        value={`- ${formatBRL(v.valor)}`}
                        negative
                      />
                    ))}
                  </>
                )}

                {/* No data state */}
                {!resultado && (
                  <>
                    <ResultRow label="Saldo de Salário" value="--" dimmed />
                    <ResultRow label="Aviso Prévio" value="--" dimmed />
                    <ResultRow label="13º Proporcional" value="--" dimmed />
                    <ResultRow label="Férias Proporcionais + 1/3" value="--" dimmed />
                    <ResultRow label="FGTS + Multa" value="--" dimmed />
                  </>
                )}

                {/* Separator + Total Bruto */}
                <div className="border-t border-border mt-2" />
                <div className="py-3 flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Total Bruto</span>
                  <span className="font-mono font-bold tabular-nums text-foreground text-sm">
                    {resultado ? formatBRL(resultado.totalBruto) : formatBRL(0)}
                  </span>
                </div>
              </div>

              {/* Total Líquido highlight */}
              <div className="mt-6 pt-4 relative z-10">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Total Líquido
                  </span>
                  <span className="text-3xl font-black text-primary font-headline tabular-nums">
                    {resultado ? formatBRL(resultado.totalLiquido) : formatBRL(0)}
                  </span>
                </div>
              </div>

              {/* Disclaimer */}
              <Disclaimer
                text="*Estimativa baseada na legislação CLT vigente. Valores exatos podem variar conforme convenções coletivas, acordos individuais e interpretações jurídicas. Consulte um advogado trabalhista para análise do seu caso."
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
