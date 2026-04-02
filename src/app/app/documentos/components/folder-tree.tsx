'use client';

/**
 * Componente de árvore de pastas
 * Exibe hierarquia de pastas com expansão/colapso
 */

import * as React from 'react';
import { ChevronRight, Folder, FolderOpen, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useFolders } from '../hooks/use-folders';
import type { PastaHierarquia, PastaComContadores } from '../types';

interface FolderTreeProps {
  onFolderSelect: (folderId: number | null) => void;
  selectedFolderId: number | null;
}

export function FolderTree({ onFolderSelect, selectedFolderId }: FolderTreeProps) {
  const { folders, loading } = useFolders();
  const [pastas, setPastas] = React.useState<PastaHierarquia[]>([]);
  const [expandedIds, setExpandedIds] = React.useState<Set<number>>(new Set());

  // Helper to build hierarchy from flat list
  const buildHierarchy = React.useCallback((allFolders: PastaComContadores[]): PastaHierarquia[] => {
    const map = new Map<number, PastaHierarquia>();
    // Initialize map with empty subpastas
    allFolders.forEach(f => {
      // Cast to PastaHierarquia (subpastas is mandatory in type, but assuming we fill it)
      map.set(f.id, { ...f, subpastas: [] } as unknown as PastaHierarquia);
    });

    const roots: PastaHierarquia[] = [];
    
    allFolders.forEach(f => {
      const node = map.get(f.id)!;
      if (f.pasta_pai_id && map.has(f.pasta_pai_id)) {
        map.get(f.pasta_pai_id)!.subpastas.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, []);

  React.useEffect(() => {
    if (folders) {
      setPastas(buildHierarchy(folders));
    }
  }, [folders, buildHierarchy]);

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderPasta = (pasta: PastaHierarquia, level = 0) => {
    const isExpanded = expandedIds.has(pasta.id);
    const isSelected = selectedFolderId === pasta.id;
    const hasSubpastas = pasta.subpastas && pasta.subpastas.length > 0;

    return (
      <div key={pasta.id}>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'w-full justify-start gap-1 px-2 py-1.5 font-normal',
            isSelected && 'bg-accent'
          )}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          onClick={() => onFolderSelect(pasta.id)}
        >
          {hasSubpastas && (
            <ChevronRight
              className={cn(
                'h-4 w-4 shrink-0 transition-transform',
                isExpanded && 'rotate-90'
              )}
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(pasta.id);
              }}
            />
          )}
          {!hasSubpastas && <div className="w-4" />}
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 shrink-0" />
          ) : (
            <Folder className="h-4 w-4 shrink-0" />
          )}
          <span className="truncate text-sm">{pasta.nome}</span>
        </Button>

        {/* Subpastas */}
        {isExpanded && hasSubpastas && (
          <div>
            {pasta.subpastas.map((subpasta: PastaHierarquia) => renderPasta(subpasta, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="h-8 w-full animate-pulse rounded bg-muted" />
        <div className="h-8 w-full animate-pulse rounded bg-muted" />
        <div className="h-8 w-full animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Raiz (Todos os documentos) */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'w-full justify-start gap-2 px-2 py-1.5 font-normal',
          selectedFolderId === null && 'bg-accent'
        )}
        onClick={() => onFolderSelect(null)}
      >
        <Home className="h-4 w-4" />
        <span className="text-sm">Todos os documentos</span>
      </Button>

      {/* Pastas */}
      {pastas.map((pasta) => renderPasta(pasta))}
    </div>
  );
}
