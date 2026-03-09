'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toDateString } from '@/lib/date-utils';

export type StatusConciliacaoFilter = 'pendente' | 'conciliado' | 'divergente' | 'ignorado' | 'todos';
export type PeriodoFilter = '7' | '30' | '90' | 'todos';

interface ContaBancaria {
  id: number;
  nome: string;
}

export interface ConciliacaoListFiltersProps {
  // Status filter
  statusFiltro: StatusConciliacaoFilter;
  onStatusChange: (value: StatusConciliacaoFilter) => void;
  // Periodo filter
  periodoFiltro: PeriodoFilter;
  onPeriodoChange: (value: PeriodoFilter) => void;
  // Conta filter
  contaFiltro: number | 'todos';
  onContaChange: (value: number | 'todos') => void;
  // Contas data
  contasBancarias: ContaBancaria[];
}

export function ConciliacaoListFilters({
  statusFiltro,
  onStatusChange,
  periodoFiltro,
  onPeriodoChange,
  contaFiltro,
  onContaChange,
  contasBancarias,
}: ConciliacaoListFiltersProps) {
  return (
    <>
      {/* Status Filter */}
      <Select
        value={statusFiltro}
        onValueChange={(value) => onStatusChange(value as StatusConciliacaoFilter)}
      >
        <SelectTrigger className="h-10 w-35">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos Status</SelectItem>
          <SelectItem value="pendente">Pendente</SelectItem>
          <SelectItem value="conciliado">Conciliado</SelectItem>
          <SelectItem value="divergente">Divergente</SelectItem>
          <SelectItem value="ignorado">Ignorado</SelectItem>
        </SelectContent>
      </Select>

      {/* Periodo Filter */}
      <Select
        value={periodoFiltro}
        onValueChange={(value) => onPeriodoChange(value as PeriodoFilter)}
      >
        <SelectTrigger className="h-10 w-37.5">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todo Período</SelectItem>
          <SelectItem value="7">Últimos 7 dias</SelectItem>
          <SelectItem value="30">Últimos 30 dias</SelectItem>
          <SelectItem value="90">Últimos 90 dias</SelectItem>
        </SelectContent>
      </Select>

      {/* Conta Bancaria Filter */}
      {contasBancarias.length > 0 && (
        <Select
          value={contaFiltro.toString()}
          onValueChange={(value) => {
            if (value === 'todos') onContaChange('todos');
            else onContaChange(Number(value));
          }}
        >
          <SelectTrigger className="h-10 w-45">
            <SelectValue placeholder="Conta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas Contas</SelectItem>
            {contasBancarias.map((conta) => (
              <SelectItem key={conta.id} value={conta.id.toString()}>
                {conta.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </>
  );
}

/**
 * Helper to calculate date range from period filter
 */
export function calcularPeriodo(periodo: PeriodoFilter): { dataInicio?: string; dataFim?: string } {
  if (periodo === 'todos') return {};

  const hoje = new Date();
  const inicio = new Date(hoje);
  inicio.setDate(inicio.getDate() - Number(periodo));

  const toIso = (d: Date) => toDateString(d);

  return {
    dataInicio: toIso(inicio),
    dataFim: toIso(hoje),
  };
}
