'use client';

import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { generateZodSchema } from '@/shared/assinatura-digital/utils';
import {
  DynamicFormSchema,
  FormFieldType,
  FormFieldSchema,
  FormSectionSchema,
  DynamicFormData,
  ConditionalRule,
} from '@/shared/assinatura-digital/types';
import { toDateString } from '@/lib/date-utils';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { InputCEP, type InputCepAddress } from '@/app/(authenticated)/enderecos';
import { InputCPF, InputData, InputCPFCNPJ, ClientSearchInput, ParteContrariaSearchInput } from '@/shared/assinatura-digital/components/inputs';
import { InputTelefone } from '@/components/ui/input-telefone';
import {
  Info,
  Search,
  User,
  Building2,
  MapPin,
  IdCard,
  Briefcase,
  FileText,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Cliente, ParteContraria } from '@/app/(authenticated)/partes/types';
import { UseFormReturn } from 'react-hook-form';
import { Heading, Text } from '@/components/ui/typography';
import { GlassPanel } from '@/components/shared/glass-panel';

interface DynamicFormRendererProps {
  schema: DynamicFormSchema;
  onSubmit: (data: DynamicFormData) => void | Promise<void>;
  defaultValues?: DynamicFormData;
  isSubmitting?: boolean;
  formId?: string;
}

export default function DynamicFormRenderer({
  schema,
  onSubmit,
  defaultValues,
  isSubmitting = false,
  formId,
}: DynamicFormRendererProps) {
  // Generate Zod schema from form schema (including hidden fields for validation)
  const zodSchema = useMemo(() => generateZodSchema(schema), [schema]);

  // Derive default values from schema and merge with provided defaultValues
  const mergedDefaultValues = useMemo(() => {
    const schemaDefaults: DynamicFormData = {};

    // Collect default values from schema
    schema.sections.forEach((section) => {
      section.fields.forEach((field) => {
        if (field.defaultValue !== undefined) {
          schemaDefaults[field.id] = field.defaultValue;
        }
      });
    });

    // Merge with provided defaultValues (provided values take precedence)
    return {
      ...schemaDefaults,
      ...(defaultValues || {}),
    };
  }, [schema, defaultValues]);

  // Initialize form
  const form = useForm({
    resolver: zodResolver(zodSchema),
    mode: 'onChange',
    defaultValues: mergedDefaultValues,
  });

  /**
   * Auto-fill fields based on entity data and mapping configuration
   */
  const autoFillFields = (
    entityData: Cliente | ParteContraria | Record<string, unknown>,
    autoFillMap: Record<string, string>,
    formInstance: UseFormReturn<DynamicFormData>
  ) => {
    Object.entries(autoFillMap).forEach(([entityField, formFieldId]) => {
      // Get value from entity (support nested paths like 'endereco.cep' and 'emails[0]')
      let value: unknown = null;

      // Handle array access (e.g., 'emails[0]')
      const arrayMatch = entityField.match(/^(\w+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, fieldName, index] = arrayMatch;
        const arrayValue = (entityData as unknown as Record<string, unknown>)[fieldName];
        if (Array.isArray(arrayValue) && arrayValue[Number(index)]) {
          value = arrayValue[Number(index)];
        }
      } else if (entityField.includes('.')) {
        // Handle dot-notation for nested objects (e.g., 'endereco.cep')
        const parts = entityField.split('.');
        let current: unknown = entityData;
        for (const part of parts) {
          if (current && typeof current === 'object' && current !== null) {
            current = (current as Record<string, unknown>)[part];
          } else {
            current = undefined;
            break;
          }
        }
        value = current;
      } else {
        value = (entityData as unknown as Record<string, unknown>)[entityField];
      }

      // Set value if it exists and is not null/undefined
      if (value !== null && value !== undefined && value !== '') {
        // Convert to appropriate type based on form field type
        const field = findFieldById(formFieldId);
        if (field) {
          let finalValue: string | number | boolean = value as string | number | boolean;

          // Type conversion based on field type
          if (field.type === FormFieldType.NUMBER && typeof value === 'string') {
            const num = Number(value);
            if (!isNaN(num)) finalValue = num;
          } else if (field.type === FormFieldType.CHECKBOX) {
            finalValue = Boolean(value);
          } else if (field.type === FormFieldType.DATE && value instanceof Date) {
            // Format date as YYYY-MM-DD for HTML date input
            finalValue = toDateString(value);
          } else if (typeof value === 'object' && value !== null) {
            // For complex types, convert to JSON string
            finalValue = JSON.stringify(value);
          } else {
            finalValue = String(value);
          }

          formInstance.setValue(formFieldId, finalValue, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
      }
    });
  };

  /**
   * Find field by ID in schema
   */
  const findFieldById = (fieldId: string): FormFieldSchema | undefined => {
    for (const section of schema.sections) {
      const field = section.fields.find((f) => f.id === fieldId);
      if (field) return field;
    }
    return undefined;
  };

  // Watch all values for conditional rendering
  const formValues = form.watch() as DynamicFormData;

  // Collect all field IDs from schema for CEP auto-fill detection
  const fieldIds = useMemo(() => {
    const ids = new Set<string>();
    schema.sections.forEach((section) => {
      section.fields.forEach((field) => {
        ids.add(field.id);
      });
    });
    return ids;
  }, [schema]);

  /**
   * Detecta campo de tipo de pessoa em uma lista de fields.
   * Procura por id contendo "tipo_pessoa" ou "tipopessoa" ou "tipo-pessoa" (case-insensitive).
   */
  const findTipoPessoaField = (fields: FormFieldSchema[]): FormFieldSchema | undefined => {
    return fields.find((f) => {
      const key = f.id.toLowerCase().replace(/[-_]/g, '');
      return key.includes('tipopessoa');
    });
  };

  /**
   * Normaliza valor de tipo_pessoa para 'pj' | 'pf' | null.
   * Aceita: "pj", "pessoa jurídica", "juridica", "j", "cnpj", "empresa"
   *     vs: "pf", "pessoa física", "fisica", "f", "cpf", "individual"
   */
  const normalizeTipoPessoa = (value: unknown): 'pj' | 'pf' | null => {
    if (value == null) return null;
    const normalized = String(value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
    if (!normalized) return null;
    if (/pj|juridic|cnpj|empres/.test(normalized)) return 'pj';
    if (/pf|fisic|cpf|individ/.test(normalized)) return 'pf';
    // Letra única ambígua — decide pelo prefixo
    if (normalized === 'j') return 'pj';
    if (normalized === 'f') return 'pf';
    return null;
  };

  /**
   * Efeito: quando tipo_pessoa muda, limpa o campo do documento oposto
   * (evita submit com CPF residual quando usuário seleciona PJ e vice-versa).
   */
  // Concatenar valores dos campos tipo_pessoa de todas as seções como dep
  const tipoPessoaValuesKey = schema.sections
    .map((s) => findTipoPessoaField(s.fields))
    .filter((f): f is FormFieldSchema => !!f)
    .map((f) => formValues[f.id])
    .join('|');

  useEffect(() => {
    for (const section of schema.sections) {
      const tipoField = findTipoPessoaField(section.fields);
      if (!tipoField) continue;
      const tipo = normalizeTipoPessoa(formValues[tipoField.id]);
      if (!tipo) continue;

      const fieldToClear = section.fields.find((f) => {
        const id = f.id.toLowerCase();
        if (tipo === 'pj') return id.endsWith('_cpf') || id === 'cpf';
        return id.endsWith('_cnpj') || id === 'cnpj';
      });
      if (fieldToClear && formValues[fieldToClear.id]) {
        form.setValue(fieldToClear.id, '', { shouldValidate: false, shouldDirty: false });
      }
    }
    // formValues é o objeto de watch — reagir apenas às mudanças dos campos tipo_pessoa
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema, tipoPessoaValuesKey]);

  /**
   * Evaluate conditional rule to determine if field should be rendered
   */
  const evaluateConditional = (
    conditional: ConditionalRule,
    values: DynamicFormData
  ): boolean => {
    const controlValue = values[conditional.field];

    switch (conditional.operator) {
      case '=':
        return controlValue === conditional.value;
      case '!=':
        return controlValue !== conditional.value;
      case '>':
        return Number(controlValue) > Number(conditional.value);
      case '<':
        return Number(controlValue) < Number(conditional.value);
      case 'contains':
        return String(controlValue).includes(String(conditional.value));
      case 'empty':
        return !controlValue || controlValue === '';
      case 'notEmpty':
        return !!controlValue && controlValue !== '';
      default:
        return true;
    }
  };

  /**
   * Handle address found from CEP lookup
   */
  const handleAddressFound = (address: InputCepAddress) => {
    // Auto-fill related fields based on naming conventions
    const fieldMappings = {
      logradouro: address.logradouro,
      bairro: address.bairro,
      cidade: address.localidade,
      estado: address.uf,
    };

    Object.entries(fieldMappings).forEach(([fieldName, value]) => {
      // Check if field exists in schema and has a value
      if (value && fieldIds.has(fieldName)) {
        form.setValue(fieldName, value, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    });
  };

  /**
   * Render individual field based on type
   * Note: FormControl is now rendered inside renderFieldControl for each field type
   * to avoid nested FormControl issues (especially with SELECT which has its own structure)
   */
  const renderField = (field: FormFieldSchema) => {
    return (
      <FormField
        key={field.id}
        control={form.control}
        name={field.id}
        render={({ field: fieldProps }) => (
          <FormItem>
            <FormLabel
              className={field.helpText ? 'flex items-center gap-2' : undefined}
            >
              {field.label}
              {field.helpText && (
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </FormLabel>
            {renderFieldControl(field, fieldProps)}
            <FormMessage />
            {field.helpText && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
          </FormItem>
        )}
      />
    );
  };

  /**
   * Convert unknown value to string for input components
   */
  const getStringValue = (value: unknown): string => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (value === null || value === undefined) return '';
    return String(value);
  };

  /**
   * Render field control based on field type
   * Each field type is wrapped with FormControl to ensure proper ARIA attributes
   * and tooltip behavior for validation errors.
   */
  const renderFieldControl = (
    field: FormFieldSchema,
    fieldProps: {
      value: unknown;
      onChange: (value: unknown) => void;
      onBlur: () => void;
      name: string;
      ref: React.Ref<HTMLElement | null>;
    }
  ): React.ReactNode => {
    const commonProps = {
      disabled: field.disabled || isSubmitting,
      placeholder: field.placeholder,
    };

    // Convert value to string for input components
    const stringValue = getStringValue(fieldProps.value);
    const { ref, ...fieldPropsWithoutRef } = fieldProps;
    const stringFieldProps = {
      ...fieldPropsWithoutRef,
      value: stringValue,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        fieldProps.onChange(e.target.value),
    };

    switch (field.type) {
      case FormFieldType.TEXT:
      case FormFieldType.EMAIL:
        return (
          <FormControl>
            <Input variant="glass" {...commonProps} {...stringFieldProps} />
          </FormControl>
        );

      case FormFieldType.TEXTAREA:
        return (
          <FormControl>
            <Textarea rows={4} className="glass-field h-auto! min-h-24 py-3" {...commonProps} {...stringFieldProps} />
          </FormControl>
        );

      case FormFieldType.NUMBER:
        return (
          <FormControl>
            <Input type="number" variant="glass" {...commonProps} {...stringFieldProps} />
          </FormControl>
        );

      case FormFieldType.DATE:
        return (
          <FormControl>
            <InputData
              placeholder={field.placeholder || 'dd/mm/aaaa'}
              disabled={field.disabled || isSubmitting}
              value={stringValue}
              onChange={(value) => fieldProps.onChange(value)}
              onBlur={fieldProps.onBlur}
              name={fieldProps.name}
              ref={ref as React.Ref<HTMLInputElement>}
              className="glass-field"
            />
          </FormControl>
        );

      case FormFieldType.CPF:
        return (
          <FormControl>
            <InputCPF
              placeholder={field.placeholder || '000.000.000-00'}
              disabled={field.disabled || isSubmitting}
              value={stringValue}
              onChange={(e) => fieldProps.onChange(e.target.value)}
              onBlur={fieldProps.onBlur}
              name={fieldProps.name}
              ref={ref as React.Ref<HTMLInputElement>}
              className="glass-field"
            />
          </FormControl>
        );

      case FormFieldType.CNPJ:
        return (
          <FormControl>
            <InputCPFCNPJ
              placeholder={field.placeholder}
              disabled={field.disabled || isSubmitting}
              value={stringValue}
              onChange={(e) => fieldProps.onChange(e.target.value)}
              onBlur={fieldProps.onBlur}
              name={fieldProps.name}
              ref={ref as React.Ref<HTMLInputElement>}
              className="glass-field"
            />
          </FormControl>
        );

      case FormFieldType.PHONE:
        return (
          <FormControl>
            <InputTelefone
              placeholder={field.placeholder || '(00) 00000-0000'}
              disabled={field.disabled || isSubmitting}
              value={stringValue}
              onChange={(e) => fieldProps.onChange(e.target.value)}
              onBlur={fieldProps.onBlur}
              name={fieldProps.name}
              ref={ref as React.Ref<HTMLInputElement>}
              className="glass-field"
            />
          </FormControl>
        );

      case FormFieldType.CEP:
        return (
          <FormControl>
            <InputCEP
              placeholder={field.placeholder || '00000-000'}
              disabled={field.disabled || isSubmitting}
              onAddressFound={handleAddressFound}
              value={stringValue}
              onChange={(e) => fieldProps.onChange(e.target.value)}
              onBlur={fieldProps.onBlur}
              name={fieldProps.name}
              ref={ref as React.Ref<HTMLInputElement>}
              className="glass-field"
            />
          </FormControl>
        );

      case FormFieldType.SELECT:
        // SELECT: FormControl wraps only the SelectTrigger (not the entire Select)
        // This ensures proper ARIA attributes and tooltip behavior
        return (
          <Select
            onValueChange={fieldProps.onChange}
            value={String(fieldProps.value || '')}
            disabled={field.disabled || isSubmitting}
          >
            <FormControl>
              <SelectTrigger className="glass-field">
                <SelectValue
                  placeholder={field.placeholder || 'Selecione'}
                />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem
                  key={option.value}
                  value={String(option.value)}
                  disabled={option.disabled}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case FormFieldType.RADIO:
        return (
          <FormControl>
            <RadioGroup
              onValueChange={(value) => {
                // Convert string back to original type (number, boolean, or string)
                // Per FormFieldOption.value: string | number | boolean
                const firstOptionValue = field.options?.[0]?.value;
                if (typeof firstOptionValue === 'number') {
                  fieldProps.onChange(Number(value));
                } else if (typeof firstOptionValue === 'boolean') {
                  // Convert string "true"/"false" to actual boolean
                  fieldProps.onChange(value === 'true');
                } else {
                  fieldProps.onChange(value);
                }
              }}
              value={String(fieldProps.value ?? '')}
              disabled={field.disabled || isSubmitting}
              className="flex flex-wrap gap-6"
            >
              {field.options?.map((option) => (
                <div key={option.value} className="flex items-center gap-2">
                  <RadioGroupItem
                    value={String(option.value)}
                    id={`${field.id}-${option.value}`}
                    disabled={option.disabled}
                  />
                  <Label htmlFor={`${field.id}-${option.value}`}>
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </FormControl>
        );

      case FormFieldType.CHECKBOX:
        return (
          <FormControl>
            <Checkbox
              checked={!!fieldProps.value}
              onCheckedChange={(checked) => fieldProps.onChange(checked === true)}
              disabled={field.disabled || isSubmitting}
            />
          </FormControl>
        );

      case FormFieldType.CLIENT_SEARCH:
        return (
          <ClientSearchInput
            value={String(fieldProps.value || '')}
            onChange={(value) => fieldProps.onChange(value)}
            onClientFound={(cliente) => {
              if (field.entitySearch?.autoFill) {
                autoFillFields(cliente, field.entitySearch.autoFill, form);
              }
            }}
            disabled={field.disabled || isSubmitting}
            placeholder={field.placeholder || 'Digite o CPF do cliente'}
          />
        );

      case FormFieldType.PARTE_CONTRARIA_SEARCH:
        return (
          <ParteContrariaSearchInput
            value={String(fieldProps.value || '')}
            onChange={(value) => fieldProps.onChange(value)}
            onParteFound={(parte) => {
              if (field.entitySearch?.autoFill) {
                autoFillFields(parte, field.entitySearch.autoFill, form);
              }
            }}
            disabled={field.disabled || isSubmitting}
            placeholder={field.placeholder || 'Digite CPF, CNPJ ou nome'}
            searchBy={field.entitySearch?.searchBy || ['cpf', 'cnpj', 'nome']}
          />
        );

      default:
        return (
          <FormControl>
            <Input variant="glass" {...commonProps} {...stringFieldProps} />
          </FormControl>
        );
    }
  };

  /**
   * Resolve a FormSectionIcon key into a Lucide icon component.
   */
  const ICON_MAP: Record<NonNullable<FormSectionSchema['icon']>, LucideIcon> = {
    search: Search,
    building: Building2,
    user: User,
    idcard: IdCard,
    mappin: MapPin,
    briefcase: Briefcase,
    file: FileText,
  };

  /**
   * Obtém ícone semântico pra uma seção.
   * Prioridade: section.icon explícito > heurística por section.id.
   * Fallback final: FileText (genérico).
   */
  const getSectionIcon = (section: FormSectionSchema): LucideIcon => {
    // 1. Schema explícito (preferido — schemas novos)
    if (section.icon && ICON_MAP[section.icon]) {
      return ICON_MAP[section.icon];
    }
    // 2. Heurística por id (retrocompat com schemas antigos sem icon)
    const id = section.id.toLowerCase();
    if (id.includes('parte-contraria') || id.includes('parte_contraria')) return Building2;
    if (id.includes('cliente') || id.includes('identidade')) return IdCard;
    if (id.includes('endereco') || id.includes('address')) return MapPin;
    if (id.includes('acao') || id.includes('trabalho') || id.includes('acao-trabalhista')) return Briefcase;
    if (id.includes('busca') || id.includes('search')) return Search;
    if (id.includes('contato')) return User;
    return FileText;
  };

  /**
   * Determina qual campo é o "caminho preferencial" (busca rápida) de uma seção.
   * Prioridade: section.preferredField explícito > primeiro campo de busca por type.
   * Retorna undefined quando nenhum dos dois está disponível.
   */
  const getPreferredField = (
    section: FormSectionSchema,
    visibleFields: FormFieldSchema[],
  ): FormFieldSchema | undefined => {
    // 1. Schema explícito
    if (section.preferredField) {
      const explicit = visibleFields.find((f) => f.id === section.preferredField);
      if (explicit) return explicit;
    }
    // 2. Heurística por tipo
    return visibleFields.find(
      (f) =>
        f.type === FormFieldType.PARTE_CONTRARIA_SEARCH ||
        f.type === FormFieldType.CLIENT_SEARCH,
    );
  };

  /**
   * Render section with fields — split search field (if any) into its own
   * GlassPanel depth=2 as the preferred path, then render remaining manual
   * fields in the grid below.
   */
  const renderSection = (section: FormSectionSchema) => {
    const Icon = getSectionIcon(section);

    // Fase 1: filtro base (hidden + conditional do schema)
    let visibleFields = section.fields.filter((f) => {
      if (f.hidden) return false;
      if (f.conditional) return evaluateConditional(f.conditional, formValues);
      return true;
    });

    // Fase 2: heurística tipo_pessoa — esconde CPF se PJ, CNPJ se PF.
    // Só aplica se houver campo de tipo_pessoa na seção E ele estiver respondido.
    const tipoField = findTipoPessoaField(section.fields);
    const tipo = tipoField ? normalizeTipoPessoa(formValues[tipoField.id]) : null;
    if (tipo) {
      visibleFields = visibleFields.filter((f) => {
        const id = f.id.toLowerCase();
        const isCpf = id.endsWith('_cpf') || id === 'cpf';
        const isCnpj = id.endsWith('_cnpj') || id === 'cnpj';
        if (tipo === 'pj' && isCpf) return false;
        if (tipo === 'pf' && isCnpj) return false;
        return true;
      });
    }

    const searchField = getPreferredField(section, visibleFields);
    const manualFields = visibleFields.filter((f) => f !== searchField);

    return (
      <div key={section.id} className="space-y-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
            <Icon className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <div className="min-w-0 flex-1">
            <Heading
              level="section"
              className="font-display text-lg tracking-tight sm:text-xl"
            >
              {section.title}
            </Heading>
            {section.description && (
              <Text variant="caption" className="mt-0.5 text-muted-foreground">
                {section.description}
              </Text>
            )}
          </div>
        </div>

        {/* Search card — entidade existente (caminho preferencial) */}
        {searchField && (
          <>
            <GlassPanel
              depth={2}
              className="space-y-3 p-4 sm:p-5"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <Text
                  variant="overline"
                  className="text-primary"
                >
                  Busca rápida
                </Text>
              </div>
              {renderField(searchField)}
            </GlassPanel>

            {manualFields.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-outline-variant/40" />
                <Text variant="caption" className="text-muted-foreground">
                  Não encontrou? Preencha abaixo
                </Text>
                <div className="h-px flex-1 bg-outline-variant/40" />
              </div>
            )}
          </>
        )}

        {/* Grid de campos manuais */}
        {manualFields.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {manualFields.map((field) => {
              const gridClass =
                field.gridColumns === 1
                  ? 'md:col-span-3'
                  : field.gridColumns === 2
                    ? 'md:col-span-2'
                    : 'md:col-span-1';
              return (
                <div key={field.id} className={cn(gridClass)}>
                  {renderField(field)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <Form {...form}>
      <form
        id={formId}
        role="form"
        onSubmit={form.handleSubmit((data) => onSubmit(data as DynamicFormData))}
        className="space-y-8"
      >
        {schema.sections.map((section, index) => (
          <React.Fragment key={section.id}>
            {renderSection(section)}
            {index < schema.sections.length - 1 && (
              <Separator className="bg-outline-variant/30" />
            )}
          </React.Fragment>
        ))}

        {/* Hidden submit button for accessibility */}
        <button
          type="submit"
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
        >
          Submit
        </button>
      </form>
    </Form>
  );
}