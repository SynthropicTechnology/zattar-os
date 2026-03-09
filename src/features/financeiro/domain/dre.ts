/**
 * Dominio de DRE (Demonstracao de Resultado do Exercicio)
 * Entidades e regras de negocio puras (sem dependencia de infraestrutura)
 */

import { toDateString } from '@/lib/date-utils';

// ============================================================================
// Enums e tipos literais (From Types)
// ============================================================================

export type PeriodoDRE = 'mensal' | 'trimestral' | 'semestral' | 'anual';
export type TipoComparativo = 'periodo_anterior' | 'mesmo_periodo_ano_anterior' | 'orcado';
export type TipoConta = 'receita' | 'despesa' | 'custo';
export type TendenciaDRE = 'crescente' | 'decrescente' | 'estavel';

// ============================================================================
// Interfaces (From Types)
// ============================================================================

export interface ItemDRE {
    codigo: string;
    descricao: string;
    tipo: TipoConta;
    valor: number;
    percentualReceita: number;
    subItens?: ItemDRE[];
}

export interface CategoriaDRE {
    categoria: string;
    valor: number;
    percentualReceita: number;
}

export interface ResumoDRE {
    receitaBruta: number;
    deducoes: number;
    receitaLiquida: number;
    custosDiretos: number;
    lucroBruto: number;
    margemBruta: number;
    despesasOperacionais: number;
    lucroOperacional: number;
    margemOperacional: number;
    depreciacaoAmortizacao: number;
    ebitda: number;
    margemEBITDA: number;
    receitasFinanceiras: number;
    despesasFinanceiras: number;
    resultadoFinanceiro: number;
    resultadoAntesImposto: number;
    impostos: number;
    lucroLiquido: number;
    margemLiquida: number;
}

export interface DRE {
    periodo: {
        tipo: PeriodoDRE;
        dataInicio: string;
        dataFim: string;
        descricao: string;
    };
    resumo: ResumoDRE;
    receitasPorCategoria: CategoriaDRE[];
    despesasPorCategoria: CategoriaDRE[];
    geradoEm: string;
}

export interface VariacaoDRE {
    campo: string;
    valorAtual: number;
    valorComparativo: number;
    variacao: number;
    variacaoPercentual: number;
}

export interface VariacoesDRE {
    receitaLiquida: VariacaoDRE;
    lucroBruto: VariacaoDRE;
    lucroOperacional: VariacaoDRE;
    ebitda: VariacaoDRE;
    lucroLiquido: VariacaoDRE;
}

export interface ComparativoDRE {
    periodoAtual: DRE;
    periodoAnterior?: DRE;
    orcado?: DRE;
    variacoes?: Record<string, number>;
    variacoesOrcado?: Record<string, number>;
}

export interface EvolucaoDRE {
    mes: number;
    mesNome: string;
    ano: number;
    receitaLiquida: number;
    lucroOperacional: number;
    lucroLiquido: number;
    margemLiquida: number;
}

// ============================================================================
// DTOs (From Types)
// ============================================================================

export interface GerarDREDTO {
    dataInicio: string;
    dataFim: string;
    tipo?: PeriodoDRE;
    incluirComparativo?: boolean;
    incluirOrcado?: boolean;
}

export interface ListarDREsParams {
    ano?: number;
    tipo?: PeriodoDRE;
    pagina?: number;
    limite?: number;
}

export interface BuscarEvolucaoParams {
    ano: number;
}

export interface DREResponse {
    dre: DRE;
    comparativo?: ComparativoDRE;
    geradoEm: string;
}

// ============================================================================
// Validadores
// ============================================================================

const PERIODOS_VALIDOS: PeriodoDRE[] = ['mensal', 'trimestral', 'semestral', 'anual'];
const TIPOS_COMPARATIVO: TipoComparativo[] = ['periodo_anterior', 'mesmo_periodo_ano_anterior', 'orcado'];
const TIPOS_CONTA: TipoConta[] = ['receita', 'despesa', 'custo'];

/**
 * Valida se um periodo e valido
 */
export function isPeriodoDREValido(periodo: unknown): periodo is PeriodoDRE {
    return typeof periodo === 'string' && PERIODOS_VALIDOS.includes(periodo as PeriodoDRE);
}

/**
 * Valida se um tipo de comparativo e valido
 */
export function isTipoComparativoValido(tipo: unknown): tipo is TipoComparativo {
    return typeof tipo === 'string' && TIPOS_COMPARATIVO.includes(tipo as TipoComparativo);
}

/**
 * Valida se um tipo de conta e valido
 */
export function isTipoContaValido(tipo: unknown): tipo is TipoConta {
    return typeof tipo === 'string' && TIPOS_CONTA.includes(tipo as TipoConta);
}

/**
 * Valida DTO para geracao de DRE
 */
export function validarGerarDREDTO(dto: GerarDREDTO): { valido: boolean; erros: string[] } {
    const erros: string[] = [];

    if (!dto.dataInicio) {
        erros.push('Data de inicio e obrigatoria');
    }

    if (!dto.dataFim) {
        erros.push('Data de fim e obrigatoria');
    }

    if (dto.dataInicio && dto.dataFim) {
        const dataInicio = new Date(dto.dataInicio);
        const dataFim = new Date(dto.dataFim);

        if (isNaN(dataInicio.getTime())) {
            erros.push('Data de inicio invalida');
        }

        if (isNaN(dataFim.getTime())) {
            erros.push('Data de fim invalida');
        }

        if (dataFim <= dataInicio) {
            erros.push('Data de fim deve ser posterior a data de inicio');
        }
    }

    if (dto.tipo && !isPeriodoDREValido(dto.tipo)) {
        erros.push(`Tipo de periodo invalido: ${dto.tipo}`);
    }

    return { valido: erros.length === 0, erros };
}

/**
 * Type guard para verificar se e um DRE valido
 */
export function isDRE(obj: unknown): obj is DRE {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        'periodo' in obj &&
        'resumo' in obj &&
        'receitasPorCategoria' in obj &&
        'despesasPorCategoria' in obj
    );
}

// ============================================================================
// Regras de Negocio - Calculos de Margens
// ============================================================================

/**
 * Calcula margem como percentual
 */
export function calcularMargem(valor: number, base: number): number {
    if (base === 0) return 0;
    return Number(((valor / base) * 100).toFixed(2));
}

/**
 * Calcula todas as margens do DRE
 */
export function calcularMargensDRE(resumo: ResumoDRE): {
    margemBruta: number;
    margemOperacional: number;
    margemEBITDA: number;
    margemLiquida: number;
} {
    const base = resumo.receitaLiquida;

    return {
        margemBruta: calcularMargem(resumo.lucroBruto, base),
        margemOperacional: calcularMargem(resumo.lucroOperacional, base),
        margemEBITDA: calcularMargem(resumo.ebitda, base),
        margemLiquida: calcularMargem(resumo.lucroLiquido, base)
    };
}

/**
 * Calcula EBITDA
 * EBITDA = Lucro Operacional + Depreciacao + Amortizacao
 */
export function calcularEBITDA(
    lucroOperacional: number,
    depreciacaoAmortizacao: number
): number {
    return lucroOperacional + depreciacaoAmortizacao;
}

/**
 * Calcula Lucro Bruto
 * Lucro Bruto = Receita Liquida - Custos Diretos
 */
export function calcularLucroBruto(receitaLiquida: number, custosDiretos: number): number {
    return receitaLiquida - custosDiretos;
}

/**
 * Calcula Lucro Operacional
 * Lucro Operacional = Lucro Bruto - Despesas Operacionais
 */
export function calcularLucroOperacional(lucroBruto: number, despesasOperacionais: number): number {
    return lucroBruto - despesasOperacionais;
}

/**
 * Calcula Receita Liquida
 * Receita Liquida = Receita Bruta - Deducoes
 */
export function calcularReceitaLiquida(receitaBruta: number, deducoes: number): number {
    return receitaBruta - deducoes;
}

/**
 * Calcula Resultado Financeiro
 * Resultado Financeiro = Receitas Financeiras - Despesas Financeiras
 */
export function calcularResultadoFinanceiro(receitasFinanceiras: number, despesasFinanceiras: number): number {
    return receitasFinanceiras - despesasFinanceiras;
}

/**
 * Calcula Lucro Liquido
 * Lucro Liquido = Resultado Antes do Imposto - Impostos
 */
export function calcularLucroLiquido(resultadoAntesImposto: number, impostos: number): number {
    return resultadoAntesImposto - impostos;
}

// ============================================================================
// Regras de Negocio - Variacoes e Comparativos
// ============================================================================

/**
 * Calcula variacao entre dois valores
 */
export function calcularVariacao(valorAtual: number, valorAnterior: number): VariacaoDRE {
    const variacao = valorAtual - valorAnterior;
    const variacaoPercentual = valorAnterior === 0
        ? (valorAtual === 0 ? 0 : 100)
        : Number((((valorAtual - valorAnterior) / Math.abs(valorAnterior)) * 100).toFixed(2));

    return {
        campo: '',
        valorAtual,
        valorComparativo: valorAnterior,
        variacao,
        variacaoPercentual
    };
}

/**
 * Calcula todas as variacoes entre dois DREs
 */
export function calcularVariacoesDRE(dreAtual: DRE, dreAnterior: DRE): VariacoesDRE {
    return {
        receitaLiquida: {
            ...calcularVariacao(dreAtual.resumo.receitaLiquida, dreAnterior.resumo.receitaLiquida),
            campo: 'Receita Liquida'
        },
        lucroBruto: {
            ...calcularVariacao(dreAtual.resumo.lucroBruto, dreAnterior.resumo.lucroBruto),
            campo: 'Lucro Bruto'
        },
        lucroOperacional: {
            ...calcularVariacao(dreAtual.resumo.lucroOperacional, dreAnterior.resumo.lucroOperacional),
            campo: 'Lucro Operacional'
        },
        ebitda: {
            ...calcularVariacao(dreAtual.resumo.ebitda, dreAnterior.resumo.ebitda),
            campo: 'EBITDA'
        },
        lucroLiquido: {
            ...calcularVariacao(dreAtual.resumo.lucroLiquido, dreAnterior.resumo.lucroLiquido),
            campo: 'Lucro Liquido'
        }
    };
}

/**
 * Calcula percentual sobre receita liquida
 */
export function calcularPercentualReceita(valor: number, receitaLiquida: number): number {
    if (receitaLiquida === 0) return 0;
    return Number(((valor / receitaLiquida) * 100).toFixed(2));
}

/**
 * Determina tendencia baseada em variacao percentual
 */
export function determinarTendencia(variacaoPercentual: number): TendenciaDRE {
    if (variacaoPercentual > 5) {
        return 'crescente';
    } else if (variacaoPercentual < -5) {
        return 'decrescente';
    }
    return 'estavel';
}

// ============================================================================
// Regras de Negocio - Periodos
// ============================================================================

/**
 * Calcula o periodo anterior baseado nas datas
 */
export function calcularPeriodoAnterior(dataInicio: string, dataFim: string): { dataInicio: string; dataFim: string } {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);

    // Calcular diferenca em meses
    const mesesDiff = (fim.getFullYear() - inicio.getFullYear()) * 12 +
        (fim.getMonth() - inicio.getMonth()) + 1;

    // Subtrair mesma quantidade de meses
    const novoInicio = new Date(inicio);
    novoInicio.setMonth(novoInicio.getMonth() - mesesDiff);

    const novoFim = new Date(inicio);
    novoFim.setDate(novoFim.getDate() - 1);

    return {
        dataInicio: toDateString(novoInicio),
        dataFim: toDateString(novoFim)
    };
}

/**
 * Gera descricao do periodo
 */
export function gerarDescricaoPeriodo(
    dataInicio: string,
    dataFim: string,
    tipo?: PeriodoDRE
): string {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);

    const MESES_NOMES = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    switch (tipo) {
        case 'mensal':
            return `${MESES_NOMES[inicio.getMonth()]} ${inicio.getFullYear()}`;
        case 'trimestral':
            const trimestre = Math.floor(inicio.getMonth() / 3) + 1;
            return `${trimestre}o Trimestre ${inicio.getFullYear()}`;
        case 'semestral':
            const semestre = inicio.getMonth() < 6 ? '1o' : '2o';
            return `${semestre} Semestre ${inicio.getFullYear()}`;
        case 'anual':
            return `Ano ${inicio.getFullYear()}`;
        default:
            const mesInicio = inicio.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            const mesFim = fim.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            return `${mesInicio} a ${mesFim}`;
    }
}

/**
 * Detecta automaticamente o tipo de periodo baseado nas datas
 */
export function detectarTipoPeriodo(dataInicio: string, dataFim: string): PeriodoDRE {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);

    const meses = (fim.getFullYear() - inicio.getFullYear()) * 12 +
        (fim.getMonth() - inicio.getMonth()) + 1;

    if (meses <= 1) return 'mensal';
    if (meses <= 3) return 'trimestral';
    if (meses <= 6) return 'semestral';
    return 'anual';
}

// ============================================================================
// Regras de Negocio - Agrupamento de Categorias
// ============================================================================

/**
 * Agrupa itens por categoria
 */
export function agruparPorCategoria(itens: ItemDRE[]): CategoriaDRE[] {
    const grupos = new Map<string, ItemDRE[]>();

    for (const item of itens) {
        const categoria = item.tipo === 'receita' ? 'Receitas' :
                          item.tipo === 'despesa' ? 'Despesas' : 'Custos';
        const atual = grupos.get(categoria) || [];
        atual.push(item);
        grupos.set(categoria, atual);
    }

    return Array.from(grupos.entries()).map(([categoria, itensCategoria]) => {
        const valor = itensCategoria.reduce((sum, item) => sum + item.valor, 0);

        return {
            categoria,
            valor,
            percentualReceita: 0 // Sera recalculado com base na receita liquida
        };
    }).sort((a, b) => b.valor - a.valor);
}

/**
 * Aplica percentuais sobre receita liquida nas categorias
 */
export function aplicarPercentuaisCategoria(
    categorias: CategoriaDRE[],
    receitaLiquida: number
): CategoriaDRE[] {
    return categorias.map(c => ({
        ...c,
        percentualReceita: calcularPercentualReceita(c.valor, receitaLiquida)
    }));
}

// ============================================================================
// Constantes e Labels
// ============================================================================

export const PERIODO_DRE_LABELS: Record<PeriodoDRE, string> = {
    mensal: 'Mensal',
    trimestral: 'Trimestral',
    semestral: 'Semestral',
    anual: 'Anual'
};

export const TIPO_COMPARATIVO_LABELS: Record<TipoComparativo, string> = {
    periodo_anterior: 'Periodo Anterior',
    mesmo_periodo_ano_anterior: 'Mesmo Periodo Ano Anterior',
    orcado: 'Orcado'
};

export const TIPO_CONTA_DRE_LABELS: Record<TipoConta, string> = {
    receita: 'Receita',
    despesa: 'Despesa',
    custo: 'Custo'
};

export const TENDENCIA_LABELS: Record<TendenciaDRE, string> = {
    crescente: 'Crescente',
    decrescente: 'Decrescente',
    estavel: 'Estavel'
};

export const TENDENCIA_CORES: Record<TendenciaDRE, string> = {
    crescente: 'green',
    decrescente: 'red',
    estavel: 'gray'
};

/**
 * Lista de meses para selecao
 */
export const MESES: Array<{ value: number; label: string }> = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Marco' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
];

/**
 * Obtem nome do mes
 */
export function getNomeMes(mes: number): string {
    return MESES.find((m) => m.value === mes)?.label ?? '';
}

/**
 * Gera anos para selecao (ultimos 3 + atual + proximo)
 */
export function gerarAnosParaSelecao(): number[] {
    const anoAtual = new Date().getFullYear();
    return [anoAtual - 3, anoAtual - 2, anoAtual - 1, anoAtual, anoAtual + 1];
}

// ============================================================================
// Categorias Padrao para Classificacao DRE
// ============================================================================

export const CATEGORIAS_RECEITA = [
    'Honorarios Advocaticios',
    'Honorarios Sucumbencia',
    'Exito Processual',
    'Consultoria',
    'Receitas Financeiras',
    'Outras Receitas'
] as const;

export const CATEGORIAS_DEDUCAO = [
    'Deducoes',
    'Devolucoes',
    'Descontos Concedidos',
    'Impostos sobre Receita'
] as const;

export const CATEGORIAS_CUSTO_DIRETO = [
    'Custos Diretos',
    'Custas Processuais',
    'Honorarios Terceiros',
    'Peritos e Assistentes',
    'Despesas Processuais'
] as const;

export const CATEGORIAS_DESPESA_OPERACIONAL = [
    'Salarios e Encargos',
    'Beneficios',
    'Aluguel',
    'Condominio',
    'Energia Eletrica',
    'Agua',
    'Telefone e Internet',
    'Material de Escritorio',
    'Manutencao',
    'Seguros',
    'Marketing',
    'Sistemas e Software',
    'Despesas Administrativas',
    'Outras Despesas Operacionais'
] as const;

export const CATEGORIAS_DESPESA_FINANCEIRA = [
    'Despesas Financeiras',
    'Juros Pagos',
    'Taxas Bancarias',
    'IOF',
    'Multas'
] as const;

export const CATEGORIAS_IMPOSTO = [
    'Impostos',
    'IRPJ',
    'CSLL',
    'PIS',
    'COFINS',
    'ISS',
    'Outros Impostos'
] as const;

/**
 * Tipo para grupos DRE
 */
export type GrupoDRE =
    | 'receita'
    | 'deducao'
    | 'custo_direto'
    | 'despesa_operacional'
    | 'despesa_financeira'
    | 'receita_financeira'
    | 'imposto'
    | 'depreciacao';

/**
 * Classifica categoria em grupo DRE
 */
export function classificarCategoria(categoria: string): GrupoDRE {
    const cat = categoria.toLowerCase();

    if (CATEGORIAS_DEDUCAO.some(c => cat.includes(c.toLowerCase()))) {
        return 'deducao';
    }
    if (CATEGORIAS_CUSTO_DIRETO.some(c => cat.includes(c.toLowerCase()))) {
        return 'custo_direto';
    }
    if (CATEGORIAS_DESPESA_FINANCEIRA.some(c => cat.includes(c.toLowerCase()))) {
        return 'despesa_financeira';
    }
    if (cat.includes('receita financeira') || cat.includes('juros recebidos') || cat.includes('rendimentos')) {
        return 'receita_financeira';
    }
    if (CATEGORIAS_IMPOSTO.some(c => cat.includes(c.toLowerCase()))) {
        return 'imposto';
    }
    if (cat.includes('depreciacao') || cat.includes('amortizacao')) {
        return 'depreciacao';
    }
    if (CATEGORIAS_DESPESA_OPERACIONAL.some(c => cat.includes(c.toLowerCase()))) {
        return 'despesa_operacional';
    }

    return 'receita';
}
