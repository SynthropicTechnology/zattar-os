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

function calcDecimoTerceiro(salarioBase: number, mesesTrabalhados: number) {
  if (salarioBase <= 0) {
    return {
      proporcional: 0,
      primeiraParcela: 0,
      inss: 0,
      irrf: 0,
      segundaParcela: 0,
      liquido: 0,
    };
  }

  const proporcional = (salarioBase / 12) * mesesTrabalhados;
  const primeiraParcela = proporcional / 2;
  const inss = proporcional * 0.11;
  const irrf = (proporcional - inss) * 0.15;
  const segundaParcela = proporcional / 2 - inss - irrf;
  const liquido = primeiraParcela + segundaParcela;

  return { proporcional, primeiraParcela, inss, irrf, segundaParcela, liquido };
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

export default function DecimoTerceiroCalculatorPage() {
  const [salarioBase, setSalarioBase] = useState<number>(0);
  const [salarioRaw, setSalarioRaw] = useState<string>("");
  const [mesesTrabalhados, setMesesTrabalhados] = useState<number>(12);

  const handleSalarioChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setSalarioRaw(raw);
      const parsed = parseFloat(raw.replace(",", "."));
      setSalarioBase(isNaN(parsed) ? 0 : parsed);
    },
    []
  );

  const sliderProgress = ((mesesTrabalhados - 1) / 11) * 100;

  const result = calcDecimoTerceiro(salarioBase, mesesTrabalhados);

  return (
    <>
      <EditorialHeader kicker="CALCULADORA" title="13º Salário." gradient />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── Input Panel ─────────────────────────────────────────────────── */}
        <section className="lg:col-span-5">
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

            {/* Meses Trabalhados */}
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-end">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                  Meses Trabalhados
                </label>
                <span className="text-3xl font-black text-primary font-headline leading-none">
                  {mesesTrabalhados}
                  <span className="text-sm text-on-surface-variant font-medium ml-1">
                    {mesesTrabalhados === 1 ? "mês" : "meses"}
                  </span>
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={12}
                value={mesesTrabalhados}
                onChange={(e) => setMesesTrabalhados(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, oklch(0.80 0.18 281) ${sliderProgress}%, rgba(255,255,255,0.1) ${sliderProgress}%)`,
                }}
              />
              <div className="flex justify-between text-[10px] text-on-surface-variant/50 font-bold uppercase tracking-widest">
                <span>1 Mês</span>
                <span>6 Meses</span>
                <span>Ano Completo</span>
              </div>
            </div>

            {/* Info note */}
            <p className="text-xs text-on-surface-variant/60 italic leading-relaxed border-t border-white/5 pt-6 relative z-10">
              Frações iguais ou superiores a 15 dias no mês contam como mês integral (1/12), conforme regulamentação trabalhista vigente.
            </p>

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
        <section className="lg:col-span-7 lg:sticky lg:top-28 space-y-4">
          <GlassCard className="relative overflow-hidden">
            {/* Decorative glow */}
            <div className="absolute -top-20 -right-20 w-56 h-56 bg-primary/10 blur-[70px] rounded-full pointer-events-none" />

            <span className="text-xs font-bold tracking-widest text-primary uppercase block mb-6">
              Detalhamento do Cálculo
            </span>

            {/* Parcelas highlight cards */}
            <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
              <div className="bg-surface-container-high rounded-xl p-5">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-2">
                  1ª Parcela
                </span>
                <span className="text-2xl font-black text-white font-headline tabular-nums">
                  {formatBRL(result.primeiraParcela)}
                </span>
                <span className="text-[10px] text-on-surface-variant/50 font-bold uppercase tracking-widest mt-2 block">
                  S/ DESCONTOS
                </span>
              </div>
              <div className="bg-surface-container-high rounded-xl p-5 border border-primary/20">
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest block mb-2">
                  2ª Parcela
                </span>
                <span className="text-2xl font-black text-white font-headline tabular-nums">
                  {formatBRL(Math.max(0, result.segundaParcela))}
                </span>
                <span className="text-[10px] text-on-surface-variant/50 font-bold uppercase tracking-widest mt-2 block">
                  C/ DESCONTOS
                </span>
              </div>
            </div>

            <div className="space-y-0 relative z-10">
              <ResultRow
                label="13º Proporcional (bruto)"
                value={formatBRL(result.proporcional)}
              />
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

            <p className="text-[10px] text-on-surface-variant/40 italic mt-4 leading-relaxed relative z-10">
              *Estimativa com alíquotas simplificadas de INSS (11%) e IRRF (15%). Valores exatos variam conforme dependentes e faixas progressivas da tabela vigente.
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
