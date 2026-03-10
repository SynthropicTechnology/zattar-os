# Deploy no Cloudron

Guia para deploy do Zattar OS na plataforma [Cloudron](https://www.cloudron.io/).

## Pre-requisitos

- Servidor com Cloudron instalado (v7.0+)
- [Cloudron CLI](https://docs.cloudron.io/packaging/cli/) instalado: `npm install -g cloudron`
- Docker instalado localmente (para build da imagem)
- Acesso a um Docker Registry (Docker Hub, Cloudron Registry, ou privado)

## Addons Utilizados

| Addon | Descricao | Variaveis Cloudron |
|---|---|---|
| **redis** | Cache distribuido (ioredis) | `CLOUDRON_REDIS_URL`, `CLOUDRON_REDIS_PASSWORD` |
| **sendmail** | Envio de emails via SMTP relay | `CLOUDRON_MAIL_SMTP_*`, `CLOUDRON_MAIL_FROM` |
| **localstorage** | Storage persistente em `/app/data` | Automatico |

> O `start.sh` mapeia automaticamente as variaveis do Cloudron para o formato que o app espera.

## Build e Deploy

### 1. Login no Cloudron CLI

```bash
cloudron login https://my.seudominio.com
```

### 2. Login no Docker Registry

```bash
# Docker Hub
docker login

# Ou registry privado do Cloudron
docker login registry.seudominio.com
```

### 3. Build da Imagem

```bash
# Build com variaveis NEXT_PUBLIC_* (obrigatorias no build time)
docker build -t seuusuario/zattar-os:1.0.0 \
  -f Dockerfile.cloudron \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=eyJ... \
  .
```

### 4. Push para o Registry

```bash
docker push seuusuario/zattar-os:1.0.0
```

### 5. Instalar no Cloudron

```bash
cloudron install --image seuusuario/zattar-os:1.0.0
```

O CLI vai pedir o subdominio (ex: `app.seudominio.com`).

### 6. Configurar Variaveis de Ambiente

Apos a instalacao, configure as variaveis via Dashboard do Cloudron ou CLI:

```bash
cloudron env set \
  SUPABASE_SECRET_KEY=sua_secret_key \
  SERVICE_API_KEY=sua_api_key \
  CRON_SECRET=seu_cron_secret \
  OPENAI_API_KEY=sk-... \
  AI_GATEWAY_API_KEY=sua_chave \
  B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com \
  B2_REGION=us-east-005 \
  B2_BUCKET=seu-bucket \
  B2_KEY_ID=seu_key_id \
  B2_APPLICATION_KEY=sua_key
```

> **Nota:** `REDIS_URL`, `REDIS_PASSWORD` e variaveis de email **NAO** precisam ser definidas
> manualmente — sao fornecidas automaticamente pelos addons do Cloudron.

## Atualizar a Aplicacao

```bash
# Build nova versao
docker build -t seuusuario/zattar-os:1.1.0 -f Dockerfile.cloudron \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=eyJ... \
  .

# Push
docker push seuusuario/zattar-os:1.1.0

# Update no Cloudron
cloudron update --image seuusuario/zattar-os:1.1.0
```

## Usando o Build Service do Cloudron

Se preferir buildar remotamente (sem Docker local):

```bash
# Configurar build service uma vez
cloudron build --set-build-service

# Build remoto + install
cloudron build --image seuusuario/zattar-os:1.0.0
cloudron install --image seuusuario/zattar-os:1.0.0
```

## Usando Registry Privado do Cloudron

Para usar o registry privado integrado ao Cloudron (em vez do Docker Hub):

1. Instale o app **Docker Registry** no Cloudron via App Store
2. Configure credenciais em `/app/data/docker.json`:

```json
{
  "registry.seudominio.com": {
    "username": "seu_usuario",
    "password": "sua_senha"
  }
}
```

3. Use o registry nas tags:

```bash
docker build -t registry.seudominio.com/zattar-os:1.0.0 -f Dockerfile.cloudron .
docker push registry.seudominio.com/zattar-os:1.0.0
cloudron install --image registry.seudominio.com/zattar-os:1.0.0
```

## Storage Persistente (/app/data)

O diretorio `/app/data` persiste entre updates e esta incluido nos backups automaticos:

```
/app/data/
  cache/       -> Cache do Next.js (symlinked de .next/cache)
  uploads/     -> Uploads temporarios
  logs/        -> Logs da aplicacao
```

## Email no Cloudron

O Cloudron tem um servidor de email integrado completo:

- **Envio (sendmail addon):** O app usa o SMTP relay do Cloudron automaticamente
- **Caixas de email:** Configure em Cloudron Dashboard > Email > Mailboxes
- **DNS:** O Cloudron configura MX, SPF, DKIM e DMARC automaticamente
- **Webmail:** Instale Roundcube ou SOGo da App Store para acesso web

### Criar Email para o Escritorio

1. Acesse o Dashboard do Cloudron
2. Va em **Email** > **Mailboxes**
3. Crie caixas como `contato@seudominio.com`, `juridico@seudominio.com`
4. Configure alias e redirecionamentos conforme necessario

> As credenciais de email per-usuario do app (tabela `credenciais_email`) podem
> apontar para o servidor de email do proprio Cloudron.

## Browser Service

O servico de browser (Firefox para scraping PJE) roda como container separado.
No Cloudron, configure como app customizado ou use um servico externo:

```bash
# Variavel para conectar ao browser service
cloudron env set \
  BROWSER_WS_ENDPOINT=ws://browser-service:3000 \
  BROWSER_SERVICE_URL=http://browser-service:3000 \
  BROWSER_SERVICE_TOKEN=seu_token
```

## Dashboard do Cloudron

O Cloudron oferece uma dashboard completa com:

- **Monitoring:** CPU, memoria, disco, rede por app
- **Logs:** Logs centralizados de todas as apps
- **Backups:** Backup automatico (local, S3, Backblaze B2)
- **Email:** Servidor de email completo com webmail
- **Users:** Gerenciamento de usuarios com LDAP/SSO
- **DNS:** Gerenciamento automatico de DNS
- **SSL:** Certificados Let's Encrypt automaticos
- **Updates:** Atualizacao de apps com um clique

## Troubleshooting

### App nao inicia
```bash
cloudron logs -f                    # Ver logs em tempo real
cloudron exec -- cat /tmp/supervisord.log  # Logs do supervisor
```

### Verificar Redis
```bash
cloudron exec -- node -e "
  const Redis = require('ioredis');
  const r = new Redis(process.env.CLOUDRON_REDIS_URL, { password: process.env.CLOUDRON_REDIS_PASSWORD });
  r.ping().then(p => { console.log('Redis:', p); process.exit(0); });
"
```

### Verificar variaveis de ambiente
```bash
cloudron exec -- env | grep -E 'CLOUDRON_|REDIS_|MAIL_'
```

### Restart da app
```bash
cloudron restart
```

## Estrutura de Arquivos

```
projeto/
  CloudronManifest.json    -> Manifesto do app (addons, portas, metadata)
  Dockerfile.cloudron      -> Dockerfile multi-stage para Cloudron
  icon.png                 -> Icone do app (512x512)
  cloudron/
    start.sh               -> Script de inicializacao (mapeia env vars)
    supervisor/
      node.conf            -> Config do supervisor para processo Node.js
    README.md              -> Este arquivo
```
