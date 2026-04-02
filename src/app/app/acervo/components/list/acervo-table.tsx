/**
 * Acervo Table Component
 * Displays list of processes in a data table
 */

'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/design-system';
import type { Acervo } from '../../domain';

interface AcervoTableProps {
  processos: Acervo[];
  onSelectProcesso?: (processo: Acervo) => void;
  selectedIds?: number[];
  onSelectionChange?: (ids: number[]) => void;
  showSelection?: boolean;
}

export function AcervoTable({
  processos,
  onSelectProcesso,
  selectedIds = [],
  onSelectionChange,
  showSelection = false,
}: AcervoTableProps) {
  const handleSelectAll = (checked: boolean) => {
    if (onSelectionChange) {
      onSelectionChange(checked ? processos.map(p => p.id) : []);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (onSelectionChange) {
      const newSelection = checked
        ? [...selectedIds, id]
        : selectedIds.filter(selectedId => selectedId !== id);
      onSelectionChange(newSelection);
    }
  };

  const allSelected = processos.length > 0 && selectedIds.length === processos.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < processos.length;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {showSelection && (
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Selecionar todos"
                  className={someSelected ? 'data-[state=checked]:bg-primary' : ''}
                />
              </TableHead>
            )}
            <TableHead>Número do Processo</TableHead>
            <TableHead>TRT</TableHead>
            <TableHead>Grau</TableHead>
            <TableHead>Classe Judicial</TableHead>
            <TableHead>Parte Autora</TableHead>
            <TableHead>Parte Ré</TableHead>
            <TableHead>Órgão Julgador</TableHead>
            <TableHead>Data de Autuação</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {processos.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={showSelection ? 11 : 10}
                className="text-center text-muted-foreground"
              >
                Nenhum processo encontrado
              </TableCell>
            </TableRow>
          ) : (
            processos.map((processo) => (
              <TableRow key={processo.id}>
                {showSelection && (
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(processo.id)}
                      onCheckedChange={(checked) =>
                        handleSelectOne(processo.id, checked as boolean)
                      }
                      aria-label={`Selecionar processo ${processo.numero_processo}`}
                    />
                  </TableCell>
                )}
                <TableCell className="font-medium">
                  {processo.numero_processo}
                </TableCell>
                <TableCell>{processo.trt}</TableCell>
                <TableCell>
                  <SemanticBadge category="grau" value={processo.grau}>
                    {processo.grau === 'primeiro_grau' ? '1º Grau' : '2º Grau'}
                  </SemanticBadge>
                </TableCell>
                <TableCell>{processo.classe_judicial}</TableCell>
                <TableCell className="max-w-50 truncate">
                  {processo.nome_parte_autora}
                </TableCell>
                <TableCell className="max-w-50 truncate">
                  {processo.nome_parte_re}
                </TableCell>
                <TableCell className="max-w-50 truncate">
                  {processo.descricao_orgao_julgador}
                </TableCell>
                <TableCell>{formatDate(processo.data_autuacao)}</TableCell>
                <TableCell>
                  <SemanticBadge category="status" value={processo.status}>
                    {processo.status}
                  </SemanticBadge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelectProcesso?.(processo)}
                  >
                    Ver Detalhes
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
