import { ToneDot } from '@/components/ui/tone-dot'
import type { SemanticTone } from '@/lib/design-system'
import {
  DemoPageHeader,
  DemoSection,
  DemoCanvas,
  DemoLabel,
  UsageInProduction,
} from '../../_components/demo-section'

const TONES: SemanticTone[] = [
  'success',
  'info',
  'primary',
  'accent',
  'warning',
  'destructive',
  'neutral',
]

export default function ToneDotPage() {
  return (
    <div>
      <DemoPageHeader
        eyebrow="Shared"
        title="ToneDot"
        description="Indicador visual colorido reutilizável para legends e marcadores. Extraído após ~22 ocorrências iguais nos widgets do dashboard. Centraliza o padrão 'bolinha colorida que representa um item de legend' em 4 shapes × 3 sizes."
      />

      <DemoSection
        title="4 shapes × 3 sizes"
        description="Cobre todos os padrões encontrados nos widgets legados. Cada shape corresponde a um contexto visual comum."
      >
        <div className="space-y-6">
          {(['dot', 'square', 'bullet', 'pill'] as const).map((shape) => (
            <DemoCanvas key={shape}>
              <DemoLabel>shape=&quot;{shape}&quot;</DemoLabel>
              <div className="flex items-center gap-8">
                {(['sm', 'md', 'lg'] as const).map((size) => (
                  <div key={size} className="flex flex-col items-center gap-2">
                    <ToneDot tone="primary" shape={shape} size={size} />
                    <code className="font-mono text-[9px] text-muted-foreground">
                      size=&quot;{size}&quot;
                    </code>
                  </div>
                ))}
              </div>
            </DemoCanvas>
          ))}
        </div>
      </DemoSection>

      <DemoSection
        title="7 tons semânticos principais"
        description="Todos os tons do helper tokenForTone funcionam (incluindo chart-1..5). Aqui mostramos os 7 mais usados em contexto semântico."
      >
        <DemoCanvas className="space-y-4">
          <div>
            <DemoLabel>shape=&quot;dot&quot; (default)</DemoLabel>
            <div className="flex flex-wrap items-center gap-4">
              {TONES.map((tone) => (
                <div key={tone} className="flex items-center gap-2">
                  <ToneDot tone={tone} aria-label={tone} />
                  <code className="font-mono text-[10px] text-muted-foreground">
                    {tone}
                  </code>
                </div>
              ))}
            </div>
          </div>
          <div>
            <DemoLabel>shape=&quot;square&quot;</DemoLabel>
            <div className="flex flex-wrap items-center gap-4">
              {TONES.map((tone) => (
                <div key={tone} className="flex items-center gap-2">
                  <ToneDot tone={tone} shape="square" aria-label={tone} />
                  <code className="font-mono text-[10px] text-muted-foreground">
                    {tone}
                  </code>
                </div>
              ))}
            </div>
          </div>
        </DemoCanvas>
      </DemoSection>

      <DemoSection
        title="Legend realista de donut chart"
        description="Simulação de como o ToneDot aparece dentro de uma legenda típica de widget do dashboard."
      >
        <DemoCanvas>
          <div className="flex flex-col gap-2 max-w-xs">
            {[
              { tone: 'success' as SemanticTone, label: 'Pagas', value: 142 },
              { tone: 'warning' as SemanticTone, label: 'Pendentes', value: 28 },
              { tone: 'destructive' as SemanticTone, label: 'Atrasadas', value: 5 },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <ToneDot tone={item.tone} shape="square" size="lg" aria-label={item.label} />
                <span className="text-xs text-muted-foreground/70 flex-1">
                  {item.label}
                </span>
                <span className="text-xs font-medium tabular-nums">{item.value}</span>
              </div>
            ))}
          </div>
        </DemoCanvas>
      </DemoSection>

      <DemoSection
        title="Fallback com color prop"
        description="Quando o dado não tem tone semântico (ex: legacy), aceite color diretamente. Útil para dados do banco com cores customizadas."
      >
        <DemoCanvas>
          <pre className="overflow-x-auto text-xs leading-relaxed">
            <code>{`// Com tone (preferido)
<ToneDot tone="success" />

// Com cor CSS direta (fallback)
<ToneDot color="var(--palette-14)" />
<ToneDot color={tag.cor} />  // tag.cor = hex do banco

// Fallback automático (sem tone nem color) = muted-foreground
<ToneDot />`}</code>
          </pre>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <ToneDot tone="success" />
              <code className="font-mono text-[10px] text-muted-foreground">tone</code>
            </div>
            <div className="flex items-center gap-2">
              <ToneDot color="var(--palette-14)" />
              <code className="font-mono text-[10px] text-muted-foreground">color</code>
            </div>
            <div className="flex items-center gap-2">
              <ToneDot />
              <code className="font-mono text-[10px] text-muted-foreground">fallback</code>
            </div>
          </div>
        </DemoCanvas>
      </DemoSection>

      <DemoSection
        title="API"
      >
        <DemoCanvas>
          <pre className="overflow-x-auto text-xs leading-relaxed">
            <code>{`import { ToneDot } from '@/components/ui/tone-dot'

interface ToneDotProps {
  tone?: SemanticTone         // preferido
  color?: string              // fallback (hex ou var())
  shape?: 'dot' | 'square' | 'pill' | 'bullet'  // default: 'dot'
  size?: 'sm' | 'md' | 'lg'   // default: 'md'
  className?: string
  'aria-label'?: string       // default: 'indicator'
}`}</code>
          </pre>
        </DemoCanvas>
      </DemoSection>

      <UsageInProduction
        sites={[
          {
            file: 'src/app/(authenticated)/dashboard/widgets/contratos/parcelas-status.tsx',
            snippet: `{parcelasStatus.map((p) => (
  <div key={p.status} className="flex items-center gap-2">
    <ToneDot tone={p.tone} shape="square" size="lg" aria-label={p.status} />
    <span>{p.status}</span>
    <span>{fmtNum(p.count)}</span>
  </div>
))}`,
            note: 'Legend do donut chart. shape="square" size="lg" replica exatamente o estilo visual original do widget (size-2.5 rounded-[3px]).',
          },
          {
            file: 'src/app/(authenticated)/dashboard/widgets/processos/aging.tsx',
            snippet: `<ToneDot tone={seg.tone} shape="bullet" aria-label={seg.label} />`,
            note: 'Bullet do stacked bar. shape="bullet" é o único que usa rounded-sm (quadrado levemente arredondado), ideal para marcadores sobre barras empilhadas.',
          },
          {
            file: 'src/app/(authenticated)/dashboard/widgets/processos/status-distribuicao.tsx',
            snippet: `<ToneDot tone={seg.tone} color={!seg.tone ? seg.color : undefined} aria-label={seg.label} />`,
            note: 'Fallback duplo: usa tone quando disponível, cai para color string quando o segment é do fallback legacy (sem porStatus do repository).',
          },
        ]}
      />

      <DemoSection title="Quando NÃO usar">
        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">Progress bars com width dinâmico</strong> — o
            ToneDot tem tamanho fixo (sm/md/lg). Para barras com <code>width: ${'{'}pct{'}'}%</code>,
            continue usando <code>style={'{{'}width, backgroundColor: tokenForTone(tone){'}}'}</code>.
          </li>
          <li>
            <strong className="text-foreground">Charts SVG (MiniDonut, Treemap, StackedBar)</strong>{' '}
            — esses primitivos recebem cor como prop string (não como React node). Passe
            <code> tokenForTone(tone)</code> no mapping do array <code>segments</code>.
          </li>
          <li>
            <strong className="text-foreground">Ícones grandes coloridos</strong> — use Lucide
            icons com <code>className={'"text-primary"'}</code>. ToneDot é para indicadores
            pequenos (max size-3).
          </li>
        </ul>
      </DemoSection>
    </div>
  )
}
