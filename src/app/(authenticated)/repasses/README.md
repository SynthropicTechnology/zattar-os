# Repasses (Proxy)

## Status
**Módulo intencionalmente minimal** — é uma camada de UI sobre o módulo [`obrigacoes`](../obrigacoes/).

## O que este módulo é
Uma rota (`/repasses`) que renderiza `RepassesPageContent`, que por sua vez consome:
- `RepassesPendentesList` (de `obrigacoes`)
- `UploadDeclaracaoDialog` (de `obrigacoes`)
- `UploadComprovanteDialog` (de `obrigacoes`)

Repasses são **parcelas de obrigações** (acordos judiciais) que precisam ser repassadas ao cliente. A lógica de negócio (criação, validação, vinculação a parcelas, geração de declaração, comprovação de pagamento) vive **inteiramente** no módulo `obrigacoes`.

## Por que não tem `domain.ts`/`service.ts`/`repository.ts`?
- Repasses são uma **visão filtrada** de parcelas de obrigações — não uma entidade independente
- Toda a lógica está em `obrigacoes/service.ts` e `obrigacoes/repository.ts`
- Criar camadas próprias aqui seria duplicar `obrigacoes` sem valor agregado

## Onde está a lógica real
- **Domínio + Service + Repository**: [src/app/(authenticated)/obrigacoes/](../obrigacoes/)
- **Regras de negócio**: [obrigacoes/RULES.md](../obrigacoes/RULES.md) — seções de parcelas e repasses
- **Componentes consumidos**: `RepassesPendentesList`, `UploadDeclaracaoDialog`, `UploadComprovanteDialog`

## Quando este módulo evoluiria
Se repasses ganharem regras fundamentalmente distintas das parcelas (ex: cálculo próprio de imposto, fluxo de aprovação independente), faria sentido extrair para módulo próprio. **Hoje, é uma janela sobre `obrigacoes`.**
