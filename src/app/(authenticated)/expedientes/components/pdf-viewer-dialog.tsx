'use client';

import * as React from 'react';
import { Loader2, FileText } from 'lucide-react';
import { actionGerarUrlDownload } from '@/app/(authenticated)/documentos';
import { DialogFormShell } from '@/components/shared/dialog-shell';
import { Button } from '@/components/ui/button';

interface PdfViewerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Chave (key) do arquivo no Backblaze B2 */
    fileKey: string | null;
    documentTitle?: string;
}

export function PdfViewerDialog({
    open,
    onOpenChange,
    fileKey,
    documentTitle = 'Documento',
}: PdfViewerDialogProps) {
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [presignedUrl, setPresignedUrl] = React.useState<string | null>(null);

    // Gerar URL assinada quando o diálogo abrir
    React.useEffect(() => {
        if (open && fileKey) {
            setIsLoading(true);
            setError(null);
            setPresignedUrl(null);

            // Buscar URL assinada
            actionGerarUrlDownload(fileKey)
                .then((result) => {
                    if (result.success && result.data) {
                        setPresignedUrl(result.data.url);
                    } else {
                        throw new Error(result.error || 'Erro ao gerar URL de acesso ao documento');
                    }
                })
                .catch((err) => {
                    console.error('Erro ao buscar URL assinada:', err);
                    setError('Erro ao gerar acesso ao documento. Tente novamente.');
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else if (open && !fileKey) {
            setError('Documento não disponível');
            setIsLoading(false);
        }
    }, [open, fileKey]);

    const handleIframeLoad = () => {
        setIsLoading(false);
    };

    const handleIframeError = () => {
        setIsLoading(false);
        setError('Erro ao carregar o documento. Verifique se o arquivo existe.');
    };

    const footerButton = (
        <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
        </Button>
    );

    if (!fileKey) {
        return (
            <DialogFormShell
                open={open}
                onOpenChange={onOpenChange}
                title={documentTitle}
                maxWidth="4xl"
                footer={footerButton}
            >
                <div className="flex flex-col items-center justify-center flex-1 gap-4 h-[60vh] min-h-100">
                    <FileText className="h-16 w-16 text-muted-foreground" />
                    <p className="text-muted-foreground">Documento não disponível</p>
                </div>
            </DialogFormShell>
        );
    }

    return (
        <DialogFormShell
            open={open}
            onOpenChange={onOpenChange}
            title={documentTitle}
            maxWidth="4xl"
            footer={footerButton}
        >
            <div className="relative w-full h-[75vh] min-h-125 border rounded-md overflow-hidden bg-muted/10">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}

                {error ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                        <FileText className="h-16 w-16 text-destructive" />
                        <p className="text-destructive text-center">{error}</p>
                    </div>
                ) : (
                    presignedUrl && (
                        <iframe
                            src={`${presignedUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                            className="w-full h-full"
                            title={documentTitle}
                            onLoad={handleIframeLoad}
                            onError={handleIframeError}
                        />
                    )
                )}
            </div>
        </DialogFormShell>
    );
}
