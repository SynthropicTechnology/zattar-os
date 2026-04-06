'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AppBadge } from '@/components/ui/app-badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DetailSheet,
  DetailSheetHeader,
  DetailSheetTitle,
  DetailSheetDescription,
  DetailSheetContent,
  DetailSheetSection,
  DetailSheetInfoRow,
  DetailSheetMetaGrid,
  DetailSheetMetaItem,
  DetailSheetSeparator,
  DetailSheetAudit,
  DetailSheetFooter,
  DetailSheetEmpty,
} from '@/components/shared/detail-sheet';
import { ORIGEM_EXPEDIENTE_LABELS, GRAU_TRIBUNAL_LABELS, type Expediente } from '../domain';

interface ExpedienteControlDetailSheetProps {
  expediente: Expediente | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  responsavelNome?: string | null;
  tipoExpedienteNome?: string | null;
}

function formatarData(dataISO: string | null | undefined) {
  if (!dataISO) return 'Nao definido';

  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dataISO));
  } catch {
    return 'Nao definido';
  }
}

function getPrazoResumo(expediente: Expediente) {
  if (expediente.baixadoEm) return 'Baixado';
  if (!expediente.dataPrazoLegalParte) return 'Sem prazo';
  if (expediente.prazoVencido) return 'Vencido';

  const hoje = new Date();
  const prazo = new Date(expediente.dataPrazoLegalParte);
  const hojeZerado = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const prazoZerado = new Date(prazo.getFullYear(), prazo.getMonth(), prazo.getDate());
  const diff = Math.round((prazoZerado.getTime() - hojeZerado.getTime()) / 86400000);

  if (diff <= 0) return 'Hoje';
  if (diff === 1) return 'Amanha';
  if (diff <= 3) return `${diff} dias`;
  return 'No prazo';
}

export function ExpedienteControlDetailSheet({
  expediente,
  open,
  onOpenChange,
  responsavelNome,
  tipoExpedienteNome,
}: ExpedienteControlDetailSheetProps) {
  const router = useRouter();

  return (
    <DetailSheet open={open} onOpenChange={onOpenChange} side="right">
      {!expediente ? (
        <DetailSheetEmpty
          title="Nenhum expediente selecionado"
          description="Selecione um item na fila para visualizar o contexto operacional."
        />
      ) : (
        <>
          <DetailSheetHeader>
            <DetailSheetTitle
              badge={
                <AppBadge variant={expediente.baixadoEm ? 'secondary' : expediente.prazoVencido ? 'destructive' : 'outline'}>
                  {getPrazoResumo(expediente)}
                </AppBadge>
              }
            >
              Expediente operacional
            </DetailSheetTitle>
            <DetailSheetDescription>
              {expediente.numeroProcesso}
              <span>•</span>
              <span>{GRAU_TRIBUNAL_LABELS[expediente.grau]}</span>
              <span>•</span>
              <span>{expediente.trt}</span>
            </DetailSheetDescription>
          </DetailSheetHeader>

          <DetailSheetContent>
            <DetailSheetSection title="Leitura rapida">
              <DetailSheetMetaGrid>
                <DetailSheetMetaItem label="Prazo">
                  {formatarData(expediente.dataPrazoLegalParte)}
                </DetailSheetMetaItem>
                <DetailSheetMetaItem label="Responsavel">
                  {responsavelNome || 'Sem responsavel'}
                </DetailSheetMetaItem>
                <DetailSheetMetaItem label="Tipo">
                  {tipoExpedienteNome || 'Sem tipo'}
                </DetailSheetMetaItem>
                <DetailSheetMetaItem label="Origem">
                  {ORIGEM_EXPEDIENTE_LABELS[expediente.origem]}
                </DetailSheetMetaItem>
                <DetailSheetMetaItem label="Ciencia">
                  {formatarData(expediente.dataCienciaParte)}
                </DetailSheetMetaItem>
                <DetailSheetMetaItem label="Criacao">
                  {formatarData(expediente.dataCriacaoExpediente)}
                </DetailSheetMetaItem>
              </DetailSheetMetaGrid>
            </DetailSheetSection>

            <Tabs defaultValue="contexto" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="contexto">Contexto</TabsTrigger>
                <TabsTrigger value="partes">Partes</TabsTrigger>
                <TabsTrigger value="registro">Registro</TabsTrigger>
              </TabsList>

              <TabsContent value="contexto" className="mt-4 space-y-4">
                <DetailSheetSection title="Processo">
                  <DetailSheetInfoRow label="Numero">
                    {expediente.numeroProcesso}
                  </DetailSheetInfoRow>
                  <DetailSheetInfoRow label="Classe">
                    {expediente.classeJudicial || 'Nao informado'}
                  </DetailSheetInfoRow>
                  <DetailSheetInfoRow label="Orgao julgador">
                    {expediente.descricaoOrgaoJulgador || expediente.orgaoJulgadorOrigem || 'Nao informado'}
                  </DetailSheetInfoRow>
                  <DetailSheetInfoRow label="Segredo de justica">
                    {expediente.segredoJustica ? 'Sim' : 'Nao'}
                  </DetailSheetInfoRow>
                  <DetailSheetInfoRow label="Prioridade processual">
                    {expediente.prioridadeProcessual ? 'Sim' : 'Nao'}
                  </DetailSheetInfoRow>
                </DetailSheetSection>

                <DetailSheetSection title="Classificacao e acao">
                  <DetailSheetInfoRow label="Status operacional">
                    {getPrazoResumo(expediente)}
                  </DetailSheetInfoRow>
                  <DetailSheetInfoRow label="Tipo do expediente">
                    {tipoExpedienteNome || 'Sem tipo'}
                  </DetailSheetInfoRow>
                  <DetailSheetInfoRow label="Descricao de arquivos">
                    {expediente.descricaoArquivos || 'Nao descrito'}
                  </DetailSheetInfoRow>
                  <DetailSheetInfoRow label="Observacoes">
                    {expediente.observacoes || 'Sem observacoes'}
                  </DetailSheetInfoRow>
                </DetailSheetSection>
              </TabsContent>

              <TabsContent value="partes" className="mt-4 space-y-4">
                <DetailSheetSection title="Partes atuais">
                  <DetailSheetInfoRow label="Autora">
                    {expediente.nomeParteAutora || 'Nao informado'}
                  </DetailSheetInfoRow>
                  <DetailSheetInfoRow label="Re">
                    {expediente.nomeParteRe || 'Nao informado'}
                  </DetailSheetInfoRow>
                </DetailSheetSection>

                <DetailSheetSection title="Fonte da verdade 1o grau">
                  <DetailSheetInfoRow label="Autora origem">
                    {expediente.nomeParteAutoraOrigem || 'Nao informado'}
                  </DetailSheetInfoRow>
                  <DetailSheetInfoRow label="Re origem">
                    {expediente.nomeParteReOrigem || 'Nao informado'}
                  </DetailSheetInfoRow>
                  <DetailSheetInfoRow label="TRT origem">
                    {expediente.trtOrigem || 'Nao informado'}
                  </DetailSheetInfoRow>
                </DetailSheetSection>
              </TabsContent>

              <TabsContent value="registro" className="mt-4 space-y-4">
                <DetailSheetSection title="Baixa e trilha">
                  <DetailSheetInfoRow label="Baixado em">
                    {formatarData(expediente.baixadoEm)}
                  </DetailSheetInfoRow>
                  <DetailSheetInfoRow label="Protocolo">
                    {expediente.protocoloId || 'Nao informado'}
                  </DetailSheetInfoRow>
                  <DetailSheetInfoRow label="Justificativa">
                    {expediente.justificativaBaixa || 'Nao informada'}
                  </DetailSheetInfoRow>
                  <DetailSheetInfoRow label="Resultado">
                    {expediente.resultadoDecisao || 'Nao informado'}
                  </DetailSheetInfoRow>
                  <DetailSheetSeparator />
                  <DetailSheetAudit createdAt={expediente.createdAt} updatedAt={expediente.updatedAt} />
                </DetailSheetSection>
              </TabsContent>
            </Tabs>
          </DetailSheetContent>

          <DetailSheetFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button
              onClick={() => {
                if (!expediente.processoId) return;
                router.push(`/app/processos/${expediente.processoId}`);
              }}
              disabled={!expediente.processoId}
            >
              Abrir processo
            </Button>
          </DetailSheetFooter>
        </>
      )}
    </DetailSheet>
  );
}