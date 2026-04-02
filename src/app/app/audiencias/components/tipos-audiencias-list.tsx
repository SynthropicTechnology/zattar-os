'use client';

/**
 * TiposAudienciasList - Lista de tipos de audiências
 *
 * Componente para visualização dos tipos de audiências disponíveis no sistema.
 * Os tipos são carregados da tabela `tipo_audiencia` do banco de dados.
 */

import * as React from 'react';
import { Loader2, Video, MapPin, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppBadge } from '@/components/ui/app-badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

import { actionListarTiposAudiencia } from '../actions';

interface TipoAudiencia {
  id: number;
  descricao: string;
  is_virtual: boolean;
}

export function TiposAudienciasList() {
  const [tipos, setTipos] = React.useState<TipoAudiencia[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');

  const fetchTipos = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await actionListarTiposAudiencia({ limite: 1000 });
      if (result.success && result.data) {
        setTipos(result.data);
      } else if (!result.success) {
        setError(result.message || 'Erro ao carregar tipos de audiência');
      }
    } catch {
      setError('Erro ao carregar tipos de audiência');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchTipos();
  }, [fetchTipos]);

  // Filtrar tipos baseado na busca
  const filteredTipos = React.useMemo(() => {
    if (!searchTerm) return tipos;
    const term = searchTerm.toLowerCase();
    return tipos.filter((tipo) =>
      tipo.descricao.toLowerCase().includes(term)
    );
  }, [tipos, searchTerm]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchTipos}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <Input
          placeholder="Buscar tipo de audiência..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {filteredTipos.length} tipo(s)
          </span>
          <Button variant="ghost" size="icon" onClick={fetchTipos}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-32 text-center">Modalidade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTipos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                  Nenhum tipo de audiência encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredTipos.map((tipo) => (
                <TableRow key={tipo.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {tipo.id}
                  </TableCell>
                  <TableCell>{tipo.descricao}</TableCell>
                  <TableCell className="text-center">
                    <AppBadge
                      variant="outline"
                      className={cn(
                        'gap-1',
                        tipo.is_virtual
                          ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300'
                      )}
                    >
                      {tipo.is_virtual ? (
                        <>
                          <Video className="h-3 w-3" />
                          Virtual
                        </>
                      ) : (
                        <>
                          <MapPin className="h-3 w-3" />
                          Presencial
                        </>
                      )}
                    </AppBadge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
