/**
 * Exportações para Conciliação Bancária
 * Migrado de src/app/_lib/financeiro/export-conciliacao.ts
 */

import { rgb } from 'pdf-lib';
import type {
    TransacaoImportada as TransacaoBancariaImportada,
    ConciliacaoBancaria,
} from '@/app/(authenticated)/financeiro/domain/conciliacao';
import {
    formatarData,
    gerarCSV,
    sanitizeFileName,
    gerarPDFBase,
    downloadCSV,
    downloadPDF,
} from './helpers';

export function exportarTransacoesImportadasCSV(
    transacoes: TransacaoBancariaImportada[]
): void {
    const cabecalhos = ['Data', 'Descrição', 'Valor', 'Tipo', 'Documento', 'Saldo'];
    const linhas = transacoes.map((t) => [
        formatarData(t.dataTransacao),
        t.descricao,
        t.valor,
        t.tipoTransacao,
        t.documento || '',
        t.saldoExtrato ?? '',
    ]);

    const csv = gerarCSV(cabecalhos, linhas);
    downloadCSV(csv, sanitizeFileName('transacoes_importadas') + '.csv');
}

export function gerarTransacoesCSV(transacoes: TransacaoBancariaImportada[]): string {
    const cabecalhos = ['Data', 'Descrição', 'Valor', 'Tipo', 'Documento', 'Saldo'];
    const linhas = transacoes.map((t) => [
        formatarData(t.dataTransacao),
        t.descricao,
        t.valor,
        t.tipoTransacao,
        t.documento || '',
        t.saldoExtrato ?? '',
    ]);

    return gerarCSV(cabecalhos, linhas);
}

export async function exportarConciliacoesPDF(
    conciliacoes: ConciliacaoBancaria[],
    periodo: { inicio: string; fim: string }
): Promise<void> {
    const { base, cursorY } = await gerarPDFBase(
        'Relatório de Conciliações',
        `Período: ${periodo.inicio} a ${periodo.fim}`
    );
    let y = cursorY;
    const { pdfDoc, page, font, boldFont, pageWidth, margin, lineHeight } = base;

    const headers = ['ID', 'Status', 'Tipo', 'Data', 'Score'];
    const colX = [margin, margin + 60, margin + 150, margin + 260, margin + 360];

    page.drawRectangle({
        x: margin,
        y: y - 2,
        width: pageWidth - margin * 2,
        height: lineHeight + 4,
        color: rgb(0.95, 0.95, 0.95),
    });
    headers.forEach((h, i) => page.drawText(h, { x: colX[i], y, size: 9, font: boldFont }));
    y -= lineHeight + 6;

    let currentPage = page;

    for (const conc of conciliacoes.slice(0, 80)) {
        if (y < margin + lineHeight * 2) {
            const nova = pdfDoc.addPage([pageWidth, base.pageHeight]);
            currentPage = nova;
            y = base.pageHeight - margin;
        }

        currentPage.drawText(String(conc.id), { x: colX[0], y, size: 9, font });
        currentPage.drawText(conc.status, { x: colX[1], y, size: 9, font });
        currentPage.drawText(conc.tipoConciliacao || '-', { x: colX[2], y, size: 9, font });
        currentPage.drawText(conc.dataConciliacao ? formatarData(conc.dataConciliacao) : '-', {
            x: colX[3],
            y,
            size: 9,
            font,
        });
        currentPage.drawText(conc.scoreSimilaridade != null ? `${conc.scoreSimilaridade}%` : '-', {
            x: colX[4],
            y,
            size: 9,
            font,
        });

        y -= lineHeight;
    }

    await downloadPDF(pdfDoc, sanitizeFileName('conciliacoes') + '.pdf');
}

export async function gerarConciliacoesPDFBytes(
    conciliacoes: ConciliacaoBancaria[],
    periodo: { inicio: string; fim: string }
): Promise<Uint8Array> {
    const { base, cursorY } = await gerarPDFBase(
        'Relatório de Conciliações',
        `Período: ${periodo.inicio} a ${periodo.fim}`
    );
    let y = cursorY;
    const { pdfDoc, page, font, boldFont, pageWidth, margin, lineHeight } = base;

    const headers = ['ID', 'Status', 'Tipo', 'Data', 'Score'];
    const colX = [margin, margin + 60, margin + 150, margin + 260, margin + 360];

    page.drawRectangle({
        x: margin,
        y: y - 2,
        width: pageWidth - margin * 2,
        height: lineHeight + 4,
        color: rgb(0.95, 0.95, 0.95),
    });
    headers.forEach((h, i) => page.drawText(h, { x: colX[i], y, size: 9, font: boldFont }));
    y -= lineHeight + 6;

    let currentPage = page;

    for (const conc of conciliacoes.slice(0, 80)) {
        if (y < margin + lineHeight * 2) {
            const nova = pdfDoc.addPage([pageWidth, base.pageHeight]);
            currentPage = nova;
            y = base.pageHeight - margin;
        }

        currentPage.drawText(String(conc.id), { x: colX[0], y, size: 9, font });
        currentPage.drawText(conc.status, { x: colX[1], y, size: 9, font });
        currentPage.drawText(conc.tipoConciliacao || '-', { x: colX[2], y, size: 9, font });
        currentPage.drawText(conc.dataConciliacao ? formatarData(conc.dataConciliacao) : '-', {
            x: colX[3],
            y,
            size: 9,
            font,
        });
        currentPage.drawText(conc.scoreSimilaridade != null ? `${conc.scoreSimilaridade}%` : '-', {
            x: colX[4],
            y,
            size: 9,
            font,
        });

        y -= lineHeight;
    }

    return await pdfDoc.save();
}
