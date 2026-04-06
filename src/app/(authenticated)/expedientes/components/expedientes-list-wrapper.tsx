'use client';

import * as React from 'react';
import { FileSearch } from 'lucide-react';
import type { Expediente } from '../domain';
import { ExpedienteListRow } from './expediente-list-row';

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
  expedientes: Expediente[];
  usuariosData?: UsuarioData[];
  tiposExpedientesData?: TipoExpedienteData[];
  onBaixar?: (expediente: Expediente) => void;
  onViewDetail?: (expediente: Expediente) => void;
}

export function ExpedientesListWrapper({
  expedientes,
  usuariosData = [],
  tiposExpedientesData = [],
  onBaixar,
  onViewDetail,
}: ExpedientesListWrapperProps) {
  if (expedientes.length === 0) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
        <FileSearch className="size-8 text-muted-foreground/20 mb-3" />
        <p className="text-sm font-medium text-muted-foreground/50">
          Nenhum expediente encontrado
        </p>
        <p className="text-xs text-muted-foreground/30 mt-1">
          Tente ajustar os filtros ou a busca
        </p>
      </div>
    );
  }

  return (
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
            onBaixar={onBaixar ? () => onBaixar(expediente) : undefined}
            onVisualizar={onViewDetail ? () => onViewDetail(expediente) : undefined}
          />
        );
      })}
    </div>
  );
}
