'use client';

/**
 * Widget: Saúde Contratual
 * ============================================================================
 * Placeholder aguardando o módulo de contratos.
 * Exibe GaugeMeter neutro em 0 e um InsightBanner explicativo.
 * Quando o hook de contratos estiver disponível, substituir o conteúdo pelo
 * score real calculado a partir da carteira de contratos.
 *
 * Uso:
 *   import { WidgetSaudeContratual } from '@/app/app/dashboard/widgets/contratos/saude-contratual'
 * ============================================================================
 */

import { HeartPulse } from 'lucide-react';
import {
  GaugeMeter,
  InsightBanner,
  WidgetContainer,
} from '../../mock/widgets/primitives';

export function WidgetSaudeContratual() {
  return (
    <WidgetContainer
      title="Saúde Contratual"
      icon={HeartPulse}
      subtitle="Score consolidado da carteira de contratos"
      depth={2}
      className="md:col-span-2"
    >
      <div className="flex flex-col items-center gap-4 mt-1">
        {/* Gauge placeholder em 0 — neutro */}
        <div className="flex flex-col items-center gap-1">
          <GaugeMeter
            value={0}
            max={100}
            label="score contratual"
            status="neutral"
            size={120}
          />
          <p className="text-[10px] text-muted-foreground/60 -mt-1">
            Conectando ao módulo de contratos...
          </p>
        </div>

        {/* Métricas placeholder */}
        <div className="grid grid-cols-3 gap-4 w-full pt-3 border-t border-border/10">
          {[
            { label: 'Contratos Ativos', value: '—' },
            { label: 'Inadimplência', value: '—' },
            { label: 'Em Renovação', value: '—' },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider text-center">
                {item.label}
              </span>
              <span className="font-display text-xl font-bold text-muted-foreground/55">
                {item.value}
              </span>
            </div>
          ))}
        </div>

        <InsightBanner type="info">
          Módulo de contratos em desenvolvimento — dados serão exibidos automaticamente após a integração.
        </InsightBanner>
      </div>
    </WidgetContainer>
  );
}
