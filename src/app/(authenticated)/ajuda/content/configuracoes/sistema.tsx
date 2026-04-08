'use client';

import {
  DocSection,
  DocFieldTable,
  DocActionList,
  DocTip,
  DocSteps,
} from '../../components/doc-components';
import {
  ShieldCheck,
  MessageSquare,
  Video,
  Bot,
  Palette,
  Link,
  CheckCircle,
  Settings,
  Sun,
  Moon,
} from 'lucide-react';

export default function Sistema() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading">
          Configurações do Sistema
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure integrações externas, assistentes de inteligência artificial, aparência e
          demais parâmetros globais do sistema Synthropic.
        </p>
      </div>

      {/* ─── INTEGRAÇÕES ─────────────────────────────────────────── */}
      <DocSection title="Integrações">
        <p className="text-muted-foreground mb-6">
          O Synthropic se integra a serviços externos para ampliar suas funcionalidades. As
          integrações são configuradas por administradores e afetam toda a organização.
        </p>

        {/* 2FAuth */}
        <div className="space-y-3 mb-8">
          <h3 className="font-semibold text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Autenticação em Dois Fatores (2FAuth)
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure um servidor 2FAuth auto-hospedado para centralizar o gerenciamento dos
            códigos TOTP da equipe, permitindo autenticação unificada.
          </p>
          <DocFieldTable
            fields={[
              {
                campo: 'URL do Servidor 2FAuth',
                tipo: 'URL',
                obrigatorio: true,
                descricao: 'Endereço do servidor 2FAuth, ex: https://2fauth.meuescritorio.com.br',
              },
              {
                campo: 'Chave de API',
                tipo: 'Texto (segredo)',
                obrigatorio: true,
                descricao: 'Token de autenticação gerado no painel do 2FAuth.',
              },
              {
                campo: 'Habilitado',
                tipo: 'Booleano',
                obrigatorio: false,
                descricao: 'Ativa a integração para todos os usuários da organização.',
              },
            ]}
          />
        </div>

        {/* Chatwoot */}
        <div className="space-y-3 mb-8">
          <h3 className="font-semibold text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Chatwoot (Chat e Atendimento)
          </h3>
          <p className="text-sm text-muted-foreground">
            Integre o Chatwoot para gerenciar conversas com clientes diretamente do Synthropic,
            sem precisar alternar entre sistemas.
          </p>
          <DocFieldTable
            fields={[
              {
                campo: 'URL do Chatwoot',
                tipo: 'URL',
                obrigatorio: true,
                descricao: 'Endereço da instância Chatwoot, ex: https://chat.meuescritorio.com.br',
              },
              {
                campo: 'Token de API',
                tipo: 'Texto (segredo)',
                obrigatorio: true,
                descricao: 'Token de acesso gerado nas configurações de usuário do Chatwoot.',
              },
              {
                campo: 'ID da Caixa de Entrada',
                tipo: 'Número',
                obrigatorio: false,
                descricao: 'ID da inbox padrão para criação de conversas via Synthropic.',
              },
              {
                campo: 'Habilitado',
                tipo: 'Booleano',
                obrigatorio: false,
                descricao: 'Ativa o widget de chat e a sincronização de conversas.',
              },
            ]}
          />
          <DocTip>
            Após habilitar o Chatwoot, um ícone de chat aparece na barra lateral do Synthropic,
            permitindo que a equipe acesse e responda conversas sem sair do sistema.
          </DocTip>
        </div>

        {/* Dyte */}
        <div className="space-y-3">
          <h3 className="font-semibold text-base flex items-center gap-2">
            <Video className="h-4 w-4 text-primary" />
            Dyte (Videoconferências)
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure o Dyte para realizar videoconferências diretamente do Synthropic, integradas
            ao Planner e ao módulo de Audiências.
          </p>
          <DocFieldTable
            fields={[
              {
                campo: 'ID da Organização (Org ID)',
                tipo: 'Texto',
                obrigatorio: true,
                descricao: 'ID da organização fornecido pelo painel do Dyte.',
              },
              {
                campo: 'Chave de API',
                tipo: 'Texto (segredo)',
                obrigatorio: true,
                descricao: 'Chave de API gerada no painel de desenvolvedor do Dyte.',
              },
              {
                campo: 'Habilitado',
                tipo: 'Booleano',
                obrigatorio: false,
                descricao: 'Ativa o botão de videoconferência nas audiências e eventos do planner.',
              },
            ]}
          />
        </div>
      </DocSection>

      {/* ─── ASSISTENTES DE IA ───────────────────────────────────── */}
      <DocSection title="Assistentes de Inteligência Artificial">
        <p className="text-muted-foreground mb-4">
          Configure os assistentes de IA disponíveis no Synthropic para auxílio na análise de
          processos, redação de documentos e consultas jurídicas.
        </p>
        <DocActionList
          actions={[
            {
              icon: Bot,
              nome: 'Assistente Jurídico',
              descricao:
                'Configure o modelo de IA para análise de processos, sugestões de estratégia e resumo de movimentações.',
            },
            {
              icon: Bot,
              nome: 'Assistente de Redação',
              descricao:
                'Configure o modelo de IA para auxílio na criação de petições, contratos e pareceres.',
            },
            {
              icon: Bot,
              nome: 'Assistente Financeiro',
              descricao:
                'Configure o modelo de IA para análise de dados financeiros e geração de insights sobre o desempenho do escritório.',
            },
          ]}
        />
        <DocFieldTable
          fields={[
            {
              campo: 'Provedor de IA',
              tipo: 'Seleção',
              obrigatorio: true,
              descricao: 'Selecione entre OpenAI, Anthropic ou Azure OpenAI.',
            },
            {
              campo: 'Chave de API',
              tipo: 'Texto (segredo)',
              obrigatorio: true,
              descricao: 'Chave de API do provedor de IA selecionado.',
            },
            {
              campo: 'Modelo',
              tipo: 'Seleção',
              obrigatorio: true,
              descricao: 'Modelo de linguagem a ser utilizado, ex: GPT-4o, Claude 3.5 Sonnet.',
            },
            {
              campo: 'Contexto do Escritório',
              tipo: 'Texto longo',
              obrigatorio: false,
              descricao:
                'Instruções personalizadas sobre o escritório, como área de atuação e tom de comunicação.',
            },
            {
              campo: 'Habilitado',
              tipo: 'Booleano',
              obrigatorio: false,
              descricao: 'Ativa o assistente para todos os usuários do sistema.',
            },
          ]}
        />
        <DocTip>
          As chaves de API de IA são armazenadas com criptografia. Os tokens consumidos são
          debitados diretamente na conta do escritório no provedor escolhido.
        </DocTip>
      </DocSection>

      {/* ─── APARÊNCIA ───────────────────────────────────────────── */}
      <DocSection title="Aparência e Tema">
        <p className="text-muted-foreground mb-4">
          Personalize a aparência visual do Synthropic para toda a organização ou individualmente
          por usuário.
        </p>
        <DocActionList
          actions={[
            {
              icon: Sun,
              nome: 'Tema Claro',
              descricao: 'Define a interface com fundo branco e cores claras.',
            },
            {
              icon: Moon,
              nome: 'Tema Escuro',
              descricao: 'Define a interface com fundo escuro, ideal para ambientes com pouca luz.',
            },
            {
              icon: Settings,
              nome: 'Tema do Sistema',
              descricao: 'Segue automaticamente a preferência de tema do sistema operacional do usuário.',
            },
            {
              icon: Palette,
              nome: 'Cor de Destaque',
              descricao:
                'Personalize a cor principal da interface com a identidade visual do escritório.',
            },
          ]}
        />
        <DocFieldTable
          fields={[
            {
              campo: 'Tema Padrão',
              tipo: 'Seleção',
              obrigatorio: false,
              descricao: 'Tema padrão aplicado a novos usuários: Claro, Escuro ou Sistema.',
            },
            {
              campo: 'Cor Principal',
              tipo: 'Cor (hex)',
              obrigatorio: false,
              descricao: 'Cor de destaque utilizada em botões, links e elementos interativos.',
            },
            {
              campo: 'Logo do Escritório',
              tipo: 'Arquivo',
              obrigatorio: false,
              descricao: 'Logo exibido na barra lateral e nos relatórios exportados.',
            },
            {
              campo: 'Nome do Escritório',
              tipo: 'Texto',
              obrigatorio: false,
              descricao: 'Nome exibido na sidebar e no cabeçalho dos relatórios.',
            },
          ]}
        />
        <DocTip>
          Cada usuário pode sobrepor o tema padrão da organização em seu perfil pessoal em
          Configurações &gt; Perfil.
        </DocTip>
      </DocSection>

      <DocSection title="Testando as Integrações">
        <DocSteps
          steps={[
            {
              titulo: 'Preencha os dados da integração',
              descricao: 'Insira as URLs, chaves e tokens necessários.',
            },
            {
              titulo: 'Clique em "Testar Conexão"',
              descricao:
                'O sistema realiza uma chamada de teste à API externa e exibe o resultado.',
            },
            {
              titulo: 'Verifique o status',
              descricao:
                'Um indicador verde confirma sucesso. Erros são exibidos com a mensagem retornada pela API.',
            },
            {
              titulo: 'Salve e habilite',
              descricao:
                'Após confirmar a conexão, salve e ative a integração para que ela fique disponível à equipe.',
            },
          ]}
        />
        <DocActionList
          actions={[
            {
              icon: Link,
              nome: 'Testar Conexão',
              descricao: 'Verifica se a integração está funcionando corretamente.',
            },
            {
              icon: CheckCircle,
              nome: 'Habilitar Integração',
              descricao: 'Ativa a integração para todos os usuários da organização.',
            },
          ]}
        />
      </DocSection>
    </div>
  );
}
