# Regras de Negócio - Processos

## Contexto
Módulo central do Sinesys responsável pela gestão de processos judiciais trabalhistas. Gerencia o acervo de processos do escritório, integrando-se com o PJE (Processo Judicial Eletrônico) para captura automática de movimentações.

## Entidades Principais
- **Processo**: Representa um processo judicial com 27 campos mapeados da tabela `acervo`
- **ProcessoUnificado**: Visão agregada de processos com múltiplas instâncias (1º, 2º grau, Superior)
- **Movimentação**: Timeline de movimentações capturadas do PJE

## Regras de Validação

### Número do Processo (CNJ)
- DEVE seguir o padrão CNJ: `NNNNNNN-DD.AAAA.J.TT.OOOO`
- Regex: `/^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/`
- Exemplo válido: `0001234-12.2024.5.15.0001`

### Campos Obrigatórios
- `idPje`: ID do processo no PJE (inteiro positivo)
- `advogadoId`: ID do advogado responsável
- `origem`: Deve ser `acervo_geral` ou `arquivado`
- `trt`: Código do tribunal (TRT1-24 ou TST)
- `grau`: `primeiro_grau`, `segundo_grau` ou `tribunal_superior`
- `numeroProcesso`: Formato CNJ válido
- `descricaoOrgaoJulgador`: Nome do órgão julgador
- `classeJudicial`: Classe processual
- `codigoStatusProcesso`: Status atual
- `nomeParteAutora` e `nomeParteRe`: Nomes das partes

### Status do Processo
- `ATIVO`: Processo em andamento
- `SUSPENSO`: Temporariamente suspenso
- `ARQUIVADO`: Processo arquivado
- `EXTINTO`: Processo extinto
- `BAIXADO`: Processo baixado
- `PENDENTE`: Aguardando ação
- `EM_RECURSO`: Em fase recursal
- `OUTRO`: Status não mapeado

## Regras de Negócio

### Criação de Processo
1. Verificar se número CNJ já existe no sistema
2. Validar existência do advogado responsável
3. Status inicial é mapeado do código PJE via `mapCodigoStatusToEnum()`
4. Campos booleanos padrão: `segredoJustica=false`, `juizoDigital=false`, `temAssociacao=false`
5. Quantidade de partes padrão: `qtdeParteAutora=1`, `qtdeParteRe=1`

### Arquivamento de Processo
1. Verificar se não há audiências futuras marcadas
2. Verificar se não há expedientes pendentes
3. Atualizar `origem` para `arquivado`
4. Registrar `dataArquivamento`
5. Notificar responsável e advogado

### Mudança de Grau
1. Processo pode ter instâncias em múltiplos graus simultaneamente
2. Ao subir de grau, manter instância anterior como referência
3. `ProcessoUnificado` agrega todas as instâncias

### Timeline/Movimentações
1. Movimentações são capturadas automaticamente do PJE
2. Cada movimentação é vinculada a um processo
3. Dados completos do PJE são armazenados em `dadosPjeCompleto`

## Fluxos Especiais

### Captura de Processos do PJE
1. Autenticar via credenciais do advogado
2. Consultar API do tribunal correspondente
3. Extrair dados e mapear para estrutura Sinesys
4. Verificar se processo já existe (update vs insert)
5. Indexar para busca semântica após persistência

### Visualização Unificada
1. Agrupar processos pelo número CNJ base
2. Identificar grau atual (mais recente)
3. Calcular status geral considerando todas instâncias
4. Retornar `ProcessoUnificado` com array de instâncias

## Filtros Disponíveis (19)
- **Identificação**: origem, trt, grau, numeroProcesso, classeJudicial
- **Status**: codigoStatusProcesso
- **Partes**: nomeParteAutora, nomeParteRe, descricaoOrgaoJulgador
- **Booleanos**: segredoJustica, juizoDigital, temAssociacao, temProximaAudiencia, semResponsavel
- **Datas**: dataAutuacao (início/fim), dataArquivamento (início/fim), dataProximaAudiencia (início/fim)
- **Relacionamentos**: advogadoId, responsavelId, clienteId

## Restrições de Acesso
- Apenas advogados e administradores podem criar processos
- Processos em segredo de justiça requerem permissão especial
- Responsável pode editar apenas processos sob sua responsabilidade

## Integrações
- **PJE**: Captura automática via APIs dos tribunais
- **Supabase**: Persistência e busca
- **Sistema de IA**: Indexação para busca semântica
- **Notificações**: Alertas de prazos e audiências

## Revalidação de Cache
Após mutações, revalidar:
- `/processos` - Lista de processos
- `/processos/[id]` - Detalhe do processo
- `/acervo` - Visão do acervo
- `/dashboard` - Métricas do dashboard
