/**
 * Serviço de Conexão com Browser (Chromium)
 *
 * Este serviço gerencia a conexão com Chromium para scraping do PJE-TRT.
 * Suporta dois modos:
 *
 * 1. **Chromium Remoto**: Quando BROWSER_WS_ENDPOINT está configurado
 *    - Conecta via WebSocket ao Chromium Browser Server (Playwright)
 *    - Recomendado para produção (ver repositório: sinesys-browser-server)
 *
 * 2. **Chromium Local**: Fallback quando não há endpoint remoto
 *    - Lança Chromium localmente via Playwright
 *    - Útil para desenvolvimento
 *
 * @example
 * ```typescript
 * const { browser, page } = await getBrowserConnection();
 * // ... fazer scraping
 * await closeBrowser(browser);
 * ```
 */

import 'server-only';

import { Browser, BrowserContext, Page, chromium } from 'playwright';

// ============================================================================
// TIPOS
// ============================================================================

export interface BrowserConnectionOptions {
  /** Tipo de browser (Chromium para produção, Firefox legado para dev) */
  browserType?: 'chromium' | 'firefox';
  /** Executar em modo headless. Default: true */
  headless?: boolean;
  /** Viewport personalizado */
  viewport?: { width: number; height: number };
  /** User agent personalizado */
  userAgent?: string;
  /** Timeout de conexão em ms. Default: 60000 */
  timeout?: number;
}

export interface BrowserConnectionResult {
  browser: Browser;
  browserContext: BrowserContext;
  page: Page;
  /** Indica se está conectado a um browser remoto */
  isRemote: boolean;
}

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

/**
 * Obtém a URL do WebSocket do browser remoto
 */
function getBrowserWsEndpoint(): string | undefined {
  return process.env.BROWSER_WS_ENDPOINT;
}

/**
 * Define se o runtime atual é de produção.
 */
function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Em desenvolvimento o padrão é usar browser local para evitar depender
 * do serviço remoto de produção. Para forçar remoto em dev, defina
 * BROWSER_USE_REMOTE_IN_DEV=true.
 */
function shouldUseRemoteBrowser(): boolean {
  const wsEndpoint = getBrowserWsEndpoint();

  if (!wsEndpoint) {
    return false;
  }

  if (isProductionRuntime()) {
    return true;
  }

  return process.env.BROWSER_USE_REMOTE_IN_DEV === 'true';
}

/**
 * Obtém o token de autenticação do browser service (opcional)
 */
function getBrowserServiceToken(): string | undefined {
  return process.env.BROWSER_SERVICE_TOKEN;
}

// ============================================================================
// CONEXÃO COM BROWSER
// ============================================================================

/**
 * Conecta ao browser remoto (Chromium via Playwright Browser Server)
 */
async function connectToRemoteBrowser(
  wsEndpoint: string,
  options: BrowserConnectionOptions
): Promise<BrowserConnectionResult> {
  const token = getBrowserServiceToken();

  // Adicionar token à URL se disponível (formato: ws://host:port/token)
  let finalEndpoint = wsEndpoint;
  if (token && !wsEndpoint.includes(token)) {
    finalEndpoint = wsEndpoint.endsWith('/')
      ? `${wsEndpoint}${token}`
      : `${wsEndpoint}/${token}`;
  }

  console.log('[Browser] Conectando ao Chromium remoto...', {
    endpoint: wsEndpoint.replace(/\/[^\/]+$/, '/***'),
  });

  const browser = await chromium.connect(finalEndpoint, {
    timeout: options.timeout || 60000,
  });

  console.log('[Browser] Conectado ao Chromium remoto');

  const browserContext = await browser.newContext({
    viewport: options.viewport || { width: 1920, height: 1080 },
    userAgent: options.userAgent || getDefaultUserAgent(),
  });

  const page = await browserContext.newPage();

  return {
    browser,
    browserContext,
    page,
    isRemote: true,
  };
}

/**
 * Lança Chromium local com Playwright
 */
async function launchLocalBrowser(
  options: BrowserConnectionOptions
): Promise<BrowserConnectionResult> {
  const headless = options.headless ?? true;

  console.log('[Browser] Lançando Chromium local...', { headless });

  const browser = await chromium.launch({ headless });

  console.log('[Browser] Chromium lançado localmente');

  const browserContext = await browser.newContext({
    viewport: options.viewport || { width: 1920, height: 1080 },
    userAgent: options.userAgent || getDefaultUserAgent(),
  });

  const page = await browserContext.newPage();

  return {
    browser,
    browserContext,
    page,
    isRemote: false,
  };
}

// ============================================================================
// FUNÇÕES PÚBLICAS
// ============================================================================

/**
 * Obtém uma conexão com browser (remoto ou local)
 * 
 * Prioridade:
 * 1. Se BROWSER_WS_ENDPOINT estiver configurado → conecta ao remoto
 * 2. Caso contrário → lança browser local
 * 
 * @param options Opções de conexão
 * @returns Browser, contexto e página prontos para uso
 * 
 * @example
 * ```typescript
 * const { browser, page, isRemote } = await getBrowserConnection();
 * console.log(`Usando browser ${isRemote ? 'remoto' : 'local'}`);
 * 
 * await page.goto('https://example.com');
 * // ... fazer scraping
 * 
 * await closeBrowser(browser);
 * ```
 */
export async function getBrowserConnection(
  options: BrowserConnectionOptions = {}
): Promise<BrowserConnectionResult> {
  const wsEndpoint = getBrowserWsEndpoint();
  const useRemote = shouldUseRemoteBrowser();

  if (wsEndpoint && useRemote) {
    try {
      return await connectToRemoteBrowser(wsEndpoint, options);
    } catch (error) {
      console.error('❌ [Browser] Falha ao conectar ao browser remoto:', error);
      console.warn('⚠️ [Browser] Tentando fallback para browser local...');
      
      // Fallback para local se remoto falhar
      return await launchLocalBrowser(options);
    }
  }

  if (wsEndpoint && !useRemote) {
    console.log(
      '[Browser] Ambiente de desenvolvimento detectado: ignorando BROWSER_WS_ENDPOINT e usando browser local'
    );
  }

  // Sem endpoint remoto configurado → usar local
  return await launchLocalBrowser(options);
}

/**
 * Obtém conexão com Chromium (usado no PJE-TRT)
 *
 * @deprecated Use getBrowserConnection() diretamente
 */
export async function getFirefoxConnection(
  options: Omit<BrowserConnectionOptions, 'browserType'> = {}
): Promise<BrowserConnectionResult> {
  return await getBrowserConnection(options);
}

/**
 * Fecha o browser de forma segura
 */
export async function closeBrowser(browser: Browser): Promise<void> {
  try {
    await browser.close();
    console.log('✅ [Browser] Browser fechado');
  } catch (error) {
    console.error('⚠️ [Browser] Erro ao fechar browser:', error);
  }
}

/**
 * Verifica se o serviço de browser remoto está disponível
 */
export async function checkBrowserServiceHealth(): Promise<{
  available: boolean;
  isRemote: boolean;
  endpoint?: string;
  error?: string;
}> {
  const wsEndpoint = getBrowserWsEndpoint();
  const browserServiceUrl = process.env.BROWSER_SERVICE_URL;

  if (!wsEndpoint && !browserServiceUrl) {
    return {
      available: true,
      isRemote: false,
    };
  }

  try {
    // Verificar health do Browserless via HTTP
    const healthUrl = browserServiceUrl 
      ? `${browserServiceUrl}/health`
      : wsEndpoint?.replace('ws://', 'http://').replace('wss://', 'https://').replace(/\?.*$/, '') + '/health';

    const response = await fetch(healthUrl, { 
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    return {
      available: response.ok,
      isRemote: true,
      endpoint: wsEndpoint,
    };
  } catch (error) {
    return {
      available: false,
      isRemote: true,
      endpoint: wsEndpoint,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// UTILITÁRIOS
// ============================================================================

/**
 * Retorna o user agent padrão do Chrome
 */
function getDefaultUserAgent(): string {
  return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
}

