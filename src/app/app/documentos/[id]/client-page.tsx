"use client";

import * as React from 'react';
import { useParams } from 'next/navigation';
import { DocumentEditor } from '@/app/app/documentos';

export function DocumentoEditorClient() {
  const params = useParams<{ id: string }>();
  const documentoId = React.useMemo(() => parseInt(params.id, 10), [params.id]);

  if (isNaN(documentoId)) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">ID inválido</h2>
          <p className="text-muted-foreground mt-2">O ID do documento fornecido não é válido.</p>
        </div>
      </div>
    );
  }

  return <DocumentEditor documentoId={documentoId} />;
}
