/**
 * Template Helpers
 *
 * Utility functions for template manipulation in the FieldMappingEditor.
 * Handles normalization and transformation of template data.
 */

import type { EditorField } from '../types';
import type { TemplateCampo } from '@/shared/assinatura-digital/types/template.types';
import { normalizeFieldId } from './field-helpers';

/**
 * Default position for fields without position data
 */
const DEFAULT_POSITION = {
  x: 100,
  y: 100,
  width: 200,
  height: 40,
  pagina: 1,
};

/**
 * Normalizes template campos from backend to EditorField format
 * Handles ID normalization and provides default values for missing properties
 *
 * @param campos - Array of template campos from backend
 * @returns Array of normalized EditorFields
 */
export function normalizeTemplateFields(campos: TemplateCampo[]): EditorField[] {
  // Ensure campos is always an array (defensive against inconsistent backend data)
  const normalizedCampos = Array.isArray(campos) ? campos : [];

  // Diagnostic: Log fields without valid ID (expected — backend campos often lack IDs, they are generated here)
  if (process.env.NODE_ENV === 'development') {
    const camposSemId = normalizedCampos.filter((c) => c.id == null);
    if (camposSemId.length > 0) {
      console.debug(
        `[normalizeTemplateFields] ${camposSemId.length} campo(s) without ID (IDs will be generated):`,
        camposSemId.map((c) => ({ nome: c.nome, variavel: c.variavel, tipo: c.tipo }))
      );
    }

    const camposSemPosicao = normalizedCampos.filter((c) => !c.posicao);
    if (camposSemPosicao.length > 0) {
      console.debug(
        `[normalizeTemplateFields] ${camposSemPosicao.length} campo(s) without position (using default):`,
        camposSemPosicao.map((c) => ({ nome: c.nome, variavel: c.variavel, tipo: c.tipo }))
      );
    }
  }

  const editorFields: EditorField[] = normalizedCampos.map((campo) => ({
    ...campo,
    id: normalizeFieldId(campo),
    // Ensure posicao exists with default values if necessary
    posicao: campo.posicao || { ...DEFAULT_POSITION },
    isSelected: false,
    isDragging: false,
    justAdded: false,
  }));

  // Validate ID uniqueness and fix duplicates if found
  const idSet = new Set<string>();
  const duplicateIds = new Set<string>();

  editorFields.forEach((field) => {
    if (idSet.has(field.id)) {
      duplicateIds.add(field.id);
    }
    idSet.add(field.id);
  });

  if (duplicateIds.size > 0) {
    console.error(
      '[normalizeTemplateFields] Duplicate IDs detected after normalization (unexpected case):',
      Array.from(duplicateIds)
    );
    console.error(
      '[normalizeTemplateFields] Affected fields:',
      editorFields
        .filter((f) => duplicateIds.has(f.id))
        .map((f) => ({ id: f.id, nome: f.nome, variavel: f.variavel, tipo: f.tipo }))
    );

    // Fallback: Generate new unique IDs for duplicates
    const idsUsed = new Set<string>();
    editorFields.forEach((field, index) => {
      if (duplicateIds.has(field.id) || idsUsed.has(field.id)) {
        const newId = `field-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        console.warn(
          `[normalizeTemplateFields] Regenerating ID for duplicate field: ${field.nome} (${field.id} -> ${newId})`
        );
        editorFields[index].id = newId;
        idsUsed.add(newId);
      } else {
        idsUsed.add(field.id);
      }
    });
  }

  return editorFields;
}

/**
 * Creates a new EditorField with default values
 *
 * @param templateId - The template ID
 * @param tipo - The field type
 * @param position - The position on canvas
 * @param currentPage - The current page number
 * @param fieldCount - Current number of fields (for order)
 * @returns A new EditorField
 */
export function createNewField(
  templateId: string | number,
  tipo: 'texto' | 'assinatura' | 'texto_composto',
  position: { x: number; y: number },
  currentPage: number,
  fieldCount: number
): EditorField {
  const fieldConfig = {
    texto: {
      nome: 'Nome Completo',
      variavel: 'cliente.nome_completo',
      width: 200,
      height: 20,
    },
    assinatura: {
      nome: 'Assinatura',
      variavel: 'assinatura.assinatura_base64',
      width: 120,
      height: 60,
    },
    texto_composto: {
      nome: 'Texto Composto',
      variavel: undefined,
      width: 400,
      height: 80,
    },
  };

  const config = fieldConfig[tipo];

  return {
    id: `field-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    template_id: String(templateId),
    nome: config.nome,
    variavel: config.variavel,
    tipo,
    posicao: {
      x: Math.round(position.x),
      y: Math.round(position.y),
      width: config.width,
      height: config.height,
      pagina: currentPage,
    },
    estilo: {
      fonte: 'Open Sans',
      tamanho_fonte: 12,
      cor: '#000000',
      alinhamento: 'left',
    },
    obrigatorio: true,
    ordem: fieldCount + 1,
    conteudo_composto:
      tipo === 'texto_composto'
        ? { json: { type: 'doc', content: [{ type: 'paragraph' }] }, template: '' }
        : undefined,
    criado_em: new Date(),
    atualizado_em: new Date(),
    isSelected: true,
    isDragging: false,
    justAdded: true,
  };
}
