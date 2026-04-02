'use client';

/**
 * Dialog para criar novo documento
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogBody,
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { actionCriarDocumento } from '../actions/documentos-actions';

interface CreateDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pastaId?: number | null;
  onSuccess?: () => void;
}

export function CreateDocumentDialog({
  open,
  onOpenChange,
  pastaId,
  onSuccess,
}: CreateDocumentDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [titulo, setTitulo] = React.useState('');
  const [descricao, setDescricao] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titulo.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('titulo', titulo.trim());
      if (descricao.trim()) formData.append('descricao', descricao.trim());
      if (pastaId) formData.append('pasta_id', pastaId.toString());
      formData.append('conteudo', JSON.stringify([]));

      const result = await actionCriarDocumento(formData);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Erro ao criar documento');
      }

      toast.success('Documento criado', { description: 'Abrindo editor...' });

      // Resetar form
      setTitulo('');
      setDescricao('');
      onOpenChange(false);

      // Redirecionar para editor
      router.push(`/documentos/${result.data.id}`);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao criar documento:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar documento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Criar novo documento</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Crie um novo documento jurídico. Você será redirecionado para o editor.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <ResponsiveDialogBody>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  placeholder="Ex: Petição Inicial - Processo 1234"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição (opcional)</Label>
                <Textarea
                  id="descricao"
                  placeholder="Breve descrição do documento..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  disabled={loading}
                  rows={3}
                />
              </div>
            </div>
          </ResponsiveDialogBody>

          <ResponsiveDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar e Editar
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
