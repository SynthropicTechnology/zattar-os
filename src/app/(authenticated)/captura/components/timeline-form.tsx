'use client';

import { forwardRef, useImperativeHandle, useState, useMemo, useEffect, useCallback } from 'react';
import { CapturaFormBase, validarCamposCaptura } from './captura-form-base';
import { CapturaResult, CapturaResultData } from './captura-result';
import { capturarTimeline } from '../services/api-client';
import type { TimelineParams, FiltroDocumentosTimeline, CapturaFormHandle } from '../types';
import { grauCredencialToGrauTRT } from '../domain';
import { useCredenciais } from '@/app/(authenticated)/advogados';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FormDatePicker } from '@/components/ui/form-date-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronDown, Info } from 'lucide-react';

/**
 * Componente de formulário para captura de timeline de processo
 *
 * Permite capturar a timeline completa (movimentos e documentos) de um processo específico,
 * com opções de download de documentos e filtros avançados.
 */
interface TimelineFormProps {
  onSuccess?: () => void;
  onLoadingChange?: (isLoading: boolean) => void;
}

export const TimelineForm = forwardRef<CapturaFormHandle, TimelineFormProps>(
  function TimelineForm({ onSuccess, onLoadingChange }, ref) {
    // Estados do formulário base
    const [advogadoId, setAdvogadoId] = useState<number | null>(null);
    const [credenciaisSelecionadas, setCredenciaisSelecionadas] = useState<number[]>([]);

    // Estados específicos da timeline
    const [processoId, setProcessoId] = useState('');
    const [baixarDocumentos, setBaixarDocumentos] = useState(true);

    // Estados dos filtros avançados
    const [filtrosAbertos, setFiltrosAbertos] = useState(false);
    const [apenasAssinados, setApenasAssinados] = useState(true);
    const [apenasNaoSigilosos, setApenasNaoSigilosos] = useState(true);
    const [tiposDocumento, setTiposDocumento] = useState('');
    const [dataInicial, setDataInicial] = useState('');
    const [dataFinal, setDataFinal] = useState('');

    // Estados de controle
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{
      success: boolean | null;
      error?: string;
      data?: CapturaResultData;
    }>({ success: null });

    // Sincronizar estado de loading com o pai
    useEffect(() => {
      onLoadingChange?.(isLoading);
    }, [isLoading, onLoadingChange]);

    // Buscar credenciais do advogado selecionado
    const { credenciais } = useCredenciais(
      advogadoId ? { advogado_id: advogadoId, active: true } : { advogado_id: 0, active: true }
    );

    // Obter credencial selecionada (primeira da lista)
    const credencialSelecionada = useMemo(() => {
      if (credenciaisSelecionadas.length === 0) return null;
      return credenciais.find((c) => c.id === credenciaisSelecionadas[0]) || null;
    }, [credenciais, credenciaisSelecionadas]);

    /**
     * Validar formato do número do processo (apenas números)
     */
    const validarProcessoId = (valor: string): boolean => {
      // Aceitar apenas números
      return /^\d+$/.test(valor.trim());
    };

    /**
     * Handler para iniciar captura de timeline
     */
    const handleCaptura = useCallback(async () => {
      // Validar campos obrigatórios
      if (!validarCamposCaptura(advogadoId, credenciaisSelecionadas)) {
        setResult({
          success: false,
          error: 'Selecione um advogado e pelo menos uma credencial',
        });
        return;
      }

      if (!processoId.trim()) {
        setResult({
          success: false,
          error: 'Informe o número do processo',
        });
        return;
      }

      // Validar formato do número do processo
      if (!validarProcessoId(processoId)) {
        setResult({
          success: false,
          error: 'Número do processo deve conter apenas dígitos',
        });
        return;
      }

      if (!advogadoId) {
        setResult({ success: false, error: 'Advogado não selecionado' });
        return;
      }

      // Verificar se temos a credencial selecionada
      if (!credencialSelecionada) {
        setResult({
          success: false,
          error: 'Credencial não encontrada',
        });
        return;
      }

      setIsLoading(true);
      setResult({ success: null });

      try {
        // Montar filtro de documentos (apenas se baixar documentos estiver habilitado)
        let filtroDocumentos: FiltroDocumentosTimeline | undefined;

        if (baixarDocumentos) {
          filtroDocumentos = {
            apenasAssinados,
            apenasNaoSigilosos,
          };

          // Adicionar tipos se especificado
          if (tiposDocumento.trim()) {
            filtroDocumentos.tipos = tiposDocumento
              .split(',')
              .map((tipo) => tipo.trim())
              .filter((tipo) => tipo.length > 0);
          }

          // Adicionar datas se especificado
          if (dataInicial) {
            filtroDocumentos.dataInicial = new Date(dataInicial).toISOString();
          }
          if (dataFinal) {
            filtroDocumentos.dataFinal = new Date(dataFinal).toISOString();
          }
        }

        // Construir parâmetros usando dados da credencial selecionada
        const params: TimelineParams = {
          processoId: Number(processoId.trim()),
          trtCodigo: credencialSelecionada.tribunal as import('../types/trt-types').CodigoTRT,
          grau: grauCredencialToGrauTRT(credencialSelecionada.grau),
          advogadoId,
          baixarDocumentos,
          filtroDocumentos,
        };

        const response = await capturarTimeline(params);

        if (!response.success) {
          setResult({
            success: false,
            error: response.error || 'Erro ao capturar timeline',
          });
        } else {
          setResult({
            success: true,
            data: response.data,
          });
          onSuccess?.();
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        setResult({ success: false, error: errorMessage });
      } finally {
        setIsLoading(false);
      }
    }, [advogadoId, credenciaisSelecionadas, processoId, baixarDocumentos, apenasAssinados, apenasNaoSigilosos, tiposDocumento, dataInicial, dataFinal, credencialSelecionada, onSuccess]);

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
          {credencialSelecionada && (
            <Alert className="md:col-span-2">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Timeline será capturada usando:{' '}
                <strong>
                  {credencialSelecionada.tribunal} -{' '}
                  {credencialSelecionada.grau === '1' ? '1º Grau' : '2º Grau'}
                </strong>
              </AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:col-span-2">
            <div className="space-y-3">
              <Label htmlFor="processo-id">Número do Processo *</Label>
              <Input
                id="processo-id"
                placeholder="Ex: 2887163"
                value={processoId}
                onChange={(e) => setProcessoId(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Apenas números (ID do processo no PJE)
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="baixar-documentos"
                checked={baixarDocumentos}
                onCheckedChange={(checked) => setBaixarDocumentos(checked === true)}
                disabled={isLoading}
              />
              <Label
                htmlFor="baixar-documentos"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Baixar documentos (PDFs)
              </Label>
            </div>
            {baixarDocumentos && (
              <Collapsible open={filtrosAbertos} onOpenChange={setFiltrosAbertos} className="md:col-span-2">
                <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:underline">
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${filtrosAbertos ? 'rotate-180' : ''
                      }`}
                  />
                  Filtros Avançados
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="apenas-assinados"
                      checked={apenasAssinados}
                      onCheckedChange={(checked) => setApenasAssinados(checked === true)}
                      disabled={isLoading}
                    />
                    <Label
                      htmlFor="apenas-assinados"
                      className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Apenas documentos assinados
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="apenas-nao-sigilosos"
                      checked={apenasNaoSigilosos}
                      onCheckedChange={(checked) => setApenasNaoSigilosos(checked === true)}
                      disabled={isLoading}
                    />
                    <Label
                      htmlFor="apenas-nao-sigilosos"
                      className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Apenas documentos não sigilosos
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipos-documento" className="text-sm">
                      Tipos de Documento (separados por vírgula)
                    </Label>
                    <Input
                      id="tipos-documento"
                      placeholder="Ex: Certidão, Petição, Sentença"
                      value={tiposDocumento}
                      onChange={(e) => setTiposDocumento(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="data-inicial" className="text-sm">
                        Data Inicial
                      </Label>
                      <FormDatePicker
                        id="data-inicial"
                        value={dataInicial || undefined}
                        onChange={(v) => setDataInicial(v || '')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="data-final" className="text-sm">
                        Data Final
                      </Label>
                      <FormDatePicker
                        id="data-final"
                        value={dataFinal || undefined}
                        onChange={(v) => setDataFinal(v || '')}
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </CapturaFormBase>

        <CapturaResult
          success={result.success}
          error={result.error}
          data={result.data}
        />
      </div>
    );
  }
);
