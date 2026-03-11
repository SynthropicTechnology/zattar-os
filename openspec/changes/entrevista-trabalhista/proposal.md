## Why

A equipe jurídica precisa de um fluxo estruturado para conduzir entrevistas de investigação trabalhista diretamente a partir do contrato. Hoje, a coleta de fatos probatórios é feita de forma informal (caderno, WhatsApp, e-mail), o que causa perda de informações críticas, inconsistência entre entrevistadores e impossibilita a automação futura de petições via IA. O sistema deve funcionar como uma **matriz de extração probatória** que guia operadores (incluindo estagiários e paralegais juniores) por todos os checkpoints relevantes, garantindo completude e qualidade dos dados coletados.

A arquitetura é baseada em uma **bifurcação ontológica** (Nó Zero) que tipifica a natureza da relação de trabalho antes de carregar a árvore de decisão correspondente. Neste MVP, implementamos apenas a trilha **Trabalhista Clássica** (Empresa Física/Tradicional), deixando as trilhas Gig Economy e Pejotização como extensões futuras sobre a mesma infraestrutura.

## What Changes

### Banco de dados
- **Nova tabela `entrevistas_trabalhistas`**: registro principal da entrevista, vinculado ao contrato, com `tipo_litigio`, `status`, `respostas` (JSONB), `notas_operador` (JSONB), `modulo_atual` (para save & continue), `testemunhas_mapeadas`
- **Nova tabela `entrevista_anexos`**: anexos probatórios contextualizados por módulo e nó de referência (foto CTPS, prints WhatsApp, áudio de relato, TRCT, extrato FGTS)
- **Novos enums**: `tipo_litigio_trabalhista` (trabalhista_classico, gig_economy, pejotizacao), `status_entrevista` (rascunho, em_andamento, concluida)

### Backend (feature module)
- **Novo módulo `entrevistas-trabalhistas/`**: domain types, Zod schemas, repository, service, server actions, hooks
- **Schemas tipados por trilha**: definição dos módulos e campos de cada trilha (classico MVP) com validação Zod
- **CRUD completo**: criar entrevista, salvar progresso por módulo (auto-save), finalizar, reabrir para edição
- **Upload de anexos**: vinculados ao módulo e nó específico da entrevista

### Frontend (UI)
- **Nova aba "Entrevista"** na página de detalhe do contrato (`/app/contratos/[id]`), 5ª aba após "Histórico"
- **Nó Zero (Bifurcação)**: seleção visual com cards grandes do tipo de litígio — define a trilha a ser carregada
- **Wizard stepper** (4 módulos da trilha clássica) usando `FormStepLayout` + `DesktopStepper`:
  - **Módulo A.1 — Vínculo**: CTPS assinada, informalidade, subordinação, uploads probatórios
  - **Módulo A.2 — Jornada**: controle de ponto, horas extras, intervalo, tooltips de inversão de ônus
  - **Módulo A.3 — Saúde e Ambiente**: exposição a riscos (tipificação), assédio/danos morais, provas
  - **Módulo A.4 — Ruptura**: motivo do desligamento, verbas rescisórias, FGTS, seguro-desemprego
- **Campos condicionais**: campos que aparecem/desaparecem baseado em respostas anteriores (ex: "Sem registro" revela campo de subordinação)
- **Tooltips para operador**: alertas contextuais de orientação jurídica (ex: inversão de ônus da prova em ponto britânico)
- **Visualização read-only**: entrevista concluída renderizada em acordeões por módulo, com anexos inline
- **Auto-save por módulo**: progresso salvo a cada avanço de step, permitindo retomar depois

### Integração com IA (preparação)
- **Payload JSON estruturado**: ao finalizar, a entrevista produz um JSON tipado (com `tipo_litigio`, `perfil_reclamante`, `modulos_processados`, `testemunhas_mapeadas`, `anexos_vinculados`) pronto para consumo pelo backend de geração de petições

## Capabilities

### New Capabilities
- `entrevista-trabalhista`: Ficha de entrevista de investigação trabalhista integrada ao contrato, com bifurcação por tipo de litígio, wizard por módulos, campos condicionais, uploads de anexos probatórios, auto-save e visualização da entrevista concluída. MVP: trilha Trabalhista Clássica (módulos Vínculo, Jornada, Saúde/Ambiente, Ruptura).

### Modified Capabilities
- `contratos`: Adição de nova aba "Entrevista" na página de detalhe do contrato e relação 1:1 com a entrevista trabalhista.

## Impact

### Código afetado
- **`src/app/app/contratos/[id]/`**: nova aba + fetch da entrevista no server component
- **`src/features/contratos/`**: tipos atualizados para incluir relação com entrevista
- **Novo `src/features/entrevistas-trabalhistas/`**: módulo completo

### Banco de dados
- 2 novas tabelas + 2 novos enums
- FK de `entrevistas_trabalhistas.contrato_id` → `contratos.id`
- RLS policies para controle de acesso

### Dependências
- Nenhuma dependência externa nova — usa componentes de UI, React Hook Form, Zod e padrões de upload já existentes no projeto
