'use client';

import { Button } from '@/components/ui/button';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { FileSearch } from 'lucide-react';

interface ProcessosEmptyStateProps {
  onClearFilters: () => void;
  hasFilters: boolean;
}

export function ProcessosEmptyState({ onClearFilters, hasFilters }: ProcessosEmptyStateProps) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileSearch />
        </EmptyMedia>
        <EmptyTitle>Nenhum processo encontrado</EmptyTitle>
        <EmptyDescription>
          {hasFilters
            ? 'Ajuste os filtros ou realize uma nova busca para encontrar o que procura.'
            : 'Não há processos cadastrados que correspondam aos seus critérios.'}
        </EmptyDescription>
      </EmptyHeader>
      {hasFilters && (
        <Button variant="outline" onClick={onClearFilters}>
          Limpar Filtros
        </Button>
      )}
    </Empty>
  );
}
