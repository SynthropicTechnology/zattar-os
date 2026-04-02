'use client';

import * as React from 'react';
import type { PericiasFilters } from '../domain';

type UsePericiasFiltersResult = {
  filters: PericiasFilters;
  setFilters: React.Dispatch<React.SetStateAction<PericiasFilters>>;
  clearFilters: () => void;
};

export function usePericiasFilters(
  initial: PericiasFilters = {}
): UsePericiasFiltersResult {
  const [filters, setFilters] = React.useState<PericiasFilters>(initial);

  const clearFilters = React.useCallback(() => {
    setFilters({});
  }, []);

  return { filters, setFilters, clearFilters };
}


