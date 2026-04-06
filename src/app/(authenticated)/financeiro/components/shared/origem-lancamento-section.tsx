'use client';

/**
 * Seção de Origem do Lançamento
 * Mostra se o lançamento financeiro foi gerado a partir de um acordo/condenação
 *
 * @migrated from src/app/(dashboard)/financeiro/components/origem-lancamento-section.tsx
 */

import * as React from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText,
  ExternalLink,
  Scale,
  User,
  Calendar,
  DollarSign,
  Link as LinkIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ============================================================================
// Types
// ============================================================================

interface OrigemLancamento {
  tipo: 'acordo_judicial' | 'contrato' | 'manual' | 'recorrente' | 'importacao_bancaria';
  // Dados do acordo (se aplicável)
  acordo?: {
    id: number;
    tipo: 'acordo' | 'condenacao';
    direcao: 'recebimento' | 'pagamento';
    valorTotal: number;
    numeroParcelas: number;
    status: string;
  };
  // Dados da parcela (se aplicável)
  parcela?: {
    id: number;
    numeroParcela: number;
    valorPrincipal: number;
    dataVencimento: string;
    status: string;
  };
  // Dados do processo (se aplicável)
  processo?: {
    id: number;
    numeroProcesso: string;
  };
  // Dados do cliente (se aplicável)
  cliente?: {
    id: number;
    nome: string;
  };
}

interface OrigemLancamentoSectionProps {
  dadosAdicionais?: Record<string, unknown> | null;
  className?: string;
}

// ============================================================================
// Helpers
// ============================================================================

const formatarValor = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

const formatarData = (data: string | null): string => {
  if (!data) return '-';
  return format(new Date(data), 'dd/MM/yyyy', { locale: ptBR });
};

// ============================================================================
// Sub-components
// ============================================================================

function DetalheItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="space-y-0.5 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function OrigemLancamentoSection({
  dadosAdicionais,
  className,
}: OrigemLancamentoSectionProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [origem, setOrigem] = React.useState<OrigemLancamento | null>(null);

  // Extrair informações de origem dos dados adicionais
  React.useEffect(() => {
    if (!dadosAdicionais) {
      setIsLoading(false);
      setOrigem(null);
      return;
    }

    // Verificar se é de um acordo judicial
    const isAcordoJudicial =
      dadosAdicionais.parcela_id !== undefined ||
      dadosAdicionais.acordo_id !== undefined ||
      dadosAdicionais.tipo_acordo !== undefined;

    if (isAcordoJudicial) {
      setOrigem({
        tipo: 'acordo_judicial',
        acordo: dadosAdicionais.acordo_id
          ? {
            id: dadosAdicionais.acordo_id as number,
            tipo: (dadosAdicionais.tipo_acordo as 'acordo' | 'condenacao') || 'acordo',
            direcao: (dadosAdicionais.direcao as 'recebimento' | 'pagamento') || 'recebimento',
            valorTotal: (dadosAdicionais.valor_total_acordo as number) || 0,
            numeroParcelas: (dadosAdicionais.total_parcelas as number) || 1,
            status: 'ativo',
          }
          : undefined,
        parcela: dadosAdicionais.parcela_id
          ? {
            id: dadosAdicionais.parcela_id as number,
            numeroParcela: (dadosAdicionais.numero_parcela as number) || 1,
            valorPrincipal: (dadosAdicionais.valor_principal as number) || 0,
            dataVencimento: (dadosAdicionais.data_vencimento_parcela as string) || '',
            status: 'sincronizado',
          }
          : undefined,
        processo: dadosAdicionais.processo_id
          ? {
            id: dadosAdicionais.processo_id as number,
            numeroProcesso: (dadosAdicionais.numero_processo as string) || '',
          }
          : undefined,
        cliente: dadosAdicionais.cliente_id
          ? {
            id: dadosAdicionais.cliente_id as number,
            nome: (dadosAdicionais.cliente_nome as string) || '',
          }
          : undefined,
      });
    } else if (dadosAdicionais.recorrencia_id) {
      setOrigem({ tipo: 'recorrente' });
    } else if (dadosAdicionais.importacao_id) {
      setOrigem({ tipo: 'importacao_bancaria' });
    } else if (dadosAdicionais.contrato_id) {
      setOrigem({ tipo: 'contrato' });
    } else {
      setOrigem({ tipo: 'manual' });
    }

    setIsLoading(false);
  }, [dadosAdicionais]);

  // Se não há origem relevante para exibir, não renderiza nada
  if (!isLoading && (!origem || origem.tipo === 'manual')) {
    return null;
  }

  // Skeleton durante carregamento
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20" />
        </CardContent>
      </Card>
    );
  }

  // Renderização para origem de acordo judicial
  if (origem?.tipo === 'acordo_judicial') {
    const { acordo, parcela, processo, cliente } = origem;

    return (
      <Card className={cn('border-info/30', className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-info">
              <Scale className="h-5 w-5" />
              Origem: Acordo Judicial
            </CardTitle>
            <Badge variant="info">
              <LinkIcon className="h-3 w-3 mr-1" />
              Vinculado
            </Badge>
          </div>
          <CardDescription>
            Este lançamento foi gerado automaticamente a partir de um acordo/condenação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {acordo && (
              <DetalheItem
                icon={Scale}
                label="Acordo/Condenação"
                value={
                  <div className="flex items-center gap-2">
                    <span>
                      {acordo.tipo === 'acordo' ? 'Acordo' : 'Condenação'} #{acordo.id}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {acordo.direcao === 'recebimento' ? 'Recebimento' : 'Pagamento'}
                    </Badge>
                  </div>
                }
              />
            )}

            {parcela && (
              <DetalheItem
                icon={FileText}
                label="Parcela"
                value={`#${parcela.numeroParcela} de ${acordo?.numeroParcelas || '?'}`}
              />
            )}

            {processo && processo.numeroProcesso && (
              <DetalheItem
                icon={FileText}
                label="Processo"
                value={processo.numeroProcesso}
              />
            )}

            {cliente && cliente.nome && (
              <DetalheItem icon={User} label="Cliente" value={cliente.nome} />
            )}

            {parcela && parcela.valorPrincipal > 0 && (
              <DetalheItem
                icon={DollarSign}
                label="Valor Principal da Parcela"
                value={formatarValor(parcela.valorPrincipal)}
              />
            )}

            {parcela && parcela.dataVencimento && (
              <DetalheItem
                icon={Calendar}
                label="Vencimento da Parcela"
                value={formatarData(parcela.dataVencimento)}
              />
            )}
          </div>

          {/* Links de navegação */}
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {acordo && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/obrigacoes/${acordo.id}`}>
                  <Scale className="h-4 w-4 mr-2" />
                  Ver Acordo
                  <ExternalLink className="h-3 w-3 ml-2" />
                </Link>
              </Button>
            )}

            {processo && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/app/processos/${processo.id}`}>
                  <FileText className="h-4 w-4 mr-2" />
                  Ver Processo
                  <ExternalLink className="h-3 w-3 ml-2" />
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Renderização para outras origens
  const origemLabels: Record<string, { label: string; description: string }> = {
    recorrente: {
      label: 'Lançamento Recorrente',
      description: 'Este lançamento foi gerado automaticamente por uma recorrência',
    },
    importacao_bancaria: {
      label: 'Importação Bancária',
      description: 'Este lançamento foi importado de um extrato bancário',
    },
    contrato: {
      label: 'Contrato',
      description: 'Este lançamento está vinculado a um contrato',
    },
  };

  const origemInfo = origemLabels[origem?.tipo || 'manual'];
  if (!origemInfo) return null;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Origem: {origemInfo.label}
        </CardTitle>
        <CardDescription>{origemInfo.description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
