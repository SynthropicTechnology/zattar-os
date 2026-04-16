import { createServiceClient } from '@/lib/supabase/service-client';
import { TABLE_SESSOES, TABLE_TEMPLATES } from './constants';
import type { AssinaturaDigitalDashboardStats } from '../types/types';

/**
 * Calcula métricas administrativas de assinaturas do dia.
 */
export async function getDashboardStats(): Promise<AssinaturaDigitalDashboardStats> {
  const supabase = createServiceClient();
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const inicioDiaIso = hoje.toISOString();

  const [templatesAtivosRes, concluidasHojeRes, totalHojeRes] = await Promise.all([
    supabase
      .from(TABLE_TEMPLATES)
      .select('id', { count: 'exact', head: true })
      .eq('ativo', true),
    supabase
      .from(TABLE_SESSOES)
      .select('id', { count: 'exact', head: true })
      .eq('status', 'concluida')
      .gte('created_at', inicioDiaIso),
    supabase
      .from(TABLE_SESSOES)
      .select('id', { count: 'exact', head: true })
      .gte('created_at', inicioDiaIso),
  ]);

  if (templatesAtivosRes.error) {
    throw new Error(templatesAtivosRes.error.message);
  }
  if (concluidasHojeRes.error) {
    throw new Error(concluidasHojeRes.error.message);
  }
  if (totalHojeRes.error) {
    throw new Error(totalHojeRes.error.message);
  }

  const templatesAtivos = templatesAtivosRes.count ?? 0;
  const assinaturasHoje = concluidasHojeRes.count ?? 0;
  const totalAssinaturasHoje = totalHojeRes.count ?? 0;
  const pdfsGeradosHoje = assinaturasHoje;
  const taxaSucesso =
    totalAssinaturasHoje > 0
      ? Math.round((assinaturasHoje / totalAssinaturasHoje) * 100)
      : 100;

  return {
    templatesAtivos,
    assinaturasHoje,
    totalAssinaturasHoje,
    pdfsGeradosHoje,
    taxaSucesso,
    ultimaAtualizacao: new Date().toISOString(),
  };
}