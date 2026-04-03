
ZATTAR ADVOGADOS
Portal do Cliente

DOCUMENTO COMPLEMENTAR
Templates de Documentos, Regras de Negócio Detalhadas e Especificações Completas para Implementação

Abril de 2026 | Versão 1.1 — Complemento
 
PARTE 1 — TEMPLATES COMPLETOS DOS GERADORES DE DOCUMENTOS

TEMPLATE 11 — Carta de Pedido de Demissão
Instrução para o agente de codificação: A IA deve preencher os campos entre {{chaves}} com os dados do formulário. O texto fora das chaves é fixo e não deve ser alterado.

=== INÍCIO DO TEMPLATE ===

{{cidade}}, {{data_por_extenso}}

À
{{nome_empresa}}
CNPJ: {{cnpj_empresa}}

Assunto: Pedido de Demissão

Prezados Senhores,

Eu, {{nome_completo}}, portador(a) do CPF nº {{cpf}}, ocupante do cargo de {{cargo}}, venho, por meio desta, comunicar formalmente meu pedido de demissão do emprego, a partir da presente data.

{{SE aviso_previo == SIM}}:
Informo que cumprirei o aviso prévio de 30 (trinta) dias, conforme previsto no artigo 487, inciso II, da Consolidação das Leis do Trabalho (CLT), sendo meu último dia de trabalho o dia {{data_ultimo_dia}}.

{{SE aviso_previo == NÃO}}:
Solicito a dispensa do cumprimento do aviso prévio, nos termos do artigo 487, §2º, da CLT. Estou ciente de que, caso a empresa não conceda a dispensa, poderá haver o desconto do período não trabalhado nas verbas rescisórias.

{{SE motivo != VAZIO}}:
Motivo: {{motivo}}

Solicito que sejam providenciadas todas as verbas rescisórias a que tenho direito, bem como a entrega dos documentos necessários para saque do FGTS e demais obrigações legais, dentro do prazo previsto no artigo 477, §6º, da CLT.

Agradeço a oportunidade e coloco-me à disposição para a transição das minhas atividades.

Atenciosamente,

___________________________________________
{{nome_completo}}
CPF: {{cpf}}

Protocolo de recebimento pela empresa:

Recebi em ____/____/________.

___________________________________________
Nome e cargo do responsável / Carimbo da empresa

=== FIM DO TEMPLATE ===

Regras de Geração
Regra	Lógica
data_por_extenso	Formatar: "03 de abril de 2026" (dia sem zero, mês minúsculo)
data_ultimo_dia	Se aviso=SIM: data atual + 30 dias corridos. Se cai em feriado/domingo, antecipar para último dia útil
Variação aviso	Renderizar apenas o bloco correspondente (COM ou SEM aviso)
Motivo	Se campo vazio, não renderizar o parágrafo de motivo
Saída	PDF A4, fonte Times New Roman 12pt, margens 2,5cm
 
TEMPLATE 12 — Notificação Extrajudicial Trabalhista
Instrução: Template com blocos condicionais por tipo de irregularidade. A IA seleciona e compila os blocos conforme seleção do usuário.

=== INÍCIO DO TEMPLATE ===

NOTIFICAÇÃO EXTRAJUDICIAL TRABALHISTA

NOTIFICANTE: {{nome_notificante}}, brasileiro(a), {{estado_civil}}, portador(a) do CPF nº {{cpf}}, residente e domiciliado(a) em {{endereco_notificante}}.

NOTIFICADO: {{nome_empresa}}, pessoa jurídica de direito privado, inscrita no CNPJ nº {{cnpj}}, com sede em {{endereco_empresa}}.

I — DOS FATOS

O(A) NOTIFICANTE manteve vínculo empregatício com o(a) NOTIFICADO(A) no período de {{data_admissao}} a {{data_demissao}}, exercendo a função de {{cargo}}, com remuneração mensal de R$ {{salario}}.

{{descricao_fatos}}

II — DO DIREITO

{{SE tipo_irregularidade INCLUI 'salarios_atrasados'}}:
A Constituição Federal, em seu artigo 7º, inciso X, assegura a proteção do salário, constituindo crime sua retenção dolosa (art. 7º, X, CF). O artigo 459 da CLT determina que o pagamento do salário não deve ser estipulado por período superior a 1 (um) mês, devendo ser efetuado até o 5º dia útil do mês subsequente ao vencido. O atraso reiterado configura falta grave do empregador, podendo ensejar rescisão indireta do contrato de trabalho (art. 483, “d”, CLT).

{{SE tipo_irregularidade INCLUI 'fgts_nao_depositado'}}:
A Lei nº 8.036/90, em seu artigo 15, determina que o empregador está obrigado a depositar, até o 7º dia de cada mês, em conta vinculada do trabalhador, o valor correspondente a 8% (oito por cento) da remuneração paga ou devida no mês anterior. O não recolhimento do FGTS constitui infração administrativa (art. 23, Lei 8.036/90) e configura falta grave patronal (art. 483, “d”, CLT), além de ser considerado apropriação indébita (Súmula 464 do TST).

{{SE tipo_irregularidade INCLUI 'horas_extras_nao_pagas'}}:
O artigo 59 da CLT limita a prestação de horas extras a 2 (duas) horas diárias, mediante acordo individual, convenção coletiva ou acordo coletivo de trabalho. O artigo 7º, inciso XVI, da Constituição Federal assegura remuneração do serviço extraordinário superior, no mínimo, em 50% (cinquenta por cento) à do normal. A Súmula 264 do TST estabelece que a remuneração do serviço suplementar é composta do valor da hora normal, integrado por parcelas de natureza salarial, com acréscimo previsto em lei, contrato, acordo ou convenção coletiva.

{{SE tipo_irregularidade INCLUI 'ferias_nao_concedidas'}}:
O artigo 134 da CLT determina que as férias serão concedidas por ato do empregador, nos 12 meses subsequentes à data em que o empregado tiver adquirido o direito. A não concessão de férias no prazo enseja o pagamento em dobro (art. 137, CLT), conforme Súmula 81 do TST.

{{SE tipo_irregularidade INCLUI 'assedio_moral'}}:
O assédio moral no ambiente de trabalho configura violação aos direitos fundamentais da dignidade da pessoa humana (art. 1º, III, CF), dos valores sociais do trabalho (art. 1º, IV, CF) e do meio ambiente de trabalho saudável (art. 225, CF). Constitui ato ilícito nos termos dos artigos 186 e 187 do Código Civil, gerando obrigação de indenizar (art. 927, CC), bem como pode configurar falta grave do empregador passivél de rescisão indireta (art. 483, “e”, CLT).

{{SE tipo_irregularidade INCLUI 'insalubridade_sem_adicional'}}:
Os artigos 189 a 197 da CLT e a Norma Regulamentadora nº 15 do Ministério do Trabalho estabelecem que o exercício de trabalho em condições insalubres assegura ao trabalhador o adicional de 10%, 20% ou 40% sobre o salário mínimo, conforme o grau de insalubridade. O não pagamento deste adicional viola direito fundamental do trabalhador (art. 7º, XXIII, CF).

{{SE tipo_irregularidade INCLUI 'desvio_funcao'}}:
O desvio de função ocorre quando o empregado realiza atividades diversas daquelas para as quais foi contratado, sem a correspondente contraprestação salarial. A Súmula 378 do TST e o princípio da primazia da realidade (art. 9º CLT) asseguram ao trabalhador o direito às diferenças salariais decorrentes do desvio funcional.

{{SE tipo_irregularidade INCLUI 'convencao_coletiva'}}:
As convenções e acordos coletivos têm força de lei entre as partes (art. 611 CLT). O descumprimento de cláusulas normativas gera o direito ao pagamento das diferenças devidas, com os acréscimos previstos na própria norma coletiva, além de multa convencional.

III — DO PEDIDO

Diante do exposto, NOTIFICO Vossa Senhoria para que, no prazo de {{prazo_dias}} ({{prazo_extenso}}) dias, contados do recebimento desta, adote as seguintes providências:

a) Efetue o pagamento integral das verbas devidas, no valor estimado de R$ {{valor_estimado}}, mediante depósito na conta bancária do(a) NOTIFICANTE ou cheque administrativo;
b) Regularize a situação descrita, cessando imediatamente as práticas irregulares;
c) Fornecer os documentos e comprovantes de pagamento correspondentes.

O não atendimento no prazo estipulado importará na adoção das medidas judiciais cabíveis, incluindo a propositura de Reclamação Trabalhista perante a Justiça do Trabalho, sem prejuízo de comunicação ao Ministério Público do Trabalho e à Superintendência Regional do Trabalho.

{{cidade}}, {{data_por_extenso}}.

___________________________________________
{{nome_notificante}}
CPF: {{cpf}}

=== FIM DO TEMPLATE ===

Regras de Compilação do Template
Regra	Lógica
Blocos condicionais	Incluir APENAS os blocos cujas irregularidades foram selecionadas pelo usuário
Ordem dos blocos	Manter a ordem apresentada, independente da seleção
Descrição dos fatos	Campo livre do usuário. A IA pode sugerir melhoria de redação mantendo o conteúdo original
Valor estimado	Calcular automaticamente com base nos parâmetros informados (integração com calculadoras)
prazo_extenso	Converter número para texto (10 = "dez", 15 = "quinze")
Saída	PDF A4, Times New Roman 12pt, justificado, margens 3cm esquerda, 2cm demais
 
TEMPLATE 13 — Declaração de Hipossuficiência
=== INÍCIO DO TEMPLATE ===

DECLARAÇÃO DE HIPOSSUFICIÊNCIA ECONÔMICA
(para fins de concessão dos benefícios da Justiça Gratuita)

Eu, {{nome_completo}}, brasileiro(a), portador(a) do CPF nº {{cpf}}, RG nº {{rg}}, residente e domiciliado(a) em {{endereco_completo}}, DECLARO, sob as penas da lei, para fins de obtenção dos benefícios da Justiça Gratuita, que:

1. Não possuo condições financeiras de arcar com as custas processuais e honorários advocatícios sem prejuízo do sustento próprio e de minha família;

2. Minha renda mensal {{SE possui_emprego == SIM: "atual"}}{{SE possui_emprego == NAO: "familiar"}} é de R$ {{renda_mensal}} ({{renda_extenso}});

3. {{SE dependentes > 0: "Possuo {{dependentes}} dependente(s) sob minha responsabilidade;"}}{{SE dependentes == 0: "Não possuo dependentes;"}}

4. {{SE possui_emprego == SIM: "Atualmente estou empregado(a), porém minha remuneração é insuficiente para suportar os custos de uma demanda judicial;"}}{{SE possui_emprego == NAO: "Encontro-me atualmente desempregado(a), sem fonte de renda fixa;"}}

5. Esta declaração é feita nos termos do artigo 790, §3º e §4º, da Consolidação das Leis do Trabalho (CLT), com redação dada pela Lei nº 13.467/2017, e do artigo 99, §3º, do Código de Processo Civil (Lei nº 13.105/2015), aplicado subsidiariamente.

DECLARO estar ciente de que a falsidade desta declaração pode implicar em sanções civis, criminais e processuais, conforme artigos 297 e 299 do Código Penal.

{{cidade}}, {{data_por_extenso}}.

___________________________________________
{{nome_completo}}
CPF: {{cpf}}

=== FIM DO TEMPLATE ===
Regras de Elegibilidade (exibir ao usuário)
Critério	Condição	Base Legal
Renda ≤ 40% do teto INSS	R$ 3.390,22/mês (em 2026)	Art. 790, §3º CLT
Comprovação de insuficiência	Declaração + documentação	Art. 790, §4º CLT
Desempregado	Presunção de hipossuficiência	Jurisprudência TST
 
TEMPLATE 14 — Acordo Extrajudicial (Art. 855-B CLT)
ATENÇÃO: Este modelo exige obrigatoriamente advogados distintos para cada parte. O sistema deve exibir este aviso ANTES do formulário.

=== INÍCIO DO TEMPLATE ===

EXCELENTÍSSIMO(A) SENHOR(A) JUIZ(ÍZA) DO TRABALHO DA ___ª VARA DO TRABALHO DE {{cidade}}

PETIÇÃO CONJUNTA PARA HOMOLOGAÇÃO DE ACORDO EXTRAJUDICIAL
(Art. 855-B a 855-E da Consolidação das Leis do Trabalho)

REQUERENTE (Empregado): {{nome_empregado}}, brasileiro(a), {{profissao}}, portador(a) do CPF nº {{cpf_empregado}}, CTPS nº {{ctps}}, série {{serie}}, residente em {{endereco_empregado}}, representado por seu advogado {{adv_empregado}}, OAB/{{uf}} nº {{oab_empregado}}.

REQUERIDO (Empregador): {{nome_empresa}}, pessoa jurídica de direito privado, inscrita no CNPJ nº {{cnpj}}, com sede em {{endereco_empresa}}, representada por seu advogado {{adv_empresa}}, OAB/{{uf}} nº {{oab_empresa}}.

CLÁUSULA 1ª — DO OBJETO
As partes, de comum acordo e em conformidade com os artigos 855-B a 855-E da CLT, celebram o presente acordo extrajudicial para fins de quitação {{SE quitacao == 'geral': 'total e irrestrita'}}{{SE quitacao == 'parcial': 'parcial, limitada às verbas abaixo discriminadas'}} do contrato de trabalho mantido entre {{data_admissao}} e {{data_demissao}}.

CLÁUSULA 2ª — DAS VERBAS
O REQUERIDO pagará ao REQUERENTE o valor total de R$ {{valor_total}} ({{valor_extenso}}), assim discriminado:
{{PARA CADA verba EM verbas_selecionadas:}}
- {{verba.descricao}}: R$ {{verba.valor}}

CLÁUSULA 3ª — DA FORMA DE PAGAMENTO
{{SE forma_pagamento == 'vista': 'O pagamento será efetuado em parcela única, no prazo de 15 (quinze) dias após a homologação judicial, mediante depósito bancário na conta do REQUERENTE.'}}
{{SE forma_pagamento == 'parcelado': 'O pagamento será efetuado em {{num_parcelas}} parcelas {{SE parcelas_iguais: "iguais"}}{{SE !parcelas_iguais: "conforme discriminação abaixo"}}, com vencimento da primeira parcela em 15 dias após a homologação.'}}

CLÁUSULA 4ª — DA MULTA
O descumprimento de qualquer cláusula deste acordo implicará em multa de {{percentual_multa}}% ({{multa_extenso}} por cento) sobre o valor total, em favor da parte inocente, sem prejuízo da execução do saldo devedor.

CLÁUSULA 5ª — DA QUITAÇÃO
{{SE quitacao == 'geral': 'Com o cumprimento integral deste acordo, o REQUERENTE dá plena, geral e irrevogável quitação de todos os títulos e verbas decorrentes do contrato de trabalho.'}}
{{SE quitacao == 'parcial': 'A quitação restringe-se exclusivamente às verbas discriminadas na Cláusula 2ª, reservando-se ao REQUERENTE o direito de pleitear eventuais diferenças ou verbas não contempladas neste acordo.'}}

CLÁUSULA 6ª — DOS RECOLHIMENTOS
Ficará a cargo do REQUERIDO o recolhimento das contribuições previdenciárias (INSS) e do Imposto de Renda Retido na Fonte (IRRF) incidentes sobre as verbas de natureza salarial, bem como a entrega das guias para saque do FGTS, quando aplicável.

CLÁUSULA 7ª — DAS DISPOSIÇÕES FINAIS
As partes requerem a homologação do presente acordo, nos termos do artigo 855-B da CLT, declarando que foram devidamente assessoradas por advogados distintos, conforme exigência legal.

Nestes termos, pedem deferimento.

{{cidade}}, {{data_por_extenso}}.

_________________________          _________________________
{{nome_empregado}}                   {{nome_empresa}}
REQUERENTE                              REQUERIDO

_________________________          _________________________
{{adv_empregado}}                     {{adv_empresa}}
OAB/{{uf}} {{oab_empregado}}         OAB/{{uf}} {{oab_empresa}}

=== FIM DO TEMPLATE ===
 
TEMPLATE 15 — Recibo de Pagamento / Holerite
Instrução: Este template gera um holerite em formato de tabela. Os cálculos de descontos usam a lógica do Serviço 02 (Salário Líquido).
Layout do Holerite (estrutura da tabela)
Seção	Conteúdo
Cabeçalho	Nome empresa | CNPJ | Endereço | Mês referência
Dados empregado	Nome | CPF | Cargo | Admissão | Depto
PROVENTOS (coluna esq.)	Salário base | HE 50% | HE 100% | Ad. noturno | Insalubridade | Periculosidade | Outros
DESCONTOS (coluna dir.)	INSS (alíquota efetiva) | IRRF | Vale-transporte 6% | Outros descontos
Totais	Total proventos | Total descontos | LÍQUIDO A RECEBER (destaque)
Rodapé	Base INSS | Base IRRF | FGTS mês (8%) | FGTS acumulado estimado
Regras de Cálculo
Todos os cálculos seguem EXATAMENTE a lógica já especificada no Serviço 02 (Calculadora de Salário Líquido). O holerite é essencialmente uma visualização formatada da mesma lógica.
Item	Fórmula
INSS	Tabela progressiva 2026 (Serv. 02) — mostrar alíquota efetiva
IRRF	Tabela + redutor 2026 (Serv. 02) — mostrar base de cálculo
VT desconto	MIN(salário_base × 0,06, valor_VT_informado)
FGTS (informativo)	Total proventos × 0,08 (não descontar, só informar)
Horas extras	Valor hora × percentual × quantidade (Serv. 03)
Adicionais	Usar fórmulas dos Serviços 07 e 08
Saída: PDF com formato de tabela profissional, preto e branco, compatível com impressão.
 
PARTE 2 — REGRAS DE NEGÓCIO DETALHADAS (SERVIÇOS COMPLEMENTADOS)

SERVIÇO 04 — Férias: Regras Complementares de INSS/IRRF
Problema identificado: O spec original não detalhava a tributação sobre férias.

Regras de Tributação sobre Férias
Componente	INSS	IRRF	Base Legal
Férias gozadas	SIM — incide	SIM — incide	Art. 28, I, Lei 8.212/91
1/3 constitucional	SIM — incide	SIM — incide	Tema 985 STJ (2020)
Abono pecuniário (10 dias vendidos)	NÃO incide	NÃO incide	Art. 144 CLT; Art. 6º, V, Lei 7.713/88
1/3 sobre abono pecuniário	NÃO incide	NÃO incide	Art. 144 CLT
Férias indenizadas (rescisão)	NÃO incide	NÃO incide	Súmula 386 TST
1/3 sobre férias indenizadas	NÃO incide	NÃO incide	Súmula 386 TST
Fluxo de Cálculo Completo
[1] Base bruta férias = (Salário ÷ 30) × dias de férias
[2] 1/3 constitucional = Base bruta ÷ 3
[3] Subtotal tributável = Base bruta + 1/3 (SEM abono)
[4] INSS = aplicar tabela progressiva sobre Subtotal tributável
[5] Base IR = Subtotal tributável – INSS – (dependentes × R$ 189,59)
[6] IRRF = aplicar tabela + redutor 2026
[7] Abono (se vender) = (Salário ÷ 30) × 10 × 1,3333 — ISENTO de INSS e IR
[8] Líquido = Subtotal tributável – INSS – IRRF + Abono
Caso especial — Férias em dobro (Art. 137 CLT):
Se férias vencidas (não concedidas no prazo): Valor = Salário × 2 + (Salário × 2 ÷ 3). A dobra é sanção ao empregador. Tributação: INSS e IR incidem sobre o valor integral (incluindo a dobra).
 
SERVIÇO 09 — FGTS Acumulado: Lógica Completa de Cálculo
Problema identificado: Spec original era conceitual. Agora com lógica mês a mês.

Parâmetros de Rendimento FGTS
Parâmetro	Valor	Fonte
Taxa fixa anual	3% a.a.	Art. 13, Lei 8.036/90
TR (Taxa Referencial)	~2,02% a.a. (acum. 12m abr/2026)	Banco Central — SGS
Rendimento mensal estimado	~0,42% a.m. (3% + TR)	Cálculo combinado
Distribuição lucros (Conselho Curador)	Variável (R$ 0,02818/R$ saldo em 2024)	Lei 13.446/2017
Algoritmo de Cálculo Mês a Mês
PARA cada mês M de admissão até demissão:
  deposito_mensal = salario_bruto_mes[M] * 0.08
  SE M == dezembro:
    deposito_13 = (13o_salario) * 0.08
  SE M == mês_ferias:
    deposito_ferias = (ferias + 1/3) * 0.08
  saldo[M] = (saldo[M-1] * (1 + taxa_mensal)) + deposito_mensal + deposito_13 + deposito_ferias
FIM PARA

taxa_mensal = ((1 + 0.03) * (1 + TR_anual))^(1/12) - 1
  // Simplificação prática: ~0,0042 (0,42% a.m.)
Simplificação recomendada para o portal:
•	Usar taxa fixa de 0,42% a.m. como proxy (atualizar anualmente)
•	Não incluir distribuição de lucros (varia por ano, impossível prever)
•	Exibir disclaimer: "Valor estimado. Consulte o extrato no app FGTS."

SERVIÇO 10 — Correção Monetária: Especificação Técnica Completa
Problema identificado: Faltava fonte de dados e lógica de acumulação.
Fontes de Dados (APIs)
Índice	API	Endpoint	Frequência
IPCA-E	BCB/SGS	https://api.bcb.gov.br/dados/serie/bcdata.sgs.10764/dados?formato=json	Trimestral
Selic acumulada	BCB/SGS	https://api.bcb.gov.br/dados/serie/bcdata.sgs.4390/dados?formato=json	Diária
TR	BCB/SGS	https://api.bcb.gov.br/dados/serie/bcdata.sgs.226/dados?formato=json	Diária
INPC	BCB/SGS	https://api.bcb.gov.br/dados/serie/bcdata.sgs.188/dados?formato=json	Mensal
Regra de Correção (ADC 58/STF)
Fase	Índice de Correção	Juros	Período
Pré-judicial (extrajudicial)	IPCA-E	Selic (embutida)	Do vencimento ao ajuizamento
Judicial (após ajuizar)	Selic	Selic (já inclui juros)	Do ajuizamento à liquidação
Algoritmo de Cálculo
// Fase Pré-judicial
fator_ipcae = 1.0
PARA cada mês M de data_vencimento até data_ajuizamento:
  fator_ipcae *= (1 + ipcae[M] / 100)
FIM PARA
valor_ajuizamento = valor_original * fator_ipcae

// Fase Judicial (Selic acumulada já inclui correção + juros)
fator_selic = 1.0
PARA cada dia D de data_ajuizamento até data_calculo:
  fator_selic *= (1 + selic_diaria[D] / 100)
FIM PARA
valor_corrigido = valor_ajuizamento * fator_selic
IMPORTANTE: Na Selic já estão embutidos correção e juros. NÃO somar juros de 1% a.m. à Selic.
Opção simplificada (sem API em tempo real):
•	Manter tabela interna com IPCA-E mensal e Selic acumulada mensal
•	Atualizar a tabela mensalmente (cron job ou manual)
•	Fontes para download: AASP (aasp.org.br) ou Banco Central
 
SERVIÇO 18 — Análise de Jornada: Regras Complementares
Problema identificado: Faltavam regras de intervalo intrajornada e DSR.
Regras de Intervalo Intrajornada (Art. 71 CLT)
Jornada	Intervalo Mínimo	Consequência do Descumprimento
Até 4 horas	Sem intervalo obrigatório	—
4h01 a 6 horas	15 minutos	Pagamento do período suprimido + 50%
Acima de 6 horas	1 hora (mínimo) a 2 horas (máximo)	Pagamento do período suprimido + 50%
Cálculo do intervalo suprimido (Art. 71, §4º CLT, Reforma Trabalhista):
Valor = (tempo suprimido em horas) × valor_hora × 1,50
Nota: Após a Reforma Trabalhista, paga-se apenas o período efetivamente suprimido (não o intervalo inteiro).
Exemplo: Intervalo de 1h, empregado goza apenas 30min → paga 30min × 1,5 = 45min equivalentes
Cálculo do DSR sobre Horas Extras
DSR = (Total HE no mês ÷ Dias úteis do mês) × Domingos e feriados do mês
Mês exemplo	Dias Úteis	Dom/Fer	Fórmula DSR
Abril/2026	22	8	Total HE ÷ 22 × 8
Maio/2026	21	10	Total HE ÷ 21 × 10
Dezembro/2026	22	9	Total HE ÷ 22 × 9
Regra prática: Usar média de 22 dias úteis e 8 dom/fer se o usuário não especificar mês. Se especificar, calcular exatamente com calendário.
Fluxo Completo do Diagnóstico
[1] Calcula jornada real: (saída – entrada) – intervalo
[2] Intervalo < mínimo? → Calcular diferença como adicional (50%)
[3] Jornada real > contratual? → HE = (real – contratual) por dia
[4] HE diárias × dias úteis = HE mensais
[5] Sábados? → HE 50% ou 100% (verificar se é dia de descanso)
[6] Somar: HE diárias + HE sábado + intervalo suprimido
[7] Calcular DSR sobre total de HE
[8] Calcular reflexos: férias+1/3, 13º, FGTS+40%
[9] Multiplicar por meses → Total acumulado
[10] Exibir relatório: mensal + acumulado + reflexos + total estimado

SERVIÇO 19 — Elegibilidade: Critérios Completos
Problema identificado: Faltavam critérios detalhados do PIS/PASEP e modalidades de saque FGTS.
Abono Salarial PIS/PASEP 2026
Critério	Requisito	Como verificar no formulário
Cadastro PIS/PASEP	≥ 5 anos	Perguntar: “Você tem cadastro no PIS há mais de 5 anos?”
Trabalho com carteira	≥ 30 dias no ano-base (2024)	Perguntar: “Trabalhou com carteira em 2024?”
Remuneração média	≤ R$ 2.765,93/mês (ano-base 2024)	Perguntar salário médio de 2024
Dados no eSocial/RAIS	Corretamente informados	Informativo (não verificável pelo portal)
Cálculo do Valor do Abono
Valor = (Meses trabalhados no ano-base ÷ 12) × Salário mínimo vigente
Em 2026: Valor máximo = R$ 1.621,00 (12 meses). Mínimo = R$ 135,08 (1 mês).
Modalidades de Saque do FGTS
Modalidade	Quem pode	Lógica no diagnóstico
Demissão sem justa causa	Demitido sem justa causa	SE tipo_desligamento == 'sem_justa_causa'
Rescisão por acordo	Acordo Art. 484-A	Saque de 80% do saldo
Rescisão indireta	Falta grave do empregador	SE tipo_desligamento == 'rescisao_indireta'
Saque-aniversário	Quem aderiu à modalidade	Perguntar: “Você aderiu ao saque-aniversário?”
Doença grave	Neoplasia, HIV, terminal	Perguntar: “Você ou dependente possui doença grave?”
Aposentadoria	Aposentado	SE situacao == 'aposentado'
Compra de imóvel	Trabalhador com 3+ anos FGTS	Informativo (redirecionar para Caixa)
Idade ≥ 70 anos	Titular ou dependente	SE idade >= 70
 
SERVIÇO 20 — Simulador de Ação: Parametrização Completa de Dano Moral
Problema identificado: Faltava detalhamento do Art. 223-G CLT e decisão do STF.
Tabela de Dano Moral (Art. 223-G CLT + ADI 6050 STF)
Grau	Parâmetro CLT	Exemplo de situação	Fórmula no simulador
Leve	Até 3× último salário	Cobrança indevida pontual, atraso isolado de salário	Salário × 3
Médio	Até 5× último salário	Exposição de dados, constrangimento em reunião	Salário × 5
Grave	Até 20× último salário	Assédio moral reiterado, discriminação	Salário × 20
Gravíssimo	Até 50× último salário	Assédio sexual, acidente com sequela, trabalho análogo à escravidão	Salário × 50
Decisão STF (ADI 6050, junho/2023):
O STF declarou que os valores do Art. 223-G são ORIENTATIVOS, não TETOS. O juiz pode fixar indenização superior com base nos princípios da razoabilidade, proporcionalidade e igualdade. Portanto, no simulador:
•	Exibir o valor do teto legal como "valor de referência"
•	Indicar que judicialmente pode ser superior
•	Usar faixas: CONSERVADOR (50% do parâmetro), MODERADO (100%), OTIMISTA (150%)
Fluxo para Seleção de Dano Moral no Simulador
[1] Pergunta: “Você sofreu algum tipo de dano no trabalho?” (Sim/Não)
[2] Se sim: “Qual tipo?” (seleção múltipla com exemplos)
Opções:
Opção (linguagem simples)	Grau sugerido	Exemplo que aparece
Fui xingado(a) ou humilhado(a) pontualmente	Leve	Situação isolada, sem repetição
Fui constrangido(a) na frente de colegas	Médio	Exposição pública, pero não reiterada
Sofri assédio moral repetido / discriminação	Grave	Perseguição, isolação, metas abusivas
Sofri assédio sexual / acidente grave / trabalho degradante	Gravíssimo	Toque indesejado, lesão permanente
[3] Sistema aplica fórmula: salário × multiplicador do grau
[4] Exibe 3 cenários: Conservador / Moderado / Otimista
Tabela Consolidada de Reflexos para TODAS as Verbas
Para cada verba reclamável, o simulador deve calcular reflexos:
Reflexo	Fórmula	Incide sobre
DSR	Verba ÷ dias úteis × dom+fer	HE, ad. noturno
Férias + 1/3	(Verba + DSR) ÷ 12 × 1,3333	HE, ad. noturno, insalub., periculosidade
13º salário	(Verba + DSR) ÷ 12	HE, ad. noturno, insalub., periculosidade
FGTS 8%	Verba × 0,08	Todas as verbas salariais
Multa 40% FGTS	FGTS × 0,40	Só se demissão s/ justa causa ou rescisão indireta
Correção monetária	Serviço 10 (IPCA-E + Selic)	Todos os valores apurados
 
PARTE 3 — CHECKLIST DE IMPLEMENTAÇÃO

Resumo de prontidão de cada serviço para envio ao agente de codificação:

#	Serviço	Status	Docs
01	Calculadora de Rescisão	✅ PRONTO	Doc principal
02	Calculadora Salário Líquido	✅ PRONTO	Doc principal (tabelas completas)
03	Calculadora Horas Extras	✅ PRONTO	Doc principal
04	Calculadora Férias	✅ PRONTO (complementado)	Doc principal + Complemento §4
05	Calculadora 13º Salário	✅ PRONTO	Doc principal
06	Calculadora Seguro-Desemprego	✅ PRONTO	Doc principal
07	Calculadora Adicional Noturno	✅ PRONTO	Doc principal
08	Calculadora Insalub./Periculosidade	✅ PRONTO	Doc principal
09	Calculadora FGTS Acumulado	✅ PRONTO (complementado)	Doc principal + Complemento §9
10	Calculadora Correção Monetária	✅ PRONTO (complementado)	Doc principal + Complemento §10
11	Gerador Carta Demissão	✅ PRONTO (template adicionado)	Complemento Template 11
12	Gerador Notificação Extrajudicial	✅ PRONTO (template adicionado)	Complemento Template 12
13	Gerador Decl. Hipossuficiência	✅ PRONTO (template adicionado)	Complemento Template 13
14	Gerador Acordo Extrajudicial	✅ PRONTO (template adicionado)	Complemento Template 14
15	Gerador Holerite	✅ PRONTO (layout adicionado)	Complemento Template 15
16	Diagnóstico Direitos na Demissão	✅ PRONTO	Doc principal
17	Diagnóstico Verificador de Prazos	✅ PRONTO	Doc principal
18	Diagnóstico Análise Jornada	✅ PRONTO (complementado)	Doc principal + Complemento §18
19	Diagnóstico Elegibilidade	✅ PRONTO (complementado)	Doc principal + Complemento §19
20	Simulador Ação Trabalhista	✅ PRONTO (complementado)	Doc principal + Complemento §20

Status geral: 20/20 serviços prontos para implementação.
Ambos os documentos (principal + complemento) devem ser fornecidos ao agente de codificação como referência.
