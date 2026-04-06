'use client';

import { useRouter } from 'next/navigation';
import { AcordoForm } from '@/app/(authenticated)/obrigacoes';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NovaObrigacaoClient() {
  const router = useRouter();

  const handleSuccess = (data?: { id: number; acordo?: unknown; parcelas?: unknown[] }) => {
    const id = (data?.acordo as { id?: number } | undefined)?.id ?? data?.id;
    if (id) {
      router.push(`/obrigacoes/${id}`);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" aria-label="Voltar" asChild>
          <Link href="/obrigacoes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-page-title">Nova Obrigação</h1>
        </div>
      </div>

      {/* Formulario */}
      <div className="rounded-lg border bg-card p-6">
        <AcordoForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
