# Documentação do Zattar OS (Synthropic)

Este diretório contém a documentação técnica central focada em decisões arquiteturais, estruturais e integração sistêmica.
*(Manuais instrucionais de como as IAs devem manobrar código estão primariamente registrados no `AGENTS.md` e `CLAUDE.md` na base da árvore de arquivos).*

## Arquitetura Global e Inteligência Lógica
Diretório: `/docs/architecture/`

| Arquivo                             | Descrição                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------ |
| [`ARCHITECTURE.md`](./architecture/ARCHITECTURE.md) | Panorama definitivo. Contém o fluxograma de requisições, modelo de FSD Colocated e camadas de dados. |
| [`AGENTS.md`](./architecture/AGENTS.md)             | Diretrizes táticas e técnicas exclusivas para agentes virtuais que operam dentro do Synthropic. Detalha arquiteturas restritivas e injeção de Server Actions ao Model Context Protocol. |
| [`STATUS.md`](./architecture/STATUS.md) | Aferição e rastreio situacional macro dos módulos que constituíem este software. |

## Módulos e Regras de Negócios

A documentação pertinente ao estado local das regras de negócio **não mora aqui**. Ela é descentralizada (Colocation).  
Para acessar regras essenciais e especificações referentes a um pilar estrutural ou feature do Zattar OS, navegue para o interior de seu próprio pacote.

O arquivo oficial utilizado para registro das normas e regras do módulo é sempre o `RULES.md`, localizado na raiz de cada pacote. Além disto, diretórios `/docs` internos também são amplamente usados para detalhamento local.

> Exemplos:
> - Para revisar Inteligência de Documentos, acesse `src/app/(authenticated)/documentos/RULES.md`
> - Para revisar Autenticação de Assinaturas, acesse `src/app/(authenticated)/assinatura-digital/docs/...`
> - Para acessar as APIs de Captura de Dados Diários, acesse `src/features/captura/docs/...`
