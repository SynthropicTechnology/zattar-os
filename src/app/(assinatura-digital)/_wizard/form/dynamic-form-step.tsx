'use client';

import { useState, useEffect } from 'react';
import { useFormularioStore } from '@/shared/assinatura-digital/store';
import { toast } from 'sonner';
import { DynamicFormData, DynamicFormSchema } from '@/shared/assinatura-digital/types';
import DynamicFormRenderer from './dynamic-form-renderer';
import FormStepLayout from './form-step-layout';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function DynamicFormStep() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [schema, setSchema] = useState<DynamicFormSchema | null>(null);

  /**
   * Calcula TRT ID e nome baseado na UF do cliente
   */
  const calculateTRT = (uf?: string): { trt_id: number | null; trt_nome: string | null } => {
    if (!uf) return { trt_id: null, trt_nome: null };

    const trtMap: Record<string, { id: number; nome: string }> = {
      'SP': { id: 2, nome: '2ª Região - São Paulo' },
      'RJ': { id: 1, nome: '1ª Região - Rio de Janeiro' },
      'MG': { id: 3, nome: '3ª Região - Minas Gerais' },
      'RS': { id: 4, nome: '4ª Região - Rio Grande do Sul' },
      'BA': { id: 5, nome: '5ª Região - Bahia' },
      'PE': { id: 6, nome: '6ª Região - Pernambuco' },
      'CE': { id: 7, nome: '7ª Região - Ceará' },
      'PA': { id: 8, nome: '8ª Região - Pará' },
      'PR': { id: 9, nome: '9ª Região - Paraná' },
      'DF': { id: 10, nome: '10ª Região - Distrito Federal' },
      'AM': { id: 11, nome: '11ª Região - Amazonas' },
      'SC': { id: 12, nome: '12ª Região - Santa Catarina' },
      'PB': { id: 13, nome: '13ª Região - Paraíba' },
      'RO': { id: 14, nome: '14ª Região - Rondônia' },
      'GO': { id: 18, nome: '18ª Região - Goiás' },
      'AL': { id: 19, nome: '19ª Região - Alagoas' },
      'SE': { id: 20, nome: '20ª Região - Sergipe' },
      'RN': { id: 21, nome: '21ª Região - Rio Grande do Norte' },
      'PI': { id: 22, nome: '22ª Região - Piauí' },
      'MT': { id: 23, nome: '23ª Região - Mato Grosso' },
      'MS': { id: 24, nome: '24ª Região - Mato Grosso do Sul' },
    };

    const trt = trtMap[uf.toUpperCase()];
    return trt ? { trt_id: trt.id, trt_nome: trt.nome } : { trt_id: null, trt_nome: null };
  };

  /**
   * Enriquece e transforma dados do formulário para o formato esperado pela API.
   *
   * Transformações aplicadas:
   * 1. Aplicativo: Remove 'aplicativo', adiciona parte_contraria_id e parte_contraria_nome
   * 2. PARTE_CONTRARIA_SEARCH: Normaliza dados auto-preenchidos para chaves padrão
   * 3. Modalidade: Adiciona modalidade_nome (baseado no schema)
   * 4. Situação: Remove 'situacao', adiciona flags ativo/bloqueado (V/F)
   * 5. Booleanos: Converte acidenteTrabalho e adoecimentoTrabalho de boolean para "V"/"F"
   */
  const enrichFormData = (data: DynamicFormData, formSchema: DynamicFormSchema | null): DynamicFormData => {
    const enriched = { ...data };

    if (!formSchema) return enriched;

    const allFields = formSchema.sections.flatMap(s => s.fields);

    // 1. Enriquecer aplicativo → parte_contraria
    if (data.aplicativo !== undefined) {
      const aplicativoField = allFields.find(f => f.id === 'aplicativo');

      if (aplicativoField?.options) {
        const selectedOption = aplicativoField.options.find(opt => opt.value === data.aplicativo);
        if (selectedOption) {
          enriched.parte_contraria_id = data.aplicativo;
          enriched.parte_contraria_nome = selectedOption.label;
          delete enriched.aplicativo;
        }
      }
    }

    // 2. Normalizar dados de PARTE_CONTRARIA_SEARCH para chaves padrão
    // Campos com tipo parte_contraria_search usam entitySearch.autoFill para mapear
    // campos da entidade (ex: nome, cpf) para campos do formulário (ex: nomeEmpresa).
    // Aqui normalizamos esses campos para as chaves esperadas pelo backend (parte_contraria_*).
    const parteContrariaSearchFields = allFields.filter(
      f => f.type === 'parte_contraria_search' && f.entitySearch?.autoFill
    );

    for (const field of parteContrariaSearchFields) {
      const autoFill = field.entitySearch!.autoFill!;
      const fieldValue = data[field.id];

      // O valor do campo de busca pode ser o ID da entidade
      if (fieldValue && !enriched.parte_contraria_id) {
        enriched.parte_contraria_id = fieldValue;
      }

      // Mapear campos auto-preenchidos para chaves padrão
      for (const [entityField, formFieldId] of Object.entries(autoFill)) {
        const value = data[formFieldId];
        if (value !== undefined && value !== null && value !== '') {
          const normalizedKey = entityField === 'nome' ? 'parte_contraria_nome'
            : entityField === 'cpf' ? 'parte_contraria_cpf'
            : entityField === 'cnpj' ? 'parte_contraria_cnpj'
            : entityField === 'telefone' ? 'parte_contraria_telefone'
            : entityField === 'email' || entityField === 'emails[0]' ? 'parte_contraria_email'
            : null;

          if (normalizedKey && !enriched[normalizedKey]) {
            enriched[normalizedKey] = value;
          }
        }
      }
    }

    // 3. Enriquecer modalidade
    if (data.modalidade !== undefined) {
      const modalidadeField = allFields.find(f => f.id === 'modalidade');

      if (modalidadeField?.options) {
        const selectedOption = modalidadeField.options.find(opt => opt.value === data.modalidade);
        if (selectedOption) {
          enriched.modalidade_nome = selectedOption.label;
        }
      }
    }

    // 4. Flags ativo/bloqueado (baseado em situacao)
    if (data.situacao !== undefined) {
      enriched.ativo = data.situacao === 'V' ? 'V' : 'F';
      enriched.bloqueado = data.situacao === 'F' ? 'V' : 'F';
      delete enriched.situacao;
    }

    // 5. Converter booleanos para V/F
    if (typeof data.acidenteTrabalho === 'boolean') {
      enriched.acidenteTrabalho = data.acidenteTrabalho ? 'V' : 'F';
    }

    if (typeof data.adoecimentoTrabalho === 'boolean') {
      enriched.adoecimentoTrabalho = data.adoecimentoTrabalho ? 'V' : 'F';
    }

    return enriched;
  };

  /**
   * Reordena as keys do objeto enriquecido em ordem lógica e conceitual
   *
   * Ordem das seções:
   * 1. Reclamada (empresa/aplicativo)
   * 2. Trabalhador (modalidade e status)
   * 3. Datas do relacionamento
   * 4. Saúde e segurança
   * 5. Observações gerais
   */
  const reorderEnrichedData = (enriched: DynamicFormData): DynamicFormData => {
    const ordered: DynamicFormData = {};

    // SEÇÃO 1: PARTE CONTRÁRIA
    if (enriched.parte_contraria_id !== undefined) ordered.parte_contraria_id = enriched.parte_contraria_id;
    if (enriched.parte_contraria_nome !== undefined) ordered.parte_contraria_nome = enriched.parte_contraria_nome;

    // SEÇÃO 2: TRABALHADOR
    if (enriched.modalidade !== undefined) ordered.modalidade = enriched.modalidade;
    if (enriched.modalidade_nome !== undefined) ordered.modalidade_nome = enriched.modalidade_nome;
    if (enriched.ativo !== undefined) ordered.ativo = enriched.ativo;
    if (enriched.bloqueado !== undefined) ordered.bloqueado = enriched.bloqueado;

    // SEÇÃO 3: DATAS
    if (enriched.dataInicio !== undefined) ordered.dataInicio = enriched.dataInicio;
    if (enriched.dataBloqueio !== undefined) ordered.dataBloqueio = enriched.dataBloqueio;

    // SEÇÃO 4: SAÚDE E SEGURANÇA
    if (enriched.acidenteTrabalho !== undefined) ordered.acidenteTrabalho = enriched.acidenteTrabalho;
    if (enriched.acidenteDescricao !== undefined) ordered.acidenteDescricao = enriched.acidenteDescricao;
    if (enriched.adoecimentoTrabalho !== undefined) ordered.adoecimentoTrabalho = enriched.adoecimentoTrabalho;
    if (enriched.adoecimentoDescricao !== undefined) ordered.adoecimentoDescricao = enriched.adoecimentoDescricao;

    // SEÇÃO 5: OBSERVAÇÕES
    if (enriched.observacoes !== undefined) ordered.observacoes = enriched.observacoes;

    // Adicionar qualquer campo não mapeado (para compatibilidade futura)
    Object.keys(enriched).forEach(key => {
      if (!(key in ordered)) {
        ordered[key] = enriched[key];
      }
    });

    return ordered;
  };

  // Access store
  const {
    dadosPessoais,
    segmentoId,
    formularioId,
    formularioNome,
    segmentoNome,
    formSchema,
    setDadosContrato,
    setFormSchema,
    proximaEtapa,
    etapaAnterior,
  } = useFormularioStore();

  // Load schema from n8n
  useEffect(() => {
    async function loadSchema() {
      // If schema already cached in store, use it
      if (formSchema) {
        setSchema(formSchema);
        setIsLoading(false);
        return;
      }

      // Validate context
      if (!formularioId || !segmentoId) {
        setLoadError('Formulário não identificado. Por favor, retorne à página inicial.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setLoadError(null);

        // Fetch form schema from API
        const response = await fetch(`/api/assinatura-digital/formularios/${formularioId}`);
        const result = await response.json();
        if (!result.success) throw new Error('Formulário não encontrado');
        const loadedSchema = result.data.form_schema;

        if (!loadedSchema) {
          throw new Error('Schema do formulário não configurado');
        }

        setSchema(loadedSchema);
        setFormSchema(loadedSchema); // Cache in store
      } catch (error) {
        console.error('Erro ao carregar schema do formulário:', error);
        setLoadError(
          error instanceof Error
            ? error.message
            : 'Erro ao carregar formulário. Tente novamente.'
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadSchema();
  }, [formularioId, segmentoId, formSchema, setFormSchema]);

  /**
   * Pre-submission validations
   */
  const validatePreSubmit = (): string[] => {
    const issues: string[] = [];

    if (!dadosPessoais) {
      issues.push('Dados pessoais não encontrados. Volte e conclua a etapa anterior.');
    } else {
      if (!dadosPessoais.cliente_id) {
        issues.push('Cliente não localizado. Volte e salve os dados pessoais antes de continuar.');
      }
      if (!dadosPessoais.nome_completo) {
        issues.push('Nome do cliente não encontrado nos dados pessoais.');
      }
      if (!dadosPessoais.cpf) {
        issues.push('CPF do cliente não encontrado nos dados pessoais.');
      }
    }

    if (!segmentoId || typeof segmentoId !== 'number' || segmentoId <= 0) {
      issues.push('Segmento não identificado. Reinicie o formulário e tente novamente.');
    }

    if (!formularioId || typeof formularioId !== 'number' || formularioId <= 0) {
      issues.push('Formulário não identificado. Reinicie o formulário e tente novamente.');
    }

    return issues;
  };

  /**
   * Handle form submission.
   *
   * IMPORTANTE: Esta etapa NÃO persiste mais no backend.
   * A persistência (criação do contrato via /api/salvar-acao) foi movida para
   * o VisualizacaoPdfStep, seguindo a arquitetura commit-on-complete.
   * Aqui apenas acumulamos os dados enriquecidos e ordenados no store.
   */
  const onSubmit = async (data: DynamicFormData) => {
    // 1. Pre-submission validations
    const issues = validatePreSubmit();

    if (issues.length > 0) {
      toast.error(issues.map((item) => `- ${item}`).join('\n'), { description: 'Revise os dados do formulário' });
      return;
    }

    try {
      setIsSubmitting(true);

      // 2. Type assertions (already validated above)
      const dadosPessoaisValid = dadosPessoais as NonNullable<typeof dadosPessoais>;

      // 3. Enrich and transform form data
      const enrichedData = enrichFormData(data, schema);
      const orderedData = reorderEnrichedData(enrichedData);

      // 4. Derivar metadados da ação (usados pelo VisualizacaoPdfStep para persistir)
      const clienteUf = dadosPessoaisValid.endereco_uf || '';
      const trtData = calculateTRT(clienteUf);

      // 5. Acumular no store sem chamar backend
      //    contrato_id permanece null; VisualizacaoPdfStep vai criar e setar.
      //    Marca contratoJaCriado=false para que a próxima etapa dispare a criação.
      setDadosContrato({
        ...orderedData,
        contrato_id: null,
        _trt_id: trtData.trt_id,
        _trt_nome: trtData.trt_nome,
        _segmento_nome: segmentoNome || 'Segmento',
        _formulario_nome: formularioNome || 'Formulário Dinâmico',
      });

      useFormularioStore.getState().setContratoJaCriado(false);

      console.log('[ASSINATURA_DIGITAL] form_action_collect', {
        event: 'form_action_collect',
        status: 'collected',
        payloadKeys: Object.keys(orderedData),
      });

      // 6. Advance to next step (a persistência acontece no Visualizacao)
      proximaEtapa();
    } catch (error) {
      console.error('Erro ao processar dados do formulário:', error);

      toast.error(
        error instanceof Error
          ? error.message
          : 'Ocorreu um erro ao processar os dados. Tente novamente.',
        { description: 'Erro ao processar' }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Error state - context not defined
  if (loadError) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Erro ao Carregar Formulário</CardTitle>
          <CardDescription>{loadError}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Loading state
  if (isLoading || !schema) {
    return (
      <FormStepLayout
        title="Carregando formulário..."
        description="Aguarde enquanto carregamos o formulário."
        hideNext={true}
        hidePrevious={true}
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </FormStepLayout>
    );
  }

  // Main render
  return (
    <FormStepLayout
      title="Dados da Ação"
      description="Informe os detalhes da ação."
      onPrevious={etapaAnterior}
      nextLabel="Continuar"
      isNextDisabled={isSubmitting}
      isPreviousDisabled={isSubmitting}
      isLoading={isSubmitting}
      formId="dynamic-form"
    >
      <DynamicFormRenderer
        schema={schema}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        formId="dynamic-form"
      />
    </FormStepLayout>
  );
}