import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PdfUploadField, type PdfUploadValue } from '../pdf-upload-field';
import { toast } from 'sonner';

// Mock do toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock do formatFileSize — path relative to this test resolves to feature/utils
jest.mock('../../../utils', () => ({
  formatFileSize: (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  },
}));

// Mock do fetch para upload
global.fetch = jest.fn();

describe('PdfUploadField', () => {
  const defaultProps = {
    value: null,
    onChange: jest.fn(),
    disabled: false,
    label: 'Upload de PDF',
    required: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Renderização', () => {
    it('deve renderizar campo de upload quando não há arquivo', () => {
      render(<PdfUploadField {...defaultProps} />);

      expect(screen.getByText('Upload de PDF')).toBeInTheDocument();
      expect(screen.getByText(/clique para selecionar um pdf/i)).toBeInTheDocument();
      expect(screen.getByText(/máximo 10mb/i)).toBeInTheDocument();
    });

    it('deve renderizar preview quando há arquivo', () => {
      const fileValue: PdfUploadValue = {
        url: 'https://example.com/test.pdf',
        nome: 'test.pdf',
        tamanho: 1024,
      };

      render(<PdfUploadField {...defaultProps} value={fileValue} />);

      expect(screen.getByText('test.pdf')).toBeInTheDocument();
      expect(screen.getByText(/1.00 KB/i)).toBeInTheDocument();
      expect(screen.getByTestId('remove-button')).toBeInTheDocument();
    });

    it('deve mostrar asterisco quando required é true', () => {
      render(<PdfUploadField {...defaultProps} required={true} />);

      const label = screen.getByText('Upload de PDF');
      expect(label).toHaveTextContent(/\*/);
    });
  });

  describe('Upload de Arquivo', () => {
    it('deve fazer upload de PDF válido com sucesso', async () => {
      const mockFile = new File(['conteúdo'], 'test.pdf', { type: 'application/pdf' });
      const mockResponse = {
        success: true,
        data: {
          url: 'https://example.com/uploaded/test.pdf',
          nome: 'test.pdf',
          tamanho: 1024,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<PdfUploadField {...defaultProps} />);

      const fileInput = document.getElementById('pdf-upload-field')! as HTMLInputElement;
      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/assinatura-digital/templates/upload',
          expect.objectContaining({
            method: 'POST',
          })
        );
        expect(defaultProps.onChange).toHaveBeenCalledWith({
          url: mockResponse.data.url,
          nome: mockResponse.data.nome,
          tamanho: mockResponse.data.tamanho,
        });
        expect(toast.success).toHaveBeenCalledWith('PDF enviado com sucesso!');
      });
    });

    it('deve rejeitar arquivo que não é PDF', async () => {
      const mockFile = new File(['conteúdo'], 'test.txt', { type: 'text/plain' });

      render(<PdfUploadField {...defaultProps} />);

      const fileInput = document.getElementById('pdf-upload-field')! as HTMLInputElement;
      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText('Apenas arquivos PDF são permitidos')).toBeInTheDocument();
        expect(defaultProps.onChange).not.toHaveBeenCalled();
        expect(global.fetch).not.toHaveBeenCalled();
      });
    });

    it('deve rejeitar arquivo maior que 10MB', async () => {
      const mockFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', {
        type: 'application/pdf',
      });

      render(<PdfUploadField {...defaultProps} />);

      const fileInput = document.getElementById('pdf-upload-field')! as HTMLInputElement;
      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText(/arquivo muito grande/i)).toBeInTheDocument();
        expect(defaultProps.onChange).not.toHaveBeenCalled();
        expect(global.fetch).not.toHaveBeenCalled();
      });
    });

    it('deve exibir erro quando upload falha', async () => {
      const mockFile = new File(['conteúdo'], 'test.pdf', { type: 'application/pdf' });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: 'Erro ao fazer upload',
        }),
      });

      render(<PdfUploadField {...defaultProps} />);

      const fileInput = document.getElementById('pdf-upload-field')! as HTMLInputElement;
      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText('Erro ao fazer upload')).toBeInTheDocument();
        expect(toast.error).toHaveBeenCalledWith('Erro ao fazer upload');
        expect(defaultProps.onChange).not.toHaveBeenCalled();
      });
    });

    it('deve exibir estado de loading durante upload', async () => {
      const mockFile = new File(['conteúdo'], 'test.pdf', { type: 'application/pdf' });

      (global.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: async () => ({
                  success: true,
                  data: {
                    url: 'https://example.com/test.pdf',
                    nome: 'test.pdf',
                    tamanho: 1024,
                  },
                }),
              });
            }, 100);
          })
      );

      render(<PdfUploadField {...defaultProps} />);

      const fileInput = document.getElementById('pdf-upload-field')! as HTMLInputElement;
      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fireEvent.change(fileInput);

      // Deve mostrar loading
      expect(screen.getByText(/enviando arquivo/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText(/enviando arquivo/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Remoção de Arquivo', () => {
    it('deve remover arquivo quando botão de remover é clicado', () => {
      const fileValue: PdfUploadValue = {
        url: 'https://example.com/test.pdf',
        nome: 'test.pdf',
        tamanho: 1024,
      };

      render(<PdfUploadField {...defaultProps} value={fileValue} />);

      const removeButton = screen.getByTestId('remove-button');
      fireEvent.click(removeButton);

      expect(defaultProps.onChange).toHaveBeenCalledWith(null);
    });

    it('deve limpar input file ao remover', () => {
      const fileValue: PdfUploadValue = {
        url: 'https://example.com/test.pdf',
        nome: 'test.pdf',
        tamanho: 1024,
      };

      render(<PdfUploadField {...defaultProps} value={fileValue} />);

      const fileInput = document.getElementById('pdf-upload-field')! as HTMLInputElement;
      fileInput.value = 'test.pdf';

      const removeButton = screen.getByTestId('remove-button');
      fireEvent.click(removeButton);

      expect(fileInput.value).toBe('');
    });
  });

  describe('Estado Desabilitado', () => {
    it('deve desabilitar input quando disabled é true', () => {
      render(<PdfUploadField {...defaultProps} disabled={true} />);

      const fileInput = document.getElementById('pdf-upload-field')!;
      expect(fileInput).toBeDisabled();
    });

    it('deve desabilitar botão de remover quando disabled é true', () => {
      const fileValue: PdfUploadValue = {
        url: 'https://example.com/test.pdf',
        nome: 'test.pdf',
        tamanho: 1024,
      };

      render(<PdfUploadField {...defaultProps} value={fileValue} disabled={true} />);

      const removeButton = screen.getByTestId('remove-button');
      expect(removeButton).toBeDisabled();
    });
  });

  describe('Exibição de Erro', () => {
    it('deve exibir erro externo quando fornecido', () => {
      render(<PdfUploadField {...defaultProps} error="Erro externo" />);

      expect(screen.getByText('Erro externo')).toBeInTheDocument();
    });

    it('deve priorizar erro externo sobre erro de upload', async () => {
      const mockFile = new File(['conteúdo'], 'test.txt', { type: 'text/plain' });

      render(<PdfUploadField {...defaultProps} error="Erro externo" />);

      const fileInput = document.getElementById('pdf-upload-field')! as HTMLInputElement;
      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fireEvent.change(fileInput);

      // Deve mostrar erro externo, não o erro de tipo
      expect(screen.getByText('Erro externo')).toBeInTheDocument();
    });
  });

  describe('Validação de Tamanho', () => {
    it('deve aceitar arquivo exatamente no limite de 10MB', async () => {
      const mockFile = new File(['x'.repeat(10 * 1024 * 1024)], 'exact-limit.pdf', {
        type: 'application/pdf',
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            url: 'https://example.com/exact-limit.pdf',
            nome: 'exact-limit.pdf',
            tamanho: 10 * 1024 * 1024,
          },
        }),
      });

      render(<PdfUploadField {...defaultProps} />);

      const fileInput = document.getElementById('pdf-upload-field')! as HTMLInputElement;
      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
        expect(defaultProps.onChange).toHaveBeenCalled();
      });
    });
  });
});

