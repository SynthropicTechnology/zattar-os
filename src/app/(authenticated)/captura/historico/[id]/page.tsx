import { notFound } from 'next/navigation';

import { CapturaResult, type CapturaResultData, CapturaErrosFormatados, CapturaRawLogs } from '@/app/(authenticated)/captura';
import { buscarCapturaLog, buscarLogsBrutoPorCapturaId } from '@/app/(authenticated)/captura/server';
import { PageShell } from '@/components/shared/page-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Timer,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'completed':
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-100">
          <CheckCircle2 className="mr-1 h-3 w-3" /> Concluida
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="destructive">
          <XCircle className="mr-1 h-3 w-3" /> Falhou
        </Badge>
      );
    case 'in_progress':
      return (
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-100">
          <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Em Progresso
        </Badge>
      );
    case 'pending':
      return (
        <Badge variant="secondary">
          <Clock className="mr-1 h-3 w-3" /> Pendente
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function calcularDuracao(inicio: string, fim: string | null): string | null {
  if (!fim) return null;
  const ms = new Date(fim).getTime() - new Date(inicio).getTime();
  if (ms < 1000) return `${ms}ms`;
  const segundos = Math.floor(ms / 1000);
  if (segundos < 60) return `${segundos}s`;
  const minutos = Math.floor(segundos / 60);
  const segsRestantes = segundos % 60;
  if (minutos < 60) return `${minutos}m ${segsRestantes}s`;
  const horas = Math.floor(minutos / 60);
  const minsRestantes = minutos % 60;
  return `${horas}h ${minsRestantes}m ${segsRestantes}s`;
}

export default async function CapturaDetalhesPage({ params }: PageProps) {
  const { id } = await params;
  const capturaId = parseInt(id, 10);

  if (isNaN(capturaId)) {
    notFound();
  }

  const [captura, rawLogs] = await Promise.all([
    buscarCapturaLog(capturaId),
    buscarLogsBrutoPorCapturaId(capturaId),
  ]);

  if (!captura) {
    notFound();
  }

  const duracao = calcularDuracao(captura.iniciado_em, captura.concluido_em);
  const isFailed = captura.status === 'failed';
  const isCompleted = captura.status === 'completed';

  return (
    <PageShell
      title={`Detalhes da Captura #${captura.id}`}
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link href="/captura/historico">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
      }
    >
      {/* Informacoes da Captura */}
      <Card>
        <CardHeader>
          <CardTitle>Informacoes da Captura</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground">Status</span>
              <div><StatusBadge status={captura.status} /></div>
            </div>
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground">Iniciado em</span>
              <p className="text-sm">{new Date(captura.iniciado_em).toLocaleString('pt-BR')}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground">Concluido em</span>
              <p className="text-sm">
                {captura.concluido_em ? new Date(captura.concluido_em).toLocaleString('pt-BR') : '-'}
              </p>
            </div>
            {duracao && (
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">Duracao</span>
                <p className="text-sm flex items-center gap-1">
                  <Timer className="h-3.5 w-3.5 text-muted-foreground" />
                  {duracao}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resultado / Erros */}
      {isCompleted && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            <CapturaResult
              success={true}
              data={captura.resultado as CapturaResultData}
              captureId={captura.id}
            />
          </CardContent>
        </Card>
      )}

      {isFailed && captura.erro && (
        <CapturaErrosFormatados erro={captura.erro} />
      )}

      {/* Tabs: Logs Detalhados + Dados Brutos */}
      <Tabs defaultValue="logs" className="w-full">
        <TabsList>
          <TabsTrigger value="logs">
            Logs Detalhados
            {rawLogs.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">
                {rawLogs.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="dados-brutos">Dados Brutos</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="mt-4">
          <CapturaRawLogs rawLogs={rawLogs} />
        </TabsContent>

        <TabsContent value="dados-brutos" className="mt-4">
          {captura.resultado ? (
            <pre className="p-4 rounded-lg bg-muted overflow-auto max-h-125 text-xs">
              {JSON.stringify(captura.resultado, null, 2)}
            </pre>
          ) : (
            <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
              Nenhum dado disponivel.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
