/**
 * Exportações para Contas a Receber
 * Migrado de src/app/_lib/financeiro/export-contas-receber.ts
 */

import { rgb } from 'pdf-lib';
import type {
    ContaReceberComDetalhes,
    ContasReceberFilters,
    ResumoInadimplencia,
} from '@/app/(authenticated)/financeiro/domain/lancamentos';
import {
    formatarData,
    formatarValor,
    gerarCSV,
    sanitizeFileName,
    gerarPDFBase,
    downloadCSV,
    downloadPDF,
} from './helpers';

export function exportarContasReceberCSV(contas: ContaReceberComDetalhes[]): void {
    const cabecalhos = ['Descrição', 'Cliente', 'Vencimento', 'Valor', 'Status'];
    const linhas: (string | number | null | undefined)[][] = contas.map((conta) => [
        conta.descricao,
        (conta.cliente?.nomeFantasia || conta.cliente?.razaoSocial) || '',
        conta.dataVencimento ? formatarData(conta.dataVencimento) : '-',
        conta.valor,
        conta.status,
    ]);

    const csv = gerarCSV(cabecalhos, linhas);
    downloadCSV(csv, sanitizeFileName('contas_a_receber') + '.csv');
}

export function gerarContasReceberCSV(contas: ContaReceberComDetalhes[]): string {
    const cabecalhos = ['Descrição', 'Cliente', 'Vencimento', 'Valor', 'Status'];
    const linhas: (string | number | null | undefined)[][] = contas.map((conta) => [
        conta.descricao,
        (conta.cliente?.nomeFantasia || conta.cliente?.razaoSocial) || '',
        conta.dataVencimento ? formatarData(conta.dataVencimento) : '-',
        conta.valor,
        conta.status,
    ]);

    return gerarCSV(cabecalhos, linhas);
}

export async function exportarContasReceberPDF(
    contas: ContaReceberComDetalhes[],
    filtros?: ContasReceberFilters
): Promise<void> {
    const { base, cursorY } = await gerarPDFBase('Contas a Receber', filtros?.busca);
    let y = cursorY;
    const { pdfDoc, page, font, boldFont, pageWidth, margin, lineHeight } = base;

    if (filtros) {
        page.drawText(`Filtros: ${JSON.stringify(filtros)}`, {
            x: margin,
            y,
            size: 9,
            font,
            color: rgb(0.4, 0.4, 0.4),
        });
        y -= lineHeight + 4;
    }

    const headers = ['Cliente', 'Descrição', 'Vencimento', 'Valor', 'Status'];
    const colX = [margin, margin + 120, margin + 320, margin + 410, margin + 480];

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

    for (const conta of contas.slice(0, 50)) {
        if (y < margin + lineHeight * 2) {
            const nova = pdfDoc.addPage([pageWidth, base.pageHeight]);
            currentPage = nova;
            y = base.pageHeight - margin;
        }

        currentPage.drawText((conta.cliente?.nomeFantasia || conta.cliente?.razaoSocial) || '-', {
            x: colX[0],
            y,
            size: 9,
            font,
        });
        const desc = conta.descricao?.length > 35 ? `${conta.descricao.slice(0, 32)}...` : conta.descricao;
        currentPage.drawText(desc, { x: colX[1], y, size: 9, font });
        currentPage.drawText(conta.dataVencimento ? formatarData(conta.dataVencimento) : '-', {
            x: colX[2],
            y,
            size: 9,
            font,
        });
        currentPage.drawText(formatarValor(conta.valor), { x: colX[3], y, size: 9, font });
        currentPage.drawText(conta.status, { x: colX[4], y, size: 9, font });

        y -= lineHeight;
    }

    await downloadPDF(pdfDoc, sanitizeFileName('contas_a_receber') + '.pdf');
}

export async function gerarContasReceberPDFBytes(
    contas: ContaReceberComDetalhes[],
    filtros?: ContasReceberFilters
): Promise<Uint8Array> {
    const { base, cursorY } = await gerarPDFBase('Contas a Receber', filtros?.busca);
    let y = cursorY;
    const { pdfDoc, page, font, boldFont, pageWidth, margin, lineHeight } = base;

    if (filtros) {
        page.drawText(`Filtros: ${JSON.stringify(filtros)}`, {
            x: margin,
            y,
            size: 9,
            font,
            color: rgb(0.4, 0.4, 0.4),
        });
        y -= lineHeight + 4;
    }

    const headers = ['Cliente', 'Descrição', 'Vencimento', 'Valor', 'Status'];
    const colX = [margin, margin + 120, margin + 320, margin + 410, margin + 480];

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

    for (const conta of contas.slice(0, 50)) {
        if (y < margin + lineHeight * 2) {
            const nova = pdfDoc.addPage([pageWidth, base.pageHeight]);
            currentPage = nova;
            y = base.pageHeight - margin;
        }

        currentPage.drawText((conta.cliente?.nomeFantasia || conta.cliente?.razaoSocial) || '-', {
            x: colX[0],
            y,
            size: 9,
            font,
        });
        const desc = conta.descricao?.length > 35 ? `${conta.descricao.slice(0, 32)}...` : conta.descricao;
        currentPage.drawText(desc, { x: colX[1], y, size: 9, font });
        currentPage.drawText(conta.dataVencimento ? formatarData(conta.dataVencimento) : '-', {
            x: colX[2],
            y,
            size: 9,
            font,
        });
        currentPage.drawText(formatarValor(conta.valor), { x: colX[3], y, size: 9, font });
        currentPage.drawText(conta.status, { x: colX[4], y, size: 9, font });

        y -= lineHeight;
    }

    return await pdfDoc.save();
}

export async function exportarRelatorioInadimplenciaPDF(
    resumo: ResumoInadimplencia
): Promise<void> {
    const { base, cursorY } = await gerarPDFBase('Relatório de Inadimplência');
    let y = cursorY;
    const { pdfDoc, page, font, boldFont, margin, lineHeight } = base;

    const blocos: Array<{ titulo: string; dado: { quantidade: number; valorTotal: number } }> = [
        { titulo: 'Vencidas', dado: resumo.vencidas },
        { titulo: 'Vencendo Hoje', dado: resumo.vencendoHoje },
        { titulo: 'Próximos 7 dias', dado: resumo.vencendoEm7Dias },
        { titulo: 'Próximos 30 dias', dado: resumo.vencendoEm30Dias },
    ];

    for (const bloco of blocos) {
        page.drawText(bloco.titulo, { x: margin, y, size: 12, font: boldFont });
        y -= lineHeight;
        page.drawText(
            `Quantidade: ${bloco.dado.quantidade} | Valor: ${formatarValor(bloco.dado.valorTotal)}`,
            { x: margin, y, size: 10, font }
        );
        y -= lineHeight;
    }

    await downloadPDF(pdfDoc, sanitizeFileName('inadimplencia') + '.pdf');
}
