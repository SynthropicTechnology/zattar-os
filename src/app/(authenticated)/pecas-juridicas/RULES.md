# Regras de Negocio - Pecas Juridicas

## Contexto
Modulo de gestao de modelos de pecas juridicas e geracao automatizada de documentos a partir de contratos. Utiliza sistema de placeholders para substituicao dinamica de dados (partes, advogado, contrato) no conteudo dos modelos (formato Plate.js).

## Entidades Principais
- **PecaModelo**: Modelo reutilizavel de peca juridica com conteudo Plate.js e placeholders
- **ContratoDocumento**: Vinculacao entre um documento/arquivo gerado e um contrato
- **PlaceholderContext**: Contexto de dados para resolucao de placeholders (autores, reus, contrato, advogado)

## Enums e Tipos

### TipoPecaJuridica
- `peticao_inicial`: Peticao Inicial
- `contestacao`: Contestacao
- `recurso_ordinario`: Recurso Ordinario
- `agravo`: Agravo
- `embargos_declaracao`: Embargos de Declaracao
- `manifestacao`: Manifestacao
- `parecer`: Parecer
- `contrato_honorarios`: Contrato de Honorarios
- `procuracao`: Procuracao
- `outro`: Outro

### VisibilidadeModelo
- `publico`: visivel para todos
- `privado`: visivel apenas para o criador

## Regras de Validacao

### PecaModelo
- `titulo`: obrigatorio, min 1 char, max 255
- `descricao`: max 1000 chars, nullable
- `tipoPeca`: default 'outro'
- `conteudo`: array (Plate.js Value), default []
- `placeholdersDefinidos`: array de strings, default []
- `visibilidade`: default 'privado'
- `segmentoId`: nullable

### ContratoDocumento
- `contratoId`: numero positivo obrigatorio
- Requer `documentoId` OU `arquivoId` (pelo menos um)
- `geradoDeModeloId`: nullable
- `tipoPeca`: nullable
- `observacoes`: max 1000 chars

### Geracao de Peca
- `contratoId`: numero positivo obrigatorio
- `modeloId`: numero positivo obrigatorio
- `titulo`: min 1 char, max 255

## Regras de Negocio

### Criacao de Modelo
1. Validar dados via Zod schema
2. Extrair placeholders automaticamente do conteudo (JSON stringificado)
3. Armazenar placeholders extraidos em `placeholdersDefinidos`
4. Registrar usuario criador em `criadoPor`

### Atualizacao de Modelo
1. Se conteudo atualizado, re-extrair placeholders
2. Apenas campos fornecidos sao atualizados

### Exclusao de Modelo
- Soft delete: marca `ativo = false` (nunca deleta fisicamente)

### Geracao de Peca a partir de Contrato
1. Buscar modelo pelo ID
2. Resolver placeholders com dados do contexto (autores, reus, contrato, advogado)
3. Criar novo documento com conteudo processado (via modulo `documentos`)
4. Vincular documento ao contrato em `contrato_documentos`
5. Retornar contagem de placeholders resolvidos vs nao resolvidos

### Preview de Geracao
1. Buscar modelo
2. Gerar preview dos placeholders sem criar documento
3. Retornar lista de resolucoes com status (resolvido/nao resolvido)

### Vinculacao de Documento ao Contrato
- Pode vincular documento (editor) ou arquivo (upload)
- Validacao via Zod antes de persistir

### Desvinculacao
- Pode desvincular por IDs (contratoId + documentoId) ou por ID do vinculo

## Filtros Disponiveis

### Modelos de Pecas
- **tipoPeca**: filtro por tipo
- **visibilidade**: publico/privado
- **segmentoId**: filtro por segmento
- **criadoPor**: filtro por criador
- **apenasAtivos**: default true
- **search**: busca por titulo e descricao
- **Paginacao**: default page 1, pageSize 20
- **Ordenacao**: titulo, created_at (default), uso_count; direcao asc/desc

### Documentos do Contrato
- **contratoId**: obrigatorio
- **tipoPeca**: filtro por tipo
- **Paginacao**: default page 1, pageSize 20

## Integracoes
- **Documentos**: importa `criarDocumento` de `@/app/(authenticated)/documentos/service` para geracao
- **Contratos**: vincula pecas geradas a contratos via `contrato_documentos`
- **Placeholders**: sistema proprio de resolucao em `./placeholders`

## Revalidacao de Cache
Apos mutacoes, revalidar:
- `/app/pecas-juridicas`
- `/app/pecas-juridicas/{id}`
- `/app/contratos/{contratoId}`
- `/app/documentos`
