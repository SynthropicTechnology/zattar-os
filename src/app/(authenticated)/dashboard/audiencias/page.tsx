import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { obterDashboardUsuario, obterDashboardAdmin } from '../service';
import { DashboardProvider } from '../hooks';
import { Heading } from '@/components/ui/typography';

// Widgets de audiências
import { ProximasAudiencias } from '../widgets/audiencias/proximas-audiencias';
import { WidgetPreparacao } from '../widgets/audiencias/preparacao';
import { ModalidadeDistribution } from '../widgets/audiencias/modalidade';
import { StatusMensal } from '../widgets/audiencias/status-mensal';
import { KpiStrip } from '../widgets/audiencias/kpi-strip';
import { AudienciasPorTipo } from '../widgets/audiencias/por-tipo';
import { TrendMensal } from '../widgets/audiencias/trend-mensal';
import { WidgetComparativoMensal } from '../widgets/audiencias/comparativo-mensal';
import { WidgetHeatmapSemanal } from '../widgets/audiencias/heatmap-semanal';

export const metadata: Metadata = {
  title: 'Dashboard — Audiências',
  description: 'Painel detalhado de audiências: timeline, modalidades, tendências e preparação.',
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

export default async function AudienciasPage() {
  const initialData = await prefetchData().catch(() => null);

  return (
    <DashboardProvider initialData={initialData}>
      <div className="space-y-4">
        <Heading level="page">Audiências</Heading>
        {/* Row 1: Próximas + Preparação */}
        <div className="grid gap-4 md:grid-cols-2">
          <ProximasAudiencias />
          <WidgetPreparacao />
        </div>
        {/* Row 2: KPIs + Comparativo + Trend */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <KpiStrip />
          <WidgetComparativoMensal />
          <TrendMensal />
        </div>
        {/* Row 3: Modalidade + Status Mensal + Por Tipo */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ModalidadeDistribution />
          <StatusMensal />
          <AudienciasPorTipo />
        </div>
        {/* Row 4: Heatmap Semanal (full width) */}
        <WidgetHeatmapSemanal />
      </div>
    </DashboardProvider>
  );
}
