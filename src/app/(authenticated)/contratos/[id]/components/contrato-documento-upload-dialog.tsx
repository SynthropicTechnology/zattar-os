'use client';

import * as React from 'react';
import { FileUploadDialogUnified } from '@/app/(authenticated)/documentos';
import { type Arquivo } from '@/app/(authenticated)/documentos';
import { actionVincularArquivoAoContrato } from '@/app/(authenticated)/pecas-juridicas/actions';

interface ContratoDocumentoUploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    contratoId: number;
    onSuccess?: () => void;
}

export function ContratoDocumentoUploadDialog({
    open,
    onOpenChange,
    contratoId,
    onSuccess,
}: ContratoDocumentoUploadDialogProps) {
    const handleFileUploaded = async (file: File, arquivo: Arquivo) => {
        const arquivoId = arquivo?.id;
        if (!arquivoId) {
            console.error('Dados do arquivo inválidos:', arquivo);
            throw new Error('ID do arquivo não retornado após upload');
        }

        const vinculoResult = await actionVincularArquivoAoContrato({
            contratoId,
            arquivoId: arquivoId,
        });

        if (!vinculoResult.success) {
            throw new Error(vinculoResult.message || 'Erro ao vincular arquivo ao contrato');
        }
    };

    return (
        <FileUploadDialogUnified
            open={open}
            onOpenChange={onOpenChange}
            onFileUploaded={handleFileUploaded}
            onSuccess={onSuccess}
            pastaId={null}
        />
    );
}
