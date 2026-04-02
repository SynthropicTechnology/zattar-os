'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileText, Loader2 } from 'lucide-react';
import { actionCriarDocumento } from '@/app/app/documentos/actions/documentos-actions';
import { markdownToPlate } from '../utils/markdown-to-plate';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface SaveAsDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
  defaultTitle?: string;
}

export function SaveAsDocumentDialog({
  open,
  onOpenChange,
  content,
  defaultTitle = '',
}: SaveAsDocumentDialogProps) {
  const [titulo, setTitulo] = useState(defaultTitle);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setTitulo(defaultTitle);
    }
  }, [open, defaultTitle]);

  const handleSave = async () => {
    if (!titulo.trim()) return;

    setIsSaving(true);
    try {
      const plateContent = markdownToPlate(content);
      const formData = new FormData();
      formData.append('titulo', titulo.trim());
      formData.append('conteudo', JSON.stringify(plateContent));

      const result = await actionCriarDocumento(formData);

      if (result.success && result.data) {
        toast.success('Documento salvo com sucesso');
        onOpenChange(false);
        router.push(`/app/documentos/${result.data.id}`);
      } else {
        toast.error(result.error || 'Erro ao salvar documento');
      }
    } catch {
      toast.error('Erro ao salvar documento');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Salvar como Documento
          </DialogTitle>
          <DialogDescription>
            O conteúdo será salvo no módulo de Documentos e poderá ser editado.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="doc-title">Nome do documento</Label>
            <Input
              id="doc-title"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Impugnação à Contestação"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && titulo.trim()) {
                  handleSave();
                }
              }}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!titulo.trim() || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
