'use client'

import React, { useState, useEffect } from 'react'
import { useFormularioStore } from '@/shared/assinatura-digital/store'
import VerificarCPF from './verificar-cpf'
import ContratosPendentesStep from './contratos-pendentes-step'
import DadosIdentidade from './dados-identidade'
import DadosContato from './dados-contato'
import DynamicFormStep from './dynamic-form-step'
import CapturaFotoStep from '../capture/captura-foto-step'
import VisualizacaoPdfStep from './visualizacao-pdf-step'
import VisualizacaoMarkdownStep from './visualizacao-markdown-step'
import TermosAceiteStep from './termos-aceite-step'
import AssinaturaManuscritaStep from './assinatura-manuscrita-step'
import Sucesso from './sucesso'
import { Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { StepConfig } from '@/shared/assinatura-digital/types/store'
import { PublicWizardShell } from '@/shared/assinatura-digital'

export default function FormularioContainer() {
  const etapaAtual = useFormularioStore((state) => state.etapaAtual)
  const etapaAnterior = useFormularioStore((state) => state.etapaAnterior)

  const templateIdSelecionado = useFormularioStore((state) => state.templateIdSelecionado)
  const templateIds = useFormularioStore((state) => state.templateIds)
  const getCachedTemplate = useFormularioStore((state) => state.getCachedTemplate)
  const stepConfigs = useFormularioStore((state) => state.stepConfigs)
  const setStepConfigs = useFormularioStore((state) => state.setStepConfigs)
  const formularioFlowConfig = useFormularioStore((state) => state.formularioFlowConfig)
  const contratosPendentes = useFormularioStore((state) => state.contratosPendentes)
  const setGeolocation = useFormularioStore((state) => state.setGeolocation)

  const [templateHasMarkdown, setTemplateHasMarkdown] = useState<boolean | null>(null)
  const [hasTemplateError, setHasTemplateError] = useState<boolean>(false)

  // Geolocation silenciosa (sem step dedicado): captura em background se permitido pelo form
  useEffect(() => {
    if (formularioFlowConfig?.geolocation_necessaria && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          setGeolocation(
            p.coords.latitude,
            p.coords.longitude,
            p.coords.accuracy,
            new Date().toISOString(),
          )
        },
        () => {
          // Ignora silenciosamente recusa — não bloqueia fluxo
        },
        { enableHighAccuracy: false, timeout: 10000 },
      )
    }
  }, [formularioFlowConfig?.geolocation_necessaria, setGeolocation])

  // Função que constrói configuração de etapas baseado na configuração do formulário
  const buildStepConfigs = (
    formularioConfig: { foto_necessaria?: boolean; geolocation_necessaria?: boolean } | null,
    temContratosPendentes: boolean = false,
  ): StepConfig[] => {
    const configs: StepConfig[] = [
      { id: 'cpf', index: 0, component: 'VerificarCPF', required: true, enabled: true },
    ]
    let currentIndex = 1

    if (temContratosPendentes) {
      configs.push({
        id: 'pendentes',
        index: currentIndex++,
        component: 'ContratosPendentesStep',
        required: false,
        enabled: true,
      })
    }

    configs.push(
      {
        id: 'identidade',
        index: currentIndex++,
        component: 'DadosIdentidade',
        required: true,
        enabled: true,
      },
      {
        id: 'contato',
        index: currentIndex++,
        component: 'DadosContato',
        required: true,
        enabled: true,
      },
      {
        id: 'acao',
        index: currentIndex++,
        component: 'DynamicFormStep',
        required: true,
        enabled: true,
      },
      {
        id: 'visualizacao',
        index: currentIndex++,
        component: 'VisualizacaoPdfStep',
        required: true,
        enabled: true,
      },
    )

    const fotoNecessaria = formularioConfig?.foto_necessaria ?? true
    if (fotoNecessaria) {
      configs.push({
        id: 'foto',
        index: currentIndex++,
        component: 'CapturaFotoStep',
        required: true,
        enabled: true,
      })
    }

    // Termos + Assinatura + Sucesso sempre presentes
    configs.push(
      {
        id: 'termos',
        index: currentIndex++,
        component: 'TermosAceiteStep',
        required: true,
        enabled: true,
      },
      {
        id: 'assinatura',
        index: currentIndex++,
        component: 'AssinaturaManuscritaStep',
        required: true,
        enabled: true,
      },
      { id: 'sucesso', index: currentIndex++, component: 'Sucesso', required: true, enabled: true },
    )

    return configs
  }

  useEffect(() => {
    const temPendentes = (contratosPendentes?.length ?? 0) > 0
    const configs = buildStepConfigs(formularioFlowConfig, temPendentes)
    setStepConfigs(configs)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formularioFlowConfig, contratosPendentes])

  // Verificar se template possui conteúdo Markdown (para decidir entre Markdown/PDF)
  useEffect(() => {
    const isVisualizacaoStep = stepConfigs?.find(
      (s) => s.index === etapaAtual && s.component === 'VisualizacaoPdfStep',
    )
    if (!isVisualizacaoStep) {
      setTemplateHasMarkdown(null)
      setHasTemplateError(false)
      return
    }

    const effectiveTemplateId = templateIdSelecionado || templateIds?.[0]
    if (!effectiveTemplateId) {
      setTemplateHasMarkdown(false)
      setHasTemplateError(true)
      return
    }

    const cachedTemplate = getCachedTemplate(effectiveTemplateId)
    if (!cachedTemplate) {
      console.warn('Template não encontrado no cache:', effectiveTemplateId)
      setTemplateHasMarkdown(false)
      setHasTemplateError(true)
      return
    }

    setHasTemplateError(false)
    const hasMarkdown =
      !!cachedTemplate.conteudo_markdown && cachedTemplate.conteudo_markdown.trim() !== ''
    setTemplateHasMarkdown(hasMarkdown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapaAtual, templateIdSelecionado, templateIds, stepConfigs])

  const renderEtapa = () => {
    if (!stepConfigs || stepConfigs.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-medium text-muted-foreground">Carregando formulário...</p>
        </div>
      )
    }

    const currentStepConfig = stepConfigs.find((s) => s.index === etapaAtual)

    if (!currentStepConfig) {
      console.error('Etapa inválida:', etapaAtual)
      return <VerificarCPF />
    }

    switch (currentStepConfig.component) {
      case 'VerificarCPF':
        return <VerificarCPF />
      case 'ContratosPendentesStep':
        return <ContratosPendentesStep />
      case 'DadosIdentidade':
        return <DadosIdentidade />
      case 'DadosContato':
        return <DadosContato />
      case 'DynamicFormStep':
        return <DynamicFormStep />
      case 'VisualizacaoPdfStep':
        if (hasTemplateError) {
          return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 max-w-2xl mx-auto">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Template não encontrado</AlertTitle>
                <AlertDescription className="mt-2 space-y-3">
                  <p>
                    Não foi possível encontrar um template associado a este formulário. Por favor,
                    volte e tente novamente ou entre em contato com o suporte.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={etapaAnterior}
                    className="mt-2 cursor-pointer"
                  >
                    Voltar
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          )
        }
        if (templateHasMarkdown === null) {
          return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium text-muted-foreground">
                Carregando visualização...
              </p>
            </div>
          )
        }
        return templateHasMarkdown ? <VisualizacaoMarkdownStep /> : <VisualizacaoPdfStep />
      case 'CapturaFotoStep':
        return <CapturaFotoStep />
      case 'TermosAceiteStep':
        return <TermosAceiteStep />
      case 'AssinaturaManuscritaStep':
        return <AssinaturaManuscritaStep />
      case 'Sucesso':
        return <Sucesso />
      default:
        console.error('Componente desconhecido:', currentStepConfig.component)
        return <VerificarCPF />
    }
  }

  const currentId = stepConfigs?.find((c) => c.index === etapaAtual)?.id ?? 'cpf'
  const isSuccessStep = currentId === 'sucesso'

  return (
    <PublicWizardShell tint={isSuccessStep ? 'success' : 'primary'}>
      <StepTransition stepKey={etapaAtual}>{renderEtapa()}</StepTransition>
    </PublicWizardShell>
  )
}

/**
 * Transição sutil entre steps: fade + deslocamento horizontal curto.
 * Respeita prefers-reduced-motion — usuários com motion reduzido só veem
 * a mudança do conteúdo sem animação.
 */
function StepTransition({
  stepKey,
  children,
}: {
  stepKey: number
  children: React.ReactNode
}) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={stepKey}
        initial={prefersReducedMotion ? false : { opacity: 0, x: 12 }}
        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
        exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -12 }}
        transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
        className="flex h-full min-h-0 flex-1 flex-col"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
