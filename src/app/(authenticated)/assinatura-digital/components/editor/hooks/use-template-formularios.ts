import { useEffect, useState } from 'react';
import type { Template } from '@/shared/assinatura-digital/types/template.types';
import type { DynamicFormSchema } from '@/shared/assinatura-digital/types/domain';

interface FormularioResponse {
  formulario_uuid: string;
  template_ids?: string[];
  form_schema?: DynamicFormSchema | null;
}

/**
 * Busca os nomes dos campos dos formulários vinculados a um template.
 * Retorna um array de strings com os nomes dos campos (ex: ['nome_completo', 'cpf', ...])
 * que são usados para gerar variáveis do tipo `formulario.{nome_campo}`.
 */
export function useTemplateFormularios(template: Template): string[] {
  const [fieldNames, setFieldNames] = useState<string[]>([]);

  useEffect(() => {
    if (!template.template_uuid || !template.segmento_id) {
      return;
    }

    let cancelled = false;

    async function fetchFormularios() {
      try {
        const params = new URLSearchParams();
        params.set('segmento_id', String(template.segmento_id));
        params.set('ativo', 'true');

        const response = await fetch(`/api/assinatura-digital/formularios?${params}`);
        if (!response.ok || cancelled) return;

        const json = await response.json();
        const formularios: FormularioResponse[] = json.data ?? [];

        // Filtra apenas formulários vinculados a este template
        const linked = formularios.filter(
          (f) => Array.isArray(f.template_ids) && f.template_ids.includes(template.template_uuid)
        );

        // Extrai nomes dos campos do form_schema
        const names = linked.flatMap((f) => {
          if (!f.form_schema?.sections) return [];
          return f.form_schema.sections.flatMap((s) =>
            s.fields.map((field) => field.name)
          );
        });

        if (!cancelled) {
          setFieldNames([...new Set(names)]);
        }
      } catch {
        // Silently fail - variables will just show base variables
      }
    }

    fetchFormularios();

    return () => {
      cancelled = true;
    };
  }, [template.template_uuid, template.segmento_id]);

  return fieldNames;
}
