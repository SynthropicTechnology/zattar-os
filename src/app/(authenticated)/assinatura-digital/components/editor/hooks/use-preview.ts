'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { Template } from '@/shared/assinatura-digital/types/template.types';
import type { EditorField, ApiPreviewTestResponse } from '../types';
import { fieldsToTemplateCampos } from '../utils/field-helpers';

interface UsePreviewProps {
  template: Template;
  fields: EditorField[];
  mode: 'edit' | 'create';
  createdTemplate: Template | null;
  showFilledPreview: boolean;
  setPdfUrl: (url: string) => void;
  setPreviewKey: React.Dispatch<React.SetStateAction<number>>;
}

interface UsePreviewReturn {
  isGeneratingPreview: boolean;
  showPreviewModal: boolean;
  setShowPreviewModal: React.Dispatch<React.SetStateAction<boolean>>;
  previewPdfUrl: string | null;
  setPreviewPdfUrl: React.Dispatch<React.SetStateAction<string | null>>;
  iframeLoadFailed: boolean;
  handleGenerateTestPreview: () => Promise<void>;
  handleIframeLoad: () => void;
  handleIframeError: () => void;
  downloadPdf: (url: string, filename: string) => void;
}

/**
 * Hook for managing preview functionality
 * Handles test preview generation, iframe loading, and PDF download
 */
export function usePreview({
  template,
  fields,
  mode,
  createdTemplate,
  showFilledPreview,
  setPdfUrl,
  setPreviewKey,
}: UsePreviewProps): UsePreviewReturn {
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [iframeLoadFailed, setIframeLoadFailed] = useState(false);
  const iframeLoadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Handler for generating test preview with mock data
   * Validates template with mock data without saving
   */
  const handleGenerateTestPreview = useCallback(async () => {
    try {
      // Prevent preview in create mode without created template
      if (mode === 'create' && !createdTemplate?.id) {
        toast.error('Template ainda não foi criado', {
          description: 'Salve o template antes de gerar preview de teste',
        });
        return;
      }

      setIsGeneratingPreview(true);

      // Validate that there are mapped fields or markdown content
      const hasCampos = fields && fields.length > 0;
      const hasMarkdown =
        template.conteudo_markdown && template.conteudo_markdown.trim().length > 0;

      if (!hasCampos && !hasMarkdown) {
        toast.error('Template precisa ter campos mapeados ou conteúdo Markdown para preview');
        return;
      }

      const templateId = createdTemplate?.id || template.id;

      // Call preview API with current fields (even unsaved)
      const response = await fetch(
        `/api/assinatura-digital/templates/${templateId}/preview-test`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            campos: fieldsToTemplateCampos(fields),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error || 'Erro desconhecido ao gerar preview';

        if (response.status === 401) {
          toast.error('Sessão expirada. Faça login novamente.');
        } else if (response.status === 404) {
          toast.error('Template não encontrado.');
        } else if (response.status === 400) {
          toast.error('Erro de validação', { description: errorMessage });
        } else {
          toast.error('Erro ao gerar PDF de teste', { description: errorMessage });
        }

        return;
      }

      const result: ApiPreviewTestResponse = await response.json();

      if (result.success) {
        if (!result.arquivo_url) {
          throw new Error('URL do arquivo não retornada pelo servidor');
        }

        // Save filled PDF URL for preview
        setPreviewPdfUrl(result.arquivo_url);

        // If toggle is active, update canvas background too
        if (showFilledPreview) {
          setPdfUrl(result.arquivo_url);
          setPreviewKey((prev) => prev + 1);
        }

        // Open modal with preview
        setIframeLoadFailed(false);
        setShowPreviewModal(true);

        // Configure timeout to detect embed failure (5 seconds)
        if (iframeLoadTimeoutRef.current) {
          clearTimeout(iframeLoadTimeoutRef.current);
        }
        iframeLoadTimeoutRef.current = setTimeout(() => {
          setIframeLoadFailed(true);
        }, 5000);

        toast.success('PDF de teste gerado com sucesso!', {
          description:
            result.avisos?.length && result.avisos.length > 0
              ? `${result.avisos.length} aviso(s) detectado(s)`
              : undefined,
          action: {
            label: 'Ver PDF',
            onClick: () => window.open(result.arquivo_url, '_blank'),
          },
        });

        // Log warnings if any
        if (result.avisos && result.avisos.length > 0) {
          console.warn('[Preview Test] Avisos:', result.avisos);
        }
      } else {
        throw new Error(result.error || 'Resposta inválida do servidor');
      }
    } catch (error) {
      console.error('Erro ao gerar preview de teste:', error);
      const message = error instanceof Error ? error.message : 'Erro de conexão';
      toast.error('Erro ao gerar PDF de teste', { description: message });
    } finally {
      setIsGeneratingPreview(false);
    }
  }, [
    fields,
    template.id,
    template.conteudo_markdown,
    mode,
    createdTemplate,
    showFilledPreview,
    setPdfUrl,
    setPreviewKey,
  ]);

  /**
   * Handler for iframe load success
   */
  const handleIframeLoad = useCallback(() => {
    if (iframeLoadTimeoutRef.current) {
      clearTimeout(iframeLoadTimeoutRef.current);
      iframeLoadTimeoutRef.current = null;
    }
    setIframeLoadFailed(false);
  }, []);

  /**
   * Handler for iframe load error
   */
  const handleIframeError = useCallback(() => {
    if (iframeLoadTimeoutRef.current) {
      clearTimeout(iframeLoadTimeoutRef.current);
      iframeLoadTimeoutRef.current = null;
    }
    setIframeLoadFailed(true);
  }, []);

  /**
   * Cleanup timeout when modal closes
   */
  useEffect(() => {
    if (!showPreviewModal && iframeLoadTimeoutRef.current) {
      clearTimeout(iframeLoadTimeoutRef.current);
      iframeLoadTimeoutRef.current = null;
    }
  }, [showPreviewModal]);

  /**
   * Helper to download PDF via temporary link
   */
  const downloadPdf = useCallback((url: string, filename: string) => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download iniciado!');
    } catch (error) {
      console.error('Erro ao iniciar download:', error);
      toast.error('Erro ao iniciar download', {
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }, []);

  return {
    isGeneratingPreview,
    showPreviewModal,
    setShowPreviewModal,
    previewPdfUrl,
    setPreviewPdfUrl,
    iframeLoadFailed,
    handleGenerateTestPreview,
    handleIframeLoad,
    handleIframeError,
    downloadPdf,
  };
}
