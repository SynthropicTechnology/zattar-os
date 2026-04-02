'use client';

/**
 * Página de Detalhes de Conta a Receber
 */

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  cancelarContaReceber,
  ContaReceberFormDialog,
  type ContaReceberComDetalhes,
  getHistoricoRecebimentos,
  isParcialmenteRecebida,
  FORMA_PAGAMENTO_LABELS,
  OrigemLancamentoSection,
  ReceberContaDialog,
  type FormaPagamento,
  type StatusContaReceber,
  type StatusLancamento,
  useCentrosCustoAtivos,
  useContaReceber,
  useContasBancarias,
  usePlanoContasAnaliticas,
} from '@/features/financeiro';
import { useClientes } from '@/app/app/partes';
import { useContratos } from '@/features/contratos';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  CreditCard,
  XCircle,
  Pencil,
  Repeat,
  Calendar,
  DollarSign,
  Building2,
  FileText,
  Clock,
  AlertTriangle,
  Paperclip,
  ExternalLink,
  FileImage,
  File,
  User,
  FileSignature,
  History,
  CheckCircle2,
  CircleDollarSign,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ============================================================================
// Constantes
// ============================================================================

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'info' | 'success' | 'warning' | 'destructive' | 'neutral' | 'accent';

const STATUS_CONFIG: Record<StatusContaReceber, { label: string; variant: BadgeVariant }> = {
  pendente: { label: 'Pendente', variant: 'warning' },
  confirmado: { label: 'Recebido', variant: 'success' },
  pago: { label: 'Pago', variant: 'success' },
  recebido: { label: 'Recebido', variant: 'success' },
  cancelado: { label: 'Cancelado', variant: 'outline' },
  estornado: { label: 'Estornado', variant: 'destructive' },
};

const formatarValor = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

const formatarData = (data: string | null): string => {
  if (!data) return '-';
  return format(new Date(data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
};

const formatarDataHora = (data: string | null): string => {
  if (!data) return '-';
  return format(new Date(data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
};

// ============================================================================
// Componente de Item de Detalhe
// ============================================================================

function DetalheItem({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  );
}

// ============================================================================
// Componente Principal
// ============================================================================

export default function ContaReceberDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id ? parseInt(params.id as string, 10) : 0;

  // Estados
  const [receberDialogOpen, setReceberDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [cancelarDialogOpen, setCancelarDialogOpen] = React.useState(false);

  // Buscar dados
  const { contaReceber: contaReceberRaw, isLoading, error, refetch } = useContaReceber(id);
  const contaReceber = contaReceberRaw as ContaReceberComDetalhes | null;

  // Dados auxiliares para os formulários
  const { contasBancarias } = useContasBancarias();
  const { clientes: clientesRaw } = useClientes({ limite: 500, ativo: true });
  const { contratos } = useContratos({ limite: 500 });
  const { planoContas } = usePlanoContasAnaliticas();
  const { centrosCusto } = useCentrosCustoAtivos();

  // Mapear clientes para o formato esperado pelo formulário
  const clientes = React.useMemo(() => {
    return clientesRaw.map((cliente) => ({
      id: cliente.id,
      razaoSocial: cliente.tipo_pessoa === 'pj' 
        ? cliente.nome 
        : cliente.nome,
      nomeFantasia: cliente.nome_social_fantasia || undefined,
    }));
  }, [clientesRaw]);

  const handleVoltar = () => {
    router.push('/financeiro/contas-receber');
  };

  const handleConfirmCancelar = React.useCallback(async () => {
    try {
      await cancelarContaReceber(id);
      toast.success('Conta cancelada com sucesso');
      setCancelarDialogOpen(false);
      refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao cancelar conta';
      toast.error(message);
    }
  }, [id, refetch]);

  // Verificar se conta está vencida
  const isVencida = React.useMemo(() => {
    if (!contaReceber || contaReceber.status !== 'pendente' || !contaReceber.dataVencimento) {
      return false;
    }
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return new Date(contaReceber.dataVencimento) < hoje;
  }, [contaReceber]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={handleVoltar}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          <p className="font-semibold">Erro ao carregar conta:</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (!contaReceber) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={handleVoltar}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="rounded-md bg-muted p-8 text-center">
          <p className="text-lg font-medium">Conta não encontrada</p>
          <p className="text-sm text-muted-foreground">
            A conta solicitada não existe ou foi removida.
          </p>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[contaReceber.status as StatusLancamento];
  const isPendente = contaReceber.status === 'pendente';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleVoltar}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Badge variant={statusConfig.variant}>
            {statusConfig.label}
          </Badge>
          {contaReceber.recorrente && (
            <Badge variant="outline">
              <Repeat className="mr-1 h-3 w-3" />
              Recorrente
            </Badge>
          )}
        </div>

        {/* Actions */}
        {isPendente && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button variant="outline" onClick={() => setCancelarDialogOpen(true)}>
              <XCircle className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button onClick={() => setReceberDialogOpen(true)}>
              <CreditCard className="mr-2 h-4 w-4" />
              Receber
            </Button>
          </div>
        )}
      </div>

      {/* Alert Vencida */}
      {isVencida && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <div>
            <p className="font-medium text-destructive">Conta Inadimplente</p>
            <p className="text-sm text-destructive/80">
              Esta conta venceu em {formatarData(contaReceber.dataVencimento)}. Entre em contato
              com o cliente para regularização.
            </p>
          </div>
        </div>
      )}

      {/* Origem do Lançamento (se aplicável) */}
      <OrigemLancamentoSection
        dadosAdicionais={contaReceber.dadosAdicionais}
        className="mb-6"
      />

      {/* Cards de detalhes */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações Financeiras */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Informações Financeiras
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetalheItem
              icon={DollarSign}
              label="Valor Total"
              value={
                <span className="text-xl font-bold text-green-600">
                  {formatarValor(contaReceber.valor)}
                </span>
              }
            />
            {/* Show received/pending amounts for partial payments */}
            {(() => {
              const historico = getHistoricoRecebimentos(contaReceber);
              if (!historico || historico.recebimentos.length === 0) return null;
              const parcial = historico.valorPendente > 0;
              return (
                <>
                  <DetalheItem
                    icon={CheckCircle2}
                    label="Valor Recebido"
                    value={
                      <span className="font-semibold text-green-600">
                        {formatarValor(historico.valorTotalRecebido)}
                      </span>
                    }
                  />
                  {parcial && (
                    <DetalheItem
                      icon={CircleDollarSign}
                      label="Valor Pendente"
                      value={
                        <span className="font-semibold text-orange-600">
                          {formatarValor(historico.valorPendente)}
                        </span>
                      }
                    />
                  )}
                </>
              );
            })()}
            <DetalheItem
              icon={Calendar}
              label="Data de Vencimento"
              value={
                <span className={cn(isVencida && 'text-destructive')}>
                  {formatarData(contaReceber.dataVencimento)}
                </span>
              }
            />
            {contaReceber.dataEfetivacao && (
              <DetalheItem
                icon={Calendar}
                label="Data de Recebimento"
                value={formatarData(contaReceber.dataEfetivacao)}
              />
            )}
            {contaReceber.formaPagamento && (
              <DetalheItem
                icon={CreditCard}
                label="Forma de Recebimento"
                value={FORMA_PAGAMENTO_LABELS[contaReceber.formaPagamento as FormaPagamento] || contaReceber.formaPagamento}
              />
            )}
            {contaReceber.categoria && (
              <DetalheItem
                icon={FileText}
                label="Categoria"
                value={
                  <Badge variant="outline" className="capitalize">
                    {contaReceber.categoria.replace(/_/g, ' ')}
                  </Badge>
                }
              />
            )}
          </CardContent>
        </Card>

        {/* Informações de Vinculação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Vinculações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {contaReceber.cliente ? (
              <DetalheItem
                icon={User}
                label="Cliente"
                value={
                  <div>
                    <p className="font-medium">
                      {contaReceber.cliente.nomeFantasia || contaReceber.cliente.razaoSocial}
                    </p>
                    {contaReceber.cliente.cnpj && (
                      <p className="text-sm text-muted-foreground">
                        CNPJ: {contaReceber.cliente.cnpj}
                      </p>
                    )}
                  </div>
                }
              />
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum cliente vinculado</p>
            )}
            {contaReceber.contrato && (
              <DetalheItem
                icon={FileSignature}
                label="Contrato"
                value={
                  <div>
                    <p className="font-medium">{contaReceber.contrato.numero}</p>
                    {contaReceber.contrato.descricao && (
                      <p className="text-sm text-muted-foreground">
                        {contaReceber.contrato.descricao}
                      </p>
                    )}
                  </div>
                }
              />
            )}
            {contaReceber.contaContabil && (
              <DetalheItem
                icon={FileText}
                label="Conta Contábil"
                value={`${contaReceber.contaContabil.codigo} - ${contaReceber.contaContabil.nome}`}
              />
            )}
            {contaReceber.centroCusto && (
              <DetalheItem
                icon={Building2}
                label="Centro de Custo"
                value={`${contaReceber.centroCusto.codigo} - ${contaReceber.centroCusto.nome}`}
              />
            )}
            {contaReceber.contaBancaria && (
              <DetalheItem
                icon={CreditCard}
                label="Conta Bancária"
                value={contaReceber.contaBancaria.nome}
              />
            )}
            {contaReceber.documento && (
              <DetalheItem
                icon={FileText}
                label="Nº do Documento"
                value={contaReceber.documento}
              />
            )}
          </CardContent>
        </Card>

        {/* Histórico de Recebimentos */}
        {(() => {
          const historico = getHistoricoRecebimentos(contaReceber);
          const parcial = isParcialmenteRecebida(contaReceber);
          const temHistorico = historico && historico.recebimentos.length > 0;

          if (!temHistorico) return null;

          return (
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Histórico de Recebimentos
                  </CardTitle>
                  {parcial && (
                    <Badge variant="warning">
                      Pagamento Parcial
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  {historico!.recebimentos.length} recebimento
                  {historico!.recebimentos.length !== 1 ? 's' : ''} registrado
                  {historico!.recebimentos.length !== 1 ? 's' : ''}
                  {' • '}
                  Total recebido: {formatarValor(historico!.valorTotalRecebido)}
                  {parcial && ` • Pendente: ${formatarValor(historico!.valorPendente)}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted" />

                  <div className="space-y-6">
                    {historico!.recebimentos.map((recebimento, index) => (
                      <div key={recebimento.id} className="relative flex gap-4">
                        {/* Timeline dot */}
                        <div
                          className={cn(
                            'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                            index === historico!.recebimentos.length - 1 && contaReceber.status === 'confirmado'
                              ? 'bg-green-100/50 text-green-600'
                              : 'bg-blue-100/50 text-blue-600'
                          )}
                        >
                          {index === historico!.recebimentos.length - 1 && contaReceber.status === 'confirmado' ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <CircleDollarSign className="h-4 w-4" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 pb-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-medium">
                                {formatarValor(recebimento.valor)}
                                <span className="ml-2 text-sm font-normal text-muted-foreground">
                                  via {FORMA_PAGAMENTO_LABELS[recebimento.formaRecebimento] || recebimento.formaRecebimento}
                                </span>
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatarData(recebimento.dataRecebimento)}
                              </p>
                            </div>
                            {recebimento.comprovante && (
                              <a
                                href={recebimento.comprovante.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-sm text-primary hover:underline"
                              >
                                <Paperclip className="h-3 w-3" />
                                Comprovante
                              </a>
                            )}
                          </div>
                          {recebimento.observacoes && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {recebimento.observacoes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Observações */}
        {contaReceber.observacoes && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Observações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{contaReceber.observacoes}</p>
            </CardContent>
          </Card>
        )}

        {/* Anexos */}
        {contaReceber.anexos && contaReceber.anexos.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Paperclip className="h-5 w-5" />
                Anexos
              </CardTitle>
              <CardDescription>
                {contaReceber.anexos.length} arquivo{contaReceber.anexos.length !== 1 ? 's' : ''} anexado{contaReceber.anexos.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {contaReceber.anexos.map((anexo: { nome: string; url: string; tipo?: string; tamanho?: number }, index: number) => {
                  const isImage = anexo.tipo?.startsWith('image/');
                  const isPdf = anexo.tipo === 'application/pdf';
                  const FileIcon = isImage ? FileImage : isPdf ? FileText : File;

                  return (
                    <a
                      key={index}
                      href={anexo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <FileIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{anexo.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {anexo.tamanho
                            ? `${(anexo.tamanho / 1024).toFixed(1)} KB`
                            : 'Tamanho desconhecido'}
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </a>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informações de Auditoria */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Auditoria
            </CardTitle>
            <CardDescription>Informações de criação e atualização</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <DetalheItem
                icon={Calendar}
                label="Data de Lançamento"
                value={formatarData(contaReceber.dataLancamento)}
              />
              <DetalheItem
                icon={Clock}
                label="Criado em"
                value={formatarDataHora(contaReceber.createdAt)}
              />
              <DetalheItem
                icon={Clock}
                label="Atualizado em"
                value={formatarDataHora(contaReceber.updatedAt)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <ReceberContaDialog
        open={receberDialogOpen}
        onOpenChange={setReceberDialogOpen}
        conta={contaReceber}
        contasBancarias={contasBancarias}
        onSuccess={refetch}
      />

      <ContaReceberFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        conta={contaReceber}
        contasBancarias={contasBancarias}
        planosContas={planoContas}
        centrosCusto={centrosCusto}
        clientes={clientes}
        contratos={contratos}
        onSuccess={refetch}
      />

      <AlertDialog open={cancelarDialogOpen} onOpenChange={setCancelarDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Conta a Receber</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar esta conta?
              <span className="block mt-2 font-medium text-foreground">
                {contaReceber.descricao} - {formatarValor(contaReceber.valor)}
              </span>
              <span className="block mt-2 text-orange-600">
                A conta será marcada como cancelada mas permanecerá no histórico.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancelar}>
              Cancelar Conta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
