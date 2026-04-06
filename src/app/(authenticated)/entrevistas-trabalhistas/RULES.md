# Regras de Negocio - Entrevistas Trabalhistas

## Contexto
Modulo de entrevistas de investigacao trabalhista vinculadas a contratos. Suporta tres trilhas distintas por tipo de litigio, cada uma com modulos especificos de perguntas. A entrevista avanca modulo a modulo, armazenando respostas em JSONB com merge incremental.

## Entidades Principais
- **EntrevistaTrabalhista**: Ficha de entrevista com tipo de litigio, status, modulo atual, respostas (JSONB) e notas do operador
- **EntrevistaAnexo**: Arquivo anexado a um modulo especifico da entrevista

## Enums e Tipos

### TipoLitigio
- `trabalhista_classico`: Trilha A
- `gig_economy`: Trilha B
- `pejotizacao`: Trilha C

### StatusEntrevista
- `rascunho`
- `em_andamento`
- `concluida`

### PerfilReclamante
- **Classico**: domestica, comerciario, industrial, rural, escritorio
- **Gig Economy**: motorista_app, entregador, prestador_servicos_app
- **Pejotizacao**: profissional_ti, profissional_saude, vendedor_pj, consultor_pj
- **Generico**: outro

### ModuloEntrevista (por trilha)
- **Comum**: no_zero, consolidacao_final
- **Trilha A**: vinculo, jornada, saude_ambiente, ruptura
- **Trilha B**: controle_algoritmico, dependencia_economica, condicoes_trabalho_gig, desligamento_plataforma
- **Trilha C**: contrato_pj, subordinacao_real, exclusividade_pessoalidade, fraude_verbas

### Tipos auxiliares (Trilha A)
- **CtpsAssinada**: sim_ok, sim_atrasada, nao_informal, obrigado_mei
- **ControlePonto**: eletronico, manual, nenhum, britanico
- **TipoRisco**: ruido, calor, quimico, biologico, inflamavel, eletricidade
- **MotivoRuptura**: demissao_sem_justa_causa, pedido_demissao, justa_causa, empresa_faliu, rescisao_indireta
- **VerbaRecebida**: tudo, parcial_acordo, nada, fgts_nao_depositado

### Tipos auxiliares (Trilha B)
- **TipoPlataforma**: transporte, entrega, servicos_gerais, outro
- **RecusaConsequencia**: sem_punicao, perde_pontuacao, pode_ser_bloqueado
- **PercentualRenda**: menos_25, 25_50, 50_75, mais_75, unica_renda
- **FaixaHorasDia**: ate_8, 8_10, 10_12, mais_12
- **FormaDesligamento**: bloqueio_definitivo, bloqueio_temporario, conta_desativada, saiu_voluntariamente

### Tipos auxiliares (Trilha C)
- **OrigemPJ**: empresa_obrigou, empresa_sugeriu, decisao_propria, contador_sugeriu
- **TipoPJ**: mei, simples_nacional, lucro_presumido, outro
- **LocalTrabalho**: empresa_exclusivamente, empresa_parcialmente, remoto, hibrido
- **ProibicaoOutrosClientes**: sim_expressamente, sim_implicitamente, nao
- **RegimeFerias**: nao_tirava, tirava_sem_pagamento, tirava_com_pagamento_parcial, tirava_normalmente

## Regras de Validacao

### Criar Entrevista
- `contratoId`: numero positivo obrigatorio
- `tipoLitigio`: enum obrigatorio
- `perfilReclamante`: enum opcional
- `createdBy`: opcional

### Respostas por Modulo
Cada modulo tem schema Zod proprio com campos opcionais e limites de caracteres:
- Campos de texto livre: max 200 a 10000 chars conforme o campo
- Campos booleanos, enums e arrays: validados contra valores permitidos
- `minutos_intervalo_real`: inteiro 0-480

## Regras de Negocio

### Iniciar Entrevista
1. Validar input via schema
2. Verificar se ja existe entrevista para o contrato (constraint unica, erro `23505`)
3. Status inicial: `em_andamento`
4. Modulo inicial: primeiro modulo da trilha correspondente ao tipo de litigio
5. Respostas iniciais: objeto vazio `{}`

### Salvar Modulo
1. Validar que entrevista existe
2. Impedir edicao se status `concluida`
3. Validar respostas contra schema Zod do modulo
4. Merge JSONB: sobrescreve apenas o modulo atualizado, preserva os demais
5. Merge de notas do operador (se fornecida)
6. Se `avancar=true`: avanca para proximo modulo da trilha

### Finalizar Entrevista
1. Impedir finalizacao duplicada
2. Validar campos obrigatorios minimos por trilha:
   - **Classico**: ctps_assinada, remuneracao_mensal, data_admissao, funcao_cargo (vinculo); motivo, data_demissao (ruptura)
   - **Gig Economy**: tipo_plataforma, renda_mensal_media, data_inicio_plataforma (controle_algoritmico); horas_dia (condicoes); forma_desligamento, data_fim_plataforma (desligamento)
   - **Pejotizacao**: origem_pj, data_inicio_pj, remuneracao_liquida_mensal (contrato_pj); regime_ferias (fraude_verbas)
3. Validar `consolidacao_final.relato_completo_texto` obrigatorio (todas trilhas)
4. Atualizar flag de testemunhas mapeadas
5. Atualizar status para `concluida`

### Reabrir Entrevista
1. Somente entrevistas com status `concluida` podem ser reabertas
2. Volta status para `em_andamento`

### Buscar Entrevista
- Por ID ou por contratoId
- Validacao de ID positivo

## Fluxos Especiais

### Progressao de Modulos por Trilha
- **Trilha A**: vinculo -> jornada -> saude_ambiente -> ruptura -> consolidacao_final
- **Trilha B**: controle_algoritmico -> dependencia_economica -> condicoes_trabalho_gig -> desligamento_plataforma -> consolidacao_final
- **Trilha C**: contrato_pj -> subordinacao_real -> exclusividade_pessoalidade -> fraude_verbas -> consolidacao_final

### Anexos
- Vinculados a entrevista + modulo especifico
- Suportam `noReferencia` para referenciar campo do formulario
- Tipos: qualquer `tipoAnexo` (string livre)
- CRUD completo (criar, listar por entrevista/modulo, excluir)

## Integracoes
- **Contratos**: vinculacao 1:1 (uma entrevista por contrato)
- **Consolidacao IA**: actions separadas para geracao de relato consolidado via IA
- **Integracao Peticao**: actions para integracao com modulo de pecas juridicas

## Revalidacao de Cache
Apos mutacoes, revalidar:
- `/app/contratos/{contratoId}`
