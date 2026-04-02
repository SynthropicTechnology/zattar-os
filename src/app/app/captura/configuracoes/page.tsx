import { redirect } from "next/navigation";

import { actionObterMetricasDB } from "@/features/admin";
import { actionListarIntegracoesPorTipo } from "@/lib/integracoes";
import { actionListarSystemPrompts } from "@/lib/system-prompts";
import { ConfiguracoesTabsContent } from "./components/configuracoes-tabs-content";

// Next.js 16: Force dynamic rendering because this route uses cookies()
export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const [metricasResult, integracoes2FAuthResult, integracoesChatwootResult, integracoesDyteResult, integracoesEditorIAResult, systemPromptsResult] = await Promise.all([
    actionObterMetricasDB(),
    actionListarIntegracoesPorTipo({ tipo: "twofauth" }),
    actionListarIntegracoesPorTipo({ tipo: "chatwoot" }),
    actionListarIntegracoesPorTipo({ tipo: "dyte" }),
    actionListarIntegracoesPorTipo({ tipo: "editor_ia" }),
    actionListarSystemPrompts(),
  ]);

  if (!metricasResult.success) {
    if (metricasResult.error?.includes("Acesso negado")) {
      redirect("/app/dashboard");
    }

    return (
      <div className="text-red-600">{metricasResult.error || "Erro ao carregar configurações"}</div>
    );
  }

  // Buscar integração 2FAuth (primeira ativa ou primeira encontrada)
  let integracao2FAuth = null;
  if (integracoes2FAuthResult.success && Array.isArray(integracoes2FAuthResult.data)) {
    integracao2FAuth = integracoes2FAuthResult.data.find((i) => i.ativo) || integracoes2FAuthResult.data[0] || null;
  }

  // Buscar integração Chatwoot
  let integracaoChatwoot = null;
  if (integracoesChatwootResult.success && Array.isArray(integracoesChatwootResult.data)) {
    integracaoChatwoot = integracoesChatwootResult.data.find((i) => i.ativo) || integracoesChatwootResult.data[0] || null;
  }

  // Buscar integração Dyte
  let integracaoDyte = null;
  if (integracoesDyteResult.success && Array.isArray(integracoesDyteResult.data)) {
    integracaoDyte = integracoesDyteResult.data.find((i) => i.ativo) || integracoesDyteResult.data[0] || null;
  }

  // Buscar integração Editor de Texto IA
  let integracaoEditorIA = null;
  if (integracoesEditorIAResult.success && Array.isArray(integracoesEditorIAResult.data)) {
    integracaoEditorIA = integracoesEditorIAResult.data.find((i) => i.ativo) || integracoesEditorIAResult.data[0] || null;
  }

  // System prompts
  const systemPrompts = systemPromptsResult.success && Array.isArray(systemPromptsResult.data)
    ? systemPromptsResult.data
    : [];

  return (
    <ConfiguracoesTabsContent
      metricas={metricasResult.data}
      integracao2FAuth={integracao2FAuth}
      integracaoChatwoot={integracaoChatwoot}
      integracaoDyte={integracaoDyte}
      integracaoEditorIA={integracaoEditorIA}
      systemPrompts={systemPrompts}
    />
  );
}
