---
name: pje-scraping
description: Expert in PJE (Processo Judicial Eletrônico) automation and web scraping for Brazilian electronic legal process systems. Handles tribunal-specific flows, API integration, and data extraction patterns.
---

# PJE Scraping Expert

This skill provides specialized knowledge for automating PJE (Processo Judicial Eletrônico) legal process scraping across Brazilian tribunals (TRTs, TJs, etc.).

## Core Capabilities

### 1. Executores PJE

O sistema usa executores TypeScript que executam scraping localmente:

- **PuppeteerPJEExecutor**: Execução via Puppeteer (Chrome/Chromium) - mais rápido, ideal para desenvolvimento
  - Localização: `lib/services/pje/puppeteer-executor.ts`
  - Stealth: Plugin `puppeteer-extra-plugin-stealth`

- **PlaywrightPJEExecutor**: Execução via Playwright (Firefox/WebKit/Chromium) - mais stealth, recomendado para produção
  - Localização: `lib/services/pje/playwright-executor.ts`
  - Stealth: Configurações anti-detecção nativas

- **ExecutorFactory**: Seleção automática do executor baseado em configuração
  - Localização: `lib/services/pje/executor-factory.ts`
  - Função: `createPJEExecutor(browser?: 'chrome' | 'firefox' | 'webkit')`

### 2. Helpers de Autenticação

**Localização**: `lib/services/pje/auth-helpers.ts`

**Funções principais**:
- `aplicarConfiguracoesAntiDeteccao(page)` - Remove propriedades webdriver e configura navigator
- `processOTP(page, twofauthConfig, logCallback, targetHost)` - Processa OTP via 2FAuth API
- `esperarSaidaSSO(page, targetHost, timeout, logCallback)` - Aguarda redirects SSO até chegar no domínio PJE
- `obterIdAdvogado(page, idAdvogadoFallback, logCallback)` - Extrai ID do advogado do JWT cookie

### 3. Integração via API

**API Route**: `app/api/scrape-pje/route.ts`

**Endpoint**: `POST /api/scrape-pje`

**Request Body**:
```typescript
{
  credentials: {
    cpf: string;
    senha: string;
    idAdvogado?: string;
  };
  tribunal: {
    codigo: string;
    loginUrl: string;
    baseUrl: string;
    apiUrl: string;
  };
  scrapeType: 'acervo' | 'expedientes' | 'pauta';
  browser?: 'chrome' | 'firefox' | 'webkit';
}
```

### 4. Scraping Categories

Cada tribunal suporta estes tipos principais de scraping:

- **Acervo**: Todos os processos ativos
- **Expedientes**: Intimações e notificações
- **Pauta**: Pauta de audiências

## Scraping Flow

### Fluxo Completo

1. **Frontend** → POST `/api/scrape-pje` com credenciais e configuração do tribunal
2. **API Route** → Cria executor via `createPJEExecutor(browser)`
3. **Executor** → `execute(context)` inicia browser e aplica configurações anti-detecção
4. **Login SSO** → Navega para login, clica em SSO, preenche CPF e senha
5. **OTP (se necessário)** → `processOTP()` busca código do 2FAuth e preenche
6. **Redirects SSO** → `esperarSaidaSSO()` aguarda chegar no domínio PJE
7. **Extração de ID** → `obterIdAdvogado()` extrai ID do JWT cookie
8. **Chamada API PJE** → Busca processos via API REST do PJE
9. **Retorno** → Retorna processos e logs para o frontend

## Environment Variables

```env
# Browser padrão ('chrome', 'firefox', 'webkit')
DEFAULT_BROWSER=firefox

# Modo headless (true/false)
HEADLESS=true

# Timeout padrão (segundos)
SCRAPING_TIMEOUT=600

# Capturar screenshot em erro
SCREENSHOT_ON_ERROR=true

# 2FAuth (OTP)
TWOFAUTH_API_URL=https://authenticator.platform.synthropic.app
TWOFAUTH_API_TOKEN=<JWT_TOKEN>
TWOFAUTH_ACCOUNT_ID=7
```

## Anti-Detection Best Practices

Reference: `docs/scraping/ANTI-BOT-DETECTION.md`

- Sistema aplica automaticamente via `aplicarConfiguracoesAntiDeteccao()`
- Remove propriedade `navigator.webdriver`
- Configura `navigator.plugins` e `navigator.languages`
- Aplica User-Agent realista
- Configura headers HTTP apropriados
- Puppeteer usa Stealth Plugin automaticamente

## Common Issues & Solutions

### Issue: "Navigation timeout"
**Solution:** Increase timeout or wait for specific elements
```typescript
// Configurado via SCRAPING_TIMEOUT (default: 600s)
```

### Issue: "Cookie access_token não encontrado"
**Solution:** Verificar se fluxo de login completou até `authenticateSSO.seam`
- Ver documentação em `docs/scraping/TROUBLESHOOTING.md`

### Issue: "OTP não funcionando"
**Solution:** Verificar configuração 2FAuth
- Verificar `TWOFAUTH_API_URL`, `TWOFAUTH_API_TOKEN`, `TWOFAUTH_ACCOUNT_ID`
- Testar endpoint separadamente: `curl -H "Authorization: Bearer $TWOFAUTH_API_TOKEN" "$TWOFAUTH_API_URL/twofaccounts/7/otp"`

### Issue: "CloudFront bloqueou (403)"
**Solution:** Usar Firefox ao invés de Chrome (menos detectável)
```typescript
{
  browser: 'firefox', // Mais stealth que Chrome
  timeout: 600000
}
```

## When to Use This Skill

Use this skill when:
- Criar novos executores ou helpers de scraping
- Debugging de executores existentes
- Adicionar suporte para novos tribunais
- Atualizar lógica de scraping devido a mudanças no PJE
- Implementar novos tipos de scraping (acervo, expedientes, etc.)
- Troubleshooting de fluxos de login
- Otimizar técnicas anti-detecção

## Related Documentation

- `docs/scraping/README.md` - Visão geral do sistema de scraping
- `docs/scraping/ARQUITETURA.md` - Arquitetura detalhada
- `docs/scraping/APIs-PJE.md` - Referência de APIs PJE
- `docs/scraping/ANTI-BOT-DETECTION.md` - Técnicas anti-detecção
- `docs/scraping/TROUBLESHOOTING.md` - Guia de troubleshooting
- `lib/services/pje/executor-factory.ts` - Factory de executores
- `lib/services/pje/auth-helpers.ts` - Helpers de autenticação
