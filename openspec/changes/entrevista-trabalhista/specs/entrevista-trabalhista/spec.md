## ADDED Requirements

### Requirement: Persistência de entrevistas trabalhistas
O sistema MUST armazenar entrevistas trabalhistas vinculadas a contratos, com suporte a múltiplos tipos de litígio e respostas estruturadas em JSONB.

#### Scenario: Criação de entrevista trabalhista para um contrato
- **WHEN** o operador inicia uma entrevista a partir da aba Entrevista de um contrato
- **THEN** o sistema MUST criar um registro em `entrevistas_trabalhistas` com `contrato_id`, `tipo_litigio`, `status = 'rascunho'` e `created_by`
- **AND** o campo `respostas` MUST ser inicializado como objeto JSONB vazio `{}`
- **AND** o campo `modulo_atual` MUST ser definido como `'no_zero'`

#### Scenario: Constraint de unicidade contrato ↔ entrevista
- **WHEN** já existe uma entrevista para o contrato
- **THEN** o sistema MUST impedir a criação de uma segunda entrevista (UNIQUE constraint em `contrato_id`)
- **AND** retornar erro informativo ao operador

#### Scenario: Tipos de litígio suportados
- **WHEN** o operador seleciona o tipo de litígio no Nó Zero
- **THEN** o sistema MUST aceitar os valores: `trabalhista_classico`, `gig_economy`, `pejotizacao`
- **AND** armazenar o valor selecionado no campo `tipo_litigio`

#### Scenario: Status da entrevista
- **WHEN** a entrevista é manipulada
- **THEN** o sistema MUST manter o campo `status` com um dos valores: `rascunho`, `em_andamento`, `concluida`
- **AND** transições válidas são: `rascunho → em_andamento → concluida` e `concluida → em_andamento` (reabrir para edição)

### Requirement: Bifurcação ontológica (Nó Zero)
O sistema MUST apresentar uma seleção de tipo de litígio como primeiro passo da entrevista, determinando qual árvore de módulos será carregada.

#### Scenario: Apresentação do Nó Zero
- **WHEN** o operador inicia uma nova entrevista
- **THEN** o sistema MUST exibir 3 opções em cards visuais grandes:
  - **Empresa Física/Tradicional** (Comércio, Indústria, Doméstica, Escritório) → `trabalhista_classico`
  - **Plataforma/Aplicativo** (Uber, iFood, 99, GetNinjas) → `gig_economy`
  - **Pejotização** (MEI para tomadora única) → `pejotizacao`
- **AND** apenas a opção `trabalhista_classico` MUST estar habilitada no MVP
- **AND** as demais MUST estar visíveis mas desabilitadas com indicação "Em breve"

#### Scenario: Seleção define trilha de módulos
- **WHEN** o operador seleciona `trabalhista_classico`
- **THEN** o sistema MUST carregar os módulos: Vínculo (A.1), Jornada (A.2), Saúde e Ambiente (A.3), Ruptura (A.4)
- **AND** atualizar `tipo_litigio` no registro da entrevista
- **AND** atualizar `status` para `em_andamento`
- **AND** definir `modulo_atual` como `'vinculo'`

#### Scenario: Campo de perfil do reclamante
- **WHEN** o operador seleciona o tipo de litígio
- **THEN** o sistema MUST exibir campo opcional para selecionar o perfil do reclamante (ex: `domestica`, `comerciario`, `industrial`, `rural`)
- **AND** armazenar no campo `perfil_reclamante`

### Requirement: Módulo A.1 — Vínculo (Máscara do Vínculo)
O sistema MUST coletar dados sobre a formalização da relação de trabalho.

#### Scenario: Pergunta sobre registro em CTPS
- **WHEN** o operador preenche o Módulo A.1
- **THEN** o sistema MUST exibir dropdown com opções:
  - "Sim, tudo certo"
  - "Sim, mas com data atrasada"
  - "Não, trabalhei sem registro (na informalidade)"
  - "Fui obrigado a abrir MEI/CNPJ"
- **AND** armazenar a resposta em `respostas.vinculo.ctps_assinada`

#### Scenario: Campo condicional de subordinação
- **WHEN** o operador seleciona "Não, trabalhei sem registro" ou "Fui obrigado a abrir MEI/CNPJ"
- **THEN** o sistema MUST revelar campo de texto: "Como era o controle de quem mandava em você? Quem dava as ordens?"
- **AND** armazenar em `respostas.vinculo.narrativa_subordinacao`

#### Scenario: Anexo probatório de vínculo
- **WHEN** o operador está no Módulo A.1
- **THEN** o sistema MUST permitir upload de anexos (foto da página de contrato da CTPS, prints de WhatsApp recebendo ordens)
- **AND** vincular os anexos ao módulo `vinculo` e nó `A.1.1`

### Requirement: Módulo A.2 — Jornada (Apropriação do Tempo)
O sistema MUST coletar dados sobre jornada de trabalho, horas extras e intervalos.

#### Scenario: Pergunta sobre controle de ponto
- **WHEN** o operador preenche o Módulo A.2
- **THEN** o sistema MUST exibir múltipla escolha com opções:
  - "Relógio de ponto eletrônico"
  - "Folha de ponto manual (papel)"
  - "Não havia controle"
  - "Ponto britânico (anotava sempre o mesmo horário exato)"
- **AND** armazenar em `respostas.jornada.controle_ponto`

#### Scenario: Tooltip de inversão de ônus da prova
- **WHEN** o operador seleciona "Folha de ponto manual" ou "Ponto britânico"
- **THEN** o sistema MUST exibir tooltip/alerta para o operador: "Atenção: o ônus da prova pode ser invertido. Questione sobre testemunhas."

#### Scenario: Horas extras e intervalo
- **WHEN** o operador preenche dados de jornada
- **THEN** o sistema MUST exibir checkboxes:
  - "Tirava 1h de almoço"
  - "Almoçava em 15/30 min para voltar ao trabalho"
  - "Recebia todas as horas extras"
  - "Fazia hora extra de graça ou ia para banco de horas que nunca folgava"
- **AND** armazenar seleções em `respostas.jornada`

#### Scenario: Campo de intervalo real concedido
- **WHEN** o operador indica que o intervalo não era completo
- **THEN** o sistema MUST exibir campo numérico: "Quantos minutos de intervalo realmente tinha?"
- **AND** armazenar em `respostas.jornada.minutos_intervalo_real`

#### Scenario: Narrativa do dia típico
- **WHEN** o operador está no Módulo A.2
- **THEN** o sistema MUST exibir campo de texto longo para narração do dia típico de trabalho
- **AND** exibir instrução ao operador: "Grave áudio do cliente narrando um dia típico de trabalho, focando na pressão por tempo"

### Requirement: Módulo A.3 — Saúde e Ambiente (Corpo e Ambiente)
O sistema MUST coletar dados sobre exposição a riscos, insalubridade, periculosidade e assédio.

#### Scenario: Pergunta sobre exposição a riscos
- **WHEN** o operador preenche o Módulo A.3
- **THEN** o sistema MUST exibir radio "Sim/Não" para: "No dia a dia, lidava com situações perigosas ou prejudiciais à saúde?"

#### Scenario: Tipificação condicional de riscos
- **WHEN** o operador indica exposição a riscos ("Sim")
- **THEN** o sistema MUST revelar dropdown de tipificação com opções: Ruído, Calor, Químico, Biológico, Inflamável, Eletricidade
- **AND** campo de texto obrigatório para descrição detalhada
- **AND** armazenar em `respostas.saude_ambiente.tipos_risco` e `respostas.saude_ambiente.descricao_risco`

#### Scenario: Pergunta sobre assédio e danos morais
- **WHEN** o operador preenche o Módulo A.3
- **THEN** o sistema MUST exibir radio "Sim/Não" para: "Sofria xingamentos, humilhações constantes ou cobranças de metas abusivas?"

#### Scenario: Detalhamento condicional de assédio
- **WHEN** o operador indica assédio moral ("Sim")
- **THEN** o sistema MUST revelar campo de texto para relato detalhado
- **AND** campo para informar sobre testemunhas ou gravações
- **AND** permitir upload de prints de WhatsApp ou áudio como prova
- **AND** armazenar em `respostas.saude_ambiente.relato_assedio` e `respostas.saude_ambiente.testemunhas_assedio`

### Requirement: Módulo A.4 — Ruptura (Acerto de Contas)
O sistema MUST coletar dados sobre o término da relação de trabalho e verbas rescisórias.

#### Scenario: Pergunta sobre motivo do término
- **WHEN** o operador preenche o Módulo A.4
- **THEN** o sistema MUST exibir dropdown com opções:
  - "Fui demitido sem justa causa"
  - "Pedi demissão"
  - "Levei Justa Causa"
  - "A empresa sumiu/faliu"
  - "Quero sair mas a empresa não me demite (Rescisão Indireta)"
- **AND** armazenar em `respostas.ruptura.motivo`

#### Scenario: Pergunta sobre verbas rescisórias
- **WHEN** o operador preenche o Módulo A.4
- **THEN** o sistema MUST exibir checkboxes:
  - "Recebi tudo"
  - "Recebi só uma parte (fizeram acordo por fora)"
  - "Não recebi nada"
  - "Não depositaram meu FGTS durante o contrato"
- **AND** armazenar em `respostas.ruptura.verbas_recebidas`

#### Scenario: Anexos rescisórios
- **WHEN** o operador está no Módulo A.4
- **THEN** o sistema MUST permitir upload de Termo de Rescisão (TRCT) e extrato do FGTS
- **AND** vincular anexos ao módulo `ruptura` e nó `A.4.2`

### Requirement: Mapeamento de testemunhas
O sistema MUST permitir indicar se testemunhas foram mapeadas durante a entrevista.

#### Scenario: Flag de testemunhas
- **WHEN** o operador está em qualquer módulo ou na finalização
- **THEN** o sistema MUST exibir toggle/checkbox: "Testemunhas foram mapeadas?"
- **AND** armazenar em `testemunhas_mapeadas` (boolean)

### Requirement: Anexos probatórios por módulo
O sistema MUST suportar upload de anexos contextualizados por módulo e nó de referência.

#### Scenario: Upload de anexo
- **WHEN** o operador faz upload de um arquivo em qualquer módulo
- **THEN** o sistema MUST criar registro em `entrevista_anexos` com: `entrevista_id`, `modulo` (ex: "vinculo"), `no_referencia` (ex: "A.1.1"), `tipo_anexo` (ex: "foto_ctps"), `arquivo_url`, `descricao`

#### Scenario: Tipos de anexo aceitos
- **WHEN** o operador seleciona um arquivo para upload
- **THEN** o sistema MUST aceitar: imagens (JPG, PNG), documentos (PDF), áudios (MP3, M4A, OGG), vídeos curtos (MP4 até 50MB)
- **AND** armazenar no B2 cloud storage existente

#### Scenario: Listagem de anexos por módulo
- **WHEN** o operador visualiza um módulo
- **THEN** o sistema MUST exibir a lista de anexos já enviados para aquele módulo
- **AND** permitir visualização/download e exclusão de anexos

### Requirement: Save & Continue (auto-save por módulo)
O sistema MUST permitir que o operador salve o progresso e retome a entrevista posteriormente.

#### Scenario: Salvar ao avançar módulo
- **WHEN** o operador clica "Próximo" para avançar ao próximo módulo
- **THEN** o sistema MUST salvar as respostas do módulo atual no campo `respostas` (merge JSONB)
- **AND** atualizar `modulo_atual` para o próximo módulo
- **AND** manter `status = 'em_andamento'`

#### Scenario: Salvar rascunho explicitamente
- **WHEN** o operador clica "Salvar Rascunho"
- **THEN** o sistema MUST salvar as respostas do módulo atual sem avançar

#### Scenario: Retomar entrevista
- **WHEN** o operador retorna à aba Entrevista de um contrato com entrevista em andamento
- **THEN** o sistema MUST carregar a entrevista existente
- **AND** posicionar o wizard no módulo indicado por `modulo_atual`
- **AND** preencher campos com respostas já salvas

### Requirement: Finalização da entrevista
O sistema MUST permitir finalizar a entrevista, marcando-a como concluída e gerando o payload.

#### Scenario: Finalizar entrevista
- **WHEN** o operador completa o último módulo e clica "Finalizar Entrevista"
- **THEN** o sistema MUST validar que todos os campos obrigatórios foram preenchidos em todos os módulos
- **AND** atualizar `status` para `concluida`
- **AND** o payload JSON completo MUST estar disponível no campo `respostas` com a estrutura tipada

#### Scenario: Reabrir entrevista concluída
- **WHEN** o operador clica "Editar" em uma entrevista concluída
- **THEN** o sistema MUST atualizar `status` de volta para `em_andamento`
- **AND** permitir navegação por todos os módulos

### Requirement: Visualização da entrevista concluída
O sistema MUST exibir a entrevista concluída em formato de leitura organizado por módulos.

#### Scenario: Renderização read-only
- **WHEN** o operador acessa a aba Entrevista de um contrato com entrevista concluída
- **THEN** o sistema MUST exibir as respostas em acordeões (Accordion) agrupados por módulo
- **AND** cada módulo MUST mostrar perguntas e respostas formatadas de forma legível
- **AND** anexos MUST ser listados inline com preview (imagens) ou link (documentos/áudios)

#### Scenario: Notas do operador
- **WHEN** o operador visualiza a entrevista concluída
- **THEN** o sistema MUST exibir notas do operador (se houver) associadas a cada módulo

### Requirement: Tooltips e alertas para o operador
O sistema MUST exibir orientações contextuais para guiar operadores durante a entrevista.

#### Scenario: Alerta de inversão de ônus da prova
- **WHEN** o operador seleciona "Ponto britânico" ou "Folha de ponto manual" no Módulo A.2
- **THEN** o sistema MUST exibir alerta visual destacado: "Atenção: o ônus da prova pode ser invertido. Questione sobre testemunhas."

#### Scenario: Instrução de gravação de áudio
- **WHEN** o operador está no Módulo A.2 (narrativa do dia típico) ou A.3 (relato de assédio)
- **THEN** o sistema MUST exibir instrução ao operador sobre gravar áudio do cliente como prova

#### Scenario: Alerta de anexo exigido
- **WHEN** um módulo tem campo de anexo marcado como exigido (ex: TRCT no Módulo A.4)
- **THEN** o sistema MUST exibir indicação visual de que o anexo é recomendado
- **AND** permitir prosseguir mesmo sem o anexo (recomendação, não bloqueio)
