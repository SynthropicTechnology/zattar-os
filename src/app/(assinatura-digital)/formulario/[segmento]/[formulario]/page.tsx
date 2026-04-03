import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  FormularioPage,
  getSegmentoBySlug,
  getFormularioBySlugAndSegmentoId,
  getTemplate,
} from '@/app/(authenticated)/assinatura-digital/feature'
import type { DynamicFormSchema, MetadadoSeguranca } from '@/app/(authenticated)/assinatura-digital/feature'

interface PageProps {
  params: Promise<{ segmento: string; formulario: string }>
  searchParams?: Promise<{ templates?: string | string[] }>
}

function validateSlug(slug: string): boolean {
  const regex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  return regex.test(slug)
}

/**
 * Parseia o parâmetro templates da query string.
 * Suporta tanto string única quanto array de strings (Next.js app router).
 */
function parseTemplateIds(templatesParam?: string | string[]): string[] | null {
  if (!templatesParam) return null

  // Se for array, flatten e juntar em string separada por vírgula
  const templatesStr = Array.isArray(templatesParam)
    ? templatesParam.join(',')
    : templatesParam

  const ids = templatesStr.split(',').map(id => id.trim()).filter(id => id.length > 0)
  return ids.length > 0 ? ids : null
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  try {
    const { params: paramsPromise, searchParams: searchParamsPromise } = props
    const { segmento, formulario } = await paramsPromise
    const search = await searchParamsPromise

    // Validar slugs
    if (!validateSlug(segmento) || !validateSlug(formulario)) {
      return {
        title: 'Página não encontrada',
        description: 'O formulário solicitado não foi encontrado.',
      }
    }

    // Buscar segmento
    const segmentoData = await getSegmentoBySlug(segmento)
    if (!segmentoData) {
      return {
        title: 'Página não encontrada',
        description: 'O formulário solicitado não foi encontrado.',
      }
    }

    // Buscar formulário
    const formularioData = await getFormularioBySlugAndSegmentoId(formulario, segmentoData.id)
    if (!formularioData) {
      return {
        title: 'Página não encontrada',
        description: 'O formulário solicitado não foi encontrado.',
      }
    }

    // Buscar nomes dos templates se fornecidos
    const templateNames: string[] = []
    const templateIds = parseTemplateIds(search?.templates)
    if (templateIds) {
      for (const templateId of templateIds) {
        const template = await getTemplate(templateId)
        if (template) {
          templateNames.push(template.nome)
        }
      }
    }

    // Construir title e description
    const baseTitle = `Formulário ${formularioData.nome} - ${segmentoData.nome}`
    const title = templateNames.length > 0 ? `${baseTitle} (${templateNames.join(', ')})` : baseTitle
    const description = `Preencha o formulário ${formularioData.nome} do segmento ${segmentoData.nome}.`

    return {
      title,
      description,
    }
  } catch (error) {
    console.error('Erro ao gerar metadata:', error)
    return {
      title: 'Página não encontrada',
      description: 'O formulário solicitado não foi encontrado.',
    }
  }
}

export default async function FormularioDinamicoPage(props: PageProps) {
  try {
    const { params: paramsPromise, searchParams: searchParamsPromise } = props
    const { segmento, formulario } = await paramsPromise
    const search = await searchParamsPromise

    console.log('Params:', { segmento, formulario })
    console.log('SearchParams:', search)

    // Validar slugs
    if (!validateSlug(segmento) || !validateSlug(formulario)) {
      console.log('Slugs inválidos')
      notFound()
    }

    // Buscar segmento
    const segmentoData = await getSegmentoBySlug(segmento)
    if (!segmentoData) {
      console.log('Segmento não encontrado:', segmento)
      notFound()
    }
    console.log('Segmento encontrado:', segmentoData)

    // Buscar formulário
    const formularioData = await getFormularioBySlugAndSegmentoId(formulario, segmentoData.id)
    if (!formularioData) {
      console.log('Formulário não encontrado:', formulario, 'para segmento:', segmentoData.id)
      notFound()
    }
    console.log('Formulário encontrado:', formularioData)

    // Parsear form_schema
    const formSchema: DynamicFormSchema = formularioData.form_schema as DynamicFormSchema

    // Parsear metadados_seguranca
    let metadadosSeguranca: MetadadoSeguranca[]
    if (typeof formularioData.metadados_seguranca === 'string') {
      metadadosSeguranca = JSON.parse(formularioData.metadados_seguranca) as MetadadoSeguranca[]
    } else {
      // Se for undefined ou null, usar array vazio como padrão
      metadadosSeguranca = []
    }

    // Determinar templateIds
    const templateIdsFromQuery = parseTemplateIds(search?.templates)
    const templateIds = templateIdsFromQuery || formularioData.template_ids || []
    console.log('TemplateIds:', templateIds)

    return (
      <FormularioPage
        segmentoId={segmentoData.id}
        formularioId={formularioData.id}
        templateIds={templateIds}
        formularioNome={formularioData.nome}
        segmentoNome={segmentoData.nome}
        formSchema={formSchema}
        fotoNecessaria={formularioData.foto_necessaria}
        geolocationNecessaria={formularioData.geolocation_necessaria}
        metadadosSeguranca={metadadosSeguranca}
      />
    )
  } catch (error) {
    console.error('Erro na página de formulário:', error)
    notFound()
  }
}
