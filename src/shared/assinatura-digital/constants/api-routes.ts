/**
 * Rotas de API do módulo de assinatura digital
 */

export const API_ROUTES = {
  // Formulário público
  verificarCpf: '/api/assinatura-digital/forms/verificar-cpf',
  saveClient: '/api/assinatura-digital/forms/save-client',
  getClientIp: '/api/assinatura-digital/utils/get-client-ip',

  // Assinatura
  preview: '/api/assinatura-digital/signature/preview',
  salvarAcao: '/api/assinatura-digital/signature/salvar-acao',
  finalize: '/api/assinatura-digital/signature/finalizar',
  sessoes: '/api/assinatura-digital/signature/sessoes',

  // Admin - Templates
  templates: '/api/assinatura-digital/templates',
  templateById: (id: string | number) => `/api/assinatura-digital/templates/${id}`,
  templatePreview: (id: string | number) => `/api/assinatura-digital/templates/${id}/preview`,
  templateUpload: '/api/assinatura-digital/templates/upload',

  // Admin - Formulários
  formularios: '/api/assinatura-digital/formularios',
  formularioById: (id: string | number) => `/api/assinatura-digital/formularios/${id}`,
  formularioSchema: (id: string | number) => `/api/assinatura-digital/formularios/${id}/schema`,

  // Admin - Segmentos
  segmentos: '/api/assinatura-digital/segmentos',
  segmentoById: (id: string | number) => `/api/assinatura-digital/segmentos/${id}`,

  // Dashboard
  stats: '/api/assinatura-digital/stats',
} as const;
