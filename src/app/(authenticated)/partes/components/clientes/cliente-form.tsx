'use client';

/**
 * ClienteForm - Formulario de Cliente com Server Actions
 *
 * Componente de formulario que utiliza Server Actions para criar/editar clientes.
 * Implementa validacao client-side e integracao com useActionState (React 19).
 */

import * as React from 'react';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Heading } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import {
  Loader2,
  User,
  Building2,
  X,
  Plus,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { InputCEP, type InputCepAddress } from '@/app/(authenticated)/enderecos';
import type { Endereco } from '@/app/(authenticated)/enderecos/types';
import { InputTelefone } from '@/components/ui/input-telefone';
import { actionCriarCliente, actionAtualizarClienteForm, type ActionResult } from '../../actions';
import type { Cliente } from '../../types';
import { DialogFormShell, DialogNavPrevious, DialogNavNext } from '@/components/shared/dialog-shell';

// =============================================================================

interface ClienteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  cliente?: Cliente; // Se fornecido, modo edicao
  mode?: 'create' | 'edit';
}

const TOTAL_STEPS = 5;

const STEP_INFO = {
  1: {
    title: 'Tipo de Pessoa',
    description: 'Selecione se o cliente é pessoa física ou jurídica',
  },
  2: {
    title: 'Identificação',
    description: 'Informe os dados de identificação do cliente',
  },
  3: {
    title: 'Contato',
    description: 'Informe os dados de contato do cliente',
  },
  4: {
    title: 'Endereço',
    description: 'Informe o endereço do cliente',
  },
  5: {
    title: 'Informações Adicionais',
    description: 'Revise e adicione observações se necessário',
  },
};

const ESTADOS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const ESTADOS_CIVIS = [
  { value: 'solteiro', label: 'Solteiro(a)' },
  { value: 'casado', label: 'Casado(a)' },
  { value: 'divorciado', label: 'Divorciado(a)' },
  { value: 'viuvo', label: 'Viúvo(a)' },
  { value: 'uniao_estavel', label: 'União Estável' },
  { value: 'separado', label: 'Separado(a)' },
];

const GENEROS = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'feminino', label: 'Feminino' },
  { value: 'outro', label: 'Outro' },
  { value: 'nao_informado', label: 'Prefiro não informar' },
];

// =============================================================================
// FORMATACAO (apenas UI/masking)
// =============================================================================

function formatarCPF(value: string): string {
  const numeros = value.replace(/\D/g, '').slice(0, 11);
  return numeros
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function formatarCNPJ(value: string): string {
  const numeros = value.replace(/\D/g, '').slice(0, 14);
  return numeros
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

// =============================================================================
// ESTADO INICIAL
// =============================================================================

const INITIAL_FORM_STATE = {
  tipo_pessoa: null as 'pf' | 'pj' | null,
  nome: '',
  nome_social_fantasia: '',
  cpf: '',
  cnpj: '',
  rg: '',
  data_nascimento: '',
  data_abertura: '',
  genero: '',
  estado_civil: '',
  nacionalidade: '',
  nome_genitora: '',
  inscricao_estadual: '',
  emails: [] as string[],
  ddd_celular: '',
  numero_celular: '',
  ddd_residencial: '',
  numero_residencial: '',
  ddd_comercial: '',
  numero_comercial: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  municipio: '',
  estado_sigla: '',
  observacoes: '',
  ativo: true,
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ClienteFormDialog({
  open,
  onOpenChange,
  onSuccess,
  cliente,
  mode = 'create',
}: ClienteFormDialogProps) {
  const isEditMode = mode === 'edit' && cliente;
  const [currentStep, setCurrentStep] = React.useState(isEditMode ? 2 : 1);
  const [formData, setFormData] = React.useState(INITIAL_FORM_STATE);
  const [novoEmail, setNovoEmail] = React.useState('');
  const [mounted, setMounted] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  // Garantir que o componente só renderize Select após hidratação
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Server Action com useActionState
  const initialState: ActionResult | null = null;

  const boundAction = React.useCallback(
    async (prevState: ActionResult | null, formData: FormData) => {
      if (isEditMode && cliente) {
        return actionAtualizarClienteForm(cliente.id, prevState, formData);
      }
      return actionCriarCliente(prevState, formData);
    },
    [isEditMode, cliente]
  );

  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  // Usar useRef para manter referência estável de onSuccess e evitar mudança no tamanho do array de dependências
  const onSuccessRef = React.useRef(onSuccess);
  React.useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  // Efeito para tratar resultado da action
  React.useEffect(() => {
    if (state) {
      if (state.success) {
        toast.success(state.message || 'Operação realizada com sucesso');
        onOpenChange(false);
        onSuccessRef.current?.();
      } else {
        // Garantir que sempre tenha uma mensagem de erro
        const errorMessage = state.message || state.error || 'Erro ao processar a solicitação';
        toast.error(errorMessage);
      }
    }
  }, [state, onOpenChange]);

  // Reset ao fechar ou inicializar com dados do cliente
  React.useEffect(() => {
    if (!open) {
      setCurrentStep(isEditMode ? 2 : 1);
      setFormData(INITIAL_FORM_STATE);
      setNovoEmail('');
    } else if (isEditMode && cliente) {
      // Cast para acessar endereco se existir (vem do join)
      const clienteComEndereco = cliente as unknown as { endereco?: Endereco };
      const endereco = clienteComEndereco.endereco;

      // Preencher com dados do cliente para edicao
      setFormData({
        tipo_pessoa: cliente.tipo_pessoa,
        nome: cliente.nome,
        nome_social_fantasia: cliente.nome_social_fantasia || '',
        cpf: cliente.tipo_pessoa === 'pf' ? formatarCPF(cliente.cpf || '') : '',
        cnpj: cliente.tipo_pessoa === 'pj' ? formatarCNPJ(cliente.cnpj || '') : '',
        rg: cliente.tipo_pessoa === 'pf' && 'rg' in cliente ? (cliente.rg || '') : '',
        data_nascimento: cliente.tipo_pessoa === 'pf' && 'data_nascimento' in cliente ? (cliente.data_nascimento || '') : '',
        data_abertura: cliente.tipo_pessoa === 'pj' && 'data_abertura' in cliente ? (cliente.data_abertura || '') : '',
        genero: cliente.tipo_pessoa === 'pf' && 'genero' in cliente ? (cliente.genero || '') : '',
        estado_civil: cliente.tipo_pessoa === 'pf' && 'estado_civil' in cliente ? (cliente.estado_civil || '') : '',
        nacionalidade: cliente.tipo_pessoa === 'pf' && 'nacionalidade' in cliente ? (cliente.nacionalidade || '') : '',
        nome_genitora: cliente.tipo_pessoa === 'pf' && 'nome_genitora' in cliente ? (cliente.nome_genitora || '') : '',
        inscricao_estadual: cliente.tipo_pessoa === 'pj' && 'inscricao_estadual' in cliente ? (cliente.inscricao_estadual || '') : '',
        emails: cliente.emails || [],
        ddd_celular: cliente.ddd_celular || '',
        numero_celular: cliente.numero_celular || '',
        ddd_residencial: cliente.ddd_residencial || '',
        numero_residencial: cliente.numero_residencial || '',
        ddd_comercial: cliente.ddd_comercial || '',
        numero_comercial: cliente.numero_comercial || '',
        cep: endereco?.cep || '',
        logradouro: endereco?.logradouro || '',
        numero: endereco?.numero || '',
        complemento: endereco?.complemento || '',
        bairro: endereco?.bairro || '',
        municipio: endereco?.municipio || '',
        estado_sigla: endereco?.estado_sigla || endereco?.estado || '',
        observacoes: cliente.observacoes || '',
        ativo: cliente.ativo,
      });
    }
  }, [open, isEditMode, cliente]);

  const isPF = formData.tipo_pessoa === 'pf';
  const isPJ = formData.tipo_pessoa === 'pj';

  const formatTelefoneToFields = (telefone: string) => {
    const numeros = telefone.replace(/\D/g, '');

    // Se o número começar com DDI 55, remover antes de processar
    // DDI 55 = Brasil, DDDs válidos são de 11-99 (nunca 55 como primeiro dígito do DDD)
    let numerosProcessados = numeros;
    if (numeros.length >= 12 && numeros.startsWith('55')) {
      // Remove o DDI 55 do início
      numerosProcessados = numeros.substring(2);
    }

    if (numerosProcessados.length >= 10) {
      return {
        ddd: numerosProcessados.substring(0, 2),
        numero: numerosProcessados.substring(2),
      };
    }
    return { ddd: '', numero: '' };
  };

  // Corrige dados de telefone salvos incorretamente (DDI no lugar de DDD)
  const corrigirTelefoneComDDI = (ddd: string, numero: string): { ddd: string; numero: string } => {
    if (!ddd || !numero) return { ddd: ddd || '', numero: numero || '' };

    const dddLimpo = ddd.replace(/\D/g, '');
    const numeroLimpo = numero.replace(/\D/g, '');

    // Se o DDD for "55" (DDI do Brasil) e o número tiver mais de 9 dígitos,
    // provavelmente o DDD real está no início do número
    if (dddLimpo === '55' && numeroLimpo.length >= 10) {
      return {
        ddd: numeroLimpo.substring(0, 2),
        numero: numeroLimpo.substring(2),
      };
    }

    return { ddd: dddLimpo, numero: numeroLimpo };
  };

  // Formata telefone para exibição no InputTelefone com a máscara correta
  const formatTelefoneForInput = (ddd: string, numero: string, mode: 'cell' | 'landline'): string => {
    if (!ddd || !numero) return '';

    // Primeiro corrige possíveis dados salvos com DDI no lugar de DDD
    const corrigido = corrigirTelefoneComDDI(ddd, numero);
    const dddLimpo = corrigido.ddd;
    const numeroLimpo = corrigido.numero;

    if (mode === 'cell' && numeroLimpo.length === 9) {
      // Celular: (XX) XXXXX-XXXX
      return `(${dddLimpo}) ${numeroLimpo.substring(0, 5)}-${numeroLimpo.substring(5)}`;
    } else if (mode === 'landline' && numeroLimpo.length === 8) {
      // Fixo: (XX) XXXX-XXXX
      return `(${dddLimpo}) ${numeroLimpo.substring(0, 4)}-${numeroLimpo.substring(4)}`;
    }

    // Fallback: retorna sem hífen mas deixa o InputTelefone aplicar a máscara
    return `(${dddLimpo}) ${numeroLimpo}`;
  };

  const handleAddEmail = () => {
    if (novoEmail && novoEmail.includes('@')) {
      setFormData(prev => ({
        ...prev,
        emails: [...prev.emails, novoEmail],
      }));
      setNovoEmail('');
    }
  };

  const handleRemoveEmail = (index: number) => {
    setFormData(prev => ({
      ...prev,
      emails: prev.emails.filter((_, i) => i !== index),
    }));
  };

  const handleAddressFound = (address: InputCepAddress) => {
    setFormData(prev => ({
      ...prev,
      logradouro: address.logradouro || prev.logradouro,
      bairro: address.bairro || prev.bairro,
      municipio: address.localidade || prev.municipio,
      estado_sigla: address.uf || prev.estado_sigla,
    }));
  };

  const validateStep = (step: number): string[] => {
    const errors: string[] = [];

    switch (step) {
      case 1:
        if (!formData.tipo_pessoa) {
          errors.push('Selecione o tipo de pessoa');
        }
        break;

      case 2:
        if (!formData.nome.trim()) {
          errors.push('Nome é obrigatório');
        }
        if (isPF) {
          const cpfLimpo = formData.cpf.replace(/\D/g, '');
          if (!cpfLimpo) {
            errors.push('CPF é obrigatório');
          } else if (cpfLimpo.length !== 11 || !/^\d{11}$/.test(cpfLimpo)) {
            errors.push('CPF deve ter 11 dígitos');
          }
        }
        if (isPJ) {
          const cnpjLimpo = formData.cnpj.replace(/\D/g, '');
          if (!cnpjLimpo) {
            errors.push('CNPJ é obrigatório');
          } else if (cnpjLimpo.length !== 14 || !/^\d{14}$/.test(cnpjLimpo)) {
            errors.push('CNPJ deve ter 14 dígitos');
          }
        }
        break;

      case 3:
        if (novoEmail && !novoEmail.includes('@')) {
          errors.push('E-mail em edição possui formato inválido');
        }
        break;
    }

    return errors;
  };

  const handleNext = () => {
    const errors = validateStep(currentStep);
    if (errors.length > 0) {
      toast.error(errors.join('\n'));
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS));
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, isEditMode ? 2 : 1));
  };

  const handleSubmit = () => {
    const errors = validateStep(currentStep);
    if (errors.length > 0) {
      toast.error(errors.join('\n'));
      return;
    }

    // Submeter o form
    formRef.current?.requestSubmit();
  };

  // Renderizar Step 1 - Tipo de Pessoa
  const renderStep1 = () => (
    <div className="py-4">
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setFormData(prev => ({ ...prev, tipo_pessoa: 'pf' }))}
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-md border transition-all text-left',
            isPF
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
          )}
        >
          <div className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full shrink-0',
            isPF ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          )}>
            <User className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn('font-medium text-sm', isPF && 'text-primary')}>
              Pessoa Física
            </p>
            <p className="text-xs text-muted-foreground">
              CPF, RG, data de nascimento
            </p>
          </div>
          {isPF && (
            <Check className="h-4 w-4 text-primary shrink-0" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setFormData(prev => ({ ...prev, tipo_pessoa: 'pj' }))}
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-md border transition-all text-left',
            isPJ
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
          )}
        >
          <div className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full shrink-0',
            isPJ ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          )}>
            <Building2 className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn('font-medium text-sm', isPJ && 'text-primary')}>
              Pessoa Jurídica
            </p>
            <p className="text-xs text-muted-foreground">
              CNPJ, razão social, nome fantasia
            </p>
          </div>
          {isPJ && (
            <Check className="h-4 w-4 text-primary shrink-0" />
          )}
        </button>
      </div>
    </div>
  );

  // Renderizar Step 2 - Identificacao
  const renderStep2 = () => (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="nome">
          {isPF ? 'Nome Completo' : 'Razão Social'} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="nome"
          name="nome"
          value={formData.nome}
          onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
          placeholder={isPF ? 'Ex: Joao da Silva' : 'Ex: Empresa LTDA'}
          autoFocus
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="nome_social_fantasia">
          {isPF ? 'Nome Social' : 'Nome Fantasia'}
        </Label>
        <Input
          id="nome_social_fantasia"
          name="nome_social_fantasia"
          value={formData.nome_social_fantasia}
          onChange={(e) => setFormData(prev => ({ ...prev, nome_social_fantasia: e.target.value }))}
          placeholder={isPF ? 'Nome social (opcional)' : 'Nome fantasia (opcional)'}
        />
      </div>

      {isPF && (
        <>
          <div className="grid gap-2">
            <Label htmlFor="cpf">
              CPF <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cpf"
              name="cpf"
              value={formData.cpf}
              onChange={(e) => setFormData(prev => ({ ...prev, cpf: formatarCPF(e.target.value) }))}
              placeholder="000.000.000-00"
              maxLength={14}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="rg">RG</Label>
              <Input
                id="rg"
                name="rg"
                value={formData.rg}
                onChange={(e) => setFormData(prev => ({ ...prev, rg: e.target.value }))}
                placeholder="Número do RG"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="data_nascimento">Data de Nascimento</Label>
              <FormDatePicker
                id="data_nascimento"
                value={formData.data_nascimento || undefined}
                onChange={(v) => setFormData(prev => ({ ...prev, data_nascimento: v || '' }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="genero">Gênero</Label>
              {mounted ? (
                <Select
                  value={formData.genero}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, genero: value }))}
                >
                  <SelectTrigger id="genero">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {GENEROS.map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" />
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="estado_civil">Estado Civil</Label>
              {mounted ? (
                <Select
                  value={formData.estado_civil}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, estado_civil: value }))}
                >
                  <SelectTrigger id="estado_civil">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_CIVIS.map((ec) => (
                      <SelectItem key={ec.value} value={ec.value}>
                        {ec.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="nacionalidade">Nacionalidade</Label>
              <Input
                id="nacionalidade"
                name="nacionalidade"
                value={formData.nacionalidade}
                onChange={(e) => setFormData(prev => ({ ...prev, nacionalidade: e.target.value }))}
                placeholder="Ex: Brasileira"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nome_genitora">Nome da Mãe</Label>
              <Input
                id="nome_genitora"
                name="nome_genitora"
                value={formData.nome_genitora}
                onChange={(e) => setFormData(prev => ({ ...prev, nome_genitora: e.target.value }))}
                placeholder="Nome completo da mãe"
              />
            </div>
          </div>
        </>
      )}

      {isPJ && (
        <>
          <div className="grid gap-2">
            <Label htmlFor="cnpj">
              CNPJ <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cnpj"
              name="cnpj"
              value={formData.cnpj}
              onChange={(e) => setFormData(prev => ({ ...prev, cnpj: formatarCNPJ(e.target.value) }))}
              placeholder="00.000.000/0000-00"
              maxLength={18}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="inscricao_estadual">Inscrição Estadual</Label>
              <Input
                id="inscricao_estadual"
                name="inscricao_estadual"
                value={formData.inscricao_estadual}
                onChange={(e) => setFormData(prev => ({ ...prev, inscricao_estadual: e.target.value }))}
                placeholder="Numero da IE"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="data_abertura">Data de Abertura</Label>
              <FormDatePicker
                id="data_abertura"
                value={formData.data_abertura || undefined}
                onChange={(v) => setFormData(prev => ({ ...prev, data_abertura: v || '' }))}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );

  // Renderizar Step 3 - Contato
  const renderStep3 = () => (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="novo-email-cliente">E-mails</Label>
        <div className="flex gap-2">
          <Input
            id="novo-email-cliente"
            type="email"
            value={novoEmail}
            onChange={(e) => setNovoEmail(e.target.value)}
            placeholder="Digite um e-mail..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddEmail();
              }
            }}
            aria-describedby="novo-email-cliente-hint"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleAddEmail}
            disabled={!novoEmail || !novoEmail.includes('@')}
            aria-label="Adicionar e-mail"
            title="Adicionar e-mail"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <p id="novo-email-cliente-hint" className="sr-only">
          Pressione Enter ou clique em + para adicionar múltiplos e-mails
        </p>
        {formData.emails.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.emails.map((email, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="gap-1 pr-1"
              >
                {email}
                <button
                  type="button"
                  onClick={() => handleRemoveEmail(index)}
                  className="ml-1 hover:bg-muted rounded-full p-0.5"
                  aria-label={`Remover e-mail ${email}`}
                  title={`Remover e-mail ${email}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-2">
        <Label>Celular</Label>
        <InputTelefone
          mode="cell"
          value={formatTelefoneForInput(formData.ddd_celular, formData.numero_celular, 'cell')}
          onChange={(e) => {
            const { ddd, numero } = formatTelefoneToFields(e.target.value);
            setFormData(prev => ({
              ...prev,
              ddd_celular: ddd,
              numero_celular: numero,
            }));
          }}
          placeholder="(00) 00000-0000"
        />
      </div>

      <div className="grid gap-2">
        <Label>Telefone Residencial</Label>
        <InputTelefone
          mode="landline"
          value={formatTelefoneForInput(formData.ddd_residencial, formData.numero_residencial, 'landline')}
          onChange={(e) => {
            const { ddd, numero } = formatTelefoneToFields(e.target.value);
            setFormData(prev => ({
              ...prev,
              ddd_residencial: ddd,
              numero_residencial: numero,
            }));
          }}
          placeholder="(00) 0000-0000"
        />
      </div>

      <div className="grid gap-2">
        <Label>Telefone Comercial</Label>
        <InputTelefone
          mode="landline"
          value={formatTelefoneForInput(formData.ddd_comercial, formData.numero_comercial, 'landline')}
          onChange={(e) => {
            const { ddd, numero } = formatTelefoneToFields(e.target.value);
            setFormData(prev => ({
              ...prev,
              ddd_comercial: ddd,
              numero_comercial: numero,
            }));
          }}
          placeholder="(00) 0000-0000"
        />
      </div>
    </div>
  );

  // Renderizar Step 4 - Endereco
  const renderStep4 = () => (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label>CEP</Label>
        <InputCEP
          value={formData.cep}
          onChange={(e) => setFormData(prev => ({ ...prev, cep: e.target.value }))}
          onAddressFound={handleAddressFound}
          placeholder="00000-000"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="logradouro">Logradouro</Label>
        <Input
          id="logradouro"
          value={formData.logradouro}
          onChange={(e) => setFormData(prev => ({ ...prev, logradouro: e.target.value }))}
          placeholder="Rua, Avenida, etc."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="numero">Número</Label>
          <Input
            id="numero"
            value={formData.numero}
            onChange={(e) => setFormData(prev => ({ ...prev, numero: e.target.value }))}
            placeholder="No"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="complemento">Complemento</Label>
          <Input
            id="complemento"
            value={formData.complemento}
            onChange={(e) => setFormData(prev => ({ ...prev, complemento: e.target.value }))}
            placeholder="Apto, Sala, etc."
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="bairro">Bairro</Label>
        <Input
          id="bairro"
          value={formData.bairro}
          onChange={(e) => setFormData(prev => ({ ...prev, bairro: e.target.value }))}
          placeholder="Nome do bairro"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="municipio">Cidade</Label>
          <Input
            id="municipio"
            value={formData.municipio}
            onChange={(e) => setFormData(prev => ({ ...prev, municipio: e.target.value }))}
            placeholder="Nome da cidade"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="estado_sigla">Estado</Label>
          {mounted ? (
            <Select
              value={formData.estado_sigla}
              onValueChange={(value) => setFormData(prev => ({ ...prev, estado_sigla: value }))}
            >
              <SelectTrigger id="estado_sigla">
                <SelectValue placeholder="UF" />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS_BR.map((uf) => (
                  <SelectItem key={uf} value={uf}>
                    {uf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" />
          )}
        </div>
      </div>
    </div>
  );

  // Renderizar Step 5 - Informacoes Adicionais
  const renderStep5 = () => {
    // Helper para formatar telefone para exibição
    const formatTelefone = (ddd: string, numero: string) => {
      if (!ddd || !numero) return '-';
      return `(${ddd}) ${numero}`;
    };

    return (
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="observacoes">Observações</Label>
          <Textarea
            id="observacoes"
            name="observacoes"
            value={formData.observacoes}
            onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
            placeholder="Observações adicionais sobre o cliente..."
            rows={4}
          />
        </div>

        <div className="mt-4 p-4 rounded-lg bg-muted/50 border">
          <Heading level="subsection" className="mb-3">Resumo do cadastro</Heading>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Tipo</dt>
              <dd className="font-medium text-right">{isPF ? 'Pessoa Física' : 'Pessoa Jurídica'}</dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-muted-foreground">Nome</dt>
              <dd className="font-medium text-right max-w-[60%] wrap-break-word">{formData.nome || '-'}</dd>
            </div>

            {formData.nome_social_fantasia && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{isPF ? 'Nome Social' : 'Nome Fantasia'}</dt>
                <dd className="font-medium text-right max-w-[60%] wrap-break-word">{formData.nome_social_fantasia}</dd>
              </div>
            )}

            <div className="flex justify-between">
              <dt className="text-muted-foreground">{isPF ? 'CPF' : 'CNPJ'}</dt>
              <dd className="font-medium text-right">{isPF ? formData.cpf || '-' : formData.cnpj || '-'}</dd>
            </div>

            {isPF && formData.rg && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">RG</dt>
                <dd className="font-medium text-right">{formData.rg}</dd>
              </div>
            )}

            {isPF && formData.data_nascimento && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Data de Nascimento</dt>
                <dd className="font-medium text-right">{formData.data_nascimento}</dd>
              </div>
            )}

            {isPJ && formData.data_abertura && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Data de Abertura</dt>
                <dd className="font-medium text-right">{formData.data_abertura}</dd>
              </div>
            )}

            {isPF && formData.genero && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Gênero</dt>
                <dd className="font-medium text-right">{GENEROS.find(g => g.value === formData.genero)?.label || formData.genero}</dd>
              </div>
            )}

            {isPF && formData.estado_civil && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Estado Civil</dt>
                <dd className="font-medium text-right">{ESTADOS_CIVIS.find(ec => ec.value === formData.estado_civil)?.label || formData.estado_civil}</dd>
              </div>
            )}

            {isPF && formData.nacionalidade && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Nacionalidade</dt>
                <dd className="font-medium text-right">{formData.nacionalidade}</dd>
              </div>
            )}

            {isPF && formData.nome_genitora && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Nome da Mãe</dt>
                <dd className="font-medium text-right max-w-[60%] wrap-break-word">{formData.nome_genitora}</dd>
              </div>
            )}

            {isPJ && formData.inscricao_estadual && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Inscrição Estadual</dt>
                <dd className="font-medium text-right">{formData.inscricao_estadual}</dd>
              </div>
            )}

            <div className="flex justify-between">
              <dt className="text-muted-foreground">E-mails</dt>
              <dd className="font-medium text-right">{formData.emails.length > 0 ? formData.emails.join(', ') : '-'}</dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-muted-foreground">Celular</dt>
              <dd className="font-medium text-right">{formatTelefone(formData.ddd_celular, formData.numero_celular)}</dd>
            </div>

            {(formData.ddd_residencial && formData.numero_residencial) && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Tel. Residencial</dt>
                <dd className="font-medium text-right">{formatTelefone(formData.ddd_residencial, formData.numero_residencial)}</dd>
              </div>
            )}

            {(formData.ddd_comercial && formData.numero_comercial) && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Tel. Comercial</dt>
                <dd className="font-medium text-right">{formatTelefone(formData.ddd_comercial, formData.numero_comercial)}</dd>
              </div>
            )}

            {formData.cep && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">CEP</dt>
                <dd className="font-medium text-right">{formData.cep}</dd>
              </div>
            )}

            {formData.logradouro && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Endereço</dt>
                <dd className="font-medium text-right max-w-[60%] wrap-break-word">
                  {formData.logradouro}{formData.numero ? `, ${formData.numero}` : ''}{formData.complemento ? ` - ${formData.complemento}` : ''}
                </dd>
              </div>
            )}

            {formData.bairro && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Bairro</dt>
                <dd className="font-medium text-right">{formData.bairro}</dd>
              </div>
            )}

            {(formData.municipio || formData.estado_sigla) && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Cidade/UF</dt>
                <dd className="font-medium text-right">{formData.municipio || '-'}{formData.estado_sigla ? `/${formData.estado_sigla}` : ''}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      default:
        return null;
    }
  };

  const stepInfo = STEP_INFO[currentStep as keyof typeof STEP_INFO];
  const isFirstStep = currentStep === (isEditMode ? 2 : 1);
  const isLastStep = currentStep === TOTAL_STEPS;

  return (
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEditMode ? 'Editar Cliente' : stepInfo.title}
      multiStep={{
        current: isEditMode ? currentStep - 1 : currentStep,
        total: isEditMode ? TOTAL_STEPS - 1 : TOTAL_STEPS,
        stepTitle: stepInfo.title,
      }}
      footer={
        <div className="flex justify-end w-full gap-2">
            <DialogNavPrevious
              onClick={handlePrevious}
              disabled={isFirstStep || isPending}
              hidden={isFirstStep}
            />

            {isLastStep ? (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  isEditMode ? 'Salvar' : 'Criar Cliente'
                )}
              </Button>
            ) : (
              <DialogNavNext
                onClick={handleNext}
                disabled={isPending}
              />
            )}
          </div>
      }
    >
        <form ref={formRef} action={formAction}>
          {/* Hidden fields para todos os dados do form */}
          <input type="hidden" name="tipo_pessoa" value={formData.tipo_pessoa || ''} />
          <input type="hidden" name="ativo" value={formData.ativo ? 'true' : 'false'} />
          {/* Campos de identificação (Step 2) */}
          <input type="hidden" name="nome" value={formData.nome} />
          <input type="hidden" name="nome_social_fantasia" value={formData.nome_social_fantasia} />
          <input type="hidden" name="cpf" value={formData.cpf} />
          <input type="hidden" name="cnpj" value={formData.cnpj} />
          <input type="hidden" name="rg" value={formData.rg} />
          <input type="hidden" name="data_nascimento" value={formData.data_nascimento} />
          <input type="hidden" name="data_abertura" value={formData.data_abertura} />
          <input type="hidden" name="genero" value={formData.genero} />
          <input type="hidden" name="estado_civil" value={formData.estado_civil} />
          <input type="hidden" name="nacionalidade" value={formData.nacionalidade} />
          <input type="hidden" name="nome_genitora" value={formData.nome_genitora} />
          <input type="hidden" name="inscricao_estadual" value={formData.inscricao_estadual} />
          {/* Campos de contato (Step 3) */}
          <input type="hidden" name="emails" value={JSON.stringify(formData.emails)} />
          <input type="hidden" name="ddd_celular" value={formData.ddd_celular} />
          <input type="hidden" name="numero_celular" value={formData.numero_celular} />
          <input type="hidden" name="ddd_residencial" value={formData.ddd_residencial} />
          <input type="hidden" name="numero_residencial" value={formData.numero_residencial} />
          <input type="hidden" name="ddd_comercial" value={formData.ddd_comercial} />
          <input type="hidden" name="numero_comercial" value={formData.numero_comercial} />
          {/* Endereço (Step 4) */}
          <input type="hidden" name="cep" value={formData.cep} />
          <input type="hidden" name="logradouro" value={formData.logradouro} />
          <input type="hidden" name="numero" value={formData.numero} />
          <input type="hidden" name="complemento" value={formData.complemento} />
          <input type="hidden" name="bairro" value={formData.bairro} />
          <input type="hidden" name="municipio" value={formData.municipio} />
          <input type="hidden" name="estado_sigla" value={formData.estado_sigla} />
          {/* Observações (Step 5) */}
          <input type="hidden" name="observacoes" value={formData.observacoes} />

          <div>
            {renderCurrentStep()}
          </div>
        </form>
    </DialogFormShell>
  );
}

export { ClienteFormDialog as ClienteForm };
