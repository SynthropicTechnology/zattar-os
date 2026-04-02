'use client';

import { useState, useTransition } from 'react';
import { actionBuscarConhecimento } from '../actions/search-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppBadge } from '@/components/ui/app-badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SearchIcon, FileTextIcon, Loader2Icon } from 'lucide-react';
import type { SearchResult } from '../domain';

interface RAGChatProps {
  processoId?: number;
  entityType?: string;
  placeholder?: string;
  title?: string;
}

export function RAGChat({
  processoId,
  entityType,
  placeholder = 'Pergunte sobre os documentos...',
  title = 'Busca Inteligente',
}: RAGChatProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSearch = () => {
    if (!query.trim()) return;

    setError(null);
    startTransition(async () => {
      const response = await actionBuscarConhecimento(query, {
        parent_id: processoId,
        entity_type: entityType,
        match_count: 5,
        match_threshold: 0.7,
      });

      if (response.success && response.data) {
        setResults(response.data);
      } else {
        setError(response.error || 'Erro na busca');
        setResults([]);
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const getEntityTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      documento: 'Documento',
      processo_peca: 'Peça Processual',
      processo_andamento: 'Andamento',
      contrato: 'Contrato',
      expediente: 'Expediente',
      assinatura_digital: 'Assinatura Digital',
    };
    return labels[type] || type;
  };

  const formatSimilarity = (similarity: number): string => {
    return `${(similarity * 100).toFixed(0)}%`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <SearchIcon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            onKeyDown={handleKeyDown}
            disabled={isPending}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={isPending || !query.trim()}>
            {isPending ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <SearchIcon className="h-4 w-4" />
            )}
          </Button>
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}

        {results.length > 0 && (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                      <AppBadge variant="outline" className="text-xs">
                        {getEntityTypeLabel(result.entity_type)}
                      </AppBadge>
                      {result.parent_id && (
                        <span className="text-xs text-muted-foreground">
                          #{result.parent_id}
                        </span>
                      )}
                    </div>
                    <AppBadge
                      variant={result.similarity > 0.85 ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {formatSimilarity(result.similarity)} relevante
                    </AppBadge>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {result.content.length > 500
                      ? result.content.substring(0, 500) + '...'
                      : result.content}
                  </p>
                  {result.metadata && Object.keys(result.metadata).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {Boolean(result.metadata.nome_arquivo) && (
                        <span className="text-xs text-muted-foreground">
                          {String(result.metadata.nome_arquivo)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {!isPending && results.length === 0 && query && !error && (
          <div className="text-sm text-muted-foreground text-center py-8">
            Nenhum resultado encontrado para sua busca.
          </div>
        )}

        {!query && !isPending && (
          <div className="text-sm text-muted-foreground text-center py-8">
            Digite sua pergunta para buscar nos documentos indexados.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
