/**
 * useTimelineSearch
 *
 * Hook customizado para busca e filtragem client-side de itens da timeline.
 * Filtra por texto (campo `titulo`), aplica filtros rápidos e ordena por data.
 * Suporta navegação por teclado com ArrowUp/ArrowDown/Enter/Escape.
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import type { TimelineItemUnificado } from '../timeline/types';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface UseTimelineSearchOptions {
  items: TimelineItemUnificado[];
}

interface UseTimelineSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  /** Conjunto de chaves de filtros ativos: 'decisoes' | 'com_anexos' | 'documentos' */
  activeFilters: Set<string>;
  toggleFilter: (filter: string) => void;
  results: TimelineItemUnificado[];
  selectedIndex: number;
  setSelectedIndex: (i: number) => void;
  handleKeyDown: (e: React.KeyboardEvent, onSelect?: (item: TimelineItemUnificado) => void, onClose?: () => void) => void;
}

// ---------------------------------------------------------------------------
// Palavras-chave para o filtro de decisões
// ---------------------------------------------------------------------------

const TERMOS_DECISAO = ['sentença', 'decisão', 'acórdão', 'julgamento', 'sentenca', 'decisao', 'acordao'];

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Hook de busca da timeline.
 *
 * @example
 * const { query, setQuery, results, handleKeyDown } = useTimelineSearch({ items });
 */
export function useTimelineSearch({ items }: UseTimelineSearchOptions): UseTimelineSearchReturn {
  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Alterna um filtro rápido — ativa se inativo, desativa se já ativo
  const toggleFilter = useCallback((filter: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(filter)) {
        next.delete(filter);
      } else {
        next.add(filter);
      }
      return next;
    });
    // Volta ao topo da lista ao mudar filtros
    setSelectedIndex(0);
  }, []);

  // Normaliza texto removendo acentuação para comparação
  const normalizar = (texto: string) =>
    texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  // Filtragem e ordenação com useMemo para evitar re-cálculos desnecessários
  const results = useMemo(() => {
    let filtered = [...items];
    const queryNormalizada = normalizar(query.trim());

    // Filtro por texto livre no título
    if (queryNormalizada) {
      filtered = filtered.filter((item) =>
        normalizar(item.titulo).includes(queryNormalizada)
      );
    }

    // Filtro: apenas decisões
    if (activeFilters.has('decisoes')) {
      const termosNormalizados = TERMOS_DECISAO.map(normalizar);
      filtered = filtered.filter((item) => {
        const tituloNorm = normalizar(item.titulo);
        return termosNormalizados.some((termo) => tituloNorm.includes(termo));
      });
    }

    // Filtro: apenas itens com anexo Backblaze
    if (activeFilters.has('com_anexos')) {
      filtered = filtered.filter((item) => item.backblaze !== undefined);
    }

    // Filtro: apenas documentos (item.documento === true)
    if (activeFilters.has('documentos')) {
      filtered = filtered.filter((item) => item.documento === true);
    }

    // Ordena por data descendente (mais recente primeiro)
    filtered.sort((a, b) => {
      try {
        return new Date(b.data).getTime() - new Date(a.data).getTime();
      } catch {
        return 0;
      }
    });

    return filtered;
  }, [items, query, activeFilters]);

  // Reseta índice selecionado quando os resultados mudam
  // Usamos useCallback para manter referência estável
  const handleSetQuery = useCallback((q: string) => {
    setQuery(q);
    setSelectedIndex(0);
  }, []);

  /**
   * Gerencia navegação por teclado dentro do modal de busca.
   * - ArrowDown: próximo item (com wrap-around)
   * - ArrowUp: item anterior (com wrap-around)
   * - Enter: seleciona o item atual
   * - Escape: fecha o modal
   */
  const handleKeyDown = useCallback(
    (
      e: React.KeyboardEvent,
      onSelect?: (item: TimelineItemUnificado) => void,
      onClose?: () => void
    ) => {
      if (results.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % results.length);
          break;

        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
          break;

        case 'Enter':
          e.preventDefault();
          if (onSelect && results[selectedIndex]) {
            onSelect(results[selectedIndex]);
          }
          break;

        case 'Escape':
          e.preventDefault();
          onClose?.();
          break;
      }
    },
    [results, selectedIndex]
  );

  return {
    query,
    setQuery: handleSetQuery,
    activeFilters,
    toggleFilter,
    results,
    selectedIndex,
    setSelectedIndex,
    handleKeyDown,
  };
}
