'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, Star } from "lucide-react";
import { StatusSemanticBadge } from "@/components/ui/semantic-badge";
import { CopyButton } from "@/app/(authenticated)/partes/components/shared";

interface RepresentanteOABSectionProps {
  data: Record<string, unknown>;
}

interface OABItem {
  numero: string;
  uf: string;
  situacao?: string;
}

function mapSituacaoToStatus(situacao: string | undefined): string {
  if (!situacao) return 'ATIVO';
  const lower = situacao.toLowerCase();
  if (lower === 'regular' || lower.includes('ativo')) return 'ATIVO';
  if (lower === 'suspenso' || lower.includes('suspen')) return 'PENDENTE';
  if (lower === 'cancelado' || lower.includes('cancel')) return 'CANCELADO';
  if (lower === 'licenciado' || lower.includes('licen')) return 'ARQUIVADO';
  if (lower === 'falecido' || lower.includes('falec')) return 'CANCELADO';
  return 'ATIVO';
}

export function RepresentanteOABSection({ data }: RepresentanteOABSectionProps) {
  const oabs = (data.oabs as OABItem[]) || [];
  const oabPrincipal = data.oab_principal as string | null;

  // Don't render if no OAB data
  if (oabs.length === 0 && !oabPrincipal) {
    return null;
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Scale className="h-4 w-4" />
          Inscricoes OAB
        </CardTitle>
      </CardHeader>
      <CardContent>
        {oabs.length > 0 ? (
          <div className="space-y-3">
            {oabs.map((oab, idx) => {
              const oabStr = `${oab.numero}/${oab.uf}`;
              const isPrincipal = idx === 0;

              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between gap-4 p-3 rounded-lg ${
                    isPrincipal ? 'bg-primary/5 border border-primary/20' : 'bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isPrincipal && (
                      <Star className="h-4 w-4 text-primary fill-primary" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium text-foreground">
                          {oabStr}
                        </span>
                        <CopyButton
                          text={oabStr}
                          label="Copiar OAB"
                          alwaysVisible
                        />
                      </div>
                      {isPrincipal && (
                        <span className="text-xs text-muted-foreground">Principal</span>
                      )}
                    </div>
                  </div>
                  {oab.situacao && (
                    <StatusSemanticBadge value={mapSituacaoToStatus(oab.situacao)}>
                      {oab.situacao}
                    </StatusSemanticBadge>
                  )}
                </div>
              );
            })}
          </div>
        ) : oabPrincipal ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <Star className="h-4 w-4 text-primary fill-primary" />
            <span className="font-mono text-sm font-medium text-foreground">
              {oabPrincipal}
            </span>
            <CopyButton
              text={oabPrincipal}
              label="Copiar OAB"
              alwaysVisible
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
