'use client';

import {
  DocSection,
  DocFieldTable,
  DocActionList,
  DocTip,
  DocSteps,
} from '../../components/doc-components';
import {
  Eye,
  CheckCircle,
  Clock,
  UserPlus,
  Download,
  RefreshCw,
  XCircle,
} from 'lucide-react';

export default function AssinaturaDigitalDocumentosDoc() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading mb-2">
          Assinatura Digital — Documentos
        </h1>
        <p className="text-muted-foreground text-lg">
          Envie documentos para coleta de assinaturas digitais, acompanhe o status em tempo real e acesse os documentos assinados.
        </p>
      </div>

      <DocSection title="Visão Geral">
        <p className="text-muted-foreground">
          O módulo de Documentos da Assinatura Digital permite enviar contratos, procurações,
          termos e outros documentos para que os signatários os assinem eletronicamente, sem
          necessidade de impressão. O processo é 100% digital: o documento é enviado, assinado
          online e devolvido com validade jurídica. Você acompanha em tempo real quem já assinou
          e quem está pendente.
        </p>
        <DocTip>
          As assinaturas coletadas pelo Synthropic possuem validade jurídica nos termos da Lei
          14.063/2020 (assinatura eletrônica simples e avançada) e da MP 2.200-2/2001.
        </DocTip>
      </DocSection>

      <DocSection title="Criando um Documento para Assinatura">
        <DocSteps
          steps={[
            {
              titulo: 'Acesse Assinatura Digital',
              descricao: 'No menu lateral, navegue até Assinatura Digital > Documentos.',
            },
            {
              titulo: 'Clique em "Novo Documento"',
              descricao:
                'Clique no botão no canto superior direito para iniciar o processo de criação.',
            },
            {
              titulo: 'Selecione o documento ou template',
              descricao:
                'Faça upload de um arquivo PDF ou selecione um template pré-configurado do módulo de Templates para gerar o documento automaticamente.',
            },
            {
              titulo: 'Configure os signatários',
              descricao:
                'Adicione os signatários informando nome, e-mail e o tipo de assinatura esperada (assinante, aprovador, testemunha). Defina a ordem de assinatura se necessário.',
            },
            {
              titulo: 'Defina as posições de assinatura',
              descricao:
                'No visualizador do documento, arraste e posicione os campos de assinatura, rubrica e data nas páginas correspondentes para cada signatário.',
            },
            {
              titulo: 'Envie para assinatura',
              descricao:
                'Clique em "Enviar". Cada signatário receberá um e-mail com um link seguro para assinar o documento.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Campos de Configuração">
        <DocFieldTable
          fields={[
            {
              campo: 'Título do Documento',
              tipo: 'Texto',
              obrigatorio: true,
              descricao:
                'Nome do documento que aparecerá para os signatários e no painel de controle.',
            },
            {
              campo: 'Arquivo PDF',
              tipo: 'Upload',
              obrigatorio: true,
              descricao:
                'O documento em formato PDF que será enviado para assinatura. Tamanho máximo de 50 MB.',
            },
            {
              campo: 'Prazo de Expiração',
              tipo: 'Data',
              obrigatorio: false,
              descricao:
                'Data limite para que os signatários assinem. Após essa data, o link de assinatura é automaticamente desativado.',
            },
            {
              campo: 'Mensagem Personalizada',
              tipo: 'Texto',
              obrigatorio: false,
              descricao:
                'Texto incluído no e-mail enviado aos signatários explicando o contexto do documento.',
            },
            {
              campo: 'Ordem de Assinatura',
              tipo: 'Booleano',
              obrigatorio: false,
              descricao:
                'Ative para que os signatários sejam notificados em ordem sequencial. O próximo signatário só recebe o link após o anterior ter assinado.',
            },
            {
              campo: 'Processo Vinculado',
              tipo: 'Busca',
              obrigatorio: false,
              descricao:
                'Vincula o documento a um processo jurídico para rastreabilidade.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Configurando Signatários">
        <DocFieldTable
          fields={[
            {
              campo: 'Nome',
              tipo: 'Texto',
              obrigatorio: true,
              descricao: 'Nome completo do signatário.',
            },
            {
              campo: 'E-mail',
              tipo: 'E-mail',
              obrigatorio: true,
              descricao:
                'Endereço de e-mail para onde o link de assinatura será enviado.',
            },
            {
              campo: 'Papel',
              tipo: 'Seleção',
              obrigatorio: true,
              descricao:
                'Função do signatário: Assinante (deve assinar), Aprovador (apenas aprova sem assinar visualmente), ou Testemunha.',
            },
            {
              campo: 'CPF',
              tipo: 'Texto',
              obrigatorio: false,
              descricao:
                'Documento de identificação para autenticação adicional do signatário no momento da assinatura.',
            },
            {
              campo: 'Autenticação Extra',
              tipo: 'Seleção',
              obrigatorio: false,
              descricao:
                'Exige um passo adicional de autenticação: código SMS, selfie com documento ou token.',
            },
          ]}
        />
        <DocTip>
          Você pode importar signatários diretamente da base de clientes, partes contrárias ou
          representantes cadastrados no sistema, evitando digitação manual dos dados.
        </DocTip>
      </DocSection>

      <DocSection title="Acompanhando o Status">
        <p className="text-muted-foreground mb-4">
          Após o envio, o painel de documentos exibe o status de cada documento e de cada signatário
          individualmente.
        </p>
        <DocActionList
          actions={[
            {
              icon: Clock,
              nome: 'Aguardando Assinatura',
              descricao:
                'O documento foi enviado mas ainda há signatários que não assinaram. O sistema exibe quem está pendente.',
            },
            {
              icon: CheckCircle,
              nome: 'Concluído',
              descricao:
                'Todos os signatários assinaram. O documento final está disponível para download.',
            },
            {
              icon: XCircle,
              nome: 'Recusado',
              descricao:
                'Um ou mais signatários recusaram a assinar. O motivo da recusa é registrado.',
            },
            {
              icon: Clock,
              nome: 'Expirado',
              descricao:
                'O prazo de assinatura passou sem que todos assinassem. Você pode reabrir o documento com um novo prazo.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Ações Disponíveis">
        <DocActionList
          actions={[
            {
              icon: Eye,
              nome: 'Visualizar Documento',
              descricao:
                'Abre o visualizador para ver o documento e o status de assinatura de cada campo.',
            },
            {
              icon: RefreshCw,
              nome: 'Reenviar Lembrete',
              descricao:
                'Envia um e-mail de lembrete para os signatários que ainda não assinaram.',
            },
            {
              icon: UserPlus,
              nome: 'Adicionar Signatário',
              descricao:
                'Adiciona um novo signatário ao documento mesmo após o envio inicial.',
            },
            {
              icon: Download,
              nome: 'Baixar Documento Assinado',
              descricao:
                'Disponível quando o documento está concluído. Baixa o PDF com todas as assinaturas e o relatório de auditoria.',
            },
            {
              icon: XCircle,
              nome: 'Cancelar Documento',
              descricao:
                'Cancela o processo de assinatura e invalida os links enviados aos signatários.',
            },
          ]}
        />
      </DocSection>
    </div>
  );
}
