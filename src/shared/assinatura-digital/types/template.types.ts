/**
 * Template Types for PDF Generation
 *
 * Types used for template field definitions in PDF generation service.
 * These types match the structure stored in the database JSONB field.
 */

/**
 * Tipo de variável disponível para uso em templates
 */
export type TipoVariavel =
  // Cliente - Identificação
  | "cliente.nome_completo"
  | "cliente.nome"
  | "cliente.nome_social_fantasia"
  | "cliente.cpf"
  | "cliente.cnpj"
  | "cliente.rg"
  | "cliente.tipo_pessoa"
  // Cliente - Contato
  | "cliente.email"
  | "cliente.emails"
  | "cliente.telefone"
  | "cliente.celular"
  | "cliente.ddd_celular"
  | "cliente.numero_celular"
  | "cliente.telefone_residencial"
  | "cliente.ddd_residencial"
  | "cliente.numero_residencial"
  | "cliente.telefone_comercial"
  | "cliente.ddd_comercial"
  | "cliente.numero_comercial"
  // Cliente - Dados Pessoais (PF)
  | "cliente.data_nascimento"
  | "cliente.genero"
  | "cliente.sexo"
  | "cliente.estado_civil"
  | "cliente.nacionalidade"
  | "cliente.nome_genitora"
  // Cliente - Endereço
  | "cliente.endereco_completo"
  | "cliente.endereco_logradouro"
  | "cliente.endereco_numero"
  | "cliente.endereco_complemento"
  | "cliente.endereco_bairro"
  | "cliente.endereco_cidade"
  | "cliente.endereco_uf"
  | "cliente.endereco_estado"
  | "cliente.endereco_cep"
  // Cliente - Dados Empresariais (PJ)
  | "cliente.inscricao_estadual"
  | "cliente.data_abertura"
  | "cliente.data_fim_atividade"
  | "cliente.ramo_atividade"
  | "cliente.porte"
  | "cliente.cpf_responsavel"
  // Cliente - Outros
  | "cliente.observacoes"
  // Parte Contrária
  | "parte_contraria.nome"
  // Segmento
  | "segmento.id"
  | "segmento.nome"
  | "segmento.slug"
  | "segmento.descricao"
  // Sistema
  | "sistema.protocolo"
  | "sistema.data_geracao"
  | "sistema.ip_cliente"
  | "sistema.user_agent"
  // Formulário
  | "formulario.nome"
  | "formulario.slug"
  | "formulario.id"
  // Contrato
  | "contrato.tipo_contrato"
  | "contrato.tipo_cobranca"
  | "contrato.status"
  | "contrato.cadastrado_em"
  // Processo Judicial
  | "processo.numero"
  | "processo.vara"
  | "processo.comarca"
  | "processo.data_autuacao"
  | "processo.valor_causa"
  | "processo.tipo"
  | string; // Allow custom variables

/**
 * Posição de um campo no PDF
 */
export interface PosicaoCampo {
  x: number;
  y: number;
  width: number;
  height: number;
  pagina: number;
}

/**
 * Estilo de um campo no PDF
 */
export interface EstiloCampo {
  tamanho_fonte?: number;
  fonte?: string;
  alinhamento?: "left" | "center" | "right" | "justify";
  cor?: string; // Hex color
  negrito?: boolean;
  italico?: boolean;
}

/**
 * Conteúdo composto para campos de tipo texto_composto
 */
export interface ConteudoComposto {
  template: string; // Template string com variáveis {{variavel}}
  json?: Record<string, unknown>;
}

/**
 * Campo de template PDF
 *
 * Esta estrutura é armazenada como JSONB no banco de dados
 * e usada para renderizar campos dinâmicos em PDFs.
 */
export interface TemplateCampo {
  id: string;
  nome?: string;
  tipo:
    | "texto"
    | "assinatura"
    | "foto"
    | "texto_composto"
    | "data"
    | "cpf"
    | "cnpj";
  variavel?: TipoVariavel;
  posicao?: PosicaoCampo;
  estilo?: EstiloCampo;
  valor_padrao?: string;
  conteudo_composto?: ConteudoComposto;
  obrigatorio?: boolean;
  formato?: string;
  ordem?: number;
  signatario_id?: string; // ID of the signer assigned to this field
}

/**
 * Signatário armazenado no template
 */
export interface TemplateSignatario {
  id: string;
  nome: string;
  email: string;
  cor: string;
  ordem: number;
}

/**
 * Interface completa do Template (estrutura compatível com DB/JSONB)
 */
export interface Template {
  id: number;
  template_uuid: string;
  nome: string;
  descricao?: string | null;
  tipo_template: "pdf" | "markdown";
  conteudo_markdown?: string | null;
  segmento_id?: number | null;
  contrato_id?: number | null; // Vínculo com contrato
  pdf_url?: string | null;
  ativo: boolean;
  status: "ativo" | "inativo" | "rascunho";
  versao: number;
  arquivo_original?: string | null;
  arquivo_nome?: string | null;
  arquivo_tamanho?: number | null;
  criado_por?: string | null;
  campos?: string | TemplateCampo[];
  signatarios?: string | TemplateSignatario[]; // Signatários do template
  created_at: string;
  updated_at: string;
}
