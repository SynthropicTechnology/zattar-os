
'use client';

import * as React from 'react';
import { DialogFormShell } from '@/components/shared/dialog-shell';
import { Combobox } from '@/components/ui/combobox';
import { actionListarAcervoPaginado, type GrauAcervo } from '@/app/app/acervo';
import { AcordoForm } from './acordo-form';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { Acervo } from '@/app/app/acervo';

interface NovaObrigacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  dadosIniciais?: {
    processo_id: number;
    trt: string;
    grau: string;
    numero_processo: string;
  };
}

export function NovaObrigacaoDialog({ open, onOpenChange, onSuccess, dadosIniciais }: NovaObrigacaoDialogProps) {
  const [trt, setTrt] = React.useState('');
  const [grau, setGrau] = React.useState('');
  const [processoId, setProcessoId] = React.useState<string[]>([]);
  const [buscaProcesso, setBuscaProcesso] = React.useState('');
  const [debouncedBusca, setDebouncedBusca] = React.useState('');
  const [processos, setProcessos] = React.useState<Acervo[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  // Debounce da busca
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedBusca(buscaProcesso), 400);
    return () => clearTimeout(timer);
  }, [buscaProcesso]);

  // Buscar processos quando os parâmetros mudarem
  React.useEffect(() => {
    const shouldFetch = open && !dadosIniciais && debouncedBusca.length >= 3;

    if (!shouldFetch) {
      setProcessos([]);
      return;
    }

    const fetchProcessos = async () => {
      setIsLoading(true);
      try {
        const result = await actionListarAcervoPaginado({
          trt: trt || undefined,
          grau: (grau as GrauAcervo) || undefined,
          busca: debouncedBusca,
          limite: 50
        });

        if (result.success && result.data) {
          setProcessos((result.data as { processos: Acervo[] }).processos || []);
        } else {
          setProcessos([]);
        }
      } catch (error) {
        console.error('Erro ao buscar processos:', error);
        setProcessos([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProcessos();
  }, [open, dadosIniciais, trt, grau, debouncedBusca]);

  const handleClose = () => {
    onOpenChange(false);
    setTrt('');
    setGrau('');
    setProcessoId([]);
    setBuscaProcesso('');
    setDebouncedBusca('');
    setProcessos([]);
  };

  const selectedProcessoId = dadosIniciais?.processo_id || (processoId.length > 0 ? Number(processoId[0]) : undefined);

  return (
    <DialogFormShell
      open={open}
      onOpenChange={handleClose}
      title="Nova Obrigação"
      maxWidth="3xl"
      hideFooter
    >
      <div className="space-y-6 px-6 py-5 md:px-8 md:py-6">
        {!selectedProcessoId && (
          <div className="space-y-5 rounded-lg border bg-muted/20 p-4 md:p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tribunal</Label>
                <Select value={trt} onValueChange={setTrt}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {Array.from({length: 24}).map((_, i) => (
                      <SelectItem key={`TRT${i+1}`} value={`TRT${i+1}`}>TRT{i+1}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Grau</Label>
                <Select value={grau} onValueChange={setGrau}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primeiro_grau">1º Grau</SelectItem>
                    <SelectItem value="segundo_grau">2º Grau</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Buscar Processo</Label>
              <Input
                placeholder="Digite para buscar..."
                value={buscaProcesso}
                onChange={e => setBuscaProcesso(e.target.value)}
                className="w-full"
              />
              {isLoading && <span className="text-xs text-muted-foreground">Buscando...</span>}
              {debouncedBusca.length >= 3 && !isLoading && (
                <Combobox
                  options={processos.map(p => ({
                    value: p.id.toString(),
                    label: `${p.numero_processo} - ${p.nome_parte_autora} vs ${p.nome_parte_re}`
                  }))}
                  value={processoId}
                  onValueChange={setProcessoId}
                  placeholder="Selecione o processo..."
                />
              )}
              {debouncedBusca.length >= 3 && !isLoading && processos.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Nenhum processo encontrado. Tente ajustar o tribunal, grau ou termo de busca.
                </p>
              )}
            </div>
          </div>
        )}

        {selectedProcessoId ? (
          <div className="rounded-lg border bg-background p-4 md:p-5">
            <AcordoForm
              processoId={selectedProcessoId}
              onSuccess={() => { onSuccess(); handleClose(); }}
              onCancel={handleClose}
            />
          </div>
        ) : (
          <div className="rounded-lg border border-dashed bg-muted/10 py-10 text-center text-sm text-muted-foreground">
            Selecione um processo para continuar
          </div>
        )}
      </div>
    </DialogFormShell>
  );
}
