import * as React from 'react';
import { cn } from '@/lib/utils';

// Tipos base para polimorfismo
type AsProp<C extends React.ElementType> = {
  as?: C;
};

type PropsToOmit<C extends React.ElementType, P> = keyof (AsProp<C> & P);

type PolymorphicComponentProp<
  C extends React.ElementType,
  Props = object
> = React.PropsWithChildren<Props & AsProp<C>> &
  Omit<React.ComponentPropsWithoutRef<C>, PropsToOmit<C, Props>>;

// Componente polimórfico genérico
function createTypographyComponent<T extends React.ElementType>(
  defaultElement: T,
  className: string,
  displayName: string,
  additionalProps?: Record<string, unknown>
) {
  type TypographyProps<C extends React.ElementType = T> = PolymorphicComponentProp<
    C,
    { className?: string }
  >;

  function Component<C extends React.ElementType = T>({
    as,
    className: userClassName,
    children,
    ref,
    ...props
  }: TypographyProps<C> & { ref?: React.ComponentPropsWithRef<C>['ref'] }) {
    const Element = (as || defaultElement) as React.ElementType;
    
    // Fragment não aceita props como className, então retornamos apenas children
    if (Element === React.Fragment) {
      return <>{children}</>;
    }
    
    return (
      <Element
        ref={ref}
        className={cn(className, userClassName)}
        {...additionalProps}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </Element>
    );
  }

  Component.displayName = displayName;
  return Component;
}

// Componentes individuais
const H1 = createTypographyComponent('h1', 'typography-h1', 'Typography.H1');
const H2 = createTypographyComponent('h2', 'typography-h2', 'Typography.H2');
const H3 = createTypographyComponent('h3', 'typography-h3', 'Typography.H3');
const H4 = createTypographyComponent('h4', 'typography-h4', 'Typography.H4');
const P = createTypographyComponent('p', 'typography-p', 'Typography.P');
const Blockquote = createTypographyComponent(
  'blockquote',
  'typography-blockquote',
  'Typography.Blockquote'
);
const List = createTypographyComponent('ul', 'typography-list', 'Typography.List', { role: 'list' });
const InlineCode = createTypographyComponent(
  'code',
  'typography-inline-code',
  'Typography.InlineCode'
);
const Lead = createTypographyComponent('p', 'typography-lead', 'Typography.Lead');
const Large = createTypographyComponent('div', 'typography-large', 'Typography.Large');
const Small = createTypographyComponent('small', 'typography-small', 'Typography.Small');
const Muted = createTypographyComponent('p', 'typography-muted', 'Typography.Muted');

// Componente especial para tabelas
interface TableProps extends React.ComponentPropsWithoutRef<'div'> {
  children: React.ReactNode;
}

const Table = React.forwardRef<HTMLDivElement, TableProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('typography-table-wrapper', className)}
      {...props}
    >
      <table className="typography-table">{children}</table>
    </div>
  )
);
Table.displayName = 'Typography.Table';

// Namespace exportado
export const Typography = {
  H1,
  H2,
  H3,
  H4,
  P,
  Blockquote,
  List,
  InlineCode,
  Lead,
  Large,
  Small,
  Muted,
  Table,
};

// Exportações individuais para uso direto
export { H1, H2, H3, H4, P, Blockquote, List, InlineCode, Lead, Large, Small, Muted, Table };

// =============================================================================
// DESIGN SYSTEM: Typed Typography Components
// =============================================================================

const HEADING_LEVELS = {
  page: { className: 'text-page-title', tag: 'h1' as const },
  section: { className: 'text-section-title', tag: 'h2' as const },
  card: { className: 'text-card-title', tag: 'h3' as const },
  subsection: { className: 'text-subsection-title', tag: 'h4' as const },
  widget: { className: 'text-widget-title', tag: 'h3' as const },
} as const;

type HeadingLevel = keyof typeof HEADING_LEVELS;

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level: HeadingLevel;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  children: React.ReactNode;
}

function Heading({ level, as: asTag, className: userClassName, children, ...props }: HeadingProps) {
  const config = HEADING_LEVELS[level];
  const Tag = asTag ?? config.tag;
  return (
    <Tag className={cn(config.className, userClassName)} {...props}>
      {children}
    </Tag>
  );
}
Heading.displayName = 'Heading';

const TEXT_VARIANTS = {
  'kpi-value': { className: 'text-kpi-value', tag: 'span' as const },
  label: { className: 'text-label', tag: 'span' as const },
  caption: { className: 'text-caption', tag: 'p' as const },
  'widget-sub': { className: 'text-widget-sub', tag: 'p' as const },
  'meta-label': { className: 'text-meta-label', tag: 'span' as const },
  'micro-caption': { className: 'text-micro-caption', tag: 'span' as const },
  'micro-badge': { className: 'text-micro-badge', tag: 'span' as const },
  overline: { className: 'text-overline', tag: 'span' as const },
} as const;

type TextVariant = keyof typeof TEXT_VARIANTS;

interface TextProps extends React.HTMLAttributes<HTMLElement> {
  variant: TextVariant;
  as?: React.ElementType;
  children: React.ReactNode;
}

function Text({ variant, as: asTag, className: userClassName, children, ...props }: TextProps) {
  const config = TEXT_VARIANTS[variant];
  const Tag = asTag ?? config.tag;
  return (
    <Tag className={cn(config.className, userClassName)} {...props}>
      {children}
    </Tag>
  );
}
Text.displayName = 'Text';

// Design System typed typography
export { Heading, Text };
export type { HeadingLevel, TextVariant, HeadingProps, TextProps };
export { HEADING_LEVELS, TEXT_VARIANTS };
