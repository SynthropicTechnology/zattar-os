/**
 * Mapeamento de Campos de Entidades do Domínio
 * 
 * Este arquivo mapeia os campos das entidades do sistema (Clientes, Partes Contrárias,
 * Contratos, Endereços, etc.) para os tipos de campos disponíveis no formulário.
 * 
 * Os formulários são fluxos de registro dessas entidades, então os campos devem
 * corresponder diretamente aos campos das entidades do domínio.
 */

import { FormFieldType } from '@/shared/assinatura-digital/types/domain';
import { 
  User, 
  Building2, 
  FileText, 
  MapPin, 
  Calendar, 
  Hash, 
  Mail, 
  Phone, 
  CreditCard,
  CheckSquare,
  List,
  Type,
  FileCheck,
  Users,
  Briefcase,
  Search,
  LucideIcon
} from 'lucide-react';

export interface EntityFieldDefinition {
  /** Nome do campo na entidade (snake_case) */
  fieldName: string;
  /** Label para exibição */
  label: string;
  /** Tipo de campo do formulário */
  type: FormFieldType;
  /** Ícone do campo */
  icon: LucideIcon;
  /** Descrição do campo */
  description: string;
  /** Se o campo é específico de PF ou PJ */
  pessoaTipo?: 'pf' | 'pj' | 'ambos';
  /** Badge opcional */
  badge?: string;
}

export interface EntityCategory {
  id: string;
  label: string;
  icon: LucideIcon;
  entityType: 'cliente' | 'parte_contraria' | 'terceiro' | 'contrato' | 'endereco' | 'processo';
  fields: EntityFieldDefinition[];
}

/**
 * Campos de Cliente (Pessoa Física e Jurídica)
 */
const CLIENTE_FIELDS: EntityFieldDefinition[] = [
  // Campo de busca
  { fieldName: 'busca_cliente', label: 'Busca de Cliente', type: FormFieldType.CLIENT_SEARCH, icon: Search, description: 'Buscar cliente por CPF e preencher automaticamente', pessoaTipo: 'ambos', badge: 'Busca' },
  
  // Campos base (comuns a PF e PJ)
  { fieldName: 'nome', label: 'Nome', type: FormFieldType.TEXT, icon: Type, description: 'Nome completo (PF) ou Razão Social (PJ)', pessoaTipo: 'ambos' },
  { fieldName: 'nome_social_fantasia', label: 'Nome Social / Fantasia', type: FormFieldType.TEXT, icon: Type, description: 'Nome social (PF) ou Nome fantasia (PJ)', pessoaTipo: 'ambos' },
  { fieldName: 'emails', label: 'E-mails', type: FormFieldType.EMAIL, icon: Mail, description: 'Lista de e-mails', pessoaTipo: 'ambos' },
  { fieldName: 'ddd_celular', label: 'DDD Celular', type: FormFieldType.TEXT, icon: Phone, description: 'DDD do celular', pessoaTipo: 'ambos' },
  { fieldName: 'numero_celular', label: 'Número Celular', type: FormFieldType.PHONE, icon: Phone, description: 'Número do celular', pessoaTipo: 'ambos', badge: 'BR' },
  { fieldName: 'ddd_residencial', label: 'DDD Residencial', type: FormFieldType.TEXT, icon: Phone, description: 'DDD do telefone residencial', pessoaTipo: 'ambos' },
  { fieldName: 'numero_residencial', label: 'Telefone Residencial', type: FormFieldType.PHONE, icon: Phone, description: 'Número do telefone residencial', pessoaTipo: 'ambos', badge: 'BR' },
  { fieldName: 'ddd_comercial', label: 'DDD Comercial', type: FormFieldType.TEXT, icon: Phone, description: 'DDD do telefone comercial', pessoaTipo: 'ambos' },
  { fieldName: 'numero_comercial', label: 'Telefone Comercial', type: FormFieldType.PHONE, icon: Phone, description: 'Número do telefone comercial', pessoaTipo: 'ambos', badge: 'BR' },
  { fieldName: 'observacoes', label: 'Observações', type: FormFieldType.TEXTAREA, icon: FileText, description: 'Observações gerais', pessoaTipo: 'ambos' },
  
  // Campos específicos de Pessoa Física
  { fieldName: 'cpf', label: 'CPF', type: FormFieldType.CPF, icon: CreditCard, description: 'CPF com validação', pessoaTipo: 'pf', badge: 'BR' },
  { fieldName: 'rg', label: 'RG', type: FormFieldType.TEXT, icon: FileText, description: 'Registro Geral', pessoaTipo: 'pf' },
  { fieldName: 'data_nascimento', label: 'Data de Nascimento', type: FormFieldType.DATE, icon: Calendar, description: 'Data de nascimento', pessoaTipo: 'pf' },
  { fieldName: 'genero', label: 'Gênero', type: FormFieldType.SELECT, icon: Users, description: 'Gênero', pessoaTipo: 'pf' },
  { fieldName: 'estado_civil', label: 'Estado Civil', type: FormFieldType.SELECT, icon: Users, description: 'Estado civil', pessoaTipo: 'pf' },
  { fieldName: 'nacionalidade', label: 'Nacionalidade', type: FormFieldType.TEXT, icon: Type, description: 'Nacionalidade', pessoaTipo: 'pf' },
  { fieldName: 'nome_genitora', label: 'Nome da Genitora', type: FormFieldType.TEXT, icon: Type, description: 'Nome da mãe', pessoaTipo: 'pf' },
  { fieldName: 'naturalidade_municipio', label: 'Naturalidade (Município)', type: FormFieldType.TEXT, icon: MapPin, description: 'Município de nascimento', pessoaTipo: 'pf' },
  { fieldName: 'naturalidade_estado_sigla', label: 'Naturalidade (Estado)', type: FormFieldType.TEXT, icon: MapPin, description: 'Estado de nascimento', pessoaTipo: 'pf' },
  { fieldName: 'escolaridade_codigo', label: 'Escolaridade', type: FormFieldType.NUMBER, icon: Hash, description: 'Código de escolaridade', pessoaTipo: 'pf' },
  
  // Campos específicos de Pessoa Jurídica
  { fieldName: 'cnpj', label: 'CNPJ', type: FormFieldType.CNPJ, icon: Building2, description: 'CNPJ com validação', pessoaTipo: 'pj', badge: 'BR' },
  { fieldName: 'inscricao_estadual', label: 'Inscrição Estadual', type: FormFieldType.TEXT, icon: FileText, description: 'Inscrição estadual', pessoaTipo: 'pj' },
  { fieldName: 'data_abertura', label: 'Data de Abertura', type: FormFieldType.DATE, icon: Calendar, description: 'Data de abertura da empresa', pessoaTipo: 'pj' },
  { fieldName: 'data_fim_atividade', label: 'Data de Fim de Atividade', type: FormFieldType.DATE, icon: Calendar, description: 'Data de encerramento', pessoaTipo: 'pj' },
  { fieldName: 'orgao_publico', label: 'Órgão Público', type: FormFieldType.CHECKBOX, icon: CheckSquare, description: 'Indica se é órgão público', pessoaTipo: 'pj' },
  { fieldName: 'ramo_atividade', label: 'Ramo de Atividade', type: FormFieldType.TEXT, icon: Briefcase, description: 'Ramo de atividade', pessoaTipo: 'pj' },
  { fieldName: 'cpf_responsavel', label: 'CPF do Responsável', type: FormFieldType.CPF, icon: CreditCard, description: 'CPF do responsável legal', pessoaTipo: 'pj', badge: 'BR' },
  { fieldName: 'porte_descricao', label: 'Porte', type: FormFieldType.TEXT, icon: Building2, description: 'Porte da empresa', pessoaTipo: 'pj' },
];

/**
 * Campos de Parte Contrária (mesma estrutura de Cliente)
 */
const PARTE_CONTRARIA_FIELDS: EntityFieldDefinition[] = [
  // Campo de busca
  { fieldName: 'busca_parte_contraria', label: 'Busca de Parte Contrária', type: FormFieldType.PARTE_CONTRARIA_SEARCH, icon: Search, description: 'Buscar parte contrária por CPF, CNPJ ou nome e preencher automaticamente', pessoaTipo: 'ambos', badge: 'Busca' },
  
  // Campos base (comuns a PF e PJ) - mapeados de CLIENTE_FIELDS
  ...CLIENTE_FIELDS
    .filter(f => f.fieldName !== 'busca_cliente')
    .map(field => ({
      ...field,
      description: field.description.replace('Cliente', 'Parte Contrária'),
    })),
];

/**
 * Campos de Terceiro
 */
const TERCEIRO_FIELDS: EntityFieldDefinition[] = [
  ...CLIENTE_FIELDS.filter(f => f.fieldName !== 'observacoes' && f.fieldName !== 'busca_cliente'),
  { fieldName: 'tipo_parte', label: 'Tipo de Parte', type: FormFieldType.SELECT, icon: List, description: 'Tipo de parte (Perito, Testemunha, etc.)', pessoaTipo: 'ambos' },
  { fieldName: 'polo', label: 'Polo', type: FormFieldType.SELECT, icon: Users, description: 'Polo processual', pessoaTipo: 'ambos' },
  { fieldName: 'principal', label: 'Principal', type: FormFieldType.CHECKBOX, icon: CheckSquare, description: 'Indica se é parte principal', pessoaTipo: 'ambos' },
  { fieldName: 'autoridade', label: 'Autoridade', type: FormFieldType.CHECKBOX, icon: CheckSquare, description: 'Indica se é autoridade', pessoaTipo: 'ambos' },
];

/**
 * Campos de Contrato
 */
const CONTRATO_FIELDS: EntityFieldDefinition[] = [
  { fieldName: 'tipo_contrato', label: 'Tipo de Contrato', type: FormFieldType.SELECT, icon: List, description: 'Tipo de contrato (Ajuizamento, Defesa, etc.)' },
  { fieldName: 'tipo_cobranca', label: 'Tipo de Cobrança', type: FormFieldType.SELECT, icon: FileCheck, description: 'Pró-Êxito ou Pró-Labore' },
  { fieldName: 'polo_cliente', label: 'Polo do Cliente', type: FormFieldType.SELECT, icon: Users, description: 'Autor ou Réu' },
  { fieldName: 'qtde_parte_autora', label: 'Quantidade Parte Autora', type: FormFieldType.NUMBER, icon: Hash, description: 'Quantidade de partes autoras' },
  { fieldName: 'qtde_parte_re', label: 'Quantidade Parte Ré', type: FormFieldType.NUMBER, icon: Hash, description: 'Quantidade de partes réus' },
  { fieldName: 'status', label: 'Status', type: FormFieldType.SELECT, icon: List, description: 'Status do contrato' },
  { fieldName: 'data_contratacao', label: 'Data de Contratação', type: FormFieldType.DATE, icon: Calendar, description: 'Data de contratação' },
  { fieldName: 'data_assinatura', label: 'Data de Assinatura', type: FormFieldType.DATE, icon: Calendar, description: 'Data de assinatura' },
  { fieldName: 'data_distribuicao', label: 'Data de Distribuição', type: FormFieldType.DATE, icon: Calendar, description: 'Data de distribuição' },
  { fieldName: 'data_desistencia', label: 'Data de Desistência', type: FormFieldType.DATE, icon: Calendar, description: 'Data de desistência' },
  { fieldName: 'observacoes', label: 'Observações', type: FormFieldType.TEXTAREA, icon: FileText, description: 'Observações do contrato' },
];

/**
 * Campos de Endereço
 */
const ENDERECO_FIELDS: EntityFieldDefinition[] = [
  { fieldName: 'cep', label: 'CEP', type: FormFieldType.CEP, icon: MapPin, description: 'CEP com busca automática', badge: 'BR' },
  { fieldName: 'logradouro', label: 'Logradouro', type: FormFieldType.TEXT, icon: MapPin, description: 'Rua, Avenida, etc.' },
  { fieldName: 'numero', label: 'Número', type: FormFieldType.TEXT, icon: Hash, description: 'Número do endereço' },
  { fieldName: 'complemento', label: 'Complemento', type: FormFieldType.TEXT, icon: Type, description: 'Complemento do endereço' },
  { fieldName: 'bairro', label: 'Bairro', type: FormFieldType.TEXT, icon: MapPin, description: 'Bairro' },
  { fieldName: 'municipio', label: 'Município', type: FormFieldType.TEXT, icon: MapPin, description: 'Município' },
  { fieldName: 'estado_sigla', label: 'Estado (Sigla)', type: FormFieldType.TEXT, icon: MapPin, description: 'Sigla do estado (ex: SP, RJ)' },
  { fieldName: 'estado', label: 'Estado', type: FormFieldType.TEXT, icon: MapPin, description: 'Nome completo do estado' },
  { fieldName: 'pais', label: 'País', type: FormFieldType.TEXT, icon: MapPin, description: 'País' },
  { fieldName: 'correspondencia', label: 'Correspondência', type: FormFieldType.CHECKBOX, icon: CheckSquare, description: 'Endereço para correspondência' },
];

/**
 * Campos de Processo
 */
const PROCESSO_FIELDS: EntityFieldDefinition[] = [
  { fieldName: 'numero_processo', label: 'Número do Processo', type: FormFieldType.TEXT, icon: FileText, description: 'Número do processo judicial' },
  { fieldName: 'trt', label: 'TRT', type: FormFieldType.TEXT, icon: FileText, description: 'Tribunal Regional do Trabalho' },
  { fieldName: 'grau', label: 'Grau', type: FormFieldType.SELECT, icon: List, description: 'Grau de jurisdição' },
  { fieldName: 'classe_judicial', label: 'Classe Judicial', type: FormFieldType.TEXT, icon: FileText, description: 'Classe do processo' },
  { fieldName: 'descricao_orgao_julgador', label: 'Órgão Julgador', type: FormFieldType.TEXT, icon: FileText, description: 'Descrição do órgão julgador' },
  { fieldName: 'nome_parte_autora', label: 'Nome Parte Autora', type: FormFieldType.TEXT, icon: Type, description: 'Nome da parte autora' },
  { fieldName: 'qtde_parte_autora', label: 'Quantidade Parte Autora', type: FormFieldType.NUMBER, icon: Hash, description: 'Quantidade de partes autoras' },
  { fieldName: 'nome_parte_re', label: 'Nome Parte Ré', type: FormFieldType.TEXT, icon: Type, description: 'Nome da parte ré' },
  { fieldName: 'qtde_parte_re', label: 'Quantidade Parte Ré', type: FormFieldType.NUMBER, icon: Hash, description: 'Quantidade de partes réus' },
  { fieldName: 'data_autuacao', label: 'Data de Autuação', type: FormFieldType.DATE, icon: Calendar, description: 'Data de autuação do processo' },
  { fieldName: 'data_arquivamento', label: 'Data de Arquivamento', type: FormFieldType.DATE, icon: Calendar, description: 'Data de arquivamento' },
  { fieldName: 'data_proxima_audiencia', label: 'Data Próxima Audiência', type: FormFieldType.DATE, icon: Calendar, description: 'Data da próxima audiência' },
  { fieldName: 'segredo_justica', label: 'Segredo de Justiça', type: FormFieldType.CHECKBOX, icon: CheckSquare, description: 'Processo em segredo de justiça' },
  { fieldName: 'prioridade_processual', label: 'Prioridade Processual', type: FormFieldType.CHECKBOX, icon: CheckSquare, description: 'Processo com prioridade' },
];

/**
 * Categorias de campos organizadas por entidade
 */
export const ENTITY_FIELD_CATEGORIES: EntityCategory[] = [
  {
    id: 'cliente',
    label: 'Cliente',
    icon: User,
    entityType: 'cliente',
    fields: CLIENTE_FIELDS,
  },
  {
    id: 'parte_contraria',
    label: 'Parte Contrária',
    icon: Users,
    entityType: 'parte_contraria',
    fields: PARTE_CONTRARIA_FIELDS,
  },
  {
    id: 'terceiro',
    label: 'Terceiro',
    icon: Users,
    entityType: 'terceiro',
    fields: TERCEIRO_FIELDS,
  },
  {
    id: 'contrato',
    label: 'Contrato',
    icon: FileCheck,
    entityType: 'contrato',
    fields: CONTRATO_FIELDS,
  },
  {
    id: 'endereco',
    label: 'Endereço',
    icon: MapPin,
    entityType: 'endereco',
    fields: ENDERECO_FIELDS,
  },
  {
    id: 'processo',
    label: 'Processo',
    icon: FileText,
    entityType: 'processo',
    fields: PROCESSO_FIELDS,
  },
];

