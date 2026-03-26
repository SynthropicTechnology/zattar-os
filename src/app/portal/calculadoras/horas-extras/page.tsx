"use client";

import { useState } from "react";
import { PortalShell } from "@/features/portal";
import { EditorialHeader } from "@/features/website";
import { GlassCard } from "@/features/website";
import { Calculator, ShieldCheck, FileDown, Share } from "lucide-react";
import { TrustTicker } from "@/features/website";

// ─── Formatters ───────────────────────────────────────────────────────────────

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value
  );

const formatBRLPrecise = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);

// ─── Calculation ──────────────────────────────────────────────────────────────

function calcHorasExtras(
  salarioBruto: number,
  horasMes: number,
  horasExtras: number,
  is100: boolean
) {
  if (salarioBruto <= 0 || horasMes <= 0) {
    return {
      valorHoraNormal: 0,
      valorHoraExtra: 0,
      totalHorasExtras: 0,
      dsr: 0,
      total: 0,
    };
  }

  const valorHoraNormal = salarioBruto / horasMes;
  const percentual = is100 ? 1.0 : 0.5;
  const valorHoraExtra = valorHoraNormal * (1 + percentual);
  const totalHorasExtras = valorHoraExtra * horasExtras;
  const dsr = totalHorasExtras / 6;
  const total = totalHorasExtras + dsr;

  return { valorHoraNormal, valorHoraExtra, totalHorasExtras, dsr, total };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ResultRow({
  label,
  value,
  dimmed = false,
}: {
  label: string;
  value: string;
  dimmed?: boolean;
}) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-white/5">
      <span className="text-on-surface-variant text-sm">{label}</span>
      <span
        className={[
          "font-mono font-bold tabular-nums text-sm",
          dimmed ? "text-white/30" : "text-white",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

function NumberInput({
  label,
  raw,
  onChange,
  placeholder,
  suffix,
  prefix,
}: {
  label: string;
  raw: string;
  onChange: (raw: string, parsed: number) => void;
  placeholder: string;
  suffix?: string;
  prefix?: string;
}) {
  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold select-none">
            {prefix}
          </span>
        )}
        <input
          type="number"
          inputMode="decimal"
          value={raw}
          placeholder={placeholder}
          onChange={(e) => {
            const r = e.target.value;
            const p = parseFloat(r.replace(",", "."));
            onChange(r, isNaN(p) ? 0 : p);
          }}
          className={[
            "w-full bg-surface-container-high border-none rounded-lg p-4 text-white font-mono text-lg outline-none focus:ring-2 focus:ring-primary/40 transition-shadow placeholder:text-white/20",
            prefix ? "pl-12" : "",
            suffix ? "pr-14" : "",
          ].join(" ")}
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-sm font-bold select-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HorasExtrasCalculatorPage() {
  const [salarioBruto, setSalarioBruto] = useState<number>(0);
  const [salarioRaw, setSalarioRaw] = useState<string>("");

  const [horasMes, setHorasMes] = useState<number>(220);
  const [horasMesRaw, setHorasMesRaw] = useState<string>("220");

  const [horasExtras, setHorasExtras] = useState<number>(0);
  const [horasExtrasRaw, setHorasExtrasRaw] = useState<string>("");

  const [is100, setIs100] = useState<boolean>(false);

  const result = calcHorasExtras(salarioBruto, horasMes, horasExtras, is100);

  return (
    <PortalShell>
      <EditorialHeader kicker="CALCULADORA" title="Horas Extras." gradient />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── Input Panel ─────────────────────────────────────────────────── */}
        <section className="lg:col-span-7">
          <GlassCard className="space-y-6 relative overflow-hidden">
            {/* Decorative glow */}
            <div className="absolute top-0 left-0 w-40 h-40 bg-primary/5 blur-[60px] rounded-full pointer-events-none" />

            <div className="relative z-10 space-y-6">
              {/* Salário Bruto */}
              <NumberInput
                label="Salário Bruto"
                raw={salarioRaw}
                placeholder="0,00"
                prefix="R$"
                onChange={(r, p) => { setSalarioRaw(r); setSalarioBruto(p); }}
              />

              {/* Horas / Mês */}
              <NumberInput
                label="Horas / Mês"
                raw={horasMesRaw}
                placeholder="220"
                suffix="hrs"
                onChange={(r, p) => { setHorasMesRaw(r); setHorasMes(p); }}
              />

              {/* Horas Extras Trabalhadas */}
              <NumberInput
                label="Horas Extras Trabalhadas"
                raw={horasExtrasRaw}
                placeholder="0"
                suffix="hrs"
                onChange={(r, p) => { setHorasExtrasRaw(r); setHorasExtras(p); }}
              />

              {/* Percentual toggle */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                  Adicional (Percentual)
                </label>
                <div className="flex gap-2 p-1 bg-surface-container-high rounded-xl">
                  <button
                    onClick={() => setIs100(false)}
                    className={[
                      "flex-1 py-3 rounded-lg font-bold text-sm transition-all",
                      !is100
                        ? "bg-primary text-on-primary-fixed shadow-md"
                        : "text-on-surface-variant hover:text-white hover:bg-white/5",
                    ].join(" ")}
                  >
                    50%
                  </button>
                  <button
                    onClick={() => setIs100(true)}
                    className={[
                      "flex-1 py-3 rounded-lg font-bold text-sm transition-all",
                      is100
                        ? "bg-primary text-on-primary-fixed shadow-md"
                        : "text-on-surface-variant hover:text-white hover:bg-white/5",
                    ].join(" ")}
                  >
                    100%
                  </button>
                </div>
              </div>
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

            <div className="flex items-center justify-between mb-6 relative z-10">
              <span className="text-xs font-bold tracking-widest text-primary uppercase">
                Detalhamento do Cálculo
              </span>
              <span className="text-[10px] font-bold tracking-widest text-on-surface-variant/60 uppercase border border-white/10 px-2 py-1 rounded">
                ADICIONAL {is100 ? "100%" : "50%"}
              </span>
            </div>

            <div className="space-y-0 relative z-10">
              <ResultRow
                label="Valor da Hora Normal"
                value={salarioBruto > 0 && horasMes > 0 ? formatBRLPrecise(result.valorHoraNormal) : "--"}
                dimmed={salarioBruto <= 0 || horasMes <= 0}
              />
              <ResultRow
                label={`Valor da Hora Extra (+${is100 ? "100" : "50"}%)`}
                value={salarioBruto > 0 && horasMes > 0 ? formatBRLPrecise(result.valorHoraExtra) : "--"}
                dimmed={salarioBruto <= 0 || horasMes <= 0}
              />
              <ResultRow
                label={`Total Horas Extras (${horasExtras}h)`}
                value={salarioBruto > 0 && horasExtras > 0 ? formatBRL(result.totalHorasExtras) : "--"}
                dimmed={salarioBruto <= 0 || horasExtras <= 0}
              />
              <ResultRow
                label="DSR — Descanso Semanal Remunerado"
                value={salarioBruto > 0 && horasExtras > 0 ? formatBRL(result.dsr) : "--"}
                dimmed={salarioBruto <= 0 || horasExtras <= 0}
              />
            </div>

            {/* Total a receber highlight */}
            <div className="mt-6 pt-4 relative z-10">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                  Total a Receber
                </span>
                <span className="text-3xl font-black text-primary font-headline tabular-nums">
                  {salarioBruto > 0 && horasExtras > 0
                    ? formatBRL(result.total)
                    : formatBRL(0)}
                </span>
              </div>
            </div>

            <p className="text-[10px] text-on-surface-variant/40 italic mt-4 leading-relaxed relative z-10">
              *O DSR é calculado como 1/6 do total das horas extras (Art. 7º, Lei 605/49). Valores sem dedução de INSS/IRRF sobre os adicionais.
            </p>
          </GlassCard>

          {/* Fórmula breakdown card */}
          <GlassCard className="p-6 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                Fórmula Aplicada
              </span>
            </div>
            <div className="space-y-2 text-xs font-mono text-on-surface-variant/70">
              <p>
                Hora Normal = Salário ÷ Horas/Mês
              </p>
              <p>
                Hora Extra = Hora Normal × (1 + {is100 ? "1,00" : "0,50"})
              </p>
              <p>
                Total Extras = Hora Extra × Horas Trabalhadas
              </p>
              <p>
                DSR = Total Extras ÷ 6
              </p>
            </div>
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
    </PortalShell>
  );
}
