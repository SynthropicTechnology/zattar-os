"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  calcularSimuladorAcao,
  type VerbaAcao,
  type VerbaSimulacao,
  type ResultadoSimuladorAcao,
  type GravidadeDanoMoral,
  type GrauInsalubridade,
  LABELS_VERBAS,
  SALARIO_MINIMO_2026,
  INSALUBRIDADE_PERCENTUAIS,
  PERICULOSIDADE_PERCENTUAL,
  CalculatorShell,
  CurrencyInput,
  NumberInput,
  RangeInput,
  SelectOption,
  ResultRow,
  ActionButtons,
  VerifiedBadge,
  CtaZattar,
  Disclaimer,
  formatBRL,
  generateServicePDF,
  type PDFSection,
} from "@/app/portal/feature/servicos";

// ─── Verbas grid data ───────────────────────────────────────────────────────

const VERBAS_GRID: { value: VerbaAcao; label: string }[] = [
  { value: "horas_extras", label: "Horas Extras Nao Pagas" },
  { value: "intervalo_suprimido", label: "Intervalo Intrajornada Suprimido" },
  { value: "adicional_noturno", label: "Adicional Noturno Nao Pago" },
  { value: "insalubridade", label: "Adicional de Insalubridade" },
  { value: "periculosidade", label: "Adicional de Periculosidade" },
  { value: "fgts_nao_depositado", label: "FGTS Nao Depositado + Multa 40%" },
  { value: "ferias_nao_gozadas", label: "Ferias Nao Gozadas (dobradas)" },
  { value: "decimo_terceiro", label: "13o Salario Nao Pago" },
  { value: "dano_moral", label: "Dano Moral" },
  { value: "desvio_funcao", label: "Diferenca Salarial (Desvio de Funcao)" },
];

const GRAUS_INSALUBRIDADE: { value: GrauInsalubridade; label: string }[] = [
  { value: "minimo", label: "Minimo" },
  { value: "medio", label: "Medio" },
  { value: "maximo", label: "Maximo" },
];

const GRAVIDADES_DANO: { value: GravidadeDanoMoral; label: string }[] = [
  { value: "leve", label: "Leve (3x)" },
  { value: "medio", label: "Medio (5x)" },
  { value: "grave", label: "Grave (20x)" },
  { value: "gravissimo", label: "Gravissimo (50x)" },
];

// ─── Page ───────────────────────────────────────────────────────────────────

export default function SimuladorAcaoPage() {
  // Base inputs
  const [salarioRaw, setSalarioRaw] = useState("");
  const [salarioBruto, setSalarioBruto] = useState(0);
  const [tempoServico, setTempoServico] = useState(24);

  // Multi-select verbas
  const [verbasSelected, setVerbasSelected] = useState<Set<VerbaAcao>>(new Set());

  // Conditional fields
  const [horasExtrasRaw, setHorasExtrasRaw] = useState("");
  const [horasExtras, setHorasExtras] = useState(0);

  const [minSuprimidosRaw, setMinSuprimidosRaw] = useState("");
  const [minSuprimidos, setMinSuprimidos] = useState(0);

  const [horasNoturnasRaw, setHorasNoturnasRaw] = useState("");
  const [horasNoturnas, setHorasNoturnas] = useState(0);

  const [grauInsalubridade, setGrauInsalubridade] = useState<GrauInsalubridade>("minimo");

  const [mesesFGTSRaw, setMesesFGTSRaw] = useState("");
  const [mesesFGTS, setMesesFGTS] = useState(0);

  const [periodosFerias, setPeriodosFeriasRaw] = useState("");
  const [periodosF, setPeriodosF] = useState(0);

  const [meses13Raw, setMeses13Raw] = useState("");
  const [meses13, setMeses13] = useState(0);

  const [gravidadeDano, setGravidadeDano] = useState<GravidadeDanoMoral>("medio");

  const [salarioFuncaoRaw, setSalarioFuncaoRaw] = useState("");
  const [salarioFuncao, setSalarioFuncao] = useState(0);

  // Toggle verba selection
  const toggleVerba = useCallback((verba: VerbaAcao) => {
    setVerbasSelected((prev) => {
      const next = new Set(prev);
      if (next.has(verba)) {
        next.delete(verba);
      } else {
        next.add(verba);
      }
      return next;
    });
  }, []);

  // Build verbas array for calculation
  const meses = tempoServico;
  const valorHora = salarioBruto > 0 ? salarioBruto / 220 : 0;

  const resultado: ResultadoSimuladorAcao | null = useMemo(() => {
    if (salarioBruto <= 0 || verbasSelected.size === 0) return null;

    const verbas: VerbaSimulacao[] = [];

    for (const tipo of verbasSelected) {
      switch (tipo) {
        case "horas_extras": {
          const valorMensal = horasExtras * valorHora * 1.5;
          verbas.push({ tipo, valorMensal, meses });
          break;
        }
        case "intervalo_suprimido": {
          const valorMensal = (minSuprimidos / 60) * valorHora * 1.5;
          verbas.push({ tipo, valorMensal, meses });
          break;
        }
        case "adicional_noturno": {
          const valorMensal = horasNoturnas * valorHora * 0.2;
          verbas.push({ tipo, valorMensal, meses });
          break;
        }
        case "insalubridade": {
          const valorMensal = SALARIO_MINIMO_2026 * INSALUBRIDADE_PERCENTUAIS[grauInsalubridade];
          verbas.push({ tipo, valorMensal, meses });
          break;
        }
        case "periculosidade": {
          const valorMensal = salarioBruto * PERICULOSIDADE_PERCENTUAL;
          verbas.push({ tipo, valorMensal, meses });
          break;
        }
        case "fgts_nao_depositado": {
          verbas.push({ tipo, valorMensal: 0, meses: mesesFGTS || meses });
          break;
        }
        case "ferias_nao_gozadas": {
          verbas.push({ tipo, valorMensal: 0, meses: periodosF || 1 });
          break;
        }
        case "decimo_terceiro": {
          verbas.push({ tipo, valorMensal: salarioBruto / 12, meses: meses13 || 1 });
          break;
        }
        case "dano_moral": {
          verbas.push({ tipo, valorMensal: 0, meses: 1, gravidade: gravidadeDano });
          break;
        }
        case "desvio_funcao": {
          const diff = Math.max(0, salarioFuncao - salarioBruto);
          verbas.push({ tipo, valorMensal: diff, meses });
          break;
        }
      }
    }

    return calcularSimuladorAcao({ salarioBruto, verbas });
  }, [
    salarioBruto,
    verbasSelected,
    meses,
    valorHora,
    horasExtras,
    minSuprimidos,
    horasNoturnas,
    grauInsalubridade,
    mesesFGTS,
    periodosF,
    meses13,
    gravidadeDano,
    salarioFuncao,
  ]);

  // PDF download
  const handleDownloadPDF = useCallback(async () => {
    if (!resultado) return;

    const sections: PDFSection[] = [];
    sections.push({ label: "Verbas Pleiteadas", value: "", type: "header" });

    for (const v of resultado.verbas) {
      sections.push({ label: v.label, value: formatBRL(v.valorBase), type: "row" });
      const totalReflexos = v.totalComReflexos - v.valorBase;
      if (totalReflexos > 0) {
        sections.push({ label: `  Reflexos`, value: formatBRL(totalReflexos), type: "row" });
      }
    }

    sections.push({ label: "Total Verbas", value: formatBRL(resultado.totalBase), type: "total" });
    sections.push({ label: "Total Reflexos", value: formatBRL(resultado.totalReflexos), type: "total" });

    sections.push({ label: "Cenarios", value: "", type: "header" });
    for (const c of resultado.cenarios) {
      sections.push({ label: c.nome, value: formatBRL(c.total), type: "total" });
    }

    const disclaimer =
      "Valores estimados com base na legislacao vigente. Resultados reais dependem de analise judicial, provas e circunstancias do caso.";

    const pdfBytes = await generateServicePDF({
      title: "Simulador de Acao Trabalhista",
      sections,
      disclaimer,
      date: new Date(),
    });

    const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "simulador-acao-trabalhista.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }, [resultado]);

  // Share
  const handleShare = useCallback(async () => {
    if (!resultado) return;
    const moderado = resultado.cenarios[1]?.total ?? 0;
    if (navigator.share) {
      await navigator.share({
        title: "Simulador de Acao Trabalhista",
        text: `Estimativa moderada: ${formatBRL(moderado)}`,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  }, [resultado]);

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <CalculatorShell
      inputPanel={
        <>
          {/* Salario Bruto */}
          <CurrencyInput
            label="Salario Bruto"
            value={salarioRaw}
            onChange={(raw, parsed) => {
              setSalarioRaw(raw);
              setSalarioBruto(parsed);
            }}
          />

          {/* Tempo de Servico */}
          <RangeInput
            label="Tempo de Servico"
            value={tempoServico}
            onChange={setTempoServico}
            min={1}
            max={360}
            unit="meses"
            labels={["1 Mes", "15 Anos", "30 Anos"]}
          />

          {/* Multi-select Verbas */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Verbas Pleiteadas
            </label>
            <div className="grid grid-cols-2 gap-2">
              {VERBAS_GRID.map((item) => {
                const selected = verbasSelected.has(item.value);
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => toggleVerba(item.value)}
                    className={cn(
                      "relative flex items-start gap-2.5 rounded-xl border p-3 text-left transition-all text-xs leading-snug",
                      selected
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-muted/50 text-muted-foreground hover:border-primary/40 hover:bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30 bg-transparent"
                      )}
                    >
                      {selected && <Check className="h-3 w-3" />}
                    </span>
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conditional fields */}
          {verbasSelected.has("horas_extras") && (
            <NumberInput
              label="Horas Extras Mensais"
              value={horasExtrasRaw}
              onChange={(raw, parsed) => {
                setHorasExtrasRaw(raw);
                setHorasExtras(Math.max(0, parsed));
              }}
              placeholder="0"
              suffix="hrs"
            />
          )}

          {verbasSelected.has("intervalo_suprimido") && (
            <NumberInput
              label="Minutos Suprimidos do Intervalo"
              value={minSuprimidosRaw}
              onChange={(raw, parsed) => {
                setMinSuprimidosRaw(raw);
                setMinSuprimidos(Math.max(0, parsed));
              }}
              placeholder="0"
              suffix="min"
            />
          )}

          {verbasSelected.has("adicional_noturno") && (
            <NumberInput
              label="Horas Noturnas Mensais"
              value={horasNoturnasRaw}
              onChange={(raw, parsed) => {
                setHorasNoturnasRaw(raw);
                setHorasNoturnas(Math.max(0, parsed));
              }}
              placeholder="0"
              suffix="hrs"
            />
          )}

          {verbasSelected.has("insalubridade") && (
            <SelectOption
              label="Grau"
              options={GRAUS_INSALUBRIDADE}
              value={grauInsalubridade}
              onChange={(v) => setGrauInsalubridade(v as GrauInsalubridade)}
            />
          )}

          {verbasSelected.has("fgts_nao_depositado") && (
            <NumberInput
              label="Meses sem Deposito"
              value={mesesFGTSRaw}
              onChange={(raw, parsed) => {
                setMesesFGTSRaw(raw);
                setMesesFGTS(Math.max(0, Math.floor(parsed)));
              }}
              placeholder="0"
              suffix="meses"
            />
          )}

          {verbasSelected.has("ferias_nao_gozadas") && (
            <NumberInput
              label="Periodos de Ferias"
              value={periodosFerias}
              onChange={(raw, parsed) => {
                setPeriodosFeriasRaw(raw);
                setPeriodosF(Math.max(0, Math.floor(parsed)));
              }}
              placeholder="0"
              suffix="periodos"
            />
          )}

          {verbasSelected.has("decimo_terceiro") && (
            <NumberInput
              label="Meses sem 13o"
              value={meses13Raw}
              onChange={(raw, parsed) => {
                setMeses13Raw(raw);
                setMeses13(Math.max(0, Math.floor(parsed)));
              }}
              placeholder="0"
              suffix="meses"
            />
          )}

          {verbasSelected.has("dano_moral") && (
            <SelectOption
              label="Gravidade"
              options={GRAVIDADES_DANO}
              value={gravidadeDano}
              onChange={(v) => setGravidadeDano(v as GravidadeDanoMoral)}
            />
          )}

          {verbasSelected.has("desvio_funcao") && (
            <CurrencyInput
              label="Salario da Funcao Real"
              value={salarioFuncaoRaw}
              onChange={(raw, parsed) => {
                setSalarioFuncaoRaw(raw);
                setSalarioFuncao(parsed);
              }}
            />
          )}

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
                Verbas Pleiteadas
              </span>

              <div className="space-y-0 relative z-10">
                {/* Verba rows */}
                {resultado && resultado.verbas.length > 0 ? (
                  resultado.verbas.map((v) => {
                    const reflexos = v.totalComReflexos - v.valorBase;
                    return (
                      <div key={v.tipo}>
                        <ResultRow
                          label={v.label}
                          value={formatBRL(v.valorBase)}
                          dimmed={v.valorBase === 0}
                        />
                        {reflexos > 0 && (
                          <ResultRow
                            label="Reflexos"
                            value={formatBRL(reflexos)}
                            dimmed={false}
                          />
                        )}
                      </div>
                    );
                  })
                ) : (
                  <>
                    <ResultRow label="Selecione as verbas" value="--" dimmed />
                    <ResultRow label="para ver o calculo" value="--" dimmed />
                  </>
                )}

                {/* Separator + Totals */}
                <div className="border-t border-border mt-2" />
                <div className="py-3 flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Total Verbas</span>
                  <span className="font-mono font-bold tabular-nums text-foreground text-sm">
                    {resultado ? formatBRL(resultado.totalBase) : formatBRL(0)}
                  </span>
                </div>
                <div className="py-1 flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Total Reflexos</span>
                  <span className="font-mono font-bold tabular-nums text-foreground text-sm">
                    {resultado ? formatBRL(resultado.totalReflexos) : formatBRL(0)}
                  </span>
                </div>

                {/* Separator */}
                <div className="border-t border-border mt-2" />
              </div>

              {/* 3 Scenario Cards */}
              <div className="grid grid-cols-3 gap-3 mt-6 relative z-10">
                <div className="bg-muted rounded-xl p-4 text-center">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">
                    Conservador
                  </span>
                  <span className="text-xl font-black text-foreground font-headline tabular-nums">
                    {resultado ? formatBRL(resultado.cenarios[0].total) : formatBRL(0)}
                  </span>
                  <span className="text-[10px] text-muted-foreground/50 block mt-1">-20%</span>
                </div>
                <div className="bg-primary/10 rounded-xl p-4 text-center border border-primary/20">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest block mb-2">
                    Moderado
                  </span>
                  <span className="text-xl font-black text-primary font-headline tabular-nums">
                    {resultado ? formatBRL(resultado.cenarios[1].total) : formatBRL(0)}
                  </span>
                </div>
                <div className="bg-muted rounded-xl p-4 text-center">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">
                    Otimista
                  </span>
                  <span className="text-xl font-black text-foreground font-headline tabular-nums">
                    {resultado ? formatBRL(resultado.cenarios[2].total) : formatBRL(0)}
                  </span>
                  <span className="text-[10px] text-muted-foreground/50 block mt-1">+20%</span>
                </div>
              </div>

              {/* Disclaimer */}
              <Disclaimer text="Valores estimados com base na legislacao vigente. Resultados reais dependem de analise judicial, provas e circunstancias do caso." />
            </CardContent>
          </Card>

          {/* CTA */}
          <CtaZattar
            title="Avalie seu caso com a Zattar"
            description="Agende uma consulta gratuita com a Zattar para avaliar seu caso."
          />

          {/* Action buttons */}
          <ActionButtons onDownloadPDF={handleDownloadPDF} onShare={handleShare} />
        </>
      }
    />
  );
}
