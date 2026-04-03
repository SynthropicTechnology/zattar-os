'use client';

/**
 * RepresentanteForm - Formulário de Representante (Advogado) com Server Actions
 *
 * Componente de formulário que utiliza Server Actions para criar/editar representantes.
 * Implementa validação client-side e integração com useActionState (React 19).
 * Representantes são sempre pessoas físicas (advogados).
 */

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
import { AppBadge as Badge } from '@/components/ui/app-badge';
import {
  Loader2,
  X,
  Plus,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { InputCEP, type InputCepAddress } from '@/app/(authenticated)/enderecos';
import type { Endereco } from '@/app/(authenticated)/enderecos/types';
import { InputTelefone } from '@/components/ui/input-telefone';
import { actionCriarRepresentante, actionAtualizarRepresentante } from '../../actions/representantes-actions';
import type { Representante, InscricaoOAB, TipoRepresentante, SituacaoOAB } from '../../types/representantes';
import { DialogFormShell, DialogNavPrevious, DialogNavNext } from '@/components/shared/dialog-shell';

// =============================================================================

interface RepresentanteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  representante?: Representante; // Se fornecido, modo edição
  mode?: 'create' | 'edit';
}

const TOTAL_STEPS = 4;

const STEP_INFO = {
  1: {
    title: 'Identificação',
    description: 'Informe os dados de identificação do representante',
  },
  2: {
    title: 'Contato',
    description: 'Informe os dados de contato do representante',
  },
  3: {
    title: 'Endereço',
    description: 'Informe o endereço do representante (opcional)',
  },
  4: {
    title: 'Informações Adicionais',
    description: 'Revise e adicione observações se necessário',
  },
};

const ESTADOS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const TIPOS_REPRESENTANTE: { value: TipoRepresentante; label: string }[] = [
  { value: 'ADVOGADO', label: 'Advogado' },
  { value: 'PROCURADOR', label: 'Procurador' },
  { value: 'DEFENSOR_PUBLICO', label: 'Defensor Público' },
  { value: 'ADVOGADO_DATIVO', label: 'Advogado Dativo' },
  { value: 'OUTRO', label: 'Outro' },
];

const SITUACOES_OAB: { value: SituacaoOAB; label: string }[] = [
  { value: 'REGULAR', label: 'Regular' },
  { value: 'SUSPENSO', label: 'Suspenso' },
  { value: 'CANCELADO', label: 'Cancelado' },
  { value: 'LICENCIADO', label: 'Licenciado' },
  { value: 'FALECIDO', label: 'Falecido' },
];

// =============================================================================
// FORMATAÇÃO (apenas UI/masking)
// =============================================================================

function formatarCPF(value: string): string {
  const numeros = value.replace(/\D/g, '').slice(0, 11);
  return numeros
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

// =============================================================================
// ESTADO INICIAL
// =============================================================================

const INITIAL_FORM_STATE = {
  cpf: '',
  nome: '',
  sexo: '',
  tipo: '',
  oabs: [] as InscricaoOAB[],
  emails: [] as string[],
  email: '',
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
};

const INITIAL_OAB_STATE = {
  numero: '',
  uf: '',
  situacao: 'REGULAR' as SituacaoOAB,
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function RepresentanteFormDialog({
  open,
  onOpenChange,
  onSuccess,
  representante,
  mode = 'create',
}: RepresentanteFormDialogProps) {
  const isEditMode = mode === 'edit' && representante;
  const [currentStep, setCurrentStep] = React.useState(1);
  const [formData, setFormData] = React.useState(INITIAL_FORM_STATE);
  const [novoEmail, setNovoEmail] = React.useState('');
  const [novaOAB, setNovaOAB] = React.useState(INITIAL_OAB_STATE);
  const [mounted, setMounted] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  // Garantir que o componente só renderize Select após hidratação
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Server Action com useActionState
  type ActionResponse = { success: boolean; data?: unknown; error?: string };
  const initialState: ActionResponse | null = null;

  const boundAction = React.useCallback(
    async (prevState: ActionResponse | null, formData: FormData) => {
      // Converter FormData para CriarRepresentanteParams/AtualizarRepresentanteParams
      const cpf = formData.get('cpf')?.toString().replace(/\D/g, '') || '';
      const nome = formData.get('nome')?.toString().trim() || '';
      const sexo = formData.get('sexo')?.toString() || null;
      const tipo = formData.get('tipo')?.toString() || null;
      
      // Emails
      const emailsRaw = formData.get('emails');
      const emails = emailsRaw ? JSON.parse(emailsRaw.toString()) : null;
      
      // OABs
      const oabsRaw = formData.get('oabs');
      const oabs = oabsRaw ? JSON.parse(oabsRaw.toString()) : [];

      const params = {
        cpf,
        nome,
        sexo,
        tipo,
        emails,
        oabs,
        ddd_celular: formData.get('ddd_celular')?.toString() || null,
        numero_celular: formData.get('numero_celular')?.toString() || null,
        ddd_residencial: formData.get('ddd_residencial')?.toString() || null,
        numero_residencial: formData.get('numero_residencial')?.toString() || null,
        ddd_comercial: formData.get('ddd_comercial')?.toString() || null,
        numero_comercial: formData.get('numero_comercial')?.toString() || null,
        endereco_id: null, // Por enquanto, não gerenciamos endereço diretamente
      };

      if (isEditMode && representante) {
        return actionAtualizarRepresentante({ id: representante.id, ...params });
      }
      return actionCriarRepresentante(params);
    },
    [isEditMode, representante]
  );

  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  // Usar useRef para manter referência estável de onSuccess
  const onSuccessRef = React.useRef(onSuccess);
  React.useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  // Efeito para tratar resultado da action
  React.useEffect(() => {
    if (state) {
      if (state.success) {
        toast.success('Representante salvo com sucesso');
        onOpenChange(false);
        onSuccessRef.current?.();
      } else {
        toast.error(state.error || 'Erro ao salvar representante');
      }
    }
  }, [state, onOpenChange]);

  // Reset ao fechar ou inicializar com dados do representante
  React.useEffect(() => {
    if (!open) {
      setCurrentStep(1);
      setFormData(INITIAL_FORM_STATE);
      setNovoEmail('');
      setNovaOAB(INITIAL_OAB_STATE);
    } else if (isEditMode && representante) {
      // Cast para acessar endereco se existir (vem do join)
      const representanteComEndereco = representante as unknown as { endereco?: Endereco };
      const endereco = representanteComEndereco.endereco;

      // Preencher com dados do representante para edição
      setFormData({
        cpf: formatarCPF(representante.cpf || ''),
        nome: representante.nome,
        sexo: representante.sexo || '',
        tipo: representante.tipo || '',
        oabs: representante.oabs || [],
        emails: representante.emails || [],
        email: representante.email || '',
        ddd_celular: representante.ddd_celular || '',
        numero_celular: representante.numero_celular || '',
        ddd_residencial: representante.ddd_residencial || '',
        numero_residencial: representante.numero_residencial || '',
        ddd_comercial: representante.ddd_comercial || '',
        numero_comercial: representante.numero_comercial || '',
        cep: endereco?.cep || '',
        logradouro: endereco?.logradouro || '',
        numero: endereco?.numero || '',
        complemento: endereco?.complemento || '',
        bairro: endereco?.bairro || '',
        municipio: endereco?.municipio || '',
        estado_sigla: endereco?.estado_sigla || endereco?.estado || '',
      });
    }
  }, [open, isEditMode, representante]);

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

  const handleAddOAB = () => {
    if (novaOAB.numero && novaOAB.uf) {
      setFormData(prev => ({
        ...prev,
        oabs: [...prev.oabs, { ...novaOAB }],
      }));
      setNovaOAB(INITIAL_OAB_STATE);
    }
  };

  const handleRemoveOAB = (index: number) => {
    setFormData(prev => ({
      ...prev,
      oabs: prev.oabs.filter((_, i) => i !== index),
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
        if (!formData.nome.trim()) {
          errors.push('Nome é obrigatório');
        }
        const cpfLimpo = formData.cpf.replace(/\D/g, '');
        if (!cpfLimpo) {
          errors.push('CPF é obrigatório');
        } else if (cpfLimpo.length !== 11 || !/^\d{11}$/.test(cpfLimpo)) {
          errors.push('CPF deve ter 11 dígitos');
        }
        break;

      case 2:
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
    setCurrentStep(prev => Math.max(prev - 1, 1));
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

  // Renderizar Step 1 - Identificação
  const renderStep1 = () => (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="nome">
          Nome Completo <span className="text-destructive">*</span>
        </Label>
        <Input
          id="nome"
          name="nome"
          value={formData.nome}
          onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
          placeholder="Ex: João da Silva"
          autoFocus
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div className="grid gap-2">
          <Label htmlFor="sexo">Sexo</Label>
          {mounted ? (
            <Select
              value={formData.sexo}
              onValueChange={(value) => setFormData(prev => ({ ...prev, sexo: value }))}
            >
              <SelectTrigger id="sexo">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Masculino</SelectItem>
                <SelectItem value="F">Feminino</SelectItem>
                <SelectItem value="O">Outro</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" />
          )}
          <input type="hidden" name="sexo" value={formData.sexo} />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="tipo">Tipo de Representante</Label>
        {mounted ? (
          <Select
            value={formData.tipo}
            onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value }))}
          >
            <SelectTrigger id="tipo">
              <SelectValue placeholder="Selecione o tipo..." />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_REPRESENTANTE.map((tipo) => (
                <SelectItem key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" />
        )}
        <input type="hidden" name="tipo" value={formData.tipo} />
      </div>

      <div className="grid gap-2">
        <Label>Inscrições OAB</Label>
        <div className="grid gap-2 border rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input
              placeholder="Número OAB"
              value={novaOAB.numero}
              onChange={(e) => setNovaOAB(prev => ({ ...prev, numero: e.target.value }))}
            />
            {mounted ? (
              <Select
                value={novaOAB.uf}
                onValueChange={(value) => setNovaOAB(prev => ({ ...prev, uf: value }))}
              >
                <SelectTrigger>
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
            {mounted ? (
              <Select
                value={novaOAB.situacao}
                onValueChange={(value) => setNovaOAB(prev => ({ ...prev, situacao: value as SituacaoOAB }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Situação" />
                </SelectTrigger>
                <SelectContent>
                  {SITUACOES_OAB.map((sit) => (
                    <SelectItem key={sit.value} value={sit.value}>
                      {sit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" />
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddOAB}
            disabled={!novaOAB.numero || !novaOAB.uf}
            className="w-fit"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar OAB
          </Button>
        </div>
        {formData.oabs.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.oabs.map((oab, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="gap-1 pr-1"
              >
                {oab.numero}/{oab.uf} ({SITUACOES_OAB.find(s => s.value === oab.situacao)?.label || oab.situacao})
                <button
                  type="button"
                  onClick={() => handleRemoveOAB(index)}
                  className="ml-1 hover:bg-muted rounded-full p-0.5"
                  aria-label={`Remover OAB ${oab.numero}/${oab.uf}`}
                  title={`Remover OAB ${oab.numero}/${oab.uf}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Renderizar Step 2 - Contato
  const renderStep2 = () => (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="novo-email-representante">E-mails</Label>
        <div className="flex gap-2">
          <Input
            id="novo-email-representante"
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
            aria-describedby="novo-email-representante-hint"
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
        <p id="novo-email-representante-hint" className="sr-only">
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

  // Renderizar Step 3 - Endereço
  const renderStep3 = () => (
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

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="numero">Número</Label>
          <Input
            id="numero"
            value={formData.numero}
            onChange={(e) => setFormData(prev => ({ ...prev, numero: e.target.value }))}
            placeholder="Nº"
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

      <div className="grid grid-cols-2 gap-4">
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

  // Renderizar Step 4 - Informações Adicionais
  const renderStep4 = () => (
    <div className="grid gap-4 py-4">
      <div className="mt-4 p-4 rounded-lg bg-muted/50 border">
        <h4 className="font-medium mb-2">Resumo do cadastro</h4>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Nome:</dt>
          <dd className="font-medium truncate">{formData.nome || '-'}</dd>

          <dt className="text-muted-foreground">CPF:</dt>
          <dd className="font-medium">{formData.cpf || '-'}</dd>

          <dt className="text-muted-foreground">Tipo:</dt>
          <dd className="font-medium">{TIPOS_REPRESENTANTE.find(t => t.value === formData.tipo)?.label || '-'}</dd>

          <dt className="text-muted-foreground">OABs:</dt>
          <dd className="font-medium">{formData.oabs.length || '0'}</dd>

          <dt className="text-muted-foreground">E-mails:</dt>
          <dd className="font-medium">{formData.emails.length || '0'}</dd>

          <dt className="text-muted-foreground">Cidade:</dt>
          <dd className="font-medium">{formData.municipio || '-'}</dd>
        </dl>
      </div>
    </div>
  );

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
      default:
        return null;
    }
  };

  const stepInfo = STEP_INFO[currentStep as keyof typeof STEP_INFO];
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === TOTAL_STEPS;

  return (
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEditMode ? 'Editar Representante' : stepInfo.title}
      multiStep={{
        current: currentStep,
        total: TOTAL_STEPS,
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
                    {isEditMode ? 'Salvando...' : 'Criando...'}
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {isEditMode ? 'Salvar Alterações' : 'Criar Representante'}
                  </>
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
          <input type="hidden" name="cpf" value={formData.cpf.replace(/\D/g, '')} />
          <input type="hidden" name="nome" value={formData.nome} />
          <input type="hidden" name="emails" value={JSON.stringify(formData.emails)} />
          <input type="hidden" name="oabs" value={JSON.stringify(formData.oabs)} />
          <input type="hidden" name="ddd_celular" value={formData.ddd_celular} />
          <input type="hidden" name="numero_celular" value={formData.numero_celular} />
          <input type="hidden" name="ddd_residencial" value={formData.ddd_residencial} />
          <input type="hidden" name="numero_residencial" value={formData.numero_residencial} />
          <input type="hidden" name="ddd_comercial" value={formData.ddd_comercial} />
          <input type="hidden" name="numero_comercial" value={formData.numero_comercial} />

          <div>
            {renderCurrentStep()}
          </div>
        </form>
    </DialogFormShell>
  );
}

export { RepresentanteFormDialog as RepresentanteForm };
