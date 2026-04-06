'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Bot, Blocks, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { GlassPanel } from '@/components/shared/glass-panel';

import { MetricasDBContent } from '@/app/(authenticated)/admin/metricas-db/components/metricas-db-content';
import { BlockedIpsContent } from '@/app/(authenticated)/admin/security/blocked-ips/components/blocked-ips-content';
import { TwoFAuthIntegrationCard, ChatwootIntegrationCard, DyteIntegrationCard, EditorIAIntegrationCard } from '@/lib/integracoes';
import { PromptsIAContent } from '@/lib/system-prompts';
import { AparenciaContent } from './aparencia-content';
import { SettingsNav } from './settings-nav';
import { SettingsMobileNav } from './settings-mobile-nav';
import { SettingsSectionHeader } from './settings-section-header';
import { VALID_TABS, findNavItem, type SettingsTab } from './settings-nav-items';

import type { MetricasDB } from '@/app/(authenticated)/admin';
import type { Integracao } from '@/lib/integracoes';
import type { SystemPrompt } from '@/lib/system-prompts';
import { Heading } from '@/components/ui/typography';

// =============================================================================
// PROPS
// =============================================================================

export interface ConfiguracoesSettingsLayoutProps {
  metricas?: MetricasDB;
  integracao2FAuth?: Integracao | null;
  integracaoChatwoot?: Integracao | null;
  integracaoDyte?: Integracao | null;
  integracaoEditorIA?: Integracao | null;
  systemPrompts?: SystemPrompt[];
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ConfiguracoesSettingsLayout({
  metricas,
  integracao2FAuth,
  integracaoChatwoot,
  integracaoDyte,
  integracaoEditorIA,
  systemPrompts,
}: ConfiguracoesSettingsLayoutProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawTab = searchParams.get('tab');
  const activeTab: SettingsTab = (rawTab && VALID_TABS.has(rawTab as SettingsTab))
    ? (rawTab as SettingsTab)
    : 'metricas';

  const handleTabChange = React.useCallback(
    (tab: SettingsTab) => {
      router.push(`/app/configuracoes?tab=${tab}`, { scroll: false });
    },
    [router]
  );

  const currentItem = findNavItem(activeTab);

  return (
    <div className="flex flex-col min-h-0 space-y-5">
      {/* Page header */}
      <div>
        <Heading level="page">
          Configurações
        </Heading>
        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
          Gerencie integrações, aparência e configurações do sistema
        </p>
      </div>

      {/* Mobile nav */}
      <SettingsMobileNav activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Desktop: sidebar + content */}
      <div className="flex gap-6 min-h-0">
        <SettingsNav activeTab={activeTab} onTabChange={handleTabChange} />

        <div className="flex-1 min-w-0">
          {currentItem && (
            <SettingsSectionHeader
              icon={currentItem.icon}
              title={currentItem.label}
              description={currentItem.description}
            />
          )}

          {activeTab === 'metricas' && (
            metricas
              ? <MetricasDBContent metricas={metricas} />
              : <div className="p-4 text-center text-muted-foreground/50 text-sm">Carregando métricas...</div>
          )}

          {activeTab === 'seguranca' && <BlockedIpsContent />}

          {activeTab === 'integracoes' && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <TwoFAuthIntegrationCard integracao={integracao2FAuth} />
              <ChatwootIntegrationCard integracao={integracaoChatwoot} />
              <DyteIntegrationCard integracao={integracaoDyte} />
              <EditorIAIntegrationCard integracao={integracaoEditorIA} />
              <GlassPanel className="p-5 opacity-50 cursor-not-allowed">
                <div className="flex items-center gap-2 mb-4">
                  <Blocks className="size-4 text-muted-foreground/50" />
                  <div>
                    <h3 className="text-widget-title">Zapier</h3>
                    <p className="text-[10px] text-muted-foreground/60">Em breve</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground/50">
                  Integração com milhares de apps via Zapier.
                </p>
              </GlassPanel>
            </div>
          )}

          {activeTab === 'assistentes-ia' && (
            <div className="grid gap-4 md:grid-cols-2">
              <GlassPanel className="p-5 group cursor-pointer hover:border-border/40">
                <div className="flex items-center gap-2 mb-4">
                  <Bot className="size-4 text-muted-foreground/50" />
                  <div>
                    <h3 className="text-widget-title">Apps Dify</h3>
                    <p className="text-[10px] text-muted-foreground/60">Chatbots e workflows de automação</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground/70 mb-4">
                  Gerencie múltiplos aplicativos de IA, incluindo chatbots e workflows de automação.
                </p>
                <Button variant="outline" size="sm" className="w-full border-border/20 bg-transparent hover:bg-white/4" asChild>
                  <Link href="/app/configuracoes/dify">
                    Gerenciar Apps
                    <ArrowRight className="size-3 ml-auto" />
                  </Link>
                </Button>
              </GlassPanel>
              <GlassPanel className="p-5 group cursor-pointer hover:border-border/40">
                <div className="flex items-center gap-2 mb-4">
                  <Bot className="size-4 text-muted-foreground/50" />
                  <div>
                    <h3 className="text-widget-title">Vinculação por Tipo</h3>
                    <p className="text-[10px] text-muted-foreground/60">Geração automática de peças</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground/70 mb-4">
                  Vincule assistentes de IA a tipos de expedientes para geração automática de peças.
                </p>
                <Button variant="outline" size="sm" className="w-full border-border/20 bg-transparent hover:bg-white/4" asChild>
                  <Link href="/app/configuracoes/assistentes-tipos">
                    Vincular por Tipo
                    <ArrowRight className="size-3 ml-auto" />
                  </Link>
                </Button>
              </GlassPanel>
            </div>
          )}

          {activeTab === 'aparencia' && <AparenciaContent />}

          {activeTab === 'prompts-ia' && <PromptsIAContent systemPrompts={systemPrompts} />}
        </div>
      </div>
    </div>
  );
}
