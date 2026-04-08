# Regras de Negócio - Pangea (BNP)

## Contexto
Módulo de busca no **Banco Nacional de Precedentes (BNP)** do CNJ — também conhecido como **Pangea**. Permite ao escritório consultar súmulas, súmulas vinculantes, repercussão geral, IAC, IRDR e outros precedentes judiciais brasileiros através da API pública do CNJ (http://pangeabnp.pdpj.jus.br/).

> **Nota de localização**: Este módulo segue o padrão de FSD aninhado em `feature/`. Os arquivos `domain.ts`, `service.ts`, `repository.ts` e `actions/` estão neste subdiretório, enquanto `page.tsx` na raiz do módulo apenas renderiza o `PangeaPageContent`.

## Entidades Principais
- **PangeaBuscaInput**: Parâmetros de busca no BNP (texto, datas, órgãos, tipos)
- **PangeaBuscaResponse**: Resposta paginada com resultados, agregações e metadados
- **PangeaResultado**: Item individual de precedente
- **PangeaAgg**: Agregações (facetas) retornadas pela API
- **PangeaOrgaoDisponivel**: Órgão julgador disponível para filtragem

## Enums e Tipos

### PangeaTipo (Tipos de Precedente)
- `SUM`: Súmula
- `SV`: Súmula Vinculante
- `RG`: Repercussão Geral
- `IAC`: Incidente de Assunção de Competência
- `SIRDR`: Sistema de Resolução de Demandas Repetitivas
- `RR`: Recurso Repetitivo
- `CT`: Controvérsia
- `IRDR`: Incidente de Resolução de Demandas Repetitivas
- `IRR`: Incidente de Resolução de Recursos Repetitivos
- `PUIL`: Pedido de Uniformização de Interpretação de Lei
- `NT`: Nota Técnica
- `OJ`: Orientação Jurisprudencial

### PangeaOrdenacao
- `Text`: Por relevância textual
- `ChronologicalAsc`: Cronológica crescente
- `ChronologicalDesc`: Cronológica decrescente
- `NumericAsc`: Numérica crescente
- `NumericDesc`: Numérica decrescente

## Regras de Validação

### Busca (`pangeaBuscaInputSchema`)
- `buscaGeral`: Texto livre (opcional)
- `todasPalavras`: AND query (opcional)
- `quaisquerPalavras`: OR query (opcional)
- `semPalavras`: NOT query (opcional)
- `trechoExato`: Phrase query (opcional)
- `atualizacaoDesde` / `atualizacaoAte`: Aceita `yyyy-mm-dd` ou `dd/mm/yyyy`
- `cancelados`: Booleano para incluir precedentes cancelados (default: false)
- `pagina`: Inteiro ≥ 1 (default: 1)
- `tamanhoPagina`: Inteiro 1–10000 (default: 10000)

### Limite de Página
- `PANGEA_MAX_TAMANHO_PAGINA = 10_000`
- Valor de 20.000 retorna **HTTP 500** no upstream do CNJ (testado em produção)
- Valor de 10.000 é o **máximo seguro observado**

## Regras de Negócio

### Normalização de Códigos de Tribunal
A API do Pangea usa formato com 2 dígitos (`TRT01`, `TRF01`), enquanto o banco interno do Synthropic usa `TRT1`, `TRF1`. A função `toPangeaOrgaoCodigo()` converte:
- `TRT1` → `TRT01`
- `TRF1` → `TRF01`
- `TRT15` → `TRT15` (mantém — já tem 2 dígitos)
- Outros códigos: normaliza removendo caracteres não-alfanuméricos e uppercase

### Conversão de Datas
- Input ISO `yyyy-mm-dd` é convertido para `dd/mm/yyyy` (formato esperado pelo Pangea)
- Input já em `dd/mm/yyyy` é mantido sem alteração
- Input vazio retorna string vazia

### Tratamento de Nulos na Resposta
A API retorna campos com `null` em vez de array/objeto vazio. Schemas usam preprocessadores Zod (`nullableArray`, `nullableRecord`, `nullableInt`) para coagir `null → undefined → default`.

## Integrações
- **API Pangea/BNP do CNJ**: `http://pangeabnp.pdpj.jus.br/`
- **Supabase Service Client**: Para consultas auxiliares (lista de órgãos disponíveis)

## Restrições de Acesso
- Requer autenticação (action wrapper)
- Sem permissões granulares — qualquer usuário autenticado pode buscar
