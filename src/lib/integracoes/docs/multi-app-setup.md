# Configuracao Multi-App do Synthropic

O Synthropic opera com tres aplicacoes distintas em um unico monorepo Next.js. Este documento descreve a arquitetura e configuracao necessaria.

## Arquitetura

```
src/app/
├── (dashboard)/          # Dashboard Principal - Sistema interno
├── meu-processo/         # Portal do Cliente - Consulta de processos
└── website/              # Website Institucional - Site publico
```

### Dashboard Principal

- **Caminho**: `src/app/(dashboard)/`
- **URL Producao**: Configurada via `NEXT_PUBLIC_DASHBOARD_URL`
- **Autenticacao**: Supabase Auth
- **Proposito**: Sistema interno para advogados e equipe

### Meu Processo (Portal do Cliente)

- **Caminho**: `src/app/meu-processo/`
- **URL Producao**: Configurada via `NEXT_PUBLIC_MEU_PROCESSO_URL`
- **Autenticacao**: CPF Cookie
- **Proposito**: Portal para clientes consultarem seus processos

### Website Institucional

- **Caminho**: `src/app/website/`
- **URL Producao**: Configurada via `NEXT_PUBLIC_WEBSITE_URL`
- **Autenticacao**: Nenhuma (publico)
- **Proposito**: Site institucional do escritorio

## Variaveis de Ambiente

Adicione as seguintes variaveis ao seu `.env.local`:

```bash
# URLs dos Apps (Producao)
NEXT_PUBLIC_DASHBOARD_URL=https://app.seudominio.com
NEXT_PUBLIC_MEU_PROCESSO_URL=https://meuprocesso.seudominio.com
NEXT_PUBLIC_WEBSITE_URL=https://www.seudominio.com
```

### Valores Padrao (Desenvolvimento)

Em desenvolvimento, os valores padrao sao:

| Variavel | Valor Padrao |
|----------|--------------|
| `NEXT_PUBLIC_DASHBOARD_URL` | `http://localhost:3000` |
| `NEXT_PUBLIC_MEU_PROCESSO_URL` | `http://localhost:3000/meu-processo` |
| `NEXT_PUBLIC_WEBSITE_URL` | `http://localhost:3000/website` |

## Onde as URLs sao Usadas

As variaveis de ambiente sao utilizadas nos seguintes locais:

| Local | Uso |
|-------|-----|
| `src/lib/urls.ts` | Funcoes helper (`getDashboardUrl`, `getMeuProcessoUrl`, `getWebsiteUrl`) |
| `src/app/website/components/hero.tsx` | Botao "Consultar Processo" redireciona para Meu Processo |
| `src/app/website/components/header.tsx` | Link "Meu Processo" no menu de navegacao |

## Usando as URLs no Codigo

O arquivo `src/lib/urls.ts` fornece funcoes helper para acessar as URLs:

```typescript
import { getDashboardUrl, getMeuProcessoUrl, getWebsiteUrl } from "@/lib/urls";

// URL base
const dashboardHome = getDashboardUrl();
// => "https://app.seudominio.com" (producao)
// => "http://localhost:3000" (desenvolvimento)

// URL com caminho
const processosPage = getDashboardUrl("/processos");
// => "https://app.seudominio.com/processos"

// Portal do cliente
const meuProcesso = getMeuProcessoUrl();
// => "https://meuprocesso.seudominio.com"

// Website
const website = getWebsiteUrl("/contato");
// => "https://www.seudominio.com/contato"
```

## Design System

Todos os tres apps compartilham o mesmo design system:

### Fontes

- **Inter**: Fonte principal para texto (`font-sans`)
- **Montserrat**: Fonte para headings (`font-display`)
- **Geist Mono**: Fonte monospacada (`font-mono`)

### Tokens

Os tokens de design estao definidos em `src/lib/design-system/tokens.ts`:

- Espacamentos: `gap-2`, `gap-4`, `gap-6`, `gap-8`
- Padding: `p-2`, `p-4`, `p-6`, `p-8`
- Transicoes: `transition-colors duration-200`
- Border radius: `rounded-md`, `rounded-lg`

### Cores do Website

O website mantem sua identidade visual propria com a cor brand roxa:

```css
/* Cor primaria do website */
--brand: #5523eb;
```

## Navegacao Entre Apps

Para navegar entre os apps, use as funcoes helper:

```tsx
import Link from "next/link";
import { getMeuProcessoUrl } from "@/lib/urls";

// No website, link para o portal do cliente
<Link href={getMeuProcessoUrl()}>
  Consultar Processo
</Link>
```

## Deploy

### Configuração de Produção (Domínios Separados)

O Synthropic em produção utiliza **domínios separados** para cada app:

| App | Domínio de Produção |
|-----|---------------------|
| Dashboard | `app.zattaradvogados.com` |
| Website | `zattaradvogados.com` |
| Meu Processo | `meuprocesso.zattaradvogados.com` |

### Variáveis de Ambiente em Produção

Configure as variáveis de ambiente com os domínios corretos:

```bash
# URLs dos Apps (Producao)
NEXT_PUBLIC_DASHBOARD_URL=https://app.zattaradvogados.com
NEXT_PUBLIC_MEU_PROCESSO_URL=https://meuprocesso.zattaradvogados.com
NEXT_PUBLIC_WEBSITE_URL=https://zattaradvogados.com
```

### Configuração de Reverse Proxy

**IMPORTANTE**: Em produção, você **deve** configurar um reverse proxy (Nginx, Cloudflare, ou similar) para rotear cada domínio para o mesmo app Next.js com os paths corretos.

#### Exemplo de Configuração Nginx

```nginx
# Dashboard: app.zattaradvogados.com -> Next.js (qualquer path)
server {
    server_name app.zattaradvogados.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Website: zattaradvogados.com -> Next.js /website/*
server {
    server_name zattaradvogados.com www.zattaradvogados.com;
    
    location / {
        proxy_pass http://localhost:3000/website;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Rewrite para remover /website do path quando necessário
        rewrite ^/website/(.*)$ /website/$1 break;
    }
}

# Meu Processo: meuprocesso.zattaradvogados.com -> Next.js /meu-processo/*
server {
    server_name meuprocesso.zattaradvogados.com;
    
    location / {
        proxy_pass http://localhost:3000/meu-processo;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Rewrite para remover /meu-processo do path quando necessário
        rewrite ^/meu-processo/(.*)$ /meu-processo/$1 break;
    }
}
```

#### Cloudflare Workers (Alternativa)

Se usar Cloudflare, você pode criar Workers para roteamento:

```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const hostname = url.hostname
  
  // Roteamento baseado em domínio
  if (hostname === 'app.zattaradvogados.com') {
    // Dashboard - passar direto
    return fetch(`http://localhost:3000${url.pathname}`, request)
  } else if (hostname === 'zattaradvogados.com' || hostname === 'www.zattaradvogados.com') {
    // Website - adicionar /website
    return fetch(`http://localhost:3000/website${url.pathname}`, request)
  } else if (hostname === 'meuprocesso.zattaradvogados.com') {
    // Meu Processo - adicionar /meu-processo
    return fetch(`http://localhost:3000/meu-processo${url.pathname}`, request)
  }
  
  return new Response('Not Found', { status: 404 })
}
```

### Middleware de Roteamento

O middleware do Next.js (`middleware.ts`) detecta automaticamente o domínio e aplica as regras de autenticação corretas:

- **Dashboard**: Requer autenticação Supabase
- **Website**: Sempre público
- **Meu Processo**: Autenticação via cookie CPF

### Ambiente de Desenvolvimento

Em desenvolvimento, use localhost com paths:

```bash
# Desenvolvimento (localhost com paths)
NEXT_PUBLIC_DASHBOARD_URL=http://localhost:3000
NEXT_PUBLIC_MEU_PROCESSO_URL=http://localhost:3000/meu-processo
NEXT_PUBLIC_WEBSITE_URL=http://localhost:3000/website
```

### Ambiente Único (Alternativa)

Se preferir usar um único domínio com paths (não recomendado para produção):

```bash
NEXT_PUBLIC_DASHBOARD_URL=https://app.exemplo.com
NEXT_PUBLIC_MEU_PROCESSO_URL=https://app.exemplo.com/meu-processo
NEXT_PUBLIC_WEBSITE_URL=https://app.exemplo.com/website
```

## Estrutura de Componentes

Cada app tem seus proprios componentes em sua pasta:

```
src/app/website/components/     # Componentes do website
src/app/meu-processo/components/ # Componentes do portal
src/components/                  # Componentes compartilhados (dashboard)
```

Os componentes do website usam imports relativos (`./components/`) para manter isolamento.
