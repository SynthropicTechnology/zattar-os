import { z } from "zod";
import {
  validateCEP,
  validateCNPJ,
  validateCPF,
  validateEmail,
  validateTelefone,
} from "./validators";

type AnyDynamicFormSchema = {
  sections: Array<{
    fields: Array<{
      id: string;
      type: string;
      validation?: {
        required?: boolean;
        min?: number;
        max?: number;
        pattern?: string;
        email?: boolean;
        message?: string;
      };
      options?: Array<{ value: string | number }>;
      conditional?: {
        field: string;
        value?: unknown;
        operator: string;
      };
    }>;
  }>;
};

function emptyStringToUndefined(value: unknown): unknown {
  if (value === "") return undefined;
  return value;
}

function buildFieldSchema(
  field: AnyDynamicFormSchema["sections"][number]["fields"][number]
) {
  // Campos condicionais são sempre opcionais no schema estático,
  // pois podem estar ocultos no UI quando a condição não é atendida.
  const required = field.conditional ? false : Boolean(field.validation?.required);
  const min = field.validation?.min;
  const max = field.validation?.max;
  const pattern = field.validation?.pattern;
  const message = field.validation?.message;

  const requiredMessage = message || "Campo obrigatório";

  switch (field.type) {
    case "checkbox": {
      // Checkbox normalmente é boolean e pode ser false sem erro.
      // Se required=true, interpretamos como "deve estar marcado".
      const base = z.boolean();
      return required
        ? base.refine((v) => v === true, { message: requiredMessage })
        : base.optional();
    }

    case "number": {
      const base = z.preprocess(
        emptyStringToUndefined,
        z.coerce.number({ invalid_type_error: "Número inválido" })
      );
      let schema: z.ZodTypeAny = required ? base : base.optional();
      if (typeof min === "number")
        schema = schema.refine((v: unknown) => v == null || Number(v) >= min, {
          message: message || `Mínimo: ${min}`,
        });
      if (typeof max === "number")
        schema = schema.refine((v: unknown) => v == null || Number(v) <= max, {
          message: message || `Máximo: ${max}`,
        });
      return schema;
    }

    case "date": {
      // Mantemos como string (inputs HTML retornam string)
      const base = z.preprocess(emptyStringToUndefined, z.string());
      const schema: z.ZodTypeAny = required
        ? base.refine((v) => !!v, { message: requiredMessage })
        : base.optional();
      return schema;
    }

    case "email": {
      const base = z.preprocess(emptyStringToUndefined, z.string());
      let schema: z.ZodTypeAny = required
        ? base.refine((v) => !!v, { message: requiredMessage })
        : base.optional();
      schema = schema.refine(
        (v: unknown) => v == null || validateEmail(String(v)),
        { message: message || "Email inválido" }
      );
      return schema;
    }

    case "cpf": {
      const base = z.preprocess(emptyStringToUndefined, z.string());
      let schema: z.ZodTypeAny = required
        ? base.refine((v) => !!v, { message: requiredMessage })
        : base.optional();
      schema = schema.refine(
        (v: unknown) => v == null || validateCPF(String(v)),
        { message: message || "CPF inválido" }
      );
      return schema;
    }

    case "cnpj": {
      const base = z.preprocess(emptyStringToUndefined, z.string());
      let schema: z.ZodTypeAny = required
        ? base.refine((v) => !!v, { message: requiredMessage })
        : base.optional();
      schema = schema.refine(
        (v: unknown) => v == null || validateCNPJ(String(v)),
        { message: message || "CNPJ inválido" }
      );
      return schema;
    }

    case "phone": {
      const base = z.preprocess(emptyStringToUndefined, z.string());
      let schema: z.ZodTypeAny = required
        ? base.refine((v) => !!v, { message: requiredMessage })
        : base.optional();
      schema = schema.refine(
        (v: unknown) => {
          if (v == null || v === undefined) return true;
          // Se não tem dígitos, considerar vazio (campo opcional não preenchido)
          const digits = String(v).replace(/\D/g, '');
          if (digits.length === 0) return true;
          return validateTelefone(String(v));
        },
        { message: message || "Telefone inválido" }
      );
      return schema;
    }

    case "cep": {
      const base = z.preprocess(emptyStringToUndefined, z.string());
      let schema: z.ZodTypeAny = required
        ? base.refine((v) => !!v, { message: requiredMessage })
        : base.optional();
      schema = schema.refine(
        (v: unknown) => v == null || validateCEP(String(v)),
        { message: message || "CEP inválido" }
      );
      return schema;
    }

    case "client_search":
    case "parte_contraria_search": {
      // Campos de busca retornam string (valor pesquisado)
      if (required) {
        return z.preprocess(
          emptyStringToUndefined,
          z.string().min(1, { message: requiredMessage })
        );
      }
      return z.preprocess(emptyStringToUndefined, z.string()).optional();
    }

    case "select":
    case "radio": {
      // Se houver opções conhecidas, aceitamos qualquer string/number e validamos required.
      const base = z.preprocess(
        emptyStringToUndefined,
        z.union([z.string(), z.number()])
      );
      let schema: z.ZodTypeAny = required ? base : base.optional();
      if (field.options && field.options.length > 0) {
        const allowed = new Set(field.options.map((o) => String(o.value)));
        schema = schema.refine(
          (v: unknown) => v == null || allowed.has(String(v)),
          {
            message: message || "Opção inválida",
          }
        );
      }
      return schema;
    }

    case "textarea":
    case "text":
    default: {
      let schema: z.ZodTypeAny = required
        ? z.preprocess(emptyStringToUndefined, z.string().min(1, { message: requiredMessage }))
        : z.preprocess(emptyStringToUndefined, z.string()).optional();

      if (typeof min === "number") {
        schema = schema.refine(
          (v: unknown) => v == null || String(v).length >= min,
          { message: message || `Mínimo: ${min} caracteres` }
        );
      }
      if (typeof max === "number") {
        schema = schema.refine(
          (v: unknown) => v == null || String(v).length <= max,
          { message: message || `Máximo: ${max} caracteres` }
        );
      }
      if (pattern) {
        try {
          const re = new RegExp(pattern);
          schema = schema.refine(
            (v: unknown) => v == null || re.test(String(v)),
            { message: message || "Formato inválido" }
          );
        } catch {
          // ignora pattern inválido
        }
      }
      return schema;
    }
  }
}

/**
 * Gera um schema Zod (z.object) a partir do `DynamicFormSchema`.
 * Usado pelo `DynamicFormRenderer` (react-hook-form + zodResolver).
 */
export function generateZodSchema(
  schema: AnyDynamicFormSchema
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const section of schema.sections ?? []) {
    for (const field of section.fields ?? []) {
      if (!field?.id) continue;
      shape[field.id] = buildFieldSchema(field);
    }
  }

  return z.object(shape);
}
