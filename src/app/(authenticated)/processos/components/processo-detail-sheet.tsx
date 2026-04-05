'use client';

import { useRouter } from 'next/navigation';
import { Scale } from 'lucide-react';
import {
  DetailSheet,
  DetailSheetHeader,
  DetailSheetTitle,
  DetailSheetContent,
  DetailSheetSection,
  DetailSheetMetaGrid,
  DetailSheetMetaItem,
  DetailSheetSeparator,
  DetailSheetAudit,
  DetailSheetFooter,
} from '@/components/shared/detail-sheet';
import { Button } from '@/components/ui/button';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { CopyButton } from '@/app/(authenticated)/partes';
import { GRAU_LABELS } from '@/lib/design-system';
import { STATUS_PROCESSO_LABELS } from '../domain';
import type { ProcessoUnificado } from '../domain';

interface Tag {
  id: number;
  nome: string;
}

interface Usuario {
  id: number;
  nomeExibicao: string;
  avatarUrl?: string | null;
}

interface ProcessoDetailSheetProps {
  processo: ProcessoUnificado | null;
  tags?: Tag[];
  responsavel?: Usuario;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProcessoDetailSheet({
  processo,
  tags,
  responsavel,
  open,
  onOpenChange,
}: ProcessoDetailSheetProps) {
  const router = useRouter();

  if (!processo) return null;

  const trt = processo.trtOrigem || processo.trt;
  const parteAutora = processo.nomeParteAutoraOrigem || processo.nomeParteAutora || '-';
  const parteRe = processo.nomeParteReOrigem || processo.nomeParteRe || '-';
  const statusLabel = STATUS_PROCESSO_LABELS?.[processo.codigoStatusProcesso as keyof typeof STATUS_PROCESSO_LABELS] || processo.codigoStatusProcesso;

  return (
    <DetailSheet open={open} onOpenChange={onOpenChange} side="right">
      <DetailSheetHeader>
        <DetailSheetTitle
          badge={
            <SemanticBadge category="status" value={processo.codigoStatusProcesso} className="text-xs">
              {statusLabel}
            </SemanticBadge>
          }
        >
          <Scale className="size-4 text-muted-foreground/50 mr-2 inline" />
          Processo
        </DetailSheetTitle>
      </DetailSheetHeader>

      <DetailSheetContent>
        <DetailSheetMetaGrid>
          <DetailSheetMetaItem label="Parte Autora">
            {parteAutora}
          </DetailSheetMetaItem>
          <DetailSheetMetaItem label="Parte Ré">
            {parteRe}
          </DetailSheetMetaItem>
          <DetailSheetMetaItem label="Número">
            <span className="font-mono text-sm">{processo.numeroProcesso}</span>
            <CopyButton text={processo.numeroProcesso} label="Copiar" />
          </DetailSheetMetaItem>
          <DetailSheetMetaItem label="Tribunal">
            <SemanticBadge category="tribunal" value={trt} className="text-xs">{trt}</SemanticBadge>
          </DetailSheetMetaItem>
          <DetailSheetMetaItem label="Grau">
            {processo.grauAtual ? (GRAU_LABELS[processo.grauAtual as keyof typeof GRAU_LABELS] || processo.grauAtual) : '-'}
          </DetailSheetMetaItem>
          <DetailSheetMetaItem label="Órgão Julgador">
            {processo.descricaoOrgaoJulgador || '-'}
          </DetailSheetMetaItem>
          <DetailSheetMetaItem label="Classe Judicial">
            {processo.classeJudicial || '-'}
          </DetailSheetMetaItem>
          <DetailSheetMetaItem label="Responsável">
            {responsavel?.nomeExibicao || 'Não atribuído'}
          </DetailSheetMetaItem>
        </DetailSheetMetaGrid>

        {tags && tags.length > 0 && (
          <>
            <DetailSheetSeparator />
            <DetailSheetSection title="Etiquetas">
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span key={tag.id} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/6 text-primary/60 border border-primary/10">
                    {tag.nome}
                  </span>
                ))}
              </div>
            </DetailSheetSection>
          </>
        )}

        <DetailSheetSeparator />
        <DetailSheetAudit createdAt={processo.createdAt} updatedAt={processo.updatedAt} />
      </DetailSheetContent>

      <DetailSheetFooter>
        <Button variant="ghost" onClick={() => onOpenChange(false)}>
          Fechar
        </Button>
        <Button onClick={() => router.push(`/processos/${processo.id}`)}>
          Abrir Processo
        </Button>
      </DetailSheetFooter>
    </DetailSheet>
  );
}
