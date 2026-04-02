/**
 * Componente para exibir badges de graus ativos de um processo unificado
 */

import { SemanticBadge } from '@/components/ui/semantic-badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ProcessoInstancia, GrauProcesso } from '@/app/app/processos/types';
import { ORIGEM_LABELS } from '@/app/app/processos';

interface GrauBadgesProps {
  instances?: ProcessoInstancia[];
}

/**
 * Mapeia grau para label legível
 */
const GRAU_LABELS_MAP: Record<GrauProcesso, string> = {
  primeiro_grau: '1º Grau',
  segundo_grau: '2º Grau',
  tribunal_superior: 'Tribunal Superior',
};

/**
 * Mapeia grau para variante de badge
 */
/**
 * Componente que exibe badges dos graus ativos de um processo
 */
export function GrauBadges({ instances }: GrauBadgesProps) {
  // Se não há instâncias, não renderiza nada (processo legado/não-unificado)
  if (!instances || instances.length === 0) {
    return null;
  }

  // Ordenar instâncias: primeiro grau, segundo grau, tribunal superior
  const instancesOrdenadas = [...instances].sort((a, b) => {
    const ordem: Record<GrauProcesso, number> = { primeiro_grau: 1, segundo_grau: 2, tribunal_superior: 3 };
    return ordem[a.grau] - ordem[b.grau];
  });

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {instancesOrdenadas.map((instance) => {
        const label = GRAU_LABELS_MAP[instance.grau];

        return (
          <TooltipProvider key={instance.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <SemanticBadge category="grau" value={instance.grau}>
                  {label}
                </SemanticBadge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs space-y-1">
                  <div>
                    <strong>Grau:</strong> {label}
                  </div>
                  <div>
                    <strong>TRT:</strong> {instance.trt}
                  </div>
                  <div>
                    <strong>Origem:</strong>{' '}
                    {ORIGEM_LABELS[instance.origem]}
                  </div>
                  <div>
                    <strong>Data Autuação:</strong>{' '}
                    {new Date(instance.dataAutuacao).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}

/**
 * Versão simplificada sem tooltip (para células de tabela compactas)
 */
export function GrauBadgesSimple({ grausAtivos }: { grausAtivos?: GrauProcesso[] }) {
  if (!grausAtivos || grausAtivos.length === 0) {
    return null;
  }

  // Ordenar graus: primeiro grau, segundo grau, tribunal superior
  const grausOrdenados = [...grausAtivos].sort((a, b) => {
    const ordem: Record<GrauProcesso, number> = { primeiro_grau: 1, segundo_grau: 2, tribunal_superior: 3 };
    return ordem[a] - ordem[b];
  });

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {grausOrdenados.map((grau) => {
        const label = GRAU_LABELS_MAP[grau];

        return (
          <SemanticBadge
            key={grau}
            category="grau"
            value={grau}
            className="text-xs"
          >
            {label}
          </SemanticBadge>
        );
      })}
    </div>
  );
}
