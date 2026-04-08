import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/server';
import {
  actionListarHistoricoGlobal,
  CallHistoryList,
  TipoChamada,
  StatusChamada
} from '@/app/(authenticated)/chat';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    tipo?: string;
    status?: string;
  }>;
}

async function HistoricoChamadasContent({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect('/app/login');

  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const limit = parseInt(params.limit || '20');

  const result = await actionListarHistoricoGlobal({
    pagina: page,
    limite: limit,
    tipo: params.tipo as TipoChamada,
    status: params.status as StatusChamada,
  });

  if (!result.success) {
    return (
      <div className="p-4 rounded-md bg-destructive/10 text-destructive">
        Erro ao carregar histórico: {result.message}
      </div>
    );
  }

  return (
    <CallHistoryList
      initialData={result.data.data}
      initialPagination={result.data.pagination}
    />
  );
}

export default function HistoricoChamadasPage({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64">Carregando...</div>}>
      <HistoricoChamadasContent searchParams={searchParams} />
    </Suspense>
  );
}
