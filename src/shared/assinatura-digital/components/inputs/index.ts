export { default as InputCPF } from './input-cpf';
export { default as InputCPFCNPJ } from './input-cpf-cnpj';
export { default as InputData } from './input-data';
export { ClientSearchInput } from './client-search-input';
export { ParteContrariaSearchInput } from './parte-contraria-search-input';

// Re-export InputTelefone from shared UI (moved to break circular dependency)
export { InputTelefone } from '@/components/ui/input-telefone';

// Re-export types for convenience
export type { InputCPFProps } from './input-cpf';
export type { InputCPFCNPJProps } from './input-cpf-cnpj';
export type { InputTelefoneProps } from '@/components/ui/input-telefone';
export type { InputDataProps } from './input-data';
export type { ClientSearchInputProps } from './client-search-input';
export type { ParteContrariaSearchInputProps } from './parte-contraria-search-input';