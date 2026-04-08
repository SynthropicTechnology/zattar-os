# Design: Integracao Website com Design System

## Context

O Synthropic opera com tres apps distintos em um monorepo Next.js:
1. **Dashboard Principal** (`src/app/(dashboard)/`) - Sistema interno para advogados
2. **Meu Processo** (`src/app/meu-processo/`) - Portal do cliente
3. **Website** (`src/app/website/`) - Site institucional da Atar Advogados

O website foi recem-adicionado ao projeto mas possui imports quebrados e nao esta integrado com o design system existente.

## Goals / Non-Goals

**Goals:**
- Corrigir todos os imports quebrados para permitir build do projeto
- Integrar fontes, espacamentos e transicoes do design system
- Manter identidade visual original do website (cores roxas `#5523eb`)
- Configurar URLs dos apps via variaveis de ambiente
- Adicionar link funcional para o portal "Meu Processo"

**Non-Goals:**
- Reescrever componentes do website do zero
- Unificar componentes UI do website com os do dashboard (podem coexistir)
- Alterar cores ou identidade visual do website
- Implementar SSR ou otimizacoes de performance

## Decisions

### 1. Imports Relativos vs Alias

**Decisao:** Usar imports relativos (`./components/`) em vez de alias (`@/`)

**Alternativas consideradas:**
- Criar alias especifico para website (`@website/`) - Adiciona complexidade ao tsconfig
- Usar `@/app/website/` - Verboso e propenso a erros

**Racional:** Imports relativos sao mais simples, nao requerem configuracao adicional e sao suficientes para o escopo do website.

### 2. CSS Global vs CSS Proprio

**Decisao:** Remover `src/app/website/globals.css` e usar `src/app/globals.css` do sistema

**Racional:** Evita duplicacao de estilos base e garante consistencia com Tailwind CSS configurado no projeto.

### 3. Fontes do Sistema

**Decisao:** Aplicar as mesmas fontes do dashboard (Inter para texto, Montserrat para headings)

**Racional:** Consistencia visual entre apps e aproveitamento do carregamento de fontes ja configurado.

### 4. Componentes UI do Website

**Decisao:** Manter componentes UI separados em `src/app/website/components/ui/` mas alinhar com tokens do design system

**Alternativas consideradas:**
- Importar componentes de `@/components/ui/` - Pode quebrar estilos especificos do website
- Duplicar tudo - Aumenta custo de manutencao

**Racional:** Componentes como Button podem ter variante `brand` especifica do website (cor roxa) enquanto seguem padroes de espacamento e transicao do sistema.

### 5. URLs Multi-App

**Decisao:** Usar variaveis de ambiente `NEXT_PUBLIC_*` para URLs dos apps

**Racional:** Permite configuracao diferente por ambiente (dev, staging, prod) e flexibilidade para diferentes dominios.

## Risks / Trade-offs

| Risco | Impacto | Mitigacao |
|-------|---------|-----------|
| Componentes UI do website divergem do sistema | Medio | Documentar tokens usados e revisar periodicamente |
| Links entre apps quebram em ambientes diferentes | Alto | Usar variaveis de ambiente com fallbacks para dev |
| CSS global conflita com estilos do website | Baixo | Website usa classes especificas, conflitos improvaveis |

## Migration Plan

1. Corrigir imports (nao afeta funcionalidade existente)
2. Integrar CSS global (pode requerer ajustes pontuais)
3. Adicionar variaveis de ambiente (backward-compatible)
4. Implementar link para Meu Processo (nova funcionalidade)

**Rollback:** Reverter commits individuais se necessario.

## Open Questions

- Definir dominios finais para cada app em producao
- Decidir se website tera autenticacao futura (compartilhar auth com outros apps?)
