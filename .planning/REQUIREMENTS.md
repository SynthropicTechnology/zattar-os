# Requirements: ZattarOS Chat Redesign

**Defined:** 2026-04-09
**Core Value:** Comunicacao em tempo real entre advogados com coerencia visual total ao design system Glass Briefing

## v1 Requirements

Requirements para a entrega inicial. Cada um mapeia para fases do roadmap.

### Layout

- [ ] **LAYOUT-01**: Layout principal suporta 3 colunas (sidebar + chat + detail panel) com responsividade
- [ ] **LAYOUT-02**: Sidebar esconde em mobile quando chat selecionado (manter comportamento existente)
- [ ] **LAYOUT-03**: Detail panel aparece como terceira coluna em telas >= 1280px e como Sheet em telas menores
- [ ] **LAYOUT-04**: Chat area ocupa flex-1 com ambient glow (radial gradients sutis nos cantos)

### Sidebar

- [ ] **SIDE-01**: Container da sidebar usa background transparente com borda sutil (padrao GlassPanel)
- [ ] **SIDE-02**: TabPills com filtros (Todas, Privadas, Grupos, Processos) com contadores
- [ ] **SIDE-03**: SearchInput do design system com icone, focus ring primary e placeholder
- [ ] **SIDE-04**: Section labels ("Fixadas", "Recentes") agrupando conversas por relevancia
- [ ] **SIDE-05**: Conversation items redesenhados com avatar rounded-xl, preview truncada, badge unread em primary
- [ ] **SIDE-06**: Hover state em items com bg-foreground/[0.04] e item ativo com bg-chat-sidebar-active
- [ ] **SIDE-07**: Botao "Nova" conversa com estilo primary (bg-primary, shadow, rounded-xl)

### Header

- [ ] **HEAD-01**: Header usa backdrop-blur com transparencia (glassmorfismo) em vez de bg-card solido
- [ ] **HEAD-02**: Avatar do contato com indicador online/offline e border-radius consistente (rounded-xl)
- [ ] **HEAD-03**: Botoes de acao (video, audio, mais) com estilo ghost e hover bg-foreground/[0.04]
- [ ] **HEAD-04**: Status online com dot verde animado + texto "Online" em text-success

### Context Bar

- [ ] **CTX-01**: Barra fina abaixo do header mostrando processo vinculado (quando existe relacao)
- [ ] **CTX-02**: Badge com tribunal (estilo SemanticBadge) + numero do processo
- [ ] **CTX-03**: Link "Ver processo" que navega para a pagina do processo vinculado
- [ ] **CTX-04**: Background sutil bg-primary/3 alinhado ao depth-3 do GlassPanel

### Mensagens

- [ ] **MSG-01**: Bolhas enviadas com bg-primary, cantos assimetricos e box-shadow glow sutil
- [ ] **MSG-02**: Bolhas recebidas com bg-chat-bubble-received, borda sutil rgba(255,255,255,0.05) e cantos assimetricos
- [ ] **MSG-03**: Avatar do remetente (28px, rounded-lg) junto a primeira mensagem de cada grupo
- [ ] **MSG-04**: Nome do remetente visivel em conversas de grupo (text-primary/60, font-semibold)
- [ ] **MSG-05**: Timestamp em text-[0.575rem] tabular-nums com opacidade reduzida
- [ ] **MSG-06**: Status de entrega (enviando, enviado, lido) com icones em cores semanticas
- [ ] **MSG-07**: Date separator com linhas horizontais e label centralizada (uppercase, text-[0.6rem])

### Media Bubbles

- [ ] **MEDIA-01**: File bubble com IconContainer, nome do arquivo, tamanho e botao download glassmorfico
- [ ] **MEDIA-02**: Audio bubble com waveform visual customizado (barras animadas) em vez de player nativo
- [ ] **MEDIA-03**: Botao play circular no audio com cores adaptativas (primary para recebido, white para enviado)
- [ ] **MEDIA-04**: Image bubble com border-radius consistente (rounded-xl) e container com padding
- [ ] **MEDIA-05**: Video bubble com border-radius consistente e overlay de controles

### Input Area

- [ ] **INPUT-01**: Container do input com background glass (bg-white/4, border-border/8) e rounded-2xl
- [ ] **INPUT-02**: Textarea auto-resize (1 a 6 linhas) em vez de Input single-line
- [ ] **INPUT-03**: Focus ring com primary/6 e border primary/25 (consistente com SearchInput)
- [ ] **INPUT-04**: Botoes de acao (emoji, attach, mic) inline com hover states individuais
- [ ] **INPUT-05**: Botao mic com hover:destructive para indicar gravacao
- [ ] **INPUT-06**: Botao enviar separado com bg-primary, rounded-xl e box-shadow primary
- [ ] **INPUT-07**: Typing indicator redesenhado com dots animados (bouncing) e texto sutil

### Detail Panel

- [ ] **DETAIL-01**: Painel lateral direito (320px) com perfil do usuario/grupo
- [ ] **DETAIL-02**: Avatar grande (72px, rounded-2xl) com nome e cargo/funcao
- [ ] **DETAIL-03**: Secao "Informacoes" com email, telefone, membro desde (com IconContainer)
- [ ] **DETAIL-04**: Secao "Processos Vinculados" com cards clicaveis (numero + titulo do processo)
- [ ] **DETAIL-05**: Secao "Midia Compartilhada" com grid 3 colunas de thumbnails + contador "+N"
- [ ] **DETAIL-06**: Botao fechar e titulo "Detalhes" no header do painel
- [ ] **DETAIL-07**: Toggle de visibilidade do painel via botao no header do chat

### Empty State

- [ ] **EMPTY-01**: Icone/logo em container de 64px com bg-primary/8 e rounded-2xl
- [ ] **EMPTY-02**: Titulo em font-heading e descricao em text-muted-foreground/50
- [ ] **EMPTY-03**: Grid 2x2 de suggestion cards com icones semanticos (purple, blue, green, amber)
- [ ] **EMPTY-04**: Cards clicaveis que preenchem o input com sugestoes do dominio juridico
- [ ] **EMPTY-05**: Hover state nos cards com translateY(-2px) e box-shadow sutil

### Preservacao

- [ ] **PRES-01**: Todas as funcionalidades de mensagem (texto, arquivo, imagem, video, audio) continuam funcionando
- [ ] **PRES-02**: Sistema de chamadas (Dyte SDK) permanece intacto e funcional
- [ ] **PRES-03**: Gravacao de audio inline com MediaRecorder continua funcionando
- [ ] **PRES-04**: Presenca online/offline e typing indicator continuam funcionando
- [ ] **PRES-05**: Responsividade mobile (toggle sidebar/chat) preservada
- [ ] **PRES-06**: Lazy loading do ChatWindow e Suspense boundaries mantidos
- [ ] **PRES-07**: Zustand store (useChatStore) e hooks existentes nao sofrem breaking changes

## v2 Requirements

### Interacao Avancada

- **ADV-01**: Reacoes em mensagens (emoji picker inline)
- **ADV-02**: Reply/quote de mensagem especifica
- **ADV-03**: Pinagem de mensagens importantes na conversa
- **ADV-04**: Busca dentro da conversa ativa (mensagens)

### Personalizacao

- **PERS-01**: Escolha de wallpaper/tema do chat thread
- **PERS-02**: Tamanho de fonte ajustavel nas mensagens
- **PERS-03**: Notificacoes granulares por conversa (mute/unmute)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Threads/respostas encadeadas | Complexidade alta, nao essencial para v1 do redesign |
| Mudancas no schema do banco | Redesign puramente visual, sem migracao |
| Novas server actions | Manter logica de negocio existente intacta |
| Redesign do sistema de chamadas | Dyte SDK tem UI propria, manter separado |
| E2E encryption | Fora do escopo de redesign visual |
| Push notifications | Feature de backend, nao relacionada ao redesign |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| LAYOUT-01 | — | Pending |
| LAYOUT-02 | — | Pending |
| LAYOUT-03 | — | Pending |
| LAYOUT-04 | — | Pending |
| SIDE-01 | — | Pending |
| SIDE-02 | — | Pending |
| SIDE-03 | — | Pending |
| SIDE-04 | — | Pending |
| SIDE-05 | — | Pending |
| SIDE-06 | — | Pending |
| SIDE-07 | — | Pending |
| HEAD-01 | — | Pending |
| HEAD-02 | — | Pending |
| HEAD-03 | — | Pending |
| HEAD-04 | — | Pending |
| CTX-01 | — | Pending |
| CTX-02 | — | Pending |
| CTX-03 | — | Pending |
| CTX-04 | — | Pending |
| MSG-01 | — | Pending |
| MSG-02 | — | Pending |
| MSG-03 | — | Pending |
| MSG-04 | — | Pending |
| MSG-05 | — | Pending |
| MSG-06 | — | Pending |
| MSG-07 | — | Pending |
| MEDIA-01 | — | Pending |
| MEDIA-02 | — | Pending |
| MEDIA-03 | — | Pending |
| MEDIA-04 | — | Pending |
| MEDIA-05 | — | Pending |
| INPUT-01 | — | Pending |
| INPUT-02 | — | Pending |
| INPUT-03 | — | Pending |
| INPUT-04 | — | Pending |
| INPUT-05 | — | Pending |
| INPUT-06 | — | Pending |
| INPUT-07 | — | Pending |
| DETAIL-01 | — | Pending |
| DETAIL-02 | — | Pending |
| DETAIL-03 | — | Pending |
| DETAIL-04 | — | Pending |
| DETAIL-05 | — | Pending |
| DETAIL-06 | — | Pending |
| DETAIL-07 | — | Pending |
| EMPTY-01 | — | Pending |
| EMPTY-02 | — | Pending |
| EMPTY-03 | — | Pending |
| EMPTY-04 | — | Pending |
| EMPTY-05 | — | Pending |
| PRES-01 | — | Pending |
| PRES-02 | — | Pending |
| PRES-03 | — | Pending |
| PRES-04 | — | Pending |
| PRES-05 | — | Pending |
| PRES-06 | — | Pending |
| PRES-07 | — | Pending |

**Coverage:**
- v1 requirements: 51 total
- Mapped to phases: 0
- Unmapped: 51

---
*Requirements defined: 2026-04-09*
*Last updated: 2026-04-09 after initial definition*
