import swaggerJsdoc, { type Options } from 'swagger-jsdoc';

const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Synthropic API',
      version: '1.0.0',
      description: 'Documentação da API do Synthropic - Sistema de captura de dados do PJE/TRT',
      contact: {
        name: 'Synthropic',
        email: 'suporte@synthropic.com.br',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desenvolvimento',
      },
      {
        url: 'https://api.synthropic.com.br',
        description: 'Servidor de produção',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token de autenticação Bearer (JWT)',
        },
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'sb-access-token',
          description: 'Autenticação via sessão do Supabase',
        },
        serviceApiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'x-service-api-key',
          description: 'API Key para autenticação de jobs do sistema. Usado por scripts automatizados e processos agendados.',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Mensagem de erro',
            },
          },
          required: ['error'],
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              description: 'Dados da resposta',
            },
          },
          required: ['success'],
        },
        BaseCapturaTRTParams: {
          type: 'object',
          required: ['advogado_id', 'trt_codigo', 'grau'],
          properties: {
            advogado_id: {
              type: 'integer',
              description: 'ID do advogado na tabela advogados. O backend buscará automaticamente a credencial correspondente para este advogado, TRT e grau.',
              example: 1,
            },
            trt_codigo: {
              type: 'string',
              description: 'Código do tribunal trabalhista (TRT1 a TRT24 ou TST)',
              enum: ['TRT1', 'TRT2', 'TRT3', 'TRT4', 'TRT5', 'TRT6', 'TRT7', 'TRT8', 'TRT9', 'TRT10', 'TRT11', 'TRT12', 'TRT13', 'TRT14', 'TRT15', 'TRT16', 'TRT17', 'TRT18', 'TRT19', 'TRT20', 'TRT21', 'TRT22', 'TRT23', 'TRT24', 'TST'],
              example: 'TRT3',
            },
            grau: {
              type: 'string',
              enum: ['primeiro_grau', 'segundo_grau', 'tribunal_superior'],
              description: 'Grau do processo (primeiro_grau, segundo_grau ou tribunal_superior)',
              example: 'primeiro_grau',
            },
          },
        },
        AudienciasParams: {
          type: 'object',
          required: ['advogado_id', 'trt_codigo', 'grau'],
          properties: {
            advogado_id: {
              type: 'integer',
              description: 'ID do advogado na tabela advogados. O backend buscará automaticamente a credencial correspondente para este advogado, TRT e grau.',
              example: 1,
            },
            trt_codigo: {
              type: 'string',
              description: 'Código do tribunal trabalhista (TRT1 a TRT24 ou TST)',
              enum: ['TRT1', 'TRT2', 'TRT3', 'TRT4', 'TRT5', 'TRT6', 'TRT7', 'TRT8', 'TRT9', 'TRT10', 'TRT11', 'TRT12', 'TRT13', 'TRT14', 'TRT15', 'TRT16', 'TRT17', 'TRT18', 'TRT19', 'TRT20', 'TRT21', 'TRT22', 'TRT23', 'TRT24', 'TST'],
              example: 'TRT3',
            },
            grau: {
              type: 'string',
              enum: ['primeiro_grau', 'segundo_grau', 'tribunal_superior'],
              description: 'Grau do processo (primeiro_grau, segundo_grau ou tribunal_superior)',
              example: 'primeiro_grau',
            },
            dataInicio: {
              type: 'string',
              format: 'date',
              description: 'Data inicial do período de busca (formato: YYYY-MM-DD). Se não fornecido, usa hoje',
              example: '2024-01-01',
            },
            dataFim: {
              type: 'string',
              format: 'date',
              description: 'Data final do período de busca (formato: YYYY-MM-DD). Se não fornecido, usa hoje + 365 dias',
              example: '2024-12-31',
            },
          },
        },
        PendentesManifestacaoParams: {
          type: 'object',
          required: ['advogado_id', 'trt_codigo', 'grau'],
          properties: {
            advogado_id: {
              type: 'integer',
              description: 'ID do advogado na tabela advogados. O backend buscará automaticamente a credencial correspondente para este advogado, TRT e grau.',
              example: 1,
            },
            trt_codigo: {
              type: 'string',
              description: 'Código do tribunal trabalhista (TRT1 a TRT24 ou TST)',
              enum: ['TRT1', 'TRT2', 'TRT3', 'TRT4', 'TRT5', 'TRT6', 'TRT7', 'TRT8', 'TRT9', 'TRT10', 'TRT11', 'TRT12', 'TRT13', 'TRT14', 'TRT15', 'TRT16', 'TRT17', 'TRT18', 'TRT19', 'TRT20', 'TRT21', 'TRT22', 'TRT23', 'TRT24', 'TST'],
              example: 'TRT3',
            },
            grau: {
              type: 'string',
              enum: ['primeiro_grau', 'segundo_grau', 'tribunal_superior'],
              description: 'Grau do processo (primeiro_grau, segundo_grau ou tribunal_superior)',
              example: 'primeiro_grau',
            },
            filtroPrazo: {
              type: 'string',
              enum: ['no_prazo', 'sem_prazo'],
              description: 'Filtro de prazo para processos pendentes. Padrão: sem_prazo',
              example: 'sem_prazo',
            },
          },
        },
        AtribuirResponsavelRequest: {
          type: 'object',
          properties: {
            responsavelId: {
              type: 'integer',
              nullable: true,
              description: 'ID do usuário responsável. Use null para desatribuir responsável. Se omitido, mantém o responsável atual.',
              example: 15,
            },
          },
        },
        AtualizarTipoDescricaoRequest: {
          type: 'object',
          properties: {
            tipoExpedienteId: {
              type: 'integer',
              nullable: true,
              description: 'ID do tipo de expediente. Use null para remover tipo.',
              example: 1,
            },
            descricaoArquivos: {
              type: 'string',
              nullable: true,
              description: 'Descrição ou referência a arquivos relacionados',
              example: 'Documentos anexados: petição inicial, documentos pessoais',
            },
          },
        },
        AtribuirResponsavelResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              description: 'Dados atualizados da entidade',
              properties: {
                id: {
                  type: 'integer',
                },
                responsavel_id: {
                  type: 'integer',
                  nullable: true,
                },
              },
            },
          },
        },
        TipoExpediente: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID único do tipo de expediente',
              example: 1,
            },
            tipo_expediente: {
              type: 'string',
              description: 'Nome do tipo de expediente',
              example: 'Audiência',
            },
            created_by: {
              type: 'integer',
              description: 'ID do usuário que criou o tipo',
              example: 19,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Data e hora de criação',
              example: '2024-01-15T10:30:00Z',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Data e hora da última atualização',
              example: '2024-01-15T10:30:00Z',
            },
          },
          required: ['id', 'tipo_expediente', 'created_by', 'created_at', 'updated_at'],
        },
        CriarTipoExpedienteParams: {
          type: 'object',
          required: ['tipo_expediente'],
          properties: {
            tipo_expediente: {
              type: 'string',
              description: 'Nome do tipo de expediente (deve ser único)',
              example: 'Audiência',
            },
          },
        },
        AtualizarTipoExpedienteParams: {
          type: 'object',
          properties: {
            tipo_expediente: {
              type: 'string',
              description: 'Novo nome do tipo de expediente (deve ser único)',
              example: 'Audiência Judicial',
            },
          },
        },
        AcordoCondenacao: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            processoId: { type: 'integer' },
            tipo: { type: 'string', enum: ['acordo', 'condenacao', 'custas_processuais'] },
            direcao: { type: 'string', enum: ['recebimento', 'pagamento'] },
            valorTotal: { type: 'number' },
            dataVencimentoPrimeiraParcela: { type: 'string', format: 'date' },
            status: { type: 'string', enum: ['pendente', 'pago_parcial', 'pago_total', 'atrasado'] },
            numeroParcelas: { type: 'integer' },
            formaDistribuicao: { type: 'string', enum: ['integral', 'dividido'], nullable: true },
            percentualEscritorio: { type: 'number', nullable: true },
            percentualCliente: { type: 'number', nullable: true },
            honorariosSucumbenciaisTotal: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Parcela: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            acordoCondenacaoId: { type: 'integer' },
            numeroParcela: { type: 'integer' },
            valorBrutoCreditoPrincipal: { type: 'number' },
            honorariosSucumbenciais: { type: 'number' },
            honorariosContratuais: { type: 'number' },
            dataVencimento: { type: 'string', format: 'date' },
            status: { type: 'string', enum: ['pendente', 'recebida', 'paga', 'atrasado'] },
            formaPagamento: { type: 'string', enum: ['transferencia_direta', 'deposito_judicial', 'deposito_recursal'] },
            statusRepasse: { type: 'string', enum: ['nao_aplicavel', 'pendente_declaracao', 'pendente_transferencia', 'repassado'] },
            valorRepasseCliente: { type: 'number', nullable: true },
          },
        },
        RepassePendente: {
          type: 'object',
          properties: {
            parcelaId: { type: 'integer' },
            acordoCondenacaoId: { type: 'integer' },
            processoId: { type: 'integer' },
            numeroParcela: { type: 'integer' },
            valorRepasseCliente: { type: 'number' },
            statusRepasse: { type: 'string' },
            dataEfetivacao: { type: 'string', format: 'date-time' },
          },
        },
        // ======================================
        // SISTEMA DE DOCUMENTOS
        // ======================================
        Documento: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'ID único do documento' },
            titulo: { type: 'string', description: 'Título do documento' },
            conteudo: { type: 'object', description: 'Conteúdo JSON do Plate.js' },
            pasta_id: { type: 'integer', nullable: true, description: 'ID da pasta pai' },
            criado_por: { type: 'integer', description: 'ID do criador' },
            editado_por: { type: 'integer', nullable: true, description: 'ID do último editor' },
            versao: { type: 'integer', description: 'Número da versão' },
            descricao: { type: 'string', nullable: true, description: 'Descrição do documento' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Tags do documento' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            editado_em: { type: 'string', format: 'date-time', nullable: true },
            deleted_at: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        CriarDocumentoParams: {
          type: 'object',
          required: ['titulo'],
          properties: {
            titulo: { type: 'string', description: 'Título do documento (1-500 chars)' },
            conteudo: { type: 'object', description: 'Conteúdo JSON do editor' },
            pasta_id: { type: 'integer', nullable: true, description: 'ID da pasta' },
            descricao: { type: 'string', nullable: true, description: 'Descrição' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Tags' },
          },
        },
        AtualizarDocumentoParams: {
          type: 'object',
          properties: {
            titulo: { type: 'string' },
            conteudo: { type: 'object' },
            pasta_id: { type: 'integer', nullable: true },
            descricao: { type: 'string', nullable: true },
            tags: { type: 'array', items: { type: 'string' } },
          },
        },
        Pasta: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'ID único da pasta' },
            nome: { type: 'string', description: 'Nome da pasta' },
            pasta_pai_id: { type: 'integer', nullable: true, description: 'ID da pasta pai' },
            tipo: { type: 'string', enum: ['comum', 'privada'], description: 'Tipo da pasta' },
            criado_por: { type: 'integer', description: 'ID do criador' },
            descricao: { type: 'string', nullable: true },
            cor: { type: 'string', nullable: true, description: 'Cor em formato hex' },
            icone: { type: 'string', nullable: true, description: 'Nome do ícone Lucide' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            deleted_at: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        CriarPastaParams: {
          type: 'object',
          required: ['nome', 'tipo'],
          properties: {
            nome: { type: 'string', description: 'Nome da pasta (1-200 chars)' },
            pasta_pai_id: { type: 'integer', nullable: true },
            tipo: { type: 'string', enum: ['comum', 'privada'] },
            descricao: { type: 'string', nullable: true },
            cor: { type: 'string', nullable: true, description: 'Formato hex (#RRGGBB)' },
            icone: { type: 'string', nullable: true },
          },
        },
        DocumentoCompartilhado: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            documento_id: { type: 'integer' },
            usuario_id: { type: 'integer' },
            permissao: { type: 'string', enum: ['visualizar', 'editar'] },
            compartilhado_por: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        CompartilharDocumentoParams: {
          type: 'object',
          required: ['usuario_id', 'permissao'],
          properties: {
            usuario_id: { type: 'integer', description: 'ID do usuário destinatário' },
            permissao: { type: 'string', enum: ['visualizar', 'editar'] },
          },
        },
        Template: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            titulo: { type: 'string' },
            descricao: { type: 'string', nullable: true },
            conteudo: { type: 'object' },
            visibilidade: { type: 'string', enum: ['publico', 'privado'] },
            categoria: { type: 'string', nullable: true },
            thumbnail_url: { type: 'string', nullable: true },
            criado_por: { type: 'integer' },
            uso_count: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        CriarTemplateParams: {
          type: 'object',
          required: ['titulo', 'conteudo', 'visibilidade'],
          properties: {
            titulo: { type: 'string', description: 'Título do template (1-200 chars)' },
            descricao: { type: 'string', nullable: true },
            conteudo: { type: 'object', description: 'Conteúdo JSON do editor' },
            visibilidade: { type: 'string', enum: ['publico', 'privado'] },
            categoria: { type: 'string', nullable: true },
            thumbnail_url: { type: 'string', nullable: true },
          },
        },
        DocumentoUpload: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            documento_id: { type: 'integer' },
            nome_arquivo: { type: 'string' },
            tipo_mime: { type: 'string' },
            tamanho_bytes: { type: 'integer' },
            b2_key: { type: 'string' },
            b2_url: { type: 'string' },
            tipo_media: { type: 'string', enum: ['imagem', 'video', 'audio', 'pdf', 'outros'] },
            criado_por: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        DocumentoVersao: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            documento_id: { type: 'integer' },
            versao: { type: 'integer' },
            conteudo: { type: 'object' },
            titulo: { type: 'string' },
            criado_por: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        MensagemChat: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            sala_id: { type: 'integer' },
            usuario_id: { type: 'integer' },
            conteudo: { type: 'string' },
            tipo: { type: 'string', enum: ['texto', 'arquivo', 'sistema'] },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            deleted_at: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        SalaChat: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nome: { type: 'string' },
            tipo: { type: 'string', enum: ['geral', 'documento', 'privado'] },
            documento_id: { type: 'integer', nullable: true },
            criado_por: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        // ======================================
        // DASHBOARD
        // ======================================
        MetricasEscritorio: {
          type: 'object',
          description: 'Métricas consolidadas do escritório',
          properties: {
            totalProcessos: { type: 'integer', description: 'Total de processos no sistema' },
            processosAtivos: { type: 'integer', description: 'Processos com status ativo' },
            processosAtivosUnicos: { type: 'integer', description: 'Contagem por número de processo único' },
            totalAudiencias: { type: 'integer', description: 'Total de audiências' },
            audienciasMes: { type: 'integer', description: 'Audiências do mês atual' },
            totalExpedientes: { type: 'integer', description: 'Total de expedientes' },
            expedientesPendentes: { type: 'integer', description: 'Expedientes aguardando resolução' },
            expedientesVencidos: { type: 'integer', description: 'Expedientes com prazo vencido' },
            totalUsuarios: { type: 'integer', description: 'Usuários ativos no sistema' },
            taxaResolucao: { type: 'integer', description: 'Percentual de expedientes resolvidos no prazo' },
            comparativoMesAnterior: {
              type: 'object',
              properties: {
                processos: { type: 'integer', description: 'Variação percentual de processos' },
                audiencias: { type: 'integer', description: 'Variação percentual de audiências' },
                expedientes: { type: 'integer', description: 'Variação percentual de expedientes' },
              },
            },
            evolucaoMensal: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  mes: { type: 'string', description: 'Mês no formato YYYY-MM' },
                  processos: { type: 'integer' },
                  audiencias: { type: 'integer' },
                  expedientes: { type: 'integer' },
                },
              },
            },
          },
        },
        CargaUsuario: {
          type: 'object',
          description: 'Carga de trabalho por usuário',
          properties: {
            usuario_id: { type: 'integer' },
            usuario_nome: { type: 'string' },
            processosAtivos: { type: 'integer', description: 'Processos atribuídos ao usuário' },
            expedientesPendentes: { type: 'integer', description: 'Expedientes pendentes do usuário' },
            audienciasProximas: { type: 'integer', description: 'Audiências nos próximos 7 dias' },
            cargaTotal: { type: 'integer', description: 'Score ponderado de carga de trabalho' },
          },
        },
        PerformanceAdvogado: {
          type: 'object',
          description: 'Métricas de performance por advogado',
          properties: {
            usuario_id: { type: 'integer' },
            usuario_nome: { type: 'string' },
            baixasSemana: { type: 'integer', description: 'Expedientes baixados na semana' },
            baixasMes: { type: 'integer', description: 'Expedientes baixados no mês' },
            taxaCumprimentoPrazo: { type: 'integer', description: 'Percentual de baixas dentro do prazo' },
            expedientesVencidos: { type: 'integer', description: 'Expedientes atualmente vencidos' },
          },
        },
        StatusCaptura: {
          type: 'object',
          description: 'Status da última captura por tribunal',
          properties: {
            trt: { type: 'string', description: 'Código do TRT (ex: TRT3)' },
            grau: { type: 'string', enum: ['primeiro_grau', 'segundo_grau', 'tribunal_superior'] },
            ultimaExecucao: { type: 'string', format: 'date-time', nullable: true },
            status: { type: 'string', enum: ['sucesso', 'erro', 'pendente', 'executando'] },
            mensagemErro: { type: 'string', nullable: true },
            processosCapturados: { type: 'integer' },
            audienciasCapturadas: { type: 'integer' },
            expedientesCapturados: { type: 'integer' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
      {
        sessionAuth: [],
      },
      {
        serviceApiKey: [],
      },
    ],
  },
  apis: [
    './app/api/**/*.ts', // Caminho para os arquivos de rotas da API
  ],
};

export const swaggerSpec = swaggerJsdoc(options);

