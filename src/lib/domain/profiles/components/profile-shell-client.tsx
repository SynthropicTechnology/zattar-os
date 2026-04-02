'use client';

import { ProfileConfig, ProfileData, SectionConfig } from "../configs/types";
import { ProfileHeader } from "./profile-layout/profile-header";
import { ProfileSidebar } from "./profile-layout/profile-sidebar";
import { InfoCards } from "./sections/info-cards";
import { RelatedTable } from "./sections/related-table";
import { RelatedEntitiesCards } from "./sections/related-entities-cards";
import { ActivityTimeline } from "./sections/activity-timeline";
import { ClienteDocumentosViewer } from "@/app/app/partes/components/clientes";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppBadge } from "@/components/ui/app-badge";
import { ClientOnlyTabs, TabsList, TabsTrigger } from "@/components/ui/client-only-tabs";
import { MoreHorizontal, Pencil } from "lucide-react";
import { useState } from "react";

// Cliente sections
import { ClienteInfoSection } from "./sections/cliente-info-section";
import { ClienteContatoSection } from "./sections/cliente-contato-section";
import { ClienteEnderecoSection } from "./sections/cliente-endereco-section";
import { ClientePJESection } from "./sections/cliente-pje-section";
import { ClienteProcessosTable, ParteContrariaProcessosTable, TerceiroProcessosTable } from "./sections/cliente-processos-table";

// Parte Contraria sections
import { ParteContrariaInfoSection } from "./sections/parte-contraria-info-section";
import { ParteContrariaContatoSection } from "./sections/parte-contraria-contato-section";
import { ParteContrariaEnderecoSection } from "./sections/parte-contraria-endereco-section";
import { ParteContrariaPJESection } from "./sections/parte-contraria-pje-section";

// Terceiro sections
import { TerceiroInfoSection } from "./sections/terceiro-info-section";
import { TerceiroContatoSection } from "./sections/terceiro-contato-section";
import { TerceiroEnderecoSection } from "./sections/terceiro-endereco-section";
import { TerceiroPJESection } from "./sections/terceiro-pje-section";

// Representante sections
import { RepresentanteInfoSection } from "./sections/representante-info-section";
import { RepresentanteContatoSection } from "./sections/representante-contato-section";
import { RepresentanteOABSection } from "./sections/representante-oab-section";
import { RepresentanteProcessosTable } from "./sections/representante-processos-table";
import { RepresentanteClientesTable } from "./sections/representante-clientes-table";

// Profile configs
import { clienteProfileConfig } from "../configs/cliente-profile.config";
import { parteContrariaProfileConfig } from "../configs/parte-contraria-profile.config";
import { terceiroProfileConfig } from "../configs/terceiro-profile.config";
import { representanteProfileConfig } from "../configs/representante-profile.config";
import { usuarioProfileConfig } from "../configs/usuario-profile.config";

interface ProfileShellClientProps {
  entityType: 'cliente' | 'parte_contraria' | 'terceiro' | 'representante' | 'usuario';
  entityId: number;
  initialData: ProfileData;
}

const configs: Record<string, ProfileConfig> = {
    cliente: clienteProfileConfig,
    parte_contraria: parteContrariaProfileConfig,
    terceiro: terceiroProfileConfig,
    representante: representanteProfileConfig,
    usuario: usuarioProfileConfig,
};

const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
  return path.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
};

export function ProfileShellClient({ entityType, entityId, initialData }: ProfileShellClientProps) {
  const config = configs[entityType];
  const data = initialData;
  const [activeTab, setActiveTab] = useState(config?.tabs[0]?.id || 'perfil');

  if (!config) {
      return <div>Configuracao de perfil nao encontrada para {entityType}</div>;
  }

  if (!data) {
      return <div>Dados nao encontrados</div>;
  }

  const renderSection = (section: SectionConfig) => {
    switch (section.type) {
        case 'info-cards':
            return <InfoCards key={section.title} cards={[section]} data={data} />;
        case 'table':
            return <RelatedTable key={section.title} config={section} data={data} />;
        case 'related-cards':
            return <RelatedEntitiesCards
                        key={section.title}
                        config={section.cardConfig!}
                        entityType={entityType}
                        entityId={entityId}
                    />;
        case 'timeline':
            const timelineData = section.dataSource ? data[section.dataSource] : data;
            return <ActivityTimeline key={section.title} data={timelineData as Record<string, unknown>} />;
        case 'custom':
            // Render custom components based on componentName
            switch (section.componentName) {
                // Cliente components
                case 'ClienteDocumentosViewer':
                    return <ClienteDocumentosViewer
                        key={section.title}
                        clienteId={entityId}
                        {...(section.componentProps ?? {})}
                    />;
                case 'ClienteInfoSection':
                    return <ClienteInfoSection
                        key={section.title}
                        data={data as Record<string, unknown>}
                    />;
                case 'ClienteContatoSection':
                    return <ClienteContatoSection
                        key={section.title}
                        data={data as Record<string, unknown>}
                    />;
                case 'ClienteEnderecoSection':
                    return <ClienteEnderecoSection
                        key={section.title}
                        data={data as Record<string, unknown>}
                    />;
                case 'ClientePJESection':
                    return <ClientePJESection
                        key={section.title}
                        data={data as Record<string, unknown>}
                    />;
                case 'ClienteProcessosTable':
                    return <ClienteProcessosTable
                        key={section.title}
                        data={data}
                    />;

                // Parte Contraria components
                case 'ParteContrariaInfoSection':
                    return <ParteContrariaInfoSection
                        key={section.title}
                        data={data as Record<string, unknown>}
                    />;
                case 'ParteContrariaContatoSection':
                    return <ParteContrariaContatoSection
                        key={section.title}
                        data={data as Record<string, unknown>}
                    />;
                case 'ParteContrariaEnderecoSection':
                    return <ParteContrariaEnderecoSection
                        key={section.title}
                        data={data as Record<string, unknown>}
                    />;
                case 'ParteContrariaPJESection':
                    return <ParteContrariaPJESection
                        key={section.title}
                        data={data as Record<string, unknown>}
                    />;
                case 'ParteContrariaProcessosTable':
                    return <ParteContrariaProcessosTable
                        key={section.title}
                        data={data}
                        title="Processos Relacionados"
                    />;

                // Terceiro components
                case 'TerceiroInfoSection':
                    return <TerceiroInfoSection
                        key={section.title}
                        data={data as Record<string, unknown>}
                    />;
                case 'TerceiroContatoSection':
                    return <TerceiroContatoSection
                        key={section.title}
                        data={data as Record<string, unknown>}
                    />;
                case 'TerceiroEnderecoSection':
                    return <TerceiroEnderecoSection
                        key={section.title}
                        data={data as Record<string, unknown>}
                    />;
                case 'TerceiroPJESection':
                    return <TerceiroPJESection
                        key={section.title}
                        data={data as Record<string, unknown>}
                    />;
                case 'TerceiroProcessosTable':
                    return <TerceiroProcessosTable
                        key={section.title}
                        data={data}
                        title="Processos onde atua"
                    />;

                // Representante components
                case 'RepresentanteInfoSection':
                    return <RepresentanteInfoSection
                        key={section.title}
                        data={data as Record<string, unknown>}
                    />;
                case 'RepresentanteContatoSection':
                    return <RepresentanteContatoSection
                        key={section.title}
                        data={data as Record<string, unknown>}
                    />;
                case 'RepresentanteOABSection':
                    return <RepresentanteOABSection
                        key={section.title}
                        data={data as Record<string, unknown>}
                    />;
                case 'RepresentanteProcessosTable':
                    return <RepresentanteProcessosTable
                        key={section.title}
                        data={data}
                    />;
                case 'RepresentanteClientesTable':
                    return <RepresentanteClientesTable
                        key={section.title}
                        data={data}
                    />;

                default:
                    return null;
            }
        default:
            return null;
    }
  };

  const currentTab = config.tabs.find(t => t.id === activeTab);

  return (
    <div className="mx-auto min-h-screen lg:max-w-7xl xl:pt-6">
      <div className="space-y-4">
        {/* Card com Header + Tabs (estrutura do template) */}
        <Card className="overflow-hidden">
          <ProfileHeader config={config.headerConfig} data={data} />

          {/* Tabs bar com border-t */}
          <div className="border-t">
            <div className="flex items-center justify-between px-4">
              <ClientOnlyTabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex-1"
              >
                <TabsList className="-mb-0.5 h-auto gap-6 border-none bg-transparent p-0">
                  {config.tabs.map((tab) => {
                    const badgeValue = tab.badgeField ? getNestedValue(data, tab.badgeField) : null;

                    return (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className="data-[state=active]:border-b-primary data-[state=active]:text-foreground text-muted-foreground rounded-none border-b-2 border-transparent px-0 py-4 shadow-none!"
                      >
                        {tab.label}
                        {badgeValue !== null && badgeValue !== undefined && badgeValue !== '' && (
                          <AppBadge variant="secondary" className="ml-2 rounded-full">
                            {String(badgeValue)}
                          </AppBadge>
                        )}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </ClientOnlyTabs>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline">
                  <Pencil className="h-4 w-4" />
                  <span className="hidden md:inline">Editar</span>
                </Button>
                <Button variant="outline" size="icon-sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Grid: Sidebar + Main Content */}
        <div className="gap-4 space-y-4 lg:grid lg:grid-cols-[320px_1fr] lg:space-y-0 xl:grid-cols-[360px_1fr]">
          {/* Sidebar */}
          <ProfileSidebar
            sections={config.sidebarSections}
            data={data}
            showProgress={true}
          />

          {/* Main Content */}
          <main className="space-y-6">
            {currentTab?.sections.map((section, idx) => (
              <div key={idx}>
                {renderSection(section)}
              </div>
            ))}
          </main>
        </div>
      </div>
    </div>
  );
}
