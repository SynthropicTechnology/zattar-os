'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SemanticBadge, StatusSemanticBadge } from "@/components/ui/semantic-badge";
import { Shield } from "lucide-react";
import { CopyButton } from "@/app/(authenticated)/partes/components/shared";

interface ParteContrariaPJESectionProps {
  data: Record<string, unknown>;
}

function InfoField({
  label,
  value,
  copyable = false
}: {
  label: string;
  value: string | null | undefined;
  copyable?: boolean;
}) {
  if (!value || value === '-') return null;

  return (
    <div className="space-y-1">
      <span className="text-muted-foreground text-sm">{label}</span>
      <div className="flex items-center gap-2 group">
        <p className="text-sm font-medium text-foreground">{value}</p>
        {copyable && (
          <CopyButton
            text={value}
            label={`Copiar ${label}`}
            alwaysVisible
          />
        )}
      </div>
    </div>
  );
}

function PJEStatusField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value || value === '-') return null;

  // Map PJE status values
  const mapToStatus = (status: string): string => {
    const lower = status.toLowerCase();
    if (lower === 'a' || lower.includes('ativo')) return 'ATIVO';
    if (lower === 'i' || lower.includes('inativo')) return 'ARQUIVADO';
    if (lower === 'e' || lower.includes('exclu')) return 'CANCELADO';
    return 'ATIVO';
  };

  return (
    <div className="space-y-1">
      <span className="text-muted-foreground text-sm">{label}</span>
      <StatusSemanticBadge value={mapToStatus(value)}>
        {value}
      </StatusSemanticBadge>
    </div>
  );
}

function BooleanField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value || value === '-') return null;

  return (
    <div className="space-y-1">
      <span className="text-muted-foreground text-sm">{label}</span>
      <SemanticBadge
        category="status"
        value={value === 'Sim' ? 'ATIVO' : 'ARQUIVADO'}
      >
        {value}
      </SemanticBadge>
    </div>
  );
}

export function ParteContrariaPJESection({ data }: ParteContrariaPJESectionProps) {
  const statusPje = data.status_pje as string | null;
  const situacaoPje = data.situacao_pje as string | null;
  const loginPje = data.login_pje as string | null;
  const autoridadeLabel = data.autoridade_label as string | null;

  // Don't render if no PJE data
  if (!statusPje && !situacaoPje && !loginPje && !autoridadeLabel) {
    return null;
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Dados PJE
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <PJEStatusField
            label="Status PJE"
            value={statusPje}
          />
          <PJEStatusField
            label="Situacao PJE"
            value={situacaoPje}
          />
          <InfoField
            label="Login PJE"
            value={loginPje}
            copyable
          />
          <BooleanField
            label="Autoridade"
            value={autoridadeLabel}
          />
        </div>
      </CardContent>
    </Card>
  );
}
