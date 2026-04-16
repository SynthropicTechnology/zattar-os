'use client'

import { useEffect } from 'react'
import { useFormularioStore } from '@/shared/assinatura-digital/store'
import FormularioContainer from './formulario-container'
import type { DynamicFormSchema, MetadadoSeguranca } from '@/shared/assinatura-digital/types/domain'

interface FormularioPageProps {
  segmentoId: number
  formularioId: number
  templateIds?: string[]
  formularioNome?: string
  segmentoNome?: string
  formSchema?: DynamicFormSchema
  fotoNecessaria?: boolean
  geolocationNecessaria?: boolean
  metadadosSeguranca?: MetadadoSeguranca[]
}

/**
 * Wrapper genérico para páginas de formulário multi-step.
 *
 * Responsabilidades:
 * - Inicializa o contexto do formulário (segmento, formulário e templates)
 * - Valida contexto persistido: se o formulário mudou (segmentoId/formularioId
 *   diferentes do que está no sessionStorage), descarta o draft antes de hydrar.
 *   Evita carregar draft de outro formulário se o usuário navegar entre URLs.
 * - Delega toda a lógica de navegação e renderização para FormularioContainer
 */
export default function FormularioPage({
  segmentoId,
  formularioId,
  templateIds,
  formularioNome,
  segmentoNome,
  formSchema,
  fotoNecessaria,
  geolocationNecessaria,
  metadadosSeguranca,
}: FormularioPageProps) {
  const hydrateContext = useFormularioStore((s) => s.hydrateContext)
  const resetAll = useFormularioStore((s) => s.resetAll)

  useEffect(() => {
    // Snapshot antes de hydrar — detecta se o draft persistido é de outro formulário.
    const persisted = useFormularioStore.getState()
    const formularioChanged =
      persisted.segmentoId != null &&
      persisted.formularioId != null &&
      (persisted.segmentoId !== segmentoId || persisted.formularioId !== formularioId)

    if (formularioChanged) {
      resetAll()
    }

    hydrateContext({
      segmentoId,
      formularioId,
      templateIds,
      formularioNome,
      segmentoNome,
      formSchema,
      flowConfig: {
        foto_necessaria: fotoNecessaria,
        geolocation_necessaria: geolocationNecessaria,
        metadados_seguranca: metadadosSeguranca,
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segmentoId, formularioId, formularioNome, segmentoNome, fotoNecessaria, geolocationNecessaria])

  return <FormularioContainer />
}
