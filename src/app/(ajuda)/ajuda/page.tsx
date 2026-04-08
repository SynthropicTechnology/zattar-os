import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Rocket,
  Layers,
  Plug,
  Palette,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';

const sections = [
  {
    title: 'Primeiros Passos',
    description: 'Guia rápido para começar a usar o Synthropic',
    href: '/ajuda/primeiros-passos',
    icon: Rocket,
  },
  {
    title: 'Funcionalidades',
    description: 'Aprenda sobre processos, audiências, expedientes e mais',
    href: '/ajuda/funcionalidades',
    icon: Layers,
  },
  {
    title: 'Integração',
    description: 'API REST, ferramentas MCP e sistema de permissões',
    href: '/ajuda/integracao',
    icon: Plug,
  },
  {
    title: 'Design System',
    description: 'Tipografia, componentes e padrões visuais',
    href: '/ajuda/design-system',
    icon: Palette,
  },
  {
    title: 'FAQ',
    description: 'Perguntas frequentes e soluções comuns',
    href: '/ajuda/faq',
    icon: HelpCircle,
  },
];

export default function AjudaPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Central de Ajuda
        </h1>
        <p className="text-xl text-muted-foreground">
          Bem-vindo à documentação do Synthropic. Encontre guias, tutoriais e
          referências para aproveitar ao máximo o sistema.
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="h-full transition-colors hover:bg-accent">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <section.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="flex items-center justify-between">
                  <span>{section.description}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Overview */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Sobre o Synthropic
        </h2>
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <p>
            O <strong>Synthropic</strong> é um sistema de gestão jurídica desenvolvido
            para o escritório Zattar Advogados, com foco em automação de captura de
            dados do PJE (Processo Judicial Eletrônico) dos Tribunais Regionais do
            Trabalho (TRT).
          </p>
          <p>
            O sistema automatiza a coleta de informações processuais, audiências,
            pendências e timeline, integrando-se com todos os 24 TRTs brasileiros.
          </p>
          <h3>Principais Funcionalidades</h3>
          <ul>
            <li>
              <strong>Gestão de Processos:</strong> Visualização completa do acervo
              com filtros avançados e atribuição de responsáveis
            </li>
            <li>
              <strong>Audiências:</strong> Listagem com detalhes, URLs virtuais e
              sincronização automática com PJE
            </li>
            <li>
              <strong>Expedientes:</strong> Controle de prazos, baixas e histórico
              de manifestações
            </li>
            <li>
              <strong>Acordos e Condenações:</strong> Valores recebidos/pagos com
              parcelamento e cálculo de honorários
            </li>
            <li>
              <strong>Captura Automatizada:</strong> Scraping do PJE-TRT com
              suporte a 2FA/OTP
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
