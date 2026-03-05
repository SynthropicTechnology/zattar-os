# Índice de Features (FSD)

Este documento acompanha o estado real de `src/features/` e da documentação em `docs/modules/`.

> Convenção: evitar imports profundos. Preferir sempre `@/features/<modulo>` (barrel export via `index.ts`).
> Sincronização automática deste índice: `npm run docs:sync:modules`.

## Resumo (2026-02-26)

<!-- AUTO-GENERATED:START -->
- Módulos em `src/features`: **38**
- Pastas em `docs/modules`: **38**
- Módulos sem pasta em `docs/modules`: `agenda-eventos`
- Pasta sem módulo correspondente em `src/features`: `assinatura-digital`

## Classificação estrutural dos módulos

Critério de módulo **completo**: `domain.ts` + `service.ts` + `repository.ts` + `index.ts` + `actions/` + `components/`.

- ✅ **Completos (18)**: `acervo`, `advogados`, `ai`, `captura`, `config-atribuicao`, `contratos`, `dify`, `enderecos`, `integracoes`, `notificacoes`, `obrigacoes`, `pecas-juridicas`, `pericias`, `processos`, `rh`, `system-prompts`, `tipos-expedientes`, `usuarios`
- ⚠️ **Parciais (14)**: `agenda-eventos`, `assistentes-tipos`, `audiencias`, `calendar`, `cargos`, `chat`, `chatwoot`, `documentos`, `expedientes`, `financeiro`, `partes`, `perfil`, `profiles`, `tags`
- 🧩 **Iniciais (6)**: `admin`, `audit`, `busca`, `repasses`, `tasks`, `twofauth`

## Cobertura de artefatos por módulo

| Artefato              | Cobertura |
| --------------------- | --------- |
| `index.ts`            | 37/38     |
| `components/`         | 30/38     |
| `domain.ts`           | 30/38     |
| `actions/`            | 29/38     |
| `service.ts`          | 28/38     |
| `repository.ts`       | 25/38     |
| `RULES.md`            | 9/38      |
| `README.md` no módulo | 6/38      |

## Documentação funcional disponível

Índice navegável com status (ordem alfabética):

| Módulo | Documento | Status estrutural | Observação |
| --- | --- | --- | --- |
| acervo | [README](./acervo/README.md) | Completo | — |
| admin | [README](./admin/README.md) | Inicial | — |
| advogados | [README](./advogados/README.md) | Completo | — |
| ai | [README](./ai/README.md) | Completo | — |
| assinatura-digital | [README](./assinatura-digital/README.md) | Histórico | Não há módulo correspondente em `src/features` |
| assistentes-tipos | [README](./assistentes-tipos/README.md) | Parcial | — |
| audiencias | [README](./audiencias/README.md) | Parcial | — |
| audit | [README](./audit/README.md) | Inicial | — |
| busca | [README](./busca/README.md) | Inicial | — |
| calendar | [README](./calendar/README.md) | Parcial | — |
| captura | [README](./captura/README.md) | Completo | — |
| cargos | [README](./cargos/README.md) | Parcial | — |
| chat | [README](./chat/README.md) | Parcial | — |
| chatwoot | [README](./chatwoot/README.md) | Parcial | — |
| config-atribuicao | [README](./config-atribuicao/README.md) | Completo | — |
| contratos | [README](./contratos/README.md) | Completo | — |
| dify | [README](./dify/README.md) | Completo | — |
| documentos | [README](./documentos/README.md) | Parcial | — |
| enderecos | [README](./enderecos/README.md) | Completo | — |
| expedientes | [README](./expedientes/README.md) | Parcial | — |
| financeiro | [README](./financeiro/README.md) | Parcial | — |
| integracoes | [README](./integracoes/README.md) | Completo | — |
| notificacoes | [README](./notificacoes/README.md) | Completo | — |
| obrigacoes | [README](./obrigacoes/README.md) | Completo | — |
| partes | [README](./partes/README.md) | Parcial | — |
| pecas-juridicas | [README](./pecas-juridicas/README.md) | Completo | — |
| perfil | [README](./perfil/README.md) | Parcial | — |
| pericias | [README](./pericias/README.md) | Completo | — |
| processos | [README](./processos/README.md) | Completo | — |
| profiles | [README](./profiles/README.md) | Parcial | — |
| repasses | [README](./repasses/README.md) | Inicial | — |
| rh | [README](./rh/README.md) | Completo | — |
| system-prompts | [README](./system-prompts/README.md) | Completo | — |
| tags | [README](./tags/README.md) | Parcial | — |
| tasks | [README](./tasks/README.md) | Inicial | — |
| tipos-expedientes | [README](./tipos-expedientes/README.md) | Completo | — |
| twofauth | [README](./twofauth/README.md) | Inicial | — |
| usuarios | [README](./usuarios/README.md) | Completo | — |
<!-- AUTO-GENERATED:END -->

## Testes por feature

Scripts úteis (quando aplicável) no `package.json`:

- `npm run test:actions:processos`
- `npm run test:actions:partes`
- `npm run test:actions:financeiro`
- `npm run test:enderecos`
- `npm run test:pericias`

E2E (Playwright): `npm run test:e2e` (docs: `../../src/testing/e2e/README.md`).



