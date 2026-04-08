'use server';

/**
 * Server Actions para DRE (Demonstração de Resultado do Exercício)
 * Usa services locais da feature financeiro
 */

import {
    calcularDRE,
    calcularComparativoDRE,
    calcularEvolucaoAnual,
} from '../services/dre';
import { validarGerarDREDTO, isPeriodoDREValido } from '../domain/dre';
import type { PeriodoDRE, DRE } from '../domain/dre';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// ============================================================================
// Types
// ============================================================================

export interface GerarDREParams {
    dataInicio: string;
    dataFim: string;
    tipo?: PeriodoDRE;
    incluirComparativo?: boolean;
    incluirOrcado?: boolean;
}

export interface DREResult {
    dre: DRE;
    comparativo?: {
        periodoAnterior?: DRE;
        orcado?: DRE;
        variacoes?: Record<string, number>;
        variacoesOrcado?: Record<string, number>;
    };
    geradoEm: string;
}

export interface EvolucaoDREItem {
    mes: number;
    mesNome: string;
    ano: number;
    receitaLiquida: number;
    lucroOperacional: number;
    lucroLiquido: number;
    margemLiquida: number;
}

// ============================================================================
// Helpers (PDF/CSV generation)
// ============================================================================

const formatarValor = (valor: number): string => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(valor);
};

const formatarPercentual = (valor: number): string => {
    return `${valor >= 0 ? '' : ''}${valor.toFixed(2)}%`;
};

const formatarData = (data: string): string => {
    return new Date(data).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

function escapeCSV(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

function calcularPercent(valor: number, base: number): number {
    if (base === 0) return 0;
    return (valor / base) * 100;
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Gera DRE para um período
 */
export async function actionGerarDRE(params: GerarDREParams) {
    try {
        const { dataInicio, dataFim, tipo, incluirComparativo, incluirOrcado } = params;

        // Validar parâmetros
        if (!dataInicio || !dataFim) {
            return { success: false, error: 'Parâmetros dataInicio e dataFim são obrigatórios' };
        }

        const dto = {
            dataInicio,
            dataFim,
            tipo: tipo && isPeriodoDREValido(tipo) ? tipo : undefined,
            incluirComparativo: incluirComparativo || false,
            incluirOrcado: incluirOrcado || false,
        };

        if (!validarGerarDREDTO(dto)) {
            return { success: false, error: 'Parâmetros inválidos. Verifique as datas e o tipo de período.' };
        }

        // Gerar DRE
        let responseData: DREResult;

        if (incluirComparativo || incluirOrcado) {
            const comparativo = await calcularComparativoDRE(dto);
            responseData = {
                dre: comparativo.periodoAtual,
                comparativo: {
                    periodoAnterior: comparativo.periodoAnterior,
                    orcado: comparativo.orcado,
                    variacoes: comparativo.variacoes,
                    variacoesOrcado: comparativo.variacoesOrcado,
                },
                geradoEm: new Date().toISOString(),
            };
        } else {
            const dre = await calcularDRE(dto);
            responseData = {
                dre,
                geradoEm: new Date().toISOString(),
            };
        }

        return { success: true, data: responseData };
    } catch (error) {
        console.error('Erro ao gerar DRE:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Erro interno' };
    }
}

/**
 * Obtém evolução mensal do DRE para um ano
 */
export async function actionObterEvolucaoDRE(ano: number) {
    try {
        // Validar ano
        if (!ano || ano < 2020 || ano > 2100) {
            return { success: false, error: 'Ano inválido. Deve estar entre 2020 e 2100.' };
        }

        const evolucao = await calcularEvolucaoAnual(ano);

        return {
            success: true,
            data: {
                evolucao,
                ano,
                geradoEm: new Date().toISOString(),
            },
        };
    } catch (error) {
        console.error('Erro ao buscar evolução DRE:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Erro interno' };
    }
}

/**
 * Gera CSV do DRE
 */
export async function actionExportarDRECSV(params: GerarDREParams) {
    try {
        const { dataInicio, dataFim, tipo } = params;

        if (!dataInicio || !dataFim) {
            return { success: false, error: 'Parâmetros dataInicio e dataFim são obrigatórios' };
        }

        const dto = {
            dataInicio,
            dataFim,
            tipo: tipo && isPeriodoDREValido(tipo) ? tipo : undefined,
        };

        if (!validarGerarDREDTO(dto)) {
            return { success: false, error: 'Parâmetros inválidos. Verifique as datas.' };
        }

        const dre = await calcularDRE(dto);
        const csvContent = gerarDRECSV(dre);

        return {
            success: true,
            data: {
                content: csvContent,
                filename: `dre_${dre.periodo.descricao}_${dataInicio}_${dataFim}.csv`,
                contentType: 'text/csv',
            },
        };
    } catch (error) {
        console.error('Erro ao exportar DRE:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Erro interno' };
    }
}

/**
 * Gera PDF do DRE (retorna Base64)
 */
export async function actionExportarDREPDF(params: GerarDREParams) {
    try {
        const { dataInicio, dataFim, tipo } = params;

        if (!dataInicio || !dataFim) {
            return { success: false, error: 'Parâmetros dataInicio e dataFim são obrigatórios' };
        }

        const dto = {
            dataInicio,
            dataFim,
            tipo: tipo && isPeriodoDREValido(tipo) ? tipo : undefined,
        };

        if (!validarGerarDREDTO(dto)) {
            return { success: false, error: 'Parâmetros inválidos. Verifique as datas.' };
        }

        const dre = await calcularDRE(dto);
        const pdfBytes = await gerarDREPDF(dre);
        const base64 = Buffer.from(pdfBytes).toString('base64');

        return {
            success: true,
            data: {
                content: base64,
                filename: `dre_${dre.periodo.descricao}_${dataInicio}_${dataFim}.pdf`,
                contentType: 'application/pdf',
            },
        };
    } catch (error) {
        console.error('Erro ao exportar DRE PDF:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Erro interno' };
    }
}

// ============================================================================
// CSV/PDF Generation helpers
// ============================================================================

function gerarDRECSV(dre: DRE): string {
    const linhas: string[] = [];
    const sep = ',';

    linhas.push('DEMONSTRAÇÃO DE RESULTADO DO EXERCÍCIO (DRE)');
    linhas.push(`Período: ${dre.periodo.descricao}`);
    linhas.push(`De ${dre.periodo.dataInicio} a ${dre.periodo.dataFim}`);
    linhas.push(`Gerado em: ${formatarData(dre.geradoEm)}`);
    linhas.push('');

    linhas.push('Descrição' + sep + 'Valor' + sep + '% Receita');
    linhas.push('');

    const { resumo } = dre;

    linhas.push('RECEITAS' + sep + sep);
    linhas.push('  Receita Bruta' + sep + escapeCSV(resumo.receitaBruta) + sep + '100.00%');
    linhas.push('  (-) Deduções' + sep + escapeCSV(-resumo.deducoes) + sep + formatarPercentual(-calcularPercent(resumo.deducoes, resumo.receitaLiquida)));
    linhas.push('  = Receita Líquida' + sep + escapeCSV(resumo.receitaLiquida) + sep + '100.00%');
    linhas.push('');

    linhas.push('CUSTOS E DESPESAS' + sep + sep);
    linhas.push('  (-) Custos Diretos' + sep + escapeCSV(-resumo.custosDiretos) + sep + formatarPercentual(-calcularPercent(resumo.custosDiretos, resumo.receitaLiquida)));
    linhas.push('  = Lucro Bruto' + sep + escapeCSV(resumo.lucroBruto) + sep + formatarPercentual(resumo.margemBruta));
    linhas.push('');

    linhas.push('  (-) Despesas Operacionais' + sep + escapeCSV(-resumo.despesasOperacionais) + sep + formatarPercentual(-calcularPercent(resumo.despesasOperacionais, resumo.receitaLiquida)));
    linhas.push('  = Lucro Operacional' + sep + escapeCSV(resumo.lucroOperacional) + sep + formatarPercentual(resumo.margemOperacional));
    linhas.push('');

    linhas.push('  (+) Depreciação/Amortização' + sep + escapeCSV(resumo.depreciacaoAmortizacao) + sep + formatarPercentual(calcularPercent(resumo.depreciacaoAmortizacao, resumo.receitaLiquida)));
    linhas.push('  = EBITDA' + sep + escapeCSV(resumo.ebitda) + sep + formatarPercentual(resumo.margemEBITDA));
    linhas.push('');

    linhas.push('RESULTADO FINANCEIRO' + sep + sep);
    linhas.push('  (+) Receitas Financeiras' + sep + escapeCSV(resumo.receitasFinanceiras) + sep + formatarPercentual(calcularPercent(resumo.receitasFinanceiras, resumo.receitaLiquida)));
    linhas.push('  (-) Despesas Financeiras' + sep + escapeCSV(-resumo.despesasFinanceiras) + sep + formatarPercentual(-calcularPercent(resumo.despesasFinanceiras, resumo.receitaLiquida)));
    linhas.push('  = Resultado Financeiro' + sep + escapeCSV(resumo.resultadoFinanceiro) + sep + formatarPercentual(calcularPercent(resumo.resultadoFinanceiro, resumo.receitaLiquida)));
    linhas.push('');

    linhas.push('RESULTADO' + sep + sep);
    linhas.push('  = Resultado Antes Impostos' + sep + escapeCSV(resumo.resultadoAntesImposto) + sep + formatarPercentual(calcularPercent(resumo.resultadoAntesImposto, resumo.receitaLiquida)));
    linhas.push('  (-) Impostos' + sep + escapeCSV(-resumo.impostos) + sep + formatarPercentual(-calcularPercent(resumo.impostos, resumo.receitaLiquida)));
    linhas.push('  = LUCRO LÍQUIDO' + sep + escapeCSV(resumo.lucroLiquido) + sep + formatarPercentual(resumo.margemLiquida));
    linhas.push('');

    // Detalhamento
    linhas.push('');
    linhas.push('DETALHAMENTO - RECEITAS POR CATEGORIA');
    linhas.push('Categoria' + sep + 'Valor' + sep + '% Receita');
    for (const cat of dre.receitasPorCategoria) {
        linhas.push(escapeCSV(cat.categoria) + sep + escapeCSV(cat.valor) + sep + formatarPercentual(cat.percentualReceita));
    }
    linhas.push('');

    linhas.push('DETALHAMENTO - DESPESAS POR CATEGORIA');
    linhas.push('Categoria' + sep + 'Valor' + sep + '% Receita');
    for (const cat of dre.despesasPorCategoria) {
        linhas.push(escapeCSV(cat.categoria) + sep + escapeCSV(cat.valor) + sep + formatarPercentual(cat.percentualReceita));
    }

    return linhas.join('\n');
}

async function gerarDREPDF(dre: DRE): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pageWidth = 595;
    const pageHeight = 842;
    const margin = 50;
    const fontSize = 10;
    const lineHeight = 14;
    const contentWidth = pageWidth - margin * 2;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    const checkNewPage = (requiredSpace: number = lineHeight * 3) => {
        if (y < margin + requiredSpace) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            y = pageHeight - margin;
        }
    };

    const drawHorizontalLine = () => {
        checkNewPage();
        page.drawLine({
            start: { x: margin, y },
            end: { x: pageWidth - margin, y },
            thickness: 0.5,
            color: rgb(0.8, 0.8, 0.8),
        });
        y -= lineHeight;
    };

    // Cabeçalho
    page.drawText('DEMONSTRAÇÃO DE RESULTADO DO EXERCÍCIO (DRE)', {
        x: margin,
        y,
        size: 16,
        font: boldFont,
        color: rgb(0, 0, 0),
    });
    y -= 25;

    page.drawText(dre.periodo.descricao, {
        x: margin,
        y,
        size: 12,
        font: boldFont,
        color: rgb(0.3, 0.3, 0.3),
    });
    y -= 18;

    page.drawText(`Período: ${dre.periodo.dataInicio} a ${dre.periodo.dataFim}`, {
        x: margin,
        y,
        size: fontSize,
        font,
    });
    y -= 14;

    page.drawText(`Gerado em: ${formatarData(dre.geradoEm)}`, {
        x: margin,
        y,
        size: fontSize,
        font,
        color: rgb(0.5, 0.5, 0.5),
    });
    y -= 20;
    drawHorizontalLine();

    const { resumo } = dre;
    const colDescX = margin;
    const colValorX = margin + 280;
    const colPercX = margin + 400;

    const drawDRELine = (
        descricao: string,
        valor: number,
        percentual: number | null,
        options: {
            bold?: boolean;
            indent?: number;
            highlight?: boolean;
            isNegative?: boolean;
        } = {}
    ) => {
        checkNewPage();
        const { bold = false, indent = 0, highlight = false, isNegative = false } = options;
        const textFont = bold ? boldFont : font;
        const size = bold ? 11 : fontSize;

        if (highlight) {
            page.drawRectangle({
                x: margin - 5,
                y: y - 3,
                width: contentWidth + 10,
                height: lineHeight + 2,
                color: rgb(0.95, 0.95, 0.95),
            });
        }

        page.drawText(descricao, {
            x: colDescX + indent,
            y,
            size,
            font: textFont,
            color: rgb(0, 0, 0),
        });

        const valorColor = valor < 0 ? rgb(0.8, 0, 0) : rgb(0, 0, 0);
        page.drawText(formatarValor(isNegative ? -Math.abs(valor) : valor), {
            x: colValorX,
            y,
            size,
            font: textFont,
            color: isNegative ? rgb(0.6, 0, 0) : valorColor,
        });

        if (percentual !== null) {
            page.drawText(formatarPercentual(percentual), {
                x: colPercX,
                y,
                size,
                font,
                color: rgb(0.4, 0.4, 0.4),
            });
        }

        y -= lineHeight + 2;
    };

    // Cabeçalho da tabela
    page.drawRectangle({
        x: margin - 5,
        y: y - 3,
        width: contentWidth + 10,
        height: lineHeight + 4,
        color: rgb(0.2, 0.2, 0.2),
    });
    page.drawText('Descrição', { x: colDescX, y, size: 10, font: boldFont, color: rgb(1, 1, 1) });
    page.drawText('Valor (R$)', { x: colValorX, y, size: 10, font: boldFont, color: rgb(1, 1, 1) });
    page.drawText('% Receita', { x: colPercX, y, size: 10, font: boldFont, color: rgb(1, 1, 1) });
    y -= lineHeight + 8;

    // Linhas do DRE
    drawDRELine('RECEITAS', 0, null, { bold: true });
    drawDRELine('Receita Bruta', resumo.receitaBruta, 100);
    drawDRELine('(-) Deduções', resumo.deducoes, -calcularPercent(resumo.deducoes, resumo.receitaLiquida), { indent: 10, isNegative: true });
    drawDRELine('= Receita Líquida', resumo.receitaLiquida, 100, { bold: true, highlight: true });
    y -= 5;

    drawDRELine('CUSTOS', 0, null, { bold: true });
    drawDRELine('(-) Custos Diretos', resumo.custosDiretos, -calcularPercent(resumo.custosDiretos, resumo.receitaLiquida), { indent: 10, isNegative: true });
    drawDRELine('= Lucro Bruto', resumo.lucroBruto, resumo.margemBruta, { bold: true, highlight: true });
    y -= 5;

    drawDRELine('DESPESAS OPERACIONAIS', 0, null, { bold: true });
    drawDRELine('(-) Despesas Operacionais', resumo.despesasOperacionais, -calcularPercent(resumo.despesasOperacionais, resumo.receitaLiquida), { indent: 10, isNegative: true });
    drawDRELine('= Lucro Operacional', resumo.lucroOperacional, resumo.margemOperacional, { bold: true, highlight: true });
    y -= 5;

    drawDRELine('(+) Depreciação/Amortização', resumo.depreciacaoAmortizacao, calcularPercent(resumo.depreciacaoAmortizacao, resumo.receitaLiquida), { indent: 10 });
    drawDRELine('= EBITDA', resumo.ebitda, resumo.margemEBITDA, { bold: true, highlight: true });
    y -= 5;

    drawDRELine('RESULTADO FINANCEIRO', 0, null, { bold: true });
    drawDRELine('(+) Receitas Financeiras', resumo.receitasFinanceiras, calcularPercent(resumo.receitasFinanceiras, resumo.receitaLiquida), { indent: 10 });
    drawDRELine('(-) Despesas Financeiras', resumo.despesasFinanceiras, -calcularPercent(resumo.despesasFinanceiras, resumo.receitaLiquida), { indent: 10, isNegative: true });
    y -= 5;

    drawDRELine('= Resultado Antes Impostos', resumo.resultadoAntesImposto, calcularPercent(resumo.resultadoAntesImposto, resumo.receitaLiquida), { bold: true });
    drawDRELine('(-) Impostos', resumo.impostos, -calcularPercent(resumo.impostos, resumo.receitaLiquida), { indent: 10, isNegative: true });
    y -= 5;

    // Lucro Líquido
    const lucroColor = resumo.lucroLiquido >= 0 ? rgb(0, 0.5, 0) : rgb(0.7, 0, 0);
    page.drawRectangle({
        x: margin - 5,
        y: y - 3,
        width: contentWidth + 10,
        height: lineHeight + 4,
        color: resumo.lucroLiquido >= 0 ? rgb(0.9, 1, 0.9) : rgb(1, 0.9, 0.9),
    });
    page.drawText('= LUCRO LÍQUIDO', {
        x: colDescX,
        y,
        size: 12,
        font: boldFont,
        color: lucroColor,
    });
    page.drawText(formatarValor(resumo.lucroLiquido), {
        x: colValorX,
        y,
        size: 12,
        font: boldFont,
        color: lucroColor,
    });
    page.drawText(formatarPercentual(resumo.margemLiquida), {
        x: colPercX,
        y,
        size: 11,
        font: boldFont,
        color: lucroColor,
    });
    y -= lineHeight + 15;

    // Rodapé
    const totalPages = pdfDoc.getPageCount();
    const pages = pdfDoc.getPages();
    for (let i = 0; i < totalPages; i++) {
        const currentPage = pages[i];
        currentPage.drawText(`Página ${i + 1} de ${totalPages}`, {
            x: pageWidth - margin - 60,
            y: 20,
            size: 8,
            font,
            color: rgb(0.5, 0.5, 0.5),
        });

        currentPage.drawText('Sistema Synthropic - Gestão Financeira', {
            x: margin,
            y: 20,
            size: 8,
            font,
            color: rgb(0.5, 0.5, 0.5),
        });
    }

    return await pdfDoc.save();
}
