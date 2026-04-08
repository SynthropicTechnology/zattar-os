'use client';

/**
 * CONTRATOS FEATURE - ContratoViewSheet
 *
 * Sheet de Visualização de Contrato.
 * Componente read-only para exibir detalhes completos de um contrato.
 */

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Calendar,
  User,
  Users,
  Briefcase,
  FileText,
  Clock,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContratoDocumentosList, GerarPecaDialog } from '@/app/(authenticated)/pecas-juridicas/components';
import type { Contrato } from '../domain';
import {
  TIPO_CONTRATO_LABELS,
  TIPO_COBRANCA_LABELS,
  STATUS_CONTRATO_LABELS,
  PAPEL_CONTRATUAL_LABELS,
} from '../domain';
import { formatarData, formatarDataHora } from '../utils';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { AppBadge } from '@/components/ui/app-badge';
import { Heading } from '@/components/ui/typography';

// =============================================================================
// TIPOS
// =============================================================================

interface ContratoViewSheetProps {
  contrato: Contrato;
  clienteNome: string;
  parteContrariaNome?: string;
  responsavelNome?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// =============================================================================
// COMPONENTES AUXILIARES
// =============================================================================

interface InfoItemProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

function InfoItem({ label, value, icon, className }: InfoItemProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="text-sm text-muted-foreground flex items-center gap-1.5">
        {icon}
        {label}
      </div>
      <div className="text-sm font-medium">{value || '-'}</div>
    </div>
  );
}

interface SectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

function Section({ title, icon, children }: SectionProps) {
  return (
    <div className="space-y-3">
      <Heading level="card" className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
        {icon}
        {title}
      </Heading>
      <div className="grid gap-4">{children}</div>
    </div>
  );
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ContratoViewSheet({
  contrato,
  clienteNome,
  parteContrariaNome,
  responsavelNome,
  open,
  onOpenChange,
}: ContratoViewSheetProps) {
  const [gerarPecaOpen, setGerarPecaOpen] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const handleGerarPecaSuccess = React.useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Contrato #{contrato.id}
            </SheetTitle>
            <SemanticBadge category="status_contrato" value={contrato.status}>
              {STATUS_CONTRATO_LABELS[contrato.status]}
            </SemanticBadge>
          </div>
          <SheetDescription>
            Detalhes do contrato jurídico
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-6 space-y-6">
            {/* Informações Básicas */}
            <Section title="Informações Básicas" icon={<Briefcase className="h-4 w-4" />}>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem
                  label="Tipo de Contrato"
                  value={
                    <AppBadge variant="secondary">
                      {TIPO_CONTRATO_LABELS[contrato.tipoContrato]}
                    </AppBadge>
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem
                  label="Tipo de Cobrança"
                  value={TIPO_COBRANCA_LABELS[contrato.tipoCobranca]}
                />
                <InfoItem
                  label="Status"
                  value={
                    <SemanticBadge category="status_contrato" value={contrato.status}>
                      {STATUS_CONTRATO_LABELS[contrato.status]}
                    </SemanticBadge>
                  }
                />
              </div>
            </Section>

            <Separator />

            {/* Partes */}
            <Section title="Partes do Contrato" icon={<Users className="h-4 w-4" />}>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Cliente</span>
                    <AppBadge variant="outline" className="text-xs">
                      {PAPEL_CONTRATUAL_LABELS[contrato.papelClienteNoContrato]}
                    </AppBadge>
                  </div>
                  <p className="font-medium">{clienteNome}</p>
                </div>

                {contrato.partes.filter(p => p.tipoEntidade === 'parte_contraria').map((parte, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-muted/50 border">
                    <span className="text-xs text-muted-foreground block mb-1">
                      Parte Contrária
                    </span>
                    <p className="font-medium">{parte.nomeSnapshot || parteContrariaNome || 'N/A'}</p>
                  </div>
                ))}
                {/*
                Note: The previous code iterated over `contrato.parteAutora` which was removed from domain.
                We should simply list the parts found in `contrato.partes` if we want detailed breakdown,
                but for now showing specific entities is safer.
            */}
              </div>
            </Section>

            <Separator />

            {/* Datas */}
            <Section title="Datas" icon={<Calendar className="h-4 w-4" />}>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem
                  label="Data de Contratação"
                  value={formatarData(contrato.cadastradoEm)}
                />
                {/*
                <InfoItem
                  label="Data de Assinatura"
                  value={formatarData(contrato.dataAssinatura)}
                />
                 */}
              </div>
              {/*
              <div className="grid grid-cols-2 gap-4">
                <InfoItem
                  label="Data de Distribuição"
                  value={formatarData(contrato.dataDistribuicao)}
                />
                <InfoItem
                  label="Data de Desistência"
                  value={formatarData(contrato.dataDesistencia)}
                />
              </div>
              */}
            </Section>

            {/* Responsável */}
            {(responsavelNome || contrato.responsavelId) && (
              <>
                <Separator />
                <Section title="Responsável" icon={<User className="h-4 w-4" />}>
                  <InfoItem
                    label="Responsável pelo Contrato"
                    value={responsavelNome || `Usuário #${contrato.responsavelId}`}
                  />
                </Section>
              </>
            )}

            {/* Observações */}
            {contrato.observacoes && (
              <>
                <Separator />
                <Section title="Observações" icon={<FileText className="h-4 w-4" />}>
                  <div className="p-3 rounded-lg bg-muted/50 border">
                    <p className="text-sm whitespace-pre-wrap">{contrato.observacoes}</p>
                  </div>
                </Section>
              </>
            )}

            <Separator />

            {/* Documentos / Peças Jurídicas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Heading level="card" className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  Documentos
                </Heading>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGerarPecaOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Gerar Peça
                </Button>
              </div>
              <ContratoDocumentosList key={refreshKey} contratoId={contrato.id} />
            </div>

            <Separator />

            {/* Metadados */}
            <Section title="Metadados" icon={<Clock className="h-4 w-4" />}>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <InfoItem
                  label="Criado em"
                  value={formatarDataHora(contrato.createdAt)}
                />
                <InfoItem
                  label="Atualizado em"
                  value={formatarDataHora(contrato.updatedAt)}
                />
              </div>
              {contrato.createdBy && (
                <InfoItem
                  label="Criado por"
                  value={`Usuário #${contrato.createdBy}`}
                />
              )}
            </Section>

            {contrato.statusHistorico.length > 0 && (
              <>
                <Separator />
                <Section title="Histórico de Status" icon={<Clock className="h-4 w-4" />}>
                  <div className="space-y-2">
                    {contrato.statusHistorico.map((item) => (
                      <div key={item.id} className="p-3 rounded-lg bg-muted/50 border">
                        <div className="flex items-center justify-between gap-2">
                          <AppBadge variant="outline" className="text-xs">
                            {item.fromStatus ? STATUS_CONTRATO_LABELS[item.fromStatus] : '—'}
                            {' → '}
                            {STATUS_CONTRATO_LABELS[item.toStatus]}
                          </AppBadge>
                          <span className="text-xs text-muted-foreground">
                            {formatarDataHora(item.changedAt)}
                          </span>
                        </div>
                        {(item.reason || item.changedBy) && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            {item.reason ? <div>{item.reason}</div> : null}
                            {item.changedBy ? <div>{`Usuário #${item.changedBy}`}</div> : null}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>

      {/* Dialog de geração de peça */}
      <GerarPecaDialog
        contratoId={contrato.id}
        open={gerarPecaOpen}
        onOpenChange={setGerarPecaOpen}
        onSuccess={handleGerarPecaSuccess}
      />
    </Sheet>
  );
}
