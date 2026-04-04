"use client";

import { useState, useMemo, useCallback } from "react";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  calcularHorasExtras,
  CalculatorShell,
  CurrencyInput,
  NumberInput,
  RangeInput,
  ToggleOption,
  ResultRow,
  ActionButtons,
  VerifiedBadge,
  Disclaimer,
  CtaZattar,
  formatBRL,
  generateServicePDF,
  type PDFSection,
} from "@/app/portal/feature/servicos";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Parse "HH:MM" -> decimal hours (e.g., "08:30" -> 8.5) */
function parseTime(timeStr: string): number {
  if (!timeStr) return 0;
  const [hh, mm] = timeStr.split(":").map(Number);
  if (isNaN(hh) || isNaN(mm)) return 0;
  return hh + mm / 60;
}

function formatHours(h: number): string {
  if (h === 0) return "0h";
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}min`;
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnaliseJornadaPage() {
  // Jornada contratada
  const [jornadaContratadaRaw, setJornadaContratadaRaw] = useState("8");
  const [jornadaContratada, setJornadaContratada] = useState(8);

  // Horarios
  const [entrada, setEntrada] = useState("08:00");
  const [saida, setSaida] = useState("18:00");

  // Intervalo
  const [intervaloRaw, setIntervaloRaw] = useState("60");
  const [intervaloMin, setIntervaloMin] = useState(60);

  // Sabado
  const [trabalhaSabado, setTrabalhaSabado] = useState(false);
  const [horasSabadoRaw, setHorasSabadoRaw] = useState("4");
  const [horasSabado, setHorasSabado] = useState(4);

  // Feriados
  const [feriadosRaw, setFeriadosRaw] = useState("0");
  const [feriadosDias, setFeriadosDias] = useState(0);

  // Salario
  const [salarioRaw, setSalarioRaw] = useState("");
  const [salarioBruto, setSalarioBruto] = useState(0);

  // Meses
  const [meses, setMeses] = useState(12);

  // ─── Calculation ──────────────────────────────────────────────────────────

  const resultado = useMemo(() => {
    const horasEntrada = parseTime(entrada);
    const horasSaidaDecimal = parseTime(saida);

    if (horasEntrada === 0 || horasSaidaDecimal === 0) return null;
    if (horasSaidaDecimal <= horasEntrada) return null;

    // Jornada real (horas trabalhadas - intervalo)
    const jornadaReal = r2(horasSaidaDecimal - horasEntrada - intervaloMin / 60);

    // HE diarias por excesso de jornada
    const horasExtrasDia = Math.max(0, r2(jornadaReal - jornadaContratada));

    // Intervalo suprimido (Art. 71 §4 CLT) — se < 60min, diferenca vira HE 50%
    const intervaloSuprimido = intervaloMin < 60 ? r2((60 - intervaloMin) / 60) : 0;

    // Irregularidades detectadas
    const temIrregularidade = horasExtrasDia > 0 || intervaloSuprimido > 0;

    if (salarioBruto <= 0) {
      return {
        jornadaReal,
        jornadaContratada,
        horasExtrasDia,
        intervaloSuprimido,
        temIrregularidade,
        semSalario: true,
        mensal: null,
        acumulado: null,
      };
    }

    // ── HE mensais ──────────────────────────────────────────────────────────

    // HE semana: (excesso diario + intervalo suprimido) * 22 dias uteis
    const horasExtrasSemana50 = (horasExtrasDia + intervaloSuprimido) * 22;

    // HE sabado: 4 sabados por mes
    const horasExtrasSabado100 = trabalhaSabado ? horasSabado * 4 : 0;

    // HE feriados: feriados trabalhados = jornada completa (100%)
    const horasExtrasFeriado100 = feriadosDias * jornadaContratada;

    // Usar calcularHorasExtras do dominio para valores monetarios
    // Para dias uteis (50%)
    const calcSemana = calcularHorasExtras({
      salarioBruto,
      horasMensais: 220,
      horasExtrasSemana: horasExtrasSemana50,
      horasExtrasFimDeSemana: 0,
      percentualSemana: 0.5,
      percentualFimDeSemana: 1.0,
    });

    // Para sabado + feriado (100%)
    const calcFds = calcularHorasExtras({
      salarioBruto,
      horasMensais: 220,
      horasExtrasSemana: 0,
      horasExtrasFimDeSemana: horasExtrasSabado100 + horasExtrasFeriado100,
      percentualSemana: 0.5,
      percentualFimDeSemana: 1.0,
    });

    const valorHoraNormal = r2(salarioBruto / 220);
    const valorHE50 = r2(valorHoraNormal * 1.5);
    const valorHE100 = r2(valorHoraNormal * 2.0);

    const totalHESemana = r2(horasExtrasSemana50 * valorHE50);
    const totalHESabado = r2(horasExtrasSabado100 * valorHE100);
    const totalHEFeriado = r2(horasExtrasFeriado100 * valorHE100);

    const totalHEMensal = r2(totalHESemana + totalHESabado + totalHEFeriado);
    const dsr = r2(totalHEMensal / 6);
    const totalMensalComDSR = r2(totalHEMensal + dsr);

    // Reflexos mensais
    const reflexoFerias = r2(totalMensalComDSR / 12 + totalMensalComDSR / 12 / 3);
    const reflexo13o = r2(totalMensalComDSR / 12);
    const reflexoFGTS = r2((totalMensalComDSR + reflexoFerias + reflexo13o) * 0.08 * 1.4);

    // ── Acumulado ───────────────────────────────────────────────────────────

    const totalAcumuladoHE = r2(totalMensalComDSR * meses);
    const totalReflexos = r2((reflexoFerias + reflexo13o + reflexoFGTS) * meses);
    const totalAcumulado = r2(totalAcumuladoHE + totalReflexos);

    return {
      jornadaReal,
      jornadaContratada,
      horasExtrasDia,
      intervaloSuprimido,
      temIrregularidade,
      semSalario: false,
      mensal: {
        totalHESemana,
        totalHESabado,
        totalHEFeriado,
        dsr,
        totalMensalComDSR,
      },
      acumulado: {
        totalAcumuladoHE,
        totalReflexos,
        totalAcumulado,
      },
    };
  }, [
    entrada,
    saida,
    intervaloMin,
    jornadaContratada,
    trabalhaSabado,
    horasSabado,
    feriadosDias,
    salarioBruto,
    meses,
  ]);

  // ─── PDF Download ─────────────────────────────────────────────────────────

  const handleDownloadPDF = useCallback(async () => {
    if (!resultado || resultado.semSalario || !resultado.mensal || !resultado.acumulado) return;

    const sections: PDFSection[] = [];

    sections.push({ label: "Analise de Jornada", value: "", type: "header" });
    sections.push({ label: "Jornada Real", value: formatHours(resultado.jornadaReal), type: "row" });
    sections.push({ label: "Jornada Contratada", value: formatHours(resultado.jornadaContratada), type: "row" });
    sections.push({ label: "Horas Extras Diarias", value: formatHours(resultado.horasExtrasDia), type: "row" });

    sections.push({ label: "Estimativa Mensal", value: "", type: "header" });
    sections.push({ label: "HE Dias Uteis (50%)", value: formatBRL(resultado.mensal.totalHESemana), type: "row" });
    sections.push({ label: "HE Sabados (100%)", value: formatBRL(resultado.mensal.totalHESabado), type: "row" });
    sections.push({ label: "HE Feriados (100%)", value: formatBRL(resultado.mensal.totalHEFeriado), type: "row" });
    sections.push({ label: "DSR", value: formatBRL(resultado.mensal.dsr), type: "row" });
    sections.push({ label: "Total Mensal", value: formatBRL(resultado.mensal.totalMensalComDSR), type: "total" });

    sections.push({ label: `Acumulado (${meses} meses)`, value: "", type: "header" });
    sections.push({ label: "Total HE Acumulado", value: formatBRL(resultado.acumulado.totalAcumuladoHE), type: "row" });
    sections.push({ label: "Reflexos (Ferias+1/3, 13o, FGTS+40%)", value: formatBRL(resultado.acumulado.totalReflexos), type: "row" });
    sections.push({ label: "Total Acumulado", value: formatBRL(resultado.acumulado.totalAcumulado), type: "total" });

    const pdfBytes = await generateServicePDF({
      title: "Analise de Jornada e Horas Extras",
      sections,
      disclaimer:
        "Este calculo tem carater meramente informativo e estimativo. Os valores exatos podem variar conforme convencoes coletivas, acordos individuais e interpretacoes juridicas. Consulte um advogado trabalhista para analise detalhada do seu caso.",
      date: new Date(),
    });

    const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "analise-jornada-horas-extras.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }, [resultado, meses]);

  const handleShare = useCallback(async () => {
    if (!resultado || !resultado.acumulado) return;
    const text = `Total Acumulado estimado: ${formatBRL(resultado.acumulado.totalAcumulado)}`;
    if (navigator.share) {
      await navigator.share({
        title: "Analise de Jornada e Horas Extras",
        text,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  }, [resultado]);

  // ─── Render ───────────────────────────────────────────────────────────────

  const temResultado = resultado !== null && !resultado.semSalario;
  const temIrregularidade = resultado?.temIrregularidade ?? false;

  return (
    <CalculatorShell
      inputPanel={
        <>
          {/* Jornada contratada */}
          <NumberInput
            label="Jornada Contratada"
            value={jornadaContratadaRaw}
            onChange={(raw, parsed) => {
              setJornadaContratadaRaw(raw);
              setJornadaContratada(Math.max(1, Math.min(12, parsed)));
            }}
            placeholder="8"
            suffix="hrs/dia"
          />

          {/* Horario de entrada */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Horario de Entrada
            </label>
            <input
              type="time"
              value={entrada}
              onChange={(e) => setEntrada(e.target.value)}
              className="w-full bg-muted border-none rounded-lg p-4 text-foreground font-mono text-lg outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>

          {/* Horario de saida */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Horario de Saida
            </label>
            <input
              type="time"
              value={saida}
              onChange={(e) => setSaida(e.target.value)}
              className="w-full bg-muted border-none rounded-lg p-4 text-foreground font-mono text-lg outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>

          {/* Duracao do intervalo */}
          <NumberInput
            label="Duracao do Intervalo"
            value={intervaloRaw}
            onChange={(raw, parsed) => {
              setIntervaloRaw(raw);
              setIntervaloMin(Math.max(0, Math.min(480, parsed)));
            }}
            placeholder="60"
            suffix="min"
          />

          {/* Trabalha aos sabados */}
          <ToggleOption
            label="Trabalha aos Sabados?"
            description="Sabados sao remunerados com adicional de 100%"
            checked={trabalhaSabado}
            onChange={setTrabalhaSabado}
          />

          {/* Horas no sabado (condicional) */}
          {trabalhaSabado && (
            <NumberInput
              label="Horas no Sabado"
              value={horasSabadoRaw}
              onChange={(raw, parsed) => {
                setHorasSabadoRaw(raw);
                setHorasSabado(Math.max(0, Math.min(12, parsed)));
              }}
              placeholder="4"
              suffix="hrs"
            />
          )}

          {/* Feriados trabalhados por mes */}
          <NumberInput
            label="Feriados Trabalhados por Mes"
            value={feriadosRaw}
            onChange={(raw, parsed) => {
              setFeriadosRaw(raw);
              setFeriadosDias(Math.max(0, Math.floor(parsed)));
            }}
            placeholder="0"
            suffix="dias"
          />

          {/* Salario bruto */}
          <CurrencyInput
            label="Salario Bruto"
            value={salarioRaw}
            onChange={(raw, parsed) => {
              setSalarioRaw(raw);
              setSalarioBruto(parsed);
            }}
          />

          {/* Meses nessa situacao */}
          <RangeInput
            label="Meses nessa Situacao"
            value={meses}
            onChange={setMeses}
            min={1}
            max={120}
            labels={["1 Mes", "5 Anos", "10 Anos"]}
          />

          {/* Verified badge */}
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
                Analise da Jornada
              </span>

              {/* Alert cards for irregularities */}
              {resultado && temIrregularidade && (
                <div className="space-y-2 mb-6 relative z-10">
                  {resultado.horasExtrasDia > 0 && (
                    <div className="flex items-start gap-3 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
                      <AlertTriangle className="text-destructive shrink-0 mt-0.5" size={16} />
                      <p className="text-xs text-destructive font-medium leading-relaxed">
                        IRREGULARIDADE: Jornada excede o contratado em{" "}
                        <strong>{formatHours(resultado.horasExtrasDia)}</strong> diarias
                      </p>
                    </div>
                  )}
                  {resultado.intervaloSuprimido > 0 && (
                    <div className="flex items-start gap-3 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
                      <AlertTriangle className="text-destructive shrink-0 mt-0.5" size={16} />
                      <p className="text-xs text-destructive font-medium leading-relaxed">
                        IRREGULARIDADE: Intervalo abaixo de 1 hora (Art. 71 §4 CLT)
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-0 relative z-10">
                {/* Jornada basica */}
                <ResultRow
                  label="Jornada Real"
                  value={resultado ? formatHours(resultado.jornadaReal) : "--"}
                  dimmed={!resultado}
                />
                <ResultRow
                  label="Jornada Contratada"
                  value={resultado ? formatHours(resultado.jornadaContratada) : "--"}
                  dimmed={!resultado}
                />
                <ResultRow
                  label="Horas Extras Diarias"
                  value={resultado ? formatHours(resultado.horasExtrasDia) : "--"}
                  dimmed={!resultado}
                />
                {resultado && resultado.intervaloSuprimido > 0 && (
                  <ResultRow
                    label="Intervalo Suprimido"
                    value={formatHours(resultado.intervaloSuprimido)}
                  />
                )}

                <Separator className="my-4" />

                {/* Estimativa mensal */}
                <div className="py-2">
                  <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                    Estimativa Mensal
                  </span>
                </div>

                <ResultRow
                  label="HE Dias Uteis (50%)"
                  value={temResultado && resultado?.mensal ? formatBRL(resultado.mensal.totalHESemana) : "--"}
                  dimmed={!temResultado}
                />
                <ResultRow
                  label="HE Sabados (100%)"
                  value={temResultado && resultado?.mensal ? formatBRL(resultado.mensal.totalHESabado) : "--"}
                  dimmed={!temResultado}
                />
                <ResultRow
                  label="HE Feriados (100%)"
                  value={temResultado && resultado?.mensal ? formatBRL(resultado.mensal.totalHEFeriado) : "--"}
                  dimmed={!temResultado}
                />
                <ResultRow
                  label="DSR"
                  value={temResultado && resultado?.mensal ? formatBRL(resultado.mensal.dsr) : "--"}
                  dimmed={!temResultado}
                />

                {/* Total mensal highlight */}
                <div className="border-t border-border mt-2" />
                <div className="py-3 flex justify-between items-center">
                  <span className="text-sm font-bold text-foreground">Total Mensal</span>
                  <span className="font-mono font-black tabular-nums text-primary text-lg">
                    {temResultado && resultado?.mensal
                      ? formatBRL(resultado.mensal.totalMensalComDSR)
                      : formatBRL(0)}
                  </span>
                </div>

                <Separator className="my-4" />

                {/* Acumulado */}
                <div className="py-2">
                  <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                    Acumulado ({meses} {meses === 1 ? "Mes" : "Meses"})
                  </span>
                </div>

                <ResultRow
                  label="Total HE Acumulado"
                  value={temResultado && resultado?.acumulado ? formatBRL(resultado.acumulado.totalAcumuladoHE) : "--"}
                  dimmed={!temResultado}
                />
                <ResultRow
                  label="Reflexos (Ferias+1/3, 13o, FGTS+40%)"
                  value={temResultado && resultado?.acumulado ? formatBRL(resultado.acumulado.totalReflexos) : "--"}
                  dimmed={!temResultado}
                />
              </div>

              {/* Total acumulado highlight */}
              <div className="mt-6 pt-4 relative z-10">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Total Acumulado
                  </span>
                  <span className="text-3xl font-black text-primary font-headline tabular-nums">
                    {temResultado && resultado?.acumulado
                      ? formatBRL(resultado.acumulado.totalAcumulado)
                      : formatBRL(0)}
                  </span>
                </div>
              </div>

              {/* CTA Zattar (only when irregularities found) */}
              {temResultado && temIrregularidade && (
                <div className="mt-6 relative z-10">
                  <CtaZattar />
                </div>
              )}

              <Disclaimer text="*Estimativa baseada na legislacao CLT vigente (Arts. 58, 59 e 71). Valores exatos podem variar conforme convencoes coletivas, acordos individuais e interpretacoes juridicas. Consulte um advogado trabalhista para analise do seu caso." />
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
