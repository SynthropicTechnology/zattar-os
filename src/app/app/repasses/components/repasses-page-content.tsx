'use client';

import { useState } from 'react';
import {
  RepassesPendentesList,
  UploadDeclaracaoDialog,
  UploadComprovanteDialog
} from '@/app/app/obrigacoes';

interface DialogState {
  open: boolean;
  parcelaId: number | null;
  valorRepasse?: number;
}

export function RepassesPageContent() {
  const [refreshToken, setRefreshToken] = useState(0);
  const [declaracaoDialog, setDeclaracaoDialog] = useState<DialogState>({
    open: false,
    parcelaId: null
  });
  const [comprovanteDialog, setComprovanteDialog] = useState<DialogState>({
    open: false,
    parcelaId: null,
    valorRepasse: 0
  });

  const handleAnexarDeclaracao = (parcelaId: number) => {
    setDeclaracaoDialog({ open: true, parcelaId });
  };

  const handleRealizarRepasse = (parcelaId: number, valorRepasse: number) => {
    setComprovanteDialog({ open: true, parcelaId, valorRepasse });
  };

  const handleDialogSuccess = () => {
    setRefreshToken(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <RepassesPendentesList
        refreshToken={refreshToken}
        onAnexarDeclaracao={handleAnexarDeclaracao}
        onRealizarRepasse={handleRealizarRepasse}
      />

      {declaracaoDialog.parcelaId && (
        <UploadDeclaracaoDialog
          open={declaracaoDialog.open}
          onOpenChange={(open) => setDeclaracaoDialog(prev => ({ ...prev, open }))}
          parcelaId={declaracaoDialog.parcelaId}
          onSuccess={handleDialogSuccess}
        />
      )}

      {comprovanteDialog.parcelaId && (
        <UploadComprovanteDialog
          open={comprovanteDialog.open}
          onOpenChange={(open) => setComprovanteDialog(prev => ({ ...prev, open }))}
          parcelaId={comprovanteDialog.parcelaId}
          valorRepasse={comprovanteDialog.valorRepasse || 0}
          onSuccess={handleDialogSuccess}
        />
      )}
    </div>
  );
}
