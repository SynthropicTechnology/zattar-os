# Comunica CNJ (Proxy)

## Status
**Módulo intencionalmente minimal** — não possui estrutura FSD própria por design.

## O que este módulo é
Apenas uma rota (`/comunica-cnj`) que renderiza o componente `ComunicaCNJTabsContent` exportado pelo módulo [`captura`](../captura/).

A lógica de negócio do Comunica CNJ (consulta da API do CNJ, persistência de comunicações, recovery, reprocessamento) vive **inteiramente** dentro do módulo `captura`.

## Por que não tem `domain.ts`/`service.ts`/`repository.ts`?
- É apenas uma rota alternativa para uma feature de `captura`
- Toda a lógica e regras já estão documentadas em [captura/RULES.md](../captura/RULES.md)
- Duplicar código ou criar wrappers seria DRY-violation

## Onde está a lógica real
- **Domínio + Service + Repository**: [src/app/(authenticated)/captura/](../captura/)
- **Regras de negócio**: [captura/RULES.md](../captura/RULES.md) — seção "Comunica CNJ"
- **Componente exportado**: `ComunicaCNJTabsContent` em `captura/components/`

## Quando este módulo evoluiria
Se Comunica CNJ ganhar lógica fundamentalmente diferente da captura PJE (ex: pipelines distintos, persistência separada, regras próprias), faria sentido extrair para módulo próprio. **Hoje, é apenas uma rota cosmética.**
