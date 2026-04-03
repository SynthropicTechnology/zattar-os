'use client';

/**
 * Página de Comparação de Orçamentos
 * Permite comparar múltiplos orçamentos lado a lado
 */

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Plus,
  X,
  FileDown,
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
  exportarComparativoCSV,
  exportarComparativoPDF,
  type OrcamentoComItens,
  type RelatorioComparativo,
  useOrcamentos,
} from '@/app/(authenticated)/financeiro';
import { toast } from 'sonner';

// ============================================================================
// Constantes e Helpers
// ============================================================================

type BadgeTone = 'primary' | 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'muted';

const formatarValor = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

const formatarPercentual = (valor: number): string => {
  return `${valor >= 0 ? '+' : ''}${valor.toFixed(1)}%`;
};

const getVariacaoIcon = (variacao: number) => {
  if (variacao < -5) return <TrendingDown className="h-4 w-4 text-green-600" />;
  if (variacao > 5) return <TrendingUp className="h-4 w-4 text-red-600" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
};

const getVariacaoColor = (variacao: number): string => {
  if (variacao <= -10) return 'text-green-600';
  if (variacao <= 0) return 'text-green-600';
  if (variacao <= 10) return 'text-orange-600';
  if (variacao <= 20) return 'text-orange-600';
  return 'text-red-600';
};

const STATUS_CONFIG: Record<string, { label: string; tone: BadgeTone }> = {
  rascunho: { label: 'Rascunho', tone: 'neutral' },
  aprovado: { label: 'Aprovado', tone: 'info' },
  em_execucao: { label: 'Em Execução', tone: 'success' },
  encerrado: { label: 'Encerrado', tone: 'muted' },
};

// ============================================================================
// Componente de Seleção de Orçamento
// ============================================================================

function OrcamentoSelector({
  orcamentos,
  selectedId,
  onSelect,
  onRemove,
  isLoading,
  excludeIds,
}: {
  orcamentos: OrcamentoComItens[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onRemove: () => void;
  isLoading: boolean;
  excludeIds: number[];
}) {
  const disponiveis = orcamentos.filter((o) => !excludeIds.includes(o.id) || o.id === selectedId);

  if (selectedId) {
    const orcamento = orcamentos.find((o) => o.id === selectedId);
    if (orcamento) {
      const statusConfig = STATUS_CONFIG[orcamento.status];
      return (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{orcamento.nome}</CardTitle>
              <Button variant="ghost" size="icon" onClick={onRemove}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>
              {orcamento.ano} - {orcamento.periodo}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">
              {statusConfig.label}
            </Badge>
          </CardContent>
        </Card>
      );
    }
  }

  return (
    <Card className="border-dashed">
      <CardContent className="p-4">
        <Select
          value={selectedId?.toString() || ''}
          onValueChange={(value) => onSelect(parseInt(value, 10))}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um orçamento" />
          </SelectTrigger>
          <SelectContent>
            {disponiveis.map((orcamento) => (
              <SelectItem key={orcamento.id} value={orcamento.id.toString()}>
                {orcamento.nome} ({orcamento.ano})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Componente de Comparação
// ============================================================================

function ComparacaoCards({
  orcamentos,
}: {
  orcamentos: OrcamentoComItens[];
}) {
  if (orcamentos.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">
          Selecione pelo menos 2 orçamentos para comparar
        </p>
      </div>
    );
  }

  // Calcular totais
  const dadosComparacao = orcamentos.map((orcamento) => {
    const totalOrcado = orcamento.itens?.reduce((sum: number, item) => sum + (item.valorPrevisto || 0), 0) || 0;
    return {
      id: orcamento.id,
      nome: orcamento.nome,
      ano: orcamento.ano,
      periodo: orcamento.periodo,
      status: orcamento.status,
      totalOrcado,
      quantidadeItens: orcamento.itens?.length || 0,
    };
  });

  // Encontrar maior e menor valor
  const maiorValor = Math.max(...dadosComparacao.map((d) => d.totalOrcado));
  const menorValor = Math.min(...dadosComparacao.map((d) => d.totalOrcado));
  const mediaValor = dadosComparacao.reduce((sum, d) => sum + d.totalOrcado, 0) / dadosComparacao.length;

  return (
    <div className="space-y-6">
      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Maior Orçamento</CardDescription>
            <CardTitle className="text-2xl font-mono text-green-600">
              {formatarValor(maiorValor)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">
              {dadosComparacao.find((d) => d.totalOrcado === maiorValor)?.nome}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Menor Orçamento</CardDescription>
            <CardTitle className="text-2xl font-mono text-blue-600">
              {formatarValor(menorValor)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">
              {dadosComparacao.find((d) => d.totalOrcado === menorValor)?.nome}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Média</CardDescription>
            <CardTitle className="text-2xl font-mono">
              {formatarValor(mediaValor)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">
              Entre {orcamentos.length} orçamentos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de comparação */}
      <Card>
        <CardHeader>
          <CardTitle>Comparativo Detalhado</CardTitle>
          <CardDescription>Comparação lado a lado dos orçamentos selecionados</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Orçamento</TableHead>
                <TableHead>Ano/Período</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead className="text-center">Itens</TableHead>
                <TableHead className="text-center">vs Média</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dadosComparacao.map((dados) => {
                const variacaoVsMedia = ((dados.totalOrcado - mediaValor) / mediaValor) * 100;
                const statusConfig = STATUS_CONFIG[dados.status];
                return (
                  <TableRow key={dados.id}>
                    <TableCell className="font-medium">{dados.nome}</TableCell>
                    <TableCell>
                      {dados.ano} - {dados.periodo}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatarValor(dados.totalOrcado)}
                    </TableCell>
                    <TableCell className="text-center">{dados.quantidadeItens}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {getVariacaoIcon(variacaoVsMedia)}
                        <span className={getVariacaoColor(variacaoVsMedia)}>
                          {formatarPercentual(variacaoVsMedia)}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Gráfico visual de barras simples */}
      <Card>
        <CardHeader>
          <CardTitle>Visualização Comparativa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dadosComparacao.map((dados) => {
              const percentual = (dados.totalOrcado / maiorValor) * 100;
              return (
                <div key={dados.id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{dados.nome}</span>
                    <span className="font-mono">{formatarValor(dados.totalOrcado)}</span>
                  </div>
                  <div className="h-4 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${percentual}%` } as React.CSSProperties}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Componente Principal com Suspense
// ============================================================================

function CompararOrcamentosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estado para IDs selecionados
  const [selectedIds, setSelectedIds] = React.useState<number[]>([]);

  // Buscar todos os orçamentos
  const { orcamentos, isLoading, error, refetch } = useOrcamentos({
    filters: {
      limite: 100,
    },
    // ordenarPor: 'ano', // removido pois não é suportado diretamente no hook options, deve ir via filter se suportado ou ordenado no cliente
    // ordem: 'desc',
  });

  // Inicializar com IDs da URL
  React.useEffect(() => {
    const idsParam = searchParams.get('ids');
    if (idsParam) {
      const ids = idsParam.split(',').map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));
      setSelectedIds(ids);
    }
  }, [searchParams]);

  // Atualizar URL quando seleção mudar
  React.useEffect(() => {
    if (selectedIds.length > 0) {
      const url = new URL(window.location.href);
      url.searchParams.set('ids', selectedIds.join(','));
      window.history.replaceState({}, '', url.toString());
    }
  }, [selectedIds]);

  const handleVoltar = () => {
    router.push('/financeiro/orcamentos');
  };

  const handleAddSlot = () => {
    setSelectedIds([...selectedIds, 0]);
  };

  const handleSelectOrcamento = (index: number, id: number) => {
    const newIds = [...selectedIds];
    newIds[index] = id;
    setSelectedIds(newIds);
  };

  const handleRemoveOrcamento = (index: number) => {
    const newIds = selectedIds.filter((_, i) => i !== index);
    setSelectedIds(newIds);
  };

  const [isExporting, setIsExporting] = React.useState(false);

  // Criar dados de comparativo para exportação
  const criarDadosComparativo = (): RelatorioComparativo | null => {
    if (orcamentosSelecionados.length < 2) return null;

    const orcamentosComparativo = orcamentosSelecionados.map((o) => {
      const totalOrcado = o.itens?.reduce((sum: number, item) => sum + (item.valorPrevisto || 0), 0) || 0;
      const totalRealizado = 0; // Seria preenchido com dados reais
      const variacao = totalRealizado - totalOrcado;
      const percentualRealizacao = totalOrcado > 0 ? (totalRealizado / totalOrcado) * 100 : 0;

      return {
        orcamentoId: o.id,
        orcamentoNome: o.nome,
        ano: o.ano,
        periodo: o.periodo,
        totalOrcado,
        totalRealizado,
        variacao,
        percentualRealizacao,
      };
    });

    const totalOrcadoGeral = orcamentosComparativo.reduce((sum, o) => sum + o.totalOrcado, 0);
    const totalRealizadoGeral = orcamentosComparativo.reduce((sum, o) => sum + o.totalRealizado, 0);
    const variacaoMediaPercentual = orcamentosComparativo.length > 0
      ? orcamentosComparativo.reduce((sum, o) => {
        const varPct = o.totalOrcado > 0 ? (o.variacao / o.totalOrcado) * 100 : 0;
        return sum + varPct;
      }, 0) / orcamentosComparativo.length
      : 0;

    const ordenadosPorPerformance = [...orcamentosComparativo].sort(
      (a, b) => a.percentualRealizacao - b.percentualRealizacao
    );

    return {
      orcamentos: orcamentosComparativo,
      resumoGeral: {
        totalOrcadoGeral,
        totalRealizadoGeral,
        variacaoMediaPercentual,
        melhorPerformance: ordenadosPorPerformance[0] || null,
        piorPerformance: ordenadosPorPerformance[ordenadosPorPerformance.length - 1] || null,
      },
      geradoEm: new Date().toISOString(),
    } as unknown as RelatorioComparativo;
  };

  const handleExportarCSV = () => {
    const comparativo = criarDadosComparativo();
    if (!comparativo) {
      toast.warning('Selecione pelo menos 2 orçamentos para exportar');
      return;
    }

    try {
      setIsExporting(true);
      exportarComparativoCSV(comparativo);
      toast.success('Comparativo exportado para CSV');
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast.error('Erro ao exportar CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportarPDF = async () => {
    const comparativo = criarDadosComparativo();
    if (!comparativo) {
      toast.warning('Selecione pelo menos 2 orçamentos para exportar');
      return;
    }

    try {
      setIsExporting(true);
      toast.info('Gerando PDF...');
      await exportarComparativoPDF(comparativo);
      toast.success('Comparativo exportado para PDF');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar PDF');
    } finally {
      setIsExporting(false);
    }
  };

  // Filtrar orçamentos selecionados válidos
  const orcamentosSelecionados = selectedIds
    .filter((id) => id > 0)
    .map((id) => orcamentos.find((o) => o.id === id))
    .filter((o): o is OrcamentoComItens => o !== undefined);

  // Loading
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
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
  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={handleVoltar}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          <p className="font-semibold">Erro ao carregar orçamentos</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={handleVoltar}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                disabled={isExporting || orcamentosSelecionados.length < 2}
              >
                <FileDown className="mr-2 h-4 w-4" />
                {isExporting ? 'Exportando...' : 'Exportar'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportarCSV}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar Comparativo (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportarPDF}>
                <FileText className="mr-2 h-4 w-4" />
                Exportar Comparativo (PDF)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Seletores de Orçamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Orçamentos para Comparação</CardTitle>
          <CardDescription>
            Selecione até 5 orçamentos para comparar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {selectedIds.map((id, index) => (
              <OrcamentoSelector
                key={index}
                orcamentos={orcamentos}
                selectedId={id > 0 ? id : null}
                onSelect={(newId) => handleSelectOrcamento(index, newId)}
                onRemove={() => handleRemoveOrcamento(index)}
                isLoading={isLoading}
                excludeIds={selectedIds.filter((_, i) => i !== index)}
              />
            ))}
            {selectedIds.length < 5 && (
              <Card className="border-dashed">
                <CardContent className="p-4 flex items-center justify-center">
                  <Button variant="ghost" onClick={handleAddSlot}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comparação */}
      <ComparacaoCards orcamentos={orcamentosSelecionados} />
    </div>
  );
}

// ============================================================================
// Wrapper com Suspense
// ============================================================================

export default function CompararOrcamentosPage() {
  return (
    <React.Suspense fallback={
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    }>
      <CompararOrcamentosContent />
    </React.Suspense>
  );
}
