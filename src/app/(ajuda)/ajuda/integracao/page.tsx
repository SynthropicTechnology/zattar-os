import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Plug, Code, Bot, Shield, ArrowRight } from 'lucide-react';

const integrations = [
  {
    title: 'API REST',
    description: 'Documentação interativa da API REST com todos os endpoints disponíveis para integração',
    href: '/ajuda/integracao/api',
    icon: Code,
  },
  {
    title: 'Ferramentas MCP',
    description: 'Mais de 80 ferramentas para integração com assistentes de IA via Model Context Protocol',
    href: '/ajuda/integracao/mcp',
    icon: Bot,
  },
  {
    title: 'Sistema de Permissões',
    description: 'Guia completo para implementar verificação de permissões nas rotas de API',
    href: '/ajuda/integracao/permissoes',
    icon: Shield,
  },
];

export default function IntegracaoPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Plug className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Integração</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Recursos de integração disponíveis para conectar o Synthropic com outros sistemas e ferramentas.
        </p>
      </div>

      {/* Integrations Grid */}
      <div className="grid gap-4">
        {integrations.map((integration) => (
          <Link key={integration.href} href={integration.href}>
            <Card className="transition-colors hover:bg-accent">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <integration.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{integration.title}</CardTitle>
                    <CardDescription>{integration.description}</CardDescription>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      {/* Overview */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Visão Geral</h2>
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <p>
            O Synthropic oferece múltiplas formas de integração para atender diferentes
            necessidades de automação e conexão com outros sistemas.
          </p>

          <h3>API REST</h3>
          <p>
            A API REST permite integração completa com o sistema através de endpoints
            HTTP. Toda funcionalidade disponível na interface web também está disponível
            via API.
          </p>
          <ul>
            <li>Autenticação via JWT ou API Key</li>
            <li>Documentação interativa com Swagger/OpenAPI</li>
            <li>Suporte a múltiplos formatos de resposta</li>
          </ul>

          <h3>Model Context Protocol (MCP)</h3>
          <p>
            O servidor MCP permite que assistentes de IA como o Claude interajam
            diretamente com o Synthropic, executando consultas e operações através
            de linguagem natural.
          </p>
          <ul>
            <li>Mais de 80 ferramentas disponíveis</li>
            <li>Suporte a operações de leitura e escrita</li>
            <li>Formato de resposta JSON ou Markdown</li>
          </ul>

          <h3>Sistema de Permissões</h3>
          <p>
            O sistema de permissões granular permite controlar o acesso a cada
            funcionalidade. Ideal para integrar verificações de autorização em
            sistemas externos.
          </p>
          <ul>
            <li>82 permissões em 13 recursos</li>
            <li>Cache em memória para alta performance</li>
            <li>Helpers reutilizáveis para rotas de API</li>
          </ul>
        </div>
      </div>

      {/* Authentication */}
      <Card>
        <CardHeader>
          <CardTitle>Autenticação</CardTitle>
          <CardDescription>
            Métodos de autenticação suportados para integração
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold">Bearer Token (JWT)</h4>
            <p className="text-sm text-muted-foreground">
              Use o token JWT obtido no login. Ideal para integrações que atuam em nome de um usuário.
            </p>
            <pre className="mt-2 text-sm bg-muted p-3 rounded-md">
              Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
            </pre>
          </div>
          <div>
            <h4 className="font-semibold">API Key</h4>
            <p className="text-sm text-muted-foreground">
              Use uma API Key para automações e scripts. Gere sua chave em Perfil → API Keys.
            </p>
            <pre className="mt-2 text-sm bg-muted p-3 rounded-md">
              X-API-Key: sua-chave-api
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
