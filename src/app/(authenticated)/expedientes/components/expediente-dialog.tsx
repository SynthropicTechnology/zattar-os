'use client';

// Componente de diálogo para criar novo expediente manual
// Refatorado com melhorias de UI/UX seguindo padrões shadcn/ui

import * as React from 'react';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormDatePicker } from '@/components/ui/form-date-picker';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { DialogFormShell } from '@/components/shared/dialog-shell';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import {
  Loader2,
  AlertCircle,
  FileText,
  Calendar,
  Clock,
  User,
  Scale,
  Building2,
  FileType,
  CheckCircle2
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { actionCriarExpediente, type ActionResult } from '../actions';
import { GrauTribunal, CodigoTribunal } from '../domain';
import type { TipoExpediente } from '@/app/(authenticated)/tipos-expedientes';
import { actionListarAcervoPaginado } from '@/app/(authenticated)/acervo';

interface DadosIniciais {
  processoId: number;
  trt: CodigoTribunal;
  grau: GrauTribunal;
  numeroProcesso: string;
  nomeParteAutora?: string;
  nomeParteRe?: string;
}

interface NovoExpedienteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  /** Dados iniciais pré-preenchidos (ex: ao criar expediente a partir de audiência) */
  dadosIniciais?: DadosIniciais;
}

interface Processo {
  id: number;
  numeroProcesso: string;
  nomeParteAutora: string;
  nomeParteRe: string;
  trt: CodigoTribunal;
  grau: GrauTribunal;
}

interface Usuario {
  id: number;
  nomeExibicao: string;
}

const initialState: ActionResult = {
  success: false,
  message: '',
  error: '',
  errors: undefined,
};

const TRTS: ComboboxOption[] = CodigoTribunal.map((trt) => ({
  value: trt,
  label: trt,
}));

const GRAUS: ComboboxOption[] = [
  { value: GrauTribunal.PRIMEIRO_GRAU, label: '1º Grau' },
  { value: GrauTribunal.SEGUNDO_GRAU, label: '2º Grau' },
  { value: GrauTribunal.TRIBUNAL_SUPERIOR, label: 'Tribunal Superior' },
];

const formatarGrau = (grau: string): string => {
  switch (grau) {
    case GrauTribunal.PRIMEIRO_GRAU:
      return '1º Grau';
    case GrauTribunal.SEGUNDO_GRAU:
      return '2º Grau';
    case GrauTribunal.TRIBUNAL_SUPERIOR:
      return 'Tribunal Superior';
    default:
      return grau;
  }
};

export function ExpedienteDialog({
  open,
  onOpenChange,
  onSuccess,
  dadosIniciais,
}: NovoExpedienteDialogProps) {
  const [formState, formAction, isPending] = useActionState(actionCriarExpediente, initialState);

  // Helper para acessar erros de forma type-safe
  const getErrors = (): Record<string, string[]> | undefined => {
    return !formState.success ? formState.errors : undefined;
  };

  // Estados de dados
  const [processos, setProcessos] = React.useState<Processo[]>([]);
  const [tiposExpediente, setTiposExpediente] = React.useState<TipoExpediente[]>([]);
  const [usuarios, setUsuarios] = React.useState<Usuario[]>([]);

  // Estados de loading para dados auxiliares
  const [loadingProcessos, setLoadingProcessos] = React.useState(false);
  const [loadingTipos, setLoadingTipos] = React.useState(false);
  const [loadingUsuarios, setLoadingUsuarios] = React.useState(false);

  // Form local state (para combobox e datepicker, que não são controlados diretamente por FormData)
  const [trtComboboxValue, setTrtComboboxValue] = React.useState<string>('');
  const [grauComboboxValue, setGrauComboboxValue] = React.useState<string>('');
  const [processoIdComboboxValue, setProcessoIdComboboxValue] = React.useState<string[]>([]);
  const [tipoExpedienteIdSelectValue, setTipoExpedienteIdSelectValue] = React.useState<string>('');
  const [dataPrazoDatePickerValue, setDataPrazoDatePickerValue] = React.useState<string>('');
  const [horaPrazoInputValue, setHoraPrazoInputValue] = React.useState<string>('');
  const [responsavelIdComboboxValue, setResponsavelIdComboboxValue] = React.useState<string>('');
  const [descricaoTextareaValue, setDescricaoTextareaValue] = React.useState<string>('');

  // Determinar se está no modo com dados iniciais (processo já definido)
  const modoProcessoDefinido = !!dadosIniciais;

  // Processo selecionado - usa dados iniciais ou busca na lista
  const processoSelecionado = React.useMemo(() => {
    if (modoProcessoDefinido && dadosIniciais) {
      return {
        id: dadosIniciais.processoId,
        numeroProcesso: dadosIniciais.numeroProcesso,
        nomeParteAutora: dadosIniciais.nomeParteAutora || '',
        nomeParteRe: dadosIniciais.nomeParteRe || '',
        trt: dadosIniciais.trt,
        grau: dadosIniciais.grau,
      };
    }
    if (processoIdComboboxValue.length === 0) return null;
    return processos.find((p) => p.id.toString() === processoIdComboboxValue[0]) || null;
  }, [modoProcessoDefinido, dadosIniciais, processoIdComboboxValue, processos]);

  // Effect para preencher dados iniciais se existirem
  React.useEffect(() => {
    if (modoProcessoDefinido && dadosIniciais) {
      setTrtComboboxValue(dadosIniciais.trt);
      setGrauComboboxValue(dadosIniciais.grau);
      setProcessoIdComboboxValue([dadosIniciais.processoId.toString()]);
    }
  }, [modoProcessoDefinido, dadosIniciais]);

  // Buscar processos quando TRT e Grau forem selecionados (apenas no modo manual)
  React.useEffect(() => {
    if (!modoProcessoDefinido && trtComboboxValue && grauComboboxValue) {
      buscarProcessos(trtComboboxValue as CodigoTribunal, grauComboboxValue as GrauTribunal);
    } else if (!modoProcessoDefinido) {
      setProcessos([]);
      setProcessoIdComboboxValue([]);
    }
  }, [trtComboboxValue, grauComboboxValue, modoProcessoDefinido]);

  // Buscar tipos de expediente e usuários quando o dialog abrir
  React.useEffect(() => {
    const fetchTiposExpediente = async () => {
      setLoadingTipos(true);
      try {
        const response = await fetch('/api/tipos-expedientes?limite=100');
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Erro ao buscar tipos de expediente');
        }
        setTiposExpediente(result.data.data || []);
      } catch (err: unknown) {
        console.error('Erro ao buscar tipos de expediente:', err);
      } finally {
        setLoadingTipos(false);
      }
    };

    const fetchUsuarios = async () => {
      setLoadingUsuarios(true);
      try {
        const response = await fetch('/api/usuarios?limite=100&ativo=true');
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Erro ao buscar usuários');
        }
        setUsuarios(result.data?.usuarios || []);
      } catch (err: unknown) {
        console.error('Erro ao buscar usuários:', err);
      } finally {
        setLoadingUsuarios(false);
      }
    };

    if (open) {
      if (tiposExpediente.length === 0) {
        fetchTiposExpediente();
      }
      if (usuarios.length === 0) {
        fetchUsuarios();
      }
    }
  }, [open, tiposExpediente.length, usuarios.length]);

  const resetForm = React.useCallback(() => {
    setTrtComboboxValue('');
    setGrauComboboxValue('');
    setProcessoIdComboboxValue([]);
    setTipoExpedienteIdSelectValue('');
    setDescricaoTextareaValue('');
    setDataPrazoDatePickerValue('');
    setHoraPrazoInputValue('');
    setResponsavelIdComboboxValue('');
  }, []);

  // Resetar form e formState quando fechar ou sucesso na submissão
  React.useEffect(() => {
    if (!open) {
      resetForm();
    }
    if (formState.success) {
      onSuccess();
      onOpenChange(false);
      resetForm();
    }
  }, [open, formState.success, onOpenChange, onSuccess, resetForm]);

  const buscarProcessos = async (trtValue: CodigoTribunal, grauValue: GrauTribunal) => {
    setLoadingProcessos(true);

    try {
      const result = await actionListarAcervoPaginado({
        trt: trtValue,
        grau: grauValue,
        limite: 100,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Erro ao buscar processos');
      }

      // Convertendo chaves de snake_case para camelCase para o estado local
      const processosData = result.data && typeof result.data === 'object' && 'processos' in result.data
        ? (result.data as { processos: Array<{ id: number; numero_processo: string; polo_ativo_nome: string; polo_passivo_nome: string; trt: CodigoTribunal; grau: GrauTribunal }> }).processos
        : [];

      const camelCaseProcessos = processosData.map((p: { id: number; numero_processo: string; polo_ativo_nome: string; polo_passivo_nome: string; trt: CodigoTribunal; grau: GrauTribunal }) => ({
        id: p.id,
        numeroProcesso: p.numero_processo,
        nomeParteAutora: p.polo_ativo_nome,
        nomeParteRe: p.polo_passivo_nome,
        trt: p.trt as CodigoTribunal,
        grau: p.grau as GrauTribunal,
      }));
      setProcessos(camelCaseProcessos);
    } catch (err: unknown) {
      console.error('Erro ao buscar processos:', err);
      setProcessos([]);
    } finally {
      setLoadingProcessos(false);
    }
  };

  // Opções para Combobox de processos
  const processosOptions: ComboboxOption[] = processos.map((p) => ({
    value: p.id.toString(),
    label: p.numeroProcesso,
    searchText: `${p.numeroProcesso} ${p.nomeParteAutora} ${p.nomeParteRe}`,
  }));

  // Opções para Combobox de responsáveis
  const usuariosOptions: ComboboxOption[] = usuarios.map((u) => ({
    value: u.id.toString(),
    label: u.nomeExibicao,
    searchText: u.nomeExibicao,
  }));

  const generalError = !formState.success ? (formState.error || formState.message) : null;

  // Cálculos para o multi-step status
  const currentStep = React.useMemo(() => {
    if (modoProcessoDefinido) return 3;
    if (!trtComboboxValue || !grauComboboxValue) return 1;
    if (!processoSelecionado) return 2;
    return 3;
  }, [modoProcessoDefinido, trtComboboxValue, grauComboboxValue, processoSelecionado]);

  const stepTitle = React.useMemo(() => {
    switch (currentStep) {
      case 1: return "Tribunal e Grau";
      case 2: return "Seleção de Processo";
      case 3: return "Dados do Expediente";
      default: return "";
    }
  }, [currentStep]);

  // Render Footer Buttons
  const footerButtons = (
    <Button
      form="criar-expediente-form"
      type="submit"
      disabled={isPending || !processoSelecionado || !descricaoTextareaValue.trim()}
      className="gap-2"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <CheckCircle2 className="h-4 w-4" />
      )}
      Criar Expediente
    </Button>
  );

  // Layout quando há dados iniciais (processo já definido)
  if (modoProcessoDefinido && dadosIniciais) {
    return (
      <DialogFormShell
        open={open}
        onOpenChange={onOpenChange}
        title="Novo Expediente Manual"
        maxWidth="2xl"
        footer={footerButtons}
        multiStep={{
          current: 3,
          total: 3,
          stepTitle: "Dados do Expediente"
        }}
      >
        <form id="criar-expediente-form" action={formAction} className="space-y-6">
          {/* Erro geral */}
          {generalError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{generalError}</AlertDescription>
            </Alert>
          )}

          {/* Hidden inputs for form data */}
          <input type="hidden" name="processoId" value={processoSelecionado?.id || ''} />
          <input type="hidden" name="trt" value={processoSelecionado?.trt || ''} />
          <input type="hidden" name="grau" value={processoSelecionado?.grau || ''} />
          <input type="hidden" name="dataPrazoLegalParte" value={dataPrazoDatePickerValue && horaPrazoInputValue ? `${dataPrazoDatePickerValue}T${horaPrazoInputValue}:00` : ''} />
          <input type="hidden" name="tipoExpedienteId" value={tipoExpedienteIdSelectValue} />
          <input type="hidden" name="responsavelId" value={responsavelIdComboboxValue} />
          <Textarea
            id="descricao"
            name="descricao"
            value={descricaoTextareaValue}
            onChange={(e) => setDescricaoTextareaValue(e.target.value)}
            placeholder="Descreva o expediente em detalhes..."
            disabled={isPending}
            rows={4}
            required
            className="resize-none hidden" // Hidden, as it's part of form submission
          />
          {/* Content for when process is defined */}
          <Card className="border-primary/20">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium'
                )}>
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-medium">Processo Vinculado</h3>
              </div>
              <div className="text-lg font-semibold mb-2">
                {processoSelecionado && processoSelecionado.numeroProcesso}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Parte Autora:</span>
                  <div className="font-medium truncate">{processoSelecionado && processoSelecionado.nomeParteAutora || '-'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Parte Ré:</span>
                  <div className="font-medium truncate">{processoSelecionado && processoSelecionado.nomeParteRe || '-'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Etapa 3: Dados do Expediente */}
          <Card className="border-primary/20">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  3
                </div>
                <h3 className="text-sm font-medium">Dados do Expediente</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <Label htmlFor="tipoExpedienteId" className="flex items-center gap-2">
                    <FileType className="h-4 w-4 text-muted-foreground" />
                    Tipo de Expediente
                  </Label>
                  {loadingTipos ? (
                    <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/50">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Carregando tipos...</span>
                    </div>
                  ) : (
                    <Select
                      value={tipoExpedienteIdSelectValue}
                      onValueChange={setTipoExpedienteIdSelectValue}
                      disabled={isPending}
                    >
                      <SelectTrigger id="tipoExpedienteId" className="h-10 w-full">
                        <SelectValue placeholder="Selecione o tipo (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposExpediente.map((tipo) => (
                          <SelectItem key={tipo.id} value={tipo.id.toString()}>
                            {tipo.tipoExpediente}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {getErrors()?.tipoExpedienteId && (
                    <p className="text-sm font-medium text-destructive">{getErrors()!.tipoExpedienteId[0]}</p>
                  )}
                </div>

                <div className="space-y-2 col-span-1 md:col-span-2">
                  <Label htmlFor="descricao" className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Descrição
                    <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="descricao"
                    name="descricao"
                    value={descricaoTextareaValue}
                    onChange={(e) => setDescricaoTextareaValue(e.target.value)}
                    placeholder="Descreva o expediente em detalhes..."
                    disabled={isPending}
                    rows={4}
                    required
                    className="resize-none w-full"
                  />
                  {getErrors()?.descricao && (
                    <p className="text-sm font-medium text-destructive">{getErrors()!.descricao[0]}</p>
                  )}
                </div>

                <div className="space-y-2 col-span-1">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Prazo
                  </Label>
                  <div className={isPending ? 'pointer-events-none opacity-50' : ''}>
                    <FormDatePicker
                      id="dataPrazo"
                      value={dataPrazoDatePickerValue || undefined}
                      onChange={(v) => setDataPrazoDatePickerValue(v || '')}
                      className="h-10 w-full"
                    />
                  </div>
                </div>
                <div className="space-y-2 col-span-1">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Hora
                  </Label>
                  <div className="relative">
                    <Input
                      id="horaPrazo"
                      name="horaPrazo"
                      type="time"
                      value={horaPrazoInputValue}
                      onChange={(e) => setHoraPrazoInputValue(e.target.value)}
                      disabled={isPending || !dataPrazoDatePickerValue}
                      className="h-10 w-full pl-2"
                    />
                  </div>
                  {(getErrors()?.dataPrazoLegalParte || getErrors()?.horaPrazo) && (
                    <p className="text-sm font-medium text-destructive">{getErrors()!.dataPrazoLegalParte?.[0] || getErrors()!.horaPrazo?.[0]}</p>
                  )}
                </div>

                <div className="space-y-2 col-span-1 md:col-span-2">
                  <Label htmlFor="responsavelId" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Responsável
                  </Label>
                  {loadingUsuarios ? (
                    <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/50">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Carregando usuários...</span>
                    </div>
                  ) : (
                    <Combobox
                      options={usuariosOptions}
                      value={responsavelIdComboboxValue ? [responsavelIdComboboxValue] : []}
                      onValueChange={(values) => setResponsavelIdComboboxValue(values[0] || '')}
                      placeholder="Selecione o responsável (opcional)"
                      searchPlaceholder="Buscar por nome..."
                      emptyText="Nenhum usuário encontrado"
                      disabled={isPending}
                    />
                  )}
                  {getErrors()?.responsavelId && (
                    <p className="text-sm font-medium text-destructive">{getErrors()!.responsavelId[0]}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </DialogFormShell>
    );
  }

  // Layout padrão quando não há dados iniciais (seleção manual de processo)
  return (
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title="Novo Expediente Manual"
      maxWidth="2xl"
      footer={footerButtons}
      multiStep={{
        current: currentStep,
        total: 3,
        stepTitle
      }}
    >
      <form id="criar-expediente-form" action={formAction} className="space-y-6">
        {/* Hidden inputs for form data */}
        <input type="hidden" name="trt" value={trtComboboxValue} />
        <input type="hidden" name="grau" value={grauComboboxValue} />
        <input type="hidden" name="processoId" value={processoIdComboboxValue[0] || ''} />
        <input type="hidden" name="tipoExpedienteId" value={tipoExpedienteIdSelectValue} />
        <input type="hidden" name="responsavelId" value={responsavelIdComboboxValue} />
        <input type="hidden" name="dataPrazoLegalParte" value={dataPrazoDatePickerValue && horaPrazoInputValue ? `${dataPrazoDatePickerValue}T${horaPrazoInputValue}:00` : ''} />
        <Textarea
          id="descricao"
          name="descricao"
          value={descricaoTextareaValue}
          onChange={(e) => setDescricaoTextareaValue(e.target.value)}
          placeholder="Descreva o expediente em detalhes..."
          disabled={isPending}
          rows={4}
          required
          className="resize-none hidden" // Hidden, as it's part of form submission
        />

        {/* Erro geral */}
        {generalError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{generalError}</AlertDescription>
          </Alert>
        )}

        {/* Etapa 1: Selecionar TRT e Grau */}
        <Card className={cn(trtComboboxValue && grauComboboxValue ? 'border-primary/20' : '')}>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                trtComboboxValue && grauComboboxValue
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}>
                {trtComboboxValue && grauComboboxValue ? <CheckCircle2 className="h-4 w-4" /> : '1'}
              </div>
              <h3 className="text-sm font-medium">Selecione o Tribunal e Grau</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="trt" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  TRT
                  <span className="text-destructive">*</span>
                </Label>
                <Select value={trtComboboxValue} onValueChange={setTrtComboboxValue} disabled={isPending}>
                  <SelectTrigger id="trt" className="h-10 w-full">
                    <SelectValue placeholder="Selecione o TRT" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRTS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {getErrors()?.trt && (
                  <p className="text-sm font-medium text-destructive">{getErrors()!.trt[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="grau" className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-muted-foreground" />
                  Grau
                  <span className="text-destructive">*</span>
                </Label>
                <Select value={grauComboboxValue} onValueChange={setGrauComboboxValue} disabled={isPending}>
                  <SelectTrigger id="grau" className="h-10 w-full">
                    <SelectValue placeholder="Selecione o grau" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRAUS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {getErrors()?.grau && (
                  <p className="text-sm font-medium text-destructive">{getErrors()!.grau[0]}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Etapa 2: Selecionar Processo */}
        {(trtComboboxValue && grauComboboxValue) && (
          <Card className={cn(processoSelecionado ? 'border-primary/20' : '')}>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                  processoSelecionado
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}>
                  {processoSelecionado ? <CheckCircle2 className="h-4 w-4" /> : '2'}
                </div>
                <h3 className="text-sm font-medium">Selecione o Processo</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="processoId" className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Processo
                  <span className="text-destructive">*</span>
                </Label>
                {loadingProcessos ? (
                  <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/50">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Carregando processos...</span>
                  </div>
                ) : processos.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Nenhum processo encontrado para {trtComboboxValue} - {formatarGrau(grauComboboxValue)}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <Combobox
                      options={processosOptions}
                      value={processoIdComboboxValue}
                      onValueChange={setProcessoIdComboboxValue}
                      placeholder="Buscar por número, parte autora ou ré..."
                      searchPlaceholder="Digite para buscar..."
                      emptyText="Nenhum processo encontrado"
                      disabled={isPending}
                    />
                    {getErrors()?.processoId && (
                      <p className="text-sm font-medium text-destructive">{getErrors()!.processoId[0]}</p>
                    )}
                    {processoSelecionado && (
                      <div className="mt-3 p-4 bg-muted/50 rounded-lg border">
                        <div className="flex items-center gap-2 text-sm font-medium mb-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Processo selecionado
                        </div>
                        <div className="text-lg font-semibold">
                          {processoSelecionado.numeroProcesso}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Parte Autora:</span>
                            <div className="font-medium truncate">{processoSelecionado.nomeParteAutora || '-'}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Parte Ré:</span>
                            <div className="font-medium truncate">{processoSelecionado.nomeParteRe || '-'}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Etapa 3: Dados do Expediente */}
        {processoSelecionado && (
          <Card className="border-primary/20">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  3
                </div>
                <h3 className="text-sm font-medium">Dados do Expediente</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <Label htmlFor="tipoExpedienteId" className="flex items-center gap-2">
                    <FileType className="h-4 w-4 text-muted-foreground" />
                    Tipo de Expediente
                  </Label>
                  {loadingTipos ? (
                    <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/50">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Carregando tipos...</span>
                    </div>
                  ) : (
                    <Select
                      value={tipoExpedienteIdSelectValue}
                      onValueChange={setTipoExpedienteIdSelectValue}
                      disabled={isPending}
                    >
                      <SelectTrigger id="tipoExpedienteId" className="h-10 w-full">
                        <SelectValue placeholder="Selecione o tipo (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposExpediente.map((tipo) => (
                          <SelectItem key={tipo.id} value={tipo.id.toString()}>
                            {tipo.tipoExpediente}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {getErrors()?.tipoExpedienteId && (
                    <p className="text-sm font-medium text-destructive">{getErrors()!.tipoExpedienteId[0]}</p>
                  )}
                </div>

                <div className="space-y-2 col-span-1 md:col-span-2">
                  <Label htmlFor="descricao" className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Descrição
                    <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="descricao"
                    name="descricao"
                    value={descricaoTextareaValue}
                    onChange={(e) => setDescricaoTextareaValue(e.target.value)}
                    placeholder="Descreva o expediente em detalhes..."
                    disabled={isPending}
                    rows={4}
                    required
                    className="resize-none w-full"
                  />
                  {getErrors()?.descricao && (
                    <p className="text-sm font-medium text-destructive">{getErrors()!.descricao[0]}</p>
                  )}
                </div>

                <div className="space-y-2 col-span-1">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Prazo
                  </Label>
                  <div className={isPending ? 'pointer-events-none opacity-50' : ''}>
                    <FormDatePicker
                      id="dataPrazo"
                      value={dataPrazoDatePickerValue || undefined}
                      onChange={(v) => setDataPrazoDatePickerValue(v || '')}
                      className="h-10 w-full"
                    />
                  </div>
                </div>
                <div className="space-y-2 col-span-1">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Hora
                  </Label>
                  <div className="relative">
                    <Input
                      id="horaPrazo"
                      name="horaPrazo"
                      type="time"
                      value={horaPrazoInputValue}
                      onChange={(e) => setHoraPrazoInputValue(e.target.value)}
                      disabled={isPending || !dataPrazoDatePickerValue}
                      className="h-10 w-full pl-2"
                    />
                  </div>
                  {(getErrors()?.dataPrazoLegalParte || getErrors()?.horaPrazo) && (
                    <p className="text-sm font-medium text-destructive">{getErrors()!.dataPrazoLegalParte?.[0] || getErrors()!.horaPrazo?.[0]}</p>
                  )}
                </div>

                <div className="space-y-2 col-span-1 md:col-span-2">
                  <Label htmlFor="responsavelId" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Responsável
                  </Label>
                  {loadingUsuarios ? (
                    <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/50">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Carregando usuários...</span>
                    </div>
                  ) : (
                    <Combobox
                      options={usuariosOptions}
                      value={responsavelIdComboboxValue ? [responsavelIdComboboxValue] : []}
                      onValueChange={(values) => setResponsavelIdComboboxValue(values[0] || '')}
                      placeholder="Selecione o responsável (opcional)"
                      searchPlaceholder="Buscar por nome..."
                      emptyText="Nenhum usuário encontrado"
                      disabled={isPending}
                    />
                  )}
                  {getErrors()?.responsavelId && (
                    <p className="text-sm font-medium text-destructive">{getErrors()!.responsavelId[0]}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </DialogFormShell>
  );
}
