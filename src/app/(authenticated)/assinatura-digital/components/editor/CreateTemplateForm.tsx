'use client';

import React, { useState } from 'react';
import { FileText, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { MarkdownRichTextEditorDialog } from './MarkdownRichTextEditorDialog.stub';
import { MarkdownRichTextEditor } from './MarkdownRichTextEditor';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Heading } from '@/components/ui/typography';


interface CreateTemplateFormProps {
  pdfFile?: File; // Make pdfFile optional
  onSubmit: (data: {
    nome: string;
    descricao: string;
    conteudo_markdown?: string;
  }) => Promise<void>;
  onCancel?: () => void;
  tipoTemplate: 'pdf' | 'markdown'; // Add new required prop
}

export default function CreateTemplateForm({
  pdfFile,
  onSubmit,
  onCancel,
  tipoTemplate,
}: CreateTemplateFormProps) {
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    conteudo_markdown: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showMarkdownEditor, setShowMarkdownEditor] = useState(false);

  // Determine if the form can be submitted based on template type
  const canSubmit = React.useMemo(() => {
    if (formData.nome.trim() === '') return false;

    if (tipoTemplate === 'pdf') {
      return !!pdfFile;
    } else if (tipoTemplate === 'markdown') {
      return formData.conteudo_markdown.trim() !== '';
    }
    return false;
  }, [formData, tipoTemplate, pdfFile]);

  const handleSubmit = async () => {
    if (!canSubmit) {
      if (formData.nome.trim() === '') {
        toast.error('Nome do template é obrigatório');
      } else if (tipoTemplate === 'pdf' && !pdfFile) {
        toast.error('Arquivo PDF é obrigatório para templates PDF');
      } else if (tipoTemplate === 'markdown' && formData.conteudo_markdown.trim() === '') {
        toast.error('Conteúdo Markdown é obrigatório para templates Markdown');
      }
      return;
    }

    setIsSaving(true);
    try {
      const dataToSubmit: {
        nome: string;
        descricao: string;
        conteudo_markdown?: string;
      } = {
        nome: formData.nome,
        descricao: formData.descricao,
      };

      if (tipoTemplate === 'markdown' && formData.conteudo_markdown.trim()) {
        dataToSubmit.conteudo_markdown = formData.conteudo_markdown.trim();
      }

      await onSubmit(dataToSubmit);
    } catch (error) {
      console.error('Erro ao criar template:', error);
      // Erro já foi tratado no onSubmit
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="border rounded-lg p-6 bg-card shadow-sm">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2 pb-3 border-b">
          <FileText className="h-4 w-4" />
          <Heading level="card" className="text-sm">Informações do Novo Template</Heading>
        </div>

        {/* Nome */}
        <div className="space-y-2">
          <Label htmlFor="template-nome-create" className="text-xs font-medium">
            Nome do Template *
          </Label>
          <Input
            id="template-nome-create"
            placeholder="Ex: Contrato Apps - Uber 2024"
            className="h-9 text-sm"
            value={formData.nome}
            onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
            autoFocus
          />
        </div>

        {/* Descrição */}
        <div className="space-y-2">
          <Label htmlFor="template-desc-create" className="text-xs font-medium">
            Descrição
          </Label>
          <Textarea
            id="template-desc-create"
            placeholder="Informações adicionais sobre o uso deste template (opcional)"
            className="text-sm resize-none"
            rows={2}
            value={formData.descricao}
            onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))}
          />
        </div>

        {/* Conteúdo Markdown (condicional para tipoTemplate === 'markdown') */}
        {tipoTemplate === 'markdown' && (
          <div className="space-y-2">
            <Label htmlFor="template-markdown-create" className="text-xs font-medium">
              Conteúdo Markdown *
            </Label>
            <MarkdownRichTextEditor
                value={formData.conteudo_markdown}
                onChange={(value) => setFormData((prev) => ({ ...prev, conteudo_markdown: value }))}
                formularios={[]}
              />
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <p className="font-medium mb-2">Variáveis disponíveis (use entre chaves duplas):</p>
                <div className="space-y-2">
                  <div>
                    <p className="font-semibold text-[11px] mb-1">📋 Dados do Cliente (Etapa 2):</p>
                    <ul className="list-disc list-inside space-y-0.5 ml-2 text-[11px]">
                      <li><code>{'{{cliente.nome_completo}}'}</code>, <code>{'{{cliente.cpf}}'}</code>, <code>{'{{cliente.email}}'}</code>, <code>{'{{cliente.telefone}}'}</code></li>
                      <li><code>{'{{cliente.data_nascimento}}'}</code>, <code>{'{{cliente.genero}}'}</code>, <code>{'{{cliente.estado_civil}}'}</code>, <code>{'{{cliente.nacionalidade}}'}</code></li>
                      <li><code>{'{{cliente.endereco_completo}}'}</code> ou componentes individuais: <code>{'{{cliente.endereco_rua}}'}</code>, <code>{'{{cliente.endereco_numero}}'}</code>, <code>{'{{cliente.endereco_complemento}}'}</code>, <code>{'{{cliente.endereco_bairro}}'}</code>, <code>{'{{cliente.endereco_cidade}}'}</code>, <code>{'{{cliente.endereco_uf}}'}</code>, <code>{'{{cliente.endereco_cep}}'}</code></li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-[11px] mb-1">📝 Campos do Formulário Dinâmico (Etapa 3):</p>
                    <p className="text-[11px] ml-2 mb-1">
                      <strong>TODOS os campos do formulário associado</strong> estão disponíveis usando o ID do campo:
                    </p>
                    <ul className="list-disc list-inside space-y-0.5 ml-2 text-[11px]">
                      <li><strong>Exemplo (Apps):</strong> <code>{'{{aplicativo}}'}</code>, <code>{'{{modalidade}}'}</code>, <code>{'{{situacao}}'}</code>, <code>{'{{dataInicio}}'}</code>, <code>{'{{dataBloqueio}}'}</code>, <code>{'{{acidenteTrabalho}}'}</code>, <code>{'{{observacoes}}'}</code></li>
                      <li><strong>Exemplo (Trabalhista):</strong> <code>{'{{nomeEmpresaPessoa}}'}</code>, <code>{'{{cpfCnpjEmpresaPessoa}}'}</code>, <code>{'{{cepEmpresaPessoa}}'}</code>, <code>{'{{logradouroEmpresaPessoa}}'}</code>, <code>{'{{dataInicio}}'}</code>, <code>{'{{dataRescisao}}'}</code></li>
                      <li className="text-muted-foreground"><em>Os campos disponíveis dependem do schema do formulário configurado no Admin</em></li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-[11px] mb-1">🖊️ Assinatura Digital (Etapa 4):</p>
                    <ul className="list-disc list-inside space-y-0.5 ml-2 text-[11px]">
                      <li><code>{'{{assinatura.assinatura_base64}}'}</code> - Imagem da assinatura (base64)</li>
                      <li><code>{'{{assinatura.foto_base64}}'}</code> - Foto/selfie do cliente (se habilitada)</li>
                      <li><code>{'{{assinatura.latitude}}'}</code>, <code>{'{{assinatura.longitude}}'}</code> - Coordenadas GPS (se geolocalização habilitada)</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-[11px] mb-1">⚙️ Metadados do Sistema:</p>
                    <ul className="list-disc list-inside space-y-0.5 ml-2 text-[11px]">
                      <li><code>{'{{sistema.data_geracao}}'}</code> - Data em formato extenso (ex: &quot;16 de outubro de 2025&quot;)</li>
                      <li><code>{'{{sistema.timestamp}}'}</code> - Carimbo de data/hora (ex: &quot;16/10/2025 às 14:30:45&quot;)</li>
                      <li><code>{'{{sistema.protocolo}}'}</code> - Número de protocolo único</li>
                      <li><code>{'{{sistema.numero_contrato}}'}</code> - Número do contrato (se aplicável)</li>
                      <li><code>{'{{sistema.ip_cliente}}'}</code> - Endereço IP do cliente</li>
                      <li><code>{'{{sistema.user_agent}}'}</code> - Navegador/dispositivo do cliente</li>
                    </ul>
                  </div>
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground border-t pt-2">
                  <strong>📌 Dica:</strong> Use o formato <code>{'{{categoria.campo}}'}</code> para campos estáticos (cliente, sistema, assinatura)
                  e <code>{'{{campoId}}'}</code> para campos do formulário dinâmico.
                </p>
                <p className="mt-2 text-[11px]">Suporta Markdown padrão: <strong>**negrito**</strong>, <em>*itálico*</em>, listas, <code>[links](url)</code>, citações, etc.</p>
              </AlertDescription>
            </Alert>
            <p className={`text-xs text-right ${formData.conteudo_markdown.length > 100000 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {formData.conteudo_markdown.length.toLocaleString('pt-BR')} / 100.000 caracteres
            </p>
          </div>
        )}

        {/* Info do arquivo (condicional para tipoTemplate === 'pdf') */}
        {tipoTemplate === 'pdf' && pdfFile && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              <strong>Arquivo:</strong> {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-2 pt-2">
          {onCancel && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancelar
            </Button>
          )}
          <Button
            size="sm"
            className="flex-1 gap-2"
            onClick={handleSubmit}
            disabled={!canSubmit || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              'Criar Template'
            )}
          </Button>
        </div>
      </div>
      {/* MarkdownRichTextEditorDialog só será necessário para o fluxo PDF para adicionar um markdown opcional,
          no fluxo markdown, o editor é inline. */}
      {tipoTemplate === 'pdf' && (
        <MarkdownRichTextEditorDialog
          open={showMarkdownEditor}
          onOpenChange={setShowMarkdownEditor}
          value={formData.conteudo_markdown}
          onChange={(markdown) => setFormData((prev) => ({ ...prev, conteudo_markdown: markdown }))}
          formularios={[]}
          title="Adicionar Conteúdo Markdown ao Template"
        />
      )}
    </div>
  );
}