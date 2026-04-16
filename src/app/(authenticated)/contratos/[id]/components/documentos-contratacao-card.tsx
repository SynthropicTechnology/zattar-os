'use client';

import * as React from 'react';
import { FileDown, Send } from 'lucide-react';
import { toast } from 'sonner';
import { WidgetContainer } from '@/components/shared/glass-panel';
import { Button } from '@/components/ui/button';
import { actionValidarGeracaoPdfs } from '@/app/(authenticated)/contratos/actions/gerar-pdfs-contrato-action';
import type { CampoFaltante } from '@/app/(authenticated)/contratos/services/mapeamento-contrato-input-data';
import { ModalCamposFaltantesDialog } from './modal-campos-faltantes-dialog';

interface DocumentosContratacaoCardProps {
  contratoId: number;
  segmentoId: number | null;
}

const SEGMENTO_TRABALHISTA = 1;

async function baixarZip(
  contratoId: number,
  overrides: Record<string, string> = {},
) {
  const response = await fetch(`/api/contratos/${contratoId}/pdfs-contratacao`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ overrides }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: 'Falha no download' }));
    throw new Error(body.error ?? 'Falha no download');
  }

  const blob = await response.blob();
  const cd = response.headers.get('Content-Disposition') ?? '';
  const match = cd.match(/filename="(.+)"/);
  const filename = match?.[1] ?? `contratacao-${contratoId}.zip`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function DocumentosContratacaoCard({
  contratoId,
  segmentoId,
}: DocumentosContratacaoCardProps) {
  const [loading, setLoading] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [camposFaltantes, setCamposFaltantes] = React.useState<CampoFaltante[]>([]);

  if (segmentoId !== SEGMENTO_TRABALHISTA) return null;

  const handleBaixar = async () => {
    setLoading(true);
    try {
      const validation = await actionValidarGeracaoPdfs({ contratoId });
      if (!validation.success) {
        toast.error(validation.message);
        return;
      }
      const result = validation.data;
      if (result.status === 'erro') {
        toast.error(result.mensagem);
        return;
      }
      if (result.status === 'campos_faltantes') {
        setCamposFaltantes(result.camposFaltantes);
        setModalOpen(true);
        return;
      }
      await baixarZip(contratoId);
      toast.success('PDFs gerados com sucesso');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao gerar PDFs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitOverrides = async (overrides: Record<string, string>) => {
    setLoading(true);
    try {
      await baixarZip(contratoId, overrides);
      toast.success('PDFs gerados com sucesso');
      setModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao gerar PDFs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <WidgetContainer
        title="Documentos de Contratação"
        icon={FileDown}
        action={
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleBaixar} disabled={loading}>
              <FileDown className="size-4 mr-1" />
              {loading ? 'Gerando…' : 'Baixar PDFs preenchidos'}
            </Button>
            <Button size="sm" variant="outline" disabled>
              <Send className="size-4 mr-1" />
              Enviar pra cliente assinar
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">
          Gera os 4 documentos de contratação trabalhista preenchidos com os
          dados deste contrato. Se faltar alguma informação, você poderá
          completá-la antes do download.
        </p>
      </WidgetContainer>

      <ModalCamposFaltantesDialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        camposFaltantes={camposFaltantes}
        onSubmit={handleSubmitOverrides}
        isSubmitting={loading}
      />
    </>
  );
}
