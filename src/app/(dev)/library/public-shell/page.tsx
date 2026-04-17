/**
 * DEV LIBRARY — Public Shell
 * ============================================================================
 * Showcase dos componentes do wizard público de assinatura digital em seus
 * diversos estados. Substituto enxuto de Storybook — vive em (dev)/ e não
 * vai pro build de produção.
 *
 * Cobre: PublicStepCard (chip tones), PublicStepFooter (loading/states),
 * PublicWizardProgress (Vertical com spine, Horizontal com barra).
 * ============================================================================
 */

import {
  PublicStepCard,
  PublicStepFooter,
  PublicWizardProgress,
  type PublicWizardStep,
} from '@/shared/assinatura-digital/components/public-shell'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DemoPageHeader,
  DemoSection,
  DemoCanvas,
  DemoLabel,
} from '../_components/demo-section'

const STEPS: PublicWizardStep[] = [
  { id: 'cpf', label: 'CPF' },
  { id: 'identidade', label: 'Identidade' },
  { id: 'contatos', label: 'Contatos' },
  { id: 'endereco', label: 'Endereço' },
  { id: 'acao', label: 'Ação' },
  { id: 'revisao', label: 'Revisão' },
  { id: 'selfie', label: 'Selfie' },
  { id: 'termos', label: 'Termos' },
  { id: 'assinar', label: 'Assinar' },
]

export default function PublicShellPage() {
  return (
    <div>
      <DemoPageHeader
        eyebrow="Public Shell"
        title="Wizard Público — componentes em estados"
        description="Showcase dos componentes do fluxo público de assinatura digital. Para visualizar o contexto real (com AmbientBackdrop e backdrop blur), veja uma rota real como /assinatura/[token]. Aqui cada componente é renderizado isolado pra inspeção rápida."
      />

      {/* PublicStepCard — tons de chip */}
      <DemoSection
        title="PublicStepCard — chip tones"
        description="Card central do wizard. Chip indica progresso (Etapa X de N). Três tons semânticos: primary (padrão), success (step final), info (informativo)."
      >
        <div className="space-y-6">
          <div>
            <DemoLabel>chipTone=&quot;primary&quot; (padrão)</DemoLabel>
            <DemoCanvas>
              <div className="h-[360px]">
                <PublicStepCard
                  title="Dados da Parte Contrária"
                  description="Busque ou cadastre a empresa contra quem será movida a ação."
                  chip="Etapa 5 de 9"
                >
                  <p className="text-sm text-muted-foreground">
                    Conteúdo do step aqui...
                  </p>
                </PublicStepCard>
              </div>
            </DemoCanvas>
          </div>

          <div>
            <DemoLabel>chipTone=&quot;success&quot; (tela final)</DemoLabel>
            <DemoCanvas>
              <div className="h-[260px]">
                <PublicStepCard
                  title="Pronto!"
                  description="Sua assinatura foi registrada com sucesso."
                  chip="Concluído"
                  chipTone="success"
                >
                  <p className="text-sm text-muted-foreground">
                    Conteúdo de sucesso aqui...
                  </p>
                </PublicStepCard>
              </div>
            </DemoCanvas>
          </div>

          <div>
            <DemoLabel>chipTone=&quot;info&quot; (informativo)</DemoLabel>
            <DemoCanvas>
              <div className="h-[260px]">
                <PublicStepCard
                  title="Revisão"
                  description="Confira os dados antes de prosseguir."
                  chip="Revisão necessária"
                  chipTone="info"
                >
                  <p className="text-sm text-muted-foreground">
                    Conteúdo de revisão aqui...
                  </p>
                </PublicStepCard>
              </div>
            </DemoCanvas>
          </div>

          <div>
            <DemoLabel>Sem chip (chip omitido)</DemoLabel>
            <DemoCanvas>
              <div className="h-[220px]">
                <PublicStepCard
                  title="Título simples"
                  description="Card sem chip de progresso."
                >
                  <p className="text-sm text-muted-foreground">
                    Conteúdo...
                  </p>
                </PublicStepCard>
              </div>
            </DemoCanvas>
          </div>
        </div>
      </DemoSection>

      {/* PublicStepCard — com inputs glass */}
      <DemoSection
        title="PublicStepCard — com Input variant=glass"
        description="Card preenchido com inputs glass pra visualizar coerência visual entre container e campos."
      >
        <DemoCanvas>
          <div className="h-[420px]">
            <PublicStepCard
              title="Dados de Contato"
              description="Como podemos entrar em contato."
              chip="Etapa 3 de 9"
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="demo-email">E-mail</Label>
                  <Input
                    id="demo-email"
                    variant="glass"
                    type="email"
                    placeholder="seu@email.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="demo-celular">Celular</Label>
                    <Input
                      id="demo-celular"
                      variant="glass"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="demo-telefone">Telefone</Label>
                    <Input
                      id="demo-telefone"
                      variant="glass"
                      placeholder="(00) 0000-0000"
                    />
                  </div>
                </div>
              </div>
            </PublicStepCard>
          </div>
        </DemoCanvas>
      </DemoSection>

      {/* PublicWizardProgress — Vertical */}
      <DemoSection
        title="PublicWizardProgress.Vertical"
        description="Barra de progresso vertical (sidebar desktop). Spine conector entre dots. Ring primary no step atual. Hint de auto-save opcional no rodapé."
      >
        <div className="space-y-6">
          <div>
            <DemoLabel>currentIndex=0 (início)</DemoLabel>
            <DemoCanvas className="max-w-xs">
              <PublicWizardProgress.Vertical steps={STEPS} currentIndex={0} />
            </DemoCanvas>
          </div>

          <div>
            <DemoLabel>currentIndex=4 (meio) — com hint de salvo</DemoLabel>
            <DemoCanvas className="max-w-xs">
              <PublicWizardProgress.Vertical
                steps={STEPS}
                currentIndex={4}
                resumeHint="Continuando de onde parou · salvo agora"
              />
            </DemoCanvas>
          </div>

          <div>
            <DemoLabel>currentIndex=8 (último) — com restart</DemoLabel>
            <DemoCanvas className="max-w-xs">
              <PublicWizardProgress.Vertical
                steps={STEPS}
                currentIndex={8}
                onRestart={() => alert('restart!')}
                resumeHint="salvo há 12 min"
              />
            </DemoCanvas>
          </div>
        </div>
      </DemoSection>

      {/* PublicWizardProgress — Horizontal */}
      <DemoSection
        title="PublicWizardProgress.Horizontal"
        description="Progress compacto (mobile/tablet). Barra com glow primary + contador X/N + label atual."
      >
        <div className="space-y-6">
          <div>
            <DemoLabel>currentIndex=2 (início)</DemoLabel>
            <DemoCanvas>
              <PublicWizardProgress.Horizontal steps={STEPS} currentIndex={2} />
            </DemoCanvas>
          </div>

          <div>
            <DemoLabel>currentIndex=5 (meio) — com hint</DemoLabel>
            <DemoCanvas>
              <PublicWizardProgress.Horizontal
                steps={STEPS}
                currentIndex={5}
                resumeHint="salvo há 3 min"
              />
            </DemoCanvas>
          </div>

          <div>
            <DemoLabel>currentIndex=8 (último, com restart)</DemoLabel>
            <DemoCanvas>
              <PublicWizardProgress.Horizontal
                steps={STEPS}
                currentIndex={8}
                onRestart={() => alert('restart!')}
              />
            </DemoCanvas>
          </div>
        </div>
      </DemoSection>

      {/* PublicStepFooter — estados */}
      <DemoSection
        title="PublicStepFooter — estados de botões"
        description="Footer sticky do wizard. Botões com visual glass. Mobile usa flex-1 (dividem espaço igualmente), desktop volta pra min-w fixo."
      >
        <div className="space-y-6">
          <div>
            <DemoLabel>Ambos botões (padrão)</DemoLabel>
            <DemoCanvas>
              <PublicStepFooter
                onPrevious={() => alert('voltar')}
                onNext={() => alert('continuar')}
              />
            </DemoCanvas>
          </div>

          <div>
            <DemoLabel>Só Continuar (primeiro step)</DemoLabel>
            <DemoCanvas>
              <PublicStepFooter onNext={() => alert('continuar')} />
            </DemoCanvas>
          </div>

          <div>
            <DemoLabel>Continuar desabilitado (validação pendente)</DemoLabel>
            <DemoCanvas>
              <PublicStepFooter
                onPrevious={() => alert('voltar')}
                onNext={() => alert('continuar')}
                isNextDisabled
              />
            </DemoCanvas>
          </div>

          <div>
            <DemoLabel>Loading (submit em progresso)</DemoLabel>
            <DemoCanvas>
              <PublicStepFooter
                onPrevious={() => alert('voltar')}
                onNext={() => alert('continuar')}
                isLoading
              />
            </DemoCanvas>
          </div>

          <div>
            <DemoLabel>Label customizado (step final)</DemoLabel>
            <DemoCanvas>
              <PublicStepFooter
                onPrevious={() => alert('voltar')}
                onNext={() => alert('assinar')}
                nextLabel="Assinar e finalizar"
              />
            </DemoCanvas>
          </div>
        </div>
      </DemoSection>

      {/* Rodapé com docs */}
      <div className="mt-12 rounded-xl border border-outline-variant/30 bg-surface-container-lowest/50 p-6">
        <h3 className="mb-2 font-headline text-lg font-semibold tracking-tight">
          Referências
        </h3>
        <ul className="space-y-1.5 text-sm">
          <li>
            <span className="text-muted-foreground">Código:</span>{' '}
            <code className="rounded bg-surface-container-low px-1.5 py-0.5 font-mono text-xs">
              src/shared/assinatura-digital/components/public-shell/
            </code>
          </li>
          <li>
            <span className="text-muted-foreground">Regras:</span>{' '}
            <code className="rounded bg-surface-container-low px-1.5 py-0.5 font-mono text-xs">
              public-shell/RULES.md
            </code>
          </li>
          <li>
            <span className="text-muted-foreground">Princípios:</span>{' '}
            <code className="rounded bg-surface-container-low px-1.5 py-0.5 font-mono text-xs">
              docs/architecture/PUBLIC-WIZARD-PRINCIPLES.md
            </code>
          </li>
          <li>
            <span className="text-muted-foreground">Testes:</span>{' '}
            <code className="rounded bg-surface-container-low px-1.5 py-0.5 font-mono text-xs">
              npx jest --testPathPatterns=&quot;public-wizard|form-step-layout|dynamic-form-renderer&quot;
            </code>
          </li>
        </ul>
      </div>
    </div>
  )
}
