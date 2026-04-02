# Notificações - Regras e Troubleshooting

## Visão Geral

O módulo de notificações usa Supabase Realtime para entregar notificações em tempo real aos usuários. O hook `useNotificacoesRealtime` gerencia a subscrição e inclui fallbacks para garantir resiliência.

## Arquitetura

```
┌──────────────────────┐     ┌─────────────────────┐     ┌──────────────────┐
│   useNotificacoes    │────▶│ Server Actions      │────▶│ Supabase DB      │
│   (CRUD operations)  │     │ (notificacoes-      │     │ (notificacoes    │
│                      │     │  actions.ts)        │     │  table)          │
└──────────────────────┘     └─────────────────────┘     └──────────────────┘

┌──────────────────────┐     ┌─────────────────────┐     ┌──────────────────┐
│ useNotificacoes      │────▶│ Supabase Realtime   │◀────│ postgres_changes │
│ Realtime             │     │ Channel             │     │ (INSERT events)  │
│ (live updates)       │     │                     │     │                  │
└──────────────────────┘     └─────────────────────┘     └──────────────────┘
```

## Políticas RLS

As políticas RLS da tabela `notificacoes` foram otimizadas para Realtime:

```sql
-- Política de leitura (SELECT)
CREATE POLICY "Usuários podem ler suas próprias notificações"
ON public.notificacoes FOR SELECT
TO authenticated
USING (
  usuario_id IN (
    SELECT id FROM public.usuarios WHERE auth_user_id = auth.uid()
  )
);

-- Política de atualização (UPDATE)
CREATE POLICY "Usuários podem atualizar suas próprias notificações"
ON public.notificacoes FOR UPDATE
TO authenticated
USING (
  usuario_id IN (
    SELECT id FROM public.usuarios WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  usuario_id IN (
    SELECT id FROM public.usuarios WHERE auth_user_id = auth.uid()
  )
);
```

**Importante:** Usamos subqueries diretas ao invés de funções `SECURITY DEFINER` (como `get_current_user_id()`) porque o Realtime avalia as políticas RLS de forma diferente e funções podem causar `CHANNEL_ERROR`.

## Troubleshooting Realtime

### Erro: CHANNEL_ERROR ao inscrever

**Sintomas:**
- Console mostra: `❌ [Notificações Realtime] Erro ao inscrever`
- Notificações não aparecem em tempo real
- Fallback para polling é ativado automaticamente

**Causas possíveis:**

1. **Políticas RLS não permitem SELECT para o usuário**
   - Verificar se o usuário está autenticado
   - Verificar se o `usuario_id` corresponde ao `auth.uid()` via tabela `usuarios`

2. **Tabela não está na publicação `supabase_realtime`**
   ```sql
   -- Verificar
   SELECT * FROM pg_publication_tables
   WHERE pubname = 'supabase_realtime' AND tablename = 'notificacoes';

   -- Corrigir
   ALTER PUBLICATION supabase_realtime ADD TABLE notificacoes;
   ```

3. **Replica identity não configurado**
   ```sql
   -- Verificar
   SELECT relname, relreplident FROM pg_class WHERE relname = 'notificacoes';

   -- Corrigir (deve retornar 'f' para FULL)
   ALTER TABLE notificacoes REPLICA IDENTITY FULL;
   ```

4. **Sessão do usuário expirada**
   - Fazer logout/login para renovar sessão
   - Verificar se o token JWT está válido

5. **Canal Realtime criado como `private: true` sem policies compatíveis**
  - Para `postgres_changes`, não é necessário canal privado.
  - Canais privados podem exigir policies adicionais no schema `realtime` (ex.: `realtime.messages`) e falhar com `CHANNEL_ERROR` sem detalhes.
  - O hook `useNotificacoesRealtime` usa canal público (`supabase.channel(channelName)`) e depende apenas do RLS da tabela `public.notificacoes`.

5. **Função `get_current_user_id()` sendo usada em RLS**
   - Verificar se as políticas usam subquery direta com `auth.uid()`
   - Migração `20260105151305_fix_notificacoes_realtime_rls.sql` corrige isso

### Erro: TIMED_OUT

**Sintomas:**
- Console mostra: `⏱️ [Notificações Realtime] Timeout`
- Reconexão automática é tentada

**Causas possíveis:**
1. Problemas de rede/conectividade
2. Sobrecarga no servidor Supabase
3. WebSocket bloqueado por firewall/proxy

**Solução:**
- O hook tentará reconectar automaticamente até 3 vezes com backoff exponencial
- Se persistir, fallback para polling será ativado

### Erro: Usuário não encontrado na tabela usuarios

**Sintomas:**
- Console mostra: `⚠️ [Notificações Realtime] Usuário não encontrado na tabela usuarios`

**Causa:**
- O usuário autenticado (`auth.users`) não tem registro correspondente na tabela `public.usuarios`

**Solução:**
- Verificar se o usuário foi criado corretamente via trigger ou processo de onboarding
- Criar registro manualmente se necessário

## Configurações

O hook usa as seguintes configurações (definidas em `use-notificacoes.ts`):

```typescript
const REALTIME_CONFIG = {
  MAX_RETRIES: 3,           // Máximo de tentativas de reconexão
  BASE_DELAY_MS: 1000,      // Delay base para backoff (1s, 2s, 4s)
  POLLING_INTERVAL_MS: 30000, // Intervalo de polling (30s)
};
```

## Logs de Debug

O hook emite logs estruturados no console:

| Prefixo | Significado |
|---------|-------------|
| `🔄 [Notificações Realtime]` | Configurando/reconectando |
| `✅ [Notificações Realtime]` | Sucesso |
| `❌ [Notificações Realtime]` | Erro |
| `⚠️ [Notificações Realtime]` | Aviso |
| `⏱️ [Notificações Realtime]` | Timeout |
| `📩 [Notificações Realtime]` | Nova notificação recebida |
| `🔒 [Notificações Realtime]` | Canal fechado |
| `📊 [Notificações Polling]` | Fallback polling ativo |

## Testando Realtime

Para testar se o Realtime está funcionando:

1. Abra o console do navegador
2. Procure por: `✅ [Notificações Realtime] Inscrito com sucesso`
3. Em outra aba, insira uma notificação via Supabase Dashboard:
   ```sql
   INSERT INTO notificacoes (usuario_id, tipo, titulo, descricao, entidade_tipo, entidade_id)
   VALUES (1, 'processo_atribuido', 'Teste', 'Notificação de teste', 'processo', 1);
   ```
4. A notificação deve aparecer no console: `📩 [Notificações Realtime] Nova notificação recebida`

## Referências

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Supabase RLS + Realtime](https://supabase.com/docs/guides/realtime/postgres-changes#row-level-security)
- Migração: `20260105151305_fix_notificacoes_realtime_rls.sql`
