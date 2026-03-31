'use client';

/**
 * WidgetFocoHoje — Widget conectado
 * Fontes:
 *   - useDashboard() → expedientesUrgentes (top urgentes por dias_restantes)
 *   - useDashboard() → proximasAudiencias (próxima audiência)
 * Deriva top 3 ações recomendadas.
 */

import { Zap } from 'lucide-react';
import { WidgetContainer, InsightBanner } from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard } from '../../hooks';
import type { ExpedienteUrgente, AudienciaProxima } from '../../domain';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Urgencia = 'critico' | 'alto' | 'medio';

interface AcaoRecomendada {
  titulo: string;
  razao: string;
  acao: string;
  urgencia: Urgencia;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const URGENCIA_COLORS: Record<Urgencia, string> = {
  critico: 'bg-destructive text-destructive-foreground',
  alto: 'bg-warning text-warning-foreground',
  medio: 'bg-primary/80 text-primary-foreground',
};

const URGENCIA_RING: Record<Urgencia, string> = {
  critico: 'ring-destructive/30',
  alto: 'ring-warning/30',
  medio: 'ring-primary/20',
};

const URGENCIA_BTN: Record<Urgencia, string> = {
  critico: 'bg-destructive/10 text-destructive/70 hover:bg-destructive/15',
  alto: 'bg-warning/10 text-warning/70 hover:bg-warning/15',
  medio: 'bg-primary/10 text-primary/70 hover:bg-primary/15',
};

function urgenciaDeExpediente(exp: ExpedienteUrgente): Urgencia {
  if (exp.dias_restantes <= 0) return 'critico';
  if (exp.dias_restantes <= 2) return 'alto';
  return 'medio';
}

function razaoExpediente(exp: ExpedienteUrgente): string {
  if (exp.dias_restantes < 0) {
    return `Prazo vencido há ${Math.abs(exp.dias_restantes)} dia${Math.abs(exp.dias_restantes) !== 1 ? 's' : ''}`;
  }
  if (exp.dias_restantes === 0) return 'Prazo vence hoje';
  if (exp.dias_restantes === 1) return 'Prazo vence amanhã';
  return `Prazo vence em ${exp.dias_restantes} dias`;
}

function razaoAudiencia(aud: AudienciaProxima): string {
  const hora = aud.hora_audiencia ?? 'horário não definido';
  const tipo = aud.tipo_audiencia ?? 'Audiência';
  return `${tipo} às ${hora}${aud.local ? ` — ${aud.local}` : ''}`;
}

function derivarAcoes(
  expedientes: ExpedienteUrgente[],
  proximasAudiencias: AudienciaProxima[]
): AcaoRecomendada[] {
  const acoes: AcaoRecomendada[] = [];

  // Ordena expedientes pelo mais urgente (dias_restantes crescente, vencidos primeiro)
  const urgentes = [...expedientes].sort((a, b) => a.dias_restantes - b.dias_restantes);

  // Ação 1: expediente mais urgente
  if (urgentes[0]) {
    const exp = urgentes[0];
    acoes.push({
      titulo: `${exp.tipo_expediente} — proc. ${exp.numero_processo}`,
      razao: razaoExpediente(exp),
      acao: 'Abrir expediente',
      urgencia: urgenciaDeExpediente(exp),
    });
  }

  // Ação 2: próxima audiência
  if (proximasAudiencias[0]) {
    const aud = proximasAudiencias[0];
    const titulo =
      aud.polo_ativo_nome && aud.polo_passivo_nome
        ? `${aud.polo_ativo_nome} x ${aud.polo_passivo_nome}`
        : `Proc. ${aud.numero_processo}`;

    acoes.push({
      titulo: `Preparar audiência — ${titulo}`,
      razao: razaoAudiencia(aud),
      acao: 'Ver processo',
      urgencia: 'alto',
    });
  }

  // Ação 3: segundo expediente mais urgente
  if (urgentes[1]) {
    const exp = urgentes[1];
    acoes.push({
      titulo: `${exp.tipo_expediente} — proc. ${exp.numero_processo}`,
      razao: razaoExpediente(exp),
      acao: 'Abrir expediente',
      urgencia: urgenciaDeExpediente(exp),
    });
  }

  // Fallback caso não haja 3 ações
  while (acoes.length < 3 && urgentes.length > acoes.length) {
    const exp = urgentes[acoes.length];
    acoes.push({
      titulo: `${exp.tipo_expediente} — proc. ${exp.numero_processo}`,
      razao: razaoExpediente(exp),
      acao: 'Abrir expediente',
      urgencia: urgenciaDeExpediente(exp),
    });
  }

  return acoes.slice(0, 3);
}

// ─── Widget ───────────────────────────────────────────────────────────────────

export function WidgetFocoHoje() {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <WidgetSkeleton size="md" />;

  if (!data) {
    return (
      <WidgetContainer
        title="Foco Agora"
        icon={Zap}
        subtitle="Próximas ações recomendadas"
        depth={2}
      >
        <InsightBanner type="warning">
          Não foi possível carregar as prioridades do dia.
        </InsightBanner>
      </WidgetContainer>
    );
  }

  const expedientes = data.expedientesUrgentes ?? [];
  const proximasAudiencias = data.proximasAudiencias ?? [];

  const acoes = derivarAcoes(expedientes, proximasAudiencias);

  if (acoes.length === 0) {
    return (
      <WidgetContainer
        title="Foco Agora"
        icon={Zap}
        subtitle="Próximas ações recomendadas"
        depth={2}
      >
        <InsightBanner type="success">
          Sem pendências urgentes identificadas para hoje.
        </InsightBanner>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer
      title="Foco Agora"
      icon={Zap}
      subtitle="Próximas ações recomendadas"
      depth={2}
    >
      <div className="flex flex-col gap-2 mb-4">
        {acoes.map((acao, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl
                        bg-white/2.5 border border-border/10
                        ring-1 ${URGENCIA_RING[acao.urgencia]}
                        hover:bg-white/4 transition-all duration-150 cursor-pointer`}
          >
            {/* Número em círculo com cor de urgência */}
            <div
              className={`size-6 rounded-full shrink-0 flex items-center justify-center
                          text-[10px] font-bold ${URGENCIA_COLORS[acao.urgencia]}`}
            >
              {i + 1}
            </div>

            {/* Conteúdo */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-foreground/85 truncate leading-tight">
                {acao.titulo}
              </p>
              <p className="text-[9px] text-muted-foreground/45 mt-0.5 truncate">
                {acao.razao}
              </p>
            </div>

            {/* Botão de ação */}
            <button
              type="button"
              className={`shrink-0 text-[9px] font-medium px-2 py-1 rounded-lg
                          transition-all duration-150 cursor-pointer
                          ${URGENCIA_BTN[acao.urgencia]}`}
            >
              {acao.acao}
            </button>
          </div>
        ))}
      </div>

      <InsightBanner type="info">
        Baseado em seus prazos, audiências e expedientes pendentes de hoje.
      </InsightBanner>
    </WidgetContainer>
  );
}
