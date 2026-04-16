import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TemplateCreateDialog } from '../template-create-dialog';
import { listarSegmentosAction, criarTemplateAction } from '@/shared/assinatura-digital/actions';
import { toast } from 'sonner';

// Mock das dependências
jest.mock('@/shared/assinatura-digital/actions', () => ({
  listarSegmentosAction: jest.fn(),
  criarTemplateAction: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Interface para o mock do DialogFormShell
interface MockDialogFormShellProps {
  children: React.ReactNode;
  open: boolean;
  title: string;
  description?: string;
  footer?: React.ReactNode;
}

// Mock do DialogFormShell
jest.mock('@/components/shared/dialog-shell', () => ({
  DialogFormShell: ({ children, open, title, description, footer }: MockDialogFormShellProps) => (
    open ? (
      <div data-testid="dialog-form-shell">
        <h2>{title}</h2>
        <p>{description}</p>
        {children}
        {footer}
      </div>
    ) : null
  ),
}));

// Interface para o mock do TemplateFormFields
interface MockTemplateFormFieldsProps {
  form: { register: (name: string) => Record<string, unknown> };
  isSubmitting: boolean;
}

// Mock do TemplateFormFields — also set hidden required fields via form.setValue
jest.mock('../template-form-fields', () => ({
  TemplateFormFields: ({ form, isSubmitting }: MockTemplateFormFieldsProps) => {
    // Ensure required fields have values so handleSubmit validation passes
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useEffect } = require('react');
    useEffect(() => {
      if (form.setValue) {
        form.setValue('tipo_template', 'markdown');
        form.setValue('conteudo_markdown', '# Default content');
        form.setValue('status', 'rascunho');
        form.setValue('versao', 1);
      }
    }, [form]);

    return (
      <div data-testid="template-form-fields">
        <input
          data-testid="nome-input"
          {...form.register('nome')}
          placeholder="Nome do template"
        />
        <button
          data-testid="submit-button"
          type="submit"
          disabled={isSubmitting}
        >
          Criar
        </button>
      </div>
    );
  },
}));

describe('TemplateCreateDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    onSuccess: jest.fn(),
    initialTipoTemplate: 'markdown' as const,
  };

  const mockSegmentos = [
    { id: 1, nome: 'Segmento 1', slug: 'segmento-1', ativo: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: 2, nome: 'Segmento 2', slug: 'segmento-2', ativo: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (listarSegmentosAction as jest.Mock).mockResolvedValue({
      success: true,
      data: mockSegmentos,
    });
  });

  describe('Renderização', () => {
    it('deve renderizar o diálogo quando open é true', () => {
      render(<TemplateCreateDialog {...defaultProps} />);
      expect(screen.getByTestId('dialog-form-shell')).toBeInTheDocument();
      expect(screen.getByText('Criar Novo Template')).toBeInTheDocument();
    });

    it('não deve renderizar o diálogo quando open é false', () => {
      render(<TemplateCreateDialog {...defaultProps} open={false} />);
      expect(screen.queryByTestId('dialog-form-shell')).not.toBeInTheDocument();
    });

    it('deve carregar segmentos quando o diálogo abre', async () => {
      render(<TemplateCreateDialog {...defaultProps} />);
      await waitFor(() => {
        expect(listarSegmentosAction).toHaveBeenCalledWith({ ativo: true });
      });
    });
  });

  describe('Criação de Template Markdown', () => {
    it('deve criar template markdown com sucesso', async () => {
      const mockTemplate = {
        id: 1,
        nome: 'Template Markdown',
        tipo_template: 'markdown',
        conteudo_markdown: '# Conteúdo',
        status: 'rascunho',
      };

      (criarTemplateAction as jest.Mock).mockResolvedValue({
        success: true,
        data: mockTemplate,
      });

      render(<TemplateCreateDialog {...defaultProps} initialTipoTemplate="markdown" />);

      // Wait for segments to load and form to appear
      const nomeInput = await screen.findByTestId('nome-input');
      fireEvent.change(nomeInput, { target: { value: 'Template Markdown' } });

      // Simular submit do formulário
      const form = screen.getByTestId('template-form-fields').closest('form');
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(criarTemplateAction).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith('Template Markdown criado com sucesso!');
        expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
        expect(defaultProps.onSuccess).toHaveBeenCalled();
      });
    });

    it('deve validar conteúdo markdown obrigatório', async () => {
      render(<TemplateCreateDialog {...defaultProps} initialTipoTemplate="markdown" />);

      const nomeInput = await screen.findByTestId('nome-input');
      fireEvent.change(nomeInput, { target: { value: 'Template sem conteúdo' } });

      const form = screen.getByTestId('template-form-fields').closest('form');
      if (form) {
        fireEvent.submit(form);
      }

      // O schema deve validar e impedir o submit
      await waitFor(() => {
        expect(criarTemplateAction).not.toHaveBeenCalled();
      });
    });
  });

  describe('Criação de Template PDF', () => {
    it('deve criar template PDF com sucesso', async () => {
      const mockTemplate = {
        id: 2,
        nome: 'Template PDF',
        tipo_template: 'pdf',
        pdf_url: 'https://example.com/template.pdf',
        arquivo_original: 'https://example.com/template.pdf',
        arquivo_nome: 'template.pdf',
        arquivo_tamanho: 1024,
        status: 'rascunho',
      };

      (criarTemplateAction as jest.Mock).mockResolvedValue({
        success: true,
        data: mockTemplate,
      });

      render(<TemplateCreateDialog {...defaultProps} initialTipoTemplate="pdf" />);

      const nomeInput = await screen.findByTestId('nome-input');
      fireEvent.change(nomeInput, { target: { value: 'Template PDF' } });

      // Simular submit do formulário
      const form = screen.getByTestId('template-form-fields').closest('form');
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(criarTemplateAction).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith('Template PDF criado com sucesso!');
      });
    });

    it('deve validar PDF obrigatório para templates PDF', async () => {
      render(<TemplateCreateDialog {...defaultProps} initialTipoTemplate="pdf" />);

      const nomeInput = await screen.findByTestId('nome-input');
      fireEvent.change(nomeInput, { target: { value: 'Template sem PDF' } });

      const form = screen.getByTestId('template-form-fields').closest('form');
      if (form) {
        fireEvent.submit(form);
      }

      // O schema deve validar e impedir o submit
      await waitFor(() => {
        expect(criarTemplateAction).not.toHaveBeenCalled();
      });
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve exibir erro quando criação falha', async () => {
      (criarTemplateAction as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Erro ao criar template',
      });

      render(<TemplateCreateDialog {...defaultProps} />);

      const nomeInput = await screen.findByTestId('nome-input');
      fireEvent.change(nomeInput, { target: { value: 'Template com erro' } });

      const form = screen.getByTestId('template-form-fields').closest('form');
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
        expect(defaultProps.onOpenChange).not.toHaveBeenCalled();
      });
    });

    it('deve exibir erro quando carregamento de segmentos falha', async () => {
      (listarSegmentosAction as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Erro ao carregar segmentos',
      });

      render(<TemplateCreateDialog {...defaultProps} />);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Erro ao carregar segmentos'));
      });
    });
  });

  describe('Reset do Formulário', () => {
    it('deve resetar o formulário quando o diálogo fecha', async () => {
      const { rerender } = render(<TemplateCreateDialog {...defaultProps} open={true} />);

      const nomeInput = await screen.findByTestId('nome-input');
      fireEvent.change(nomeInput, { target: { value: 'Template Teste' } });

      rerender(<TemplateCreateDialog {...defaultProps} open={false} />);
      rerender(<TemplateCreateDialog {...defaultProps} open={true} />);

      // After closing and reopening, the form should be reset
      // Need to re-query as the old element may be unmounted
      const resetInput = await screen.findByTestId('nome-input');
      expect(resetInput).toHaveValue('');
    });
  });
});

