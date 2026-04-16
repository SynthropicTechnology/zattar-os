'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface MarkdownRichTextEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onChange: (value: string) => void;
  formularios?: string[];
  title?: string;
  onSaveToBackend?: (markdown: string) => Promise<void>;
}

export function MarkdownRichTextEditorDialog({
  open,
  onOpenChange,
  title = 'Editar Conteúdo Markdown',
}: MarkdownRichTextEditorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Editor visual de Markdown em desenvolvimento.
            Por enquanto, use o campo de texto simples na aba de informações do template.
          </AlertDescription>
        </Alert>
      </DialogContent>
    </Dialog>
  );
}