# Configuração da Supabase Management API

A Management API do Supabase permite obter informações detalhadas sobre o compute tier e métricas avançadas do banco de dados.

## Quando configurar

A Management API é **opcional**. Configure apenas se você deseja:

- Ver o compute tier atual (Small, Medium, Large, etc.)
- Obter recomendações precisas de upgrade baseadas no tier atual
- Monitorar limites de IOPS e throughput específicos do seu tier

Se não configurada, o sistema funcionará normalmente, mas as métricas de Disk IO mostrarão "unknown" como tier.

## Como configurar

### 1. Obter o Project Reference

O Project Reference é o identificador único do seu projeto Supabase.

**Onde encontrar:**
- Acesse: https://supabase.com/dashboard/project/SEU_PROJETO/settings/general
- Ou extraia da URL do seu projeto: `https://abcdefgh.supabase.co` → `abcdefgh`

### 2. Gerar um Access Token

O Access Token é uma chave de API pessoal para acessar a Management API.

**Como gerar:**
1. Acesse: https://supabase.com/dashboard/account/tokens
2. Clique em "Generate new token"
3. Dê um nome descritivo (ex: "Synthropic Management API")
4. Copie o token gerado (você não poderá vê-lo novamente!)

**Importante:**
- O token tem acesso a TODOS os seus projetos Supabase
- Mantenha-o seguro e nunca o compartilhe
- Se comprometido, revogue-o imediatamente no dashboard

### 3. Configurar as variáveis de ambiente

Adicione as seguintes variáveis ao seu arquivo `.env.local`:

```bash
# Supabase Management API (Opcional)
SUPABASE_PROJECT_REF=seu_project_ref
SUPABASE_ACCESS_TOKEN=seu_access_token
```

**Exemplo:**
```bash
SUPABASE_PROJECT_REF=abcdefghijklmnop
SUPABASE_ACCESS_TOKEN=sbp_1234567890abcdef1234567890abcdef
```

### 4. Reiniciar a aplicação

Após configurar as variáveis, reinicie o servidor de desenvolvimento:

```bash
npm run dev
```

## Verificar se está funcionando

1. Acesse: `/app/admin/metricas-db`
2. Verifique o card "Disk IO Budget"
3. Se configurado corretamente, você verá:
   - O nome do compute tier (ex: "Small", "Medium")
   - Limites de IOPS e throughput específicos
   - Porcentagem de consumo do budget

Se não configurado, você verá:
- Tier: "unknown"
- Limites: 0
- Mensagem: "Metrics API não configurada"

## Troubleshooting

### Erro 401: Unauthorized

**Causa:** Token de acesso inválido ou expirado

**Solução:**
1. Verifique se o token está correto (sem espaços extras)
2. Gere um novo token em: https://supabase.com/dashboard/account/tokens
3. Atualize a variável `SUPABASE_ACCESS_TOKEN`
4. Reinicie a aplicação

### Erro 404: Not Found

**Causa:** Project Reference incorreto

**Solução:**
1. Verifique o Project Reference no dashboard
2. Atualize a variável `SUPABASE_PROJECT_REF`
3. Reinicie a aplicação

### Tier mostra "unknown"

**Causa:** Management API não configurada ou com erro

**Solução:**
1. Verifique se as variáveis estão configuradas
2. Verifique os logs do console para erros específicos
3. Teste o token manualmente:

```bash
curl -H "Authorization: Bearer SEU_TOKEN" \
  https://api.supabase.com/v1/projects/SEU_PROJECT_REF
```

## Segurança

- **Nunca** commite o `.env.local` no Git
- **Nunca** exponha o Access Token no código frontend
- Use variáveis de ambiente diferentes para desenvolvimento e produção
- Revogue tokens antigos quando não forem mais necessários
- Considere usar secrets management em produção (ex: Vault, AWS Secrets Manager)

## Referências

- [Supabase Management API Docs](https://supabase.com/docs/reference/api/introduction)
- [Compute Tiers](https://supabase.com/docs/guides/platform/compute-add-ons)
- [Access Tokens](https://supabase.com/docs/guides/platform/access-tokens)
