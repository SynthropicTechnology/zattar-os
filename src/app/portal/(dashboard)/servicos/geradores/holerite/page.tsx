"use client";

import { useState, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import {
  CalculatorShell,
  NumberInput,
  CurrencyInput,
  ActionButtons,
  VerifiedBadge,
  Disclaimer,
  CtaZattar,
  calcularSalarioLiquido,
  formatBRL,
} from "@/app/portal/feature/servicos";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8)
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12)
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest pb-1 border-b border-border/40">
      {children}
    </p>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function HoleritePage() {
  // Empresa
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [endereco, setEndereco] = useState("");

  // Empregado
  const [nomeEmpregado, setNomeEmpregado] = useState("");
  const [cpf, setCpf] = useState("");
  const [cargo, setCargo] = useState("");
  const [dataAdmissao, setDataAdmissao] = useState("");
  const [departamento, setDepartamento] = useState("");

  // Remuneracao
  const [salarioBaseStr, setSalarioBaseStr] = useState("");
  const [salarioBase, setSalarioBase] = useState(0);

  const [horasExtras50Str, setHorasExtras50Str] = useState("");
  const [horasExtras50, setHorasExtras50] = useState(0);

  const [horasExtras100Str, setHorasExtras100Str] = useState("");
  const [horasExtras100, setHorasExtras100] = useState(0);

  const [adicionalNoturnoStr, setAdicionalNoturnoStr] = useState("");
  const [adicionalNoturno, setAdicionalNoturno] = useState(0);

  const [periculosidadeStr, setPericulosidadeStr] = useState("");
  const [periculosidade, setPericulosidade] = useState(0);

  const [insalubridadeStr, setInsalubridadeStr] = useState("");
  const [insalubridade, setInsalubridade] = useState(0);

  const [outrosProventosStr, setOutrosProventosStr] = useState("");
  const [outrosProventos, setOutrosProventos] = useState(0);

  // Referencia e IR
  const [mesReferencia, setMesReferencia] = useState("");
  const [dependentesStr, setDependentesStr] = useState("0");
  const [dependentes, setDependentes] = useState(0);

  // ─── Calculos ─────────────────────────────────────────────────────────────

  const calc = useMemo(() => {
    const totalProventosBruto =
      salarioBase +
      horasExtras50 +
      horasExtras100 +
      adicionalNoturno +
      periculosidade +
      insalubridade +
      outrosProventos;

    if (totalProventosBruto <= 0) return null;

    const resultado = calcularSalarioLiquido({
      salarioBruto: totalProventosBruto,
      dependentes,
      descontoVT: false,
    });

    const fgts = Math.round(totalProventosBruto * 0.08 * 100) / 100;

    return { resultado, fgts, totalProventosBruto };
  }, [
    salarioBase,
    horasExtras50,
    horasExtras100,
    adicionalNoturno,
    periculosidade,
    insalubridade,
    outrosProventos,
    dependentes,
  ]);

  // ─── Proventos list (only non-zero) ───────────────────────────────────────

  const proventos = useMemo(() => {
    const items: { label: string; valor: number }[] = [];
    if (salarioBase > 0) items.push({ label: "Salario Base", valor: salarioBase });
    if (horasExtras50 > 0) items.push({ label: "Horas Extras 50%", valor: horasExtras50 });
    if (horasExtras100 > 0) items.push({ label: "Horas Extras 100%", valor: horasExtras100 });
    if (adicionalNoturno > 0) items.push({ label: "Adicional Noturno", valor: adicionalNoturno });
    if (periculosidade > 0) items.push({ label: "Periculosidade", valor: periculosidade });
    if (insalubridade > 0) items.push({ label: "Insalubridade", valor: insalubridade });
    if (outrosProventos > 0) items.push({ label: "Outros Proventos", valor: outrosProventos });
    return items;
  }, [
    salarioBase,
    horasExtras50,
    horasExtras100,
    adicionalNoturno,
    periculosidade,
    insalubridade,
    outrosProventos,
  ]);

  // ─── PDF Generation ───────────────────────────────────────────────────────

  const handleDownloadPDF = useCallback(async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([595.28, 841.89]); // A4
    const font = await doc.embedFont(StandardFonts.Courier);
    const fontBold = await doc.embedFont(StandardFonts.CourierBold);
    const { width, height } = page.getSize();

    const margin = 50;
    const colRight = width - margin;
    let y = height - 50;
    const lineH = 14;

    const drawLine = (
      text: string,
      x: number,
      yPos: number,
      size: number,
      bold = false,
      rightAlign = false
    ) => {
      const f = bold ? fontBold : font;
      const textWidth = f.widthOfTextAtSize(text, size);
      const xFinal = rightAlign ? x - textWidth : x;
      page.drawText(text, { x: xFinal, y: yPos, size, font: f, color: rgb(0.1, 0.1, 0.1) });
    };

    const drawDivider = (yPos: number) => {
      page.drawLine({
        start: { x: margin, y: yPos },
        end: { x: colRight, y: yPos },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
      });
    };

    const drawRowPair = (
      leftText: string,
      rightText: string,
      yPos: number,
      bold = false
    ) => {
      drawLine(leftText, margin, yPos, 9, bold);
      drawLine(rightText, colRight, yPos, 9, bold, true);
    };

    // Watermark header
    drawLine("ZATTAR ADVOGADOS", margin, y, 7, true);
    y -= 20;

    // Company header box
    page.drawRectangle({
      x: margin,
      y: y - 28,
      width: colRight - margin,
      height: 34,
      color: rgb(0.95, 0.95, 0.95),
    });
    drawLine(nomeEmpresa || "EMPRESA", margin + 4, y - 8, 10, true);
    drawLine(`CNPJ: ${cnpj || ""}`, colRight - 4, y - 8, 9, false, true);
    drawLine(endereco || "", margin + 4, y - 20, 8);
    y -= 40;
    drawDivider(y);
    y -= 10;

    // Employee info
    drawLine(`Empregado: ${nomeEmpregado || ""}`, margin, y, 9);
    drawLine(`CPF: ${cpf || ""}`, colRight, y, 9, false, true);
    y -= lineH;
    drawLine(`Cargo: ${cargo || ""}`, margin, y, 9);
    drawLine(`Admissao: ${dataAdmissao ? new Date(dataAdmissao + "T00:00:00").toLocaleDateString("pt-BR") : ""}`, colRight, y, 9, false, true);
    y -= lineH;
    drawLine(`Departamento: ${departamento || ""}`, margin, y, 9);
    drawLine(`Referencia: ${mesReferencia || ""}`, colRight, y, 9, false, true);
    y -= 10;
    drawDivider(y);
    y -= 14;

    // Proventos
    drawLine("PROVENTOS", margin, y, 9, true);
    drawLine("VALOR", colRight, y, 9, true, true);
    y -= lineH;

    for (const p of proventos) {
      drawRowPair(p.label, formatBRL(p.valor), y);
      y -= lineH;
    }

    drawDivider(y + 2);
    y -= 8;
    drawRowPair("TOTAL PROVENTOS", formatBRL(calc?.totalProventosBruto ?? 0), y, true);
    y -= 12;
    drawDivider(y);
    y -= 14;

    // Descontos
    if (calc) {
      drawLine("DESCONTOS", margin, y, 9, true);
      drawLine("VALOR", colRight, y, 9, true, true);
      y -= lineH;

      const aliqINSS = calc.resultado.inss.aliquotaEfetiva
        ? `${(calc.resultado.inss.aliquotaEfetiva * 100).toFixed(2)}%`
        : "";
      drawRowPair(`INSS (${aliqINSS})`, formatBRL(calc.resultado.inss.total), y);
      y -= lineH;

      if (!calc.resultado.irrf.isento) {
        const aliqIRRF = calc.resultado.irrf.aliquotaEfetiva
          ? `${(calc.resultado.irrf.aliquotaEfetiva * 100).toFixed(2)}%`
          : "";
        drawRowPair(`IRRF (${aliqIRRF})`, formatBRL(calc.resultado.irrf.imposto), y);
        y -= lineH;
      }

      drawDivider(y + 2);
      y -= 8;
      drawRowPair("TOTAL DESCONTOS", formatBRL(calc.resultado.totalDescontos), y, true);
      y -= 12;
      drawDivider(y);
      y -= 14;

      // Liquido
      page.drawRectangle({
        x: margin,
        y: y - 6,
        width: colRight - margin,
        height: 20,
        color: rgb(0.9, 0.85, 1.0),
      });
      drawRowPair("LIQUIDO A RECEBER", formatBRL(calc.resultado.salarioLiquido), y + 6, true);
      y -= 22;
      drawDivider(y);
      y -= 12;

      // Footer info
      drawLine(
        `Base INSS: ${formatBRL(calc.totalProventosBruto)}   Base IRRF: ${formatBRL(calc.resultado.irrf.baseCalculo)}   FGTS do Mes: ${formatBRL(calc.fgts)}`,
        margin,
        y,
        8
      );
    }

    // Disclaimer
    const disclaimer =
      "Este holerite tem carater informativo. Os valores podem variar conforme convencao coletiva e legislacao vigente.";
    page.drawText(disclaimer, {
      x: margin,
      y: 30,
      size: 7,
      font,
      color: rgb(0.6, 0.6, 0.6),
    });

    const pdfBytes = await doc.save();
    const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "holerite.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }, [
    nomeEmpresa,
    cnpj,
    endereco,
    nomeEmpregado,
    cpf,
    cargo,
    dataAdmissao,
    departamento,
    mesReferencia,
    proventos,
    calc,
  ]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Holerite - Zattar Advogados",
        text: "Gere seu holerite gratuitamente.",
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <CalculatorShell
      inputPanel={
        <>
          {/* Dados da Empresa */}
          <SectionLabel>Dados da Empresa</SectionLabel>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Nome da Empresa
            </label>
            <input
              type="text"
              value={nomeEmpresa}
              onChange={(e) => setNomeEmpresa(e.target.value)}
              placeholder="Empresa LTDA"
              className="w-full bg-muted border-none rounded-lg p-4 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              CNPJ
            </label>
            <input
              type="text"
              value={cnpj}
              onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
              placeholder="00.000.000/0000-00"
              className="w-full bg-muted border-none rounded-lg p-4 text-foreground font-mono text-sm outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Endereco
            </label>
            <input
              type="text"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Rua das Flores, 123 - Sao Paulo/SP"
              className="w-full bg-muted border-none rounded-lg p-4 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>

          {/* Dados do Empregado */}
          <SectionLabel>Dados do Empregado</SectionLabel>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Nome do Empregado
            </label>
            <input
              type="text"
              value={nomeEmpregado}
              onChange={(e) => setNomeEmpregado(e.target.value)}
              placeholder="Maria da Silva"
              className="w-full bg-muted border-none rounded-lg p-4 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              CPF
            </label>
            <input
              type="text"
              value={cpf}
              onChange={(e) => setCpf(formatCPF(e.target.value))}
              placeholder="000.000.000-00"
              className="w-full bg-muted border-none rounded-lg p-4 text-foreground font-mono text-sm outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Cargo
            </label>
            <input
              type="text"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              placeholder="Analista Administrativo"
              className="w-full bg-muted border-none rounded-lg p-4 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Data de Admissao
            </label>
            <input
              type="date"
              value={dataAdmissao}
              onChange={(e) => setDataAdmissao(e.target.value)}
              className="w-full bg-muted border-none rounded-lg p-4 text-foreground font-mono text-sm outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Departamento
            </label>
            <input
              type="text"
              value={departamento}
              onChange={(e) => setDepartamento(e.target.value)}
              placeholder="Recursos Humanos"
              className="w-full bg-muted border-none rounded-lg p-4 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>

          {/* Remuneracao */}
          <SectionLabel>Remuneracao</SectionLabel>

          <CurrencyInput
            label="Salario Base"
            value={salarioBaseStr}
            onChange={(raw, parsed) => {
              setSalarioBaseStr(raw);
              setSalarioBase(parsed);
            }}
            placeholder="3.000,00"
          />

          <CurrencyInput
            label="Horas Extras 50% (opcional)"
            value={horasExtras50Str}
            onChange={(raw, parsed) => {
              setHorasExtras50Str(raw);
              setHorasExtras50(parsed);
            }}
          />

          <CurrencyInput
            label="Horas Extras 100% (opcional)"
            value={horasExtras100Str}
            onChange={(raw, parsed) => {
              setHorasExtras100Str(raw);
              setHorasExtras100(parsed);
            }}
          />

          <CurrencyInput
            label="Adicional Noturno (opcional)"
            value={adicionalNoturnoStr}
            onChange={(raw, parsed) => {
              setAdicionalNoturnoStr(raw);
              setAdicionalNoturno(parsed);
            }}
          />

          <CurrencyInput
            label="Periculosidade (opcional)"
            value={periculosidadeStr}
            onChange={(raw, parsed) => {
              setPericulosidadeStr(raw);
              setPericulosidade(parsed);
            }}
          />

          <CurrencyInput
            label="Insalubridade (opcional)"
            value={insalubridadeStr}
            onChange={(raw, parsed) => {
              setInsalubridadeStr(raw);
              setInsalubridade(parsed);
            }}
          />

          <CurrencyInput
            label="Outros Proventos (opcional)"
            value={outrosProventosStr}
            onChange={(raw, parsed) => {
              setOutrosProventosStr(raw);
              setOutrosProventos(parsed);
            }}
          />

          {/* Mes de Referencia */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Mes de Referencia
            </label>
            <input
              type="text"
              value={mesReferencia}
              onChange={(e) => setMesReferencia(e.target.value)}
              placeholder="Abril/2026"
              className="w-full bg-muted border-none rounded-lg p-4 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>

          {/* Dependentes IR */}
          <NumberInput
            label="Dependentes IR"
            value={dependentesStr}
            onChange={(raw, parsed) => {
              setDependentesStr(raw);
              setDependentes(Math.max(0, Math.floor(parsed)));
            }}
            placeholder="0"
            suffix="dep."
          />

          <VerifiedBadge text="Calculo conforme tabelas INSS e IRRF 2026 (Lei 15.270/2025)" />
        </>
      }
      resultPanel={
        <>
          <Card>
            <CardContent className="p-0 relative overflow-hidden">
              {/* Decorative glow */}
              <div className="absolute -top-20 -right-20 w-56 h-56 bg-primary/10 blur-[70px] rounded-full pointer-events-none" />

              <span className="text-xs font-bold tracking-widest text-primary uppercase block px-6 pt-6 pb-4 relative z-10">
                Visualizacao do Holerite
              </span>

              {/* Payslip Table */}
              <div className="bg-white dark:bg-muted/50 rounded-lg border border-border overflow-hidden mx-4 mb-4 relative z-10 divide-y divide-border">

                {/* Company Header */}
                <div className="bg-muted/30 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-sm text-foreground">
                        {nomeEmpresa || <span className="text-muted-foreground/40 italic font-normal">[Nome da Empresa]</span>}
                      </p>
                      {endereco && (
                        <p className="text-xs text-muted-foreground mt-0.5">{endereco}</p>
                      )}
                    </div>
                    <p className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                      CNPJ: {cnpj || <span className="text-muted-foreground/40 italic">--</span>}
                    </p>
                  </div>
                </div>

                {/* Employee Info */}
                <div className="p-4 text-xs grid grid-cols-2 gap-x-4 gap-y-1.5">
                  <div>
                    <span className="text-muted-foreground">Empregado: </span>
                    <span className="font-medium text-foreground">
                      {nomeEmpregado || <span className="text-muted-foreground/40 italic">--</span>}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">CPF: </span>
                    <span className="font-mono text-foreground">
                      {cpf || <span className="text-muted-foreground/40 italic">--</span>}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cargo: </span>
                    <span className="font-medium text-foreground">
                      {cargo || <span className="text-muted-foreground/40 italic">--</span>}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Admissao: </span>
                    <span className="font-mono text-foreground">
                      {dataAdmissao
                        ? new Date(dataAdmissao + "T00:00:00").toLocaleDateString("pt-BR")
                        : <span className="text-muted-foreground/40 italic">--</span>}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Departamento: </span>
                    <span className="font-medium text-foreground">
                      {departamento || <span className="text-muted-foreground/40 italic">--</span>}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Ref.: </span>
                    <span className="font-medium text-foreground">
                      {mesReferencia || <span className="text-muted-foreground/40 italic">--</span>}
                    </span>
                  </div>
                </div>

                {/* Proventos */}
                <div className="p-4">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    <span>Proventos</span>
                    <span>Valor</span>
                  </div>
                  {proventos.length === 0 ? (
                    <p className="text-xs text-muted-foreground/40 italic text-center py-2">
                      Informe o salario base para calcular
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {proventos.map((p) => (
                        <div key={p.label} className="flex justify-between text-xs">
                          <span className="text-foreground/80">{p.label}</span>
                          <span className="font-mono tabular-nums text-foreground">
                            {formatBRL(p.valor)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 pt-2 border-t border-border/50 flex justify-between text-xs font-bold">
                    <span className="text-foreground">Total Proventos</span>
                    <span className="font-mono tabular-nums text-foreground">
                      {calc ? formatBRL(calc.totalProventosBruto) : "R$ —"}
                    </span>
                  </div>
                </div>

                {/* Descontos */}
                <div className="p-4">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    <span>Descontos</span>
                    <span>Valor</span>
                  </div>
                  {!calc ? (
                    <p className="text-xs text-muted-foreground/40 italic text-center py-2">
                      Aguardando proventos
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-foreground/80">
                          INSS{" "}
                          {calc.resultado.inss.aliquotaEfetiva > 0 && (
                            <span className="text-muted-foreground">
                              ({(calc.resultado.inss.aliquotaEfetiva * 100).toFixed(2)}%)
                            </span>
                          )}
                        </span>
                        <span className="font-mono tabular-nums text-foreground">
                          {formatBRL(calc.resultado.inss.total)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-foreground/80">
                          IRRF{" "}
                          {!calc.resultado.irrf.isento && calc.resultado.irrf.aliquotaEfetiva > 0 && (
                            <span className="text-muted-foreground">
                              ({(calc.resultado.irrf.aliquotaEfetiva * 100).toFixed(2)}%)
                            </span>
                          )}
                          {calc.resultado.irrf.isento && (
                            <span className="text-muted-foreground">(isento)</span>
                          )}
                        </span>
                        <span className="font-mono tabular-nums text-foreground">
                          {formatBRL(calc.resultado.irrf.imposto)}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="mt-3 pt-2 border-t border-border/50 flex justify-between text-xs font-bold">
                    <span className="text-foreground">Total Descontos</span>
                    <span className="font-mono tabular-nums text-foreground">
                      {calc ? formatBRL(calc.resultado.totalDescontos) : "R$ —"}
                    </span>
                  </div>
                </div>

                {/* Liquido */}
                <div className="bg-primary/10 p-4 flex justify-between font-bold">
                  <span className="text-sm text-foreground">Liquido a Receber</span>
                  <span className="text-sm font-mono tabular-nums text-foreground">
                    {calc ? formatBRL(calc.resultado.salarioLiquido) : "R$ —"}
                  </span>
                </div>

                {/* Footer */}
                <div className="p-3 text-[10px] text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-1">
                  <div>
                    <span>Base INSS: </span>
                    <span className="font-mono tabular-nums">
                      {calc ? formatBRL(calc.totalProventosBruto) : "—"}
                    </span>
                  </div>
                  <div>
                    <span>Base IRRF: </span>
                    <span className="font-mono tabular-nums">
                      {calc ? formatBRL(calc.resultado.irrf.baseCalculo) : "—"}
                    </span>
                  </div>
                  <div>
                    <span>FGTS do Mes: </span>
                    <span className="font-mono tabular-nums">
                      {calc ? formatBRL(calc.fgts) : "—"}
                    </span>
                  </div>
                  <div>
                    <span>Dependentes IR: </span>
                    <span className="font-mono tabular-nums">{dependentes}</span>
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <Disclaimer text="Este holerite tem carater informativo. Os valores podem variar conforme convencao coletiva, beneficios e legislacao vigente. Consulte um contador ou advogado trabalhista." />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <ActionButtons onDownloadPDF={handleDownloadPDF} onShare={handleShare} />

          {/* CTA */}
          <CtaZattar
            title="Duvidas sobre seu holerite?"
            description="A Zattar Advogados pode analisar seus recibos de pagamento e verificar se todos os seus direitos trabalhistas estao sendo respeitados."
            buttonText="Fale com a Zattar"
          />
        </>
      }
    />
  );
}
