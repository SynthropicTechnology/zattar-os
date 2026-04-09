import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { obterDashboardUsuario, obterDashboardAdmin } from '../service';
import { DashboardProvider } from '../hooks';
import { Heading } from '@/components/ui/typography';

// Widgets de processos
import { WidgetSaudeProcessual } from '../widgets/processos/saude-processual';
import { WidgetHeatmapAtividade } from '../widgets/processos/heatmap-atividade';
import { WidgetStatusDistribuicao } from '../widgets/processos/status-distribuicao';
import { WidgetCasosTribunal } from '../widgets/processos/casos-tribunal';
import { WidgetTendenciaNovos } from '../widgets/processos/tendencia-novos';
import { WidgetAging } from '../widgets/processos/aging';
import { WidgetSegmento } from '../widgets/processos/segmento';
import { WidgetKpiPulse } from '../widgets/processos/kpi-pulse';
import { WidgetProcessosComTabs } from '../widgets/processos/processos-tabs';

export const metadata: Metadata = {
  title: 'Dashboard — Processos',
  description: 'Visão detalhada do acervo processual, tendências e distribuição.',
};

export const dynamic = 'force-dynamic';

async function prefetchData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id, is_super_admin')
    .eq('auth_uid', user.id)
    .single();

  if (!usuario) return null;

  return usuario.is_super_admin
    ? obterDashboardAdmin(usuario.id)
    : obterDashboardUsuario(usuario.id);
}

export default async function ProcessosPage() {
  const initialData = await prefetchData().catch(() => null);

  return (
    <DashboardProvider initialData={initialData}>
      <div className="space-y-4">
        <Heading level="page">Processos</Heading>
        {/* Row 1: Hero + Heatmap */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <WidgetSaudeProcessual />
          </div>
          <WidgetHeatmapAtividade />
        </div>
        {/* Row 2: KPIs + Tendência */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <WidgetKpiPulse />
          <WidgetTendenciaNovos />
          <WidgetProcessosComTabs />
        </div>
        {/* Row 3: Distribuições */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <WidgetStatusDistribuicao />
          <WidgetCasosTribunal />
          <WidgetSegmento />
        </div>
        {/* Row 4: Aging */}
        <WidgetAging />
      </div>
    </DashboardProvider>
  );
}
