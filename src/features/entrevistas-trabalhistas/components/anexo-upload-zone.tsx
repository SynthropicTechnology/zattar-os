'use client';

import * as React from 'react';
import { Upload, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEntrevista } from '../hooks/use-entrevista';

interface AnexoUploadZoneProps {
  entrevistaId: number;
  contratoId: number;
  modulo: string;
}

const TIPOS_ANEXO = [
  { value: 'audio_relato', label: 'Audio' },
  { value: 'documento', label: 'Documento' },
  { value: 'imagem', label: 'Imagem' },
  { value: 'video', label: 'Video' },
] as const;

export function AnexoUploadZone({ entrevistaId, contratoId, modulo }: AnexoUploadZoneProps) {
  const { uploadArquivoAnexo, isLoading } = useEntrevista();
  const [tipoAnexo, setTipoAnexo] = React.useState<string>('documento');
  const [descricao, setDescricao] = React.useState('');
  const [arquivo, setArquivo] = React.useState<File | null>(null);
  const [mensagem, setMensagem] = React.useState<string | null>(null);

  const handleUpload = async () => {
    if (!arquivo) {
      setMensagem('Selecione um arquivo antes de enviar.');
      return;
    }

    const ok = await uploadArquivoAnexo(
      entrevistaId,
      contratoId,
      modulo,
      arquivo,
      tipoAnexo,
      descricao,
    );

    if (ok) {
      setMensagem('Anexo enviado com sucesso.');
      setDescricao('');
      setArquivo(null);
      return;
    }

    setMensagem('Nao foi possivel enviar o anexo. Verifique tipo/tamanho e tente novamente.');
  };

  return (
    <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
      <div className="flex items-start gap-2">
        <Paperclip className="mt-0.5 h-4 w-4 text-muted-foreground" />
        <div>
          <h4 className="text-sm font-semibold">Anexos de apoio da etapa</h4>
          <p className="text-xs text-muted-foreground">
            Envie audios, documentos, imagens ou videos relacionados a esta pergunta.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`tipo-anexo-${modulo}`}>Tipo de anexo</Label>
          <Select value={tipoAnexo} onValueChange={setTipoAnexo}>
            <SelectTrigger id={`tipo-anexo-${modulo}`}>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_ANEXO.map((tipo) => (
                <SelectItem key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`arquivo-anexo-${modulo}`}>Arquivo</Label>
          <Input
            id={`arquivo-anexo-${modulo}`}
            type="file"
            accept="audio/*,image/*,video/*,.pdf,.doc,.docx"
            onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`descricao-anexo-${modulo}`}>Descricao (opcional)</Label>
        <Textarea
          id={`descricao-anexo-${modulo}`}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Ex: print do bloqueio da plataforma, audio com relato de assedio, TRCT..."
          rows={3}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Limite de 25MB por arquivo.
        </p>
        <Button type="button" onClick={handleUpload} disabled={isLoading}>
          <Upload className="mr-2 h-4 w-4" />
          {isLoading ? 'Enviando...' : 'Enviar anexo'}
        </Button>
      </div>

      {mensagem && <p className="text-xs text-muted-foreground">{mensagem}</p>}
    </div>
  );
}
