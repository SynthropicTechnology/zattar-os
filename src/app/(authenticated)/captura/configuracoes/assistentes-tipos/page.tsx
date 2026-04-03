import { createDbClient } from '@/lib/supabase';
import { AssistentesTiposConfig } from '@/app/(authenticated)/assistentes';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

async function getAssistentes() {
  const db = createDbClient();
  const { data, error } = await db
    .from('assistentes')
    .select('id, nome, tipo')
    .order('nome');

  if (error) {
    console.error('Erro ao buscar assistentes:', error);
    return [];
  }

  return (data || []).map((item) => ({
    id: String(item.id),
    nome: item.nome,
    tipo: item.tipo,
  }));
}

async function getTiposExpedientes() {
  const db = createDbClient();
  const { data, error } = await db
    .from('tipos_expedientes')
    .select('id, tipo_expediente')
    .order('tipo_expediente');

  if (error) {
    console.error('Erro ao buscar tipos de expedientes:', error);
    return [];
  }

  return (data || []).map((item) => ({
    id: String(item.id),
    nome: item.tipo_expediente,
  }));
}

export default async function ConfiguracoesAssistentesTiposPage() {
  const [assistentes, tiposExpedientes] = await Promise.all([
    getAssistentes(),
    getTiposExpedientes(),
  ]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Geração Automática de Peças</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/app/configuracoes?tab=integracoes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Configurações
          </Link>
        </Button>
      </div>

      <AssistentesTiposConfig
        assistentes={assistentes}
        tiposExpedientes={tiposExpedientes}
      />
    </div>
  );
}
