'use client';

import {
  DocSection,
  DocFieldTable,
  DocActionList,
  DocTip,
  DocSteps,
} from '../../components/doc-components';
import {
  Link2,
  Eye,
  Download,
  Type,
  Mail,
  Hash,
  CheckSquare,
  AlignLeft,
  Phone,
  FileText,
  Globe,
  BarChart3,
} from 'lucide-react';

export default function AssinaturaDigitalFormulariosDoc() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading mb-2">
          Assinatura Digital — Formulários
        </h1>
        <p className="text-muted-foreground text-lg">
          Crie formulários públicos para coletar dados de clientes e, opcionalmente, coletar assinaturas digitais diretamente pelo link compartilhado.
        </p>
      </div>

      <DocSection title="Visão Geral">
        <p className="text-muted-foreground">
          Os Formulários permitem criar páginas de coleta de dados acessíveis por um link público,
          sem que o usuário precise ter uma conta no Synthropic. É possível combinar campos de
          preenchimento com um template de documento para que, ao final do preenchimento, o próprio
          usuário assine o documento gerado com seus dados. As respostas ficam registradas no sistema
          para consulta e exportação.
        </p>
        <DocTip>
          Use formulários para onboarding de novos clientes (coleta de dados cadastrais e assinatura
          do contrato de prestação de serviços em uma única etapa), economizando tempo no atendimento inicial.
        </DocTip>
      </DocSection>

      <DocSection title="Criando um Formulário">
        <DocSteps
          steps={[
            {
              titulo: 'Acesse Formulários',
              descricao:
                'No menu lateral, navegue até Assinatura Digital > Formulários.',
            },
            {
              titulo: 'Clique em "Novo Formulário"',
              descricao:
                'Informe o nome do formulário, uma descrição e personalize o título que os respondentes verão.',
            },
            {
              titulo: 'Adicione os campos',
              descricao:
                'Configure os campos de coleta de dados: nome, e-mail, CPF, telefone, endereço e outros campos personalizados.',
            },
            {
              titulo: 'Vincule um template (opcional)',
              descricao:
                'Se o formulário deve resultar em um documento assinado, selecione um template de Assinatura Digital. Os dados coletados preencherão automaticamente os campos do template.',
            },
            {
              titulo: 'Configure as opções de assinatura',
              descricao:
                'Se vinculou um template, defina se o respondente deve assinar o documento ao final do preenchimento, ou se a assinatura será coletada separadamente.',
            },
            {
              titulo: 'Publique e compartilhe',
              descricao:
                'Clique em "Publicar". O sistema gera um link público único que pode ser enviado por e-mail, WhatsApp ou incorporado em um site.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Campos de Configuração do Formulário">
        <DocFieldTable
          fields={[
            {
              campo: 'Nome do Formulário',
              tipo: 'Texto',
              obrigatorio: true,
              descricao:
                'Identificação interna do formulário no sistema.',
            },
            {
              campo: 'Título Público',
              tipo: 'Texto',
              obrigatorio: true,
              descricao:
                'Título exibido para o respondente na página do formulário.',
            },
            {
              campo: 'Descrição',
              tipo: 'Texto',
              obrigatorio: false,
              descricao:
                'Texto explicativo exibido abaixo do título, orientando o respondente sobre o propósito do formulário.',
            },
            {
              campo: 'Template Vinculado',
              tipo: 'Seleção',
              obrigatorio: false,
              descricao:
                'Template de documento que será preenchido automaticamente com os dados coletados no formulário.',
            },
            {
              campo: 'Coletar Assinatura',
              tipo: 'Booleano',
              obrigatorio: false,
              descricao:
                'Quando ativado (e um template está vinculado), o respondente também assina o documento gerado ao final do formulário.',
            },
            {
              campo: 'Data de Expiração',
              tipo: 'Data',
              obrigatorio: false,
              descricao:
                'Define até quando o formulário aceita respostas. Após esta data, o link exibe uma mensagem de encerramento.',
            },
            {
              campo: 'Limite de Respostas',
              tipo: 'Número',
              obrigatorio: false,
              descricao:
                'Número máximo de respostas aceitas. Ao atingir o limite, o formulário é fechado automaticamente.',
            },
            {
              campo: 'Confirmação por E-mail',
              tipo: 'Booleano',
              obrigatorio: false,
              descricao:
                'Envia um e-mail de confirmação para o respondente após o envio bem-sucedido do formulário.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Tipos de Campos do Formulário">
        <DocActionList
          actions={[
            {
              icon: Type,
              nome: 'Texto Curto',
              descricao:
                'Campo de linha única para respostas curtas como nome, cidade, cargo.',
            },
            {
              icon: AlignLeft,
              nome: 'Texto Longo',
              descricao:
                'Campo de múltiplas linhas para respostas dissertativas, descrições ou observações.',
            },
            {
              icon: Mail,
              nome: 'E-mail',
              descricao:
                'Campo com validação automática de formato de e-mail.',
            },
            {
              icon: Phone,
              nome: 'Telefone',
              descricao:
                'Campo com máscara de formatação para telefone brasileiro.',
            },
            {
              icon: Hash,
              nome: 'CPF / CNPJ',
              descricao:
                'Campo com máscara e validação de CPF ou CNPJ.',
            },
            {
              icon: Hash,
              nome: 'Número',
              descricao:
                'Campo numérico com suporte a configuração de valor mínimo e máximo.',
            },
            {
              icon: CheckSquare,
              nome: 'Caixa de Seleção',
              descricao:
                'Checkbox único para aceite de termos e condições ou confirmação de ciência.',
            },
            {
              icon: CheckSquare,
              nome: 'Múltipla Escolha',
              descricao:
                'Lista de opções onde o respondente seleciona uma ou mais respostas.',
            },
            {
              icon: FileText,
              nome: 'Upload de Arquivo',
              descricao:
                'Permite que o respondente anexe documentos, como RG, comprovante de residência ou outros arquivos.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Link Público e Compartilhamento">
        <p className="text-muted-foreground mb-4">
          Após a publicação, o formulário recebe um link único que pode ser compartilhado de
          diversas formas.
        </p>
        <DocActionList
          actions={[
            {
              icon: Link2,
              nome: 'Copiar Link',
              descricao:
                'Copia o link público do formulário para a área de transferência. Pode ser enviado por qualquer canal de comunicação.',
            },
            {
              icon: Globe,
              nome: 'QR Code',
              descricao:
                'Gera um QR Code do link do formulário para uso em materiais impressos ou apresentações.',
            },
            {
              icon: Eye,
              nome: 'Pré-visualizar',
              descricao:
                'Abre o formulário em uma aba separada para verificar a aparência e o comportamento antes de compartilhar.',
            },
          ]}
        />
        <DocTip>
          O link do formulário não requer login. Qualquer pessoa com o link pode acessar e preencher
          o formulário, tornando-o ideal para coleta de dados de clientes externos.
        </DocTip>
      </DocSection>

      <DocSection title="Gerenciando Respostas">
        <p className="text-muted-foreground mb-4">
          Todas as respostas são registradas e ficam disponíveis na aba &quot;Respostas&quot; do formulário.
        </p>
        <DocActionList
          actions={[
            {
              icon: BarChart3,
              nome: 'Painel de Respostas',
              descricao:
                'Exibe todas as respostas recebidas com data, hora e status. Para formulários com assinatura, mostra se o documento foi assinado.',
            },
            {
              icon: Eye,
              nome: 'Visualizar Resposta Individual',
              descricao:
                'Abre os dados de uma resposta específica, incluindo todos os campos preenchidos e o documento assinado, se houver.',
            },
            {
              icon: Download,
              nome: 'Exportar Respostas',
              descricao:
                'Exporta todas as respostas em formato CSV ou Excel para análise em outras ferramentas.',
            },
            {
              icon: Download,
              nome: 'Baixar Documentos Assinados',
              descricao:
                'Para formulários vinculados a templates, baixe o PDF assinado gerado a partir de cada resposta.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Desativando e Editando Formulários">
        <DocActionList
          actions={[
            {
              icon: Globe,
              nome: 'Pausar Formulário',
              descricao:
                'Desativa temporariamente o link público sem excluir o formulário ou as respostas já coletadas.',
            },
            {
              icon: Globe,
              nome: 'Reativar Formulário',
              descricao:
                'Reativa um formulário pausado, tornando o link público novamente.',
            },
            {
              icon: Type,
              nome: 'Editar Formulário',
              descricao:
                'Modifica os campos, título e configurações. Alterações afetam apenas novos respondentes; respostas já enviadas são preservadas.',
            },
          ]}
        />
        <DocTip>
          Ao editar um formulário com respostas existentes, tenha cuidado ao remover campos,
          pois isso pode afetar a visualização dos dados já coletados naquele campo.
        </DocTip>
      </DocSection>
    </div>
  );
}
