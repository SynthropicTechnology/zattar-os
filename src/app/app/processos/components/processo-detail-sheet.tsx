'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, DollarSign, Clock, AlertTriangle } from 'lucide-react';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { useProcessoDetail } from '../hooks/use-processo-detail';
import { SemanticBadge } from '@/components/ui/semantic-badge';

interface ProcessoDetailSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  processoId: number | null;
}

export function ProcessoDetailSheet({
  isOpen,
  onOpenChange,
  processoId,
}: ProcessoDetailSheetProps) {
  const { processo, isLoading, error } = useProcessoDetail(processoId);

  if (!processoId) {
    return null;
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <>
          <SheetHeader className="mb-4">
            <SheetTitle className="sr-only">Carregando processo</SheetTitle>
            <Skeleton className="h-8 w-64" />
            <div className="flex items-center gap-2 mt-2!">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </SheetHeader>
          <Separator />
          <div className="flex-1 flex flex-col min-h-0 mt-4">
            <Skeleton className="h-10 w-full mb-4" />
            <div className="space-y-4">
              <Skeleton className="h-6 w-40" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          </div>
        </>
      );
    }

    if (error) {
      return (
        <>
          <SheetHeader>
            <SheetTitle className="sr-only">Erro ao carregar processo</SheetTitle>
          </SheetHeader>
          <div className="flex-1 flex items-center justify-center">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><AlertTriangle className="text-destructive" /></EmptyMedia>
                <EmptyTitle>Erro ao carregar processo</EmptyTitle>
                <EmptyDescription>{error}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        </>
      );
    }

    if (!processo) {
      return (
        <>
          <SheetHeader>
            <SheetTitle className="sr-only">Processo não encontrado</SheetTitle>
          </SheetHeader>
          <div className="flex-1 flex items-center justify-center">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><AlertTriangle /></EmptyMedia>
                <EmptyTitle>Processo não encontrado</EmptyTitle>
                <EmptyDescription>
                  O processo selecionado não foi encontrado.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        </>
      );
    }

    return (
      <>
        <SheetHeader className="mb-4">
          <SheetTitle className="font-heading text-2xl font-bold">
            {processo.numero_processo}
          </SheetTitle>
          <div className="flex items-center gap-2 mt-2!">
            <SemanticBadge category="status" value={processo.status}>{processo.status}</SemanticBadge>
            <SemanticBadge category="tribunal" value={processo.trt}>{processo.trt}</SemanticBadge>
          </div>
          <div className="flex gap-2 pt-2">
            <Button size="sm" variant="outline">Editar</Button>
            <Button size="sm" variant="ghost">Arquivar</Button>
          </div>
        </SheetHeader>

        <Separator />

        <div className="flex-1 flex flex-col min-h-0">
          <Tabs defaultValue="geral" className="mt-4 flex-1 flex flex-col min-h-0">
            <TabsList>
              <TabsTrigger value="geral">Geral</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="audiencias">Audiências</TabsTrigger>
              <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            </TabsList>
            <div className="flex-1 overflow-y-auto py-4 pr-6 -mr-6 mt-2">
              <TabsContent value="geral">
                <div className="space-y-4">
                  <h3 className="font-heading text-lg font-medium">Informações Gerais</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Classe Judicial</p>
                      <p>{processo.classe_judicial || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Órgão Julgador</p>
                      <p>{processo.descricao_orgao_julgador || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Parte Autora</p>
                      <p>{processo.nome_parte_autora || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Parte Ré</p>
                      <p>{processo.nome_parte_re || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Data de Autuação</p>
                      <p>{processo.data_autuacao ? new Date(processo.data_autuacao).toLocaleDateString('pt-BR') : '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Grau</p>
                      <p>{processo.grau === 'primeiro_grau' ? '1º Grau' : processo.grau === 'segundo_grau' ? '2º Grau' : 'Tribunal Superior'}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="timeline">
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon"><Clock /></EmptyMedia>
                    <EmptyTitle>Nenhum andamento no timeline</EmptyTitle>
                    <EmptyDescription>
                      O timeline deste processo ainda não possui andamentos.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </TabsContent>
              <TabsContent value="audiencias">
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon"><Calendar /></EmptyMedia>
                    <EmptyTitle>Nenhuma audiência agendada</EmptyTitle>
                    <EmptyDescription>
                      Não há audiências futuras ou passadas para este processo.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </TabsContent>
              <TabsContent value="financeiro">
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon"><DollarSign /></EmptyMedia>
                    <EmptyTitle>Nenhum dado financeiro</EmptyTitle>
                    <EmptyDescription>
                      Nenhum acordo, condenação ou custas foram vinculados a este processo ainda.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-[min(92vw,48rem)] sm:max-w-none flex flex-col">
        {renderContent()}

        <SheetFooter className="bg-background/95 backdrop-blur border-t pt-4">
          <SheetClose asChild>
            <Button variant="outline">Fechar</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
