# Cloudron CLI - Referencia Oficial

Documentacao baseada em https://docs.cloudron.io/packaging/cli e https://docs.cloudron.io/packages/docker-builder

## Autenticacao

### Login (interativo)

```bash
cloudron login <domain>
```

- `<domain>`: dominio do Cloudron (ex: `my.sinesys.online`)
- `--allow-selfsigned`: aceitar certificados auto-assinados
- Armazena token em `~/.cloudron.json`

### Login via flags (CI/CD)

Qualquer comando aceita `--server <domain> --token <token>` para autenticacao nao-interativa:

```bash
cloudron update --server my.sinesys.online --token 001e7174c4cbad2272 --app blog.example.com --image user/image:tag
```

**IMPORTANTE**: `--server` recebe o **dominio sem protocolo** (ex: `my.sinesys.online`, nao `https://my.sinesys.online`).

## Build

### Build remoto (via Build Service)

```bash
cloudron build --repository registry.sinesys.online/zattar-os
```

- Usa o Build Service configurado em `~/.cloudron.json`
- `--repository <repo>`: define o registry/imagem (salvo para builds futuros)
- O CLI le o `CloudronManifest.json` e `Dockerfile` do diretorio atual
- **Nao aceita** `-f` para especificar Dockerfile alternativo

### Configurar Build Service (interativo, executar uma vez)

```bash
cloudron build --set-build-service
```

Vai pedir:
1. URL do Build Service (ex: `https://builder.sinesys.online`)
2. Username e Password do Cloudron

A configuracao fica salva em `~/.cloudron.json` para builds futuros.

### Build local

```bash
cloudron build --local
```

- Builda usando Docker local
- Vai pedir o repository na primeira execucao

### Build manual com Docker (alternativa)

```bash
docker build --platform linux/amd64 -f Dockerfile.cloudron -t registry.sinesys.online/zattar-os:TAG .
docker push registry.sinesys.online/zattar-os:TAG
```

- Requer `docker login registry.sinesys.online` antes do push
- `--no-cache` e uma flag do Docker, **nao** do `cloudron build`
- `--platform linux/amd64` necessario em Macs com Apple Silicon

## Update

### Update com ultima imagem buildada

```bash
cloudron update --app zattaradvogados.com
```

- O CLI lembra a ultima imagem buildada pelo `cloudron build`

### Update com imagem especifica

```bash
cloudron update --app zattaradvogados.com --image registry.sinesys.online/zattar-os:TAG
```

### Update via CI/CD

```bash
cloudron update --server my.sinesys.online --token TOKEN --app zattaradvogados.com --image registry.sinesys.online/zattar-os:TAG
```

## Variaveis de Ambiente

```bash
# Setar multiplas variaveis
cloudron env set --app zattaradvogados.com VAR1=valor1 VAR2=valor2

# Remover variavel
cloudron env unset --app zattaradvogados.com VAR1

# Listar todas
cloudron env list --app zattaradvogados.com

# Obter uma variavel
cloudron env get --app zattaradvogados.com VAR1
```

## Outros Comandos

```bash
# Listar apps instalados
cloudron list

# Ver logs (tempo real)
cloudron logs -f --app zattaradvogados.com

# Shell no container
cloudron exec --app zattaradvogados.com

# Status
cloudron status --app zattaradvogados.com
```

## Estrutura do ~/.cloudron.json

O CLI persiste toda sua configuracao em `~/.cloudron.json`. Estrutura relevante:

```json
{
  "buildService": {
    "type": "remote",
    "url": "https://builder.sinesys.online",
    "token": "<build-service-token>"
  },
  "apps": {
    "/caminho/do/projeto": {
      "repository": "registry.sinesys.online/zattar-os",
      "gitCommit": "...",
      "dockerImage": "registry.sinesys.online/zattar-os:TAG",
      "appId": "uuid"
    }
  },
  "cloudrons": {
    "default": "my.sinesys.online",
    "my.sinesys.online": {
      "apiEndpoint": "my.sinesys.online",
      "token": "<auth-token>"
    }
  }
}
```

**Importante**: `buildService` e **global** — compartilhado entre todos os projetos.
Se voce tem projetos em servidores diferentes (sinesys, allhands), o ultimo `cloudron build`
configura o builder para todos. Os scripts de deploy do Zattar OS corrigem isso automaticamente
via `jq` antes de buildar.

## Notas sobre o CLI

1. **Sessao persistente**: O CLI armazena a sessao ativa em `~/.cloudron.json`. Se voce fez `cloudron login` em outro servidor (ex: Strapi), os comandos vao para la. Use `--server` em todos os comandos para evitar isso.

2. **Build Service**: A configuracao do Build Service (URL, credenciais) tambem fica em `~/.cloudron.json`. Pode ser setada interativamente via `cloudron build --set-build-service` ou programaticamente via `jq` (como o script de deploy faz).

3. **Dockerfile**: O `cloudron build` sempre le o `Dockerfile` do diretorio atual. Nao ha flag para especificar outro arquivo. O script de deploy cria um symlink temporario `Dockerfile -> Dockerfile.cloudron`.

4. **Registry**: Para push/pull no registry privado do Cloudron, faca `docker login registry.sinesys.online` separadamente — isso e Docker, nao Cloudron CLI.

## Configuracao Zattar OS

| Chave | Valor |
|---|---|
| Cloudron Server | `my.sinesys.online` |
| Registry | `registry.sinesys.online` |
| Build Service | `builder.sinesys.online` |
| App Domain | `zattaradvogados.com` |
| App ID (manifest) | `io.zattar.os` |
| Docker Repository | `registry.sinesys.online/zattar-os` |
