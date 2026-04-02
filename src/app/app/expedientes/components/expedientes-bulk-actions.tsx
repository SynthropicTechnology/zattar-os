'use client';

import * as React from 'react';
import { Users, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppBadge } from '@/components/ui/app-badge';
import { ExpedientesBulkTransferirDialog } from './expedientes-bulk-transferir-dialog';
import { ExpedientesBulkBaixarDialog } from './expedientes-bulk-baixar-dialog';
import type { Expediente } from '../domain';

interface ExpedientesBulkActionsProps {
  selectedRows: Expediente[];
  usuarios: Array<{ id: number; nomeExibicao: string }>;
  onSuccess: () => void;
}

export function ExpedientesBulkActions({
  selectedRows,
  usuarios,
  onSuccess,
}: ExpedientesBulkActionsProps) {
  const [isTransferirOpen, setIsTransferirOpen] = React.useState(false);
  const [isBaixarOpen, setIsBaixarOpen] = React.useState(false);

  const selectedCount = selectedRows.length;
  const selectedIds = selectedRows.map((row) => row.id);

  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <AppBadge variant="secondary" className="font-medium">
          {selectedCount} {selectedCount === 1 ? 'expediente selecionado' : 'expedientes selecionados'}
        </AppBadge>
        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsTransferirOpen(true)}
            className="gap-2"
          >
            <Users className="h-4 w-4" />
            Transferir Responsável
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsBaixarOpen(true)}
            className="gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Baixar em Massa
          </Button>
        </div>
      </div>

      <ExpedientesBulkTransferirDialog
        open={isTransferirOpen}
        onOpenChange={setIsTransferirOpen}
        expedienteIds={selectedIds}
        usuarios={usuarios}
        onSuccess={() => {
          onSuccess();
          setIsTransferirOpen(false);
        }}
      />

      <ExpedientesBulkBaixarDialog
        open={isBaixarOpen}
        onOpenChange={setIsBaixarOpen}
        expedienteIds={selectedIds}
        onSuccess={() => {
          onSuccess();
          setIsBaixarOpen(false);
        }}
      />
    </>
  );
}

