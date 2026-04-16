/**
 * ASSINATURA DIGITAL - Formulário Store (Zustand)
 *
 * Gerenciamento de estado do formulário multi-step de assinatura digital.
 *
 * PERSISTÊNCIA:
 * - Middleware `persist` escreve em sessionStorage (limpa ao fechar aba)
 * - TTL de 30 minutos — após expirar, resetAll() é disparado no rehydrate
 * - partialize seletivo: NUNCA persiste fotoBase64, assinaturaBase64, lat/lng,
 *   pdfsGerados ou dadosAssinatura (dados sensíveis / biométricos)
 * - schemaVersion invalida cache em breaking changes
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type {
  FormularioStore,
  FormularioState,
  DadosCPF,
  DadosPessoaisStore,
  DadosPessoaisDraft,
  DadosContratoStore,
  DadosAssinaturaStore,
  PdfGerado,
  StepConfig,
  FormularioFlowConfig,
  ContratoPendente,
} from '../types'
import type { DynamicFormSchema, Template } from '../types'
import type { VisualizacaoPdfData, VisualizacaoMarkdownData } from '../types'
import { DEFAULT_TOTAL_STEPS } from '../constants'

const SCHEMA_VERSION = 1
const TTL_MS = 30 * 60 * 1000

const initialState: FormularioState = {
  segmentoId: null,
  formularioId: null,
  templateIds: null,
  templateIdSelecionado: null,
  sessaoId: null,
  formSchema: null,
  formularioNome: null,
  segmentoNome: null,
  formularioFlowConfig: null,
  cachedTemplates: new Map<string, Template>(),
  etapaAtual: 0,
  dadosCPF: null,
  dadosPessoais: null,
  dadosContrato: null,
  dadosVisualizacaoPdf: null,
  dadosVisualizacaoMarkdown: null,
  dadosAssinatura: null,
  pdfsGerados: null,
  fotoBase64: null,
  assinaturaBase64: null,
  latitude: null,
  longitude: null,
  geolocationAccuracy: null,
  geolocationTimestamp: null,
  termosAceite: null,
  termosVersao: null,
  termosDataAceite: null,
  contratosPendentes: null,
  stepConfigs: null,
  pdfUrlFinal: null,
  dadosPessoaisDraft: null,
  contratoJaCriado: false,
  _timestamp: null,
  _schemaVersion: null,
  isLoading: false,
  isSubmitting: false,
}

export const useFormularioStore = create<FormularioStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setContexto: (segmentoId: number, formularioId: number) =>
        set({ segmentoId, formularioId }),

      hydrateContext: (ctx) => {
        const currentSessaoId = get().sessaoId
        set({
          ...initialState,
          cachedTemplates: new Map<string, Template>(),
          segmentoId: ctx.segmentoId,
          formularioId: ctx.formularioId,
          sessaoId: currentSessaoId ?? uuidv4(),
          templateIds: ctx.templateIds || null,
          templateIdSelecionado:
            ctx.templateIds && ctx.templateIds.length === 1 ? ctx.templateIds[0] : null,
          formularioNome: ctx.formularioNome || null,
          segmentoNome: ctx.segmentoNome || null,
          formSchema: ctx.formSchema || null,
          formularioFlowConfig: ctx.flowConfig || null,
        })
      },

      setTemplateIds: (templateIds: string[]) => set({ templateIds }),

      setTemplateIdSelecionado: (templateId: string) =>
        set({
          templateIdSelecionado: templateId,
          dadosVisualizacaoPdf: null,
          dadosVisualizacaoMarkdown: null,
        }),

      setSessaoId: (sessaoId: string) => set({ sessaoId }),

      setFormSchema: (schema: DynamicFormSchema | null) => set({ formSchema: schema }),

      setFormularioFlowConfig: (config: FormularioFlowConfig | null) =>
        set({ formularioFlowConfig: config }),

      getCachedTemplate: (templateId: string) => {
        const { cachedTemplates } = get()
        return cachedTemplates.get(templateId)
      },

      setCachedTemplate: (templateId: string, template: Template) => {
        set((state) => {
          const newCache = new Map(state.cachedTemplates)
          newCache.set(templateId, template)
          return { cachedTemplates: newCache }
        })
      },

      clearTemplateCache: () => {
        set({ cachedTemplates: new Map<string, Template>() })
      },

      setEtapaAtual: (etapa: number) => set({ etapaAtual: etapa }),

      setDadosCPF: (dados: DadosCPF) => set({ dadosCPF: dados }),

      setDadosPessoais: (dados: DadosPessoaisStore) => set({ dadosPessoais: dados }),

      setDadosContrato: (dados: Partial<DadosContratoStore>) =>
        set((state) => ({
          dadosContrato: state.dadosContrato
            ? { ...state.dadosContrato, ...dados }
            : (dados as DadosContratoStore),
        })),

      setDadosVisualizacaoPdf: (dados: VisualizacaoPdfData | null) =>
        set(() => ({
          dadosVisualizacaoPdf: dados,
          ...(dados ? { dadosVisualizacaoMarkdown: null } : {}),
        })),

      setDadosVisualizacaoMarkdown: (dados: VisualizacaoMarkdownData | null) =>
        set(() => ({
          dadosVisualizacaoMarkdown: dados,
          ...(dados ? { dadosVisualizacaoPdf: null } : {}),
        })),

      setDadosAssinatura: (dados: DadosAssinaturaStore) => set({ dadosAssinatura: dados }),

      setPdfsGerados: (pdfs: PdfGerado[]) => set({ pdfsGerados: pdfs }),

      setFotoBase64: (foto: string) => set({ fotoBase64: foto }),

      setAssinaturaBase64: (assinatura: string) => set({ assinaturaBase64: assinatura }),

      setGeolocation: (
        latitude: number,
        longitude: number,
        accuracy: number,
        timestamp: string,
      ) =>
        set({
          latitude,
          longitude,
          geolocationAccuracy: accuracy,
          geolocationTimestamp: timestamp,
        }),

      clearGeolocation: () =>
        set({
          latitude: null,
          longitude: null,
          geolocationAccuracy: null,
          geolocationTimestamp: null,
        }),

      setTermosAceite: (aceite: boolean, versao: string, dataAceite: string) =>
        set({
          termosAceite: aceite,
          termosVersao: versao,
          termosDataAceite: dataAceite,
        }),

      clearTermosAceite: () =>
        set({
          termosAceite: null,
          termosVersao: null,
          termosDataAceite: null,
        }),

      setContratosPendentes: (contratos: ContratoPendente[]) =>
        set({ contratosPendentes: contratos }),

      clearContratosPendentes: () => set({ contratosPendentes: null }),

      mergeDadosPessoaisDraft: (patch: Partial<DadosPessoaisDraft>) =>
        set((state) => ({
          dadosPessoaisDraft: { ...(state.dadosPessoaisDraft ?? {}), ...patch },
        })),

      getDadosPessoaisDraft: () => get().dadosPessoaisDraft ?? {},

      resetDadosPessoaisDraft: () => set({ dadosPessoaisDraft: null }),

      setContratoJaCriado: (flag: boolean) => set({ contratoJaCriado: flag }),

      setStepConfigs: (configs: StepConfig[]) => set({ stepConfigs: configs }),

      getStepByIndex: (index: number) => {
        const { stepConfigs } = get()
        return stepConfigs?.find((s) => s.index === index)
      },

      getTotalSteps: () => {
        const { stepConfigs } = get()
        return stepConfigs?.length || DEFAULT_TOTAL_STEPS
      },

      getCurrentStepConfig: () => {
        const { etapaAtual, stepConfigs } = get()
        return stepConfigs?.find((s) => s.index === etapaAtual)
      },

      setPdfUrlFinal: (url: string | null) => set({ pdfUrlFinal: url }),

      setLoading: (isLoading: boolean) => set({ isLoading }),

      setSubmitting: (isSubmitting: boolean) => set({ isSubmitting }),

      resetFormulario: () =>
        set({
          etapaAtual: 0,
          dadosCPF: null,
          dadosPessoais: null,
          dadosContrato: null,
          dadosVisualizacaoPdf: null,
          dadosVisualizacaoMarkdown: null,
          dadosAssinatura: null,
          pdfsGerados: null,
          fotoBase64: null,
          assinaturaBase64: null,
          latitude: null,
          longitude: null,
          geolocationAccuracy: null,
          geolocationTimestamp: null,
          termosAceite: null,
          termosVersao: null,
          termosDataAceite: null,
          contratosPendentes: null,
          stepConfigs: null,
          sessaoId: null,
          formularioFlowConfig: null,
          pdfUrlFinal: null,
          dadosPessoaisDraft: null,
          contratoJaCriado: false,
          _timestamp: null,
          isLoading: false,
          isSubmitting: false,
        }),

      resetAll: () =>
        set({
          ...initialState,
          cachedTemplates: new Map<string, Template>(),
        }),

      proximaEtapa: () => {
        const { etapaAtual, stepConfigs } = get()
        const totalSteps = stepConfigs?.length || DEFAULT_TOTAL_STEPS
        if (etapaAtual < totalSteps - 1) {
          set({ etapaAtual: etapaAtual + 1, _timestamp: Date.now() })
        }
      },

      etapaAnterior: () => {
        const { etapaAtual } = get()
        if (etapaAtual > 0) {
          set({ etapaAtual: etapaAtual - 1, _timestamp: Date.now() })
        }
      },
    }),
    {
      name: 'zattar:assinatura-digital:wizard',
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          }
        }
        return window.sessionStorage
      }),
      // Persistência seletiva: fora do storage ficam dados sensíveis/biométricos,
      // loaders e cache de templates (que deve sempre ser regerado).
      partialize: (state) => ({
        segmentoId: state.segmentoId,
        formularioId: state.formularioId,
        sessaoId: state.sessaoId,
        etapaAtual: state.etapaAtual,
        dadosCPF: state.dadosCPF,
        dadosPessoais: state.dadosPessoais,
        dadosPessoaisDraft: state.dadosPessoaisDraft,
        dadosContrato: state.dadosContrato,
        termosAceite: state.termosAceite,
        termosVersao: state.termosVersao,
        termosDataAceite: state.termosDataAceite,
        contratosPendentes: state.contratosPendentes,
        contratoJaCriado: state.contratoJaCriado,
        stepConfigs: state.stepConfigs,
        _timestamp: Date.now(),
        _schemaVersion: SCHEMA_VERSION,
      }),
      // Rehydrate com checagem de TTL: se passou do limite, limpa tudo.
      onRehydrateStorage: () => (state, error) => {
        if (error || !state) return
        const ts = state._timestamp
        if (ts && Date.now() - ts > TTL_MS) {
          state.resetAll()
        }
      },
      // Migração: schema mismatch descarta cache antigo (evita crash por shape diferente).
      migrate: (_persisted, version) => {
        if (version !== SCHEMA_VERSION) {
          return undefined as unknown as FormularioState
        }
        return _persisted as FormularioState
      },
    },
  ),
)
