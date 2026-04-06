'use client';

import * as React from 'react';
import { FileSearch } from 'lucide-react';
import { TemporalViewLoading, TemporalViewError } from '@/components/shared';
import { useExpedientes } from '../hooks/use-expedientes';
import { ExpedienteListRow } from './expediente-list-row';
import { ExpedienteVisualizarDialog } from './expediente-visualizar-dialog';
import { ExpedientesBaixarDialog } from './expedientes-baixar-dialog';

interface UsuarioData {
  id: number;
  nomeExibicao?: string;
  nome_exibicao?: string;
  nomeCompleto?: string;
  nome?: string;
}

interface TipoExpedienteData {
  id: number;
  tipoExpediente?: string;
  tipo_expediente?: string;
}

export interface ExpedientesListWrapperProps {
  searchQuery?: string;
  usuariosData?: UsuarioData[];
  tiposExpedientesData?: TipoExpedienteData[];
}

export function ExpedientesListWrapper({
  usuariosData = [],
  tiposExpedientesData = [],
  searchQuery,
}: ExpedientesListWrapperProps) {
  const {
    expedientes,
    isLoading,
    error,
    refetch,
  } = useExpedientes({
    busca: searchQuery || undefined,
    incluirSemPrazo: true,
  });

  const [selectedBaixarId, setSelectedBaixarId] = React.useState<number | null>(null);
  const [selectedVisualizarId, setSelectedVisualizarId] = React.useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-18 rounded-2xl border border-border/20 bg-muted-foreground/5 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return <TemporalViewError message="Erro ao carregar expedientes" onRetry={refetch} />;
  }

  return (
    <div className="space-y-2">
      {expedientes.length === 0 ? (
        <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
          <FileSearch className="size-8 text-muted-foreground/20 mb-3" />
          <p className="text-sm font-medium text-muted-foreground/50">
            Nenhum expediente encontrado
          </p>
          <p className="text-xs text-muted-foreground/30 mt-1">
            {searchQuery ? 'Tente ajustar a busca' : 'Tente ajustar os filtros'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {expedientes.map((expediente) => {
            const tipo = tiposExpedientesData.find(t => t.id === expediente.tipoExpedienteId);
            const resp = usuariosData.find(u => u.id === expediente.responsavelId);

            return (
              <ExpedienteListRow
                key={expediente.id}
                expediente={expediente}
                tipoExpedienteNome={tipo?.tipoExpediente || tipo?.tipo_expediente || ''}
                responsavelNome={resp?.nomeExibicao || resp?.nome_exibicao || resp?.nomeCompleto || resp?.nome || ''}
                onBaixar={(id) => setSelectedBaixarId(id)}
                onVisualizar={(id) => setSelectedVisualizarId(id)}
              />
            );
          })}
        </div>
      )}

      {/* Quick Action Dialogs */}
      {selectedBaixarId && (
        <ExpedientesBaixarDialog
          expediente={expedientes.find(e => e.id === selectedBaixarId) ?? null}
          open={true}
          onOpenChange={(open) => !open && setSelectedBaixarId(null)}
          onSuccess={() => {
            setSelectedBaixarId(null);
            refetch();
          }}
        />
      )}

      {selectedVisualizarId && (
        <ExpedienteVisualizarDialog
          expediente={expedientes.find(e => e.id === selectedVisualizarId) ?? null}
          open={!!selectedVisualizarId}
          onOpenChange={(open) => !open && setSelectedVisualizarId(null)}
        />
      )}
    </div>
  );
}
