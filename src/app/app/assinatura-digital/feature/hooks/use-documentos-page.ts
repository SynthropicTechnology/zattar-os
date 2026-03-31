"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { actionListDocumentos } from "../actions/documentos-actions";
import {
  documentosToCardData,
  type DocumentoCardData,
  type DocumentoListItem,
} from "../adapters/documento-card-adapter";

interface UseDocumentosPageParams {
  initialData?: DocumentoListItem[];
}

/**
 * Hook unificado para a página de documentos.
 *
 * Gerencia: fetch, adapter, filtros (status, busca), view mode e seleção.
 */
export function useDocumentosPage({ initialData }: UseDocumentosPageParams = {}) {
  const [rawDocs, setRawDocs] = useState<DocumentoListItem[]>(initialData ?? []);
  const [loading, setLoading] = useState(!initialData);
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState("todos");
  const [viewMode, setViewMode] = useState("cards");
  const [selectedDoc, setSelectedDoc] = useState<DocumentoCardData | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  // Fetch documents
  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await actionListDocumentos({ pageSize: 200 });
      if (result?.success && result.data) {
        const data = result.data as { documentos: DocumentoListItem[] };
        setRawDocs(data.documentos ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialData) {
      refetch();
    }
  }, [initialData, refetch]);

  // Adapt to card data
  const allDocs = useMemo(() => documentosToCardData(rawDocs), [rawDocs]);

  // Filter
  const filteredDocs = useMemo(() => {
    return allDocs.filter((d) => {
      // Status filter
      if (activeStatus !== "todos" && d.status !== activeStatus) return false;

      // Search filter
      if (debouncedSearch) {
        const s = debouncedSearch.toLowerCase();
        return (
          d.titulo.toLowerCase().includes(s) ||
          d.criadoPor.toLowerCase().includes(s) ||
          d.assinantes.some((a) => a.nome.toLowerCase().includes(s))
        );
      }
      return true;
    });
  }, [allDocs, activeStatus, debouncedSearch]);

  // Pending signers for InsightBanner
  const pendingSigners = useMemo(() => {
    return allDocs.flatMap((d) =>
      d.assinantes.filter((a) => a.status === "pendente" && (a.diasPendente ?? 0) > 7)
    );
  }, [allDocs]);

  // Selection toggle
  const handleSelect = useCallback((doc: DocumentoCardData) => {
    setSelectedDoc((prev) => (prev?.id === doc.id ? null : doc));
  }, []);

  return {
    docs: filteredDocs,
    allDocs,
    loading,
    search,
    setSearch,
    activeStatus,
    setActiveStatus: (status: string) => {
      setActiveStatus(status);
      setSelectedDoc(null);
    },
    viewMode,
    setViewMode,
    selectedDoc,
    handleSelect,
    pendingSigners,
    refetch,
  };
}
