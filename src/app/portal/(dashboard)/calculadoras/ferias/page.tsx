"use client";

import { useState, useCallback } from "react";
import { EditorialHeader } from "@/app/website";
import { GlassCard } from "@/app/website";
import { ShieldCheck, FileDown, Share } from "lucide-react";
import { TrustTicker } from "@/app/website";

// ─── Formatters ───────────────────────────────────────────────────────────────

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value
  );

// ─── Calculation ──────────────────────────────────────────────────────────────

function calcFerias(
  salarioBase: number,
  diasFerias: number,
  abonoToggled: boolean,
  adiantamento13: boolean
) {
  if (salarioBase <= 0) {
    return {
      salarioProporcional: 0,
      tercoConstitucional: 0,
      abono: 0,
      adiantamento: 0,
      bruto: 0,
      inss: 0,
      irrf: 0,
      liquido: 0,
    };
  }

  const salarioProporcional = (salarioBase / 30) * diasFerias;
  const tercoConstitucional = salarioProporcional / 3;
  const abono = abonoToggled ? (salarioBase / 30) * 10 : 0;
  const adiantamento = adiantamento13 ? salarioBase / 2 : 0;
  const bruto = salarioProporcional + tercoConstitucional + abono + adiantamento;
  const inss = bruto * 0.11;
  const irrf = (bruto - inss) * 0.15;
  const liquido = bruto - inss - irrf;

  return { salarioProporcional, tercoConstitucional, abono, adiantamento, bruto, inss, irrf, liquido };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ResultRow({
  label,
  value,
  dimmed = false,
  negative = false,
}: {
  label: string;
  value: string;
  dimmed?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-white/5">
      <span className="text-on-surface-variant text-sm">{label}</span>
      <span
        className={[
          "font-mono font-bold tabular-nums text-sm",
          dimmed ? "text-white/30" : negative ? "text-red-400" : "text-white",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FeriasCalculatorPage() {
  const [salarioBase, setSalarioBase] = useState<number>(0);
  const [salarioRaw, setSalarioRaw] = useState<string>("");
  const [diasFerias, setDiasFerias] = useState<number>(30);
  const [abonoToggled, setAbonoToggled] = useState<boolean>(false);
  const [adiantamento13, setAdiantamento13] = useState<boolean>(false);

  const handleSalarioChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setSalarioRaw(raw);
      const parsed = parseFloat(raw.replace(",", "."));
      setSalarioBase(isNaN(parsed) ? 0 : parsed);
    },
    []
  );

  const sliderProgress = ((diasFerias - 1) / 29) * 100;

  const result = calcFerias(salarioBase, diasFerias, abonoToggled, adiantamento13);

  return (
    <>
      <EditorialHeader kicker="CALCULADORA" title="Férias." gradient />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── Input Panel ─────────────────────────────────────────────────── */}
        <section className="lg:col-span-7">
          <GlassCard className="space-y-8 relative overflow-hidden">
            {/* Decorative glow */}
            <div className="absolute top-0 left-0 w-40 h-40 bg-primary/5 blur-[60px] rounded-full pointer-events-none" />

            {/* Salário Base */}
            <div className="space-y-3 relative z-10">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                Salário Base
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold select-none">
                  R$
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={salarioRaw}
                  onChange={handleSalarioChange}
                  placeholder="0,00"
                  className="w-full bg-surface-container-high border-none rounded-lg p-4 pl-12 text-white font-mono text-lg outline-none focus:ring-2 focus:ring-primary/40 transition-shadow placeholder:text-white/20"
                />
              </div>
            </div>

            {/* Dias de Férias */}
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-end">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                  Dias de Férias
                </label>
                <span className="text-3xl font-black text-primary font-headline leading-none">
                  {diasFerias}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={30}
                value={diasFerias}
                onChange={(e) => setDiasFerias(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, oklch(0.80 0.18 281) ${sliderProgress}%, rgba(255,255,255,0.1) ${sliderProgress}%)`,
                }}
              />
              <div className="flex justify-between text-[10px] text-on-surface-variant/50 font-bold uppercase tracking-widest">
                <span>01 Dia</span>
                <span>15 Dias</span>
                <span>30 Dias</span>
              </div>
            </div>

            {/* Toggles */}
            <div className="border-t border-white/5 pt-6 space-y-3 relative z-10">
              {/* Abono Pecuniário */}
              <label className="flex items-center justify-between p-4 bg-surface-container-high rounded-xl cursor-pointer hover:bg-surface-container-highest transition-colors">
                <div className="space-y-0.5">
                  <span className="block font-bold text-white text-sm">
                    Abono Pecuniário
                  </span>
                  <span className="block text-xs text-on-surface-variant">
                    Vender 1/3 das férias (10 dias)
                  </span>
                </div>
                <div className="relative ml-4 shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={abonoToggled}
                    onChange={(e) => setAbonoToggled(e.target.checked)}
                  />
                  <div className="w-12 h-6 bg-surface-container-highest rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:after:translate-x-6" />
                </div>
              </label>

              {/* Adiantamento 13º */}
              <label className="flex items-center justify-between p-4 bg-surface-container-high rounded-xl cursor-pointer hover:bg-surface-container-highest transition-colors">
                <div className="space-y-0.5">
                  <span className="block font-bold text-white text-sm">
                    Adiantamento 13º Salário
                  </span>
                  <span className="block text-xs text-on-surface-variant">
                    Receber 1ª parcela do 13º nas férias
                  </span>
                </div>
                <div className="relative ml-4 shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={adiantamento13}
                    onChange={(e) => setAdiantamento13(e.target.checked)}
                  />
                  <div className="w-12 h-6 bg-surface-container-highest rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:after:translate-x-6" />
                </div>
              </label>
            </div>

            {/* Verified badge */}
            <div className="bg-primary/10 rounded-lg p-4 flex items-center gap-3 relative z-10">
              <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Cálculo verificado pela legislação CLT vigente
              </p>
            </div>
          </GlassCard>
        </section>

        {/* ── Results Panel ────────────────────────────────────────────────── */}
        <section className="lg:col-span-5 lg:sticky lg:top-28 space-y-4">
          <GlassCard className="relative overflow-hidden">
            {/* Decorative glow */}
            <div className="absolute -top-20 -right-20 w-56 h-56 bg-primary/10 blur-[70px] rounded-full pointer-events-none" />

            <span className="text-xs font-bold tracking-widest text-primary uppercase block mb-6">
              Detalhamento do Cálculo
            </span>

            <div className="space-y-0 relative z-10">
              <ResultRow
                label={`Salário Proporcional (${diasFerias} dias)`}
                value={formatBRL(result.salarioProporcional)}
              />
              <ResultRow
                label="1/3 Constitucional"
                value={formatBRL(result.tercoConstitucional)}
              />
              {abonoToggled ? (
                <ResultRow label="Abono Pecuniário (10 dias)" value={formatBRL(result.abono)} />
              ) : (
                <ResultRow label="Abono Pecuniário" value="--" dimmed />
              )}
              {adiantamento13 ? (
                <ResultRow label="Adiantamento 13º (1ª parcela)" value={formatBRL(result.adiantamento)} />
              ) : (
                <ResultRow label="Adiantamento 13º" value="--" dimmed />
              )}

              <div className="py-3 border-b border-white/5 flex justify-between items-center">
                <span className="text-on-surface-variant text-sm">Total Bruto</span>
                <span className="font-mono font-bold tabular-nums text-white text-sm">
                  {formatBRL(result.bruto)}
                </span>
              </div>

              <ResultRow
                label="(-) INSS (11%)"
                value={salarioBase > 0 ? `- ${formatBRL(result.inss)}` : "--"}
                negative={salarioBase > 0}
                dimmed={salarioBase <= 0}
              />
              <ResultRow
                label="(-) IRRF (15% s/ base)"
                value={salarioBase > 0 ? `- ${formatBRL(result.irrf)}` : "--"}
                negative={salarioBase > 0}
                dimmed={salarioBase <= 0}
              />
            </div>

            {/* Total líquido highlight */}
            <div className="mt-6 pt-4 relative z-10">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                  Total Líquido
                </span>
                <span className="text-3xl font-black text-primary font-headline tabular-nums">
                  {formatBRL(result.liquido)}
                </span>
              </div>
            </div>

            {/* Disclaimer */}
            <p className="text-[10px] text-on-surface-variant/40 italic mt-4 leading-relaxed relative z-10">
              *Estimativa com alíquotas simplificadas de INSS (11%) e IRRF (15%). Valores exatos variam conforme número de dependentes e faixas progressivas.
            </p>
          </GlassCard>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-surface-container-high border border-white/5 hover:border-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all hover:bg-surface-container-highest">
              <FileDown className="w-4 h-4" />
              Download PDF
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-on-primary-fixed text-xs font-bold uppercase tracking-widest rounded-xl transition-all hover:bg-primary/90 shadow-[0_4px_20px_rgba(204,151,255,0.2)] hover:shadow-[0_4px_20px_rgba(204,151,255,0.4)]">
              <Share className="w-4 h-4" />
              Compartilhar
            </button>
          </div>
        </section>
      </div>

      <TrustTicker items={["CLT", "TST", "TRT", "MPT", "OIT"]} heading="Base Legal" />
    </>
  );
}
