'use client';

import * as React from 'react';
import { FileText, Plus, Upload } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ContratoDocumentosList } from '@/app/app/pecas-juridicas/components';
import { ContratoDocumentoUploadDialog } from './contrato-documento-upload-dialog';

interface ContratoDocumentosCardProps {
  contratoId: number;
  onGerarPeca?: () => void;
}

export function ContratoDocumentosCard({
  contratoId,
  onGerarPeca,
}: ContratoDocumentosCardProps) {
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const handleUploadSuccess = React.useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <FileText className="size-4" />
            Documentos e Peças Jurídicas
          </CardTitle>
          <CardAction>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setUploadDialogOpen(true)}>
                <Upload className="size-4 mr-1" />
                Novo Documento
              </Button>
              {onGerarPeca && (
                <Button variant="outline" size="sm" onClick={onGerarPeca}>
                  <Plus className="size-4 mr-1" />
                  Gerar Peça
                </Button>
              )}
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <ContratoDocumentosList key={refreshKey} contratoId={contratoId} />
        </CardContent>
      </Card>

      <ContratoDocumentoUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        contratoId={contratoId}
        onSuccess={handleUploadSuccess}
      />
    </>
  );
}
