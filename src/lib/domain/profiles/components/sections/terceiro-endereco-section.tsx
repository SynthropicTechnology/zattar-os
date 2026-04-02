'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { CopyButton, MapButton } from "@/app/app/partes/components/shared";

interface TerceiroEnderecoSectionProps {
  data: Record<string, unknown>;
}

function InfoField({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value || value === '-') return null;

  return (
    <div className="space-y-1">
      <span className="text-muted-foreground text-sm">{label}</span>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

export function TerceiroEnderecoSection({ data }: TerceiroEnderecoSectionProps) {
  const enderecoFormatado = data.endereco_formatado as string | null;
  const endereco = data.endereco as Record<string, unknown> | null;

  // Don't render if no address
  if (!enderecoFormatado || enderecoFormatado === '-' || enderecoFormatado === '') {
    return null;
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Endereco
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Endereco formatado com botoes */}
          <div className="flex items-start gap-2 group">
            <p className="text-sm text-foreground flex-1">{enderecoFormatado}</p>
            <div className="flex items-center gap-1 shrink-0">
              <CopyButton
                text={enderecoFormatado}
                label="Copiar endereco"
                alwaysVisible
              />
              <MapButton
                address={enderecoFormatado}
                alwaysVisible
              />
            </div>
          </div>

          {/* Detalhes do endereco */}
          {endereco && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pt-2 border-t border-border">
              <InfoField
                label="Logradouro"
                value={endereco.logradouro as string}
              />
              <InfoField
                label="Numero"
                value={endereco.numero as string}
              />
              <InfoField
                label="Complemento"
                value={endereco.complemento as string}
              />
              <InfoField
                label="Bairro"
                value={endereco.bairro as string}
              />
              <InfoField
                label="Cidade/UF"
                value={endereco.cidade_uf as string}
              />
              <InfoField
                label="CEP"
                value={endereco.cep_formatado as string || endereco.cep as string}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
