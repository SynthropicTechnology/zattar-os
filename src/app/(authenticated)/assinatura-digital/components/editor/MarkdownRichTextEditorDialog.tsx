import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { MarkdownRichTextEditor } from './MarkdownRichTextEditor';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface MarkdownRichTextEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onChange: (markdown: string) => void;
  formularios: string[];
  title?: string;
  onSaveToBackend?: (markdown: string) => Promise<void>;
}

export function MarkdownRichTextEditorDialog({
  open,
  onOpenChange,
  value,
  onChange,
  formularios,
  title = 'Editar Conteúdo Markdown',
  onSaveToBackend,
}: MarkdownRichTextEditorDialogProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setLocalValue(value);
    }
  }, [open, value]);

  const handleSave = async () => {
    if (onSaveToBackend) {
      setIsSaving(true);
      try {
        await onSaveToBackend(localValue);
        onOpenChange(false);
      } catch (error) {
        console.error('Error saving to backend:', error);
      } finally {
        setIsSaving(false);
      }
    } else {
      onChange(localValue);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setLocalValue(value);
    onOpenChange(false);
  };

  const characterCount = localValue.length;
  const maxCharacters = 100000;
  const isOverLimit = characterCount > maxCharacters;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="editor" className="flex flex-col h-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <div className="flex-1 overflow-hidden">
            <TabsContent value="editor" className="h-full mt-4">
              <MarkdownRichTextEditor
                value={localValue}
                onChange={setLocalValue}
                formularios={formularios}
              />
            </TabsContent>
            <TabsContent value="preview" className="h-full mt-4 overflow-y-auto">
              <div className="prose prose-sm max-w-none p-4 border rounded-md bg-muted/50">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw, rehypeSanitize]}
                >
                  {localValue}
                </ReactMarkdown>
              </div>
            </TabsContent>
          </div>
        </Tabs>
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            {characterCount.toLocaleString()} / {maxCharacters.toLocaleString()} caracteres
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isOverLimit || isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {onSaveToBackend ? 'Salvar' : 'OK'}
            </Button>
          </div>
        </div>
        {isOverLimit && (
          <Alert variant="destructive">
            <AlertDescription>
              O conteúdo excede o limite de {maxCharacters.toLocaleString()} caracteres. Reduza o texto para salvar.
            </AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
}