/**
 * Partes Components - Main barrel export
 *
 * Re-exporta todos os componentes do modulo de partes
 * organizados por entidade.
 */

// Shared components
export { ProcessosRelacionadosCell, CopyButton, FilterPopover, FilterPopoverMulti } from "./shared";
export type { FilterOption } from "./shared";

// Clientes components
export {
  ClientesTableWrapper,
  ClienteForm,
} from "./clientes";

// Partes Contrarias components
export {
  PartesContrariasTableWrapper,
} from "./partes-contrarias";

// Terceiros components
export {
  TerceirosTableWrapper,
} from "./terceiros";

// Representantes components
export {
  RepresentantesTableWrapper,
} from "./representantes";
