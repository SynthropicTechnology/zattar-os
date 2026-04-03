'use client';

import { forwardRef, useImperativeHandle, useState, useEffect, useCallback } from 'react';
import { CapturaFormBase, validarCamposCaptura } from './captura-form-base';
import { CapturaResult, CapturaResultData } from './captura-result';
import { capturarAudiencias } from '@/app/(authenticated)/captura/services/api-client';
import { STATUS_AUDIENCIA_OPTIONS } from '@/app/(authenticated)/captura/constants';
import { Label } from '@/components/ui/label';
import { FormDatePicker } from '@/components/ui/form-date-picker';
import { Checkbox } from '@/components/ui/checkbox';
import type { StatusAudiencia, CapturaFormHandle } from '@/app/(authenticated)/captura/types';

const ORDEM_STATUS: StatusAudiencia[] = ['C', 'M', 'F'];

interface AudienciasFormProps {
  onSuccess?: () => void;
  onLoadingChange?: (isLoading: boolean) => void;
}

export const AudienciasForm = forwardRef<CapturaFormHandle, AudienciasFormProps>(
  function AudienciasForm({ onSuccess, onLoadingChange }, ref) {
    const [advogadoId, setAdvogadoId] = useState<number | null>(null);
    const [credenciaisSelecionadas, setCredenciaisSelecionadas] = useState<number[]>([]);
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [statusAudiencias, setStatusAudiencias] = useState<StatusAudiencia[]>(['M']);
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

    const toggleStatus = (valor: StatusAudiencia) => {
      setStatusAudiencias((prev) => {
        const jaSelecionado = prev.includes(valor);

        // Impedir desmarcar o último
        if (jaSelecionado && prev.length === 1) {
          return prev;
        }

        const atualizado = jaSelecionado
          ? prev.filter((s) => s !== valor)
          : [...prev, valor];

        return atualizado.sort(
          (a, b) => ORDEM_STATUS.indexOf(a) - ORDEM_STATUS.indexOf(b)
        );
      });
    };

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
        const params: {
          advogado_id: number;
          credencial_ids: number[];
          dataInicio?: string;
          dataFim?: string;
          statusAudiencias: StatusAudiencia[];
        } = {
          advogado_id: advogadoId,
          credencial_ids: credenciaisSelecionadas,
          statusAudiencias,
        };

        if (dataInicio) params.dataInicio = dataInicio;
        if (dataFim) params.dataFim = dataFim;

        const response = await capturarAudiencias(params);

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
    }, [advogadoId, credenciaisSelecionadas, dataInicio, dataFim, statusAudiencias, onSuccess]);

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="statusAudiencia">Status da Audiência</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {STATUS_AUDIENCIA_OPTIONS.map((opcao) => (
                  <label
                    key={opcao.value}
                    className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm"
                  >
                    <Checkbox
                      id={`status-${opcao.value}`}
                      checked={statusAudiencias.includes(opcao.value)}
                      onCheckedChange={() => toggleStatus(opcao.value)}
                    />
                    <span className="flex-1">{opcao.label}</span>
                  </label>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Os status selecionados são executados sequencialmente na mesma sessão.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data Início (opcional)</Label>
              <FormDatePicker
                id="dataInicio"
                value={dataInicio || undefined}
                onChange={(v) => setDataInicio(v || '')}
              />
              <p className="text-sm text-muted-foreground">
                Se não informada, será usada a data de hoje
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataFim">Data Fim (opcional)</Label>
              <FormDatePicker
                id="dataFim"
                value={dataFim || undefined}
                onChange={(v) => setDataFim(v || '')}
              />
              <p className="text-sm text-muted-foreground">
                Se não informada, será usada hoje + 365 dias
              </p>
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
