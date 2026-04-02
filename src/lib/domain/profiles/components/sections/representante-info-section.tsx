'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Briefcase } from "lucide-react";
import { CopyButton } from "@/app/app/partes/components/shared";

interface RepresentanteInfoSectionProps {
  data: Record<string, unknown>;
}

function InfoField({
  label,
  value,
  copyable = false
}: {
  label: string;
  value: string | number | null | undefined;
  copyable?: boolean;
}) {
  if (value === null || value === undefined || value === '-' || value === '') return null;

  return (
    <div className="space-y-1">
      <span className="text-muted-foreground text-sm">{label}</span>
      <div className="flex items-center gap-2 group">
        <p className="text-sm font-medium text-foreground">{String(value)}</p>
        {copyable && (
          <CopyButton
            text={String(value)}
            label={`Copiar ${label}`}
            alwaysVisible
          />
        )}
      </div>
    </div>
  );
}

export function RepresentanteInfoSection({ data }: RepresentanteInfoSectionProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <User className="h-4 w-4" />
          Dados Pessoais
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <InfoField
            label="Nome"
            value={data.nome as string}
          />
          <InfoField
            label="CPF"
            value={data.cpf_formatado as string}
            copyable
          />
          <InfoField
            label="Sexo"
            value={data.sexo as string}
          />
          <div className="space-y-1">
            <span className="text-muted-foreground text-sm flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Tipo
            </span>
            <p className="text-sm font-medium text-foreground">
              {(data.tipo as string) || 'ADVOGADO'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
