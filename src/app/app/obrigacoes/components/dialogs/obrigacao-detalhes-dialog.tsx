'use client';

/**
 * Dialog de Detalhes de Obrigação
 * Exibe informações completas de uma obrigação financeira
 */

import * as React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  RefreshCw,
  Link as LinkIcon,
  ExternalLink,
  User,
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  ObrigacaoComDetalhes,
  StatusObrigacao,
  StatusSincronizacao,
} from '../../domain';

// ============================================================================
// Types
// ============================================================================

interface ObrigacaoDetalhesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obrigacao?: ObrigacaoComDetalhes | null;
  onSincronizar?: (obrigacao: ObrigacaoComDetalhes) => void;
  onVerLancamento?: (obrigacao: ObrigacaoComDetalhes) => void;
}

// ============================================================================
// Constantes
// ============================================================================

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive';

const TIPO_CONFIG: Record<string, { label: string; variant: BadgeVariant | string }> = {
  acordo: { label: 'Acordo', variant: 'default' },
  condenacao: { label: 'Condenação', variant: 'destructive' },
  custas_processuais: { label: 'Custas Processuais', variant: 'secondary' },
  conta_receber: { label: 'Conta a Receber', variant: 'success' }, // Custom class needed or handle logic
  conta_pagar: { label: 'Conta a Pagar', variant: 'warning' },
};

const STATUS_CONFIG: Record<StatusObrigacao, { label: string; variant: BadgeVariant | string }> = {
  pendente: { label: 'Pendente', variant: 'warning' },
  vencida: { label: 'Vencida', variant: 'destructive' },
  efetivada: { label: 'Efetivada', variant: 'success' },
  cancelada: { label: 'Cancelada', variant: 'outline' },
  estornada: { label: 'Estornada', variant: 'secondary' },
};

const SINCRONIZACAO_CONFIG: Record<StatusSincronizacao, { label: string; icon: React.ReactNode; className: string }> = {
  sincronizado: { label: 'Sincronizado', icon: <CheckCircle className="h-4 w-4" />, className: 'text-green-600' },
  pendente: { label: 'Pendente', icon: <Clock className="h-4 w-4" />, className: 'text-orange-600' },
  inconsistente: { label: 'Inconsistente', icon: <AlertCircle className="h-4 w-4" />, className: 'text-red-600' },
  nao_aplicavel: { label: 'N/A', icon: null, className: 'text-muted-foreground' },
};

// ============================================================================
// Helpers
// ============================================================================

const formatarValor = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

const formatarData = (data: string | null | undefined): string => {
  if (!data) return '-';
  return format(new Date(data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
};

const formatarDataCurta = (data: string | null | undefined): string => {
  if (!data) return '-';
  return format(new Date(data), 'dd/MM/yyyy', { locale: ptBR });
};

// ============================================================================
// Sub-components
// ============================================================================

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}

function InfoRow({ label, value, icon }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3 py-2">
      {icon && (
        <div className="shrink-0 mt-0.5 text-muted-foreground">{icon}</div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value || '-'}</p>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
      {children}
    </h4>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ObrigacaoDetalhesDialog({
  open,
  onOpenChange,
  obrigacao,
  onSincronizar,
  onVerLancamento,
}: ObrigacaoDetalhesDialogProps) {
  if (!obrigacao) {
    return null;
  }

  const tipoConfig = TIPO_CONFIG[obrigacao.tipo] || { label: obrigacao.tipo, variant: 'outline' };
  const statusConfig = STATUS_CONFIG[obrigacao.status];
  const sincConfig = SINCRONIZACAO_CONFIG[obrigacao.statusSincronizacao];

  const podeVerLancamento = obrigacao.lancamentoId !== null;
  const podeSincronizar =
    obrigacao.tipoEntidade === 'parcela' &&
    (obrigacao.statusSincronizacao === 'pendente' ||
      obrigacao.statusSincronizacao === 'inconsistente');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>{obrigacao.descricao}</span>
          </DialogTitle>
          <DialogDescription>
            Detalhes completos da obrigação financeira
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Badges de status */}
          <div className="flex flex-wrap gap-2">
            <Badge variant={tipoConfig.variant as BadgeVariant}>
              {tipoConfig.label}
            </Badge>
            <Badge variant={(statusConfig?.variant as BadgeVariant) || 'outline'}>
              {statusConfig?.label || obrigacao.status}
            </Badge>
            <div className={cn('flex items-center gap-1 text-sm', sincConfig?.className)}>
              {sincConfig?.icon}
              <span>{sincConfig?.label}</span>
            </div>
          </div>

          {/* Valores */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
            <div>
              <p className="text-xs text-muted-foreground">Valor</p>
              <p className="text-2xl font-bold">{formatarValor(obrigacao.valor)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Vencimento</p>
              <p
                className={cn(
                  'text-2xl font-bold',
                  obrigacao.status === 'vencida' && 'text-destructive'
                )}
              >
                {formatarDataCurta(obrigacao.dataVencimento)}
              </p>
              {obrigacao.diasAteVencimento !== null && (
                <p className="text-xs text-muted-foreground">
                  {obrigacao.diasAteVencimento === 0
                    ? 'Vence hoje'
                    : obrigacao.diasAteVencimento! > 0
                      ? `Em ${obrigacao.diasAteVencimento} dia${obrigacao.diasAteVencimento! > 1 ? 's' : ''}`
                      : `Vencido há ${Math.abs(obrigacao.diasAteVencimento!)} dia${Math.abs(obrigacao.diasAteVencimento!) > 1 ? 's' : ''}`}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Informações gerais */}
          <div>
            <SectionTitle>Informações Gerais</SectionTitle>
            <div className="grid grid-cols-2 gap-x-4">
              <InfoRow
                label="Data de Lançamento"
                value={formatarData(obrigacao.dataLancamento)}
                icon={<Calendar className="h-4 w-4" />}
              />
              <InfoRow
                label="Data de Efetivação"
                value={formatarData(obrigacao.dataEfetivacao)}
                icon={<CheckCircle className="h-4 w-4" />}
              />
            </div>
          </div>

          {/* Cliente */}
          {obrigacao.clienteId && (
            <>
              <Separator />
              <div>
                <SectionTitle>Cliente</SectionTitle>
                 {/* Needs to fetch client details if not populated, but keeping simple for now */}
                <InfoRow label="ID Cliente" value={obrigacao.clienteId} icon={<User className="h-4 w-4" />} />
              </div>
            </>
          )}

          {/* Processo */}
          {obrigacao.processoId && (
            <>
              <Separator />
              <div>
                <SectionTitle>Processo</SectionTitle>
                <InfoRow label="ID Processo" value={obrigacao.processoId} icon={<FileText className="h-4 w-4" />} />
              </div>
            </>
          )}

          {/* Acordo */}
          {obrigacao.acordoId && (
            <>
              <Separator />
              <div>
                <SectionTitle>Acordo</SectionTitle>
                <InfoRow label="ID Acordo" value={obrigacao.acordoId} />
              </div>
            </>
          )}

          {/* Ações */}
          <Separator />
          <div className="flex flex-wrap gap-2">
            {podeVerLancamento && onVerLancamento && (
              <Button
                variant="outline"
                onClick={() => onVerLancamento(obrigacao)}
              >
                <LinkIcon className="mr-2 h-4 w-4" />
                Ver Lançamento Financeiro
                <ExternalLink className="ml-2 h-3 w-3" />
              </Button>
            )}
            {podeSincronizar && onSincronizar && (
              <Button variant="outline" onClick={() => onSincronizar(obrigacao)}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sincronizar
              </Button>
            )}
            {obrigacao.acordoId && (
              <Button
                variant="outline"
                onClick={() => {
                  window.location.href = `/acordos-condenacoes/${obrigacao.acordoId}`;
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                Ver Acordo
                <ExternalLink className="ml-2 h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
