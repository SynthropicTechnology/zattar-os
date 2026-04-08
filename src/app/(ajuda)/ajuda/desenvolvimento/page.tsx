import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Code,
  Layers,
  FileSignature,
  Globe,
  MapPin,
  Cloud,
  BookOpen,
  Terminal,
  Rocket,
  Settings,
  Database,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

const sections = [
  {
    title: 'Arquitetura',
    description: 'Princípios DDD, organização de tipos e estrutura de camadas',
    href: '/ajuda/desenvolvimento/arquitetura',
    icon: Layers,
  },
  {
    title: 'Assinatura Digital',
    description: 'Arquitetura técnica do módulo de assinatura digital',
    href: '/ajuda/desenvolvimento/arquitetura-assinatura-digital',
    icon: FileSignature,
  },
  {
    title: 'Integração PJE',
    description: 'APIs do PJE-TRT, autenticação SSO e fluxo de raspagem',
    href: '/ajuda/desenvolvimento/integracao-pje',
    icon: Globe,
  },
  {
    title: 'Integração ViaCEP',
    description: 'Webservice de consulta de CEP para endereços',
    href: '/ajuda/desenvolvimento/integracao-viacep',
    icon: MapPin,
  },
  {
    title: 'Integração Google Drive',
    description: 'Storage via n8n Webhook para upload de documentos',
    href: '/ajuda/desenvolvimento/integracao-google-drive',
    icon: Cloud,
  },
  {
    title: 'API Swagger',
    description: 'Como documentar rotas usando JSDoc e Swagger',
    href: '/ajuda/desenvolvimento/api-swagger',
    icon: BookOpen,
  },
  {
    title: 'Referência de API',
    description: 'Comandos cURL prontos para todas as rotas',
    href: '/ajuda/desenvolvimento/api-referencia',
    icon: Terminal,
  },
  {
    title: 'Deploy',
    description: 'Deploy via Portainer com Traefik como reverse proxy',
    href: '/ajuda/desenvolvimento/deploy',
    icon: Rocket,
  },
  {
    title: 'Variáveis de Ambiente',
    description: 'Configuração de variáveis para diferentes ambientes',
    href: '/ajuda/desenvolvimento/variaveis-ambiente',
    icon: Settings,
  },
  {
    title: 'Migrations',
    description: 'Como criar e aplicar migrations no Supabase',
    href: '/ajuda/desenvolvimento/migrations',
    icon: Database,
  },
  {
    title: 'Troubleshooting',
    description: 'Solução de problemas comuns e debugging',
    href: '/ajuda/desenvolvimento/troubleshooting',
    icon: AlertTriangle,
  },
];

export default function DesenvolvimentoPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Code className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Desenvolvimento</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Documentação técnica para desenvolvedores do Synthropic.
        </p>
      </div>

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Visão Geral</CardTitle>
          <CardDescription>Stack tecnológica e estrutura do projeto</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Frontend</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Next.js 16 com App Router</li>
                <li>• React 19 com Server Components</li>
                <li>• TypeScript 5 em strict mode</li>
                <li>• Tailwind CSS 4</li>
                <li>• shadcn/ui (Radix UI)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Backend</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Next.js API Routes (REST)</li>
                <li>• Supabase (PostgreSQL, Auth, Storage)</li>
                <li>• Redis para cache distribuído</li>
                <li>• Timeline em Supabase (JSONB)</li>
                <li>• Swagger para documentação</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Referência Rápida</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <h4 className="font-semibold mb-2">Convenções de Código</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Arquivos: kebab-case</li>
                <li>• Componentes: PascalCase</li>
                <li>• Funções: camelCase</li>
                <li>• Constantes: SCREAMING_SNAKE</li>
                <li>• Banco: snake_case</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Scripts Principais</h4>
              <pre className="text-xs bg-muted p-2 rounded-md">
{`npm run dev        # Dev server
npm run build      # Produção
npm run type-check # TypeScript
npm run lint       # ESLint`}
              </pre>
            </div>
            <div>
              <h4 className="font-semibold mb-2">URLs Úteis</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Dev: localhost:3000</li>
                <li>• Swagger: /api/docs</li>
                <li>• Health: /api/health</li>
                <li>• Cache: /api/cache/stats</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documentation Grid */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Documentação Técnica</h2>
        <div className="grid gap-4">
          {sections.map((section) => (
            <Link key={section.href} href={section.href}>
              <Card className="transition-colors hover:bg-accent">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <section.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>Começando</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">1. Clone e instale</h4>
            <pre className="text-sm bg-muted p-3 rounded-md overflow-x-auto">
{`git clone https://github.com/seu-repo/synthropic.git
cd synthropic
npm install`}
            </pre>
          </div>
          <div>
            <h4 className="font-semibold mb-2">2. Configure variáveis de ambiente</h4>
            <pre className="text-sm bg-muted p-3 rounded-md overflow-x-auto">
{`cp .env.example .env.local
# Edite .env.local com suas configurações`}
            </pre>
          </div>
          <div>
            <h4 className="font-semibold mb-2">3. Inicie o desenvolvimento</h4>
            <pre className="text-sm bg-muted p-3 rounded-md overflow-x-auto">
{`npm run dev
# Acesse http://localhost:3000`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
