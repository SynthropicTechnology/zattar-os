/**
 * Timeline Empty State
 *
 * Exibido quando timeline foi capturada mas não contém nenhum item.
 */

'use client';

import { FileSearch, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function TimelineEmpty() {
  const router = useRouter();

  return (
    <Card className="p-12">
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        <div className="rounded-full bg-muted p-6">
          <FileSearch className="h-12 w-12 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold">
            Nenhuma movimentação ou documento encontrado
          </h3>
          <p className="text-muted-foreground max-w-md">
            Este processo não possui timeline no PJE ou os dados ainda não foram
            disponibilizados.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => router.push('/processos')}
          className="gap-2 mt-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Listagem
        </Button>
      </div>
    </Card>
  );
}
