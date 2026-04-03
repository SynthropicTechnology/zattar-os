import { ProfileConfig } from "./types";
import {
  BadgeCheck,
  Calendar,
  FileText,
  Mail,
  Phone,
  User,
  MapPin,
  CreditCard,
  Cake,
  Users,
  Hash,
  Briefcase,
  Clock,
} from "lucide-react";
import { formatarEnderecoCompleto } from "@/app/(authenticated)/usuarios/utils";

// Wrapper para formatar endereço com tipo compatível
const formatEndereco = (value: unknown): string => {
  return formatarEnderecoCompleto(value as Parameters<typeof formatarEnderecoCompleto>[0]);
};

// Format date helper
const formatDate = (value: unknown): string => {
  if (!value) return '-';
  const date = new Date(value as string);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Format datetime helper
const formatDateTime = (value: unknown): string => {
  if (!value) return '-';
  const date = new Date(value as string);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const usuarioProfileConfig: ProfileConfig = {
  entityType: "usuario",
  headerConfig: {
    showBanner: true,
    showAvatar: true,
    showStatus: true,
    titleField: "nomeCompleto",
    subtitleFields: ["emailCorporativo"],
    badges: [
      { field: "cargo.nome", variant: "outline" },
      {
        field: "isSuperAdmin",
        variant: "destructive",
        map: { true: "Super Admin" },
      },
      {
        field: "ativo",
        variant: "default",
        map: { true: "Ativo", false: "Inativo" },
      },
    ],
    metadata: [
      { label: "OAB", valuePath: "oab", icon: BadgeCheck },
      { label: "Cadastro", valuePath: "createdAt", icon: Calendar, format: formatDate },
      { label: "Último acesso", valuePath: "ultimoAcesso", icon: Clock, format: formatDateTime },
    ],
  },
  sidebarSections: [
    {
      title: "Identificação",
      fields: [
        { label: "Nome Completo", valuePath: "nomeCompleto", icon: User },
        { label: "CPF", valuePath: "cpf", icon: CreditCard },
        { label: "RG", valuePath: "rg", icon: Hash },
        { label: "Data de Nascimento", valuePath: "dataNascimento", icon: Cake },
        { label: "Gênero", valuePath: "genero", icon: Users },
      ],
    },
    {
      title: "Contatos",
      fields: [
        { label: "Email Corporativo", valuePath: "emailCorporativo", icon: Mail },
        { label: "Email Pessoal", valuePath: "emailPessoal", icon: Mail },
        { label: "Telefone", valuePath: "telefone", icon: Phone },
        { label: "Ramal", valuePath: "ramal", icon: Phone },
      ],
    },
    {
      title: "Profissional",
      fields: [
        { label: "Cargo", valuePath: "cargo.nome", icon: Briefcase },
        { label: "OAB", valuePath: "oab", icon: BadgeCheck },
        { label: "UF OAB", valuePath: "ufOab", icon: MapPin },
      ],
    },
    {
      title: "Endereço",
      fields: [
        { label: "Endereço Completo", valuePath: "endereco", icon: MapPin, format: formatEndereco },
      ],
    },
    {
      title: "Estatísticas",
      fields: [
        { label: "Processos Atribuídos", valuePath: "stats.processos", icon: FileText },
        { label: "Audiências", valuePath: "stats.audiencias", icon: Calendar },
        { label: "Pendentes", valuePath: "stats.pendentes", icon: FileText },
        { label: "Contratos", valuePath: "stats.contratos", icon: Briefcase },
      ],
    },
  ],
  tabs: [
    {
      id: "visao-geral",
      label: "Visão Geral",
      sections: [
        {
          type: "custom",
          title: "Estatísticas",
          componentName: "AtividadesCards",
          componentProps: { usuarioIdField: "id" },
        },
        {
          type: "timeline",
          title: "Atividades Recentes",
          dataSource: "atividades",
          limit: 10,
        },
      ],
    },
    {
      id: "dados-cadastrais",
      label: "Dados Cadastrais",
      sections: [
        {
          type: "info-cards",
          title: "Informações Pessoais",
          fields: [
            { label: "Nome Completo", valuePath: "nomeCompleto" },
            { label: "Nome de Exibição", valuePath: "nomeExibicao" },
            { label: "CPF", valuePath: "cpf" },
            { label: "RG", valuePath: "rg" },
            { label: "Data de Nascimento", valuePath: "dataNascimento" },
            { label: "Gênero", valuePath: "genero" },
          ],
        },
        {
          type: "info-cards",
          title: "Contatos",
          fields: [
            { label: "Email Corporativo", valuePath: "emailCorporativo" },
            { label: "Email Pessoal", valuePath: "emailPessoal" },
            { label: "Telefone", valuePath: "telefone" },
            { label: "Ramal", valuePath: "ramal" },
          ],
        },
        {
          type: "info-cards",
          title: "Dados Profissionais",
          fields: [
            { label: "Cargo", valuePath: "cargo.nome" },
            { label: "OAB", valuePath: "oab" },
            { label: "UF OAB", valuePath: "ufOab" },
          ],
        },
        {
          type: "info-cards",
          title: "Endereço",
          fields: [
            { label: "Endereço Completo", valuePath: "endereco", format: formatEndereco },
          ],
        },
      ],
    },
    {
      id: "permissoes",
      label: "Permissões",
      sections: [
        {
          type: "custom",
          title: "Matriz de Permissões",
          componentName: "PermissoesMatriz",
          componentProps: {
            usuarioIdField: "id",
            isSuperAdminField: "isSuperAdmin",
          },
        },
      ],
    },
    {
      id: "seguranca",
      label: "Segurança",
      sections: [
        {
          type: "custom",
          title: "Logs de Autenticação",
          componentName: "AuthLogsTimeline",
          componentProps: { usuarioIdField: "id" },
        },
        {
          type: "custom",
          title: "Configurações de Segurança",
          componentName: "SuperAdminToggle",
          componentProps: {
            usuarioIdField: "id",
            isSuperAdminField: "isSuperAdmin",
          },
        },
      ],
    },
    {
      id: "atividades",
      label: "Atividades",
      sections: [
        {
          type: "table",
          title: "Processos Atribuídos",
          dataSource: "processos",
          columns: [
            { header: "Número", accessorKey: "numero" },
            { header: "Cliente", accessorKey: "cliente.nome" },
            { header: "Status", accessorKey: "status" },
            { header: "Última Atualização", accessorKey: "updatedAt" },
          ],
          limit: 10,
        },
        {
          type: "table",
          title: "Audiências",
          dataSource: "audiencias",
          columns: [
            { header: "Data", accessorKey: "dataAudiencia" },
            { header: "Processo", accessorKey: "processo.numero" },
            { header: "Local", accessorKey: "local" },
            { header: "Tipo", accessorKey: "tipo" },
          ],
          limit: 10,
        },
        {
          type: "table",
          title: "Pendências",
          dataSource: "pendencias",
          columns: [
            { header: "Descrição", accessorKey: "descricao" },
            { header: "Prazo", accessorKey: "prazo" },
            { header: "Status", accessorKey: "status" },
            { header: "Prioridade", accessorKey: "prioridade" },
          ],
          limit: 10,
        },
        {
          type: "table",
          title: "Contratos",
          dataSource: "contratos",
          columns: [
            { header: "Número", accessorKey: "numero" },
            { header: "Cliente", accessorKey: "cliente.nome" },
            { header: "Valor", accessorKey: "valor" },
            { header: "Status", accessorKey: "status" },
          ],
          limit: 10,
        },
      ],
    },
  ],
};
