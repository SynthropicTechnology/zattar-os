'use client';

import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { generateZodSchema } from '../../utils';
import {
  DynamicFormSchema,
  FormFieldType,
  FormFieldSchema,
  FormSectionSchema,
  DynamicFormData,
  ConditionalRule,
} from '../../types';
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
import { InputCPF, InputData, InputCPFCNPJ, ClientSearchInput, ParteContrariaSearchInput } from '../inputs';
import { InputTelefone } from '@/components/ui/input-telefone';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Cliente, ParteContraria } from '@/app/(authenticated)/partes/types';
import { UseFormReturn } from 'react-hook-form';

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
            <Input {...commonProps} {...stringFieldProps} />
          </FormControl>
        );

      case FormFieldType.TEXTAREA:
        return (
          <FormControl>
            <Textarea rows={4} {...commonProps} {...stringFieldProps} />
          </FormControl>
        );

      case FormFieldType.NUMBER:
        return (
          <FormControl>
            <Input type="number" {...commonProps} {...stringFieldProps} />
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
              <SelectTrigger>
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
            <Input {...commonProps} {...stringFieldProps} />
          </FormControl>
        );
    }
  };

  /**
   * Render section with fields
   */
  const renderSection = (section: FormSectionSchema) => {
    return (
      <div key={section.id} className="space-y-4">
        <div>
          <h3 className="text-base font-semibold">{section.title}</h3>
          {section.description && (
            <p className="text-sm text-muted-foreground">
              {section.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {section.fields.map((field) => {
            // Skip hidden fields (they are in schema but not rendered)
            if (field.hidden) {
              return null;
            }

            // Evaluate conditional rendering
            if (field.conditional) {
              const shouldRender = evaluateConditional(
                field.conditional,
                formValues
              );
              if (!shouldRender) return null;
            }

            // Determine grid class based on gridColumns
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
      </div>
    );
  };

  return (
    <Form {...form}>
      <form
        id={formId}
        role="form"
        onSubmit={form.handleSubmit((data) => onSubmit(data as DynamicFormData))}
        className="space-y-6"
      >
        {schema.sections.map((section, index) => (
          <React.Fragment key={section.id}>
            {renderSection(section)}
            {index < schema.sections.length - 1 && <Separator />}
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