import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { useForm } from 'react-hook-form';
import { TemplateFormFields } from '../template-form-fields';
import type { Segmento, TipoTemplate } from '@/shared/assinatura-digital/types';

// Mock dos componentes de editor
jest.mock('../../editor/MarkdownRichTextEditor', () => ({
  MarkdownRichTextEditor: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <div data-testid="markdown-editor">
      <textarea
        data-testid="markdown-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Editor Markdown"
      />
    </div>
  ),
}));

// Interface para o mock do PdfUploadField
interface MockPdfUploadFieldProps {
  value: { url: string; nome: string; tamanho: number } | null;
  onChange: (value: { url: string; nome: string; tamanho: number } | null) => void;
  error?: string;
  required?: boolean;
}

jest.mock('../../editor/pdf-upload-field', () => ({
  PdfUploadField: ({ value, onChange, error, required }: MockPdfUploadFieldProps) => (
    <div data-testid="pdf-upload-field">
      <label htmlFor="pdf-upload-input">
        <input
          id="pdf-upload-input"
          data-testid="pdf-upload-input"
          type="file"
          accept="application/pdf"
          aria-label="Upload de PDF"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              onChange({
                url: URL.createObjectURL(file),
                nome: file.name,
                tamanho: file.size,
              });
            }
          }}
        />
      </label>
      {error && <p data-testid="pdf-error">{error}</p>}
      {required && <span data-testid="pdf-required">*</span>}
      {value && (
        <div data-testid="pdf-preview">
          <p>{value.nome}</p>
          <p>{value.tamanho} bytes</p>
        </div>
      )}
    </div>
  ),
}));

// Componente wrapper para testar com React Hook Form
function TemplateFormFieldsWrapper({
  tipoTemplate,
  onTipoTemplateChange,
  segmentos,
  isSubmitting,
}: {
  tipoTemplate: TipoTemplate;
  onTipoTemplateChange: (tipo: TipoTemplate) => void;
  segmentos: Segmento[];
  isSubmitting: boolean;
}) {
  const form = useForm({
    defaultValues: {
      nome: '',
      descricao: '',
      tipo_template: tipoTemplate,
      conteudo_markdown: '',
      segmento_id: undefined,
      pdf_url: undefined,
      arquivo_original: undefined,
      arquivo_nome: undefined,
      arquivo_tamanho: undefined,
      ativo: true,
    },
  });

  return (
    <TemplateFormFields
      form={form}
      tipoTemplate={tipoTemplate}
      onTipoTemplateChange={onTipoTemplateChange}
      segmentos={segmentos}
      isSubmitting={isSubmitting}
    />
  );
}

describe('TemplateFormFields', () => {
  const mockSegmentos: Segmento[] = [
    { id: 1, nome: 'Segmento 1', slug: 'segmento-1', ativo: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: 2, nome: 'Segmento 2', slug: 'segmento-2', ativo: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  ];

  const defaultProps = {
    tipoTemplate: 'markdown' as TipoTemplate,
    onTipoTemplateChange: jest.fn(),
    segmentos: mockSegmentos,
    isSubmitting: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderização', () => {
    it('deve renderizar todos os campos básicos', () => {
      render(<TemplateFormFieldsWrapper {...defaultProps} />);

      expect(screen.getByLabelText(/nome do template/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/descrição/i)).toBeInTheDocument();
      // Segmento uses Radix Select (no native input), check label text instead
      expect(screen.getByText(/Segmento \(Opcional\)/)).toBeInTheDocument();
    });

    it('deve renderizar seletor de tipo de template', () => {
      render(<TemplateFormFieldsWrapper {...defaultProps} />);

      expect(screen.getByText(/editor texto/i)).toBeInTheDocument();
      expect(screen.getByText(/pdf upload/i)).toBeInTheDocument();
    });

    it('deve renderizar editor markdown quando tipo é markdown', () => {
      render(<TemplateFormFieldsWrapper {...defaultProps} tipoTemplate="markdown" />);

      expect(screen.getByTestId('markdown-editor')).toBeInTheDocument();
      expect(screen.queryByTestId('pdf-upload-field')).not.toBeInTheDocument();
    });

    it('deve renderizar upload de PDF quando tipo é pdf', () => {
      render(<TemplateFormFieldsWrapper {...defaultProps} tipoTemplate="pdf" />);

      expect(screen.getByTestId('pdf-upload-field')).toBeInTheDocument();
      expect(screen.queryByTestId('markdown-editor')).not.toBeInTheDocument();
    });
  });

  describe('Mudança de Tipo de Template', () => {
    it('deve chamar onTipoTemplateChange quando tipo muda', async () => {
      const user = userEvent.setup();
      render(<TemplateFormFieldsWrapper {...defaultProps} />);

      const pdfTab = screen.getByRole('tab', { name: /pdf upload/i });
      await user.click(pdfTab);

      expect(defaultProps.onTipoTemplateChange).toHaveBeenCalledWith('pdf');
    });

    it('deve limpar campos do tipo anterior ao mudar de tipo', () => {
      const { rerender } = render(
        <TemplateFormFieldsWrapper {...defaultProps} tipoTemplate="markdown" />
      );

      const markdownTextarea = screen.getByTestId('markdown-textarea');
      fireEvent.change(markdownTextarea, { target: { value: 'Conteúdo markdown' } });

      rerender(<TemplateFormFieldsWrapper {...defaultProps} tipoTemplate="pdf" />);

      // O campo markdown não deve mais estar visível
      expect(screen.queryByTestId('markdown-textarea')).not.toBeInTheDocument();
    });
  });

  describe('Validação Condicional', () => {
    it('deve marcar conteúdo markdown como obrigatório', () => {
      render(<TemplateFormFieldsWrapper {...defaultProps} tipoTemplate="markdown" />);

      const markdownLabel = screen.getByText(/conteúdo markdown/i);
      expect(markdownLabel).toHaveTextContent(/\*/); // Deve ter asterisco de obrigatório
    });

    it('deve marcar PDF como obrigatório', () => {
      render(<TemplateFormFieldsWrapper {...defaultProps} tipoTemplate="pdf" />);

      expect(screen.getByTestId('pdf-required')).toBeInTheDocument();
    });
  });

  describe('Seleção de Segmento', () => {
    it('deve renderizar lista de segmentos', () => {
      render(<TemplateFormFieldsWrapper {...defaultProps} />);

      // Radix Select uses a button as trigger, find it via role
      const segmentoTrigger = screen.getByRole('combobox');
      fireEvent.click(segmentoTrigger);

      expect(screen.getByText('Segmento 1')).toBeInTheDocument();
      expect(screen.getByText('Segmento 2')).toBeInTheDocument();
    });

    it('deve permitir limpar seleção de segmento', () => {
      render(<TemplateFormFieldsWrapper {...defaultProps} />);

      const segmentoTrigger = screen.getByRole('combobox');
      fireEvent.click(segmentoTrigger);
      fireEvent.click(screen.getByText('Segmento 1'));

      const clearButton = screen.getByText(/limpar seleção/i);
      fireEvent.click(clearButton);

      // After clearing, the "Limpar seleção" button should disappear
      // (the component conditionally renders it when segmentoId is truthy)
      expect(screen.queryByText(/limpar seleção/i)).not.toBeInTheDocument();
    });
  });

  describe('Estado de Submissão', () => {
    it('deve desabilitar campos quando isSubmitting é true', () => {
      render(<TemplateFormFieldsWrapper {...defaultProps} isSubmitting={true} />);

      const nomeInput = screen.getByLabelText(/nome do template/i);
      expect(nomeInput).toBeDisabled();
    });

    it('deve habilitar campos quando isSubmitting é false', () => {
      render(<TemplateFormFieldsWrapper {...defaultProps} isSubmitting={false} />);

      const nomeInput = screen.getByLabelText(/nome do template/i);
      expect(nomeInput).not.toBeDisabled();
    });
  });

  describe('Checkbox Ativo', () => {
    it('deve renderizar checkbox de template ativo', () => {
      render(<TemplateFormFieldsWrapper {...defaultProps} />);

      const ativoCheckbox = screen.getByLabelText(/template ativo/i);
      expect(ativoCheckbox).toBeInTheDocument();
      expect(ativoCheckbox).toBeChecked(); // Default é true
    });

    it('deve permitir alternar checkbox ativo', () => {
      render(<TemplateFormFieldsWrapper {...defaultProps} />);

      const ativoCheckbox = screen.getByLabelText(/template ativo/i);
      fireEvent.click(ativoCheckbox);

      expect(ativoCheckbox).not.toBeChecked();
    });
  });
});

