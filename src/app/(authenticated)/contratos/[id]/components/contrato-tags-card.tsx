'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type {
  TipoContrato,
  TipoCobranca,
  PapelContratual,
} from '@/app/(authenticated)/contratos';
import {
  TIPO_CONTRATO_LABELS,
  TIPO_COBRANCA_LABELS,
  PAPEL_CONTRATUAL_LABELS,
  getTipoContratoVariant,
} from '@/app/(authenticated)/contratos';
import type { SegmentoDetalhado } from '@/app/(authenticated)/contratos';

interface ContratoTagsCardProps {
  tipoContrato: TipoContrato;
  tipoCobranca: TipoCobranca;
  papelClienteNoContrato: PapelContratual;
  segmento: SegmentoDetalhado | null;
}

export function ContratoTagsCard({
  tipoContrato,
  tipoCobranca,
  papelClienteNoContrato,
  segmento,
}: ContratoTagsCardProps) {
  const tipoContratoLabel = TIPO_CONTRATO_LABELS[tipoContrato] || tipoContrato;
  const tipoCobrancaLabel = TIPO_COBRANCA_LABELS[tipoCobranca] || tipoCobranca;
  const papelLabel = PAPEL_CONTRATUAL_LABELS[papelClienteNoContrato] || papelClienteNoContrato;
  const tipoContratoVariant = getTipoContratoVariant(tipoContrato);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Informações</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {/* Tipo de Contrato */}
          <Badge variant={tipoContratoVariant}>
            {tipoContratoLabel}
          </Badge>

          {/* Tipo de Cobrança */}
          <Badge variant="secondary">
            {tipoCobrancaLabel}
          </Badge>

          {/* Papel do Cliente */}
          <Badge variant="outline">
            Cliente {papelLabel}
          </Badge>

          {/* Segmento */}
          {segmento && (
            <Badge variant="outline">
              {segmento.nome}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
