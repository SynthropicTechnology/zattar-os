'use client';

import { useEffect, useState } from 'react';
import { FileText, Calendar, Microscope } from 'lucide-react';
import {
  DetailSheet,
  DetailSheetHeader,
  DetailSheetTitle,
  DetailSheetContent,
  DetailSheetFooter,
} from '@/components/shared/detail-sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { actionObterDetalhesComplementaresProcesso } from '../../actions';
import type { Audiencia } from '@/app/(authenticated)/audiencias';
import type { Expediente } from '@/app/(authenticated)/expedientes';
import type { Pericia } from '@/app/(authenticated)/pericias';

interface UsuarioInfo {
  id: number;
  nomeExibicao: string;
  avatarUrl?: string | null;
}

interface AllDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processoId: number;
  numeroProcesso: string;
  usuariosMap: Map<number, UsuarioInfo>;
}

export function AllDetailsSheet({
  open,
  onOpenChange,
  processoId,
  numeroProcesso,
  usuariosMap,
}: AllDetailsSheetProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [audiencias, setAudiencias] = useState<Audiencia[]>([]);
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [pericias, setPericias] = useState<Pericia[]>([]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setIsLoading(true);

    actionObterDetalhesComplementaresProcesso(processoId, numeroProcesso)
      .then((result) => {
        if (cancelled) return;
        if (result.success && result.data) {
          setAudiencias(result.data.audiencias as Audiencia[]);
          setExpedientes(result.data.expedientes as Expediente[]);
          setPericias(result.data.pericias as Pericia[]);
        }
      })
      .catch((err) => console.error('Erro ao carregar detalhes:', err))
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [open, processoId, numeroProcesso]);

  const totalAudiencias = audiencias.length;
  const totalExpedientes = expedientes.length;
  const totalPericias = pericias.length;

  return (
    <DetailSheet open={open} onOpenChange={onOpenChange} side="right">
      <DetailSheetHeader>
        <DetailSheetTitle>Detalhes Complementares</DetailSheetTitle>
      </DetailSheetHeader>

      <DetailSheetContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <Tabs defaultValue="expedientes">
            <TabsList variant="line" className="w-full justify-start">
              <TabsTrigger value="expedientes" className="gap-1.5 text-sm">
                <FileText className="size-3.5" />
                Expedientes
                {totalExpedientes > 0 && (
                  <SemanticBadge category="status" value={totalExpedientes} variantOverride="secondary" toneOverride="soft" className="ml-1 text-[10px] px-1.5 py-0">
                    {totalExpedientes}
                  </SemanticBadge>
                )}
              </TabsTrigger>
              <TabsTrigger value="audiencias" className="gap-1.5 text-sm">
                <Calendar className="size-3.5" />
                Audiências
                {totalAudiencias > 0 && (
                  <SemanticBadge category="status" value={totalAudiencias} variantOverride="secondary" toneOverride="soft" className="ml-1 text-[10px] px-1.5 py-0">
                    {totalAudiencias}
                  </SemanticBadge>
                )}
              </TabsTrigger>
              <TabsTrigger value="pericias" className="gap-1.5 text-sm">
                <Microscope className="size-3.5" />
                Perícias
                {totalPericias > 0 && (
                  <SemanticBadge category="status" value={totalPericias} variantOverride="secondary" toneOverride="soft" className="ml-1 text-[10px] px-1.5 py-0">
                    {totalPericias}
                  </SemanticBadge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="expedientes" className="mt-3">
              {totalExpedientes === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Nenhum expediente.</p>
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                  {expedientes.map((exp) => (
                    <div key={exp.id} className="rounded-lg border px-3 py-2.5 text-xs">
                      <p className="font-medium">Expediente</p>
                      <p className="text-muted-foreground/60 mt-0.5">
                        {exp.dataCriacaoExpediente ? new Date(exp.dataCriacaoExpediente).toLocaleDateString('pt-BR') : '--'}
                        {exp.dataPrazoLegalParte && ` · Prazo: ${new Date(exp.dataPrazoLegalParte).toLocaleDateString('pt-BR')}`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="audiencias" className="mt-3">
              {totalAudiencias === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma audiência.</p>
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                  {audiencias.map((aud) => (
                    <div key={aud.id} className="rounded-lg border px-3 py-2.5 text-xs">
                      <p className="font-medium">{aud.tipoDescricao || 'Audiência'}</p>
                      <p className="text-muted-foreground/60 mt-0.5">
                        {new Date(aud.dataInicio).toLocaleDateString('pt-BR')}
                        {aud.salaAudienciaNome && ` · Sala ${aud.salaAudienciaNome}`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="pericias" className="mt-3">
              {totalPericias === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma perícia.</p>
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                  {pericias.map((per) => (
                    <div key={per.id} className="rounded-lg border px-3 py-2.5 text-xs">
                      <p className="font-medium">{per.especialidade?.descricao || 'Perícia'}</p>
                      <p className="text-muted-foreground/60 mt-0.5">
                        {per.perito?.nome && `Perito: ${per.perito.nome} · `}
                        Prazo: {per.prazoEntrega ? new Date(per.prazoEntrega).toLocaleDateString('pt-BR') : '--'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DetailSheetContent>

      <DetailSheetFooter>
        <Button variant="ghost" onClick={() => onOpenChange(false)}>
          Fechar
        </Button>
      </DetailSheetFooter>
    </DetailSheet>
  );
}
