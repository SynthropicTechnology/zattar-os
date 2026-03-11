## MODIFIED Requirements

### Requirement: Visualização de Detalhes do Contrato
O sistema MUST permitir visualizar detalhes completos de um contrato em página de detalhe com abas, incluindo a aba de Entrevista Trabalhista.

#### Scenario: Abas disponíveis no detalhe do contrato
- **WHEN** o usuário acessa a página de detalhe do contrato (`/app/contratos/[id]`)
- **THEN** o sistema MUST exibir 5 abas: Resumo, Financeiro, Documentos, Histórico, **Entrevista**
- **AND** a aba Entrevista MUST usar o ícone `ClipboardList` (lucide-react)
- **AND** a aba Entrevista MUST ser a última aba na ordem

#### Scenario: Aba Entrevista sem entrevista iniciada
- **WHEN** o usuário acessa a aba Entrevista de um contrato que não possui entrevista
- **THEN** o sistema MUST exibir estado vazio com botão "Iniciar Entrevista"
- **AND** ao clicar, MUST iniciar o fluxo do Nó Zero (bifurcação)

#### Scenario: Aba Entrevista com entrevista em andamento
- **WHEN** o usuário acessa a aba Entrevista de um contrato com entrevista `em_andamento`
- **THEN** o sistema MUST exibir resumo do progresso (módulos concluídos / total)
- **AND** botão "Continuar Entrevista" que posiciona no `modulo_atual`

#### Scenario: Aba Entrevista com entrevista concluída
- **WHEN** o usuário acessa a aba Entrevista de um contrato com entrevista `concluida`
- **THEN** o sistema MUST exibir a entrevista em modo read-only (acordeões por módulo)
- **AND** botão "Editar" para reabrir a entrevista

#### Scenario: Fetch de dados da entrevista no server component
- **WHEN** a página de detalhe do contrato é carregada
- **THEN** o sistema MUST buscar a entrevista associada ao contrato (se existir)
- **AND** passar os dados da entrevista para o client component
- **AND** não MUST impactar o carregamento das demais abas (dados carregados em paralelo)
