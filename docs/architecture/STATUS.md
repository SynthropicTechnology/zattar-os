# Relatório de Status do Projeto Synthropic

**Data:** 2026-04-06  
**Versão:** Next.js 16 / React 19

## 1. Resumo Executivo

O projeto consolida-se primariamente sob o padrão **Feature-Sliced Design (Colocated)**, possuindo nativamente a infraestrutura orientada a domínios alojadas junto de suas próprias rotas em `src/app/(authenticated)/`. 
Toda a documentação agora reside de forma auto-contida dentro dos próprios módulos.

## 2. Status Estrutural dos Módulos FSD

A conformidade ao modelo FSD é ditada pela estrutura interna contendo: `domain.ts`, `service.ts`, `repository.ts`, `index.ts`, `actions/` e `components/`.

| Maturidade       | Módulos                                                                                                                                                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ✅ **Sólidos**   | `acervo`, `advogados`, `ai`, `assistentes-tipos`, `audiencias`, `captura`, `chatwoot`, `config-atribuicao`, `contratos`, `dify`, `enderecos`, `entrevistas-trabalhistas`, `expedientes`, `integracoes`, `notificacoes`, `obrigacoes`, `pecas-juridicas`, `pericias`, `processos`, `rh`, `system-prompts`, `tipos-expedientes`, `usuarios` |
| ⚠️ **Em Evolução** | `calendar`, `cargos`, `chat`, `documentos`, `financeiro`, `partes`, `perfil`, `tags`                                                                                                                                                                        |
| 🧩 **Iniciais**    | `admin`, `agenda-eventos`, `audit`, `busca`, `calculadoras`, `portal`, `profiles`, `repasses`, `tasks`, `twofauth`, `website`                                                                                                                               |

## 3. Estado da Documentação (Colocation)

Todos os contextos teóricos ou integrações que requerem documentação isolada foram migrados em regime de "colocation" para o repositório orgânico do seu módulo (arquivos `RULES.md` na raiz do módulo ou eventuais subdiretórios `/docs`). A documentação raiz não retém mais fluxos sistêmicos granulares de regras de negócio.

## 4. Próximos Passos Recomendados

1. Universalizar o esqueleto FSD aos 13 módulos em evolução, completando as implementações de `domain`, `service` e `repository`.
2. Expandir iterativamente o `RULES.md` por módulo para fortificar o suporte a IA e ao tooling MCP.
