'use client';

/**
 * Página de DRE (Demonstração de Resultado do Exercício)
 * Visualiza receitas, despesas e resultado por período
 *
 * REFATORADO: Migrado para layout DataShell + DataTableToolbar (padrão Sinesys)
 */

import * as React from 'react';
import { useAgentContext } from '@copilotkit/react-core/v2';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfQuarter, endOfQuarter, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FilterPopover } from '@/app/(authenticated)/partes';
import { PageShell } from '@/components/shared/page-shell';
import {
  DataShell,
  DataTableToolbar,
} from '@/components/shared/data-shell';
import {
  FileDown,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChart3,
  List,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  DollarSign,
  Target,
  Activity,
  Wallet,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDRE, useEvolucaoDRE, useExportarDRE, gerarPeriodoAtual } from '@/app/(authenticated)/financeiro';
import { toast } from 'sonner';
import type {
  ResumoDRE,
  CategoriaDRE,
  EvolucaoDRE,
  PeriodoDRE,
  VariacoesDRE,
} from '@/app/(authenticated)/financeiro';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { ClientOnly } from '@/components/shared/client-only';
import { SafeResponsiveContainer } from '@/hooks/use-chart-ready';

// ============================================================================
// Constantes e Helpers
// ============================================================================

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-4)',
  'var(--chart-3)',
  'var(--chart-5)',
  'color-mix(in oklch, var(--chart-1), white 30%)',
  'color-mix(in oklch, var(--chart-2), white 30%)',
  'color-mix(in oklch, var(--chart-4), white 30%)',
  'color-mix(in oklch, var(--chart-3), white 30%)',
  'color-mix(in oklch, var(--chart-5), white 30%)',
];

const formatarValor = (valor: number | null | undefined): string => {
  if (valor === null || valor === undefined || isNaN(valor)) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

const formatarValorCompacto = (valor: number | null | undefined): string => {
  if (valor === null || valor === undefined || isNaN(valor)) {
    return 'R$ 0,00';
  }
  if (Math.abs(valor) >= 1000000) {
    return `R$ ${(valor / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(valor) >= 1000) {
    return `R$ ${(valor / 1000).toFixed(1)}K`;
  }
  return formatarValor(valor);
};

const formatarPercentual = (valor: number | null | undefined): string => {
  if (typeof valor !== 'number' || isNaN(valor)) {
    return '0,00%';
  }
  return `${valor.toFixed(2)}%`;
};

const getVariacaoColor = (variacao: number | null | undefined): string => {
  if (variacao === null || variacao === undefined || isNaN(variacao)) {
    return 'text-muted-foreground';
  }
  if (variacao > 10) return 'text-success';
  if (variacao > 0) return 'text-success/80';
  if (variacao > -10) return 'text-warning';
  return 'text-destructive';
};

const getLucroColor = (valor: number | null | undefined): string => {
  if (valor === null || valor === undefined || isNaN(valor)) {
    return 'text-muted-foreground';
  }
  if (valor > 0) return 'text-success';
  if (valor < 0) return 'text-destructive';
  return 'text-muted-foreground';
};

type PeriodoRapido = 'mes_atual' | 'mes_anterior' | 'trimestre_atual' | 'ano_atual';

// ============================================================================
// Componente de Variação (reutilizável)
// ============================================================================

function VariacaoIndicator({
  valor,
  label,
  size = 'sm',
}: {
  valor: number | null | undefined;
  label: string;
  size?: 'sm' | 'xs';
}) {
  if (valor === null || valor === undefined || isNaN(valor)) {
    return null;
  }

  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-3 w-3';
  const textSize = size === 'sm' ? 'text-xs' : 'text-xs';

  return (
    <div className={`flex items-center gap-1 ${textSize} ${getVariacaoColor(valor)}`}>
      {valor > 0 ? (
        <ArrowUpRight className={iconSize} />
      ) : valor < 0 ? (
        <ArrowDownRight className={iconSize} />
      ) : (
        <Minus className={iconSize} />
      )}
      <span>{formatarPercentual(valor)} {label}</span>
    </div>
  );
}

// ============================================================================
// Componente de Cards de Resumo (KPI)
// ============================================================================

const KPI_CONFIG = [
  {
    key: 'receitaLiquida' as const,
    label: 'Receita Líquida',
    icon: DollarSign,
    borderColor: 'border-l-primary',
    iconColor: 'text-primary',
    margemKey: null as null,
    margemLabel: null as null,
  },
  {
    key: 'lucroOperacional' as const,
    label: 'Lucro Operacional',
    icon: Target,
    borderColor: 'border-l-chart-4',
    iconColor: 'text-chart-4',
    margemKey: 'margemOperacional' as const,
    margemLabel: 'Margem Operacional',
  },
  {
    key: 'ebitda' as const,
    label: 'EBITDA',
    icon: Activity,
    borderColor: 'border-l-chart-2',
    iconColor: 'text-chart-2',
    margemKey: 'margemEBITDA' as const,
    margemLabel: 'Margem EBITDA',
  },
  {
    key: 'lucroLiquido' as const,
    label: 'Lucro Líquido',
    icon: Wallet,
    borderColor: 'border-l-success',
    iconColor: 'text-success',
    margemKey: 'margemLiquida' as const,
    margemLabel: 'Margem Líquida',
  },
] as const;

function ResumoCards({
  resumo,
  variacoes,
  variacoesOrcado,
  isLoading,
}: {
  resumo: ResumoDRE | null;
  variacoes: VariacoesDRE | null;
  variacoesOrcado: VariacoesDRE | null;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!resumo) {
    return (
      <div className="text-center py-6 text-sm text-muted-foreground">
        Selecione um período para visualizar o DRE.
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      {KPI_CONFIG.map((kpi) => {
        const valor = resumo[kpi.key];
        const Icon = kpi.icon;
        const isLucroLiquido = kpi.key === 'lucroLiquido';
        const showColor = kpi.key !== 'receitaLiquida';

        return (
          <Card key={kpi.key} className={`border-l-4 ${kpi.borderColor}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
                  <p className={`text-xl font-semibold font-mono tracking-tight ${showColor ? getLucroColor(valor) : ''}`}>
                    {formatarValor(valor)}
                  </p>
                </div>
                <div className={`rounded-md bg-muted p-1.5 ${kpi.iconColor}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                {kpi.margemKey && (
                  <span className="text-xs text-muted-foreground">
                    {kpi.margemLabel}: {formatarPercentual(resumo[kpi.margemKey])}
                  </span>
                )}
                {isLucroLiquido && (
                  <Badge
                    variant={valor > 0 ? 'success' : valor < 0 ? 'destructive' : 'secondary'}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {valor > 0 ? 'Lucro' : valor < 0 ? 'Prejuízo' : 'Neutro'}
                  </Badge>
                )}
                {variacoes && variacoes[kpi.key] && (
                  <VariacaoIndicator
                    valor={variacoes[kpi.key].variacaoPercentual}
                    label="ant."
                    size="xs"
                  />
                )}
                {variacoesOrcado && variacoesOrcado[kpi.key] && (
                  <VariacaoIndicator
                    valor={variacoesOrcado[kpi.key].variacaoPercentual}
                    label="orç."
                    size="xs"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ============================================================================
// Componente de Tabela DRE Estruturada
// ============================================================================

interface LinhaDRE {
  descricao: string;
  valor: number | null;
  percentual: number | null;
  bold?: boolean;
  indent?: number;
  negativo?: boolean;
  destaque?: boolean;
  espacador?: boolean;
  final?: boolean;
}

function DRETable({ resumo }: { resumo: ResumoDRE }) {
  const calcularPercent = (valor: number): number => {
    if (resumo.receitaLiquida === 0) return 0;
    return (valor / resumo.receitaLiquida) * 100;
  };

  const linhas: LinhaDRE[] = [
    { descricao: 'RECEITAS', valor: null, percentual: null, bold: true, indent: 0 },
    { descricao: 'Receita Bruta', valor: resumo.receitaBruta, percentual: 100 + calcularPercent(resumo.deducoes), indent: 1 },
    { descricao: '(-) Deduções', valor: -resumo.deducoes, percentual: -calcularPercent(resumo.deducoes), indent: 1, negativo: true },
    { descricao: '= Receita Líquida', valor: resumo.receitaLiquida, percentual: 100, bold: true, indent: 0, destaque: true },
    { descricao: '', valor: null, percentual: null, espacador: true },
    { descricao: 'CUSTOS E DESPESAS', valor: null, percentual: null, bold: true, indent: 0 },
    { descricao: '(-) Custos Diretos', valor: -resumo.custosDiretos, percentual: -calcularPercent(resumo.custosDiretos), indent: 1, negativo: true },
    { descricao: '= Lucro Bruto', valor: resumo.lucroBruto, percentual: resumo.margemBruta, bold: true, indent: 0, destaque: true },
    { descricao: '', valor: null, percentual: null, espacador: true },
    { descricao: '(-) Despesas Operacionais', valor: -resumo.despesasOperacionais, percentual: -calcularPercent(resumo.despesasOperacionais), indent: 1, negativo: true },
    { descricao: '= Lucro Operacional', valor: resumo.lucroOperacional, percentual: resumo.margemOperacional, bold: true, indent: 0, destaque: true },
    { descricao: '', valor: null, percentual: null, espacador: true },
    { descricao: '(+) Depreciação/Amortização', valor: resumo.depreciacaoAmortizacao, percentual: calcularPercent(resumo.depreciacaoAmortizacao), indent: 1 },
    { descricao: '= EBITDA', valor: resumo.ebitda, percentual: resumo.margemEBITDA, bold: true, indent: 0, destaque: true },
    { descricao: '', valor: null, percentual: null, espacador: true },
    { descricao: 'RESULTADO FINANCEIRO', valor: null, percentual: null, bold: true, indent: 0 },
    { descricao: '(+) Receitas Financeiras', valor: resumo.receitasFinanceiras, percentual: calcularPercent(resumo.receitasFinanceiras), indent: 1 },
    { descricao: '(-) Despesas Financeiras', valor: -resumo.despesasFinanceiras, percentual: -calcularPercent(resumo.despesasFinanceiras), indent: 1, negativo: true },
    { descricao: '', valor: null, percentual: null, espacador: true },
    { descricao: '= Resultado Antes Impostos', valor: resumo.resultadoAntesImposto, percentual: calcularPercent(resumo.resultadoAntesImposto), bold: true, indent: 0 },
    { descricao: '(-) Impostos', valor: -resumo.impostos, percentual: -calcularPercent(resumo.impostos), indent: 1, negativo: true },
    { descricao: '', valor: null, percentual: null, espacador: true },
    { descricao: '= LUCRO LÍQUIDO', valor: resumo.lucroLiquido, percentual: resumo.margemLiquida, bold: true, indent: 0, destaque: true, final: true },
  ];

  return (
    <div className="rounded-md border bg-card overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-2.5 px-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Descrição</th>
            <th className="text-right p-2.5 px-4 text-xs font-medium uppercase tracking-wider text-muted-foreground w-40">Valor (R$)</th>
            <th className="text-right p-2.5 px-4 text-xs font-medium uppercase tracking-wider text-muted-foreground w-28">% Receita</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha, index) => {
            if (linha.espacador) {
              return <tr key={index} className="h-1" />;
            }

            const valorColor = linha.valor !== null
              ? linha.valor < 0 ? 'text-destructive' : linha.valor > 0 && linha.final ? getLucroColor(linha.valor) : ''
              : '';

            return (
              <tr
                key={index}
                className={`border-b last:border-b-0 transition-colors hover:bg-muted/50 ${linha.destaque ? 'bg-muted/30 font-medium' : ''
                  } ${linha.final
                    ? resumo.lucroLiquido >= 0
                      ? 'bg-success/10'
                      : 'bg-destructive/10'
                    : ''
                  }`}
              >
                <td
                  className={`p-2.5 px-4 text-sm ${linha.bold ? 'font-semibold' : ''
                    } ${(linha.indent || 0) === 1 ? 'pl-8' : ''
                    }`}
                >
                  {linha.descricao}
                </td>
                <td className={`p-2.5 px-4 text-right text-sm font-mono tabular-nums ${linha.bold ? 'font-semibold' : ''} ${valorColor}`}>
                  {linha.valor !== null ? formatarValor(linha.valor) : ''}
                </td>
                <td className={`p-2.5 px-4 text-right text-sm font-mono tabular-nums ${linha.bold ? 'font-semibold' : ''} text-muted-foreground`}>
                  {linha.percentual !== null ? formatarPercentual(linha.percentual) : ''}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// Componente de Gráfico de Pizza
// ============================================================================

function CategoriaPieChart({ categorias }: { categorias: CategoriaDRE[] }) {
  if (categorias.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Sem dados para exibir
      </div>
    );
  }

  const data = categorias.slice(0, 10).map((cat) => ({
    name: cat.categoria,
    value: cat.valor,
    percentual: cat.percentualReceita,
  }));

  return (
    <div className="h-72">
      <ClientOnly>
        <SafeResponsiveContainer width="100%" height="100%" minWidth={50} minHeight={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(props) => {
                const name = typeof props.name === 'string' ? props.name : String(props.name ?? '');
                const percent = typeof props.percent === 'number' ? props.percent : 0;
                const percentual = (percent * 100).toFixed(1);
                const nameTruncado = name.slice(0, 12) + (name.length > 12 ? '...' : '');
                return `${nameTruncado} (${percentual}%)`;
              }}
              outerRadius={90}
              innerRadius={40}
              fill="#8884d8"
              dataKey="value"
              paddingAngle={2}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => typeof value === 'number' ? formatarValor(value) : String(value ?? '')}
              labelFormatter={(name) => name}
            />
          </PieChart>
        </SafeResponsiveContainer>
      </ClientOnly>
    </div>
  );
}

// ============================================================================
// Componente de Tab de Categoria (reutilizável para Receitas e Despesas)
// ============================================================================

function CategoriaTab({
  title,
  description,
  categorias,
  isLoading,
  emptyMessage,
}: {
  title: string;
  description: string;
  categorias: CategoriaDRE[] | undefined;
  isLoading: boolean;
  emptyMessage: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-72" />
        ) : categorias && categorias.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <CategoriaPieChart categorias={categorias} />
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Detalhamento</p>
              {categorias.map((cat: CategoriaDRE, i: number) => (
                <div key={cat.categoria} className="flex items-center justify-between py-1.5 px-2 rounded transition-colors hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] } as React.CSSProperties}
                    />
                    <span className="text-sm">{cat.categoria}</span>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <span className="font-mono text-sm tabular-nums">{formatarValor(cat.valor)}</span>
                    <span className="text-xs text-muted-foreground tabular-nums w-14 text-right">
                      {formatarPercentual(cat.percentualReceita)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-center py-6 text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Componente de Gráfico de Evolução
// ============================================================================

function EvolucaoChart({ evolucao }: { evolucao: EvolucaoDRE[] }) {
  if (evolucao.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Sem dados de evolução
      </div>
    );
  }

  return (
    <div className="h-72">
      <ClientOnly>
        <SafeResponsiveContainer width="100%" height="100%" minWidth={50} minHeight={200}>
          <LineChart data={evolucao}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="mesNome"
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
            />
            <YAxis
              tickFormatter={(value) => formatarValorCompacto(value)}
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
              width={70}
            />
            <Tooltip
              formatter={(value, name) => [
                typeof value === 'number' ? formatarValor(value) : String(value ?? ''),
                name === 'receitaLiquida' ? 'Receita Líquida' :
                  name === 'lucroOperacional' ? 'Lucro Operacional' :
                    name === 'lucroLiquido' ? 'Lucro Líquido' : String(name || '')
              ]}
            />
            <Legend
              formatter={(value) =>
                value === 'receitaLiquida' ? 'Receita Líquida' :
                  value === 'lucroOperacional' ? 'Lucro Operacional' :
                    value === 'lucroLiquido' ? 'Lucro Líquido' : value
              }
            />
            <Line
              type="monotone"
              dataKey="receitaLiquida"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="lucroOperacional"
              stroke="var(--chart-4)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="lucroLiquido"
              stroke="var(--chart-2)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </SafeResponsiveContainer>
      </ClientOnly>
    </div>
  );
}

// ============================================================================
// Componente Principal
// ============================================================================

export default function DREClient() {
  const hoje = React.useMemo(() => new Date(), []);

  const [periodo, setPeriodo] = React.useState(() => {
    const { dataInicio, dataFim } = gerarPeriodoAtual('mensal');
    return { dataInicio, dataFim, tipo: 'mensal' as PeriodoDRE };
  });

  const [incluirComparativo, setIncluirComparativo] = React.useState(false);
  const [incluirOrcado, setIncluirOrcado] = React.useState(false);

  const { dre, comparativo, isLoading, error, refetch } = useDRE({
    dataInicio: periodo.dataInicio,
    dataFim: periodo.dataFim,
    tipo: periodo.tipo,
    incluirComparativo,
    incluirOrcado,
  });

  const anoAtual = hoje.getFullYear();
  const { evolucao, isLoading: loadingEvolucao } = useEvolucaoDRE({ ano: anoAtual });
  const { isExporting, exportarPDF, exportarCSV } = useExportarDRE();

  // ── Copilot: expor contexto do DRE ──
  useAgentContext({
    description: 'Dados do DRE na tela: período selecionado e resumo financeiro',
    value: {
      periodo_selecionado: {
        tipo: periodo.tipo,
        data_inicio: periodo.dataInicio,
        data_fim: periodo.dataFim,
      },
      resumo: dre?.resumo ? {
        receita_bruta: dre.resumo.receitaBruta,
        receita_liquida: dre.resumo.receitaLiquida,
        lucro_bruto: dre.resumo.lucroBruto,
        margem_bruta: dre.resumo.margemBruta,
        lucro_operacional: dre.resumo.lucroOperacional,
        margem_operacional: dre.resumo.margemOperacional,
        ebitda: dre.resumo.ebitda,
        margem_ebitda: dre.resumo.margemEBITDA,
        lucro_liquido: dre.resumo.lucroLiquido,
        margem_liquida: dre.resumo.margemLiquida,
      } : null,
      carregando: isLoading,
      comparativo_ativo: incluirComparativo,
      orcado_ativo: incluirOrcado,
    },
  });

  // Options para FilterPopover
  const periodoOptions = React.useMemo(() => [
    { value: 'mes_atual', label: 'Mês Atual' },
    { value: 'mes_anterior', label: 'Mês Anterior' },
    { value: 'trimestre_atual', label: 'Trimestre' },
    { value: 'ano_atual', label: 'Ano' },
  ], []);

  const comparacaoOptions = React.useMemo(() => [
    { value: 'anterior', label: 'vs Anterior' },
    { value: 'orcado', label: 'vs Orçado' },
    { value: 'ambas', label: 'Ambas' },
  ], []);

  const comparacaoAtiva = React.useMemo(() => {
    if (incluirComparativo && incluirOrcado) return 'ambas';
    if (incluirComparativo) return 'anterior';
    if (incluirOrcado) return 'orcado';
    return 'nenhuma';
  }, [incluirComparativo, incluirOrcado]);

  const handleComparacaoChange = React.useCallback((val: string) => {
    if (val === 'nenhuma') {
      setIncluirComparativo(false);
      setIncluirOrcado(false);
    } else if (val === 'anterior') {
      setIncluirComparativo(true);
      setIncluirOrcado(false);
    } else if (val === 'orcado') {
      setIncluirComparativo(false);
      setIncluirOrcado(true);
    } else if (val === 'ambas') {
      setIncluirComparativo(true);
      setIncluirOrcado(true);
    }
  }, [setIncluirComparativo, setIncluirOrcado]);

  // ---- Handlers de período ----
  const handlePeriodoRapido = React.useCallback((periodoTipo: PeriodoRapido) => {
    let novoInicio: Date;
    let novoFim: Date;
    let novoTipo: PeriodoDRE;

    switch (periodoTipo) {
      case 'mes_atual':
        novoInicio = startOfMonth(hoje);
        novoFim = endOfMonth(hoje);
        novoTipo = 'mensal';
        break;
      case 'mes_anterior': {
        const mesAnterior = subMonths(hoje, 1);
        novoInicio = startOfMonth(mesAnterior);
        novoFim = endOfMonth(mesAnterior);
        novoTipo = 'mensal';
        break;
      }
      case 'trimestre_atual':
        novoInicio = startOfQuarter(hoje);
        novoFim = endOfQuarter(hoje);
        novoTipo = 'trimestral';
        break;
      case 'ano_atual':
        novoInicio = startOfYear(hoje);
        novoFim = endOfYear(hoje);
        novoTipo = 'anual';
        break;
    }

    setPeriodo({
      dataInicio: format(novoInicio, 'yyyy-MM-dd'),
      dataFim: format(novoFim, 'yyyy-MM-dd'),
      tipo: novoTipo,
    });
  }, [hoje, setPeriodo]);

  const periodoAtivo = React.useMemo((): PeriodoRapido | '' => {
    const inicioDate = new Date(periodo.dataInicio);
    const fimDate = new Date(periodo.dataFim);
    const inicioMesAtual = startOfMonth(hoje);
    const fimMesAtual = endOfMonth(hoje);
    const inicioMesAnterior = startOfMonth(subMonths(hoje, 1));
    const fimMesAnterior = endOfMonth(subMonths(hoje, 1));
    const inicioTrimestre = startOfQuarter(hoje);
    const fimTrimestre = endOfQuarter(hoje);
    const inicioAno = startOfYear(hoje);
    const fimAno = endOfYear(hoje);

    if (format(inicioDate, 'yyyy-MM-dd') === format(inicioMesAtual, 'yyyy-MM-dd') &&
      format(fimDate, 'yyyy-MM-dd') === format(fimMesAtual, 'yyyy-MM-dd')) return 'mes_atual';
    if (format(inicioDate, 'yyyy-MM-dd') === format(inicioMesAnterior, 'yyyy-MM-dd') &&
      format(fimDate, 'yyyy-MM-dd') === format(fimMesAnterior, 'yyyy-MM-dd')) return 'mes_anterior';
    if (format(inicioDate, 'yyyy-MM-dd') === format(inicioTrimestre, 'yyyy-MM-dd') &&
      format(fimDate, 'yyyy-MM-dd') === format(fimTrimestre, 'yyyy-MM-dd')) return 'trimestre_atual';
    if (format(inicioDate, 'yyyy-MM-dd') === format(inicioAno, 'yyyy-MM-dd') &&
      format(fimDate, 'yyyy-MM-dd') === format(fimAno, 'yyyy-MM-dd')) return 'ano_atual';
    return '';
  }, [periodo.dataInicio, periodo.dataFim, hoje]);

  // ---- Handlers de ações ----
  const handleRefresh = React.useCallback(() => {
    refetch();
    toast.success('Dados atualizados');
  }, [refetch]);

  const handleExportarPDF = React.useCallback(async () => {
    await exportarPDF(periodo.dataInicio, periodo.dataFim, periodo.tipo);
    toast.success('DRE exportado em PDF');
  }, [exportarPDF, periodo]);

  const handleExportarCSV = React.useCallback(async () => {
    await exportarCSV(periodo.dataInicio, periodo.dataFim, periodo.tipo);
    toast.success('DRE exportado em CSV');
  }, [exportarCSV, periodo]);

  if (error && !isLoading) {
    return (
      <PageShell>
        <DataShell
          header={
            <DataTableToolbar title="Demonstração de Resultado do Exercício" />
          }
        >
          <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
            <p className="font-semibold">Erro ao carregar DRE</p>
            <p>{error}</p>
          </div>
        </DataShell>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <DataShell
        header={
          <DataTableToolbar
            title="Demonstração de Resultado do Exercício"
            filtersSlot={
              <>
                <FilterPopover
                  label="Período"
                  options={periodoOptions}
                  value={periodoAtivo || 'mes_atual'}
                  onValueChange={(val) => handlePeriodoRapido(val as PeriodoRapido)}
                  defaultValue="mes_atual"
                />
                <FilterPopover
                  label="Comparação"
                  options={comparacaoOptions}
                  value={comparacaoAtiva}
                  onValueChange={handleComparacaoChange}
                  defaultValue="nenhuma"
                />

                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {format(new Date(periodo.dataInicio), "dd MMM", { locale: ptBR })} — {format(new Date(periodo.dataFim), "dd MMM yyyy", { locale: ptBR })}
                  </span>
                </div>
              </>
            }
            actionSlot={
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRefresh} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="sr-only">Atualizar</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isExporting || !dre}>
                      <FileDown className="h-4 w-4" />
                      <span className="sr-only">Exportar</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleExportarPDF}>
                      <FileText className="mr-2 h-4 w-4" />
                      Exportar PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportarCSV}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Exportar CSV
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            }
          />
        }
      >
        {/* KPI Cards */}
        <ResumoCards
          resumo={dre?.resumo || null}
          variacoes={comparativo?.variacoes || null}
          variacoesOrcado={comparativo?.variacoesOrcado || null}
          isLoading={isLoading}
        />

        {/* Tabs */}
        <Tabs defaultValue="estrutura" className="mt-4 space-y-3">
          <TabsList>
            <TabsTrigger value="estrutura" className="gap-1.5 px-3">
              <List className="h-3.5 w-3.5" />
              Estrutura
            </TabsTrigger>
            <TabsTrigger value="receitas" className="gap-1.5 px-3">
              <TrendingUp className="h-3.5 w-3.5" />
              Receitas
            </TabsTrigger>
            <TabsTrigger value="despesas" className="gap-1.5 px-3">
              <TrendingDown className="h-3.5 w-3.5" />
              Despesas
            </TabsTrigger>
            <TabsTrigger value="evolucao" className="gap-1.5 px-3">
              <BarChart3 className="h-3.5 w-3.5" />
              Evolução
            </TabsTrigger>
          </TabsList>

          <TabsContent value="estrutura">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Estrutura do DRE</CardTitle>
                    <CardDescription>
                      {dre?.periodo.descricao || 'Selecione um período'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-1.5">
                    {Array.from({ length: 15 }).map((_, i) => (
                      <Skeleton key={i} className="h-7" />
                    ))}
                  </div>
                ) : dre?.resumo ? (
                  <DRETable resumo={dre.resumo} />
                ) : (
                  <p className="text-center py-6 text-sm text-muted-foreground">
                    Selecione um período para visualizar o DRE
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="receitas">
            <CategoriaTab
              title="Receitas por Categoria"
              description="Distribuição das receitas por categoria"
              categorias={dre?.receitasPorCategoria}
              isLoading={isLoading}
              emptyMessage="Sem dados de receitas"
            />
          </TabsContent>

          <TabsContent value="despesas">
            <CategoriaTab
              title="Despesas por Categoria"
              description="Distribuição das despesas por categoria"
              categorias={dre?.despesasPorCategoria}
              isLoading={isLoading}
              emptyMessage="Sem dados de despesas"
            />
          </TabsContent>

          <TabsContent value="evolucao">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Evolução Anual</CardTitle>
                <CardDescription>
                  Evolução mensal — {anoAtual}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingEvolucao ? (
                  <Skeleton className="h-72" />
                ) : (
                  <EvolucaoChart evolucao={evolucao} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DataShell>
    </PageShell>
  );
}
