# Phase 1: Layout Shell & Sidebar - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-09
**Phase:** 01-layout-shell-sidebar
**Areas discussed:** Tab filtering logic, Fixadas vs Recentes, Detail panel toggle, Migration strategy

---

## Tab Filtering Logic

| Option | Description | Selected |
|--------|-------------|----------|
| Filtrar pelo campo tipo | Usar sala.tipo (geral/privado/grupo/documento). 'Processos' filtra por tipo='documento'. | ✓ |
| Tag system novo | Adicionar campo tags[] nas salas para classificacao mais flexivel. Requer migracao DB. | |
| Claude decide | Claude escolhe a melhor abordagem tecnica | |

**User's choice:** Filtrar pelo campo tipo
**Notes:** Simples e ja disponivel no domain. Sem necessidade de migracao.

### Tab Count

| Option | Description | Selected |
|--------|-------------|----------|
| Computed do array filtrado | salas.filter(s => s.tipo === x).length — sem custo adicional, reativo ao search | ✓ |
| Badge apenas no total | Mostrar contagem apenas na tab 'Todas' | |
| Claude decide | Claude escolhe | |

**User's choice:** Computed do array filtrado

### Processo Link Identification

| Option | Description | Selected |
|--------|-------------|----------|
| tipo='documento' | Conversas com tipo='documento' sao vinculadas a processos. Ja existe no schema. | ✓ |
| Campo processo_id | Adicionar FK para processos na tabela de salas. Mais robusto mas requer migracao. | |
| Claude decide | Claude escolhe | |

**User's choice:** tipo='documento'

---

## Fixadas vs Recentes

| Option | Description | Selected |
|--------|-------------|----------|
| Campo pinned no DB | Adicionar coluna 'fixada' na tabela de salas (boolean per-user). Persistente entre sessoes. | ✓ |
| localStorage | Salvar IDs fixados no browser. Sem migracao mas nao sincroniza entre dispositivos. | |
| Hardcode Sala Geral | Apenas a 'Sala Geral' aparece como fixada. Mais simples. | |
| Claude decide | Claude escolhe | |

**User's choice:** Campo pinned no DB
**Notes:** Requer migracao SQL simples com RLS policy.

### Ordenacao

| Option | Description | Selected |
|--------|-------------|----------|
| Ultima mensagem (Recommended) | Ordenar por data da ultima mensagem, mais recente primeiro. | ✓ |
| Alfabetica | Ordenar por nome da conversa A-Z | |
| Unread first | Conversas com mensagens nao lidas primeiro, depois por data | |

**User's choice:** Ultima mensagem

---

## Detail Panel Toggle

| Option | Description | Selected |
|--------|-------------|----------|
| Escondido (Recommended) | Maximiza area do chat. Usuario clica para abrir. | ✓ |
| Visivel em >= 1440px | Em telas grandes abre automaticamente. | |
| Sempre visivel desktop | Acima de 1280px sempre visivel. | |

**User's choice:** Escondido por padrao

### Trigger

| Option | Description | Selected |
|--------|-------------|----------|
| Clique no nome/avatar | Clicar no nome do contato no header abre o painel. | ✓ |
| Botao dedicado | Botao no header (icone info/user) abre o painel. | |
| Ambos | Nome/avatar E botao dedicado | |

**User's choice:** Clique no nome/avatar

---

## Migration Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Big bang (Recommended) | Substituir tudo de uma vez. Um commit coeso. | ✓ |
| Incremental | Migrar arquivo por arquivo em commits separados. | |
| Claude decide | Claude escolhe | |

**User's choice:** Big bang

### Shell Outer

| Option | Description | Selected |
|--------|-------------|----------|
| Border sutil + sem shadow | border-border com bg-surface-container-low. Sem shadow. | ✓ |
| Manter border+shadow atual | Preservar o rounded-lg shadow-sm atual. | |
| Glass shell com blur | backdrop-blur no shell externo. | |

**User's choice:** Border sutil + sem shadow

---

## Claude's Discretion

- Detalhes de implementacao da migracao SQL para campo `fixada`
- Logica do toggle state para o detail panel
- Abordagem CSS para ambient glow

## Deferred Ideas

None
