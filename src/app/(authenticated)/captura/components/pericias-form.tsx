'use client';

import { forwardRef, useImperativeHandle, useState, useEffect, useCallback } from 'react';
import { CapturaFormBase, validarCamposCaptura } from './captura-form-base';
import { CapturaResult, CapturaResultData } from './captura-result';
import { capturarPericias } from '@/app/(authenticated)/captura/services/api-client';
import { SITUACAO_PERICIA_OPTIONS } from '@/app/(authenticated)/captura/constants';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { CapturaFormHandle } from '@/app/(authenticated)/captura/types';

interface PericiasFormProps {
  onSuccess?: () => void;
  onLoadingChange?: (isLoading: boolean) => void;
}

export const PericiasForm = forwardRef<CapturaFormHandle, PericiasFormProps>(
  function PericiasForm({ onSuccess, onLoadingChange }, ref) {
    const [advogadoId, setAdvogadoId] = useState<number | null>(null);
    const [credenciaisSelecionadas, setCredenciaisSelecionadas] = useState<number[]>([]);
    const [situacoesSelecionadas, setSituacoesSelecionadas] = useState<('S' | 'L' | 'C' | 'F' | 'P' | 'R')[]>(['S', 'L', 'P', 'R']);
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

    const handleToggleSituacao = (situacao: 'S' | 'L' | 'C' | 'F' | 'P' | 'R') => {
      setSituacoesSelecionadas(prev =>
        prev.includes(situacao)
          ? prev.filter(s => s !== situacao)
          : [...prev, situacao]
      );
    };

    const handleCaptura = useCallback(async () => {
      if (!validarCamposCaptura(advogadoId, credenciaisSelecionadas)) {
        setResult({
          success: false,
          error: 'Selecione um advogado e pelo menos uma credencial',
        });
        return;
      }

      if (situacoesSelecionadas.length === 0) {
        setResult({
          success: false,
          error: 'Selecione pelo menos uma situação de perícia',
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
        const response = await capturarPericias({
          advogado_id: advogadoId,
          credencial_ids: credenciaisSelecionadas,
          situacoes: situacoesSelecionadas,
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
    }, [advogadoId, credenciaisSelecionadas, situacoesSelecionadas, onSuccess]);

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
        >
          <div className="space-y-3">
            <Label>Situações das Perícias</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SITUACAO_PERICIA_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`situacao-${option.value}`}
                    checked={situacoesSelecionadas.includes(option.value)}
                    onCheckedChange={() => handleToggleSituacao(option.value)}
                  />
                  <Label
                    htmlFor={`situacao-${option.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Selecione as situações das perícias que deseja capturar
            </p>
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
