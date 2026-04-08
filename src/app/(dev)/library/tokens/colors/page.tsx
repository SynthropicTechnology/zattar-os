import {
  DemoPageHeader,
  DemoSection,
  DemoSwatch,
} from '../../_components/demo-section'

const SEMANTIC_TOKENS = [
  { token: 'primary', label: 'Primary' },
  { token: 'secondary', label: 'Secondary' },
  { token: 'accent', label: 'Accent' },
  { token: 'muted', label: 'Muted' },
  { token: 'destructive', label: 'Destructive' },
  { token: 'success', label: 'Success' },
  { token: 'warning', label: 'Warning' },
  { token: 'info', label: 'Info' },
]

const SURFACE_TOKENS = [
  { token: 'background', label: 'Background' },
  { token: 'card', label: 'Card' },
  { token: 'surface', label: 'Surface' },
  { token: 'surface-container-low', label: 'Surface Container Low' },
  { token: 'surface-container', label: 'Surface Container' },
  { token: 'surface-container-high', label: 'Surface Container High' },
  { token: 'surface-container-highest', label: 'Surface Container Highest' },
]

const CHART_TOKENS = [
  { token: 'chart-1', label: 'Chart 1' },
  { token: 'chart-2', label: 'Chart 2' },
  { token: 'chart-3', label: 'Chart 3' },
  { token: 'chart-4', label: 'Chart 4' },
  { token: 'chart-5', label: 'Chart 5' },
]

const PORTAL_TOKENS = [
  { token: 'portal-bg', label: 'Portal Bg' },
  { token: 'portal-card', label: 'Portal Card' },
  { token: 'portal-primary', label: 'Portal Primary' },
  { token: 'portal-success', label: 'Portal Success' },
  { token: 'portal-warning', label: 'Portal Warning' },
  { token: 'portal-danger', label: 'Portal Danger' },
  { token: 'portal-info', label: 'Portal Info' },
]

export default function ColorsPage() {
  return (
    <div>
      <DemoPageHeader
        eyebrow="Tokens"
        title="Cores semânticas"
        description="Tokens canônicos do design system Synthropic. Definidos em globals.css com variantes light/dark automáticas. Use SEMPRE estes em vez de cores Tailwind cruas."
      />

      <DemoSection
        title="Semantic"
        description="Use estes para qualquer cor com significado: status (success, warning, destructive, info), brand (primary, accent), neutros (secondary, muted)."
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {SEMANTIC_TOKENS.map((t) => (
            <DemoSwatch key={t.token} token={t.token} label={t.label} />
          ))}
        </div>
      </DemoSection>

      <DemoSection
        title="Surfaces (MD3 hierarchy)"
        description="Camadas de fundo do Material Design 3. background é o nível mais baixo, surface-container-highest o mais alto."
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {SURFACE_TOKENS.map((t) => (
            <DemoSwatch key={t.token} token={t.token} label={t.label} />
          ))}
        </div>
      </DemoSection>

      <DemoSection
        title="Charts"
        description="5 cores categóricas para data visualization. Recharts e mini-charts consomem via var(--chart-N)."
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {CHART_TOKENS.map((t) => (
            <DemoSwatch key={t.token} token={t.token} label={t.label} />
          ))}
        </div>
      </DemoSection>

      <DemoSection
        title="Portal namespace"
        description="Tokens dedicados ao Portal do Cliente. Permitem reskin do portal sem tocar no app interno."
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {PORTAL_TOKENS.map((t) => (
            <DemoSwatch key={t.token} token={t.token} label={t.label} />
          ))}
        </div>
      </DemoSection>
    </div>
  )
}
