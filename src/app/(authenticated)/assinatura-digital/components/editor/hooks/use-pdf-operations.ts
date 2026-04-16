'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { validatePdfFile } from '../utils/validate-pdf-file';

interface UsePdfOperationsProps {
  mode: 'edit' | 'create';
  setPdfUrl: (url: string | null) => void;
  setPreviewKey: React.Dispatch<React.SetStateAction<number>>;
}

interface UsePdfOperationsReturn {
  uploadedFile: File | null;
  setUploadedFile: React.Dispatch<React.SetStateAction<File | null>>;
  uploadedFilePreview: string | null;
  setUploadedFilePreview: React.Dispatch<React.SetStateAction<string | null>>;
  handleFileUpload: (file: File) => void;
  clearUploadedFile: () => void;
}

/**
 * Hook for managing PDF file operations
 * Handles file upload, validation, and preview URL management
 */
export function usePdfOperations({
  mode: _mode,
  setPdfUrl,
  setPreviewKey,
}: UsePdfOperationsProps): UsePdfOperationsReturn {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFilePreview, setUploadedFilePreview] = useState<string | null>(null);

  // Handler for file upload in create mode
  const handleFileUpload = useCallback(
    (file: File) => {
      const validation = validatePdfFile(file);

      if (!validation.isValid) {
        toast.error(validation.error || 'Arquivo inválido');
        return;
      }

      // Create blob URL for preview
      const blobUrl = URL.createObjectURL(file);
      setUploadedFile(file);
      setUploadedFilePreview(blobUrl);
      setPdfUrl(blobUrl);
      setPreviewKey((prev) => prev + 1);
    },
    [setPdfUrl, setPreviewKey]
  );

  // Clear uploaded file and revoke blob URL
  const clearUploadedFile = useCallback(() => {
    if (uploadedFilePreview) {
      URL.revokeObjectURL(uploadedFilePreview);
    }
    setUploadedFile(null);
    setUploadedFilePreview(null);
    setPdfUrl(null);
  }, [uploadedFilePreview, setPdfUrl]);

  // Cleanup: revoke blob URL when component unmounts
  useEffect(() => {
    return () => {
      if (uploadedFilePreview) {
        URL.revokeObjectURL(uploadedFilePreview);
      }
    };
  }, [uploadedFilePreview]);

  return {
    uploadedFile,
    setUploadedFile,
    uploadedFilePreview,
    setUploadedFilePreview,
    handleFileUpload,
    clearUploadedFile,
  };
}
