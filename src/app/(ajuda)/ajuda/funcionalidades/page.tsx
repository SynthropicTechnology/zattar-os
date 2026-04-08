import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Layers,
  Gavel,
  Calendar,
  ClipboardList,
  Banknote,
  Download,
  ArrowRight,
} from 'lucide-react';

const features = [
  {
    title: 'Processos',
    description: 'Gestão completa do acervo processual com filtros avançados, atribuição de responsáveis e sincronização com PJE',
    href: '/ajuda/funcionalidades/processos',
    icon: Gavel,
  },
  {
    title: 'Audiências',
    description: 'Controle de audiências agendadas, URLs virtuais e integração com calendário',
    href: '/ajuda/funcionalidades/audiencias',
    icon: Calendar,
  },
  {
    title: 'Expedientes',
    description: 'Gerenciamento de expedientes manuais, prazos e controle de baixas',
    href: '/ajuda/funcionalidades/expedientes',
    icon: ClipboardList,
  },
  {
    title: 'Acordos e Condenações',
    description: 'Controle financeiro de acordos, condenações, parcelas e honorários',
    href: '/ajuda/funcionalidades/acordos',
    icon: Banknote,
  },
  {
    title: 'Captura PJE',
    description: 'Automação de captura de dados do PJE-TRT com suporte a todos os 24 tribunais',
    href: '/ajuda/funcionalidades/captura',
    icon: Download,
  },
];

export default function FuncionalidadesPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Layers className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Funcionalidades</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Conheça as principais funcionalidades do Synthropic e aprenda a utilizá-las de forma eficiente.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {features.map((feature) => (
          <Link key={feature.href} href={feature.href}>
            <Card className="h-full transition-colors hover:bg-accent">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="flex items-center justify-between gap-4">
                  <span>{feature.description}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Overview */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Visão Geral</h2>
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <p>
            O Synthropic foi desenvolvido para automatizar e otimizar a gestão de processos
            trabalhistas. Cada funcionalidade foi pensada para integrar-se perfeitamente
            com o fluxo de trabalho do escritório.
          </p>
          <h3>Fluxo de Trabalho Típico</h3>
          <ol>
            <li>
              <strong>Captura:</strong> O sistema captura automaticamente os processos do PJE-TRT
            </li>
            <li>
              <strong>Processos:</strong> Os processos são organizados no acervo com filtros e responsáveis
            </li>
            <li>
              <strong>Audiências:</strong> Audiências são sincronizadas e podem ser acompanhadas
            </li>
            <li>
              <strong>Expedientes:</strong> Prazos e manifestações são controlados por expedientes
            </li>
            <li>
              <strong>Acordos:</strong> Valores financeiros são gerenciados com controle de parcelas
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
