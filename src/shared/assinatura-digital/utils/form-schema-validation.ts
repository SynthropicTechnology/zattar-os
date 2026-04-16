/**
 * ASSINATURA DIGITAL - Form schema validation
 *
 * Validação defensiva para `DynamicFormSchema` (UI e API).
 * Retorna erros e warnings para ajudar UX (ex: impedir preview/salvamento).
 */

import type { DynamicFormSchema, FormSectionSchema } from '../types/domain';

export type FormSchemaValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function getFieldIds(sections: FormSectionSchema[]): string[] {
  return sections.flatMap((s) => s.fields.map((f) => f.id));
}

export function validateFormSchema(schema: unknown): FormSchemaValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isRecord(schema)) {
    return { valid: false, errors: ['Schema deve ser um objeto'], warnings: [] };
  }

  if (!isNonEmptyString(schema.id)) errors.push('Schema: id é obrigatório');
  if (!isNonEmptyString(schema.version)) errors.push('Schema: version é obrigatória');

  if (!Array.isArray(schema.sections)) {
    errors.push('Schema: sections deve ser um array');
  } else {
    if (schema.sections.length === 0) warnings.push('Schema sem seções');

    for (const [sectionIndex, sectionRaw] of schema.sections.entries()) {
      if (!isRecord(sectionRaw)) {
        errors.push(`Seção ${sectionIndex + 1}: inválida`);
        continue;
      }

      if (!isNonEmptyString(sectionRaw.id)) {
        errors.push(`Seção ${sectionIndex + 1}: id é obrigatório`);
      }

      if (!isNonEmptyString(sectionRaw.title)) {
        errors.push(`Seção ${sectionIndex + 1}: title é obrigatório`);
      }

      if (!Array.isArray(sectionRaw.fields)) {
        errors.push(`Seção ${sectionIndex + 1}: fields deve ser um array`);
        continue;
      }

      if (sectionRaw.fields.length === 0) {
        warnings.push(`Seção "${String(sectionRaw.title ?? sectionRaw.id)}" sem campos`);
      }

      for (const [fieldIndex, fieldRaw] of sectionRaw.fields.entries()) {
        if (!isRecord(fieldRaw)) {
          errors.push(`Seção ${sectionIndex + 1} campo ${fieldIndex + 1}: inválido`);
          continue;
        }

        if (!isNonEmptyString(fieldRaw.id)) {
          errors.push(`Seção ${sectionIndex + 1} campo ${fieldIndex + 1}: id é obrigatório`);
        }

        if (!isNonEmptyString(fieldRaw.name)) {
          errors.push(`Seção ${sectionIndex + 1} campo ${fieldIndex + 1}: name é obrigatório`);
        }

        if (!isNonEmptyString(fieldRaw.label)) {
          warnings.push(`Campo "${String(fieldRaw.name ?? fieldRaw.id)}": label não definido`);
        }

        if (!isNonEmptyString(fieldRaw.type)) {
          errors.push(`Campo "${String(fieldRaw.name ?? fieldRaw.id)}": type é obrigatório`);
        }
      }
    }
  }

  // Checar IDs duplicados (seções/campos)
  try {
    const typed = schema as unknown as DynamicFormSchema;
    const fieldIds = getFieldIds(typed.sections ?? []);
    const seen = new Set<string>();
    const duplicates = new Set<string>();
    for (const id of fieldIds) {
      if (seen.has(id)) duplicates.add(id);
      seen.add(id);
    }
    if (duplicates.size > 0) {
      errors.push(`IDs de campos duplicados: ${Array.from(duplicates).join(', ')}`);
    }
  } catch {
    // Ignorar: validação principal já cobre formato básico
  }

  return { valid: errors.length === 0, errors, warnings };
}


