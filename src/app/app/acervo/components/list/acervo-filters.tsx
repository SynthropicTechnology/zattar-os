/**
 * Acervo Filters Component
 * Filter controls for acervo list
 */

'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { ListarAcervoParams } from '../../domain';

interface AcervoFiltersProps {
  filters: ListarAcervoParams;
  onFilterChange: <K extends keyof ListarAcervoParams>(
    key: K,
    value: ListarAcervoParams[K]
  ) => void;
  onReset: () => void;
}

export function AcervoFilters({
  filters,
  onFilterChange,
  onReset,
}: AcervoFiltersProps) {
  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filtros</h3>
        <Button variant="ghost" size="sm" onClick={onReset}>
          <X className="mr-2 h-4 w-4" />
          Limpar Filtros
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="busca">Busca</Label>
          <Input
            id="busca"
            placeholder="Número, partes, vara..."
            value={filters.busca || ''}
            onChange={(e) => onFilterChange('busca', e.target.value)}
          />
        </div>

        {/* Origin */}
        <div className="space-y-2">
          <Label htmlFor="origem">Origem</Label>
          <Select
            value={filters.origem || 'all'}
            onValueChange={(value) =>
              onFilterChange('origem', value === 'all' ? undefined : value as 'acervo_geral' | 'arquivado')
            }
          >
            <SelectTrigger id="origem">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="acervo_geral">Acervo Geral</SelectItem>
              <SelectItem value="arquivado">Arquivado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* TRT */}
        <div className="space-y-2">
          <Label htmlFor="trt">TRT</Label>
          <Input
            id="trt"
            placeholder="Ex: TRT3"
            value={filters.trt || ''}
            onChange={(e) => onFilterChange('trt', e.target.value)}
          />
        </div>

        {/* Grade */}
        <div className="space-y-2">
          <Label htmlFor="grau">Grau</Label>
          <Select
            value={filters.grau || 'all'}
            onValueChange={(value) =>
              onFilterChange('grau', value === 'all' ? undefined : value as 'primeiro_grau' | 'segundo_grau')
            }
          >
            <SelectTrigger id="grau">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="primeiro_grau">1º Grau</SelectItem>
              <SelectItem value="segundo_grau">2º Grau</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Judicial Class */}
        <div className="space-y-2">
          <Label htmlFor="classe_judicial">Classe Judicial</Label>
          <Input
            id="classe_judicial"
            placeholder="Ex: ATOrd"
            value={filters.classe_judicial || ''}
            onChange={(e) => onFilterChange('classe_judicial', e.target.value)}
          />
        </div>

        {/* Has Next Hearing */}
        <div className="space-y-2">
          <Label htmlFor="tem_proxima_audiencia">Próxima Audiência</Label>
          <Select
            value={
              filters.tem_proxima_audiencia === undefined
                ? 'all'
                : filters.tem_proxima_audiencia
                ? 'sim'
                : 'nao'
            }
            onValueChange={(value) =>
              onFilterChange(
                'tem_proxima_audiencia',
                value === 'all' ? undefined : value === 'sim'
              )
            }
          >
            <SelectTrigger id="tem_proxima_audiencia">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="sim">Com Audiência</SelectItem>
              <SelectItem value="nao">Sem Audiência</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Secrecy */}
        <div className="space-y-2">
          <Label htmlFor="segredo_justica">Segredo de Justiça</Label>
          <Select
            value={
              filters.segredo_justica === undefined
                ? 'all'
                : filters.segredo_justica
                ? 'sim'
                : 'nao'
            }
            onValueChange={(value) =>
              onFilterChange(
                'segredo_justica',
                value === 'all' ? undefined : value === 'sim'
              )
            }
          >
            <SelectTrigger id="segredo_justica">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="sim">Sim</SelectItem>
              <SelectItem value="nao">Não</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Without Responsible */}
        <div className="space-y-2">
          <Label htmlFor="sem_responsavel">Responsável</Label>
          <Select
            value={
              filters.sem_responsavel === true
                ? 'sem'
                : filters.sem_responsavel === false
                ? 'com'
                : 'all'
            }
            onValueChange={(value) =>
              onFilterChange(
                'sem_responsavel',
                value === 'all' ? undefined : value === 'sem'
              )
            }
          >
            <SelectTrigger id="sem_responsavel">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="sem">Sem Responsável</SelectItem>
              <SelectItem value="com">Com Responsável</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
