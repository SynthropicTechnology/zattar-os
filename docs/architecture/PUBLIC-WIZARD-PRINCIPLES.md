# Princípios do Wizard Público (Assinatura Digital)

Este documento consolida as **decisões estruturantes** tomadas durante o redesign do fluxo `(assinatura-digital)/*` em 2026-04. Foi escrito retrospectivamente depois de 6 ciclos de refatoração — serve como âncora para futuras decisões e evita re-deliberar do zero.

Para regras operacionais concretas (como adicionar novo step, anti-patterns específicos), ver [src/shared/assinatura-digital/components/public-shell/RULES.md](../../src/shared/assinatura-digital/components/public-shell/RULES.md).

## Contexto

O wizard público é consumido por **clientes finais leigos** via link enviado por WhatsApp/email. Diferente da área autenticada (advogados e equipe do escritório, usuários proficientes), aqui o usuário:

- Não tem familiaridade com o sistema
- Acessa pontualmente, uma vez por contrato
- Pode abandonar se sentir fricção
- Usa mobile com frequência (WhatsApp)
- Pode ter idade avançada (diminui fluência com UI complexa)

Esses traços moldam todos os princípios a seguir.

## Princípios

### 1. Uma única gramática visual

O wizard público **fala a mesma língua** do Glass Briefing da área autenticada. Mesmos tokens OKLCH, mesmo sistema de profundidade (`GlassPanel depth=1/2/3`), mesma tipografia display, mesma escala de espaçamento.

**Por quê**: reduz custo cognitivo de manutenção (um único DS), facilita que componentes migrem entre os dois mundos (ex: `GlassPanel`, `<Heading>`, tokens).

**Como se manifesta**:
- `AmbientBackdrop` com orbs primary visível (não flat lavanda)
- `bg-surface-container-lowest/60` em header/sidebar/footer
- `rounded-xl` em inputs, `rounded-2xl` em cards
- `font-display tracking-tight` em títulos
- Nunca cores hardcoded (`bg-blue-500`), sempre tokens (`bg-primary`)

**O que NÃO é**: fingir ser outro produto. Personalidade vem do conteúdo (tom, microcopy) e momentos (sucesso, erro), não de "desviar do DS em público".

### 2. Respeite o caminho preferencial do usuário

Quando existem 2 formas de completar uma ação (ex: buscar entidade existente vs. cadastrar nova), elevamos visualmente a **preferida** — não tratamos as duas com peso igual.

**Por quê**: clientes preenchem formulários mais rápido quando podem reusar dados já cadastrados. Dar peso visual igual a "busca" e "formulário manual" multiplica tempo de preenchimento.

**Como se manifesta**:
- Input de busca envolvido em `GlassPanel depth={2}` com tint primary e label "✨ Busca rápida"
- Campos manuais separados por divider "— Não encontrou? Preencha abaixo —"
- Em heurísticas condicionais: CNPJ/CPF escondidos conforme `tipo_pessoa`, pra não mostrar campos irrelevantes

**O que NÃO é**: esconder a alternativa. Quem não quer usar busca deve conseguir ir direto pro form manual sem atrito.

### 3. Feedback imediato, minimalista

Cada ação do usuário tem **resposta visual clara e proporcional**. Salvamentos automáticos, mudanças de estado, resultados de busca — tudo tem representação visual e textual.

**Por quê**: usuário leigo precisa de certeza constante ("Deu certo? Está salvando?"). Sem feedback, abandona ou envia várias vezes.

**Como se manifesta**:
- Hint "Continuando de onde parou · salvo há X min" com ícone `Clock` verde
- Status pills `CheckCircle2` (found), `XCircle` (notFound/error)
- `role="status" aria-live="polite"` pra screen readers também receberem feedback
- Transição fade+slide sutil entre steps (220ms) — mostra mudança sem distrair
- Glow primary no botão `Continuar` (ação primária clara)

**O que NÃO é**: teatro corporativo. Banners "ISO certified", "Conexão segura SSL", contadores de etapas mega-dramáticos — tudo isso quebra a confiança ao invés de construir.

### 4. Acessibilidade é funcionalidade, não overlay

Acessibilidade é **projetada desde o início**, não uma camada adicional. Não adicionamos ARIA pra "marcar checkbox" — usamos semântica HTML correta primeiro, ARIA só onde HTML não chega.

**Por quê**: clientes do fluxo público incluem pessoas com deficiência visual, motor, cognitiva. O impacto de falhar aqui é direto: contratos não assinados.

**Como se manifesta**:
- Hierarquia semântica `<h1>` (step title) → `<h2>` (section) → `<h3>` (sub-grupo)
- Landmarks `<main aria-label>`, `<aside aria-label>`, `<header>`, `<footer>`
- `<SkipLink>` pra pular navegação
- Focus management automático: primeiro input da step foca ao montar (via `requestAnimationFrame` + `FIRST_FOCUSABLE_SELECTOR`)
- Live regions diferenciados: `polite` pra status informativo, `assertive` apenas pra erros
- `useReducedMotion()` respeitado em todas transições
- Touch targets mínimos `h-11` (44px — WCAG 2.5.5)
- `aria-hidden` em ícones decorativos, `aria-label` em botões só-ícone

**O que NÃO é**: assumir que testar com mouse é suficiente. Toda UI deve ser navegável só com teclado, e todo feedback visual deve ter equivalente em screen reader.

### 5. Confiança vem do funcionamento, não de selos

O wizard comunica segurança e confiabilidade **pela qualidade da experiência** — não por elementos decorativos.

**Por quê**: clientes leigos não sabem o que é "ISO 27001", "SOC2", "256-bit AES". Esses selos viram ruído visual sem informação. Pior: se a UI está ruim e tem badges de segurança, gera suspeita ("se é tão seguro, por que parece suspeito?").

**Como se manifesta**:
- Auto-save com feedback visível → "Eles lembram do que preenchi"
- Transições suaves + focus management → "Isso funciona bem"
- Validação clara com mensagens úteis → "Eles me ajudam a acertar"
- Ausência de tracking pixels, popups, overlays → "Eles respeitam meu tempo"
- Botão primário com glow tintado → "Aqui é o próximo passo, tô no caminho"

**O que NÃO é**: bagdes de certificação, disclaimers de cookies em destaque, "Conexão SSL verificada", "Protegido por reCAPTCHA".

## Decisões específicas e seus porquês

Pra contexto de futuras alterações:

| Decisão | Alternativa descartada | Por quê |
|---|---|---|
| Chip "Etapa X de N" via `useWizardProgress()` hook | Passar `currentStep` prop em cada step | Prop drilling inviável com 10+ steps; hook garante fonte única de verdade (Zustand) |
| `.glass-field.glass-field` doubled-class CSS | Refatorar 5 inputs especializados pra usar `<Input variant="glass">` internamente | Doubled-class wins specificity sem refactor; `INPUT_GLASS_BASE_CLASSES` é a rota permanente pros 5 inputs |
| `AmbientBackdrop blurIntensity={55}` no público | Default 25 | 25 deixava orbs invisíveis sobre `bg-background` branco puro |
| `bg-surface-dim` no shell em vez de `bg-background` | `bg-background` padrão | Branco puro anulava os orbs do backdrop; `surface-dim` dá base tingida pra brand color emergir |
| `flex-1 sm:flex-initial` nos botões do footer | `min-w-*` sempre | Viewport 320px (iPhone SE) transbordava com min-width fixos |
| Focus via `rAF + getElementById(titleId)` com fallback | Ref no `<Heading>` | `<Heading>` não é forwardRef; refactor global seria invasivo |
| Transição `x: 12px` slide + fade 220ms | Slide 100% ou rotate | Muito pouco = sem feedback de mudança; muito = distração. 12px+220ms é "perceptível mas não interrompe" |
| Heurística `tipo_pessoa` por inferência de id | Refactor do schema pra suportar `conditional` | Schemas estão em banco; mudá-los afetaria contratos ativos; heurística no renderer é reversível |

## Quando revisitar este documento

- **Ao adicionar novo step ao wizard** — reler princípios 2 e 4 (caminho preferencial + a11y)
- **Ao mudar tom/identidade visual** — reler princípio 1 (gramática única)
- **Ao considerar adicionar selos/badges de segurança** — reler princípio 5
- **Ao planejar refactor da área autenticada** — checar se mais padrões podem ser unificados (ex: `INPUT_GLASS_BASE_CLASSES` já está disponível globalmente)

## Referências

- [src/shared/assinatura-digital/components/public-shell/RULES.md](../../src/shared/assinatura-digital/components/public-shell/RULES.md) — regras operacionais do shell
- [docs/architecture/VISUAL-REVIEW-CHECKLIST.md](./VISUAL-REVIEW-CHECKLIST.md) — checklist de auditoria visual geral
- [src/lib/design-system/tokens.ts](../../src/lib/design-system/tokens.ts) — tokens canônicos
- [src/app/globals.css](../../src/app/globals.css) — CSS variables OKLCH e classes utilitárias
- [src/components/ui/input-styles.ts](../../src/components/ui/input-styles.ts) — constante `INPUT_GLASS_BASE_CLASSES`
