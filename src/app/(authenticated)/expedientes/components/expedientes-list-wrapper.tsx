'use client';

import * as React from 'react';
import { useTiposExpedientes } from '@/app/(authenticated)/tipos-expedientes';
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
  viewModeSlot?: React.ReactNode;
  settingsSlot?: React.ReactNode;
  usuariosData?: UsuarioData[];
  tiposExpedientesData?: TipoExpedienteData[];
}

export function ExpedientesListWrapper({
  usuariosData = [],
  tiposExpedientesData = [],
}: ExpedientesListWrapperProps) {
  const {
    expedientes,
    isLoading,
    error,
    refetch,
  } = useExpedientes();

  const [selectedBaixarId, setSelectedBaixarId] = React.useState<number | null>(null);
  const [selectedVisualizarId, setSelectedVisualizarId] = React.useState<number | null>(null);
  
  if (isLoading) {
    return <TemporalViewLoading message="Carregando lista de expedientes..." />;
  }

  if (error) {
    return <TemporalViewError message={'Erro ao carregar expedientes'} onRetry={refetch} />;
  }

  return (
    <div className="space-y-2 pb-10">
      {expedientes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm font-medium text-muted-foreground/50">Nenhum expediente encontrado</p>
          <p className="text-xs text-muted-foreground/40 mt-1">Ajuste os filtros no cabeçalho</p>
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
                onAtribuir={(id) => {
                  // TODO: Implementar atribuir
                  console.log('Atribuir', id);
                }}
              />
            );
          })}
        </div>
      )}

      {/* Dialogs de Quick Action */}
      {selectedBaixarId && (
        <ExpedientesBaixarDialog
          expediente={expedientes.find(e => e.id === selectedBaixarId) as any}
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
        expediente={expedientes.find(e => e.id === selectedVisualizarId) as any}
        open={!!selectedVisualizarId}
        onOpenChange={(open) => !open && setSelectedVisualizarId(null)}
      />
      )}
    </div>
  );
}
