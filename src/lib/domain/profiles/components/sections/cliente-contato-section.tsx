'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail } from "lucide-react";
import { CopyButton } from "@/app/(authenticated)/partes/components/shared";

interface ClienteContatoSectionProps {
  data: Record<string, unknown>;
}

interface TelefoneItem {
  label: string;
  value: string | null | undefined;
  raw: string | null | undefined;
}

export function ClienteContatoSection({ data }: ClienteContatoSectionProps) {
  // Build list of telefones
  const telefones: TelefoneItem[] = [
    {
      label: 'Celular',
      value: data.celular_formatado as string | null,
      raw: data.numero_celular ? `${data.ddd_celular || ''}${data.numero_celular}` : null
    },
    {
      label: 'Residencial',
      value: data.residencial_formatado as string | null,
      raw: data.numero_residencial ? `${data.ddd_residencial || ''}${data.numero_residencial}` : null
    },
    {
      label: 'Comercial',
      value: data.comercial_formatado as string | null,
      raw: data.numero_comercial ? `${data.ddd_comercial || ''}${data.numero_comercial}` : null
    },
  ].filter(t => t.value && t.value !== '-');

  const emails = Array.isArray(data.emails) ? data.emails as string[] : [];

  // Don't render if no contacts
  if (telefones.length === 0 && emails.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Contatos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Telefones */}
          {telefones.length > 0 && (
            <div className="space-y-2">
              <span className="text-muted-foreground text-sm font-medium flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefones
              </span>
              <div className="space-y-1.5">
                {telefones.map((tel, idx) => (
                  <div key={idx} className="flex items-center gap-2 group">
                    <span className="text-sm text-foreground">
                      <span className="text-muted-foreground">{tel.label}:</span> {tel.value}
                    </span>
                    {tel.raw && (
                      <CopyButton
                        text={String(tel.raw).replace(/\D/g, '')}
                        label={`Copiar ${tel.label}`}
                        alwaysVisible
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Emails */}
          {emails.length > 0 && (
            <div className="space-y-2">
              <span className="text-muted-foreground text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Emails
              </span>
              <div className="space-y-1.5">
                {emails.map((email, idx) => (
                  <div key={idx} className="flex items-center gap-2 group">
                    <a
                      href={`mailto:${email}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {email}
                    </a>
                    <CopyButton
                      text={email}
                      label="Copiar email"
                      alwaysVisible
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
