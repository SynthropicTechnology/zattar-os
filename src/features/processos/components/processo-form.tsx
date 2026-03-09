'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { FormDatePicker } from '@/components/ui/form-date-picker';
import { cn } from '@/lib/utils';
import { todayDateString } from '@/lib/date-utils';
import { Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { DialogFormShell } from '@/components/shared/dialog-shell';
import { actionCriarProcessoManual, actionAtualizarProcesso, type ActionResult } from '../actions';
import type { Processo, GrauProcesso, OrigemAcervo } from '../domain';
import { GRAU_LABELS, TRIBUNAIS } from '../domain';

interface ProcessoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  processo?: Processo;
  mode?: 'create' | 'edit';
}

const INITIAL_FORM_STATE = {
  // Campos obrigatórios para criação manual
  origem: 'acervo_geral' as OrigemAcervo,
  trt: '',
  grau: '' as GrauProcesso | '',
  numeroProcesso: '',
  descricaoOrgaoJulgador: '',
  classeJudicial: '',
  nomeParteAutora: '',
  nomeParteRe: '',
  dataAutuacao: todayDateString(),

  // Opcionais/Defaults
  segredoJustica: false,
  juizoDigital: false,
  temAssociacao: false,
  prioridadeProcessual: 0,
  qtdeParteAutora: 1,
  qtdeParteRe: 1,

  // Nullables
  dataArquivamento: '',
  dataProximaAudiencia: '',
  responsavelId: '', // string for select

  // Campos para modo edição (preenchidos a partir do processo)
  idPje: 0,
  advogadoId: 0,
  numero: 0,
  codigoStatusProcesso: 'ATIVO',
};

export function ProcessoForm({
  open,
  onOpenChange,
  onSuccess,
  processo,
  mode = 'create',
}: ProcessoFormProps) {
  const isEditMode = mode === 'edit' && processo;
  const [formData, setFormData] = React.useState(INITIAL_FORM_STATE);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});
  const formRef = React.useRef<HTMLFormElement>(null);

  // Server Action
  const initialState: ActionResult | null = null;
  const boundAction = React.useCallback(
    async (prevState: ActionResult | null, formDataPayload: FormData) => {
      if (isEditMode && processo) {
        return actionAtualizarProcesso(processo.id, prevState, formDataPayload);
      }
      // Usa action de criação manual que gera campos automáticos (idPje, advogadoId, numero)
      return actionCriarProcessoManual(prevState, formDataPayload);
    },
    [isEditMode, processo]
  );

  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  // Tratamento de resposta
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

  // Inicialização
  React.useEffect(() => {
    if (!open) {
      setFormData(INITIAL_FORM_STATE);
      setFieldErrors({});
    } else if (isEditMode && processo) {
      setFormData({
        idPje: processo.idPje,
        advogadoId: processo.advogadoId,
        origem: processo.origem,
        trt: processo.trt,
        grau: processo.grau,
        numeroProcesso: processo.numeroProcesso,
        numero: processo.numero,
        descricaoOrgaoJulgador: processo.descricaoOrgaoJulgador,
        classeJudicial: processo.classeJudicial,
        codigoStatusProcesso: processo.codigoStatusProcesso,
        nomeParteAutora: processo.nomeParteAutora,
        nomeParteRe: processo.nomeParteRe,
        dataAutuacao: processo.dataAutuacao || '',
        segredoJustica: processo.segredoJustica,
        juizoDigital: processo.juizoDigital,
        temAssociacao: processo.temAssociacao,
        prioridadeProcessual: processo.prioridadeProcessual,
        qtdeParteAutora: processo.qtdeParteAutora,
        qtdeParteRe: processo.qtdeParteRe,
        dataArquivamento: processo.dataArquivamento || '',
        dataProximaAudiencia: processo.dataProximaAudiencia || '',
        responsavelId: processo.responsavelId ? String(processo.responsavelId) : '',
      });
    }
  }, [open, isEditMode, processo]);

  const handleSubmit = () => {
    // Validação básica client-side
    const errors: Record<string, string[]> = {};
    if (!formData.numeroProcesso) errors.numeroProcesso = ['Número do processo é obrigatório'];
    if (!formData.trt) errors.trt = ['TRT é obrigatório'];
    if (!formData.grau) errors.grau = ['Grau é obrigatório'];

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    formRef.current?.requestSubmit();
  };

  const getFieldError = (field: string) => fieldErrors[field]?.[0];

  return (
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEditMode ? 'Editar Processo' : 'Novo Processo'}
      maxWidth="2xl"
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
              {isEditMode ? 'Salvar Alterações' : 'Criar Processo'}
            </>
          )}
        </Button>
      }
    >
      <form ref={formRef} action={formAction} className="space-y-6">
        {/* Seção 1 - Dados Básicos */}
        <div>
          <h3 className="text-lg font-medium font-heading mb-4">Dados Básicos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="numeroProcesso">Número do Processo <span className="text-destructive">*</span></Label>
              <Input
                id="numeroProcesso"
                name="numeroProcesso"
                value={formData.numeroProcesso}
                onChange={e => setFormData(prev => ({ ...prev, numeroProcesso: e.target.value }))}
                placeholder="0000000-00.0000.0.00.0000"
                className={cn(getFieldError('numeroProcesso') && 'border-destructive')}
              />
              {getFieldError('numeroProcesso') && (
                <p className="text-xs text-destructive">{getFieldError('numeroProcesso')}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="classeJudicial">Classe Judicial <span className="text-destructive">*</span></Label>
              <Input
                id="classeJudicial"
                name="classeJudicial"
                value={formData.classeJudicial}
                onChange={e => setFormData(prev => ({ ...prev, classeJudicial: e.target.value }))}
                placeholder="Ex: Ação Trabalhista"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataAutuacao">Data de Autuação <span className="text-destructive">*</span></Label>
              <FormDatePicker
                id="dataAutuacao"
                value={formData.dataAutuacao}
                onChange={v => setFormData(prev => ({ ...prev, dataAutuacao: v || '' }))}
              />
              <input type="hidden" name="dataAutuacao" value={formData.dataAutuacao} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trt">TRT <span className="text-destructive">*</span></Label>
              <Select
                value={formData.trt}
                onValueChange={v => setFormData(prev => ({ ...prev, trt: v }))}
              >
                <SelectTrigger id="trt" className={cn(getFieldError('trt') && 'border-destructive')}>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {TRIBUNAIS.map(trt => (
                    <SelectItem key={trt} value={trt}>{trt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="trt" value={formData.trt} />
              {getFieldError('trt') && (
                <p className="text-xs text-destructive">{getFieldError('trt')}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="grau">Grau <span className="text-destructive">*</span></Label>
              <Select
                value={formData.grau}
                onValueChange={v => setFormData(prev => ({ ...prev, grau: v as GrauProcesso }))}
              >
                <SelectTrigger id="grau" className={cn(getFieldError('grau') && 'border-destructive')}>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GRAU_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="grau" value={formData.grau} />
              {getFieldError('grau') && (
                <p className="text-xs text-destructive">{getFieldError('grau')}</p>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Seção 2 - Partes */}
        <div>
          <h3 className="text-lg font-medium font-heading mb-4">Partes Envolvidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nomeParteAutora">Parte Autora <span className="text-destructive">*</span></Label>
              <Input
                id="nomeParteAutora"
                name="nomeParteAutora"
                value={formData.nomeParteAutora}
                onChange={e => setFormData(prev => ({ ...prev, nomeParteAutora: e.target.value }))}
                placeholder="Nome do autor"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nomeParteRe">Parte Ré <span className="text-destructive">*</span></Label>
              <Input
                id="nomeParteRe"
                name="nomeParteRe"
                value={formData.nomeParteRe}
                onChange={e => setFormData(prev => ({ ...prev, nomeParteRe: e.target.value }))}
                placeholder="Nome do réu"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Seção 3 - Tribunal/Órgão */}
        <div>
          <h3 className="text-lg font-medium font-heading mb-4">Órgão Julgador</h3>
          <div className="space-y-2">
            <Label htmlFor="descricaoOrgaoJulgador">Descrição <span className="text-destructive">*</span></Label>
            <Input
              id="descricaoOrgaoJulgador"
              name="descricaoOrgaoJulgador"
              value={formData.descricaoOrgaoJulgador}
              onChange={e => setFormData(prev => ({ ...prev, descricaoOrgaoJulgador: e.target.value }))}
              placeholder="Ex: 1ª Vara do Trabalho de São Paulo"
            />
          </div>
        </div>
        
        {/* Hidden inputs para campos obrigatórios mockados ou defaults */}
        <input type="hidden" name="origem" value={formData.origem} />
      </form>
    </DialogFormShell>
  );
}
