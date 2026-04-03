'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTransacaoDetalhes, useSugestoesConciliacao, conciliarManual, desconciliar } from '@/app/(authenticated)/financeiro';
import { toast } from 'sonner';

export default function TransacaoDetalhePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const { transacao, isLoading, refetch } = useTransacaoDetalhes(id);
  const { sugestoes } = useSugestoesConciliacao(id);

  const handleConciliar = async (lancamentoId: number | null) => {
    try {
      await conciliarManual({ transacaoImportadaId: id, lancamentoFinanceiroId: lancamentoId });
      toast.success(lancamentoId ? 'Conciliado com sucesso' : 'Marcado como ignorado');
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao conciliar');
    }
  };

  const handleDesconciliar = async () => {
    try {
      await desconciliar(id);
      toast.success('Transação desconciliada');
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao desconciliar');
    }
  };

  if (isLoading || !transacao) {
    return <div className="p-4 text-sm text-muted-foreground">Carregando...</div>;
  }

  const status = transacao.conciliacao?.status || 'pendente';
  const tipoConciliacao = transacao.conciliacao?.tipoConciliacao || '-';
  const score = transacao.conciliacao?.scoreSimilaridade;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => router.push('/financeiro/conciliacao-bancaria')}>
            Voltar
          </Button>
          <Badge>{status}</Badge>
        </div>
        <div className="flex gap-2">
          {status === 'conciliado' ? (
            <Button variant="outline" onClick={handleDesconciliar}>
              Desconciliar
            </Button>
          ) : (
            <Button onClick={() => handleConciliar(null)}>Marcar como Ignorado</Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4 space-y-2">
          <p className="text-sm font-medium">Dados da transação</p>
          <Separator />
          <p className="text-lg font-semibold">{transacao.descricao}</p>
          <p className="text-sm text-muted-foreground">Valor: {transacao.valor}</p>
          <p className="text-sm text-muted-foreground">Data: {transacao.dataTransacao}</p>
          <p className="text-sm text-muted-foreground">Documento: {transacao.documento || '-'}</p>
        </Card>

        <Card className="p-4 space-y-2">
          <p className="text-sm font-medium">Conciliação</p>
          <Separator />
          <p className="text-sm text-muted-foreground">Status: {status}</p>
          <p className="text-sm text-muted-foreground">Tipo: {tipoConciliacao}</p>
          {score !== null && score !== undefined && (
            <p className="text-sm text-muted-foreground">
              Score: {score}
            </p>
          )}
          {transacao.conciliacao?.observacoes && (
            <p className="text-sm text-muted-foreground">{transacao.conciliacao.observacoes}</p>
          )}
          {transacao.lancamentoVinculado && (
            <div className="rounded-md border p-3">
              <p className="text-xs uppercase text-muted-foreground">Lançamento vinculado</p>
              <p className="text-sm font-medium">{transacao.lancamentoVinculado.descricao}</p>
            </div>
          )}
        </Card>
      </div>

      {status === 'pendente' && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Sugestões de conciliação</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {sugestoes?.map((s) => (
              <div key={s.lancamentoId} className="rounded-md border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{s.lancamento.descricao}</p>
                  <Badge>{Math.round(s.score)}%</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Valor {s.lancamento.valor} - Data {s.lancamento.dataLancamento}
                </p>
                <div className="flex gap-2 text-xs text-muted-foreground flex-wrap">
                  {s.diferencas?.map((d) => (
                    <Badge key={d} variant="outline">
                      {d}
                    </Badge>
                  ))}
                </div>
                <Button size="sm" onClick={() => handleConciliar(s.lancamentoId)}>
                  Conciliar
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
