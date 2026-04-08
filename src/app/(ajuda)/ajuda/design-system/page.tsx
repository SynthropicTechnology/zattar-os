import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Palette, Type, Component, ArrowRight } from 'lucide-react';

const sections = [
  {
    title: 'Tipografia',
    description: 'Sistema de tipografia com estilos consistentes para títulos, parágrafos e textos especiais',
    href: '/ajuda/design-system/typography',
    icon: Type,
  },
  {
    title: 'Componentes',
    description: 'Catálogo de componentes reutilizáveis baseados no shadcn/ui',
    href: '/ajuda/design-system/componentes',
    icon: Component,
  },
];

export default function DesignSystemPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Palette className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Design System</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Padrões visuais, tipografia e componentes utilizados no Synthropic.
        </p>
      </div>

      {/* Sections Grid */}
      <div className="grid gap-4">
        {sections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="transition-colors hover:bg-accent">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <section.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      {/* Overview */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Visão Geral</h2>
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <p>
            O Design System do Synthropic é baseado no <strong>shadcn/ui</strong>, uma
            coleção de componentes reutilizáveis construídos com Radix UI e Tailwind CSS.
          </p>

          <h3>Princípios</h3>
          <ul>
            <li><strong>Consistência:</strong> Componentes padronizados em todo o sistema</li>
            <li><strong>Acessibilidade:</strong> Componentes acessíveis por padrão (WCAG 2.1)</li>
            <li><strong>Customização:</strong> Fácil de personalizar via CSS variables</li>
            <li><strong>Performance:</strong> Componentes otimizados e tree-shakeable</li>
          </ul>

          <h3>Stack Tecnológica</h3>
          <ul>
            <li><strong>Tailwind CSS 4:</strong> Framework CSS utility-first</li>
            <li><strong>Radix UI:</strong> Primitivos acessíveis para React</li>
            <li><strong>Lucide Icons:</strong> Ícones consistentes e otimizados</li>
            <li><strong>CVA:</strong> Class Variance Authority para variantes</li>
          </ul>
        </div>
      </div>

      {/* Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Cores</CardTitle>
          <CardDescription>
            Paleta de cores do sistema com suporte a tema claro e escuro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-12 rounded-md bg-primary" />
              <p className="text-sm font-medium">Primary</p>
            </div>
            <div className="space-y-2">
              <div className="h-12 rounded-md bg-secondary" />
              <p className="text-sm font-medium">Secondary</p>
            </div>
            <div className="space-y-2">
              <div className="h-12 rounded-md bg-accent" />
              <p className="text-sm font-medium">Accent</p>
            </div>
            <div className="space-y-2">
              <div className="h-12 rounded-md bg-muted" />
              <p className="text-sm font-medium">Muted</p>
            </div>
            <div className="space-y-2">
              <div className="h-12 rounded-md bg-destructive" />
              <p className="text-sm font-medium">Destructive</p>
            </div>
            <div className="space-y-2">
              <div className="h-12 rounded-md border bg-background" />
              <p className="text-sm font-medium">Background</p>
            </div>
            <div className="space-y-2">
              <div className="h-12 rounded-md bg-card border" />
              <p className="text-sm font-medium">Card</p>
            </div>
            <div className="space-y-2">
              <div className="h-12 rounded-md border" />
              <p className="text-sm font-medium">Border</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spacing */}
      <Card>
        <CardHeader>
          <CardTitle>Espaçamento</CardTitle>
          <CardDescription>
            Sistema de espaçamento baseado em múltiplos de 4px
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            {[1, 2, 3, 4, 6, 8, 12, 16].map((size) => (
              <div key={size} className="text-center">
                <div
                  className="bg-primary rounded"
                  style={{ width: size * 4, height: size * 4 }}
                />
                <p className="text-xs text-muted-foreground mt-2">{size * 4}px</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
