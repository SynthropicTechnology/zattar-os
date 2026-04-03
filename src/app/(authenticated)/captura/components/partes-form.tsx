'use client';

import { forwardRef, useImperativeHandle, useMemo, useState, useEffect, useCallback } from 'react';
import { CapturaFormBase, validarCamposCaptura } from './captura-form-base';
import { CapturaResult, CapturaResultData } from './captura-result';
import { capturarPartes } from '@/app/(authenticated)/captura/services/api-client';
import type { CapturaPartesParams, Credencial, CapturaFormHandle } from '@/app/(authenticated)/captura/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const parseListaProcessos = (value: string): string[] => {
  if (!value) return [];
  const items = value
    .split(/[\n,;]+/)
    .map((item) => item.trim().replace(/\s+/g, ''))
    .filter((item) => item.length > 0);
  return Array.from(new Set(items));
};

const normalizeNumeroProcesso = (value: string): string => value.trim().replace(/\s+/g, '');

interface PartesFormProps {
  onSuccess?: () => void;
  onLoadingChange?: (isLoading: boolean) => void;
}

export const PartesForm = forwardRef<CapturaFormHandle, PartesFormProps>(
  function PartesForm({ onSuccess, onLoadingChange }, ref) {
    const [advogadoId, setAdvogadoId] = useState<number | null>(null);
    const [credenciaisSelecionadas, setCredenciaisSelecionadas] = useState<number[]>([]);
    const [credenciaisDisponiveis, setCredenciaisDisponiveis] = useState<Credencial[]>([]);
    const [numeroProcesso, setNumeroProcesso] = useState('');
    const [numerosProcessoTexto, setNumerosProcessoTexto] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{
      success: boolean | null;
      error?: string;
      data?: CapturaResultData;
      capture_id?: number;
    }>({ success: null });

    // Sincronizar estado de loading com o pai
    useEffect(() => {
      onLoadingChange?.(isLoading);
    }, [isLoading, onLoadingChange]);

    const numerosProcesso = useMemo(() => parseListaProcessos(numerosProcessoTexto), [numerosProcessoTexto]);
    const numeroProcessoUnico = useMemo(() => normalizeNumeroProcesso(numeroProcesso), [numeroProcesso]);
    const totalProcessosManuais = useMemo(() => {
      const conjunto = new Set<string>(numerosProcesso);
      if (numeroProcessoUnico) {
        conjunto.add(numeroProcessoUnico);
      }
      return conjunto.size;
    }, [numerosProcesso, numeroProcessoUnico]);

    const credSelecionadasDetalhes = useMemo(
      () => credenciaisDisponiveis.filter((credencial) => credenciaisSelecionadas.includes(credencial.id)),
      [credenciaisDisponiveis, credenciaisSelecionadas]
    );

    const trtsDerivados = useMemo(
      () => Array.from(new Set(credSelecionadasDetalhes.map((cred) => cred.tribunal))),
      [credSelecionadasDetalhes]
    );

    const grausDerivados = useMemo(
      () => Array.from(new Set(credSelecionadasDetalhes.map((cred) => cred.grau))),
      [credSelecionadasDetalhes]
    );

    const handleCaptura = useCallback(async () => {
      if (!validarCamposCaptura(advogadoId, credenciaisSelecionadas)) {
        setResult({
          success: false,
          error: 'Selecione um advogado e pelo menos uma credencial',
        });
        return;
      }

      if (!advogadoId) {
        setResult({ success: false, error: 'Advogado não selecionado' });
        return;
      }

      const possuiFiltros =
        trtsDerivados.length > 0 ||
        grausDerivados.length > 0 ||
        totalProcessosManuais > 0;

      if (!possuiFiltros) {
        setResult({
          success: false,
          error: 'Selecione pelo menos uma credencial válida ou informe números de processo para iniciar a captura.',
        });
        return;
      }

      const payload: CapturaPartesParams = {
        advogado_id: advogadoId,
        credencial_ids: credenciaisSelecionadas,
      };

      if (trtsDerivados.length > 0) {
        payload.trts = trtsDerivados as import('../types/trt-types').CodigoTRT[];
      }
      if (grausDerivados.length > 0) {
        payload.graus = grausDerivados as import('../types/trt-types').GrauTRT[];
      }
      if (numeroProcessoUnico) {
        payload.numero_processo = numeroProcessoUnico;
      }
      if (numerosProcesso.length > 0) {
        payload.numeros_processo = numerosProcesso;
      }

      setIsLoading(true);
      setResult({ success: null });

      try {
        const response = await capturarPartes(payload);

        if (!response.success) {
          setResult({
            success: false,
            error: response.error || 'Erro ao iniciar captura',
          });
        } else {
          setResult({
            success: true,
            data: response.data,
            capture_id: response.capture_id,
          });
          onSuccess?.();
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        setResult({ success: false, error: errorMessage });
      } finally {
        setIsLoading(false);
      }
    }, [advogadoId, credenciaisSelecionadas, trtsDerivados, grausDerivados, numeroProcessoUnico, numerosProcesso, totalProcessosManuais, onSuccess]);

    // Expor método submit para o componente pai
    useImperativeHandle(ref, () => ({
      submit: handleCaptura,
      isLoading,
    }), [handleCaptura, isLoading]);

    return (
      <div className="space-y-6">
        <CapturaFormBase
          advogadoId={advogadoId}
          credenciaisSelecionadas={credenciaisSelecionadas}
          onAdvogadoChange={setAdvogadoId}
          onCredenciaisChange={setCredenciaisSelecionadas}
          onCredenciaisDisponiveisChange={setCredenciaisDisponiveis}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {credSelecionadasDetalhes.length > 0 && (
              <div className="space-y-2 md:col-span-2">
                <Label>Escopo da captura</Label>
                <div className="rounded-md border border-dashed border-border/60 p-3 text-xs text-muted-foreground space-y-1">
                  <p>
                    Tribunais (TRTs) incluídos: <span className="font-medium text-foreground">{trtsDerivados.join(', ') || '-'}</span>
                  </p>
                  <p>
                    Graus considerados: <span className="font-medium text-foreground">{grausDerivados.join(', ') || '-'}</span>
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Os filtros acima são derivados automaticamente das credenciais selecionadas.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="numeroProcesso">Número do processo (único)</Label>
              <Input
                id="numeroProcesso"
                placeholder="0012345-67.2024.5.03.0001"
                value={numeroProcesso}
                onChange={(event) => setNumeroProcesso(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Utilize este campo para capturar as partes de um processo específico.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numerosLista">Lista de processos</Label>
              <Textarea
                id="numerosLista"
                placeholder="Cole um número por linha ou separados por vírgula"
                rows={6}
                value={numerosProcessoTexto}
                onChange={(event) => setNumerosProcessoTexto(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Aceita múltiplos números de processos. Espaços e duplicados são ignorados automaticamente.
              </p>
              {totalProcessosManuais > 0 && (
                <p className="text-xs text-muted-foreground">
                  Processos especificados manualmente: <span className="font-medium">{totalProcessosManuais}</span>
                </p>
              )}
            </div>
          </div>
        </CapturaFormBase>

        <CapturaResult
          success={result.success}
          error={result.error}
          data={result.data}
          captureId={result.capture_id}
        />
      </div>
    );
  }
);
