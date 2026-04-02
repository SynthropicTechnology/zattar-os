# Regras de Negócio - Partes

## Contexto
Módulo unificado para gestão de partes processuais: Clientes (polo ativo geralmente), Partes Contrárias (polo passivo) e Terceiros (peritos, testemunhas, etc.). Todas as entidades suportam Pessoa Física (PF) e Pessoa Jurídica (PJ) através de discriminated unions.

## Entidades Principais
- **Cliente**: Parte representada pelo escritório (PF ou PJ)
- **ParteContraria**: Parte adversária no processo (PF ou PJ)
- **Terceiro**: Participantes auxiliares (peritos, testemunhas, etc.)

## Regras de Validação

### CPF (Pessoa Física)
- DEVE ter exatamente 11 dígitos numéricos
- Validação de dígitos verificadores obrigatória
- CPFs com todos dígitos iguais são rejeitados (ex: 11111111111)
- Normalização automática: remove pontos e traços

### CNPJ (Pessoa Jurídica)
- DEVE ter exatamente 14 dígitos numéricos
- Validação de dígitos verificadores obrigatória
- CNPJs com todos dígitos iguais são rejeitados
- Normalização automática: remove pontos, barras e traços

### Campos Obrigatórios
- `nome`: Nome completo (PF) ou Razão Social (PJ)
- `tipo_pessoa`: `pf` ou `pj` (determina discriminated union)
- `cpf` (PF) ou `cnpj` (PJ): Documento principal

### E-mails
- Array de strings, cada uma validada como e-mail válido
- Campo nullable/opcional
- Formato: `[email1@domain.com, email2@domain.com]`

### Terceiros - Campos Específicos
- `tipo_parte`: PERITO, MINISTERIO_PUBLICO, ASSISTENTE, TESTEMUNHA, CUSTOS_LEGIS, AMICUS_CURIAE, OUTRO
- `polo`: ATIVO, PASSIVO, NEUTRO, TERCEIRO

## Regras de Negócio

### Unicidade de Documentos
1. CPF deve ser único entre Clientes
2. CNPJ deve ser único entre Clientes
3. Partes Contrárias podem ter documentos duplicados (mesma empresa em múltiplos processos)

### Criação de Cliente
1. Validar CPF/CNPJ com dígitos verificadores
2. Verificar unicidade do documento
3. `ativo` padrão: `true`
4. `tipo_pessoa` determina campos obrigatórios (discriminated union)

### Vinculação a Processo
1. Cliente vinculado via tabela `processo_partes`
2. Um cliente pode estar em múltiplos processos
3. Tipo de polo é definido na vinculação

### Terceiros
1. Sempre vinculados a um processo específico
2. Tipo de parte define papel (perito, testemunha, etc.)
3. Polo define lado (ativo, passivo, neutro)
4. Campo `ordem` define sequência em listagens

## Campos PF (Pessoa Física)
- `rg`: Registro Geral
- `data_nascimento`: Data de nascimento
- `genero`, `sexo`, `estado_civil`
- `nacionalidade`, `naturalidade_municipio`
- `nome_genitora`: Nome da mãe
- `situacao_cpf_receita_*`: Situação na Receita Federal

## Campos PJ (Pessoa Jurídica)
- `inscricao_estadual`
- `data_abertura`, `data_fim_atividade`
- `orgao_publico`: Se é órgão público
- `ramo_atividade`
- `cpf_responsavel`: CPF do responsável legal
- `porte_*`: Porte da empresa
- `situacao_cnpj_receita_*`: Situação na Receita Federal

## Fluxos Especiais

### Busca de Clientes
1. Busca por nome (ILIKE)
2. Busca por CPF/CNPJ (normalizado)
3. Busca por número de processo (via JOIN)
4. Filtros: tipo_pessoa, trt, grau

### Inativação de Cliente
1. Verificar se não há processos ativos vinculados
2. Atualizar `ativo` para `false`
3. Manter registro para histórico

### Sincronização com PJE
1. Dados vêm do PJE com campos `*_pje`
2. `situacao_pje`: Situação no sistema PJE
3. `status_pje`: Status no sistema PJE
4. `login_pje`: Login do PJE (se cadastrado)

## Filtros Disponíveis
- **Identificação**: tipo_pessoa, nome, cpf, cnpj
- **Localização**: trt, grau
- **Busca**: busca (nome ou documento)
- **Processo**: numero_processo (via JOIN)
- **Ordenação**: nome, cpf, cnpj, tipo_pessoa, created_at, updated_at

## Restrições de Acesso
- Clientes são visíveis apenas para advogados autorizados
- Dados sensíveis (documentos) podem requerer permissão especial
- Terceiros são visíveis conforme processo vinculado

## Integrações
- **PJE**: Captura de dados de partes
- **Receita Federal**: Validação de situação CPF/CNPJ
- **Endereços**: Vinculação via `endereco_id`
- **Sistema de IA**: Indexação para busca semântica

## Revalidação de Cache
Após mutações, revalidar:
- `/clientes` - Lista de clientes
- `/clientes/[id]` - Detalhe do cliente
- `/partes-contrarias` - Lista de partes contrárias
- `/terceiros` - Lista de terceiros
- `/processos/[id]` - Se vinculado a processo

## Arquitetura e Organização
- **FSD (Feature-Sliced Design)**: Estrutura baseada em features.
- **Repositories**: 
  - `clientes-repository.ts`
  - `partes-contrarias-repository.ts`
  - `terceiros-repository.ts`
  - `representantes-repository.ts`
  - `processo-partes-repository.ts`
  - `cadastros-pje-repository.ts`
- **Service**: Único arquivo `service.ts` centralizando casos de uso.
- **Utils**: Validações centralizadas em `utils/validation.ts`.
- **Tabs**: Padrão visual `tabs-02` (outlined).