import { Smartphone, Monitor, Tablet, Maximize2, Zap, TestTube } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const breakpoints = [
  { prefix: 'Base', minWidth: '0px', maxWidth: '480px', description: 'Smartphones pequenos', icon: Smartphone },
  { prefix: 'sm', minWidth: '481px', maxWidth: '767px', description: 'Smartphones médios/grandes', icon: Smartphone },
  { prefix: 'md', minWidth: '768px', maxWidth: '1024px', description: 'Tablets', icon: Tablet },
  { prefix: 'lg', minWidth: '1025px', maxWidth: '1280px', description: 'Desktops pequenos', icon: Monitor },
  { prefix: 'xl', minWidth: '1281px', maxWidth: '1535px', description: 'Desktops grandes', icon: Monitor },
  { prefix: '2xl', minWidth: '1536px', maxWidth: '∞', description: 'Ultra-wide', icon: Maximize2 },
];

const adaptations = [
  {
    range: '320–480px',
    name: 'Mobile Base',
    features: [
      'Conteúdo em uma coluna',
      'Sheets/Dialog com max-w-[min(92vw,25rem)]',
      'Alvos de toque ≥44px',
    ],
  },
  {
    range: '481–767px',
    name: 'sm (Smartphones)',
    features: [
      'Grids 2 colunas quando viável',
      'Sheets/Dialog sm:max-w-[min(92vw,33.75rem)]',
    ],
  },
  {
    range: '768–1024px',
    name: 'md (Tablets)',
    features: [
      'Grids 2–3 colunas',
      'Controles mais espaçados',
    ],
  },
  {
    range: '1025–1280px',
    name: 'lg (Desktops)',
    features: [
      'Layouts em 3–4 colunas',
      'Sidebar visível permanentemente',
    ],
  },
  {
    range: '1281px+',
    name: 'xl/2xl (Largos)',
    features: [
      'Layouts amplos',
      'Limites máximos em rem para legibilidade',
    ],
  },
];

export default function ResponsividadePage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Smartphone className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Responsividade</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Guia de design responsivo Mobile-First para o Synthropic.
        </p>
      </div>

      {/* Breakpoints */}
      <Card>
        <CardHeader>
          <CardTitle>Breakpoints</CardTitle>
          <CardDescription>
            Definições em <code className="bg-muted px-1 rounded">app/globals.css</code> dentro de <code className="bg-muted px-1 rounded">@theme inline</code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Prefixo</TableHead>
                <TableHead>Min Width</TableHead>
                <TableHead>Dispositivo</TableHead>
                <TableHead>Media Query</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {breakpoints.map((bp) => (
                <TableRow key={bp.prefix}>
                  <TableCell>
                    <Badge variant={bp.prefix === 'Base' ? 'outline' : 'secondary'}>
                      {bp.prefix === 'Base' ? 'base' : `${bp.prefix}:`}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{bp.minWidth}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <bp.icon className="h-4 w-4 text-muted-foreground" />
                      {bp.description}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {bp.prefix === 'Base' ? 'Estilos sem prefixo' : `@media (min-width: ${bp.minWidth})`}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Abordagem Mobile-First */}
      <Card>
        <CardHeader>
          <CardTitle>Abordagem Mobile-First</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Comece com estilos base para mobile e escale progressivamente com <code className="bg-muted px-1 rounded">sm:</code>, <code className="bg-muted px-1 rounded">md:</code>, <code className="bg-muted px-1 rounded">lg:</code>...
          </p>
          <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
{`// Exemplo de grid responsivo
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
  {/* Conteúdo */}
</div>

// Exemplo de espaçamento responsivo
<div className="p-4 sm:p-6 md:p-8 lg:p-10">
  {/* Conteúdo */}
</div>`}
          </pre>
        </CardContent>
      </Card>

      {/* Adaptações por Faixa */}
      <Card>
        <CardHeader>
          <CardTitle>Adaptações por Faixa</CardTitle>
          <CardDescription>Comportamentos específicos para cada tamanho de tela</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {adaptations.map((adapt) => (
              <div key={adapt.range} className="border-l-2 border-primary pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{adapt.range}</Badge>
                  <span className="font-semibold">{adapt.name}</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {adapt.features.map((feature, i) => (
                    <li key={i}>{feature}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Unidades Relativas */}
      <Card>
        <CardHeader>
          <CardTitle>Unidades Relativas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Tipografia/Spacing</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">rem</Badge>
                <Badge variant="secondary">em</Badge>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Tamanhos Responsivos</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">%</Badge>
                <Badge variant="secondary">vw</Badge>
                <Badge variant="secondary">vh</Badge>
                <Badge variant="secondary">min()</Badge>
                <Badge variant="secondary">max()</Badge>
                <Badge variant="secondary">clamp()</Badge>
              </div>
            </div>
          </div>
          <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
{`// Padrão recomendado: limitar larguras com min()
className="max-w-[min(92vw,25rem)]"

// Evite px rígidos - prefira rem ou expressões
// ❌ width: 400px
// ✅ max-width: min(92vw, 25rem)`}
          </pre>
        </CardContent>
      </Card>

      {/* Motion e Toque */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              <CardTitle className="text-lg">Motion</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Respeite preferências de movimento reduzido:
            </p>
            <pre className="text-sm bg-muted p-3 rounded-md overflow-x-auto">
{`@media (prefers-reduced-motion: reduce) {
  /* Desativa/encurta animações */
}`}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              <CardTitle className="text-lg">Alvos de Toque</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Garanta alvos mínimos para toque:
            </p>
            <pre className="text-sm bg-muted p-3 rounded-md overflow-x-auto">
{`@media (pointer: coarse) {
  /* min-height/min-width: 44px */
}`}
            </pre>
          </CardContent>
        </Card>
      </div>

      {/* Performance */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            <CardTitle>Performance</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Imagens</h4>
            <p className="text-sm text-muted-foreground">
              Use <code className="bg-muted px-1 rounded">next/image</code> com formatos AVIF/WebP configurados em <code className="bg-muted px-1 rounded">next.config.ts</code>
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Listas Longas</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Utilitário <code className="bg-muted px-1 rounded">.content-auto</code> aplica:
            </p>
            <pre className="text-sm bg-muted p-3 rounded-md overflow-x-auto">
{`content-visibility: auto;
contain-intrinsic-size: auto 500px;`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Testes */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            <CardTitle>Testes Automatizados</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Suíte Playwright em <code className="bg-muted px-1 rounded">e2e/responsiveness.spec.ts</code>
          </p>
          <div>
            <h4 className="font-semibold mb-2">O que é testado:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Viewports representativos</li>
              <li>Orientação retrato/paisagem</li>
              <li>Legibilidade mínima (fonte ≥14px)</li>
              <li>Tamanho de alvo de toque em páginas principais</li>
            </ul>
          </div>
          <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
{`# Executar testes
npm run test:e2e`}
          </pre>
        </CardContent>
      </Card>

      {/* Onde Editar */}
      <Card>
        <CardHeader>
          <CardTitle>Onde Editar</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Breakpoints/theme:</strong>{' '}
              <code className="bg-muted px-1 rounded">app/globals.css</code> (<code className="bg-muted px-1 rounded">@theme inline</code>)
            </li>
            <li>
              <strong className="text-foreground">Variantes motion/toque:</strong>{' '}
              <code className="bg-muted px-1 rounded">app/globals.css</code> (<code className="bg-muted px-1 rounded">@layer base</code>)
            </li>
            <li>
              <strong className="text-foreground">Sheets/Dialog:</strong>{' '}
              Classes <code className="bg-muted px-1 rounded">max-w-[min(92vw,XXrem)]</code> em arquivos de páginas
            </li>
            <li>
              <strong className="text-foreground">Componente Sheet:</strong>{' '}
              <code className="bg-muted px-1 rounded">components/ui/sheet.tsx</code>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Convenções */}
      <Card>
        <CardHeader>
          <CardTitle>Convenções</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>
              <strong className="text-foreground">Mobile-first:</strong> Comece com base para mobile e escale com <code className="bg-muted px-1 rounded">sm:</code>, <code className="bg-muted px-1 rounded">md:</code>, <code className="bg-muted px-1 rounded">lg:</code>...
            </li>
            <li>
              <strong className="text-foreground">Evite px rígidos:</strong> Prefira <code className="bg-muted px-1 rounded">rem</code> ou expressões com <code className="bg-muted px-1 rounded">vw/vh</code> + teto em <code className="bg-muted px-1 rounded">rem</code>
            </li>
            <li>
              <strong className="text-foreground">Legibilidade:</strong> Checar contraste e tamanho mínimo de fonte
            </li>
            <li>
              <strong className="text-foreground">Overflow:</strong> Use <code className="bg-muted px-1 rounded">overflow-x-auto</code> em tabelas/listas densas
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
