# Technical Design: Sistema de Permissões Granulares e Cargos

## Context

O projeto Synthropic atualmente não possui um sistema de controle de permissões. Todos os usuários autenticados têm acesso total a todas as funcionalidades, o que representa um risco de segurança e dificulta a gestão de equipes com diferentes responsabilidades.

Esta mudança introduz dois sistemas independentes:
1. **Cargos**: Para organização e categorização de usuários (ex: "Advogado Sênior", "Estagiário")
2. **Permissões Granulares**: Para controlar acesso a operações específicas do sistema

### Stakeholders
- **Administradores**: Precisam gerenciar permissões de usuários
- **Usuários**: Terão acesso restrito baseado em suas permissões
- **Desenvolvedores**: Devem integrar verificações de permissão em todas as rotas

### Constraints
- ✅ Backend first (frontend será implementado em proposta futura)
- ✅ Não pode quebrar funcionalidades existentes (100% retrocompatível)
- ✅ Deve ser performático (verificação de permissões rápida)
- ✅ Deve suportar granularidade máxima (~81 permissões)

## Goals / Non-Goals

### Goals
- ✅ Criar sistema de cargos para organização interna (sem relação com permissões)
- ✅ Criar sistema de permissões granulares baseado em usuário (não em papel/role)
- ✅ Mapear todas as operações existentes nos 13 domínios do sistema
- ✅ Permitir super admins que bypassam todas as verificações
- ✅ Criar middleware reutilizável para verificação de permissões
- ✅ Manter retrocompatibilidade total

### Non-Goals
- ❌ Implementar interface frontend (será feito em proposta futura)
- ❌ Criar sistema de permissões baseado em papéis/roles (RBAC)
- ❌ Vincular cargos a permissões
- ❌ Implementar cache distribuído (Redis) nesta fase (considerar no futuro)
- ❌ Criar logs detalhados de acesso negado (pode ser adicionado depois)

## Decisions

### 1. Permissões Baseadas em Usuário (não RBAC)

**Decision**: O sistema será baseado em permissões diretas por usuário, não em papéis/roles.

**Rationale**:
- ✅ **Flexibilidade**: Permite atribuir permissões específicas para cada usuário sem criar dezenas de roles
- ✅ **Simplicidade**: Evita complexidade de herança de permissões entre roles
- ✅ **Granularidade**: Cada usuário pode ter um conjunto único de permissões
- ❌ **Trade-off**: Gerenciamento pode ser mais trabalhoso para muitos usuários (mitigado por interface frontend futura)

**Alternatives Considered**:
- **RBAC (Role-Based Access Control)**: Rejeitado. Requer criar roles predefinidos (Admin, Editor, Viewer) e gerenciar hierarquia. Menos flexível para necessidades específicas.
- **ABAC (Attribute-Based Access Control)**: Rejeitado. Muito complexo para as necessidades atuais.

### 2. Cargos Desacoplados de Permissões

**Decision**: Cargos são apenas para organização interna, **sem** vínculo com permissões.

**Rationale**:
- ✅ **Separação de Responsabilidades**: Cargos servem para organizar hierarquia organizacional (ex: "Advogado Sênior")
- ✅ **Flexibilidade**: Dois usuários com o mesmo cargo podem ter permissões diferentes
- ✅ **Simplicidade**: Evita lógica complexa de "herdar permissões do cargo"
- ✅ **Requisito do Cliente**: Explicitamente solicitado

**Alternatives Considered**:
- **Cargos com Permissões**: Rejeitado. Cliente solicitou separação total.

### 3. Super Admin com Bypass Total

**Decision**: Campo `usuarios.is_super_admin` que, quando `true`, bypassa todas as verificações de permissão.

**Rationale**:
- ✅ **Simplicidade**: Evita criar 81 registros na tabela `permissoes` para super admins
- ✅ **Performance**: Verificação rápida (`if (isSuperAdmin) return true`)
- ✅ **Segurança**: Apenas alguns usuários terão esse flag (definido via migration ou admin panel)
- ❌ **Trade-off**: Super admins têm poder ilimitado (mas é o esperado)

**Implementation**:
```typescript
async function checkPermission(usuarioId: number, recurso: string, operacao: string): Promise<boolean> {
  // 1. Buscar usuário
  const usuario = await getUsuario(usuarioId);

  // 2. Se super admin, retornar true
  if (usuario.is_super_admin) {
    return true;
  }

  // 3. Caso contrário, verificar na tabela permissoes
  const permissao = await getPermissao(usuarioId, recurso, operacao);
  return permissao?.permitido ?? false;
}
```

### 4. Tabela de Permissões com Estrutura Simples

**Decision**: Tabela `permissoes` com colunas: `usuario_id`, `recurso`, `operacao`, `permitido`.

**Schema**:
```sql
CREATE TABLE permissoes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  recurso TEXT NOT NULL,
  operacao TEXT NOT NULL,
  permitido BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id, recurso, operacao)
);
```

**Rationale**:
- ✅ **Simplicidade**: Estrutura flat, fácil de entender e consultar
- ✅ **Performance**: Índice composto `(usuario_id, recurso, operacao)` torna queries instantâneas
- ✅ **Flexibilidade**: Campo `permitido` permite negar permissões explicitamente (futuro)
- ✅ **Constraint UNIQUE**: Evita duplicatas

**Alternatives Considered**:
- **JSONB**: Armazenar permissões em campo JSONB. Rejeitado. Dificulta queries e indexação.
- **Tabela de junção**: `usuario_id` + `permissao_id` (com tabela `permissoes_disponiveis`). Rejeitado. Adiciona complexidade sem benefício claro.

### 5. Matriz de Permissões Hardcoded

**Decision**: Criar constante `MATRIZ_PERMISSOES` no código com todos os recursos e operações.

**Implementation**:
```typescript
// backend/types/permissoes/types.ts
export const MATRIZ_PERMISSOES = {
  advogados: ['listar', 'visualizar', 'criar', 'editar', 'deletar'],
  credenciais: ['listar', 'visualizar', 'criar', 'editar', 'deletar', 'ativar_desativar'],
  acervo: ['listar', 'visualizar', 'editar', 'atribuir_responsavel', 'desatribuir_responsavel', 'transferir_responsavel'],
  audiencias: ['listar', 'visualizar', 'editar', 'atribuir_responsavel', 'desatribuir_responsavel', 'transferir_responsavel', 'editar_url_virtual'],
  // ... 13 domínios, 81 permissões
};
```

**Rationale**:
- ✅ **Type Safety**: TypeScript valida recursos e operações em compile-time
- ✅ **Documentação**: Serve como fonte única de verdade para permissões disponíveis
- ✅ **Frontend**: Pode ser usado para renderizar matriz de checkboxes
- ✅ **Validação**: Rejeitar permissões inválidas em runtime

**Alternatives Considered**:
- **Tabela no banco**: Criar tabela `recursos` e `operacoes`. Rejeitado. Adiciona complexidade sem ganho significativo. Permissões são relativamente estáveis.

### 6. Middleware de Autorização

**Decision**: Criar helper `checkPermission` e wrapper `requirePermission` para Next.js API routes.

**Implementation**:
```typescript
// backend/utils/auth/authorization.ts
export async function checkPermission(
  usuarioId: number,
  recurso: string,
  operacao: string
): Promise<boolean> {
  // Lógica descrita na Decision 3
}

// backend/utils/auth/require-permission.ts
export function requirePermission(recurso: string, operacao: string) {
  return async (req: NextRequest) => {
    const authResult = await authenticateRequest(req);
    if (!authResult.authenticated || !authResult.usuarioId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasPermission = await checkPermission(authResult.usuarioId, recurso, operacao);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return null; // Continuar
  };
}
```

**Usage**:
```typescript
// app/api/contratos/route.ts
export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (!authResult.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verificar permissão
  const hasPermission = await checkPermission(authResult.usuarioId!, 'contratos', 'listar');
  if (!hasPermission) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Continuar com lógica...
}
```

**Rationale**:
- ✅ **Reutilizável**: Pode ser usado em todas as rotas
- ✅ **Consistente**: Padrão uniforme de verificação
- ✅ **Testável**: Funções puras, fáceis de testar

### 7. Cache de Permissões (In-Memory)

**Decision**: Implementar cache in-memory com TTL de 5 minutos para `checkPermission`.

**Implementation**:
```typescript
const permissionCache = new Map<string, { result: boolean; expiry: number }>();

export async function checkPermission(
  usuarioId: number,
  recurso: string,
  operacao: string
): Promise<boolean> {
  const cacheKey = `${usuarioId}:${recurso}:${operacao}`;
  const cached = permissionCache.get(cacheKey);

  if (cached && Date.now() < cached.expiry) {
    return cached.result;
  }

  // Buscar do banco...
  const result = await fetchPermission(usuarioId, recurso, operacao);

  // Cache por 5 minutos
  permissionCache.set(cacheKey, {
    result,
    expiry: Date.now() + 5 * 60 * 1000,
  });

  return result;
}
```

**Rationale**:
- ✅ **Performance**: Evita queries repetidas ao banco
- ✅ **Simplicidade**: Não requer Redis ou serviço externo
- ✅ **TTL curto**: 5 minutos garante que mudanças sejam refletidas rapidamente
- ❌ **Trade-off**: Cache não é compartilhado entre instâncias (para múltiplos pods)

**Future Improvement**: Migrar para Redis quando o sistema escalar para múltiplas instâncias.

### 8. Restrição de Deleção de Cargos

**Decision**: Não permitir deletar cargo se ele estiver associado a usuários. Retornar erro 400 com lista de usuários.

**Implementation**:
```typescript
// backend/cargos/services/cargos/deletar-cargo.service.ts
export async function deletarCargo(cargoId: number) {
  const usuarios = await listarUsuariosComCargo(cargoId);

  if (usuarios.length > 0) {
    throw new Error(`Não é possível deletar o cargo. ${usuarios.length} usuário(s) associado(s): ${usuarios.map(u => u.nome_completo).join(', ')}`);
  }

  await deletarCargoPersistence(cargoId);
}
```

**Rationale**:
- ✅ **Integridade de Dados**: Evita usuários ficarem com `cargo_id` referenciando cargo inexistente
- ✅ **UX**: Retornar lista de usuários ajuda o admin a saber quem desassociar
- ✅ **Segurança**: Prevent accidental data loss

**Alternative**: Usar `ON DELETE SET NULL`. Rejeitado. Cliente preferiu controle explícito.

### 9. Nomenclatura de Recursos e Operações

**Decision**: Usar snake_case para recursos e operações (ex: `pendentes`, `atribuir_responsavel`).

**Rationale**:
- ✅ **Consistência**: Alinhado com nomenclatura do banco de dados (snake_case)
- ✅ **Simplicidade**: Evita conversões entre camelCase e snake_case
- ✅ **Clareza**: Nomes descritivos (ex: `editar_url_virtual`, `gerenciar_permissoes`)

**Examples**:
```typescript
checkPermission(userId, 'audiencias', 'editar_url_virtual');
checkPermission(userId, 'pendentes', 'baixar_expediente');
checkPermission(userId, 'usuarios', 'gerenciar_permissoes');
```

### 10. RLS (Row Level Security)

**Decision**: Habilitar RLS nas tabelas `cargos` e `permissoes` com políticas permissivas.

**Policies**:
```sql
-- Cargos: Todos os usuários autenticados podem ler
CREATE POLICY "Usuários autenticados podem ler cargos"
  ON cargos FOR SELECT
  USING (auth.role() = 'authenticated');

-- Cargos: Apenas super admins podem criar/editar/deletar (verificado no backend)
CREATE POLICY "Usuários autenticados podem gerenciar cargos"
  ON cargos FOR ALL
  USING (auth.role() = 'authenticated');

-- Permissoes: Usuários podem ler suas próprias permissões
CREATE POLICY "Usuários podem ler suas próprias permissões"
  ON permissoes FOR SELECT
  USING (auth.role() = 'authenticated' AND usuario_id = (SELECT id FROM usuarios WHERE auth_user_id = auth.uid()));

-- Permissoes: Apenas super admins podem gerenciar permissões (verificado no backend)
CREATE POLICY "Usuários autenticados podem gerenciar permissões"
  ON permissoes FOR ALL
  USING (auth.role() = 'authenticated');
```

**Rationale**:
- ✅ **Segurança**: RLS garante proteção no nível do banco
- ✅ **Flexibilidade**: Políticas permissivas + verificação no backend = controle fino
- ✅ **Supabase Best Practice**: RLS sempre habilitado

## Risks / Trade-offs

### Risk 1: Performance de Verificação de Permissões
**Risk**: Verificar permissões em toda requisição pode adicionar latência.

**Mitigation**:
- ✅ Cache in-memory com TTL de 5 minutos
- ✅ Índice composto `(usuario_id, recurso, operacao)` na tabela `permissoes`
- ✅ Query otimizada: `SELECT permitido WHERE usuario_id = X AND recurso = Y AND operacao = Z LIMIT 1`
- ✅ Futuro: Migrar para Redis se necessário

### Risk 2: Complexidade de Gerenciamento (81 Permissões)
**Risk**: Atribuir 81 permissões manualmente por usuário pode ser trabalhoso.

**Mitigation**:
- ✅ Interface frontend com matriz de checkboxes (proposta futura)
- ✅ Operações em batch (atribuir/revogar múltiplas permissões de uma vez)
- ✅ Super admins bypassam gerenciamento manual
- ✅ Futuro: Templates de permissões (ex: "Perfil Estagiário", "Perfil Advogado")

### Risk 3: Desatualização da Matriz de Permissões
**Risk**: Ao adicionar novos domínios/operações, esquecer de atualizar `MATRIZ_PERMISSOES`.

**Mitigation**:
- ✅ Documentar processo: Toda nova rota deve adicionar permissão na matriz
- ✅ Teste automatizado (futuro): Verificar que todas as rotas têm permissões correspondentes
- ✅ OpenSpec: Documentar mudanças em specs afetadas

### Risk 4: Super Admin Ilimitado
**Risk**: Super admins têm poder absoluto, sem auditoria de ações.

**Mitigation**:
- ✅ Usar super admin apenas para poucos usuários de confiança
- ✅ Logs de auditoria registram ações mesmo de super admins
- ✅ Futuro: Alertas para ações críticas de super admins

## Migration Plan

### Phase 1: Backend (Esta Proposta)
1. ✅ Criar migrations (cargos, permissoes, alter usuarios)
2. ✅ Criar types e interfaces
3. ✅ Criar serviços de persistência
4. ✅ Criar serviços de negócio
5. ✅ Criar rotas API
6. ✅ Criar middleware de autorização
7. ✅ Testar manualmente
8. ✅ Validar OpenSpec

### Phase 2: Integração de Middleware (Opcional, Pode Ser Gradual)
1. ✅ Adicionar `checkPermission` em rotas críticas primeiro (ex: deletar, executar capturas)
2. ✅ Expandir gradualmente para todas as rotas
3. ✅ Monitorar logs de acesso negado

### Phase 3: Frontend (Proposta Futura)
1. ✅ Criar interface de CRUD de cargos
2. ✅ Criar interface de gerenciamento de permissões (matriz de checkboxes)
3. ✅ Adicionar seção no perfil de usuário para editar permissões
4. ✅ Adicionar indicador visual de super admin

### Rollback Plan
Se algo der errado:
1. ✅ Revert migrations (já testadas em dev)
2. ✅ Remover middleware de autorização das rotas
3. ✅ Sistema volta ao estado anterior (sem controle de permissões)
4. ✅ **Nenhum dado é perdido** (migrations são aditivas)

## Open Questions

1. **Cache distribuído**: Quando migrar para Redis? Sugestão: quando > 10 requisições/segundo.
2. **Templates de permissões**: Criar "perfis pré-definidos" (ex: "Perfil Estagiário") para facilitar gerenciamento? Sugestão: implementar em fase futura se necessário.
3. **Logs de acesso negado**: Criar tabela de auditoria para acessos negados? Sugestão: implementar em fase futura se necessário.
4. **Permissões hierárquicas**: Ex: `contratos.*` para dar todas as permissões de contratos? Sugestão: não implementar agora, adicionar complexidade sem necessidade clara.

## Success Metrics

- ✅ **Funcionalidade**: CRUD de cargos funciona corretamente
- ✅ **Funcionalidade**: Gerenciamento de permissões funciona corretamente
- ✅ **Performance**: `checkPermission` executa em < 10ms (com cache)
- ✅ **Segurança**: RLS habilitado e políticas funcionando
- ✅ **Retrocompatibilidade**: Sistema existente continua funcionando sem quebrar
- ✅ **Validação**: `openspec validate --strict` passa sem erros
