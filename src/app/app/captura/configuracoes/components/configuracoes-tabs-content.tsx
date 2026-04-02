'use client';

/**
 * ConfiguracoesTabsContent - Componente principal com tabs para navegação entre configurações
 *
 * Implementa navegação por tabs seguindo o padrão do projeto:
 * - Tabs: Métricas | Segurança | Autenticador | Integrações
 * - URL com query param: /app/configuracoes?tab=metricas
 * - Experiência de página única
 */

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Database, Shield, Blocks, Bot, Palette, Sparkles, Users } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

import { MetricasDBContent } from '@/app/app/admin/metricas-db/components/metricas-db-content';
import { BlockedIpsContent } from '@/app/app/admin/security/blocked-ips/components/blocked-ips-content';
import { TwoFAuthIntegrationCard, ChatwootIntegrationCard, DyteIntegrationCard, EditorIAIntegrationCard } from '@/lib/integracoes';
import { PromptsIAContent } from '@/lib/system-prompts';
import { AparenciaContent } from './aparencia-content';
import type { MetricasDB } from '@/app/app/admin';
import type { Integracao } from '@/lib/integracoes';
import type { SystemPrompt } from '@/lib/system-prompts';

// =============================================================================
// TIPOS
// =============================================================================

type ConfiguracoesTab = 'metricas' | 'seguranca' | 'integracoes' | 'aparencia' | 'prompts-ia';

// =============================================================================
// CONFIGURAÇÃO DAS TABS
// =============================================================================

const VALID_TABS = new Set<ConfiguracoesTab>(['metricas', 'seguranca', 'integracoes', 'aparencia', 'prompts-ia']);

// =============================================================================
// PROPS
// =============================================================================

interface ConfiguracoesTabsContentProps {
  /** Tab inicial (padrão: 'metricas') */
  initialTab?: ConfiguracoesTab;
  /** Dados de métricas do banco de dados */
  metricas?: MetricasDB;
  /** Integração 2FAuth */
  integracao2FAuth?: Integracao | null;
  /** Integração Chatwoot */
  integracaoChatwoot?: Integracao | null;
  /** Integração Dyte */
  integracaoDyte?: Integracao | null;
  /** Integração Editor de Texto IA */
  integracaoEditorIA?: Integracao | null;
  /** System prompts de IA */
  systemPrompts?: SystemPrompt[];
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ConfiguracoesTabsContent({
  initialTab = 'metricas',
  metricas,
  integracao2FAuth,
  integracaoChatwoot,
  integracaoDyte,
  integracaoEditorIA,
  systemPrompts,
}: ConfiguracoesTabsContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Deriva a tab ativa da URL com validação
  const rawTab = searchParams.get('tab');
  const activeTab = (rawTab && VALID_TABS.has(rawTab as ConfiguracoesTab))
    ? (rawTab as ConfiguracoesTab)
    : initialTab;

  // Handler para mudança de tab - atualiza URL
  const handleTabChange = React.useCallback(
    (value: string) => {
      router.push(`/app/configuracoes?tab=${value}`, { scroll: false });
    },
    [router]
  );

  return (
    <div className="flex flex-col min-h-0 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <Button variant="outline" asChild>
          <Link href="/app/usuarios">
            <Users className="mr-2 h-4 w-4" />
            Usuários
          </Link>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:w-250">
          <TabsTrigger value="metricas">
            <Database className="mr-2 h-4 w-4" />
            Métricas
          </TabsTrigger>
          <TabsTrigger value="seguranca">
            <Shield className="mr-2 h-4 w-4" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="integracoes">
            <Blocks className="mr-2 h-4 w-4" />
            Integrações
          </TabsTrigger>
          <TabsTrigger value="aparencia">
            <Palette className="mr-2 h-4 w-4" />
            Aparência
          </TabsTrigger>
          <TabsTrigger value="prompts-ia">
            <Sparkles className="mr-2 h-4 w-4" />
            Prompts IA
          </TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="metricas" className="space-y-4">
            {metricas ? <MetricasDBContent metricas={metricas} /> : <div className="p-4 text-center text-muted-foreground">Carregando métricas...</div>}
          </TabsContent>
          <TabsContent value="seguranca" className="space-y-4">
            <BlockedIpsContent />
          </TabsContent>
          <TabsContent value="integracoes" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Card 2FAuth */}
              <TwoFAuthIntegrationCard integracao={integracao2FAuth} />

              {/* Card Chatwoot */}
              <ChatwootIntegrationCard integracao={integracaoChatwoot} />

              {/* Card Dyte */}
              <DyteIntegrationCard integracao={integracaoDyte} />

              {/* Card Editor de Texto IA */}
              <EditorIAIntegrationCard integracao={integracaoEditorIA} />

              {/* Card Assistentes IA */}
              <Card>
                <CardHeader className="pb-3">
                  <Bot className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>Assistentes IA</CardTitle>
                  <CardDescription>Conecte seus agentes e workflows de IA.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Gerencie múltiplos aplicativos de IA, incluindo chatbots e workflows de automação.
                  </p>
                </CardContent>
                <CardFooter>
                  <div className="flex w-full flex-col gap-2">
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/app/configuracoes/dify">Gerenciar Apps</Link>
                    </Button>
                    <Button variant="secondary" className="w-full" asChild>
                      <Link href="/app/configuracoes/assistentes-tipos">Vincular por Tipo de Expediente</Link>
                    </Button>
                  </div>
                </CardFooter>
              </Card>

              {/* Exemplo de Card Futuro (Placeholder) */}
              <Card className="opacity-60 grayscale cursor-not-allowed">
                <CardHeader className="pb-3">
                  <Blocks className="h-10 w-10 mb-2" />
                  <CardTitle>Zapier</CardTitle>
                  <CardDescription>Em breve.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Integração com milhares de apps via Zapier.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" disabled className="w-full">Em Breve</Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="aparencia" className="space-y-4">
            <AparenciaContent />
          </TabsContent>
          <TabsContent value="prompts-ia" className="space-y-4">
            <PromptsIAContent systemPrompts={systemPrompts} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

export default ConfiguracoesTabsContent;
