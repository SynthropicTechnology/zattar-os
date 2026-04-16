import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocumentUploadDropzone } from '../document-upload-dropzone';
import { useDocumentUpload } from '@/app/(authenticated)/assinatura-digital/components/upload/hooks/use-document-upload';
import { toast } from 'sonner';

// Mocks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  })),
  usePathname: jest.fn(() => '/app/assinatura-digital'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));
jest.mock('../hooks/use-document-upload');
jest.mock('@/shared/assinatura-digital/actions', () => ({
  actionCreateDocumento: jest.fn(),
}));
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    loading: jest.fn(),
  },
}));

const mockOnUploadSuccess = jest.fn();

// Hook Mock Implementation Helpers
const mockUploadFile = jest.fn();
const mockResetUpload = jest.fn();
const mockSelectFile = jest.fn();
const mockRemoveFile = jest.fn();

describe('DocumentUploadDropzone', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();

    // Default hook mock
    (useDocumentUpload as unknown as jest.Mock).mockReturnValue({
      isUploading: false,
      progress: 0,
      uploadedFile: null,
      selectedFile: null,
      error: null,
      uploadFile: mockUploadFile,
      resetUpload: mockResetUpload,
      selectFile: mockSelectFile,
      removeFile: mockRemoveFile,
    });
  });

  it('deve renderizar a dropzone', () => {
    render(<DocumentUploadDropzone onUploadSuccess={mockOnUploadSuccess} />);

    // The dropzone area should be present with a file input
    const input = document.querySelector('input[type="file"]');
    expect(input).toBeTruthy();
  });

  it('deve ter input com accept restrito a PDF', () => {
    render(<DocumentUploadDropzone onUploadSuccess={mockOnUploadSuccess} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    // react-dropzone sets accept attribute on the hidden input
    expect(input.getAttribute('accept')).toContain('application/pdf');
  });

  it('deve validar tamanho do arquivo via Dropzone', async () => {
    render(<DocumentUploadDropzone onUploadSuccess={mockOnUploadSuccess} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    // > 10MB file
    const file = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });

    await user.upload(input, file);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/muito grande/i));
    });
  });

  it('deve chamar selectFile ao fazer upload de arquivo válido', async () => {
    render(<DocumentUploadDropzone onUploadSuccess={mockOnUploadSuccess} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['dummy'], 'valid.pdf', { type: 'application/pdf' });

    await user.upload(input, file);

    expect(mockSelectFile).toHaveBeenCalled();
  });

  it('deve mostrar botão de confirmar quando há arquivo selecionado', () => {
    (useDocumentUpload as unknown as jest.Mock).mockReturnValue({
      isUploading: false,
      progress: 0,
      uploadedFile: null,
      selectedFile: { name: 'test.pdf', size: 1024 },
      error: null,
      uploadFile: mockUploadFile,
      resetUpload: mockResetUpload,
      selectFile: mockSelectFile,
      removeFile: mockRemoveFile,
    });

    render(<DocumentUploadDropzone onUploadSuccess={mockOnUploadSuccess} />);

    const btn = screen.getByRole('button', { name: /confirmar/i });
    expect(btn).toBeEnabled();
  });

  it('deve realizar upload ao clicar em confirmar', async () => {
    mockUploadFile.mockResolvedValue({ url: 'http://url', name: 'test.pdf' });

    (useDocumentUpload as unknown as jest.Mock).mockReturnValue({
      isUploading: false,
      progress: 0,
      uploadedFile: null,
      selectedFile: { name: 'test.pdf', size: 1024 },
      error: null,
      uploadFile: mockUploadFile,
      resetUpload: mockResetUpload,
      selectFile: mockSelectFile,
      removeFile: mockRemoveFile,
    });

    render(<DocumentUploadDropzone onUploadSuccess={mockOnUploadSuccess} />);

    const btn = screen.getByRole('button', { name: /confirmar/i });
    await user.click(btn);

    await waitFor(() => {
      expect(mockUploadFile).toHaveBeenCalled();
      expect(mockOnUploadSuccess).toHaveBeenCalledWith('http://url', 'test.pdf');
    });
  });

  it('deve não mostrar botão confirmar durante upload', () => {
    (useDocumentUpload as unknown as jest.Mock).mockReturnValue({
      isUploading: true,
      progress: 50,
      uploadedFile: null,
      selectedFile: { name: 'test.pdf', size: 1024 },
      error: null,
      uploadFile: mockUploadFile,
      resetUpload: mockResetUpload,
      selectFile: mockSelectFile,
      removeFile: mockRemoveFile,
    });

    render(<DocumentUploadDropzone onUploadSuccess={mockOnUploadSuccess} />);

    // The "Confirmar e Enviar" button should not appear during upload
    expect(screen.queryByRole('button', { name: /confirmar/i })).not.toBeInTheDocument();
  });
});
