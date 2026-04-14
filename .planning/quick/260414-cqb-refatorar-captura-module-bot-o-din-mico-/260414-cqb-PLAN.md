---
phase: quick
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/(authenticated)/captura/captura-client.tsx
  - src/app/(authenticated)/captura/credenciais/page-client.tsx
  - src/app/(authenticated)/captura/agendamentos/page-client.tsx
  - src/app/(authenticated)/captura/tribunais/page-client.tsx
  - src/app/(authenticated)/captura/components/advogados/advogados-filter.tsx
  - src/app/(authenticated)/captura/components/advogados/credenciais-advogado-dialog.tsx
autonomous: true
must_haves:
  truths:
    - "Header button label changes dynamically based on active tab (historico/agendamentos/credenciais/tribunais)"
    - "Sub-tab pages no longer render their own action buttons"
    - "AdvogadosFilter visually matches the glass FilterDropdown pattern from CapturaFilterBar"
    - "Credential list items in CredenciaisAdvogadoDialog use glass-consistent bg-white/[0.03] styling"
  artifacts:
    - path: "src/app/(authenticated)/captura/captura-client.tsx"
      provides: "Dynamic header button mapped per tab, all four dialogs rendered"
    - path: "src/app/(authenticated)/captura/components/advogados/advogados-filter.tsx"
      provides: "Glass Briefing-aligned filter dropdown (no Command/CommandInput)"
  key_links:
    - from: "captura-client.tsx"
      to: "credenciais/page-client.tsx"
      via: "onNewCredencial callback prop"
      pattern: "onNewCredencial"
    - from: "captura-client.tsx"
      to: "agendamentos/page-client.tsx"
      via: "onNewAgendamento callback prop"
      pattern: "onNewAgendamento"
---

<objective>
Refatorar o modulo captura para: (1) botao dinamico no header por tab ativa, (2) remover botoes duplicados das sub-tabs, (3) alinhar AdvogadosFilter ao padrao Glass Briefing, (4) corrigir styling das credenciais no dialog.

Purpose: Consistencia visual com Glass Briefing e UX unificada — acao principal sempre no header.
Output: 6 arquivos modificados, zero regressao funcional.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/app/(authenticated)/captura/captura-client.tsx
@src/app/(authenticated)/captura/credenciais/page-client.tsx
@src/app/(authenticated)/captura/agendamentos/page-client.tsx
@src/app/(authenticated)/captura/tribunais/page-client.tsx
@src/app/(authenticated)/captura/components/advogados/advogados-filter.tsx
@src/app/(authenticated)/captura/components/advogados/credenciais-advogado-dialog.tsx
@src/app/(authenticated)/captura/components/captura-filter-bar.tsx

<interfaces>
<!-- FilterDropdown pattern from captura-filter-bar.tsx — the target pattern for AdvogadosFilter -->

FilterDropdownTrigger props: { label: string; active: boolean; onClear?: () => void }
Styling: rounded-lg border, active = border-primary/20 bg-primary/5 text-primary, inactive = border-border/15 text-muted-foreground/60 hover:bg-muted/30
PopoverContent: className="rounded-2xl glass-dropdown overflow-hidden p-0 w-48"
Item buttons: rounded-lg px-2.5 py-2 text-xs, selected = bg-primary/8 text-primary

<!-- AdvogadosFilter current interface (must preserve) -->
interface AdvogadosFilterProps {
  title?: string;
  options: { label: string; value: string; icon?: React.ComponentType<{ className?: string }> }[];
  value: string;
  onValueChange: (value: string) => void;
}

<!-- AgendamentoDialog -->
import { AgendamentoDialog } from './components/agendamento-dialog';
Props: { open, onOpenChange, onSuccess }

<!-- TribunaisDialog -->
import { TribunaisDialog } from '../components/tribunais/tribunais-dialog';
Props: { tribunal (TribunalConfig | null), open, onOpenChange, onSuccess }

<!-- CredenciaisClient selecionar advogado flow -->
States in credenciais/page-client.tsx:
  selecionarAdvogadoDialog (boolean), selectedAdvogadoId (number|null)
  credenciaisAdvogadoDialog ({ open, advogado })
  useAdvogados({ limite: 100 }) for advogadosList
  handleNovaCredencial() -> opens selecionarAdvogadoDialog
  handleConfirmarAdvogado() -> closes select, opens credenciaisAdvogadoDialog
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Dynamic header button + remove sub-tab duplicate buttons</name>
  <files>
    src/app/(authenticated)/captura/captura-client.tsx
    src/app/(authenticated)/captura/credenciais/page-client.tsx
    src/app/(authenticated)/captura/agendamentos/page-client.tsx
    src/app/(authenticated)/captura/tribunais/page-client.tsx
  </files>
  <action>
**captura-client.tsx — Add dynamic header button and all dialogs:**

1. Add new imports:
   - `AgendamentoDialog` from `'./components/agendamento-dialog'`
   - `TribunaisDialog` from `'./components/tribunais/tribunais-dialog'`
   - `Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle` from `'@/components/ui/dialog'`
   - `Label` from `'@/components/ui/label'`
   - `AdvogadoCombobox` from `'@/app/(authenticated)/captura'`
   - `CredenciaisAdvogadoDialog` from `'./components/advogados/credenciais-advogado-dialog'`
   - `useAdvogados, type Advogado` from `'@/app/(authenticated)/advogados'`

2. Add state for sub-tab dialogs:
   ```
   const [agendamentoDialogOpen, setAgendamentoDialogOpen] = useState(false);
   const [tribunalDialogOpen, setTribunalDialogOpen] = useState(false);
   const [selecionarAdvogadoDialog, setSelecionarAdvogadoDialog] = useState(false);
   const [selectedAdvogadoId, setSelectedAdvogadoId] = useState<number | null>(null);
   const [credenciaisAdvogadoDialog, setCredenciaisAdvogadoDialog] = useState<{ open: boolean; advogado: Advogado | null }>({ open: false, advogado: null });
   ```

3. Add `useAdvogados` hook call: `const { advogados: advogadosList, isLoading: advogadosLoading } = useAdvogados({ limite: 100 });`

4. Add `handleNovaCredencial` callback (same logic as in CredenciaisClient — resets selectedAdvogadoId, opens selecionarAdvogadoDialog).

5. Add `handleConfirmarAdvogado` callback (finds advogado in list, closes select dialog, opens credenciaisAdvogadoDialog).

6. Create a `HEADER_BUTTON_CONFIG` map (or inline switch) mapping activeTab to { label, onClick }:
   - `historico` -> "Nova Captura", opens capturaDialogOpen
   - `agendamentos` -> "Novo Agendamento", opens agendamentoDialogOpen
   - `credenciais` -> "Nova Credencial", calls handleNovaCredencial
   - `tribunais` -> "Nova Configuracao", opens tribunalDialogOpen

7. Replace the static header Button with dynamic one that reads from the config based on activeTab.

8. Add `refreshKey` increment callback for agendamento and tribunal success.

9. After the CapturaDialog at the bottom, render:
   - `<AgendamentoDialog open={agendamentoDialogOpen} onOpenChange={setAgendamentoDialogOpen} onSuccess={() => { setRefreshKey(p=>p+1); setAgendamentoDialogOpen(false); }} />`
   - `<TribunaisDialog tribunal={null} open={tribunalDialogOpen} onOpenChange={setTribunalDialogOpen} onSuccess={() => { setRefreshKey(p=>p+1); setTribunalDialogOpen(false); }} />`
   - The "selecionar advogado" Dialog (copy the Dialog JSX from credenciais/page-client.tsx lines 555-595 — with AdvogadoCombobox, Cancelar/Continuar buttons)
   - `<CredenciaisAdvogadoDialog ...>` with same pattern as credenciais/page-client.tsx

**credenciais/page-client.tsx — Remove "Nova Credencial" button:**

1. Remove the `<Button size="sm" className="rounded-xl" onClick={handleNovaCredencial}>` block (line ~413-416) from inside the filter bar's `justify-end` div.
2. Keep SearchInput and ViewToggle in that div.
3. The selecionar advogado Dialog AND CredenciaisAdvogadoDialog AND related state (`selecionarAdvogadoDialog`, `selectedAdvogadoId`, `credenciaisAdvogadoDialog`, `handleNovaCredencial`, `handleConfirmarAdvogado`) should REMAIN in this component because the Edit flow still needs them (handleEdit opens credenciaisAdvogadoDialog). Only the "Nova Credencial" button trigger is removed from the toolbar.
4. Optionally accept `onNewCredencial?: () => void` prop — but since the parent handles it independently with its own state, this is NOT needed. The parent and child each manage their own dialog instances.

**agendamentos/page-client.tsx — Remove "Novo" button:**

1. Remove the `<Button size="sm" ...>` block (lines ~241-248) from the toolbar.
2. Keep SearchInput in the `justify-end` div.
3. The AgendamentoDialog at the bottom of the component REMAINS because the component still needs it for its own internal usage — BUT since the parent now also has one, we should remove the internal AgendamentoDialog from AgendamentosClient to avoid duplication. Actually NO — the parent's dialog creates NEW agendamentos, but AgendamentosClient may need its own for edit flows in the future. For now, also remove `agendamentoDialogOpen` state + the AgendamentoDialog render from AgendamentosClient since it's only used by the "Novo" button we're removing. Keep the fetchAgendamentos function and other logic intact.

**tribunais/page-client.tsx — Remove "Nova Configuracao" button:**

1. Remove the `<Button size="sm" ...>` block (lines ~148-155) from the filter toolbar.
2. Keep SearchInput in the `justify-end` div.
3. The TribunaisDialog at the bottom REMAINS because it's also used by `handleEdit` (clicking a card opens the dialog with that tribunal's data). Only the "Nova Configuracao" trigger button is removed from the toolbar.
  </action>
  <verify>
    <automated>cd /Users/jordanmedeiros/Projetos/zattar-os && npx tsc --noEmit --project tsconfig.json 2>&1 | head -30</automated>
  </verify>
  <done>
    - Header button shows "Nova Captura" on historico tab, "Novo Agendamento" on agendamentos tab, "Nova Credencial" on credenciais tab, "Nova Configuracao" on tribunais tab
    - No duplicate action buttons visible in sub-tab toolbars
    - All four dialogs (CapturaDialog, AgendamentoDialog, selecionarAdvogado + CredenciaisAdvogadoDialog, TribunaisDialog) render from captura-client.tsx
    - TypeScript compiles without errors
  </done>
</task>

<task type="auto">
  <name>Task 2: Refactor AdvogadosFilter to Glass Briefing + fix credential dialog styling</name>
  <files>
    src/app/(authenticated)/captura/components/advogados/advogados-filter.tsx
    src/app/(authenticated)/captura/components/advogados/credenciais-advogado-dialog.tsx
  </files>
  <action>
**advogados-filter.tsx — Rewrite to match CapturaFilterBar's FilterDropdown pattern:**

1. Remove all Command/CommandInput/CommandList/CommandGroup/CommandItem/CommandSeparator/CommandEmpty imports.
2. Remove Badge, Separator, PlusCircle imports.
3. Keep Popover/PopoverContent/PopoverTrigger, cn, Check imports. Add ChevronDown, X from lucide-react.

4. Keep the exact same `AdvogadosFilterProps` interface (title, options with optional icon, value, onValueChange) — no breaking changes.

5. Replace the component body with the FilterDropdown pattern from captura-filter-bar.tsx:
   - Add `const [open, setOpen] = useState(false)` for controlled Popover.
   - Trigger button: Use the same `FilterDropdownTrigger` inline pattern:
     ```
     <div className={cn(
       'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors cursor-pointer',
       isActive
         ? 'border-primary/20 bg-primary/5 text-primary'
         : 'border-border/15 text-muted-foreground/60 hover:bg-muted/30'
     )}>
       <span>{displayLabel}</span>
       {isActive ? <X className="size-2.5" onClick={(e) => { e.stopPropagation(); onValueChange('all'); setOpen(false); }} />
                  : <ChevronDown className="size-2.5 opacity-50" />}
     </div>
     ```
     Where `isActive = value !== 'all' && !!value` and `displayLabel = isActive ? options.find(o => o.value === value)?.label ?? title : title`.

   - PopoverContent: `className="rounded-2xl glass-dropdown overflow-hidden p-0 w-48"` with `align="start"`.
   - Inside: `<div className="p-2 space-y-0.5">` with button list (same pattern as FilterDropdown):
     ```
     {options.map((opt) => (
       <button key={opt.value} type="button"
         onClick={() => { onValueChange(opt.value === value ? 'all' : opt.value); setOpen(false); }}
         className={cn(
           'w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs transition-colors cursor-pointer',
           value === opt.value ? 'bg-primary/8 text-primary' : 'hover:bg-muted/30 text-muted-foreground/70'
         )}>
         {opt.icon && <opt.icon className="size-3.5 opacity-70" />}
         <span>{opt.label}</span>
         {value === opt.value && <Check className="size-3 ml-auto" />}
       </button>
     ))}
     ```

   - Add "Limpar filtros" button at bottom when active (same as the old behavior):
     ```
     {isActive && (
       <>
         <div className="border-t border-border/10 my-1" />
         <button type="button" onClick={() => { onValueChange('all'); setOpen(false); }}
           className="w-full text-center text-[10px] text-muted-foreground/50 hover:text-muted-foreground py-1.5 cursor-pointer">
           Limpar filtros
         </button>
       </>
     )}
     ```

6. No breaking change to props interface — all consumers (credenciais/page-client.tsx, tribunais/page-client.tsx) work unchanged.

**credenciais-advogado-dialog.tsx — Fix credential list item styling (line ~364):**

1. Find the credential row div with `bg-card` / `bg-muted/50 opacity-60` classes.
2. Replace the className logic:
   - Active credential: `bg-white/[0.03] border-border/10` (was `bg-card`)
   - Inactive credential: `bg-white/[0.015] border-border/5 opacity-60` (was `bg-muted/50 opacity-60`)
3. Change `rounded-lg` to `rounded-xl` on the same div.
4. The conditional expression becomes:
   ```
   className={`flex items-center justify-between p-3 rounded-xl border ${
     credencial.active
       ? 'bg-white/3 border-border/10'
       : 'bg-white/1.5 border-border/5 opacity-60'
   }`}
   ```
  </action>
  <verify>
    <automated>cd /Users/jordanmedeiros/Projetos/zattar-os && npx tsc --noEmit --project tsconfig.json 2>&1 | head -30</automated>
  </verify>
  <done>
    - AdvogadosFilter renders with glass-style trigger (rounded-lg, border-primary/20 active, border-border/15 inactive, ChevronDown/X icons) and glass-dropdown PopoverContent with simple button list — NO Command/CommandInput
    - Props interface unchanged: title, options, value, onValueChange
    - Credential rows in CredenciaisAdvogadoDialog use bg-white/[0.03] (active) and bg-white/[0.015] (inactive) with rounded-xl
    - TypeScript compiles without errors
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with zero errors
2. `npm run dev` — navigate to /captura, switch tabs, confirm button label changes per tab
3. Clicking each header button opens the correct dialog
4. Sub-tab toolbars no longer show their own action buttons
5. AdvogadosFilter dropdowns in credenciais and tribunais tabs visually match CapturaFilterBar style
6. Credential list items in CredenciaisAdvogadoDialog show glass-consistent backgrounds
</verification>

<success_criteria>
- Dynamic header button shows correct label/action for all 4 tabs
- Zero duplicate action buttons in sub-tab toolbars
- AdvogadosFilter uses glass-dropdown pattern (no Command component)
- Credential dialog items use bg-white/[0.03] and rounded-xl
- TypeScript compiles cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/260414-cqb-refatorar-captura-module-bot-o-din-mico-/260414-cqb-SUMMARY.md`
</output>
