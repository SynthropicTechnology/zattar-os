/**
 * Página 404 customizada para formulários não encontrados
 *
 * Exibida quando:
 * - Segmento não existe
 * - Formulário não existe
 * - Relacionamento segmento ↔ formulário incorreto
 */

'use client';

import Link from 'next/link';

export default function FormularioNotFound() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-destructive rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-4">
          Formulário Não Encontrado
        </h1>

        {/* Description */}
        <p className="text-muted-foreground text-center mb-8">
          O formulário que você está tentando acessar não foi encontrado ou não está disponível.
        </p>

        {/* Possible Causes */}
        <div className="bg-warning border border-warning rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-warning mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            Possíveis causas
          </h2>
          <ul className="space-y-2 text-sm text-warning">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>O segmento (organização) não existe ou está inativo</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>O formulário não existe ou está inativo</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>O formulário não pertence ao segmento especificado na URL</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>A URL contém erros de digitação (slugs incorretos)</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>O sistema de backend não está respondendo</span>
            </li>
          </ul>
        </div>

        {/* Developer Troubleshooting (only shown in dev) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-info border border-info rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-info mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Modo Desenvolvedor
            </h2>
            <ul className="space-y-2 text-sm text-info">
              <li className="flex items-start">
                <span className="mr-2">1.</span>
                <span>
                  <strong>Verificar logs:</strong> Abra o console do navegador para ver detalhes do erro
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">2.</span>
                <span>
                  <strong>Verificar Supabase:</strong> Certifique-se de que o Supabase está configurado e as tabelas{' '}
                  <code className="bg-info px-1 rounded text-xs">segmentos</code> e{' '}
                  <code className="bg-info px-1 rounded text-xs">assinatura_digital_formularios</code> têm dados
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">3.</span>
                <span>
                  <strong>Variáveis de ambiente:</strong> Verifique se <code className="bg-info px-1 rounded text-xs">NEXT_PUBLIC_SUPABASE_URL</code> e outras variáveis estão configuradas corretamente
                </span>
              </li>
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-info hover:bg-info focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-info transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Voltar para Home
          </Link>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center px-6 py-3 border border-border text-base font-medium rounded-lg text-foreground bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-info transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar
          </button>
        </div>

        {/* Support Link */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Precisa de ajuda?{' '}
            <a
              href="mailto:suporte@example.com"
              className="text-info hover:text-info font-medium"
            >
              Entre em contato com o suporte
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
