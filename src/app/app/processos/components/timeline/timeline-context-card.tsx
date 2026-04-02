'use client';

/**
 * TimelineContextCard
 *
 * Card fixo no topo da sidebar exibindo informações contextuais do processo:
 * número, partes e órgão julgador.
 */

interface TimelineContextCardProps {
  /** Número do processo formatado, ex: "1002345-67.2023.8.26.0100" */
  numeroProcesso: string;
  /** Partes envolvidas, ex: "João da Silva vs. Empresa X" */
  partes: string;
  /** Órgão julgador, ex: "3ª Vara Cível - Foro Central" */
  orgao: string;
}

/**
 * Card com informações contextuais do processo exibido no topo da sidebar da timeline.
 *
 * @example
 * <TimelineContextCard
 *   numeroProcesso="1002345-67.2023.8.26.0100"
 *   partes="João da Silva vs. Empresa X"
 *   orgao="3ª Vara Cível - Foro Central"
 * />
 */
export function TimelineContextCard({
  numeroProcesso,
  partes,
  orgao,
}: TimelineContextCardProps) {
  return (
    <div className="shrink-0 p-4 border-b flex flex-col justify-center bg-card sticky top-0 z-10">
      {/* Número do processo em fonte mono */}
      <p className="font-mono text-xs text-muted-foreground mb-1 tracking-wider truncate">
        Nº {numeroProcesso}
      </p>

      {/* Partes do processo */}
      <p className="text-sm font-medium truncate">
        {partes}
      </p>

      {/* Órgão julgador */}
      <p className="text-xs text-muted-foreground truncate">
        {orgao}
      </p>
    </div>
  );
}
