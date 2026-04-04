"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  calcularSeguroDesemprego,
  calcularFGTSAcumulado,
  SALARIO_MINIMO_2026,
  CalculatorShell,
  CurrencyInput,
  RangeInput,
  SelectOption,
  ActionButtons,
  VerifiedBadge,
  Disclaimer,
  formatBRL,
  generateServicePDF,
  type PDFSection,
} from "@/app/portal/feature/servicos";

// ─── Types ────────────────────────────────────────────────────────────────────

type SituacaoAtual = "empregado" | "desempregado" | "em_licenca";
type SolicitacaoSeguro = "1a" | "2a" | "3a_ou_mais";
type ModalidadeFGTS =
  | "saque_rescisao"
  | "saque_aniversario"
  | "emergencial"
  | "doenca_grave"
  | "aposentadoria"
  | "compra_imovel"
  | "idade_70";

// ─── Options ──────────────────────────────────────────────────────────────────

const SITUACAO_OPTIONS: { value: SituacaoAtual; label: string }[] = [
  { value: "empregado", label: "Empregado" },
  { value: "desempregado", label: "Desempregado" },
  { value: "em_licenca", label: "Em Licenca" },
];

const SOLICITACAO_OPTIONS: { value: SolicitacaoSeguro; label: string }[] = [
  { value: "1a", label: "1a Vez" },
  { value: "2a", label: "2a Vez" },
  { value: "3a_ou_mais", label: "3a+ Vez" },
];

const MODALIDADE_FGTS_OPTIONS: { value: ModalidadeFGTS; label: string }[] = [
  { value: "saque_rescisao", label: "Saque-Rescisao" },
  { value: "saque_aniversario", label: "Saque-Aniversario" },
  { value: "emergencial", label: "Emergencial" },
  { value: "doenca_grave", label: "Doenca Grave" },
  { value: "aposentadoria", label: "Aposentadoria" },
  { value: "compra_imovel", label: "Compra de Imovel" },
  { value: "idade_70", label: "Idade >= 70" },
];

// ─── FGTS Modalidade Requisitos ───────────────────────────────────────────────

const REQUISITOS_FGTS: Record<ModalidadeFGTS, string[]> = {
  saque_rescisao: [
    "Demissao sem justa causa",
    "Termino de contrato por prazo determinado",
    "Rescisao indireta ou por culpa reciproca",
  ],
  saque_aniversario: [
    "Adesao voluntaria ao Saque-Aniversario",
    "Saque parcial anual no mes do aniversario",
    "Perde direito ao FGTS integral em demissao sem justa causa",
  ],
  emergencial: [
    "Situacao de calamidade publica reconhecida pelo governo",
    "Necessidade de renda por impacto financeiro",
  ],
  doenca_grave: [
    "Neoplasia maligna (cancer) do trabalhador ou dependente",
    "Estadio terminal por doenca grave ou acidente",
    "HIV (AIDS) do titular",
  ],
  aposentadoria: [
    "Concessao de aposentadoria pelo INSS",
    "Aposentadoria por invalidez permanente",
  ],
  compra_imovel: [
    "Compra de imovel residencial urbano novo ou usado",
    "Construcao ou liquidacao de financiamento habitacional (SFH)",
    "Primeiro imovel financiado pelo SFH",
  ],
  idade_70: [
    "Trabalhador com 70 anos ou mais",
    "Saque integral do saldo disponivel",
  ],
};

// ─── Benefit Card ─────────────────────────────────────────────────────────────

interface BenefitCardProps {
  title: string;
  elegivel: boolean;
  children: React.ReactNode;
}

function BenefitCard({ title, elegivel, children }: BenefitCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className={cn("h-1.5", elegivel ? "bg-emerald-500" : "bg-red-500")} />
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">{title}</h3>
          <span
            className={cn(
              "text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full",
              elegivel
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-red-500/10 text-red-500"
            )}
          >
            {elegivel ? "ELEGIVEL" : "NAO ELEGIVEL"}
          </span>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-mono font-semibold tabular-nums", highlight && "text-primary text-base font-bold")}>
        {value}
      </span>
    </div>
  );
}

function Requisito({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div className="flex items-start gap-2 py-1">
      <span className={cn("mt-0.5 text-xs font-bold", ok ? "text-emerald-500" : "text-muted-foreground/50")}>
        {ok ? "✓" : "○"}
      </span>
      <span className={cn("text-sm", ok ? "text-foreground" : "text-muted-foreground/70")}>{text}</span>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ElegibilidadeBeneficiosPage() {
  // Situacao
  const [situacao, setSituacao] = useState<SituacaoAtual>("desempregado");

  // Meses de emprego
  const [mesesEmprego, setMesesEmprego] = useState(12);

  // Salario medio
  const [salarioRaw, setSalarioRaw] = useState("");
  const [salarioMedio, setSalarioMedio] = useState(0);

  // Solicitacao seguro desemprego
  const [solicitacao, setSolicitacao] = useState<SolicitacaoSeguro>("1a");

  // Data PIS
  const [dataPIS, setDataPIS] = useState("");

  // Modalidade FGTS
  const [modalidadeFGTS, setModalidadeFGTS] = useState<ModalidadeFGTS>("saque_rescisao");

  // ─── Calculo Seguro Desemprego ─────────────────────────────────────────────

  const seguroDesemprego = useMemo(() => {
    if (salarioMedio <= 0) {
      return null;
    }
    return calcularSeguroDesemprego({
      salarioMedio,
      mesesTrabalhados: mesesEmprego,
      solicitacao,
    });
  }, [salarioMedio, mesesEmprego, solicitacao]);

  // ─── Calculo PIS/Abono Salarial ────────────────────────────────────────────

  const pisInfo = useMemo(() => {
    const anosPIS = dataPIS
      ? Math.floor(
          (new Date().getTime() - new Date(dataPIS + "T00:00:00").getTime()) /
            (1000 * 60 * 60 * 24 * 365.25)
        )
      : 0;

    const elegivel =
      anosPIS >= 5 && salarioMedio > 0 && salarioMedio <= SALARIO_MINIMO_2026 * 2;

    const valorPIS = Math.max(
      135.08,
      (Math.min(mesesEmprego, 12) / 12) * SALARIO_MINIMO_2026
    );

    return { anosPIS, elegivel, valorPIS };
  }, [dataPIS, salarioMedio, mesesEmprego]);

  // ─── Calculo FGTS ─────────────────────────────────────────────────────────

  const fgtsInfo = useMemo(() => {
    if (salarioMedio <= 0) return null;
    return calcularFGTSAcumulado({
      salarioBruto: salarioMedio,
      mesesTrabalhados: mesesEmprego,
      incluir13o: true,
      incluirFerias: true,
    });
  }, [salarioMedio, mesesEmprego]);

  // ─── PDF ──────────────────────────────────────────────────────────────────

  const hasResults = salarioMedio > 0;

  const handleDownloadPDF = useCallback(async () => {
    if (!hasResults) return;

    const sections: PDFSection[] = [];

    sections.push({ label: "Seguro-Desemprego", value: "", type: "header" });
    if (seguroDesemprego?.elegivel) {
      sections.push({ label: "Valor da Parcela", value: formatBRL(seguroDesemprego.valorParcela), type: "row" });
      sections.push({ label: "Quantidade de Parcelas", value: `${seguroDesemprego.quantidadeParcelas}x`, type: "row" });
      sections.push({ label: "Total Estimado", value: formatBRL(seguroDesemprego.totalEstimado), type: "total" });
    } else {
      sections.push({ label: "Status", value: "Nao elegivel", type: "row" });
    }

    sections.push({ label: "PIS/Abono Salarial", value: "", type: "header" });
    sections.push({ label: "Status", value: pisInfo.elegivel ? "Elegivel" : "Nao elegivel", type: "row" });
    if (pisInfo.elegivel) {
      sections.push({ label: "Valor Estimado", value: formatBRL(pisInfo.valorPIS), type: "total" });
    }

    sections.push({ label: "FGTS", value: "", type: "header" });
    if (fgtsInfo) {
      sections.push({ label: "Deposito Mensal", value: formatBRL(fgtsInfo.depositoMensal), type: "row" });
      sections.push({ label: "Saldo Estimado", value: formatBRL(fgtsInfo.saldoEstimado), type: "total" });
    }

    const disclaimer =
      "Este diagnostico tem carater meramente informativo e estimativo. A elegibilidade real depende de verificacao junto aos orgaos competentes (MTE, Caixa Economica Federal, Ministerio do Trabalho). Consulte um advogado trabalhista para analise detalhada do seu caso.";

    const pdfBytes = await generateServicePDF({
      title: "Diagnostico de Elegibilidade para Beneficios",
      sections,
      disclaimer,
      date: new Date(),
    });

    const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "diagnostico-elegibilidade-beneficios.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }, [hasResults, seguroDesemprego, pisInfo, fgtsInfo]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Diagnostico de Elegibilidade para Beneficios",
        text: "Verifique sua elegibilidade para Seguro-Desemprego, PIS/Abono Salarial e FGTS.",
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <CalculatorShell
      inputPanel={
        <>
          {/* Situacao Atual */}
          <SelectOption
            label="Situacao Atual"
            options={SITUACAO_OPTIONS}
            value={situacao}
            onChange={(v) => setSituacao(v as SituacaoAtual)}
          />

          {/* Meses de Emprego */}
          <RangeInput
            label="Meses de Emprego Formal (ultimos 36 meses)"
            value={mesesEmprego}
            onChange={setMesesEmprego}
            min={1}
            max={36}
            unit="meses"
          />

          {/* Salario Medio */}
          <CurrencyInput
            label="Salario Medio"
            value={salarioRaw}
            onChange={(raw, parsed) => {
              setSalarioRaw(raw);
              setSalarioMedio(parsed);
            }}
          />

          {/* Solicitacao Seguro-Desemprego */}
          <SelectOption
            label="Vezes que recebeu Seguro-Desemprego"
            options={SOLICITACAO_OPTIONS}
            value={solicitacao}
            onChange={(v) => setSolicitacao(v as SolicitacaoSeguro)}
          />

          {/* Data PIS */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Data de Inscricao no PIS
            </label>
            <input
              type="date"
              value={dataPIS}
              onChange={(e) => setDataPIS(e.target.value)}
              className="w-full bg-muted border-none rounded-lg p-4 text-foreground font-mono text-lg outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>

          {/* Modalidade FGTS */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Modalidade FGTS
            </label>
            <select
              value={modalidadeFGTS}
              onChange={(e) => setModalidadeFGTS(e.target.value as ModalidadeFGTS)}
              className="w-full bg-muted border-none rounded-lg p-4 text-foreground text-base outline-none focus:ring-2 focus:ring-primary/40 transition-shadow appearance-none cursor-pointer"
            >
              {MODALIDADE_FGTS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Verified Badge */}
          <VerifiedBadge />
        </>
      }
      resultPanel={
        <>
          {/* Card 1: Seguro-Desemprego */}
          <BenefitCard
            title="Seguro-Desemprego"
            elegivel={seguroDesemprego?.elegivel ?? false}
          >
            {seguroDesemprego?.elegivel ? (
              <div className="space-y-0">
                <InfoRow label="Valor da Parcela" value={formatBRL(seguroDesemprego.valorParcela)} />
                <InfoRow label="Quantidade de Parcelas" value={`${seguroDesemprego.quantidadeParcelas}x`} />
                <InfoRow
                  label="Total Estimado"
                  value={formatBRL(seguroDesemprego.totalEstimado)}
                  highlight
                />
              </div>
            ) : (
              <div className="space-y-3">
                {seguroDesemprego?.motivoInelegibilidade ? (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {seguroDesemprego.motivoInelegibilidade}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Informe o salario medio para verificar elegibilidade.
                  </p>
                )}
              </div>
            )}
          </BenefitCard>

          {/* Card 2: PIS/Abono Salarial */}
          <BenefitCard title="PIS / Abono Salarial" elegivel={pisInfo.elegivel}>
            <div className="space-y-3">
              <div className="space-y-0.5 mb-3">
                <Requisito
                  ok={pisInfo.anosPIS >= 5}
                  text={`PIS cadastrado ha ${pisInfo.anosPIS} ano${pisInfo.anosPIS !== 1 ? "s" : ""} (minimo 5 anos)`}
                />
                <Requisito
                  ok={salarioMedio > 0 && salarioMedio <= SALARIO_MINIMO_2026 * 2}
                  text={`Renda ate 2 salarios minimos (${formatBRL(SALARIO_MINIMO_2026 * 2)})`}
                />
                <Requisito
                  ok={mesesEmprego >= 1}
                  text="Ao menos 30 dias trabalhados com carteira assinada no ano-base"
                />
              </div>
              {pisInfo.elegivel && (
                <div className="border-t border-border pt-3">
                  <InfoRow label="Valor Estimado" value={formatBRL(pisInfo.valorPIS)} highlight />
                </div>
              )}
            </div>
          </BenefitCard>

          {/* Card 3: FGTS */}
          <BenefitCard title="FGTS" elegivel={fgtsInfo !== null}>
            <div className="space-y-3">
              <div className="mb-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Modalidade Selecionada
                </span>
                <p className="text-sm font-semibold mt-1">
                  {MODALIDADE_FGTS_OPTIONS.find((o) => o.value === modalidadeFGTS)?.label}
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-1">
                  Requisitos
                </span>
                {REQUISITOS_FGTS[modalidadeFGTS].map((req) => (
                  <Requisito key={req} ok text={req} />
                ))}
              </div>

              {fgtsInfo && (
                <div className="border-t border-border pt-3 space-y-0">
                  <InfoRow label="Deposito Mensal" value={formatBRL(fgtsInfo.depositoMensal)} />
                  <InfoRow label="Total Depositado" value={formatBRL(fgtsInfo.totalDepositos)} />
                  <InfoRow label="Rendimentos" value={formatBRL(fgtsInfo.totalRendimentos)} />
                  <InfoRow label="Saldo Estimado" value={formatBRL(fgtsInfo.saldoEstimado)} highlight />
                </div>
              )}

              {(modalidadeFGTS === "saque_aniversario" || modalidadeFGTS === "saque_rescisao") && (
                <p className="text-xs text-amber-500 bg-amber-500/10 rounded-md px-3 py-2 mt-2 leading-relaxed">
                  Atencao: Saque-Rescisao e Saque-Aniversario sao modalidades exclusivas entre si. A adesao ao
                  Saque-Aniversario cancela o direito ao saque integral em caso de demissao sem justa causa.
                </p>
              )}
            </div>
          </BenefitCard>

          {/* Action buttons */}
          <ActionButtons
            onDownloadPDF={handleDownloadPDF}
            onShare={handleShare}
          />

          {/* Disclaimer */}
          <Disclaimer text="*Diagnostico de carater informativo baseado nos dados fornecidos. A elegibilidade real sera verificada pelos orgaos competentes (MTE, Caixa Economica Federal, INSS). Consulte um advogado trabalhista para analise detalhada do seu caso." />
        </>
      }
    />
  );
}
