'use client';

import * as React from 'react';
import Link from 'next/link';
import { Scale, ExternalLink, Calendar } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ContratoProcessoVinculo } from '@/app/(authenticated)/contratos';

interface ContratoProcessosCardProps {
  processos: ContratoProcessoVinculo[];
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    // Usa UTC para evitar deslocamento de fuso horário em datas sem hora
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  } catch {
    return '-';
  }
}

function formatGrau(grau: string | null): string {
  if (!grau) return '-';
  const grauMap: Record<string, string> = {
    primeiro_grau: '1º Grau',
    segundo_grau: '2º Grau',
    tribunal_superior: 'TST',
  };
  return grauMap[grau] || grau;
}

export function ContratoProcessosCard({ processos }: ContratoProcessosCardProps) {
  const isEmpty = processos.length === 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Scale className="size-4" />
          Processos Vinculados
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div className="text-center py-6 text-muted-foreground">
            <Scale className="size-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum processo vinculado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {processos.map((vinculo) => {
              const processo = vinculo.processo;
              if (!processo) return null;

              return (
                <div
                  key={vinculo.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div className="space-y-1">
                    <div className="font-mono text-sm font-medium">
                      {processo.numeroProcesso || `Processo #${processo.id}`}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {processo.trt && (
                        <Badge variant="outline" className="text-xs">
                          {processo.trt}
                        </Badge>
                      )}
                      {processo.grau && (
                        <Badge variant="secondary" className="text-xs">
                          {formatGrau(processo.grau)}
                        </Badge>
                      )}
                      {processo.dataAutuacao && (
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          {formatDate(processo.dataAutuacao)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/app/processos/${processo.id}`} title="Ver processo">
                      <ExternalLink className="size-4" />
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
