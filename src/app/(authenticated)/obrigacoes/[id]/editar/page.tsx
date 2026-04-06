
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AcordoForm } from '@/app/(authenticated)/obrigacoes';
import { actionBuscarAcordo } from '@/app/(authenticated)/obrigacoes/server-actions';
import type { AcordoComParcelas } from '@/app/(authenticated)/obrigacoes';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyContent } from '@/components/ui/empty';

interface EditarObrigacaoPageProps {
  params: Promise<{ id: string }>;
}

export default function EditarObrigacaoPage({ params }: EditarObrigacaoPageProps) {
  const router = useRouter();
  const [acordo, setAcordo] = useState<AcordoComParcelas | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acordoId, setAcordoId] = useState<number | null>(null);

  useEffect(() => {
    async function resolveParams() {
      const resolvedParams = await params;
      const id = parseInt(resolvedParams.id, 10);
      setAcordoId(id);
    }
    resolveParams();
  }, [params]);

  const loadAcordo = useCallback(async () => {
    if (acordoId === null) return;
    try {
      setIsLoading(true);
      setError(null);
      const result = await actionBuscarAcordo(acordoId);
      if (result.success && result.data) {
        setAcordo(result.data);
      } else {
        setError(result.error || 'Erro ao carregar dados');
      }
    } catch {
      setError('Erro ao comunicar com o servidor');
    } finally {
      setIsLoading(false);
    }
  }, [acordoId]);

  useEffect(() => {
    if (acordoId !== null) loadAcordo();
  }, [acordoId, loadAcordo]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <Empty><EmptyHeader><EmptyMedia variant="icon"><Loader2 className="h-6 w-6 animate-spin" /></EmptyMedia><EmptyTitle>Carregando...</EmptyTitle></EmptyHeader></Empty>
      </div>
    );
  }

  if (error || !acordo) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <Empty className="border-destructive">
          <EmptyHeader>
            <EmptyMedia variant="icon"><AlertCircle className="h-6 w-6 text-destructive" /></EmptyMedia>
            <EmptyTitle className="text-destructive">{error || 'Obrigação não encontrada'}</EmptyTitle>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" onClick={() => router.push('/obrigacoes')}>Voltar para Lista</Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" aria-label="Voltar" asChild>
          <Link href={`/obrigacoes/${acordoId}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-page-title">Editar Obrigação</h1>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <AcordoForm
          acordoId={acordoId || undefined}
          initialData={{
            ...acordo,
            createdBy: acordo.createdBy ?? undefined,
          }}
          onSuccess={() => router.push(`/obrigacoes/${acordoId}`)}
          onCancel={() => router.back()}
        />
      </div>
    </div>
  );
}
