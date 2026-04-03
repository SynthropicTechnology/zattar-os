'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { DollarSign, Users, FileText } from 'lucide-react';

import { MetricCard } from '@/app/(authenticated)/dashboard';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { TableSkeleton, MetricCardSkeleton } from '@/components/shared/skeletons';

export default function DesignSystemPage() {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-12">
      <header className="text-center">
        <h1 className="font-heading text-4xl font-bold tracking-tight">
          Design System
        </h1>
        <p className="mt-2 text-muted-foreground">
          Demonstração de componentes visuais da Zattar.
        </p>
      </header>

      {/* Botões */}
      <section>
        <h2 className="font-heading text-2xl font-semibold">Botões</h2>
        <Separator className="my-4" />
        <div className="flex flex-wrap gap-4">
          <Button>Padrão</Button>
          <Button variant="secondary">Secundário</Button>
          <Button variant="destructive">Destrutivo</Button>
          <Button variant="outline">Contorno</Button>
          <Button variant="ghost">Fantasma</Button>
          <Button variant="link">Link</Button>
        </div>
      </section>

      {/* Badges */}
      <section>
        <h2 className="font-heading text-2xl font-semibold">Badges</h2>
        <Separator className="my-4" />
        <div className="space-y-6">
          <div>
            <h3 className="font-heading text-lg font-medium">Solid (padrão)</h3>
            <div className="flex flex-wrap gap-4 mt-3">
              <Badge>Padrão</Badge>
              <Badge variant="secondary">Secundário</Badge>
              <Badge variant="destructive">Destrutivo</Badge>
              <Badge variant="success">Sucesso</Badge>
              <Badge variant="warning">Aviso</Badge>
              <Badge variant="info">Info</Badge>
              <Badge variant="accent">Accent</Badge>
              <Badge variant="neutral">Neutro</Badge>
              <Badge variant="outline">Contorno</Badge>
            </div>
          </div>

          <div>
            <h3 className="font-heading text-lg font-medium">Soft (sem contorno)</h3>
            <div className="flex flex-wrap gap-4 mt-3">
              <Badge tone="soft">Padrão</Badge>
              <Badge tone="soft" variant="secondary">Secundário</Badge>
              <Badge tone="soft" variant="destructive">Destrutivo</Badge>
              <Badge tone="soft" variant="success">Sucesso</Badge>
              <Badge tone="soft" variant="warning">Aviso</Badge>
              <Badge tone="soft" variant="info">Info</Badge>
              <Badge tone="soft" variant="accent">Accent</Badge>
              <Badge tone="soft" variant="neutral">Neutro</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Badges Semânticos */}
      <section>
        <h2 className="font-heading text-2xl font-semibold">Badges Semânticos</h2>
        <p className="text-muted-foreground mt-1">
          Badges padronizados por categoria de domínio. Use sempre as funções do Design System.
        </p>
        <Separator className="my-4" />

        {/* Tipos de Terceiros */}
        <div className="space-y-4">
          <h3 className="font-heading text-lg font-medium">Tipos de Terceiros</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="info">Perito</Badge>
            <Badge variant="warning">Testemunha</Badge>
            <Badge variant="destructive">Terceiro Interessado</Badge>
            <Badge variant="accent">Ministério Público</Badge>
            <Badge variant="success">Assistente</Badge>
            <Badge variant="neutral">Custos Legis</Badge>
            <Badge variant="secondary">Preposto</Badge>
            <Badge variant="secondary">Curador</Badge>
            <Badge variant="accent">Leiloeiro</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Use <code className="bg-muted px-1 py-0.5 rounded text-xs">getSemanticBadgeVariant(&apos;parte&apos;, tipoParte)</code>
          </p>
        </div>

        {/* Status de Processo */}
        <div className="space-y-4 mt-8">
          <h3 className="font-heading text-lg font-medium">Status de Processo</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="success">Ativo</Badge>
            <Badge variant="success">Em Andamento</Badge>
            <Badge variant="warning">Suspenso</Badge>
            <Badge variant="warning">Pendente</Badge>
            <Badge variant="neutral">Arquivado</Badge>
            <Badge variant="neutral">Finalizado</Badge>
            <Badge variant="destructive">Erro</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Use <code className="bg-muted px-1 py-0.5 rounded text-xs">getSemanticBadgeVariant(&apos;status&apos;, status)</code>
          </p>
        </div>

        {/* Polo Processual */}
        <div className="space-y-4 mt-8">
          <h3 className="font-heading text-lg font-medium">Polo Processual</h3>
          <p className="text-sm text-muted-foreground">
            Classificação da posição da parte no processo (Ativo/Passivo, Reclamante/Reclamado).
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="info">Ativo</Badge>
            <Badge variant="destructive">Passivo</Badge>
            <Badge variant="info">Autor</Badge>
            <Badge variant="destructive">Réu</Badge>
            <Badge variant="info">Reclamante</Badge>
            <Badge variant="destructive">Reclamado</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Use <code className="bg-muted px-1 py-0.5 rounded text-xs">getSemanticBadgeVariant(&apos;polo&apos;, polo)</code>
          </p>
        </div>

        {/* Parte Processual */}
        <div className="space-y-4 mt-8">
          <h3 className="font-heading text-lg font-medium">Parte Processual</h3>
          <p className="text-sm text-muted-foreground">
            Nomes de partes do processo renderizados em badges (pessoas físicas e jurídicas).
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="info">João Silva Santos</Badge>
            <Badge variant="destructive">Empresa ABC Ltda</Badge>
            <Badge variant="info">Maria Oliveira Costa</Badge>
            <Badge variant="destructive">Indústria XYZ S/A</Badge>
            <Badge variant="info">Pedro Henrique Souza</Badge>
            <Badge variant="destructive">Comércio JK & Cia</Badge>
            <Badge variant="info">Ana Paula Rodrigues</Badge>
            <Badge variant="destructive">Construtora Nova Era Ltda</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            A variante do badge segue o polo da parte. Reclamantes/Autores usam <code className="bg-muted px-1 py-0.5 rounded text-xs">variant=&quot;info&quot;</code>,
            Reclamados/Réus usam <code className="bg-muted px-1 py-0.5 rounded text-xs">variant=&quot;destructive&quot;</code>.
          </p>
        </div>

        {/* Status de Audiência */}
        <div className="space-y-4 mt-8">
          <h3 className="font-heading text-lg font-medium">Status de Audiência</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="info" tone="soft">Marcada</Badge>
            <Badge variant="success" tone="soft">Finalizada</Badge>
            <Badge variant="warning" tone="soft">Adiada</Badge>
            <Badge variant="destructive" tone="soft">Cancelada</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Use <code className="bg-muted px-1 py-0.5 rounded text-xs">getSemanticBadgeVariant(&apos;audiencia_status&apos;, status)</code>
          </p>
        </div>

        {/* Modalidade de Audiência */}
        <div className="space-y-4 mt-8">
          <h3 className="font-heading text-lg font-medium">Modalidade de Audiência</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="accent">Virtual</Badge>
            <Badge variant="warning">Presencial</Badge>
            <Badge variant="info">Híbrida</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Use <code className="bg-muted px-1 py-0.5 rounded text-xs">getSemanticBadgeVariant(&apos;audiencia_modalidade&apos;, modalidade)</code>
          </p>
        </div>

        {/* Status de Captura */}
        <div className="space-y-4 mt-8">
          <h3 className="font-heading text-lg font-medium">Status de Captura</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="warning" tone="soft">Pendente</Badge>
            <Badge variant="info" tone="soft">Em Progresso</Badge>
            <Badge variant="success" tone="soft">Concluída</Badge>
            <Badge variant="destructive" tone="soft">Falhou</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Use <code className="bg-muted px-1 py-0.5 rounded text-xs">getSemanticBadgeVariant(&apos;captura_status&apos;, status)</code>
          </p>
        </div>

        {/* Tipo de Contrato */}
        <div className="space-y-4 mt-8">
          <h3 className="font-heading text-lg font-medium">Tipo de Contrato</h3>
          <p className="text-sm text-muted-foreground">
            Classificação do tipo de serviço jurídico prestado. Cores organizadas para evitar repetição quando exibidos juntos.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="accent" tone="soft">Ajuizamento</Badge>
            <Badge variant="warning" tone="soft">Defesa</Badge>
            <Badge variant="info" tone="soft">Ato Processual</Badge>
            <Badge variant="success" tone="soft">Assessoria</Badge>
            <Badge variant="secondary" tone="soft">Consultoria</Badge>
            <Badge variant="neutral" tone="soft">Extrajudicial</Badge>
            <Badge variant="secondary" tone="soft">Parecer</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Use <code className="bg-muted px-1 py-0.5 rounded text-xs">getSemanticBadgeVariant(&apos;tipo_contrato&apos;, tipo)</code>
          </p>
        </div>

        {/* Tipo de Cobrança */}
        <div className="space-y-4 mt-8">
          <h3 className="font-heading text-lg font-medium">Tipo de Cobrança</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="success" tone="soft">Pró-Êxito</Badge>
            <Badge variant="info" tone="soft">Pró-Labore</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Use <code className="bg-muted px-1 py-0.5 rounded text-xs">getSemanticBadgeVariant(&apos;tipo_cobranca&apos;, tipo)</code>
          </p>
        </div>

        {/* Status de Contrato */}
        <div className="space-y-4 mt-8">
          <h3 className="font-heading text-lg font-medium">Status de Contrato</h3>
          <p className="text-sm text-muted-foreground">
            Estágio atual do contrato no fluxo de gestão.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="warning" tone="soft">Em Contratação</Badge>
            <Badge variant="success" tone="soft">Contratado</Badge>
            <Badge variant="info" tone="soft">Distribuído</Badge>
            <Badge variant="destructive" tone="soft">Desistência</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Use <code className="bg-muted px-1 py-0.5 rounded text-xs">getSemanticBadgeVariant(&apos;status_contrato&apos;, status)</code>
          </p>
        </div>
      </section>

      {/* Inputs */}
      <section>
        <h2 className="font-heading text-2xl font-semibold">Inputs</h2>
        <Separator className="my-4" />
        <div className="max-w-sm">
          <Input placeholder="Escreva algo..." />
        </div>
      </section>

      {/* Cards */}
      <section>
        <h2 className="font-heading text-2xl font-semibold">Cards</h2>
        <Separator className="my-4" />
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Título do Card</CardTitle>
            <CardDescription>Descrição do card</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Este é o conteúdo principal do card.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline">Ação</Button>
          </CardFooter>
        </Card>
      </section>

      {/* Metric Cards */}
      <section>
        <h2 className="font-heading text-2xl font-semibold">Metric Cards</h2>
        <p className="text-muted-foreground mt-1">Cards de métricas para dashboards com valores numéricos e tendências.</p>
        <Separator className="my-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Valor em Acordos"
            value="R$ 45.230,00"
            icon={DollarSign}
          />
          <MetricCard
            title="Novos Clientes"
            value="+5"
            icon={Users}
            trend="+15%"
            trendDirection="up"
          />
          <MetricCard
            title="Processos Finalizados"
            value="8"
            icon={FileText}
            trend="-2"
            trendDirection="down"
          />
        </div>
      </section>

      {/* Tabelas */}
      <section>
        <h2 className="font-heading text-2xl font-semibold">Tabelas</h2>
        <p className="text-muted-foreground mt-1">Componente de tabela com header, rows e hover states.</p>
        <Separator className="my-4" />
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>PROC-001</TableCell>
                <TableCell>Ação Trabalhista v. Empresa X</TableCell>
                <TableCell><Badge variant="success">Ativo</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>PROC-002</TableCell>
                <TableCell>Recurso Ordinário v. Empresa Y</TableCell>
                <TableCell><Badge variant="warning">Pendente</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>PROC-003</TableCell>
                <TableCell>Consulta Jurídica - Sindicato Z</TableCell>
                <TableCell><Badge variant="outline">Arquivado</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>PROC-004</TableCell>
                <TableCell>Defesa em Processo Administrativo</TableCell>
                <TableCell><Badge variant="destructive">Urgente</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>PROC-005</TableCell>
                <TableCell>Elaboração de Contrato</TableCell>
                <TableCell><Badge>Em andamento</Badge></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Loading States (Skeletons) */}
      <section>
        <h2 className="font-heading text-2xl font-semibold">Loading States (Skeletons)</h2>
        <p className="text-muted-foreground mt-1">Placeholders animados para estados de carregamento.</p>
        <Separator className="my-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-heading text-lg font-medium mb-4">Table Skeleton</h3>
            <TableSkeleton />
          </div>
          <div>
            <h3 className="font-heading text-lg font-medium mb-4">Metric Card Skeletons</h3>
            <div className="grid grid-cols-1 gap-4">
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
            </div>
          </div>
        </div>
      </section>

      {/* Toasts */}
      <section>
        <h2 className="font-heading text-2xl font-semibold">Toasts (Notificações)</h2>
        <Separator className="my-4" />
        <div className="flex flex-wrap gap-4">
          <Button onClick={() => toast.success('Sucesso!', { description: 'Ação completada com sucesso.' })}>
            Toast de Sucesso
          </Button>
          <Button variant="destructive" onClick={() => toast.error('Erro!', { description: 'Não foi possível completar a ação.' })}>
            Toast de Erro
          </Button>
          <Button variant="secondary" onClick={() => toast.info('Informação', { description: 'Esta é uma mensagem informativa.' })}>
            Toast de Informação
          </Button>
        </div>
      </section>
      <Toaster />
    </div>
  );
}