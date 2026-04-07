# Módulos Intencionalmente Minimais

> **Propósito deste documento**: Registrar quais módulos do Sinesys são intencionalmente embrionários ou minimais, e **por quê**. Isto evita que desenvolvedores futuros (humanos ou IA) tentem "consertar" módulos cuja simplicidade é uma decisão arquitetural, não uma omissão.

## Princípio: YAGNI ≠ Abandono

YAGNI (*You Aren't Gonna Need It*) é o princípio de não construir abstrações até que a necessidade seja real. Aplicado a módulos do Sinesys, isso significa:

- **Não criar** `domain.ts`/`service.ts`/`repository.ts` quando o módulo não tem entidades de negócio ou persistência
- **Não criar** stubs vazios "para padronizar" — eles viram dívida técnica disfarçada de FSD compliance
- **Não duplicar** lógica que vive em outro módulo só para satisfazer auditorias estruturais

Em contrapartida, **sempre deixar uma marca explicativa** (README.md ou nota inline) explicando o estado intencional. A ausência intencional documentada vale mais que arquivos vazios.

## Categorias

### 1. Proxies e Wrappers de UI
Módulos que apenas servem uma rota HTTP renderizando UI exportada por outro módulo. Não têm regras de negócio próprias.

| Módulo | Wrapper sobre | Lógica real em |
|--------|---------------|----------------|
| [`comunica-cnj`](../../src/app/(authenticated)/comunica-cnj/README.md) | `captura` (componente `ComunicaCNJTabsContent`) | [captura/RULES.md](../../src/app/(authenticated)/captura/RULES.md) |
| [`repasses`](../../src/app/(authenticated)/repasses/README.md) | `obrigacoes` (componentes de parcelas) | [obrigacoes/RULES.md](../../src/app/(authenticated)/obrigacoes/RULES.md) |
| [`editor`](../../src/app/(authenticated)/editor/README.md) | `src/components/editor/plate/` | Componente PlateEditor diretamente |

**Regra**: Se for necessário promover um proxy a módulo independente (porque ganhou regras próprias), extrair `domain.ts`/`service.ts`/`repository.ts` na ocasião — não antes.

### 2. Sistemas Auto-Descritivos
Módulos cujo "domínio" é a própria estrutura de arquivos ou um registry estático.

| Módulo | Por que é minimal |
|--------|-------------------|
| [`ajuda`](../../src/app/(authenticated)/ajuda/README.md) | Sistema de docs com `docs-registry.ts` + lazy loading. O registry é a fonte da verdade. Sem entidades, sem persistência. |

### 3. Cálculos Puros (sem persistência)
Módulos com fórmulas determinísticas que rodam client-side sem precisar de service/repository.

| Módulo | Fórmulas |
|--------|----------|
| [`calculadoras`](../../src/app/(authenticated)/calculadoras/RULES.md) | Horas extras (atualmente) — fórmulas trabalhistas documentadas no RULES.md |

**Regra**: Quando uma calculadora ganhar persistência (histórico, versionamento legal), extrair domínio na ocasião.

### 4. FSD Aninhado em `feature/`
Módulos com estrutura FSD completa, mas localizada em `feature/` em vez da raiz do módulo. Auditorias automáticas podem confundir com stubs — não são.

| Módulo | FSD localizado em |
|--------|-------------------|
| [`assinatura-digital`](../../src/app/(authenticated)/assinatura-digital/README.md) | [`feature/`](../../src/app/(authenticated)/assinatura-digital/feature/) — inclui RULES.md, README.md, MIGRATION.md |
| [`pangea`](../../src/app/(authenticated)/pangea/feature/RULES.md) | [`feature/`](../../src/app/(authenticated)/pangea/feature/) — busca BNP/CNJ |
| [`financeiro`](../../src/app/(authenticated)/financeiro/) | Subdiretórios `domain/`, `services/`, `repository/` (organização por sub-feature) |

### 5. Módulos com Substância Própria mas Estrutura Diferente
Módulos que têm services e repositories, mas organizados por feature em vez de arquivos flat na raiz.

| Módulo | Organização |
|--------|-------------|
| [`admin`](../../src/app/(authenticated)/admin/RULES.md) | `services/` + `repositories/` + `actions/` (sem `domain.ts` único — cada feature tem seus tipos) |
| [`dashboard`](../../src/app/(authenticated)/dashboard/RULES.md) | `repositories/` (subdir) + `service.ts` (raiz) — agregador de métricas |

## Quando promover um módulo minimal

Considere promover um módulo desta lista para FSD completo quando:

1. **Surgirem entidades próprias** que não cabem em outro módulo
2. **Houver persistência específica** (tabela própria, regras de cache próprias)
3. **Aparecerem regras de negócio** que justifiquem um service distinto
4. **Outras partes do código** começarem a importar lógica diretamente desses módulos

Quando promover, **remover** a entrada desta lista e criar `domain.ts`/`service.ts`/`repository.ts`/`RULES.md` no padrão FSD canônico.

## Anti-padrões a evitar

- ❌ **Criar `domain.ts` vazio** "para padronizar"
- ❌ **Criar `service.ts` que apenas chama outro service** (pass-through indireto)
- ❌ **Criar RULES.md vazio** ou com "TBD" — preferir omitir
- ❌ **Duplicar tipos** entre módulo proxy e módulo origem
- ❌ **Mover lógica de um módulo maduro** para um módulo minimal só por organização visual

## Histórico

| Data | Mudança |
|------|---------|
| 2026-04-07 | Documento criado após universalização da camada FSD nos módulos Tier 2/3 |
