'use client';

import * as React from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { actionUploadArquivoGenerico } from '../actions/arquivos-actions';
import type { Arquivo } from '../domain';

interface FileUploadDialogUnifiedProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    pastaId?: number | null;
    onSuccess?: () => void;
    onFileUploaded?: (file: File, result: Arquivo) => Promise<void>;
}

export function FileUploadDialogUnified({
    open,
    onOpenChange,
    pastaId,
    onSuccess,
    onFileUploaded,
}: FileUploadDialogUnifiedProps) {
    const [files, setFiles] = React.useState<File[]>([]);
    const [dragActive, setDragActive] = React.useState(false);
    const [uploading, setUploading] = React.useState(false);

    const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files) {
            handleFiles(e.target.files);
        }
    };

    const handleFiles = (fileList: FileList) => {
        setFiles(prevFiles => [...prevFiles, ...Array.from(fileList)]);
    };

    const removeFile = (index: number) => {
        setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (files.length === 0) return;

        setUploading(true);

        try {
            let successCount = 0;
            let errorCount = 0;

            for (const file of files) {
                const formData = new FormData();
                formData.append('file', file);
                if (pastaId) formData.append('pasta_id', pastaId.toString());

                const result = await actionUploadArquivoGenerico(formData);

                if (result.success && result.data) {
                    if (onFileUploaded) {
                        try {
                            await onFileUploaded(file, result.data);
                        } catch (error) {
                            console.error(`Erro no processamento pós-upload de ${file.name}:`, error);
                            // Opcional: considerar como falha ou apenas logar
                            // errorCount++;
                            // continue;
                        }
                    }
                    successCount++;
                } else {
                    errorCount++;
                    console.error(`Erro ao fazer upload de ${file.name}:`, result.error);
                }
            }

            if (successCount > 0) {
                toast.success(`${successCount} arquivo(s) enviado(s) com sucesso`);
            }
            if (errorCount > 0) {
                toast.error(`${errorCount} arquivo(s) falharam no upload`);
            }

            setFiles([]);
            onOpenChange(false);

            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            console.error('Erro ao fazer upload:', error);
            toast.error(error instanceof Error ? error.message : 'Erro ao fazer upload');
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        if (!uploading) {
            setFiles([]);
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Upload de Arquivos</DialogTitle>
                    <DialogDescription>
                        Arraste e solte arquivos aqui ou clique para selecionar
                    </DialogDescription>
                </DialogHeader>

                <div
                    className={`mt-2 flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10 transition-colors dark:border-gray-100/25 ${dragActive ? 'bg-muted' : ''
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <div className="text-center">
                        <Upload className="mx-auto h-10 w-10 opacity-25" aria-hidden="true" />
                        <div className="mt-4 flex text-sm leading-none">
                            <Label htmlFor="file-upload-unified" className="relative cursor-pointer text-primary">
                                <span>Selecionar arquivos</span>
                                <Input
                                    id="file-upload-unified"
                                    name="file-upload"
                                    type="file"
                                    className="sr-only h-auto p-0"
                                    onChange={handleChange}
                                    multiple
                                    disabled={uploading}
                                />
                            </Label>
                            <p className="pl-1 text-muted-foreground">ou arraste e solte</p>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                            PDF, DOC, XLS, imagens e mais (até 50MB)
                        </p>
                    </div>
                </div>

                {files.length > 0 && (
                    <div className="mt-4">
                        <h4 className="text-sm font-medium">Arquivos Selecionados ({files.length})</h4>
                        <ul className="mt-2 max-h-40 divide-y overflow-auto rounded-md border">
                            {files.map((file, index) => (
                                <li
                                    key={index}
                                    className="flex items-center justify-between py-2 pl-4 pr-2 text-sm leading-6"
                                >
                                    <div className="flex min-w-0 flex-1 items-center">
                                        <div className="flex min-w-0 flex-1 gap-2">
                                            <span className="truncate font-medium">{file.name}</span>
                                            <span className="shrink-0 text-muted-foreground">
                                                {(file.size / 1024).toFixed(1)} KB
                                            </span>
                                        </div>
                                    </div>
                                    <div className="shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeFile(index)}
                                            disabled={uploading}
                                        >
                                            <X className="h-4 w-4" />
                                            <span className="sr-only">Remover arquivo</span>
                                        </Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={uploading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleUpload} disabled={files.length === 0 || uploading}>
                        {uploading ? 'Enviando...' : `Enviar ${files.length} arquivo(s)`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
