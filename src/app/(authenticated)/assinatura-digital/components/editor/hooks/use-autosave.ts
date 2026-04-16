'use client';

/**
 * @internal
 * This hook is internal to the editor and should not be imported directly.
 * Use `useSaveOperations` from './use-save-operations' instead.
 *
 * @see use-save-operations.ts
 */

import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import type { Template, TemplateCampo, TemplateSignatario } from '@/shared/assinatura-digital/types/template.types';
import type { EditorField, Signatario } from '../types';

interface UseAutosaveProps {
  templateId: number;
  template: Template;
  fields: EditorField[];
  signers?: Signatario[];
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;
  debounceMs?: number;
}

/**
 * Converts EditorField array to TemplateCampo array for API submission
 * Removes editor-specific properties and temporary IDs
 */
function fieldsToTemplateCampos(fields: EditorField[]): TemplateCampo[] {
  return fields.map(({ isSelected, isDragging, justAdded, ...field }) => {
    // Remove editor-specific properties
    void isSelected;
    void isDragging;
    void justAdded;

    // Remove temporary IDs (those starting with 'field-')
    if (typeof field.id === 'string' && field.id.startsWith('field-')) {
      const { id, ...rest } = field;
      void id;
      return rest as TemplateCampo;
    }
    return field;
  });
}

/**
 * Converts Signatario array to TemplateSignatario array for API submission
 */
function signersToTemplateSignatarios(signers: Signatario[]): TemplateSignatario[] {
  return signers.map((signer) => ({
    id: signer.id,
    nome: signer.nome,
    email: signer.email,
    cor: signer.cor,
    ordem: signer.ordem,
  }));
}

/**
 * Hook for auto-saving template changes with debounce
 * Saves every 5 seconds when there are unsaved changes
 */
export function useAutosave({
  templateId,
  template,
  fields,
  signers = [],
  hasUnsavedChanges,
  setHasUnsavedChanges,
  debounceMs = 5000,
}: UseAutosaveProps) {
  const saveInProgress = useRef(false);

  const saveTemplate = useCallback(async () => {
    if (saveInProgress.current) return;
    saveInProgress.current = true;

    try {
      const templateCampos = fieldsToTemplateCampos(fields);
      const templateSignatarios = signersToTemplateSignatarios(signers);

      const response = await fetch(`/api/assinatura-digital/templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          template_uuid: template.template_uuid,
          nome: template.nome,
          descricao: template.descricao || null,
          arquivo_original: template.arquivo_original,
          arquivo_nome: template.arquivo_nome,
          arquivo_tamanho: template.arquivo_tamanho,
          status: template.status,
          versao: template.versao,
          ativo: template.ativo,
          campos: JSON.stringify(templateCampos),
          signatarios: JSON.stringify(templateSignatarios),
          conteudo_markdown: template.conteudo_markdown || null,
          criado_por: template.criado_por,
        }),
      });

      if (response.ok) {
        setHasUnsavedChanges(false);
        toast.success('Autosaved', {
          duration: 1500,
          description: 'Changes saved automatically',
        });
      } else {
        // Keep dirty state on error, will retry on next interval
        console.warn('Autosave failed:', response.status);
      }
    } catch (error) {
      // Keep dirty state on error, will retry on next interval
      console.warn('Autosave error:', error);
    } finally {
      saveInProgress.current = false;
    }
  }, [fields, signers, templateId, template, setHasUnsavedChanges]);

  // Autosave effect
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const autosaveTimer = setTimeout(saveTemplate, debounceMs);

    return () => clearTimeout(autosaveTimer);
  }, [hasUnsavedChanges, saveTemplate, debounceMs]);

  // Manual save function that can be called externally
  const manualSave = useCallback(async () => {
    try {
      const templateCampos = fieldsToTemplateCampos(fields);
      const templateSignatarios = signersToTemplateSignatarios(signers);

      const response = await fetch(`/api/assinatura-digital/templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          template_uuid: template.template_uuid,
          nome: template.nome,
          descricao: template.descricao || null,
          arquivo_original: template.arquivo_original,
          arquivo_nome: template.arquivo_nome,
          arquivo_tamanho: template.arquivo_tamanho,
          status: template.status,
          versao: template.versao,
          ativo: template.ativo,
          campos: JSON.stringify(templateCampos),
          signatarios: JSON.stringify(templateSignatarios),
          conteudo_markdown: template.conteudo_markdown || null,
          criado_por: template.criado_por,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || 'Erro desconhecido ao salvar o template.';

        if (response.status === 401) {
          toast.error('Sessão expirada. Faça login novamente.');
        } else if (response.status === 404) {
          toast.error('Template não encontrado.');
        } else if (response.status === 403) {
          toast.error('Você não tem permissão para editar este template.');
        } else {
          toast.error('Erro ao salvar template.', {
            description: errorMessage,
          });
        }

        return false;
      }

      toast.success('Template salvo com sucesso!');
      setHasUnsavedChanges(false);
      return true;
    } catch (error) {
      console.error('Erro ao salvar:', error);
      const message =
        error instanceof Error ? error.message : 'Verifique sua conexão e tente novamente.';
      toast.error('Ocorreu um erro de conexão ao salvar.', {
        description: message,
      });
      return false;
    }
  }, [fields, signers, templateId, template, setHasUnsavedChanges]);

  return {
    saveTemplate: manualSave,
  };
}
