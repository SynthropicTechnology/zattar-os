/**
 * Exportações para Plano de Contas
 * Migrado de src/app/_lib/financeiro/export-plano-contas.ts
 */

import type { PlanoContaHierarquico } from '@/app/(authenticated)/financeiro/domain/plano-contas';
import {
    formatarValor,
    gerarCSV,
    sanitizeFileName,
    gerarPDFBase,
    downloadCSV,
    downloadPDF,
} from './helpers';

// Helper para achatar hierarquia
interface ContaAchatada {
    nome: string;
    codigo?: string;
    natureza?: string;
    nivel?: string;
    saldoInicial?: number;
    nivelIndentacao: number;
}

function achatarHierarquia(contas: PlanoContaHierarquico[], nivel: number = 0): ContaAchatada[] {
    const resultado: ContaAchatada[] = [];

    for (const conta of contas) {
        resultado.push({
            nome: conta.nome,
            codigo: conta.codigo,
            natureza: conta.natureza,
            nivel: conta.nivel,
            saldoInicial: conta.saldoInicial,
            nivelIndentacao: nivel,
        });

        if (conta.filhas && conta.filhas.length > 0) {
            resultado.push(...achatarHierarquia(conta.filhas, nivel + 1));
        }
    }

    return resultado;
}

const indentarNome = (nome: string, nivel: number): string => {
    return `${'  '.repeat(nivel)}${nome}`;
};

export function exportarPlanoContasCSV(contas: PlanoContaHierarquico[]): void {
    const linhasHierarquia = achatarHierarquia(contas);

    const cabecalhos = ['Nome', 'Código', 'Natureza', 'Nível', 'Saldo Inicial'];
    const linhas = linhasHierarquia.map((conta) => [
        indentarNome(conta.nome, conta.nivelIndentacao || 0),
        conta.codigo || '',
        conta.natureza || '',
        conta.nivel || '',
        conta.saldoInicial ?? 0,
    ]);

    const csv = gerarCSV(cabecalhos, linhas);
    downloadCSV(csv, sanitizeFileName('plano_de_contas') + '.csv');
}

export function gerarPlanoContasCSV(contas: PlanoContaHierarquico[]): string {
    const linhasHierarquia = achatarHierarquia(contas);

    const cabecalhos = ['Nome', 'Código', 'Natureza', 'Nível', 'Saldo Inicial'];
    const linhas = linhasHierarquia.map((conta) => [
        indentarNome(conta.nome, conta.nivelIndentacao || 0),
        conta.codigo || '',
        conta.natureza || '',
        conta.nivel || '',
        conta.saldoInicial ?? 0,
    ]);

    return gerarCSV(cabecalhos, linhas);
}

export async function exportarPlanoContasPDF(contas: PlanoContaHierarquico[]): Promise<void> {
    const pdfDoc = await gerarPlanoContasPDFDocument(contas);
    await downloadPDF(pdfDoc, sanitizeFileName('plano_de_contas') + '.pdf');
}

export async function gerarPlanoContasPDFBytes(contas: PlanoContaHierarquico[]): Promise<Uint8Array> {
    const { base, cursorY } = await gerarPDFBase('Plano de Contas');
    let y = cursorY;
    const { pdfDoc, font, boldFont, margin, lineHeight } = base;

    const desenhar = (lista: PlanoContaHierarquico[], nivel: number = 0) => {
        for (const conta of lista) {
            if (y < margin + lineHeight * 2) {
                const nova = pdfDoc.addPage([base.pageWidth, base.pageHeight]);
                y = base.pageHeight - margin;
                base.page = nova;
            }

            base.page.drawText(indentarNome(conta.nome, nivel), {
                x: margin,
                y,
                size: 10,
                font: nivel === 0 ? boldFont : font,
            });

            base.page.drawText(conta.codigo || '-', {
                x: margin + 260,
                y,
                size: 9,
                font,
            });

            base.page.drawText(conta.natureza || '-', {
                x: margin + 340,
                y,
                size: 9,
                font,
            });

            if (conta.saldoInicial !== undefined) {
                base.page.drawText(formatarValor(conta.saldoInicial), {
                    x: margin + 430,
                    y,
                    size: 9,
                    font,
                });
            }

            y -= lineHeight;

            if (conta.filhas && conta.filhas.length > 0) {
                desenhar(conta.filhas, nivel + 1);
            }
        }
    };

    desenhar(contas, 0);

    return await pdfDoc.save();
}

async function gerarPlanoContasPDFDocument(contas: PlanoContaHierarquico[]) {
    const { base, cursorY } = await gerarPDFBase('Plano de Contas');
    let y = cursorY;
    const { pdfDoc, font, boldFont, margin, lineHeight } = base;

    const desenhar = (lista: PlanoContaHierarquico[], nivel: number = 0) => {
        for (const conta of lista) {
            if (y < margin + lineHeight * 2) {
                const nova = pdfDoc.addPage([base.pageWidth, base.pageHeight]);
                y = base.pageHeight - margin;
                base.page = nova;
            }

            base.page.drawText(indentarNome(conta.nome, nivel), {
                x: margin,
                y,
                size: 10,
                font: nivel === 0 ? boldFont : font,
            });

            base.page.drawText(conta.codigo || '-', {
                x: margin + 260,
                y,
                size: 9,
                font,
            });

            base.page.drawText(conta.natureza || '-', {
                x: margin + 340,
                y,
                size: 9,
                font,
            });

            if (conta.saldoInicial !== undefined) {
                base.page.drawText(formatarValor(conta.saldoInicial), {
                    x: margin + 430,
                    y,
                    size: 9,
                    font,
                });
            }

            y -= lineHeight;

            if (conta.filhas && conta.filhas.length > 0) {
                desenhar(conta.filhas, nivel + 1);
            }
        }
    };

    desenhar(contas, 0);

    return pdfDoc;
}
