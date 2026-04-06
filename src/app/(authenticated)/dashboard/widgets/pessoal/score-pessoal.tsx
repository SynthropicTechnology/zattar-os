'use client';

/**
 * WidgetScorePessoal — Widget conectado (col-span-3, hero strip)
 * Fontes:
 *   - useDashboard() → audiencias.hoje, produtividade.baixasHoje (role=user)
 *   - useReminders() → count de pendentes
 */

import { Target } from 'lucide-react';
import {
  WidgetContainer,
  GaugeMeter,
  AnimatedNumber,
  InsightBanner,
} from '../../mock/widgets/primitives';
import { Text } from '@/components/ui/typography';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard, useReminders, isDashboardUsuario } from '../../hooks';

function calcularScore(
  baixasHoje: number,
  audienciasHoje: number,
  lembretePendentes: number,
  proximaAudiencia: boolean
): { score: number; status: 'good' | 'warning' | 'danger' } {
  // Pesos: baixas (60%), audiências ok (20%), lembretes em dia (20%)
  const metaBaixas = 5;
  const pctBaixas = Math.min(1, baixasHoje / metaBaixas) * 100;
  const bonusAudiencias = audienciasHoje > 0 && proximaAudiencia ? 20 : audienciasHoje > 0 ? 15 : 10;
  const penaltidadeLembretes = Math.min(lembretePendentes * 5, 20);

  const raw = pctBaixas * 0.6 + bonusAudiencias - penaltidadeLembretes;
  const score = Math.max(0, Math.min(100, Math.round(raw)));
  const status: 'good' | 'warning' | 'danger' =
    score >= 70 ? 'good' : score >= 40 ? 'warning' : 'danger';

  return { score, status };
}

export function WidgetScorePessoal() {
  const { data, isLoading: isDashLoading } = useDashboard();
  const { lembretes, isPending } = useReminders();

  if (isDashLoading) return <WidgetSkeleton size="full" />;

  const lembretePendentes = lembretes.filter((l) => !l.concluido).length;

  if (!data || !isDashboardUsuario(data)) {
    // Admin: mostra versão simplificada com lembretes apenas
    return (
      <WidgetContainer
        title="Briefing do Dia"
        icon={Target}
        subtitle="Visão geral — administrador"
        className="md:col-span-3"
        depth={2}
      >
        <div className="flex items-center gap-5 flex-wrap">
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
              Lembretes pendentes
            </span>
            <Text variant="kpi-value">
              <AnimatedNumber value={isPending ? 0 : lembretePendentes} duration={800} />
            </Text>
          </div>
          <InsightBanner type="info">
            Acesse o painel administrativo para métricas do escritório.
          </InsightBanner>
        </div>
      </WidgetContainer>
    );
  }

  const { audiencias, produtividade, proximasAudiencias } = data;
  const baixasHoje = produtividade.baixasHoje;
  const audienciasHoje = audiencias.hoje;
  const proximaAudienciaExists = proximasAudiencias.length > 0;

  const { score, status } = calcularScore(
    baixasHoje,
    audienciasHoje,
    lembretePendentes,
    proximaAudienciaExists
  );

  // Insight baseado na próxima audiência
  let insightTipo: 'info' | 'warning' | 'success' = 'info';
  let insightTexto = 'Continue assim — sem pendências críticas identificadas.';

  if (proximaAudienciaExists) {
    const proxima = proximasAudiencias[0];
    const hora = proxima.hora_audiencia ?? 'horário não definido';
    insightTexto = `Audiência às ${hora} — ${proxima.numero_processo}. Verifique os documentos com antecedência.`;
    insightTipo = 'warning';
  } else if (audienciasHoje > 0) {
    insightTexto = `${audienciasHoje} audiência${audienciasHoje > 1 ? 's' : ''} prevista${audienciasHoje > 1 ? 's' : ''} para hoje.`;
    insightTipo = 'info';
  } else if (score >= 70) {
    insightTexto = `${baixasHoje} baixas concluídas hoje — ótimo ritmo de produtividade.`;
    insightTipo = 'success';
  }

  return (
    <WidgetContainer
      title="Briefing do Dia"
      icon={Target}
      subtitle="Sua performance em tempo real — hoje"
      className="md:col-span-3"
      depth={2}
    >
      <div className="flex flex-col sm:flex-row items-center gap-5">

        {/* Gauge compacto */}
        <GaugeMeter
          value={score}
          max={100}
          label="Seu dia"
          status={status}
          size={72}
        />

        {/* Divisor */}
        <div className="hidden sm:block w-px self-stretch bg-border/10" aria-hidden="true" />

        {/* Stats em linha */}
        <div className="flex items-center gap-5 flex-1 min-w-0 flex-wrap">
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
              Baixas hoje
            </span>
            <span className="font-display text-lg font-bold tabular-nums">
              <AnimatedNumber value={baixasHoje} duration={800} />
            </span>
            <span className="text-[9px] text-muted-foreground/55">concluídas</span>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
              Lembretes
            </span>
            <span className="font-display text-lg font-bold tabular-nums">
              <AnimatedNumber value={isPending ? 0 : lembretePendentes} duration={900} />
            </span>
            <span className="text-[9px] text-muted-foreground/55">pendentes</span>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
              Audiências
            </span>
            <span className="font-display text-lg font-bold tabular-nums">
              <AnimatedNumber value={audienciasHoje} duration={1000} />
            </span>
            <span className="text-[9px] text-muted-foreground/55">hoje</span>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
              Documentos
            </span>
            <span className="font-display text-lg font-bold tabular-nums">
              <AnimatedNumber value={0} duration={1100} />
            </span>
            <span className="text-[9px] text-muted-foreground/55">editados</span>
          </div>
        </div>

        {/* Divisor */}
        <div className="hidden sm:block w-px self-stretch bg-border/10" aria-hidden="true" />

        {/* Insight compacto */}
        <div className="w-full sm:max-w-56 shrink-0">
          <InsightBanner type={insightTipo}>{insightTexto}</InsightBanner>
        </div>

      </div>
    </WidgetContainer>
  );
}
