'use client';

import { forwardRef, useImperativeHandle, useState, useEffect, useCallback } from 'react';
import { CapturaFormBase, validarCamposCaptura } from './captura-form-base';
import { CapturaResult, CapturaResultData } from './captura-result';
import { capturarCombinada } from '@/app/(authenticated)/captura/services/api-client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import type { CapturaFormHandle } from '@/app/(authenticated)/captura/types';

interface CombinadaFormProps {
  onSuccess?: () => void;
  onLoadingChange?: (isLoading: boolean) => void;
}

export const CombinadaForm = forwardRef<CapturaFormHandle, CombinadaFormProps>(
  function CombinadaForm({ onSuccess, onLoadingChange }, ref) {
    const [advogadoId, setAdvogadoId] = useState<number | null>(null);
    const [credenciaisSelecionadas, setCredenciaisSelecionadas] = useState<number[]>([]);
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

      setIsLoading(true);
      setResult({ success: null });

      try {
        const response = await capturarCombinada({
          advogado_id: advogadoId,
          credencial_ids: credenciaisSelecionadas,
        });

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
    }, [advogadoId, credenciaisSelecionadas, onSuccess]);

    // Expor método submit para o componente pai
    useImperativeHandle(ref, () => ({
      submit: handleCaptura,
      isLoading,
    }), [handleCaptura, isLoading]);

    return (
      <div className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            A captura unificada executa múltiplas capturas em uma única sessão autenticada:
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>Audiências Designadas (hoje até +1 ano)</li>
              <li>Audiências Realizadas (dia anterior)</li>
              <li>Audiências Canceladas (hoje até +1 ano)</li>
              <li>Expedientes No Prazo</li>
              <li>Expedientes Sem Prazo</li>
              <li>Perícias (todas as situações)</li>
              <li>Timeline e Partes de todos os processos únicos</li>
            </ul>
          </AlertDescription>
        </Alert>

        <CapturaFormBase
          advogadoId={advogadoId}
          credenciaisSelecionadas={credenciaisSelecionadas}
          onAdvogadoChange={setAdvogadoId}
          onCredenciaisChange={setCredenciaisSelecionadas}
        />

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
