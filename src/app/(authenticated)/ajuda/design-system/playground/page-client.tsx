'use client';

/**
 * Design System Playground
 * 
 * Interface de teste para componentes do Design System Synthropic.
 * Facilita o desenvolvimento e QA de componentes visuais.
 * 
 * FEATURES:
 * - Visualização de todos os estados dos componentes
 * - Theme Toggler local (Light/Dark)
 * - Cards de referência rápida
 * - Estados: Default, Hover, Disabled, Loading
 */

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Sun, 
  Moon, 
  Loader2, 
  Check, 
  X, 
  AlertCircle,
  Star,
  Play,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Theme = 'light' | 'dark';

export default function PlaygroundPage() {
  const [theme, setTheme] = React.useState<Theme>('light');
  const [isLoading, setIsLoading] = React.useState(false);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const simulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className={theme}>
      <div className="min-h-screen bg-background text-foreground transition-colors">
        {/* Header */}
        <div className="border-b bg-card">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Design System Playground</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Teste e explore os componentes do Synthropic
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="font-mono">
                  v1.0.0
                </Badge>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={toggleTheme}
                  aria-label="Alternar tema"
                >
                  {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-6 py-8">
          <div className="space-y-8">
            {/* Theme Info */}
            <Card>
              <CardHeader>
                <CardTitle>Tema Atual</CardTitle>
                <CardDescription>
                  Alterne entre light e dark para testar os componentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'px-4 py-2 rounded-md border-2 font-medium',
                    theme === 'light' && 'bg-primary text-primary-foreground border-primary',
                    theme === 'dark' && 'border-muted-foreground'
                  )}>
                    Light
                  </div>
                  <div className={cn(
                    'px-4 py-2 rounded-md border-2 font-medium',
                    theme === 'dark' && 'bg-primary text-primary-foreground border-primary',
                    theme === 'light' && 'border-muted-foreground'
                  )}>
                    Dark
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Buttons Section */}
            <Card>
              <CardHeader>
                <CardTitle>Buttons</CardTitle>
                <CardDescription>
                  Todas as variantes e tamanhos disponíveis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Variants */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">Variantes</Label>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="default">Default</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="destructive">Destructive</Button>
                    <Button variant="link">Link</Button>
                  </div>
                </div>

                {/* Sizes */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">Tamanhos</Label>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button size="sm">Small</Button>
                    <Button size="default">Default</Button>
                    <Button size="lg">Large</Button>
                    <Button size="icon-sm"><Settings /></Button>
                    <Button size="icon" aria-label="Configurações"><Settings /></Button>
                    <Button size="icon-lg"><Settings /></Button>
                  </div>
                </div>

                {/* States */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">Estados</Label>
                  <div className="flex flex-wrap gap-3">
                    <Button>Normal</Button>
                    <Button disabled>Disabled</Button>
                    <Button onClick={simulateLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="animate-spin" />
                          Carregando...
                        </>
                      ) : (
                        <>
                          <Play />
                          Simular Loading
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* With Icons */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">Com Ícones</Label>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="default">
                      <Check />
                      Confirmar
                    </Button>
                    <Button variant="destructive">
                      <X />
                      Cancelar
                    </Button>
                    <Button variant="outline">
                      <Star />
                      Favoritar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Badges Section */}
            <Card>
              <CardHeader>
                <CardTitle>Badges</CardTitle>
                <CardDescription>
                  Indicadores visuais de status e categorias
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Variants */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">Variantes</Label>
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="default">Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge variant="destructive">Destructive</Badge>
                    <Badge variant="success">Success</Badge>
                    <Badge variant="warning">Warning</Badge>
                    <Badge variant="info">Info</Badge>
                    <Badge variant="neutral">Neutral</Badge>
                    <Badge variant="accent">Accent</Badge>
                  </div>
                </div>

                {/* With Icons */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">Com Ícones</Label>
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="success">
                      <Check />
                      Aprovado
                    </Badge>
                    <Badge variant="warning">
                      <AlertCircle />
                      Pendente
                    </Badge>
                    <Badge variant="destructive">
                      <X />
                      Rejeitado
                    </Badge>
                  </div>
                </div>

                {/* Use Cases */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">Casos de Uso</Label>
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="outline">23 Processos</Badge>
                    <Badge variant="default">Urgente</Badge>
                    <Badge variant="success">Ativo</Badge>
                    <Badge variant="destructive">Vencido</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Inputs Section */}
            <Card>
              <CardHeader>
                <CardTitle>Inputs</CardTitle>
                <CardDescription>
                  Campos de entrada de dados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* States */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="input-default">Default</Label>
                    <Input 
                      id="input-default" 
                      placeholder="Digite algo..." 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="input-disabled">Disabled</Label>
                    <Input 
                      id="input-disabled" 
                      placeholder="Campo desabilitado" 
                      disabled 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="input-filled">Com Valor</Label>
                    <Input 
                      id="input-filled" 
                      defaultValue="Valor preenchido" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="input-error">Com Erro (aria-invalid)</Label>
                    <Input 
                      id="input-error" 
                      placeholder="Campo com erro" 
                      aria-invalid
                    />
                    <p className="text-xs text-destructive">Este campo é obrigatório</p>
                  </div>
                </div>

                {/* Types */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="input-email">Email</Label>
                    <Input 
                      id="input-email" 
                      type="email" 
                      placeholder="usuario@exemplo.com" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="input-password">Password</Label>
                    <Input 
                      id="input-password" 
                      type="password" 
                      placeholder="********" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="input-number">Number</Label>
                    <Input 
                      id="input-number" 
                      type="number" 
                      placeholder="0" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="input-date">Date</Label>
                    <Input 
                      id="input-date" 
                      type="date" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Color Palette Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Paleta de Cores</CardTitle>
                <CardDescription>
                  Cores semânticas do sistema (OKLCH)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <ColorSwatch name="Background" className="bg-background border" />
                  <ColorSwatch name="Foreground" className="bg-foreground" />
                  <ColorSwatch name="Primary" className="bg-primary" />
                  <ColorSwatch name="Secondary" className="bg-secondary" />
                  <ColorSwatch name="Muted" className="bg-muted border" />
                  <ColorSwatch name="Accent" className="bg-accent border" />
                  <ColorSwatch name="Destructive" className="bg-destructive" />
                  <ColorSwatch name="Border" className="bg-border border-4 border-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Component
function ColorSwatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="space-y-2">
      <div className={cn('h-20 rounded-md', className)} />
      <p className="text-sm font-medium text-center">{name}</p>
    </div>
  );
}
