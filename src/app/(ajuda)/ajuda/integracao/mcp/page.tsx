'use client';

// Documentação das Ferramentas MCP do Synthropic

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bot,
  Users,
  FileText,
  Gavel,
  Calendar,
  ClipboardList,
  Download,
  UserCog,
  Shield,
  Scale,
  Target,
  UserCircle,
} from 'lucide-react';

interface Tool {
  name: string;
  title: string;
  description: string;
  category: string;
  readOnly: boolean;
  params?: string[];
}

const toolsData: Tool[] = [
  // Clientes (7 tools)
  {
    name: 'listar_clientes',
    title: 'Listar Clientes',
    description: 'Lista todos os clientes com filtros e paginação. Suporta busca por nome, CPF, CNPJ, tipo de pessoa (PF/PJ) e status ativo.',
    category: 'Clientes',
    readOnly: true,
    params: ['pagina', 'limite', 'busca', 'tipoPessoa', 'ativo'],
  },
  {
    name: 'buscar_cliente',
    title: 'Buscar Cliente por ID',
    description: 'Retorna os dados completos de um cliente específico pelo ID.',
    category: 'Clientes',
    readOnly: true,
    params: ['id'],
  },
  {
    name: 'buscar_cliente_por_cpf',
    title: 'Buscar Cliente por CPF',
    description: 'Busca um cliente específico pelo CPF (aceita com ou sem formatação).',
    category: 'Clientes',
    readOnly: true,
    params: ['cpf'],
  },
  {
    name: 'buscar_cliente_por_cnpj',
    title: 'Buscar Cliente por CNPJ',
    description: 'Busca um cliente específico pelo CNPJ (aceita com ou sem formatação).',
    category: 'Clientes',
    readOnly: true,
    params: ['cnpj'],
  },
  {
    name: 'buscar_clientes_por_nome',
    title: 'Buscar Clientes por Nome',
    description: 'Busca clientes pelo nome (busca parcial). Retorna uma lista de clientes cujo nome contém o texto buscado. Mínimo de 3 caracteres.',
    category: 'Clientes',
    readOnly: true,
    params: ['nome'],
  },
  {
    name: 'criar_cliente',
    title: 'Criar Cliente',
    description: 'Cria um novo cliente no sistema. Requer tipoPessoa (pf/pj), nome e cpf (para PF) ou cnpj (para PJ).',
    category: 'Clientes',
    readOnly: false,
    params: ['tipoPessoa', 'nome', 'cpf ou cnpj', 'emails', 'telefones', 'endereço'],
  },
  {
    name: 'atualizar_cliente',
    title: 'Atualizar Cliente',
    description: 'Atualiza um cliente existente. Todos os campos são opcionais.',
    category: 'Clientes',
    readOnly: false,
    params: ['id', 'dados'],
  },

  // Partes Contrárias (7 tools)
  {
    name: 'listar_partes_contrarias',
    title: 'Listar Partes Contrárias',
    description: 'Lista partes contrárias (oponentes nos processos) com paginação e filtros.',
    category: 'Partes Contrárias',
    readOnly: true,
    params: ['pagina', 'limite', 'busca', 'tipoPessoa', 'ativo'],
  },
  {
    name: 'buscar_parte_contraria',
    title: 'Buscar Parte Contrária por ID',
    description: 'Busca uma parte contrária específica pelo ID. Retorna dados completos incluindo endereço.',
    category: 'Partes Contrárias',
    readOnly: true,
    params: ['id'],
  },
  {
    name: 'buscar_parte_contraria_por_cpf',
    title: 'Buscar Parte Contrária por CPF',
    description: 'Busca uma parte contrária pelo CPF. Aceita CPF com ou sem formatação.',
    category: 'Partes Contrárias',
    readOnly: true,
    params: ['cpf'],
  },
  {
    name: 'buscar_parte_contraria_por_cnpj',
    title: 'Buscar Parte Contrária por CNPJ',
    description: 'Busca uma parte contrária pelo CNPJ. Aceita CNPJ com ou sem formatação.',
    category: 'Partes Contrárias',
    readOnly: true,
    params: ['cnpj'],
  },
  {
    name: 'buscar_partes_contrarias_por_nome',
    title: 'Buscar Partes Contrárias por Nome',
    description: 'Busca partes contrárias pelo nome (busca parcial). Útil para encontrar oponentes quando você não tem o CPF/CNPJ completo.',
    category: 'Partes Contrárias',
    readOnly: true,
    params: ['nome'],
  },
  {
    name: 'criar_parte_contraria',
    title: 'Criar Parte Contrária',
    description: 'Cria uma nova parte contrária no sistema.',
    category: 'Partes Contrárias',
    readOnly: false,
    params: ['tipoPessoa', 'nome', 'cpf ou cnpj'],
  },
  {
    name: 'atualizar_parte_contraria',
    title: 'Atualizar Parte Contrária',
    description: 'Atualiza uma parte contrária existente.',
    category: 'Partes Contrárias',
    readOnly: false,
    params: ['id', 'dados'],
  },

  // Terceiros (6 tools)
  {
    name: 'listar_terceiros',
    title: 'Listar Terceiros',
    description: 'Lista terceiros intervenientes (peritos, MPT, INSS, etc.) com filtros e paginação.',
    category: 'Terceiros',
    readOnly: true,
    params: ['pagina', 'limite', 'busca', 'tipoPessoa', 'tipoParte'],
  },
  {
    name: 'buscar_terceiro',
    title: 'Buscar Terceiro por ID',
    description: 'Busca um terceiro específico pelo ID.',
    category: 'Terceiros',
    readOnly: true,
    params: ['id'],
  },
  {
    name: 'buscar_terceiro_por_cpf',
    title: 'Buscar Terceiro por CPF',
    description: 'Busca um terceiro pelo CPF.',
    category: 'Terceiros',
    readOnly: true,
    params: ['cpf'],
  },
  {
    name: 'buscar_terceiro_por_cnpj',
    title: 'Buscar Terceiro por CNPJ',
    description: 'Busca um terceiro pelo CNPJ.',
    category: 'Terceiros',
    readOnly: true,
    params: ['cnpj'],
  },
  {
    name: 'buscar_terceiro_por_nome',
    title: 'Buscar Terceiro por Nome',
    description: 'Busca terceiros pelo nome (busca parcial). Útil para encontrar peritos e outros terceiros.',
    category: 'Terceiros',
    readOnly: true,
    params: ['nome'],
  },
  {
    name: 'criar_terceiro',
    title: 'Criar Terceiro',
    description: 'Cria um novo terceiro no sistema.',
    category: 'Terceiros',
    readOnly: false,
    params: ['tipoPessoa', 'nome', 'cpf ou cnpj', 'tipoParte', 'polo'],
  },

  // Representantes (6 tools)
  {
    name: 'listar_representantes',
    title: 'Listar Representantes',
    description: 'Lista representantes legais (advogados) com filtros e paginação.',
    category: 'Representantes',
    readOnly: true,
    params: ['pagina', 'limite', 'busca', 'ativo'],
  },
  {
    name: 'buscar_representante',
    title: 'Buscar Representante por ID',
    description: 'Busca um representante específico pelo ID.',
    category: 'Representantes',
    readOnly: true,
    params: ['id'],
  },
  {
    name: 'buscar_representante_por_cpf',
    title: 'Buscar Representante por CPF',
    description: 'Busca um representante pelo CPF (representantes são sempre PF).',
    category: 'Representantes',
    readOnly: true,
    params: ['cpf'],
  },
  {
    name: 'buscar_representante_por_cnpj',
    title: 'Buscar Representante por CNPJ',
    description: 'Sempre retorna null - representantes são sempre pessoas físicas (advogados).',
    category: 'Representantes',
    readOnly: true,
    params: ['cnpj'],
  },
  {
    name: 'buscar_representante_por_nome',
    title: 'Buscar Representante por Nome',
    description: 'Busca representantes pelo nome (busca parcial).',
    category: 'Representantes',
    readOnly: true,
    params: ['nome'],
  },
  {
    name: 'buscar_representante_por_oab',
    title: 'Buscar Representante por OAB',
    description: 'Busca um representante pelo número da OAB e estado (ex: "123456/SP").',
    category: 'Representantes',
    readOnly: true,
    params: ['oab'],
  },

  // Contratos (5 tools)
  {
    name: 'listar_contratos',
    title: 'Listar Contratos',
    description: 'Lista contratos com filtros avançados e paginação.',
    category: 'Contratos',
    readOnly: true,
    params: ['pagina', 'limite', 'busca', 'tipoContrato', 'clienteId'],
  },
  {
    name: 'buscar_contrato',
    title: 'Buscar Contrato por ID',
    description: 'Busca um contrato específico pelo ID.',
    category: 'Contratos',
    readOnly: true,
    params: ['id'],
  },
  {
    name: 'criar_contrato',
    title: 'Criar Contrato',
    description: 'Cria um novo contrato vinculado a um cliente.',
    category: 'Contratos',
    readOnly: false,
    params: ['clienteId', 'tipoContrato', 'dataInicio', 'valor'],
  },
  {
    name: 'atualizar_contrato',
    title: 'Atualizar Contrato',
    description: 'Atualiza um contrato existente.',
    category: 'Contratos',
    readOnly: false,
    params: ['id', 'dados'],
  },
  {
    name: 'deletar_contrato',
    title: 'Deletar Contrato',
    description: 'Remove permanentemente um contrato do sistema.',
    category: 'Contratos',
    readOnly: false,
    params: ['id'],
  },

  // Processos (Acervo) (5 tools)
  {
    name: 'listar_processos',
    title: 'Listar Processos',
    description: 'Lista processos do acervo com filtros complexos, paginação e ordenação.',
    category: 'Processos',
    readOnly: true,
    params: ['pagina', 'limite', 'busca', 'trt', 'grau', 'responsavelId'],
  },
  {
    name: 'buscar_processo',
    title: 'Buscar Processo por ID',
    description: 'Busca um processo específico pelo ID interno.',
    category: 'Processos',
    readOnly: true,
    params: ['id'],
  },
  {
    name: 'buscar_processo_por_numero',
    title: 'Buscar Processo por Número',
    description: 'Busca um processo pelo número processual completo.',
    category: 'Processos',
    readOnly: true,
    params: ['numeroProcesso'],
  },
  {
    name: 'buscar_processos_por_cpf',
    title: 'Buscar Processos por CPF',
    description: 'Busca todos os processos relacionados a um cliente pelo CPF.',
    category: 'Processos',
    readOnly: true,
    params: ['cpf'],
  },
  {
    name: 'atribuir_responsavel_processo',
    title: 'Atribuir Responsável ao Processo',
    description: 'Atribui ou remove o responsável de um processo.',
    category: 'Processos',
    readOnly: false,
    params: ['id', 'responsavelId'],
  },

  // Audiências (5 tools)
  {
    name: 'listar_audiencias',
    title: 'Listar Audiências',
    description: 'Lista audiências com filtros de data, TRT, responsável e paginação.',
    category: 'Audiências',
    readOnly: true,
    params: ['pagina', 'limite', 'dataInicio', 'dataFim', 'trt', 'responsavelId'],
  },
  {
    name: 'buscar_audiencia',
    title: 'Buscar Audiência por ID',
    description: 'Busca uma audiência específica pelo ID.',
    category: 'Audiências',
    readOnly: true,
    params: ['id'],
  },
  {
    name: 'buscar_audiencias_por_cpf',
    title: 'Buscar Audiências por CPF',
    description: 'Busca todas as audiências dos processos de um cliente pelo CPF.',
    category: 'Audiências',
    readOnly: true,
    params: ['cpf'],
  },
  {
    name: 'atualizar_url_virtual_audiencia',
    title: 'Atualizar URL Virtual da Audiência',
    description: 'Atualiza a URL de acesso à audiência virtual (Zoom, Teams, etc).',
    category: 'Audiências',
    readOnly: false,
    params: ['id', 'urlVirtual'],
  },
  {
    name: 'atribuir_responsavel_audiencia',
    title: 'Atribuir Responsável à Audiência',
    description: 'Atribui ou remove o responsável de uma audiência.',
    category: 'Audiências',
    readOnly: false,
    params: ['id', 'responsavelId'],
  },

  // Expedientes Manuais (9 tools)
  {
    name: 'listar_expedientes_manuais',
    title: 'Listar Expedientes Manuais',
    description: 'Lista expedientes manuais com filtros avançados, incluindo prazo vencido, tipo, responsável e status de baixa.',
    category: 'Expedientes',
    readOnly: true,
    params: ['pagina', 'limite', 'processoId', 'trt', 'grau', 'tipoExpedienteId', 'responsavelId', 'prazoVencido', 'baixado'],
  },
  {
    name: 'buscar_expediente_manual',
    title: 'Buscar Expediente Manual por ID',
    description: 'Busca um expediente manual específico pelo ID.',
    category: 'Expedientes',
    readOnly: true,
    params: ['id'],
  },
  {
    name: 'buscar_expedientes_por_cliente_cpf',
    title: 'Buscar Expedientes por CPF do Cliente',
    description: 'Busca todos os expedientes manuais dos processos relacionados a um cliente pelo CPF.',
    category: 'Expedientes',
    readOnly: true,
    params: ['cpf'],
  },
  {
    name: 'criar_expediente_manual',
    title: 'Criar Expediente Manual',
    description: 'Cria um novo expediente manual vinculado a um processo.',
    category: 'Expedientes',
    readOnly: false,
    params: ['processoId', 'descricao', 'tipoExpedienteId', 'dataPrazoLegal', 'responsavelId'],
  },
  {
    name: 'atualizar_expediente_manual',
    title: 'Atualizar Expediente Manual',
    description: 'Atualiza um expediente manual existente.',
    category: 'Expedientes',
    readOnly: false,
    params: ['id', 'dados'],
  },
  {
    name: 'deletar_expediente_manual',
    title: 'Deletar Expediente Manual',
    description: 'Remove permanentemente um expediente manual.',
    category: 'Expedientes',
    readOnly: false,
    params: ['id'],
  },
  {
    name: 'atribuir_responsavel_expediente_manual',
    title: 'Atribuir Responsável ao Expediente',
    description: 'Atribui ou remove o responsável de um expediente manual.',
    category: 'Expedientes',
    readOnly: false,
    params: ['id', 'responsavelId'],
  },
  {
    name: 'baixar_expediente_manual',
    title: 'Baixar Expediente Manual',
    description: 'Marca um expediente manual como concluído. Requer protocolo_id OU justificativa_baixa.',
    category: 'Expedientes',
    readOnly: false,
    params: ['id', 'protocoloId ou justificativa'],
  },
  {
    name: 'reverter_baixa_expediente_manual',
    title: 'Reverter Baixa de Expediente',
    description: 'Reverte a baixa de um expediente manual, marcando-o como pendente novamente.',
    category: 'Expedientes',
    readOnly: false,
    params: ['id'],
  },

  // Pendentes de Manifestação (5 tools) - armazenados na tabela 'expedientes'
  {
    name: 'listar_pendentes_manifestacao',
    title: 'Listar Pendentes de Manifestação',
    description: 'Lista processos pendentes de manifestação (tabela: expedientes) com filtros avançados, paginação, ordenação e agrupamento.',
    category: 'Pendentes',
    readOnly: true,
    params: ['pagina', 'limite', 'trt', 'grau', 'responsavelId', 'prazoVencido', 'baixado', 'agruparPor'],
  },
  {
    name: 'buscar_pendentes_por_cliente_cpf',
    title: 'Buscar Pendentes por CPF do Cliente',
    description: 'Busca todos os pendentes de manifestação (tabela: expedientes) dos processos relacionados a um cliente pelo CPF.',
    category: 'Pendentes',
    readOnly: true,
    params: ['cpf'],
  },
  {
    name: 'atribuir_responsavel_pendente',
    title: 'Atribuir Responsável ao Pendente',
    description: 'Atribui, transfere ou desatribui um responsável de um processo pendente de manifestação (tabela: expedientes).',
    category: 'Pendentes',
    readOnly: false,
    params: ['id', 'responsavelId'],
  },
  {
    name: 'baixar_pendente',
    title: 'Baixar Pendente',
    description: 'Marca um expediente pendente de manifestação (tabela: expedientes) como baixado. É obrigatório fornecer protocolo_id OU justificativa.',
    category: 'Pendentes',
    readOnly: false,
    params: ['id', 'protocoloId ou justificativa'],
  },
  {
    name: 'reverter_baixa_pendente',
    title: 'Reverter Baixa de Pendente',
    description: 'Reverte a baixa de um expediente pendente de manifestação (tabela: expedientes).',
    category: 'Pendentes',
    readOnly: false,
    params: ['id'],
  },

  // Captura (8 tools)
  {
    name: 'capturar_acervo_geral',
    title: 'Capturar Acervo Geral PJE',
    description: 'Executa captura automática do acervo geral de um TRT específico via web scraping do PJE.',
    category: 'Captura',
    readOnly: false,
    params: ['trt', 'grau', 'credencialId'],
  },
  {
    name: 'capturar_arquivados',
    title: 'Capturar Processos Arquivados',
    description: 'Executa captura automática de processos arquivados de um TRT específico.',
    category: 'Captura',
    readOnly: false,
    params: ['trt', 'grau', 'credencialId'],
  },
  {
    name: 'capturar_audiencias',
    title: 'Capturar Audiências',
    description: 'Executa captura automática de audiências agendadas de um TRT específico.',
    category: 'Captura',
    readOnly: false,
    params: ['trt', 'grau', 'credencialId'],
  },
  {
    name: 'capturar_pendentes',
    title: 'Capturar Pendentes de Manifestação',
    description: 'Executa captura automática de processos pendentes de manifestação de um TRT específico.',
    category: 'Captura',
    readOnly: false,
    params: ['trt', 'grau', 'credencialId'],
  },
  {
    name: 'listar_historico_capturas',
    title: 'Listar Histórico de Capturas',
    description: 'Lista o histórico de execuções de captura com filtros e paginação.',
    category: 'Captura',
    readOnly: true,
    params: ['pagina', 'limite', 'tipo', 'status', 'trt'],
  },
  {
    name: 'buscar_captura_historico',
    title: 'Buscar Captura no Histórico',
    description: 'Busca uma captura específica no histórico pelo ID.',
    category: 'Captura',
    readOnly: true,
    params: ['id'],
  },
  {
    name: 'listar_credenciais_pje',
    title: 'Listar Credenciais PJE',
    description: 'Lista credenciais de acesso ao PJE por advogado.',
    category: 'Captura',
    readOnly: true,
    params: ['advogadoId'],
  },
  {
    name: 'criar_credencial_pje',
    title: 'Criar Credencial PJE',
    description: 'Cria uma nova credencial de acesso ao PJE para um advogado.',
    category: 'Captura',
    readOnly: false,
    params: ['advogadoId', 'login', 'senha', 'certificadoPath'],
  },

  // Advogados (7 tools)
  {
    name: 'listar_advogados',
    title: 'Listar Advogados',
    description: 'Lista advogados do escritório com filtros e paginação.',
    category: 'Advogados',
    readOnly: true,
    params: ['pagina', 'limite', 'busca', 'ativo'],
  },
  {
    name: 'buscar_advogado',
    title: 'Buscar Advogado por ID',
    description: 'Busca um advogado específico pelo ID.',
    category: 'Advogados',
    readOnly: true,
    params: ['id'],
  },
  {
    name: 'buscar_advogado_por_cpf',
    title: 'Buscar Advogado por CPF',
    description: 'Busca um advogado pelo CPF.',
    category: 'Advogados',
    readOnly: true,
    params: ['cpf'],
  },
  {
    name: 'buscar_advogado_por_oab',
    title: 'Buscar Advogado por OAB',
    description: 'Busca um advogado pelo número da OAB e estado.',
    category: 'Advogados',
    readOnly: true,
    params: ['oab'],
  },
  {
    name: 'criar_advogado',
    title: 'Criar Advogado',
    description: 'Cria um novo advogado no sistema.',
    category: 'Advogados',
    readOnly: false,
    params: ['nome', 'cpf', 'oab', 'estadoOab'],
  },
  {
    name: 'atualizar_advogado',
    title: 'Atualizar Advogado',
    description: 'Atualiza um advogado existente.',
    category: 'Advogados',
    readOnly: false,
    params: ['id', 'dados'],
  },
  {
    name: 'deletar_advogado',
    title: 'Deletar Advogado',
    description: 'Remove permanentemente um advogado do sistema.',
    category: 'Advogados',
    readOnly: false,
    params: ['id'],
  },

  // Usuários (6 tools)
  {
    name: 'listar_usuarios',
    title: 'Listar Usuários',
    description: 'Lista usuários do sistema com filtros e paginação.',
    category: 'Usuários',
    readOnly: true,
    params: ['pagina', 'limite', 'busca', 'ativo'],
  },
  {
    name: 'buscar_usuario',
    title: 'Buscar Usuário por ID',
    description: 'Busca um usuário específico pelo ID.',
    category: 'Usuários',
    readOnly: true,
    params: ['id'],
  },
  {
    name: 'criar_usuario',
    title: 'Criar Usuário',
    description: 'Cria um novo usuário no sistema.',
    category: 'Usuários',
    readOnly: false,
    params: ['email', 'nome', 'cpf', 'cargoId'],
  },
  {
    name: 'atualizar_usuario',
    title: 'Atualizar Usuário',
    description: 'Atualiza um usuário existente.',
    category: 'Usuários',
    readOnly: false,
    params: ['id', 'dados'],
  },
  {
    name: 'deletar_usuario',
    title: 'Deletar Usuário',
    description: 'Remove permanentemente um usuário do sistema.',
    category: 'Usuários',
    readOnly: false,
    params: ['id'],
  },
  {
    name: 'sincronizar_permissoes_usuario',
    title: 'Sincronizar Permissões',
    description: 'Sincroniza as permissões de um usuário com base no cargo.',
    category: 'Usuários',
    readOnly: false,
    params: ['id'],
  },

  // Admin (3 tools)
  {
    name: 'limpar_cache_redis',
    title: 'Limpar Cache Redis',
    description: 'Remove todas as entradas do cache Redis. Use com cautela.',
    category: 'Admin',
    readOnly: false,
    params: [],
  },
  {
    name: 'ver_estatisticas_cache',
    title: 'Ver Estatísticas do Cache',
    description: 'Retorna estatísticas de uso do cache Redis (hit rate, misses, etc).',
    category: 'Admin',
    readOnly: true,
    params: [],
  },
  {
    name: 'health_check',
    title: 'Health Check',
    description: 'Verifica o status de saúde da aplicação e suas dependências (DB, Redis, etc).',
    category: 'Admin',
    readOnly: true,
    params: [],
  },
];

// Agrupar ferramentas por categoria
const toolsByCategory = toolsData.reduce((acc, tool) => {
  if (!acc[tool.category]) {
    acc[tool.category] = [];
  }
  acc[tool.category].push(tool);
  return acc;
}, {} as Record<string, Tool[]>);

const categories = Object.keys(toolsByCategory).sort();

const categoryIcons: Record<string, React.ReactNode> = {
  Clientes: <Users className="w-4 h-4" />,
  'Partes Contrárias': <Scale className="w-4 h-4" />,
  Terceiros: <Target className="w-4 h-4" />,
  Representantes: <UserCircle className="w-4 h-4" />,
  Contratos: <FileText className="w-4 h-4" />,
  Processos: <Gavel className="w-4 h-4" />,
  Audiências: <Calendar className="w-4 h-4" />,
  Expedientes: <ClipboardList className="w-4 h-4" />,
  Pendentes: <ClipboardList className="w-4 h-4" />,
  Captura: <Download className="w-4 h-4" />,
  Advogados: <UserCog className="w-4 h-4" />,
  Usuários: <Users className="w-4 h-4" />,
  Admin: <Shield className="w-4 h-4" />,
};

export default function MCPDocsPage() {
  const [activeCategory, setActiveCategory] = React.useState<string>(categories[0]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Bot className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Ferramentas MCP</h1>
        </div>
        <p className="text-muted-foreground">
          Ferramentas disponíveis no servidor MCP do Synthropic para integração com assistentes de IA
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Ferramentas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{toolsData.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Distribuídas em {categories.length} categorias
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Somente Leitura</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {toolsData.filter((t) => t.readOnly).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Operações seguras de consulta</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Escrita</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {toolsData.filter((t) => !t.readOnly).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Operações de criação/atualização</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Category Sidebar */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Categorias</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <ScrollArea className="h-100">
              <div className="space-y-1">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`
                      w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors
                      ${
                        activeCategory === category
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'hover:bg-accent hover:text-accent-foreground'
                      }
                    `}
                  >
                    {categoryIcons[category]}
                    <span className="flex-1 text-left">{category}</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {toolsByCategory[category].length}
                    </Badge>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Tools List */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              {categoryIcons[activeCategory]}
              <CardTitle>{activeCategory}</CardTitle>
            </div>
            <CardDescription>
              {toolsByCategory[activeCategory].length} ferramenta
              {toolsByCategory[activeCategory].length !== 1 ? 's' : ''} disponível
              {toolsByCategory[activeCategory].length !== 1 ? 'is' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {toolsByCategory[activeCategory].map((tool, index) => (
              <div key={tool.name}>
                {index > 0 && <Separator className="my-4" />}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{tool.title}</h3>
                        {tool.readOnly ? (
                          <Badge variant="secondary" className="text-xs">
                            Somente Leitura
                          </Badge>
                        ) : (
                          <Badge variant="default" className="text-xs">
                            Escrita
                          </Badge>
                        )}
                      </div>
                      <code className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded inline-block">
                        {tool.name}
                      </code>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">{tool.description}</p>

                  {tool.params && tool.params.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Parâmetros:</p>
                      <div className="flex flex-wrap gap-2">
                        {tool.params.map((param) => (
                          <Badge key={param} variant="outline" className="text-xs">
                            {param}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Configuration Info */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração do MCP</CardTitle>
          <CardDescription>
            Como conectar o servidor MCP do Synthropic ao Claude Desktop
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-medium">1. Localização do Servidor MCP:</p>
            <code className="block text-sm bg-muted p-3 rounded-md">
              E:\Development\mcp
            </code>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">2. Configuração no Claude Desktop:</p>
            <p className="text-sm text-muted-foreground">
              Adicione o servidor no arquivo de configuração do Claude Desktop:
            </p>
            <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
{`{
  "mcpServers": {
    "synthropic": {
      "command": "node",
      "args": ["E:\\\\Development\\\\mcp\\\\dist\\\\index.js"],
      "env": {
        "SYNTHROPIC_API_URL": "http://localhost:3000",
        "SYNTHROPIC_API_KEY": "synthropic_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}`}
            </pre>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">3. Variáveis de Ambiente:</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>
                <code className="bg-muted px-1 rounded">SYNTHROPIC_API_URL</code>: URL base da API do Synthropic
              </li>
              <li>
                <code className="bg-muted px-1 rounded">SYNTHROPIC_API_KEY</code>: Chave de autenticação (Perfil → API Keys)
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-warning">⚠️ Segurança:</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Nunca compartilhe sua API key em repositórios públicos</li>
              <li>Gere uma nova key em Perfil → API Keys</li>
              <li>Use variáveis de ambiente (.env.local) para armazenar secrets</li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">4. Formato de Resposta:</p>
            <p className="text-sm text-muted-foreground">
              Todas as ferramentas suportam dois formatos:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li><code className="bg-muted px-1 rounded">JSON</code> (padrão): Dados estruturados</li>
              <li><code className="bg-muted px-1 rounded">MARKDOWN</code>: Formatado para legibilidade</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              Para Markdown, adicione <code className="bg-muted px-1 rounded">response_format: &quot;markdown&quot;</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
