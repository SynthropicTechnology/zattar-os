'use client';

/**
 * Página de Análise Orçamentária
 * Visualiza análise detalhada do orçamento vs realizado com gráficos
 */

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  FileDown,
  RefreshCw,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  exportarAnaliseCSV,
  exportarEvolucaoCSV,
  exportarOrcamentoCSV,
  exportarRelatorioPDF,
  type AnaliseOrcamentaria,
  type AnaliseOrcamentariaItem,
  type AlertaDesvio,
  type EvolucaoMensal,
  type ProjecaoItem,
  type ResumoOrcamentario,
  type StatusOrcamento,
  useAnaliseOrcamentaria,
  useOrcamento,
  useProjecaoOrcamentaria,
} from '@/app/(authenticated)/financeiro';
import { toast } from 'sonner';

// ============================================================================
// Constantes e Helpers
// ============================================================================

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'info' | 'success' | 'warning' | 'destructive' | 'neutral' | 'accent';

const STATUS_CONFIG: Record<StatusOrcamento, { label: string; variant: BadgeVariant }> = {
  rascunho: { label: 'Rascunho', variant: 'outline' },
  aprovado: { label: 'Aprovado', variant: 'info' },
  em_execucao: { label: 'Em Execução', variant: 'success' },
  encerrado: { label: 'Encerrado', variant: 'neutral' },
  cancelado: { label: 'Cancelado', variant: 'destructive' },
};

const formatarValor = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

const formatarPercentual = (valor: number): string => {
  return `${valor >= 0 ? '+' : ''}${valor.toFixed(1)}%`;
};

const getVariacaoColor = (variacao: number): string => {
  if (variacao <= -10) return 'text-success';
  if (variacao <= 0) return 'text-success/80';
  if (variacao <= 10) return 'text-warning/80';
  if (variacao <= 20) return 'text-warning';
  return 'text-destructive';
};

const getStatusBadge = (status: string): { variant: BadgeVariant; label: string } => {
  switch (status) {
    case 'dentro_orcamento':
      return { variant: 'success', label: 'Dentro do Orçamento' };
    case 'atencao':
      return { variant: 'warning', label: 'Atenção' };
    case 'estourado':
      return { variant: 'destructive', label: 'Estourado' };
    default:
      return { variant: 'outline', label: status };
  }
};


// ============================================================================
// Componentes de Cards de Resumo
// ============================================================================

function ResumoGeralCards({
  resumo,
  isLoading,
}: {
  resumo: ResumoOrcamentario | null;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!resumo) return null;

  // Calcular variação percentual a partir do resumo
  const variacaoPercentual = resumo.totalPrevisto > 0
    ? ((resumo.totalRealizado - resumo.totalPrevisto) / resumo.totalPrevisto) * 100
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Previsto</CardDescription>
          <CardTitle className="text-2xl font-mono">
            {formatarValor(resumo.totalPrevisto)}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Realizado</CardDescription>
          <CardTitle className="text-2xl font-mono">
            {formatarValor(resumo.totalRealizado)}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Progress value={resumo.percentualExecutado} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {resumo.percentualExecutado.toFixed(1)}% executado
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Variação</CardDescription>
          <CardTitle className={`text-2xl ${getVariacaoColor(variacaoPercentual)}`}>
            {formatarPercentual(variacaoPercentual)}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">
            {variacaoPercentual > 0 ? 'Acima do previsto' : 'Abaixo do previsto'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Status dos Itens</CardDescription>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {resumo.itensAcimaMeta > 0 && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm">{resumo.itensAcimaMeta} acima da meta</span>
            </div>
          )}
          {resumo.itensAbaixoMeta > 0 && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span className="text-sm">{resumo.itensAbaixoMeta} abaixo da meta</span>
            </div>
          )}
          {resumo.itensAcimaMeta === 0 && resumo.itensAbaixoMeta === 0 && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-sm">Todos dentro da meta</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Componente de Lista de Análise por Item
// ============================================================================

function AnaliseItensTable({ itens }: { itens: AnaliseOrcamentariaItem[] }) {
  if (itens.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Nenhum item para análise.
      </p>
    );
  }

  const getContaLabel = (conta: string | { id: number; codigo: string; nome: string }) => {
    if (typeof conta === 'string') return conta;
    return `${conta.codigo} - ${conta.nome}`;
  };

  const getCentroCustoLabel = (centro?: string | { id: number; codigo: string; nome: string }) => {
    if (!centro) return null;
    if (typeof centro === 'string') return centro;
    return centro.nome;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-3 font-medium">Conta Contábil</th>
            <th className="text-right p-3 font-medium">Previsto</th>
            <th className="text-right p-3 font-medium">Realizado</th>
            <th className="text-right p-3 font-medium">Desvio</th>
            <th className="text-center p-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((item) => {
            const statusBadge = getStatusBadge(item.status);
            const centroCustoLabel = getCentroCustoLabel(item.centroCusto);
            return (
              <tr key={item.id} className="border-b hover:bg-muted/50">
                <td className="p-3">
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {getContaLabel(item.contaContabil)}
                    </span>
                    {centroCustoLabel && (
                      <span className="text-xs text-muted-foreground">
                        {centroCustoLabel}
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-3 text-right font-mono">
                  {formatarValor(item.valorPrevisto)}
                </td>
                <td className="p-3 text-right font-mono">
                  {formatarValor(item.valorRealizado)}
                </td>
                <td className={`p-3 text-right font-mono ${getVariacaoColor(item.desvioPercentual)}`}>
                  {formatarPercentual(item.desvioPercentual)}
                </td>
                <td className="p-3 text-center">
                  <Badge variant={statusBadge.variant}>
                    {statusBadge.label}
                  </Badge>
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
// Componente de Alertas
// ============================================================================

function AlertasDesvioList({ alertas }: { alertas: AlertaDesvio[] }) {
  if (alertas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-success mb-4" />
        <p className="text-muted-foreground">
          Nenhum alerta de desvio identificado.
        </p>
      </div>
    );
  }

  const getTipoBadgeVariant = (tipo: 'critico' | 'alerta' | 'informativo'): BadgeVariant => {
    switch (tipo) {
      case 'critico':
        return 'destructive';
      case 'alerta':
        return 'warning';
      case 'informativo':
        return 'info';
      default:
        return 'outline';
    }
  };

  const getTipoLabel = (tipo: 'critico' | 'alerta' | 'informativo'): string => {
    switch (tipo) {
      case 'critico':
        return 'Crítico';
      case 'alerta':
        return 'Atenção';
      case 'informativo':
        return 'Informação';
      default:
        return tipo;
    }
  };

  return (
    <div className="space-y-3">
      {alertas.map((alerta, index) => (
        <Card key={index}>
          <CardContent className="flex items-start gap-4 p-4">
            <AlertTriangle
              className={`h-5 w-5 mt-0.5 ${alerta.tipo === 'critico'
                ? 'text-destructive'
                : alerta.tipo === 'alerta'
                  ? 'text-warning'
                  : 'text-info'
                }`}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{alerta.descricao}</span>
                <Badge variant={getTipoBadgeVariant(alerta.tipo)} className="text-xs">
                  {getTipoLabel(alerta.tipo)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{alerta.mensagem}</p>
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                <span className={getVariacaoColor(alerta.desvioPercentual)}>
                  Desvio: {formatarPercentual(alerta.desvioPercentual)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================================================
// Componente de Projeção
// ============================================================================

function ProjecaoTable({ itens }: { itens: ProjecaoItem[] }) {
  if (itens.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Dados insuficientes para projeção.
      </p>
    );
  }

  const calcularVariacao = (previsto: number, projetado: number): number => {
    if (previsto === 0) return 0;
    return ((projetado - previsto) / previsto) * 100;
  };

  const getTendencia = (previsto: number, projetado: number): 'alta' | 'baixa' | 'neutra' => {
    const variacao = calcularVariacao(previsto, projetado);
    if (variacao > 5) return 'alta';
    if (variacao < -5) return 'baixa';
    return 'neutra';
  };

  const getTendenciaIcon = (tendencia: 'alta' | 'baixa' | 'neutra') => {
    switch (tendencia) {
      case 'alta':
        return <TrendingUp className="h-4 w-4 text-destructive" />;
      case 'baixa':
        return <TrendingDown className="h-4 w-4 text-success" />;
      default:
        return null;
    }
  };

  const getTendenciaLabel = (tendencia: 'alta' | 'baixa' | 'neutra'): string => {
    switch (tendencia) {
      case 'alta':
        return 'Alta';
      case 'baixa':
        return 'Baixa';
      case 'neutra':
        return 'Neutra';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-3 font-medium">Mês</th>
            <th className="text-right p-3 font-medium">Previsto</th>
            <th className="text-right p-3 font-medium">Realizado</th>
            <th className="text-right p-3 font-medium">Projetado</th>
            <th className="text-right p-3 font-medium">vs Previsto</th>
            <th className="text-center p-3 font-medium">Tendência</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((item, index) => {
            const variacao = calcularVariacao(item.valorPrevisto, item.valorProjetado);
            const tendencia = getTendencia(item.valorPrevisto, item.valorProjetado);
            return (
              <tr key={index} className="border-b hover:bg-muted/50">
                <td className="p-3 font-medium">{item.mes}</td>
                <td className="p-3 text-right font-mono">
                  {formatarValor(item.valorPrevisto)}
                </td>
                <td className="p-3 text-right font-mono">
                  {formatarValor(item.valorRealizado)}
                </td>
                <td className="p-3 text-right font-mono">
                  {formatarValor(item.valorProjetado)}
                </td>
                <td className={`p-3 text-right font-mono ${getVariacaoColor(variacao)}`}>
                  {formatarPercentual(variacao)}
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-center gap-1">
                    {getTendenciaIcon(tendencia)}
                    <span className="text-sm">{getTendenciaLabel(tendencia)}</span>
                  </div>
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
// Componente Principal
// ============================================================================

export default function AnaliseOrcamentariaPage() {
  const router = useRouter();
  const params = useParams();
  const orcamentoId = parseInt(params.id as string, 10);

  // Dados do orçamento
  const { orcamento, isLoading: loadingOrcamento, error: errorOrcamento } = useOrcamento(orcamentoId);

  // Dados de análise
  const {
    itens: itensAnalise,
    resumo,
    alertas,
    evolucao,
    isLoading: loadingAnalise,
    error: errorAnalise,
    refetch: refetchAnalise,
  } = useAnaliseOrcamentaria(orcamentoId, {
    incluirResumo: true,
    incluirAlertas: true,
    incluirEvolucao: true,
  });

  // Dados de projeção
  const {
    projecao,
    isLoading: loadingProjecao,
    error: errorProjecao,
    refetch: refetchProjecao,
  } = useProjecaoOrcamentaria(orcamentoId);

  const isLoading = loadingOrcamento || loadingAnalise;
  const error = errorOrcamento || errorAnalise;

  const handleVoltar = () => {
    router.push(`/financeiro/orcamentos/${orcamentoId}`);
  };

  const handleRefresh = () => {
    refetchAnalise();
    refetchProjecao();
    toast.success('Dados atualizados');
  };

  const [isExporting, setIsExporting] = React.useState(false);

  const handleExportarCSV = async () => {
    if (!orcamento) return;

    try {
      setIsExporting(true);
      if (itensAnalise.length > 0 && resumo) {

        // Exportar análise completa - mapear para estrutura esperada pelo exportador
        const analiseData: AnaliseOrcamentaria = {
          itens: itensAnalise,
          resumo,
          alertas: alertas ?? [],
          evolucao: evolucao as unknown as ProjecaoItem[] ?? [],
        };
        exportarAnaliseCSV(orcamento as unknown as Parameters<typeof exportarAnaliseCSV>[0], analiseData);
        toast.success('Análise exportada para CSV');
      } else {
        // Exportar orçamento básico
        exportarOrcamentoCSV(orcamento);
        toast.success('Orçamento exportado para CSV');
      }
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast.error('Erro ao exportar CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportarEvolucaoCSV = async () => {
    if (!orcamento || !evolucao || evolucao.length === 0) {
      toast.warning('Dados de evolução não disponíveis');
      return;
    }

    try {
      setIsExporting(true);
      // Map ProjecaoItem to EvolucaoMensal format
      const evolucaoData: EvolucaoMensal[] = evolucao.map((item, index) => ({
        mes: index + 1,
        mesNome: item.mes,
        valorPrevisto: item.valorPrevisto,
        valorRealizado: item.valorRealizado,
        percentualExecutado: item.valorPrevisto > 0
          ? (item.valorRealizado / item.valorPrevisto) * 100
          : 0,
      }));
      exportarEvolucaoCSV(orcamento as Parameters<typeof exportarEvolucaoCSV>[0], evolucaoData);
      toast.success('Evolução mensal exportada para CSV');
    } catch (error) {
      console.error('Erro ao exportar evolução:', error);
      toast.error('Erro ao exportar evolução');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportarPDF = async () => {
    if (!orcamento) return;

    try {
      setIsExporting(true);
      toast.info('Gerando relatório PDF...');

      // Buscar relatório via API HTTP em vez de chamar serviço diretamente
      const response = await fetch(`/api/financeiro/orcamentos/${orcamentoId}/relatorio?formato=json`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || 'Não foi possível gerar o relatório');
      }

      const data = await response.json();
      if (!data.success || !data.data) {
        toast.error('Não foi possível gerar o relatório');
        return;
      }

      // Converter estrutura da API para formato esperado pelo exportador
      const relatorio = {
        orcamento: data.data.orcamento,
        analise: data.data.analise,
        resumo: data.data.analise?.resumo || null,
        alertas: data.data.analise?.alertas || [],
        evolucao: data.data.analise?.evolucao || [],
        projecao: null, // O exportador PDF não usa projeção individual
        geradoEm: data.data.geradoEm,
      };

      await exportarRelatorioPDF(relatorio);
      toast.success('Relatório PDF exportado com sucesso');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar PDF');
    } finally {
      setIsExporting(false);
    }
  };

  // Loading
  if (isLoading && !orcamento) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Erro
  if (error || !orcamento) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={handleVoltar}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          <p className="font-semibold">Erro ao carregar análise</p>
          <p>{error || 'Orçamento não encontrado'}</p>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[orcamento.status];

  return (
    <div className="space-y-6">
      {/* Header - Botão Voltar e Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleVoltar}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Badge variant={statusConfig.variant}>
            {statusConfig.label}
          </Badge>
        </div>
      </div>

      {/* Cards de Resumo */}
      <ResumoGeralCards resumo={resumo} isLoading={loadingAnalise} />

      {/* Tabs de Conteúdo */}
      <Tabs defaultValue="analise" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analise">Análise por Item</TabsTrigger>
          <TabsTrigger value="alertas">
            Alertas
            {alertas && alertas.length > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {alertas.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="projecao">Projeção</TabsTrigger>
        </TabsList>

        <div className="flex gap-2 mt-4 justify-end">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isExporting}>
                <FileDown className="mr-2 h-4 w-4" />
                {isExporting ? 'Exportando...' : 'Exportar'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportarCSV}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar Análise (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportarEvolucaoCSV}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar Evolução Mensal (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportarPDF}>
                <FileText className="mr-2 h-4 w-4" />
                Relatório Completo (PDF)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <TabsContent value="analise">
          <Card>
            <CardHeader>
              <CardTitle>Análise Orçado vs Realizado</CardTitle>
              <CardDescription>
                Comparativo detalhado por conta contábil
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnaliseItensTable itens={itensAnalise} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alertas">
          <Card>
            <CardHeader>
              <CardTitle>Alertas de Desvio</CardTitle>
              <CardDescription>
                Itens que necessitam de atenção
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertasDesvioList alertas={alertas ?? []} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projecao">
          <Card>
            <CardHeader>
              <CardTitle>Projeção de Execução</CardTitle>
              <CardDescription>
                Estimativa de fechamento baseada na tendência atual
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingProjecao ? (
                <Skeleton className="h-64" />
              ) : errorProjecao ? (
                <p className="text-center text-destructive py-8">{errorProjecao}</p>
              ) : (
                <ProjecaoTable itens={projecao} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
