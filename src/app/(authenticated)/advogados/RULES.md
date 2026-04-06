# Regras de Negocio - Advogados

## Contexto
Modulo de cadastro e gestao de advogados e suas credenciais de acesso ao PJE (Processo Judicial Eletronico). Cada advogado pode ter multiplas inscricoes na OAB e multiplas credenciais para diferentes tribunais e graus.

## Entidades Principais
- **Advogado**: Profissional com nome, CPF e array de OABs (JSONB)
- **Credencial**: Credencial de acesso ao PJE vinculada a um advogado, tribunal e grau
- **CredencialComAdvogado**: Credencial com dados do advogado (via JOIN)

## Enums e Tipos

### GrauCredencial
- `1`: 1o Grau (banco: `primeiro_grau`)
- `2`: 2o Grau (banco: `segundo_grau`)

### ModoDuplicata (criacao em lote)
- `pular`: ignora credenciais ja existentes
- `sobrescrever`: atualiza senha e reativa credenciais existentes

### StatusCredencialLote
- `criada`: nova credencial criada
- `atualizada`: credencial existente atualizada (modo sobrescrever)
- `pulada`: credencial ja existe (modo pular)
- `erro`: falha na operacao

### UFs e Tribunais
- **UFS_BRASIL**: 27 UFs validas
- **TRIBUNAIS_ATIVOS**: TRT1 a TRT24

## Regras de Validacao

### Advogado
- `nome_completo`: minimo 3 caracteres
- `cpf`: 11 digitos (normalizado, sem pontuacao)
- `oabs`: array com pelo menos 1 entrada; cada OAB requer `numero` (min 1 char) e `uf` (2 chars, UF valida)

### Credencial
- `advogado_id`: obrigatorio
- `tribunal`: obrigatorio (string)
- `grau`: enum ['1', '2']
- `senha`: obrigatoria (min 1 char)
- `usuario`: opcional (login PJE, null = usar CPF do advogado)
- `active`: default true

### Credenciais em Lote
- `advogado_id`: numero positivo
- `tribunais`: array com pelo menos 1 tribunal
- `graus`: array com pelo menos 1 grau
- `senha`: obrigatoria
- `modo_duplicata`: default 'pular'

## Regras de Negocio

### Criacao de Advogado
1. CPF normalizado (remover pontuacao)
2. Nome trimado
3. OABs normalizadas (numero trimado, UF uppercase)
4. CPF unico (constraint `23505` retorna "Ja existe um advogado cadastrado com este CPF")

### Atualizacao de Advogado
1. Apenas campos fornecidos sao atualizados
2. Se OABs fornecidas, deve ter pelo menos 1
3. CPF normalizado se fornecido
4. Validacao de unicidade de CPF

### Criacao de Credencial
1. Verificar existencia do advogado
2. Verificar unicidade: nao pode existir credencial ativa para mesmo advogado + tribunal + grau
3. Grau convertido de UI ('1'/'2') para banco ('primeiro_grau'/'segundo_grau')
4. Senha armazenada no banco, removida no retorno

### Atualizacao de Credencial
1. Se tribunal ou grau alterados, verificar unicidade (excluindo a propria credencial)
2. Conversao de grau UI <-> banco

### Credenciais em Lote
1. Validar existencia do advogado
2. Gerar todas combinacoes tribunal x grau
3. Buscar credenciais existentes
4. Separar em: criar, atualizar (modo sobrescrever) ou pular
5. Criar novas em batch (insert em lote)
6. Atualizar existentes (senha + reativar)
7. Retornar resumo detalhado

### Atualizacao de Status em Lote
- Maximo 500 credenciais por operacao

## Filtros Disponiveis

### Advogados
- **Busca textual**: nome_completo, cpf
- **OAB**: numero + uf (containment JSONB) ou apenas uf
- **com_credenciais**: filtra advogados com credenciais ativas
- **Paginacao**: default 50, max 100
- **Ordenacao**: nome_completo ASC

### Credenciais
- **advogado_id**: filtra por advogado especifico
- **active**: filtra por status ativo/inativo
- **Ordenacao**: tribunal ASC, grau ASC

## Restricoes de Acesso
- **Visualizar advogados**: permissao `advogados:visualizar`
- **Editar advogados**: permissao `advogados:editar`
- **Visualizar credenciais**: permissao `credenciais:visualizar`
- **Editar credenciais**: permissao `credenciais:editar`

## Revalidacao de Cache
Apos mutacoes, revalidar:
- `/app/captura/advogados`
- `/app/captura/credenciais`
