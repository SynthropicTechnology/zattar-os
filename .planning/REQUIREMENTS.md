# Requirements: ZattarOS Audiencias Revision

**Defined:** 2026-04-09
**Core Value:** Gestao eficiente de audiencias judiciais com visualizacao completa de dados, preparo e historico — coerente com o design system Glass Briefing

## v1.1 Requirements

Requirements para revisao completa do modulo de audiencias. Cada um mapeia para fases do roadmap.

### Detail Dialog

- [ ] **DIALOG-01**: Usuario ve dialog centrado (max-w-3xl) ao clicar numa audiencia, substituindo o sheet lateral
- [ ] **DIALOG-02**: Dialog exibe meta strip com horario, modalidade, tribunal e responsavel
- [ ] **DIALOG-03**: Dialog exibe secao Processo com numero (mono), tribunal, grau e partes com indicador de litisconsorcio
- [ ] **DIALOG-04**: Dialog exibe secao Local/Acesso com URL virtual (copiavel) e/ou endereco presencial, incluindo badge de presenca hibrida
- [ ] **DIALOG-05**: Dialog exibe secao Indicadores com badges: segredo de justica, juizo digital, designada, documento ativo
- [ ] **DIALOG-06**: Dialog exibe secao Preparo com ring SVG + checklist de itens (6 itens ponderados)
- [ ] **DIALOG-07**: Dialog exibe secao Observacoes com texto preservando whitespace
- [ ] **DIALOG-08**: Dialog exibe secao Historico de Alteracoes como timeline vertical usando dados_anteriores
- [ ] **DIALOG-09**: Dialog exibe link/botao direto para ata de audiencia quando disponivel (url_ata_audiencia)
- [ ] **DIALOG-10**: Dialog permite abrir formulario de edicao (respeitando whitelist PJE para capturadas)

### Redesign Views

- [ ] **VIEW-01**: Lista view renderiza rows dentro de GlassPanel com status dot, IconContainer, prep ring SVG e badges semanticos
- [ ] **VIEW-02**: Lista view exibe badges de segredo de justica, litisconsorcio e designada nas rows relevantes
- [ ] **VIEW-03**: Lista view inclui empty state estilizado com icone e call-to-action
- [ ] **VIEW-04**: Mes view usa GlassPanel para calendario com dots coloridos por status e contadores em dias com 3+ audiencias
- [ ] **VIEW-05**: Mes view exibe popover de dia ao clicar, mostrando mini-lista de audiencias do dia
- [ ] **VIEW-06**: Ano view renderiza heatmap 12 meses com 4 intensidades e legenda estilo GitHub
- [ ] **VIEW-07**: Ano view inclui sidebar de stats (total ano, mes mais intenso, media semanal, taxa de realizacao)
- [ ] **VIEW-08**: Semana view substitui badges hardcoded por SemanticBadge e padroniza tipografia
- [ ] **VIEW-09**: Navegador compartilhado (ViewNavigator) substitui codigo duplicado em Semana/Mes/Ano

### Wiring

- [ ] **WIRE-01**: ConflictAlert renderizado no client apos KPI strip quando existem conflitos
- [ ] **WIRE-02**: PostHearingFlow renderizado para audiencias finalizadas/passadas na view Quadro
- [ ] **WIRE-03**: PostHearingFlow callbacks conectados: onMarkResult, onUploadAta, onNotifyClient
- [ ] **WIRE-04**: MissionCard quick actions conectados: entrar sala virtual, ver processo, abrir PJe, ver checklist

### Indicadores

- [ ] **INDIC-01**: Badge "Segredo de Justica" (icone cadeado) visivel em cards, rows e dialog
- [ ] **INDIC-02**: Badge "Juizo Digital" visivel em cards, rows e dialog
- [ ] **INDIC-03**: Badge "Designada" visivel em cards, rows e dialog
- [ ] **INDIC-04**: Badge "Documento Ativo" visivel no dialog
- [ ] **INDIC-05**: Indicador de litisconsorcio ("e outros") quando polo_*_representa_varios = true
- [ ] **INDIC-06**: Badge de presenca hibrida indicando quem e presencial e quem e virtual

### Edicao e Dados

- [ ] **EDIT-01**: Usuario pode editar URL virtual da audiencia diretamente (action ja existe)
- [ ] **EDIT-02**: Usuario pode editar endereco presencial da audiencia diretamente (action ja existe)
- [ ] **EDIT-03**: Dados de origem (TRT origem, orgao julgador origem) exibidos para audiencias de 2o grau

### Filtros e Cleanup

- [ ] **FILT-01**: Filtro por segredo de justica (sigilosas / nao sigilosas)
- [ ] **FILT-02**: Filtro por nivel de preparo (baixo < 40% / medio 40-70% / alto > 70%)
- [ ] **FILT-03**: Filtro por presenca de URL virtual (com link / sem link)
- [ ] **FILT-04**: Filtro por presenca de ata (com ata / sem ata)
- [ ] **FILT-05**: Componentes legados removidos (audiencias-content, list-wrapper, table-wrapper, month-wrapper)

## v2 Requirements

### Interacao Avancada

- **ADV-01**: Filtro "em andamento" (audiencias acontecendo agora)
- **ADV-02**: Notificacoes push para conflitos de horario detectados
- **ADV-03**: Export de calendario (iCal) por periodo
- **ADV-04**: Drag-and-drop para redistribuicao de responsaveis na semana view

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mudancas no schema do banco | Revisao puramente de UI e wiring |
| Novas server actions | Actions de edicao ja existem |
| Integracao documento_ativo com documento real | Flag PJE sem FK — ata e o documento acessivel |
| Redesign da view Quadro/Missao | Ja alinhada ao Glass Briefing |
| Redesign do modulo de Chat | Milestone separado (v1.0) |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| (Populated during roadmap creation) | | |

**Coverage:**
- v1.1 requirements: 34 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 34

---
*Requirements defined: 2026-04-09*
*Last updated: 2026-04-09 after milestone v1.1 definition*
