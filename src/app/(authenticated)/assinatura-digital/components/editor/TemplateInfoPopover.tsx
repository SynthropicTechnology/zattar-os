'use client';

import { useState } from 'react';
import { FileText, Loader2, Eye, Edit } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { MarkdownRichTextEditorDialog } from './MarkdownRichTextEditorDialog.stub';

import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { StatusTemplate } from '@/shared/assinatura-digital/types/domain';
import type { Template } from '@/shared/assinatura-digital/types/template.types';
import { validateMarkdownForForm } from './editor-helpers';

interface TemplateInfoPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: Template;
  onUpdate: (updates: Partial<Template>) => Promise<void>;
  isCreating?: boolean;
  pdfFile?: File;
}

const STATUS_OPTIONS: Array<{ value: StatusTemplate; label: string; variant: 'default' | 'secondary' | 'destructive' }> = [
  { value: 'ativo', label: 'Ativo', variant: 'default' },
  { value: 'inativo', label: 'Inativo', variant: 'secondary' },
  { value: 'rascunho', label: 'Rascunho', variant: 'destructive' },
];

export default function TemplateInfoPopover({
  open,
  onOpenChange,
  template,
  onUpdate,
  isCreating = false,
  pdfFile,
}: TemplateInfoPopoverProps) {
  const [formData, setFormData] = useState({
    nome: template?.nome || '',
    descricao: template?.descricao || '',
    status: template?.status || 'ativo' as StatusTemplate,
    conteudo_markdown: template?.conteudo_markdown || '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [showMarkdownEditor, setShowMarkdownEditor] = useState(false);

  const handleOpenPreview = () => {
    if (!formData.conteudo_markdown.trim()) {
      toast.error('Adicione conteúdo Markdown para visualizar');
      return;
    }
    setPreviewContent(formData.conteudo_markdown);
    setShowPreview(true);
  };

  const hasChanges = template ? (
    formData.nome !== template.nome ||
    formData.descricao !== (template.descricao || '') ||
    formData.status !== template.status ||
    formData.conteudo_markdown !== (template.conteudo_markdown || '')
  ) : (
    formData.nome.trim() !== ''
  );

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      toast.error('Nome do template é obrigatório');
      return;
    }

    const markdownValidation = validateMarkdownForForm(formData.conteudo_markdown);
    if (!markdownValidation.valid) {
      toast.error(markdownValidation.error);
      return;
    }

    setIsSaving(true);
    try {
      if (isCreating) {
        if (!pdfFile) {
          toast.error('Arquivo PDF é obrigatório');
          return;
        }

        const formDataToSend = new FormData();
        formDataToSend.append('file', pdfFile);

        const uploadResponse = await fetch('/api/assinatura-digital/templates/upload', {
          method: 'POST',
          body: formDataToSend,
          credentials: 'include',
        });

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json().catch(() => null);
          throw new Error(error?.error || 'Erro ao fazer upload do PDF');
        }

        const uploadResult = await uploadResponse.json();
        const { url, nome: arquivoNome, tamanho } = uploadResult.data;

        const response = await fetch('/api/assinatura-digital/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            nome: formData.nome.trim(),
            descricao: formData.descricao.trim() || null,
            arquivo_original: url,
            pdf_url: url,
            arquivo_nome: arquivoNome,
            arquivo_tamanho: tamanho,
            conteudo_markdown: formData.conteudo_markdown.trim() || null,
          }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => null);
          throw new Error(error?.error || 'Erro ao criar template');
        }

        const result = await response.json();
        toast.success('Template criado com sucesso!');

        await onUpdate(result.data);
        onOpenChange(false);
      } else {
        if (!template) {
          toast.error('Template não encontrado');
          return;
        }

        await onUpdate({
          template_uuid: template.template_uuid,
          nome: formData.nome.trim(),
          descricao: formData.descricao.trim() || undefined,
          arquivo_original: template.arquivo_original,
          arquivo_nome: template.arquivo_nome,
          arquivo_tamanho: template.arquivo_tamanho,
          status: formData.status,
          versao: template.versao,
          ativo: template.ativo,
          campos: template.campos,
          conteudo_markdown: formData.conteudo_markdown.trim() || null,
          criado_por: template.criado_por,
        });

        toast.success('Informações do template atualizadas com sucesso!');
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      toast.error(
        error instanceof Error ? error.message : 'Erro ao salvar template'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (template) {
      setFormData({
        nome: template.nome,
        descricao: template.descricao || '',
        status: template.status,
        conteudo_markdown: template.conteudo_markdown || '',
      });
    }
    onOpenChange(false);
  };

  const handleSaveMarkdownDirectly = async (markdown: string) => {
    if (isCreating) {
      setFormData(prev => ({ ...prev, conteudo_markdown: markdown }));
      toast.success('Conteúdo Markdown atualizado');
      return;
    }

    if (!template) {
      toast.error('Template não encontrado');
      return;
    }

    await onUpdate({
      template_uuid: template.template_uuid,
      nome: formData.nome,
      descricao: formData.descricao || undefined,
      arquivo_original: template.arquivo_original,
      arquivo_nome: template.arquivo_nome,
      arquivo_tamanho: template.arquivo_tamanho,
      status: formData.status,
      versao: template.versao,
      ativo: template.ativo,
      campos: template.campos,
      conteudo_markdown: markdown.trim(),
      criado_por: template.criado_por,
    });

    setFormData(prev => ({ ...prev, conteudo_markdown: markdown }));
    toast.success('Conteúdo Markdown salvo com sucesso!');
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-96 overflow-y-auto p-5">
          <SheetHeader className="p-0 pb-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <SheetTitle className="text-base font-semibold">
                  {isCreating ? 'Novo Template' : 'Informações do Template'}
                </SheetTitle>
              </div>
              {!isCreating && (
                <Badge
                  variant={STATUS_OPTIONS.find(s => s.value === formData.status)?.variant || 'default'}
                  className="text-xs"
                >
                  {STATUS_OPTIONS.find(s => s.value === formData.status)?.label}
                </Badge>
              )}
            </div>
            <SheetDescription className="text-xs">
              Editar nome, descrição e status do template
            </SheetDescription>
          </SheetHeader>

          <Separator className="my-3" />

          <div className="space-y-4">
            {/* Nome */}
            <div className="space-y-1.5">
              <Label htmlFor="template-nome" className="text-xs text-muted-foreground">
                Nome do Template *
              </Label>
              <Input
                id="template-nome"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                className="h-8 text-xs"
                placeholder="Ex: Contrato Apps - Uber 2024"
              />
            </div>

            {/* Descricao */}
            <div className="space-y-1.5">
              <Label htmlFor="template-descricao" className="text-xs text-muted-foreground">
                Descrição
              </Label>
              <Textarea
                id="template-descricao"
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                className="text-xs resize-none"
                rows={3}
                placeholder="Informações adicionais sobre o uso deste template (opcional)"
              />
            </div>

            <Separator />

            {/* Conteudo Markdown */}
            <div className="space-y-1.5">
              <Label htmlFor="template-markdown" className="text-xs text-muted-foreground">
                Conteúdo Markdown (Opcional)
              </Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMarkdownEditor(true)}
                  className="flex-1 gap-2 text-xs"
                >
                  <Edit className="h-3.5 w-3.5" />
                  {formData.conteudo_markdown.trim() === '' ? 'Adicionar Conteúdo' : 'Editar Conteúdo'}
                </Button>
                {formData.conteudo_markdown.trim() !== '' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenPreview}
                    className="flex-1 gap-2 text-xs"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Pré-visualizar
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* Status */}
            <div className="space-y-1.5">
              <Label htmlFor="template-status" className="text-xs text-muted-foreground">
                Status *
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value: StatusTemplate) =>
                  setFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger id="template-status" className="h-8 text-xs">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-xs">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Acoes */}
            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="flex-1 gap-2 text-xs"
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {isCreating ? 'Criando...' : 'Salvando...'}
                  </>
                ) : (
                  isCreating ? 'Criar Template' : 'Salvar Alterações'
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <MarkdownRichTextEditorDialog
        open={showMarkdownEditor}
        onOpenChange={setShowMarkdownEditor}
        value={formData.conteudo_markdown}
        onChange={(markdown) => setFormData(prev => ({ ...prev, conteudo_markdown: markdown }))}
        formularios={[]}
        title="Editar Conteúdo Markdown do Template"
        onSaveToBackend={handleSaveMarkdownDirectly}
      />

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Preview do Markdown</DialogTitle>
            <DialogDescription className="text-xs">
              Visualização do conteúdo formatado (variáveis não são substituídas neste preview)
            </DialogDescription>
          </DialogHeader>

          <Separator />

          <div className="prose prose-sm prose-slate dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeSanitize]}
            >
              {previewContent}
            </ReactMarkdown>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
