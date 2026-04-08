# Capability: Gestão de Usuários

## Purpose
API REST para gerenciamento de usuários do sistema Synthropic. Fornece operações CRUD completas, sincronização com Supabase Auth, busca por CPF/email, listagem com filtros e controle de status ativo/inativo. Usuários podem ser atribuídos como responsáveis em processos, audiências e pendências.

## Requirements

### Requirement: Criação de Usuário Completo
O sistema MUST permitir criar usuário com dados pessoais e cadastro no Supabase Auth simultaneamente.

#### Scenario: POST /api/usuarios com dados válidos
- **WHEN** uma requisição POST é enviada com nome, email, cpf, senha
- **THEN** o sistema deve criar usuário no Supabase Auth
- **AND** criar registro na tabela usuarios com UUID retornado
- **AND** retornar dados do usuário criado com status 201

#### Scenario: Email já cadastrado
- **WHEN** tentativa de criar usuário com email existente
- **THEN** o sistema deve retornar erro 400 Bad Request
- **AND** incluir mensagem "Email já está cadastrado"

#### Scenario: CPF já cadastrado
- **WHEN** tentativa de criar usuário com CPF existente
- **THEN** o sistema deve retornar erro 400 Bad Request
- **AND** incluir mensagem "CPF já está cadastrado"

#### Scenario: Dados obrigatórios ausentes
- **WHEN** campos obrigatórios (nome, email, cpf) não são fornecidos
- **THEN** o sistema deve retornar erro 400 Bad Request
- **AND** listar campos faltantes

#### Scenario: Senha fraca
- **WHEN** senha não atende requisitos mínimos
- **THEN** o sistema deve retornar erro 400 Bad Request
- **AND** descrever requisitos de senha (mínimo 6 caracteres)

### Requirement: Listagem de Usuários
O sistema MUST fornecer endpoint para listar usuários com suporte a paginação, ordenação e filtros.

#### Scenario: GET /api/usuarios com paginação
- **WHEN** uma requisição GET é enviada com parâmetros page e limit
- **THEN** o sistema deve retornar página de usuários solicitada
- **AND** incluir total de registros e total de páginas
- **AND** limitar resultados ao valor de limit

#### Scenario: Ordenação por nome
- **WHEN** parâmetros orderBy=nome e orderDirection são fornecidos
- **THEN** o sistema deve ordenar usuários alfabeticamente
- **AND** aplicar direção ascendente ou descendente

#### Scenario: Listagem padrão
- **WHEN** nenhum parâmetro é fornecido
- **THEN** o sistema deve retornar primeira página com 10 registros
- **AND** ordenar por nome ascendente

### Requirement: Filtros de Status
O sistema MUST permitir filtragem por status ativo/inativo.

#### Scenario: Filtro por usuários ativos
- **WHEN** parâmetro ativo=true é fornecido
- **THEN** o sistema deve retornar apenas usuários com ativo=true

#### Scenario: Filtro por usuários inativos
- **WHEN** parâmetro ativo=false é fornecido
- **THEN** o sistema deve retornar apenas usuários desativados

#### Scenario: Todos os usuários
- **WHEN** parâmetro ativo não é fornecido
- **THEN** o sistema deve retornar todos os usuários independente do status

### Requirement: Busca Textual
O sistema MUST permitir busca textual em nome e email.

#### Scenario: Busca por nome
- **WHEN** parâmetro search contém parte do nome
- **THEN** o sistema deve retornar usuários cujo nome contém o termo
- **AND** busca deve ser case-insensitive

#### Scenario: Busca por email
- **WHEN** parâmetro search contém parte do email
- **THEN** o sistema deve retornar usuários cujo email contém o termo

#### Scenario: Busca em múltiplos campos
- **WHEN** parâmetro search é fornecido
- **THEN** o sistema deve buscar em nome E email
- **AND** aplicar lógica OR entre os campos

### Requirement: Busca por CPF
O sistema MUST permitir buscar usuário específico por CPF.

#### Scenario: GET /api/usuarios/buscar/por-cpf/[cpf] com CPF válido
- **WHEN** uma requisição GET é enviada com CPF existente
- **THEN** o sistema deve retornar dados completos do usuário
- **AND** incluir todos os campos exceto senha

#### Scenario: CPF não encontrado
- **WHEN** CPF fornecido não existe no banco
- **THEN** o sistema deve retornar erro 404 Not Found
- **AND** incluir mensagem "Usuário não encontrado"

#### Scenario: CPF em formato inválido
- **WHEN** CPF fornecido não é válido
- **THEN** o sistema deve retornar erro 400 Bad Request
- **AND** incluir mensagem "CPF inválido"

### Requirement: Busca por Email
O sistema MUST permitir buscar usuário específico por email.

#### Scenario: GET /api/usuarios/buscar/por-email/[email] com email válido
- **WHEN** uma requisição GET é enviada com email existente
- **THEN** o sistema deve retornar dados completos do usuário

#### Scenario: Email não encontrado
- **WHEN** email fornecido não existe
- **THEN** o sistema deve retornar erro 404 Not Found

#### Scenario: Email em formato inválido
- **WHEN** email fornecido não é válido
- **THEN** o sistema deve retornar erro 400 Bad Request

### Requirement: Visualização de Usuário Individual
O sistema MUST fornecer endpoint para buscar detalhes de usuário específico por ID.

#### Scenario: GET /api/usuarios/[id] com ID válido
- **WHEN** uma requisição GET é enviada com UUID de usuário existente
- **THEN** o sistema deve retornar todos os dados do usuário
- **AND** incluir: id, nome, email, cpf, telefone, ativo, created_at, updated_at
- **AND** excluir dados sensíveis como senha

#### Scenario: Usuário não encontrado
- **WHEN** ID fornecido não existe
- **THEN** o sistema deve retornar erro 404 Not Found

### Requirement: Atualização de Usuário
O sistema MUST permitir atualizar dados de usuário existente.

#### Scenario: PUT /api/usuarios/[id] com dados válidos
- **WHEN** uma requisição PUT é enviada com dados a atualizar
- **THEN** o sistema deve atualizar campos fornecidos
- **AND** manter campos não fornecidos inalterados
- **AND** atualizar campo updated_at automaticamente
- **AND** retornar usuário atualizado

#### Scenario: Atualização de email para email existente
- **WHEN** tentativa de alterar email para um já cadastrado
- **THEN** o sistema deve retornar erro 400 Bad Request
- **AND** não permitir a alteração

#### Scenario: Atualização de CPF
- **WHEN** tentativa de alterar CPF
- **THEN** o sistema deve validar se novo CPF já está em uso
- **AND** retornar erro se CPF já cadastrado

#### Scenario: Desativação de usuário
- **WHEN** campo ativo é alterado para false
- **THEN** o sistema deve desativar o usuário
- **AND** manter todos os dados históricos
- **AND** não permitir atribuições futuras como responsável

#### Scenario: Reativação de usuário
- **WHEN** campo ativo é alterado para true em usuário inativo
- **THEN** o sistema deve reativar o usuário
- **AND** permitir novas atribuições

### Requirement: Sincronização com Supabase Auth
O sistema MUST manter sincronização entre tabela usuarios e Supabase Auth.

#### Scenario: POST /api/usuarios/sincronizar
- **WHEN** endpoint de sincronização é chamado
- **THEN** o sistema deve buscar usuários do Supabase Auth
- **AND** criar registros na tabela usuarios para usuários sem registro
- **AND** atualizar emails se houver divergência
- **AND** retornar quantidade de usuários sincronizados

#### Scenario: Novo usuário criado no Auth externo
- **WHEN** usuário é criado diretamente no Supabase Auth
- **THEN** sincronização deve criar registro correspondente
- **AND** preencher dados básicos disponíveis

#### Scenario: Sincronização incremental
- **WHEN** sincronização é executada
- **THEN** deve processar apenas usuários novos ou alterados
- **AND** não reprocessar usuários já sincronizados

### Requirement: Validação de Dados
O sistema MUST validar todos os dados de entrada antes de persistir.

#### Scenario: Validação de CPF
- **WHEN** CPF é fornecido
- **THEN** sistema deve validar formato e dígitos verificadores
- **AND** aceitar formato com ou sem pontuação

#### Scenario: Validação de email
- **WHEN** email é fornecido
- **THEN** sistema deve validar formato RFC 5322
- **AND** rejeitar emails inválidos

#### Scenario: Validação de telefone
- **WHEN** telefone é fornecido
- **THEN** sistema deve aceitar formatos brasileiros válidos
- **AND** permitir opcional (não obrigatório)

#### Scenario: Normalização de CPF
- **WHEN** CPF é fornecido com pontuação
- **THEN** sistema deve remover formatação antes de salvar
- **AND** armazenar apenas dígitos

### Requirement: Autenticação Obrigatória
Todos os endpoints MUST exigir autenticação válida via Supabase Auth.

#### Scenario: Requisição sem autenticação
- **WHEN** uma requisição é feita sem token
- **THEN** o sistema deve retornar erro 401 Unauthorized

#### Scenario: Permissões de acesso
- **WHEN** usuário autenticado acessa endpoints
- **THEN** sistema deve aplicar RLS conforme políticas Supabase
- **AND** permitir acesso apenas a dados autorizados

### Requirement: Resposta Padronizada
Todos os endpoints MUST retornar respostas no formato JSON padronizado.

#### Scenario: Operação bem-sucedida
- **WHEN** operação é concluída com sucesso
- **THEN** resposta deve conter: { success: true, data: {...} }
- **AND** código HTTP apropriado (200, 201)

#### Scenario: Erro de validação
- **WHEN** dados inválidos são fornecidos
- **THEN** resposta deve conter: { success: false, error: "mensagem descritiva" }
- **AND** código HTTP 400 Bad Request

#### Scenario: Lista paginada
- **WHEN** endpoint retorna lista
- **THEN** resposta deve incluir: data, total, totalPages, currentPage

### Requirement: Proteção de Dados Sensíveis
O sistema NUNCA MUST retornar senhas ou tokens em respostas da API.

#### Scenario: Exclusão de campos sensíveis
- **WHEN** usuário é retornado em qualquer endpoint
- **THEN** campos sensíveis devem ser removidos da resposta
- **AND** excluir: senha, tokens, credenciais PJE

#### Scenario: Logs de auditoria
- **WHEN** operações são logadas
- **THEN** não incluir dados sensíveis nos logs
- **AND** mascarar CPF parcialmente (XXX.XXX.123-45)

### Requirement: Documentação OpenAPI
A API MUST ser documentada usando padrão OpenAPI/Swagger com anotações JSDoc.

#### Scenario: Documentação completa
- **WHEN** endpoints são acessados via /api/docs
- **THEN** documentação deve descrever todos os parâmetros
- **AND** incluir exemplos de requisições e respostas
- **AND** descrever validações e erros possíveis
