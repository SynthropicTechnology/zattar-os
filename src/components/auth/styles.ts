/**
 * Auth shared Tailwind classes — todos usando tokens do design system.
 * Zero CSS hardcoded. Todas as cores vem de CSS variables.
 */

export const AUTH_STYLES = {
  label: 'block text-[0.8125rem] font-medium text-muted-foreground mb-2 tracking-wide',

  input: [
    'w-full h-[50px] px-4 rounded-xl outline-none',
    'bg-background/60 border border-border text-foreground',
    'placeholder:text-muted-foreground/40',
    'transition-all duration-200',
    'hover:border-border/80',
    'focus:border-primary/50 focus:bg-background/80',
    'focus:shadow-[0_0_0_3px_oklch(from_var(--primary)_l_c_h/0.08)]',
  ].join(' '),

  toggle: [
    'absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md',
    'text-muted-foreground/40 cursor-pointer bg-transparent border-none',
    'transition-all duration-200',
    'hover:text-muted-foreground hover:bg-accent/50',
  ].join(' '),

  btnPrimary: [
    'w-full h-[50px] flex items-center justify-center gap-2.5',
    'rounded-xl font-semibold cursor-pointer',
    'bg-primary text-primary-foreground',
    'transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
    'hover:brightness-110 hover:shadow-[0_0_20px_oklch(from_var(--primary)_l_c_h/0.25),0_4px_16px_oklch(from_var(--primary)_l_c_h/0.20)]',
    'hover:-translate-y-px',
    'active:translate-y-0 active:scale-[0.99]',
    'focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-3',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none disabled:hover:brightness-100',
  ].join(' '),

  btnSuccess: 'bg-success hover:bg-success shadow-[0_0_20px_oklch(from_var(--success)_l_c_h/0.3)]',

  error: [
    'flex items-start gap-2.5 text-[0.8125rem] leading-relaxed',
    'p-3.5 rounded-xl',
    'border border-destructive/15 bg-destructive/5 text-destructive',
  ].join(' '),
} as const
