
'use client';

import { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { actionAnexarDeclaracao } from '../../actions/repasses';

interface UploadDeclaracaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parcelaId: number;
  onSuccess?: () => void;
}

export function UploadDeclaracaoDialog({ open, onOpenChange, parcelaId, onSuccess }: UploadDeclaracaoDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    try {
      setIsUploading(true);
      // NOTE: Here we would assign a real URL after uploading to storage.
      // Since no storage is configured, we pass a fake URL to the action to satisfy the process.
      const fakeUrl = `https://storage.example.com/declaracoes/${parcelaId}/${file.name}`;
      
      const response = await actionAnexarDeclaracao(parcelaId, fakeUrl);
      
      if (response.success) {
          toast.success('Declaração anexada (simulado).');
          onOpenChange(false);
          if (onSuccess) onSuccess();
      } else {
          toast.error(response.error);
      }
    } catch {
      toast.error('Erro no upload');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
         <DialogHeader>
            <DialogTitle>Anexar Declaração</DialogTitle>
            <DialogDescription>Upload da declaração assinada.</DialogDescription>
         </DialogHeader>
         <div className="space-y-4 py-4">
             <Input type="file" accept=".pdf,.jpg,.png" onChange={handleFileChange} disabled={isUploading} />
             {file && <div className="text-sm">{file.name}</div>}
         </div>
         <DialogFooter>
             <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
             <Button onClick={handleUpload} disabled={!file || isUploading}>
                 {isUploading ? 'Enviando...' : 'Anexar'}
             </Button>
         </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
