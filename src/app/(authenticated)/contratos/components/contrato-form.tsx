'use client';

/**
 * CONTRATOS FEATURE - ContratoForm
 *
 * Formulário de Contrato com Server Actions.
 * Implementa validação client-side e integração com useActionState (React 19).
 */

import * as React from 'react';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { FormDatePicker } from '@/components/ui/form-date-picker';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ComboboxOption } from '@/components/ui/combobox';
import { ServerCombobox } from '@/components/ui/server-combobox';
import { cn } from '@/lib/utils';
import { todayDateString, toDateString } from '@/lib/date-utils';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { actionCriarContrato, actionAtualizarContrato, type ActionResult } from '../actions';
import type { Contrato, TipoContrato, TipoCobranca, StatusContrato, PapelContratual } from '../domain';
import type { ClienteInfo } from '../types';
import {
  TIPO_CONTRATO_LABELS,
  TIPO_COBRANCA_LABELS,
  STATUS_CONTRATO_LABELS,
  PAPEL_CONTRATUAL_LABELS,
} from '../domain';
import { actionListarSegmentos, type Segmento } from '../actions';
import { actionBuscarPartesContrariasParaCombobox } from '@/app/(authenticated)/partes/actions/partes-contrarias-actions';
import { actionBuscarClientesParaCombobox } from '@/app/(authenticated)/partes/actions/clientes-actions';
import { DialogFormShell } from '@/components/shared/dialog-shell';

// =============================================================================
// TIPOS E CONSTANTES
// =============================================================================

interface ContratoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  contrato?: Contrato;
  mode?: 'create' | 'edit';
  clientesOptions?: ClienteInfo[]; // Opcional - agora usa server-side search
  partesContrariasOptions?: ClienteInfo[]; // Opcional - agora usa server-side search
  usuariosOptions?: ClienteInfo[];
}

const INITIAL_FORM_STATE = {
  segmentoId: '' as string,
  tipoContrato: '' as TipoContrato | '',
  tipoCobranca: '' as TipoCobranca | '',
  clienteId: '' as string,
  papelClienteNoContrato: '' as PapelContratual | '',
  partesContrariasIds: [] as string[],
  status: 'em_contratacao' as StatusContrato,
  cadastradoEm: todayDateString(),
  responsavelId: '' as string,
  observacoes: '' as string,
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ContratoForm({
  open,
  onOpenChange,
  onSuccess,
  contrato,
  mode = 'create',
  clientesOptions: _clientesOptions = [],
  partesContrariasOptions: _partesContrariasOptions,
  usuariosOptions = [],
}: ContratoFormProps) {
  const isEditMode = mode === 'edit' && contrato;
  const [formData, setFormData] = React.useState(INITIAL_FORM_STATE);
  const [segments, setSegments] = React.useState<Segmento[]>([]);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});
  const [initialPartesContrariasOptions, setInitialPartesContrariasOptions] = React.useState<ComboboxOption[]>([]);
  const [initialClienteOptions, setInitialClienteOptions] = React.useState<ComboboxOption[]>([]);
  const formRef = React.useRef<HTMLFormElement>(null);

  // Server Action com useActionState
  const initialState: ActionResult | null = null;

  const boundAction = React.useCallback(
    async (prevState: ActionResult | null, formData: FormData) => {
      if (isEditMode && contrato) {
        return actionAtualizarContrato(contrato.id, prevState, formData);
      }
      return actionCriarContrato(prevState, formData);
    },
    [isEditMode, contrato]
  );

  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  // Efeito para tratar resultado da action
  React.useEffect(() => {
    if (state) {
      if (state.success) {
        toast.success(state.message);
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(state.message);
        if (state.errors) {
          setFieldErrors(state.errors);
        }
      }
    }
  }, [state, onOpenChange, onSuccess]);

  // Fetch segments
  React.useEffect(() => {
    async function fetchSegments() {
      const result = await actionListarSegmentos();
      if (result.success) {
        // Filtrar apenas segmentos ativos
        const ativos = (result.data || []).filter((s) => s.ativo);
        setSegments(ativos);
      } else {
        toast.error('Erro ao carregar segmentos: ' + result.error);
      }
    }
    fetchSegments();
  }, []);

  // Reset ao fechar ou inicializar com dados do contrato
  React.useEffect(() => {
    if (!open) {
      setFormData(INITIAL_FORM_STATE);
      setFieldErrors({});
      setInitialPartesContrariasOptions([]);
      setInitialClienteOptions([]);
    } else if (isEditMode && contrato) {
      // Extrair IDs e nomes das partes contrárias para inicialização
      const partesContrariasDados = contrato.partes
        ? contrato.partes.filter(p => p.tipoEntidade === 'parte_contraria')
        : [];
      const partesContrariasIds = partesContrariasDados.map(p => String(p.entidadeId));

      // Converter data para formato YYYY-MM-DD
      const formatarDataParaInput = (dataStr: string | null | undefined): string => {
        if (!dataStr) return todayDateString();
        // Se já está no formato YYYY-MM-DD, retornar diretamente
        if (/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) return dataStr;
        // Se é uma data ISO completa, extrair apenas a parte da data
        const parsed = new Date(dataStr);
        if (isNaN(parsed.getTime())) return todayDateString();
        return toDateString(parsed);
      };

      // Criar opções iniciais para partes contrárias com nomes
      const initialPartesOptions = partesContrariasDados.map(p => ({
        value: String(p.entidadeId),
        label: p.nomeSnapshot || `ID: ${p.entidadeId}`,
      }));
      setInitialPartesContrariasOptions(initialPartesOptions);

      // Extrair dados do cliente para inicialização
      const clienteDados = contrato.partes?.find(p => p.tipoEntidade === 'cliente');
      if (clienteDados) {
        setInitialClienteOptions([{
          value: String(clienteDados.entidadeId),
          label: clienteDados.nomeSnapshot || `ID: ${clienteDados.entidadeId}`,
        }]);
      }

      setFormData({
        segmentoId: contrato.segmentoId ? String(contrato.segmentoId) : '',
        tipoContrato: contrato.tipoContrato,
        tipoCobranca: contrato.tipoCobranca,
        clienteId: String(contrato.clienteId),
        papelClienteNoContrato: contrato.papelClienteNoContrato,
        partesContrariasIds: partesContrariasIds,
        status: contrato.status,
        cadastradoEm: formatarDataParaInput(contrato.cadastradoEm),
        responsavelId: contrato.responsavelId ? String(contrato.responsavelId) : '',
        observacoes: contrato.observacoes || '',
      });
    }
  }, [open, isEditMode, contrato]);

  const handleSubmit = () => {
    // Validação básica client-side
    const errors: Record<string, string[]> = {};

    if (!formData.segmentoId) {
      errors.segmentoId = ['Segmento é obrigatório'];
    }
    if (!formData.tipoContrato) {
      errors.tipoContrato = ['Tipo de contrato é obrigatório'];
    }
    if (!formData.tipoCobranca) {
      errors.tipoCobranca = ['Tipo de cobrança é obrigatório'];
    }
    if (!formData.clienteId) {
      errors.clienteId = ['Cliente é obrigatório'];
    }
    if (!formData.papelClienteNoContrato) {
      errors.papelClienteNoContrato = ['Papel do cliente é obrigatório'];
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setFieldErrors({});
    formRef.current?.requestSubmit(); // Dispara o action do form
  };

  const getFieldError = (field: string) => fieldErrors[field]?.[0];

  return (
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEditMode ? 'Editar Contrato' : 'Novo Contrato'}
      maxWidth="lg"
      footer={
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="ml-auto"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isEditMode ? 'Salvando...' : 'Criando...'}
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              {isEditMode ? 'Salvar Alterações' : 'Criar Contrato'}
            </>
          )}
        </Button>
      }
    >
      <form ref={formRef} action={formAction} className="space-y-4">
        {/* Linha 1: Tipo de Contrato + Tipo de Cobrança */}
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="tipoContrato">
              Tipo de Contrato <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.tipoContrato}
              onValueChange={(value) => setFormData(prev => ({ ...prev, tipoContrato: value as TipoContrato }))}
            >
              <SelectTrigger id="tipoContrato" className={cn('w-full', getFieldError('tipoContrato') && 'border-destructive')}>
                <SelectValue placeholder="Selecione o tipo..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TIPO_CONTRATO_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="tipoContrato" value={formData.tipoContrato} />
            {getFieldError('tipoContrato') && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {getFieldError('tipoContrato')}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tipoCobranca">
              Tipo de Cobrança <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.tipoCobranca}
              onValueChange={(value) => setFormData(prev => ({ ...prev, tipoCobranca: value as TipoCobranca }))}
            >
              <SelectTrigger id="tipoCobranca" className={cn('w-full', getFieldError('tipoCobranca') && 'border-destructive')}>
                <SelectValue placeholder="Selecione o tipo..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TIPO_COBRANCA_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="tipoCobranca" value={formData.tipoCobranca} />
            {getFieldError('tipoCobranca') && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {getFieldError('tipoCobranca')}
              </p>
            )}
          </div>
        </div>

        {/* Linha 2: Segmento + Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="segmentoId">
              Segmento <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.segmentoId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, segmentoId: value }))}
            >
              <SelectTrigger id="segmentoId" className={cn('w-full', getFieldError('segmentoId') && 'border-destructive')}>
                <SelectValue placeholder="Selecione o segmento..." />
              </SelectTrigger>
              <SelectContent>
                {segments.map((segmento) => (
                  <SelectItem key={segmento.id} value={String(segmento.id)}>
                    {segmento.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="segmentoId" value={formData.segmentoId} />
            {getFieldError('segmentoId') && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {getFieldError('segmentoId')}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as StatusContrato }))}
            >
              <SelectTrigger id="status" className="w-full">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_CONTRATO_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="status" value={formData.status} />
          </div>
        </div>

        {/* Linha 3: Cliente + Polo do Cliente */}
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="clienteId">
              Cliente <span className="text-destructive">*</span>
            </Label>
            <ServerCombobox
              onSearch={async (query) => {
                const result = await actionBuscarClientesParaCombobox(query);
                if (!result.success || !result.data) {
                  console.error('Erro ao buscar clientes:', result.success ? 'Dados não encontrados' : result.error);
                  return [];
                }
                return result.data.map((cliente): ComboboxOption => ({
                  value: String(cliente.id),
                  label: cliente.nome,
                }));
              }}
              value={formData.clienteId ? [formData.clienteId] : []}
              onValueChange={(values) => setFormData(prev => ({ ...prev, clienteId: values[0] || '' }))}
              initialSelectedOptions={initialClienteOptions}
              placeholder="Selecione o cliente..."
              searchPlaceholder="Buscar cliente..."
              emptyText="Nenhum cliente encontrado."
              loadingText="Buscando..."
              multiple={false}
              debounceMs={300}
            />
            <input type="hidden" name="clienteId" value={formData.clienteId} />
            {getFieldError('clienteId') && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {getFieldError('clienteId')}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="papelClienteNoContrato">
              Polo do Cliente <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.papelClienteNoContrato}
              onValueChange={(value) => setFormData(prev => ({ ...prev, papelClienteNoContrato: value as PapelContratual }))}
            >
              <SelectTrigger id="papelClienteNoContrato" className={cn('w-full', getFieldError('papelClienteNoContrato') && 'border-destructive')}>
                <SelectValue placeholder="Selecione o polo..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PAPEL_CONTRATUAL_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="papelClienteNoContrato" value={formData.papelClienteNoContrato} />
            {getFieldError('papelClienteNoContrato') && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {getFieldError('papelClienteNoContrato')}
              </p>
            )}
          </div>
        </div>

        {/* Linha 4: Parte Contrária + Responsável */}
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="partesContrariasIds">Partes Contrárias</Label>
            <ServerCombobox
              onSearch={async (query) => {
                const result = await actionBuscarPartesContrariasParaCombobox(query);
                if (!result.success || !result.data) {
                  console.error('Erro ao buscar partes contrárias:', result.success ? 'Dados não encontrados' : result.error);
                  return [];
                }
                return result.data.map((parte): ComboboxOption => ({
                  value: String(parte.id),
                  label: parte.nome,
                }));
              }}
              value={formData.partesContrariasIds ?? []}
              onValueChange={(values) => setFormData(prev => ({ ...prev, partesContrariasIds: values }))}
              initialSelectedOptions={initialPartesContrariasOptions}
              placeholder="Selecione (opcional)..."
              searchPlaceholder="Buscar parte contrária..."
              emptyText="Nenhuma parte encontrada."
              loadingText="Buscando..."
              multiple={true}
              selectAllText="Selecionar todas"
              clearAllText="Limpar"
              debounceMs={300}
            />
            <input
              type="hidden"
              name="partes"
              value={JSON.stringify(
                formData.partesContrariasIds.map((id, idx) => ({
                  tipoEntidade: 'parte_contraria',
                  entidadeId: id,
                  papelContratual: formData.papelClienteNoContrato === 'autora' ? 're' : 'autora',
                  ordem: idx,
                }))
              )}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="responsavelId">Responsável</Label>
            <Select
              value={formData.responsavelId || '__none__'}
              onValueChange={(value) => setFormData(prev => ({ ...prev, responsavelId: value === '__none__' ? '' : value }))}
            >
              <SelectTrigger id="responsavelId" className="w-full">
                <SelectValue placeholder="Selecione (opcional)..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Nenhum</SelectItem>
                {usuariosOptions.map((usuario) => (
                  <SelectItem key={usuario.id} value={String(usuario.id)}>
                    {usuario.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="responsavelId" value={formData.responsavelId} />
          </div>
        </div>

        {/* Linha 5: Cadastrado em */}
        <div className="grid gap-2">
          <Label htmlFor="cadastradoEm">Cadastrado em</Label>
          <FormDatePicker
            id="cadastradoEm"
            value={formData.cadastradoEm || undefined}
            onChange={(v) => setFormData(prev => ({ ...prev, cadastradoEm: v || '' }))}
          />
          <input type="hidden" name="cadastradoEm" value={formData.cadastradoEm} />
        </div>

        {/* Linha 7: Observações (largura total) */}
        <div className="grid gap-2">
          <Label htmlFor="observacoes">Observações</Label>
          <Textarea
            id="observacoes"
            name="observacoes"
            value={formData.observacoes}
            onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
            placeholder="Observações adicionais sobre o contrato..."
            rows={3}
          />
        </div>
      </form>
    </DialogFormShell>
  );
}
