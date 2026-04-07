# Editor (Proxy)

## Status
**Módulo intencionalmente minimal** — não possui estrutura FSD própria por design.

## O que este módulo é
Apenas uma rota (`/editor`) que carrega de forma **lazy** o componente `PlateEditor` localizado em [src/components/editor/plate/plate-editor.tsx](../../../components/editor/plate/plate-editor.tsx).

A estrutura do editor de fato (extensions, plugins, regras de formatação, atalhos) vive em `src/components/editor/plate/`, **não** neste módulo.

## Por que não tem `domain.ts`/`service.ts`/`repository.ts`?
- Não há entidades de negócio próprias
- Não há persistência (o conteúdo gerado é consumido por outros módulos como `pecas-juridicas` e `documentos`)
- Não há regras de validação além das do PlateEditor
- Forçar estrutura FSD aqui criaria arquivos vazios sem valor

## Quando este módulo evoluiria
Se for necessário, no futuro:
- Persistir documentos diretamente do editor (sem passar por outro módulo)
- Versionar conteúdo
- Aplicar regras de negócio específicas (templates, placeholders, validações)

Aí faria sentido extrair domain/service/repository. **Hoje, não há nada para abstrair.**

## Onde está a lógica real
- **Componente principal**: [src/components/editor/plate/plate-editor.tsx](../../../components/editor/plate/plate-editor.tsx)
- **Plugins**: `src/components/editor/plate/plugins/`
- **Consumidores**: `pecas-juridicas`, `documentos`, `notas` (parcialmente)
