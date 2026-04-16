/**
 * Template Texto Components
 *
 * Components for creating and editing text-based templates
 * using the Plate editor with variable insertion support.
 */

export { TemplateTypeSelector, type TemplateType } from './TemplateTypeSelector';
export { TemplateTextoEditor } from './TemplateTextoEditor';
export { TemplateTextoCreateForm } from './TemplateTextoCreateForm';
export {
  TEMPLATE_VARIABLES,
  CATEGORY_LABELS,
  getVariablesByCategory,
  getVariableByKey,
  type TemplateVariable,
  type VariableCategory,
  type TemplateTextoMetadata,
  type TemplateTextoContent,
  type TemplateTextoFormData,
} from './types';
