import { notFound } from 'next/navigation';

import { CapturaResult, type CapturaResultData, CapturaErrosFormatados, CapturaRawLogs } from '@/app/(authenticated)/captura';
import { buscarCapturaLog, buscarLogsBrutoPorCapturaId } from '@/app/(authenticated)/captura/server';
import { Heading } from '@/components/ui/typography';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getSemanticBadgeVariant } from '@/lib/design-system';
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

const STATUS_ICONS: Record<string, { icon: typeof CheckCircle2; label: string; className?: string }> = {
  completed: { icon: CheckCircle2, label: 'Concluida' },
  failed: { icon: XCircle, label: 'Falhou' },
  in_progress: { icon: Loader2, label: 'Em Progresso', className: 'animate-spin' },
  pending: { icon: Clock, label: 'Pendente' },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_ICONS[status];
  if (!config) return <Badge variant="outline">{status}</Badge>;

  const Icon = config.icon;
  return (
    <Badge variant={getSemanticBadgeVariant('captura_status', status)}>
      <Icon className={`mr-1 h-3 w-3 ${config.className ?? ''}`} /> {config.label}
    </Badge>
  );
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
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <Heading level="page">{`Detalhes da Captura #${captura.id}`}</Heading>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" asChild>
            <Link href="/captura/historico">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
        </div>
      </div>
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
    </>
  );
}
