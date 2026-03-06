/**
 * Arquivo: shared/fetch.ts
 * 
 * PROPÓSITO:
 * Este arquivo contém a função auxiliar genérica fetchPJEAPI que realiza requisições HTTP GET
 * para a API do PJE usando cookies de sessão para autenticação.
 * 
 * IMPORTANTE:
 * Esta função NÃO usa Authorization header, pois o PJE utiliza autenticação baseada em cookies.
 * Tentar usar Authorization header causa erro 401 (não autorizado).
 * 
 * DEPENDÊNCIAS:
 * - playwright: Importa o tipo Page do Playwright para executar código JavaScript no contexto do navegador
 * 
 * EXPORTAÇÕES:
 * - fetchPJEAPI<T>(): Função genérica para fazer requisições GET à API do PJE
 * 
 * QUEM USA ESTE ARQUIVO:
 * - Todas as APIs do PJE (acervo-geral, pendentes-manifestacao, audiencias, arquivados)
 */

import type { Page } from 'playwright';

/**
 * Função: fetchPJEAPI<T>
 * 
 * PROPÓSITO:
 * Faz uma requisição HTTP GET para a API do PJE usando cookies de sessão para autenticação.
 * Esta é a função base utilizada por todas as outras funções de API do PJE.
 * 
 * IMPORTANTE:
 * - Usa cookies automaticamente através de credentials: 'include'
 * - NÃO usa Authorization header (causa erro 401 se usado)
 * - Executa o fetch dentro do contexto do navegador Playwright para ter acesso aos cookies
 * 
 * PARÂMETROS:
 * - page: Page (obrigatório)
 *   Tipo: Page do Playwright
 *   Significado: Instância da página do navegador que contém os cookies de autenticação do PJE
 *   Por que é necessário: Os cookies de autenticação estão no contexto do navegador, então precisamos
 *   executar o fetch dentro desse contexto para que os cookies sejam enviados automaticamente
 * 
 * - endpoint: string (obrigatório)
 *   Tipo: string
 *   Significado: Caminho do endpoint da API (ex: "/pje-comum-api/api/paineladvogado/123/processos")
 *   Formato: Deve começar com "/" e conter o caminho completo do endpoint
 *   Exemplos:
 *   - "/pje-comum-api/api/paineladvogado/123/totalizadores"
 *   - "/pje-comum-api/api/paineladvogado/123/processos"
 *   - "/pje-comum-api/api/pauta-usuarios-externos"
 * 
 * - params?: Record<string, string | number | boolean> (opcional)
 *   Tipo: Objeto com chaves string e valores string, number ou boolean
 *   Significado: Parâmetros de query string a serem adicionados à URL
 *   Formato: { chave: valor, ... }
 *   Exemplos:
 *   - { pagina: 1, tamanhoPagina: 100 }
 *   - { idAgrupamentoProcessoTarefa: 1, tipoPainelAdvogado: 0 }
 *   - { dataInicio: "2024-01-01", dataFim: "2024-12-31" }
 *   Comportamento: Se não fornecido, a URL não terá parâmetros de query
 * 
 * RETORNO:
 * Tipo: Promise<T>
 * Significado: Promise que resolve com o resultado da API tipado como T
 * Formato: O tipo T é inferido pelo TypeScript baseado no uso da função
 * Exemplos:
 * - fetchPJEAPI<Totalizador[]> retorna Promise<Totalizador[]>
 * - fetchPJEAPI<PagedResponse<Processo>> retorna Promise<PagedResponse<Processo>>
 * - fetchPJEAPI<PagedResponse<Audiencia>> retorna Promise<PagedResponse<Audiencia>>
 * 
 * CHAMADAS INTERNAS:
 * - page.evaluate(): Executa código JavaScript no contexto do navegador
 * - window.location.origin: Obtém a origem da URL atual (ex: "https://pje.trt3.jus.br")
 * - URLSearchParams: Constrói a query string a partir dos parâmetros
 * - fetch(): Faz a requisição HTTP GET dentro do contexto do navegador
 * 
 * ENDPOINT HTTP:
 * Não há um endpoint fixo. A URL completa é construída dinamicamente:
 * - Base: Obtida de window.location.origin (ex: "https://pje.trt3.jus.br")
 * - Endpoint: Fornecido como parâmetro (ex: "/pje-comum-api/api/paineladvogado/123/processos")
 * - Query params: Adicionados se fornecidos no parâmetro params
 * 
 * Exemplo de URL final:
 * "https://pje.trt3.jus.br/pje-comum-api/api/paineladvogado/123/processos?idAgrupamentoProcessoTarefa=1&pagina=1&tamanhoPagina=100"
 * 
 * COMPORTAMENTO ESPECIAL:
 * 
 * 1. Autenticação via Cookies:
 *    - Usa credentials: 'include' para enviar cookies automaticamente
 *    - Os cookies são gerenciados pelo navegador Playwright
 *    - Não precisa extrair ou passar cookies manualmente
 * 
 * 2. XSRF Token:
 *    - Atualmente não é usado (xsrfToken: undefined)
 *    - Há um TODO para extrair do cookie se necessário no futuro
 *    - Se implementado, será adicionado no header X-XSRF-Token
 * 
 * 3. Tratamento de Erros:
 *    - Se a resposta HTTP não for ok (status >= 400), lança um Error
 *    - O erro contém o status HTTP e o texto da resposta
 *    - Formato do erro: "HTTP {status}: {texto da resposta}"
 * 
 * 4. Headers:
 *    - Accept: 'application/json' - Indica que esperamos JSON
 *    - Content-Type: 'application/json' - Indica que enviamos JSON (mesmo sendo GET)
 * 
 * 5. Conversão de Tipos:
 *    - Todos os valores dos parâmetros são convertidos para string antes de serem adicionados à query string
 *    - Isso garante compatibilidade com URLSearchParams
 * 
 * EXEMPLO DE USO:
 * 
 * // Obter totalizadores
 * const totalizadores = await fetchPJEAPI<Totalizador[]>(
 *   page,
 *   `/pje-comum-api/api/paineladvogado/${idAdvogado}/totalizadores`,
 *   { tipoPainelAdvogado: 0 }
 * );
 * 
 * // Obter processos paginados
 * const processos = await fetchPJEAPI<PagedResponse<Processo>>(
 *   page,
 *   `/pje-comum-api/api/paineladvogado/${idAdvogado}/processos`,
 *   {
 *     idAgrupamentoProcessoTarefa: 1,
 *     pagina: 1,
 *     tamanhoPagina: 100
 *   }
 * );
 * 
 * // Obter audiências
 * const audiencias = await fetchPJEAPI<PagedResponse<Audiencia>>(
 *   page,
 *   '/pje-comum-api/api/pauta-usuarios-externos',
 *   {
 *     dataInicio: '2024-01-01',
 *     dataFim: '2024-12-31',
 *     numeroPagina: 1,
 *     tamanhoPagina: 100
 *   }
 * );
 */
/** Status HTTP que indicam erro transitório e merecem retry */
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

/** Cache de origin por Page para evitar evaluate repetido */
const originCache = new WeakMap<Page, string>();

export interface FetchPJEOptions {
  /** Número máximo de retentativas (padrão: 3) */
  maxRetries?: number;
  /** Delay base em ms para backoff exponencial (padrão: 500) */
  baseDelay?: number;
}

export async function fetchPJEAPI<T>(
  page: Page,
  endpoint: string,
  params?: Record<string, string | number | boolean>,
  options?: FetchPJEOptions
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 3;
  const baseDelay = options?.baseDelay ?? 500;

  // Cache de origin — nunca muda durante a sessão
  let baseUrl = originCache.get(page);
  if (!baseUrl) {
    baseUrl = await page.evaluate(() => window.location.origin);
    originCache.set(page, baseUrl);
  }

  let url = `${baseUrl}${endpoint}`;

  // Adiciona parâmetros de query string se fornecidos
  if (params) {
    const queryString = new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>)
    ).toString();
    url += `?${queryString}`;
  }

  // Loop de retry com backoff exponencial
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Executa fetch no contexto do browser e retorna { status, data, errorText }
      const result = await page.evaluate(
        async ({ url, xsrfToken }: { url: string; xsrfToken?: string }) => {
          const headers: Record<string, string> = {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          };

          if (xsrfToken) {
            headers['X-XSRF-Token'] = xsrfToken;
          }

          const response = await fetch(url, {
            method: 'GET',
            headers,
            credentials: 'include',
          });

          if (!response.ok) {
            const errorText = await response.text();
            return { ok: false as const, status: response.status, errorText };
          }

          const data = await response.json();
          return { ok: true as const, status: response.status, data };
        },
        {
          url,
          xsrfToken: undefined,
        }
      );

      // Tratar erro HTTP
      if (!result.ok) {
        const isRetryable = RETRYABLE_STATUS_CODES.has(result.status);
        if (isRetryable && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 100;
          console.warn(
            `[fetchPJEAPI] HTTP ${result.status} em ${endpoint}, tentativa ${attempt + 1}/${maxRetries}, retry em ${Math.round(delay)}ms`,
          );
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        throw new Error(`HTTP ${result.status}: ${result.errorText}`);
      }

      // Validar resposta não-vazia
      if (result.data === null || result.data === undefined) {
        throw new Error(`HTTP ${result.status}: Resposta vazia para ${endpoint}`);
      }

      return result.data as T;
    } catch (error) {
      // Erros de rede (page.evaluate falha) — retry se não for última tentativa
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 100;
        console.warn(
          `[fetchPJEAPI] Erro de rede em ${endpoint}, tentativa ${attempt + 1}/${maxRetries}, retry em ${Math.round(delay)}ms`,
        );
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw error;
    }
  }

  // Unreachable, mas TypeScript precisa
  throw new Error(`[fetchPJEAPI] Falha após ${maxRetries} retentativas para ${endpoint}`);
}
