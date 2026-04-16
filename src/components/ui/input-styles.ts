/**
 * Classes base reutilizáveis para inputs alinhados ao Design System Glass Briefing.
 *
 * Concentra comportamentos universais (placeholder, selection, file, disabled,
 * aria-invalid) + estilo visual glass. Consumido por:
 * - <Input variant="glass" /> (cva em input.tsx)
 * - InputCPF, InputCPFCNPJ, InputTelefone, InputCEP, InputData
 *   (componentes baseados em IMaskInput que não conseguem reutilizar <Input>
 *   internamente por conta da API do react-imask).
 *
 * Nunca duplique essa string — importe daqui.
 */
export const INPUT_GLASS_BASE_CLASSES =
  // Layout
  'h-11 w-full min-w-0 rounded-xl border px-4 text-base shadow-sm backdrop-blur-sm md:text-sm ' +
  // Cores e transições
  'border-outline-variant/60 bg-surface-container-lowest/70 transition-[color,background-color,border-color,box-shadow] outline-none ' +
  // Hover/focus
  'hover:border-outline-variant hover:bg-surface-container-lowest ' +
  'focus-visible:border-primary/40 focus-visible:bg-surface-container-lowest focus-visible:ring-2 focus-visible:ring-primary/20 ' +
  // Dark mode overrides
  'dark:bg-surface-container-low/40 dark:hover:bg-surface-container-low/60 dark:focus-visible:bg-surface-container-low/70 ' +
  // Behaviors universais
  'placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground ' +
  'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground ' +
  'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 ' +
  'aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20'
