'use client';

import { useState, useEffect, useCallback, startTransition } from 'react';
import { actionListarTemplates, actionUsarTemplate, actionCriarTemplate, actionDeletarTemplate } from '../actions/templates-actions';
import type { TemplateComUsuario, ListarTemplatesParams, CriarTemplateParams } from '../types';

export function useTemplates(initialParams?: ListarTemplatesParams) {
  const [templates, setTemplates] = useState<TemplateComUsuario[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<ListarTemplatesParams>(initialParams || {});

  const fetchTemplates = useCallback(async () => {
    startTransition(() => {
      setLoading(true);
      setError(null);
    });
    
    const result = await actionListarTemplates(params);
    
    startTransition(() => {
      if (result.success) {
        setTemplates(result.data || []);
        setTotal(result.total || 0);
      } else {
        setError(result.error ?? null);
      }
      setLoading(false);
    });
  }, [params]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const updateParams = useCallback((newParams: Partial<ListarTemplatesParams>) => {
    setParams((prevParams: ListarTemplatesParams) => ({ ...prevParams, ...newParams }));
  }, []);

  const createTemplate = useCallback(async (templateParams: CriarTemplateParams) => {
    setError(null);
    const formData = new FormData();
    formData.append('titulo', templateParams.titulo);
    if (templateParams.descricao) formData.append('descricao', templateParams.descricao);
    formData.append('conteudo', JSON.stringify(templateParams.conteudo));
    formData.append('visibilidade', templateParams.visibilidade);
    if (templateParams.categoria) formData.append('categoria', templateParams.categoria);
    if (templateParams.thumbnail_url) formData.append('thumbnail_url', templateParams.thumbnail_url);

    const result = await actionCriarTemplate(formData);
    if (result.success) {
      fetchTemplates();
      return result.data;
    } else {
      setError(result.error || 'Erro ao criar template');
      throw new Error(result.error ?? 'Erro desconhecido');
    }
  }, [fetchTemplates]);

  const createDocumentFromTemplate = useCallback(async (templateId: number, options?: { titulo?: string; pasta_id?: number | null }) => {
    setError(null);
    const result = await actionUsarTemplate(templateId, options);
    if (result.success) {
      // Revalidate documents list or redirect to new document
      return result.data;
    } else {
      setError(result.error || 'Erro ao criar template');
      throw new Error(result.error ?? 'Erro desconhecido');
    }
  }, []);

  const deleteTemplate = useCallback(async (id: number) => {
    setError(null);
    const result = await actionDeletarTemplate(id);
    if (result.success) {
      fetchTemplates();
    } else {
      setError(result.error || 'Erro ao criar template');
      throw new Error(result.error ?? 'Erro desconhecido');
    }
  }, [fetchTemplates]);

  return {
    templates,
    total,
    loading,
    error,
    params,
    updateParams,
    fetchTemplates,
    createTemplate,
    createDocumentFromTemplate,
    deleteTemplate,
  };
}
