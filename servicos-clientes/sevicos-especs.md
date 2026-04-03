
ZATTAR ADVOGADOS
Portal do Cliente

ESPECIFICAÇÃO COMPLETA DE SERVIÇOS GRATUITOS
Calculadoras Trabalhistas, Geradores de Documentos com IA e Ferramentas de Diagnóstico

Abril de 2026 | Versão 1.0
Dados atualizados conforme legislação vigente em 2026
 
1. VISÃO GERAL DO PORTAL
Este documento especifica todos os serviços gratuitos a serem oferecidos no Portal do Cliente da ZATTAR Advogados. Os serviços são organizados em três categorias:

Categoria	Descrição	Tipo
💡 Calculadoras	Cálculos trabalhistas com fórmulas exatas da CLT	Entrada de dados + resultado automático
📝 Geradores de Documentos	Modelos de documentos alimentados por IA	Formulário guiado + documento gerado
🔍 Diagnósticos	Análises da situação trabalhista do usuário	Questionário + relatório personalizado

1.1 Catálogo Completo de Serviços
#	Serviço	Categoria	Complexidade
01	Calculadora de Rescisão Trabalhista	Calculadora	Alta
02	Calculadora de Salário Líquido	Calculadora	Média
03	Calculadora de Horas Extras	Calculadora	Média
04	Calculadora de Férias	Calculadora	Média
05	Calculadora de 13º Salário	Calculadora	Baixa
06	Calculadora de Seguro-Desemprego	Calculadora	Baixa
07	Calculadora de Adicional Noturno	Calculadora	Baixa
08	Calculadora de Insalubridade / Periculosidade	Calculadora	Baixa
09	Calculadora de FGTS Acumulado	Calculadora	Média
10	Calculadora de Correção Monetária Trabalhista	Calculadora	Média
11	Gerador de Carta de Pedido de Demissão	Documento IA	Baixa
12	Gerador de Notificação Extrajudicial	Documento IA	Alta
13	Gerador de Declaração de Hipossuficiência	Documento IA	Baixa
14	Gerador de Acordo Extrajudicial (Art. 855-B CLT)	Documento IA	Alta
15	Gerador de Recibo de Pagamento / Holerite	Documento IA	Média
16	Diagnóstico: Meus Direitos na Demissão	Diagnóstico	Média
17	Diagnóstico: Verificador de Prazos Trabalhistas	Diagnóstico	Média
18	Diagnóstico: Análise de Jornada e Horas Extras	Diagnóstico	Média
19	Diagnóstico: Elegibilidade para Benefícios	Diagnóstico	Média
20	Simulador de Ação Trabalhista (Estimativa de Valores)	Diagnóstico	Alta
 
2. CALCULADORAS TRABALHISTAS

SERVIÇO 01 — Calculadora de Rescisão Trabalhista
Objetivo: Calcular todas as verbas rescisórias de acordo com o tipo de desligamento, de forma clara e completa para o trabalhador.
Base legal: Arts. 477, 478, 487, 492 da CLT; Lei 12.506/2011 (aviso prévio proporcional); Lei 8.036/90 (FGTS).

Inputs do Usuário
Campo	Tipo	Obrigatório	Validação
Salário bruto mensal (R$)	Numérico	Sim	Mínimo: R$ 1.621,00
Data de admissão	Data	Sim	Não pode ser futura
Data de demissão	Data	Sim	Posterior à admissão
Tipo de desligamento	Seleção	Sim	Ver opções abaixo
Aviso prévio trabalhado?	Sim/Não	Sim	—
Férias vencidas (períodos)?	Numérico	Não	0, 1 ou 2
Saldo FGTS (R$)	Numérico	Não	Se vazio, estima 8% x salário x meses
Média de horas extras/mês	Numérico	Não	Integração nas verbas

Tipos de Desligamento
Tipo	Verbas Dev.	FGTS	Multa 40%	Seguro-Desemp.
Demissão sem justa causa	Todas	Saque	Sim	Sim
Pedido de demissão	Parciais	Não saca	Não	Não
Demissão por justa causa	Mínimas	Não saca	Não	Não
Rescisão por acordo (Art. 484-A)	Parciais*	Saque 80%	20%	Não
Rescisão indireta	Todas	Saque	Sim	Sim
Término contrato prazo det.	Parciais	Saque	Não	Não

Fórmulas de Cálculo
a) Saldo de Salário
Saldo = (Salário ÷ 30) × Dias trabalhados no mês da demissão
b) Aviso Prévio Indenizado (se não trabalhado)
Dias de aviso = 30 + (3 × anos completos de serviço), máximo 90 dias
Valor = (Salário ÷ 30) × Dias de aviso
Nota: O aviso prévio proporcional é contado a partir de 1 ano completo. Menos de 1 ano = 30 dias.
c) 13º Salário Proporcional
13º proporcional = (Salário ÷ 12) × Meses trabalhados no ano (fração ≥ 15 dias = 1 mês)
Importante: O aviso prévio indenizado projeta o tempo de serviço e entra no cálculo do 13º.
d) Férias Proporcionais + 1/3
Férias prop. = (Salário ÷ 12) × Meses do período aquisitivo
Total com 1/3 = Férias prop. × 1,3333
e) Férias Vencidas + 1/3
Férias vencidas = Salário × 1,3333 (por período vencido)
Se houver 2 períodos vencidos, o primeiro é pago em dobro (Art. 137 CLT).
f) Multa do FGTS
Multa = Saldo FGTS × 0,40 (sem justa causa / rescisão indireta)
Multa = Saldo FGTS × 0,20 (rescisão por acordo — Art. 484-A CLT)
g) Estimativa do Saldo FGTS (quando não informado)
FGTS estimado = Salário × 0,08 × Meses trabalhados + depósitos sobre 13º

Fluxograma de Decisão
[1] Usuário preenche dados básicos (salário, datas, tipo de desligamento)
[2] Sistema calcula tempo de serviço em anos, meses e dias
[3] Tipo de desligamento? → Aplica matriz de verbas devidas
[4] Aviso prévio: trabalhado ou indenizado? → Se indenizado, projeta tempo de serviço
[5] Calcula cada verba individualmente conforme fórmulas acima
[6] Aplica descontos: INSS sobre saldo de salário e 13º; IRRF sobre total tributável
[7] Exibe resultado com detalhamento de cada verba (bruto e líquido)
[8] Oferece botão: “Falar com advogado” se valor > R$ 5.000 ou rescisão complexa
 
SERVIÇO 02 — Calculadora de Salário Líquido
Objetivo: Mostrar ao trabalhador quanto efetivamente recebe após descontos obrigatórios.
Base legal: Art. 462 CLT; Tabela INSS (Portaria MPS); Tabela IRRF (IN RFB); Lei 15.270/2025.
Inputs do Usuário
Campo	Tipo	Obrigatório
Salário bruto mensal (R$)	Numérico	Sim
Número de dependentes (IR)	Numérico	Não (default: 0)
Outros descontos (R$)	Numérico	Não
Adicional (insalubr./periculosidade/noturno)	Seleção	Não
Pensar alimentar (%)	Numérico	Não
Vale-transporte (desconto 6%)?	Sim/Não	Não
Tabela INSS 2026 (Progressiva)
Faixa Salarial	Alíquota	Parcela a Deduzir
Até R$ 1.621,00	7,5%	R$ 0,00
R$ 1.621,01 a R$ 2.902,84	9%	R$ 24,32
R$ 2.902,85 a R$ 4.354,27	12%	R$ 111,40
R$ 4.354,28 a R$ 8.475,55 (teto)	14%	R$ 198,49
Cálculo INSS: Alíquota efetiva é progressiva. Aplica-se cada alíquota apenas sobre a faixa correspondente, ou usa-se: INSS = (Salário × Alíquota) – Parcela a Deduzir.
Teto máximo de contribuição INSS: R$ 951,63
Tabela IRRF 2026 (Progressiva)
A tabela progressiva permanece a mesma de 2025:
Base de Cálculo Mensal	Alíquota	Parcela a Deduzir
Até R$ 2.259,20	Isento	R$ 0,00
R$ 2.259,21 a R$ 2.826,65	7,5%	R$ 169,44
R$ 2.826,66 a R$ 3.751,05	15%	R$ 381,44
R$ 3.751,06 a R$ 4.664,68	22,5%	R$ 662,77
Acima de R$ 4.664,68	27,5%	R$ 896,00
Novidade 2026 — Redutor Mensal (Lei 15.270/2025):
•	Renda até R$ 5.000,00: redução de R$ 312,89 (imposto final = zero)
•	Renda entre R$ 5.000,01 e R$ 7.350,00: redução = R$ 978,62 – (0,133145 × salário bruto)
•	Dedução por dependente: R$ 189,59/mês
•	Desconto simplificado mensal: R$ 607,20 (substitui deduções, se mais vantajoso)
Fórmula de Cálculo Completa
[1] Base INSS = Salário bruto + adicionais
[2] Desconto INSS = aplica tabela progressiva (limitado ao teto)
[3] Base IR = Salário bruto – INSS – (dependentes × R$ 189,59) OU Base IR = Salário bruto – INSS – R$ 607,20 (o que for melhor)
[4] IRRF = (Base IR × alíquota) – parcela a deduzir
[5] Aplica redutor 2026 se aplicável
[6] Salário líquido = Salário bruto – INSS – IRRF – VT (6%) – outros descontos
 
SERVIÇO 03 — Calculadora de Horas Extras
Objetivo: Calcular o valor devido de horas extras, incluindo reflexos em DSR, férias e 13º.
Base legal: Art. 59 CLT; Súmula 264 TST; Art. 7º, XVI, CF.
Inputs
Campo	Tipo	Obrigatório
Salário bruto mensal (R$)	Numérico	Sim
Jornada mensal (horas)	Seleção	Sim (220h, 200h, 180h, 150h)
Horas extras dias úteis (qtd)	Numérico	Sim
Horas extras domingos/feriados (qtd)	Numérico	Não
Período (meses)	Numérico	Não (default: 1)
Adicional convenção coletiva (%)	Numérico	Não (default: 50%/100%)
Fórmulas
Valor hora normal = Salário ÷ Jornada mensal
Hora extra dia útil = Valor hora × 1,50 (ou % da convenção coletiva)
Hora extra domingo/feriado = Valor hora × 2,00
Total HE = (HE dias úteis × valor HE 50%) + (HE dom/fer × valor HE 100%)
Reflexos:
•	DSR (Descanso Semanal Remunerado): Total HE ÷ dias úteis do mês × domingos/feriados do mês
•	Reflexo em férias: (Total HE + DSR) ÷ 12 × 1,3333
•	Reflexo em 13º: (Total HE + DSR) ÷ 12
•	Reflexo em FGTS: (Total HE + DSR) × 8%
•	Reflexo em FGTS + multa 40%: FGTS × 1,40
 
SERVIÇO 04 — Calculadora de Férias
Objetivo: Calcular o valor líquido de férias, considerando abono pecuniário e descontos.
Base legal: Arts. 129 a 145 CLT.
Inputs
Campo	Tipo	Obrigatório
Salário bruto (R$)	Numérico	Sim
Dias de férias (10, 15, 20 ou 30)	Seleção	Sim
Vender 10 dias (abono pecuniário)?	Sim/Não	Sim
Média de adicionais habituais (R$)	Numérico	Não
Número de dependentes IR	Numérico	Não
Faltas no período aquisitivo	Numérico	Não
Tabela de Redução por Faltas (Art. 130 CLT)
Faltas Injustificadas	Dias de Férias
Até 5 faltas	30 dias
6 a 14 faltas	24 dias
15 a 23 faltas	18 dias
24 a 32 faltas	12 dias
Acima de 32 faltas	Perde o direito
Fórmulas
Férias brutas = (Salário ÷ 30) × Dias de férias
1/3 constitucional = Férias brutas ÷ 3
Abono pecuniário (se vender) = (Salário ÷ 30) × 10 × 1,3333
Total bruto = Férias + 1/3 + Abono (se houver)
Descontos: INSS e IRRF sobre o total (exceto abono pecuniário, que é isento de IR).
SERVIÇO 05 — Calculadora de 13º Salário
Objetivo: Calcular o valor do 13º integral ou proporcional, com descontos.
Base legal: Lei 4.090/62; Decreto 57.155/65.
Inputs
Campo	Tipo
Salário bruto (R$)	Numérico
Mês de admissão no ano	Seleção (Jan–Dez)
Número de dependentes IR	Numérico
Média de adicionais habituais (R$)	Numérico
Fórmulas
13º proporcional = (Salário + média adicionais) ÷ 12 × meses trabalhados
1ª parcela (até 30/nov) = 13º proporcional ÷ 2 (sem descontos)
2ª parcela (até 20/dez) = 13º total – 1ª parcela – INSS – IRRF
Meses com 15 dias ou mais trabalhados contam como mês completo.
 
SERVIÇO 06 — Calculadora de Seguro-Desemprego
Objetivo: Estimar o valor e a quantidade de parcelas do seguro-desemprego.
Base legal: Lei 7.998/90; Resolução CODEFAT nº 957/2022.
Inputs
Campo	Tipo	Obrigatório
Salário dos últimos 3 meses (R$)	3 campos numéricos	Sim
Meses trabalhados nos últimos 36 meses	Numérico	Sim
Quantas vezes já recebeu seguro?	Seleção (1ª, 2ª, 3ª+ vez)	Sim
Tabela de Cálculo 2026
Faixa (média salarial)	Cálculo da Parcela
Até R$ 2.222,17	Média salarial × 0,80
R$ 2.222,18 a R$ 3.703,99	Excedente a R$ 2.222,17 × 0,50 + R$ 1.777,74
Acima de R$ 3.703,99	Valor fixo: R$ 2.518,65 (teto)
Valor mínimo: R$ 1.621,00 (salário mínimo 2026).
Valor máximo: R$ 2.518,65.
Número de Parcelas
Solicitação	Meses Trabalhados	Parcelas
1ª vez	12 a 23 meses	4 parcelas
1ª vez	24+ meses	5 parcelas
2ª vez	9 a 11 meses	3 parcelas
2ª vez	12 a 23 meses	4 parcelas
2ª vez	24+ meses	5 parcelas
3ª+ vez	6 a 11 meses	3 parcelas
3ª+ vez	12 a 23 meses	4 parcelas
3ª+ vez	24+ meses	5 parcelas
SERVIÇO 07 — Calculadora de Adicional Noturno
Objetivo: Calcular o valor do adicional noturno com hora reduzida.
Base legal: Art. 73 CLT.
Fórmulas
Valor hora normal = Salário ÷ 220
Adicional noturno por hora = Valor hora × 0,20
Hora noturna = 52 min 30 seg (redução ficta)
Horas noturnas efetivas = Horas trabalhadas × (60/52,5)
Total adicional = Horas noturnas efetivas × (Valor hora × 1,20)
Período noturno urbano: 22h às 5h. Rural pecuária: 20h às 4h. Rural agricultura: 21h às 5h.
SERVIÇO 08 — Calculadora de Insalubridade / Periculosidade
Objetivo: Calcular o adicional conforme grau de insalubridade ou periculosidade.
Base legal: Arts. 189–197 CLT; NRs 15 e 16.
Fórmulas
Adicional	Base de Cálculo	Percentual
Insalubridade mínima	Salário mínimo (R$ 1.621,00)	10%
Insalubridade média	Salário mínimo (R$ 1.621,00)	20%
Insalubridade máxima	Salário mínimo (R$ 1.621,00)	40%
Periculosidade	Salário-base do empregado	30%
Atenção: Insalubridade e periculosidade não acumulam (Art. 193, §2º CLT). O trabalhador opta pelo mais vantajoso.
 
SERVIÇO 09 — Calculadora de FGTS Acumulado
Objetivo: Estimar o saldo do FGTS acumulado durante o vínculo empregatício.
Base legal: Lei 8.036/90; Art. 15.
Fórmulas
Depósito mensal = Salário bruto × 8%
Depósito sobre 13º = 13º salário × 8%
Depósito sobre férias + 1/3 = (Férias + 1/3) × 8%
Saldo estimado = Σ (depósitos mensais) + depósitos 13º + rend. 3% a.a. (TR + jur.)
Nota: O rendimento do FGTS é de TR + 3% ao ano. Para simplificação, pode-se usar taxa mensal de ~0,25%.
SERVIÇO 10 — Calculadora de Correção Monetária Trabalhista
Objetivo: Atualizar valores devidos e não pagos pelo empregador com correção e juros.
Base legal: Art. 879 CLT; ADC 58/STF (IPCA-E + Selic na fase judicial).
Fórmulas
Fase pré-judicial (até o ajuizamento):
Valor corrigido = Valor original × ΔIPCA-E (do vencimento ao ajuizamento) + juros Selic acumulados
Fase judicial (após ajuizamento):
Valor corrigido = Valor atualizado × Taxa Selic acumulada do período
Nota: Na Selic já estão embutidos correção monetária e juros. Não se aplicam juros de 1% a.m. cumulativamente.
Sugestão de implementação: consumir API do Banco Central para índices atualizados (SGS/BCB).
 
3. GERADORES DE DOCUMENTOS COM IA

Estes serviços utilizam inteligência artificial para gerar documentos personalizados a partir de formulários guiados. O usuário preenche as informações e recebe um documento pronto para download em PDF.

SERVIÇO 11 — Gerador de Carta de Pedido de Demissão
Objetivo: Gerar carta formal de pedido de demissão pronta para imprimir e entregar ao empregador.
Inputs
Campo	Tipo
Nome completo do empregado	Texto
CPF	Texto (com máscara)
Nome da empresa (razão social)	Texto
CNPJ da empresa	Texto
Cargo atual	Texto
Vai cumprir aviso prévio?	Sim/Não
Data pretendida para último dia	Data
Motivo (opcional — campo livre)	Texto longo
Cidade	Texto
Saída: Carta em PDF com linguagem formal, data, local para assinatura do empregado e do empregador (protocolo).
Nota jurídica a exibir: Esta carta não dispensa a consulta com advogado. Em caso de dúvidas sobre seus direitos na rescisão, converse com a equipe ZATTAR.

SERVIÇO 12 — Gerador de Notificação Extrajudicial Trabalhista
Objetivo: Gerar notificação formal ao empregador sobre irregularidades trabalhistas.
Base legal: Art. 5º, XXXIV, CF; CC Arts. 186, 187, 927.
Inputs
Campo	Tipo
Dados do notificante (nome, CPF, endereço)	Texto
Dados do notificado (empresa, CNPJ, endereço)	Texto
Tipo de irregularidade	Seleção múltipla
Descrição dos fatos	Texto longo
Valor aproximado do crédito (R$)	Numérico
Prazo para regularização (dias)	Numérico (default: 10)
Tipos de irregularidade pré-configurados:
•	Atraso ou não pagamento de salários
•	Não depósito de FGTS
•	Não pagamento de horas extras
•	Não concessão de férias
•	Descumprimento de acordo/convenção coletiva
•	Assédio moral ou sexual
•	Condições insalubres/perigosas sem adicional
•	Desvio ou acumulação de funções sem remuneração
Saída: Documento formal em PDF com: identificação das partes, narração dos fatos, fundamento legal, requisição de providências, prazo, e aviso de medidas judiciais.
Disclaimer: Este documento é um modelo orientativo. Recomenda-se a revisão por advogado antes do envio.

SERVIÇO 13 — Gerador de Declaração de Hipossuficiência
Objetivo: Gerar declaração para pedido de justiça gratuita em ações trabalhistas.
Base legal: Art. 790, §3º e §4º CLT (Reforma Trabalhista).
Inputs
Campo	Tipo
Nome completo	Texto
CPF	Texto
Endereço completo	Texto
Renda mensal familiar (R$)	Numérico
Número de dependentes	Numérico
Possui outro emprego?	Sim/Não
Saída: Declaração em PDF com os requisitos legais para justiça gratuita, pronta para assinar.

SERVIÇO 14 — Gerador de Acordo Extrajudicial (Art. 855-B CLT)
Objetivo: Gerar minuta de acordo extrajudicial entre empregado e empregador para homologação judicial.
Base legal: Arts. 855-B a 855-E CLT (inseridos pela Reforma Trabalhista).
Requisitos legais: Cada parte deve ter advogado distinto; petição conjunta à Vara do Trabalho.
Inputs
Campo	Tipo
Dados do empregado (nome, CPF)	Texto
Dados do empregador (empresa, CNPJ)	Texto
Verbas objeto do acordo	Seleção múltipla + valores
Valor total do acordo (R$)	Numérico
Forma de pagamento	Seleção (à vista / parcelado)
Multa por descumprimento (%)	Numérico (default: 50%)
Quitação geral ou parcial?	Seleção
Saída: Minuta de acordo em PDF, formatada conforme padrão do Judiciário.
Aviso importante: Este é um modelo inicial. O acordo extrajudicial exige obrigatoriamente advogados distintos e homologação judicial. Consulte a ZATTAR Advogados para finalização.

SERVIÇO 15 — Gerador de Recibo de Pagamento / Holerite
Objetivo: Gerar holerite para trabalhador que não recebe contracheque formal, auxiliando na comprovação de renda.
Inputs
Campo	Tipo
Nome do empregado	Texto
CPF	Texto
Nome da empresa	Texto
CNPJ	Texto
Cargo	Texto
Salário bruto (R$)	Numérico
Adicionais (HE, noturno, insalubridade)	Numérico
Mês de referência	Seleção
Saída: Holerite detalhado em PDF com proventos, descontos (INSS, IRRF, VT) e líquido.
O sistema calcula automaticamente os descontos usando as tabelas INSS e IRRF 2026 detalhadas no Serviço 02.
 
4. FERRAMENTAS DE DIAGNÓSTICO

Ferramentas interativas que analisam a situação trabalhista do usuário e geram relatórios personalizados, indicando direitos, prazos e valores estimados.

SERVIÇO 16 — Diagnóstico: Meus Direitos na Demissão
Objetivo: Guiar o trabalhador recém-demitido sobre quais direitos possui, conforme o tipo de desligamento.
Fluxo do Diagnóstico
[1] Pergunta: Como você saiu do emprego? (6 opções de desligamento)
[2] Pergunta: Quanto tempo trabalhou? (seleciona faixa)
[3] Pergunta: Cumpriu aviso prévio? (Sim/Não/Não se aplica)
[4] Pergunta: Recebeu todas as verbas? (Sim/Não/Não sei)
[5] Sistema gera relatório personalizado com:
•	Checklist de direitos conforme tipo de desligamento (✅ ou ❌)
•	Estimativa de valores devidos (usando calculadora do Serviço 01)
•	Prazos para cobrança (prescrição)
•	Recomendação: “Converse com um advogado ZATTAR” se há indícios de violação
Matriz de Direitos por Tipo de Desligamento
Direito	S/ Justa Causa	Pedido Dem.	Justa Causa	Acordo	Resc. Indireta
Saldo de salário	✅	✅	✅	✅	✅
Aviso prévio	✅	✅*	❌	✅ (50%)	✅
13º proporcional	✅	✅	❌	✅	✅
Férias proporcionais +1/3	✅	✅	❌	✅	✅
Férias vencidas +1/3	✅	✅	✅	✅	✅
Saque FGTS	✅	❌	❌	✅ (80%)	✅
Multa 40% FGTS	✅	❌	❌	20%	✅
Seguro-desemprego	✅	❌	❌	❌	✅
Guias (TRCT, CD/SD)	✅	TRCT	TRCT	✅	✅
* No pedido de demissão, o empregado deve cumprir aviso ou indenizar o empregador.

SERVIÇO 17 — Diagnóstico: Verificador de Prazos Trabalhistas
Objetivo: Informar ao trabalhador se ainda está dentro do prazo para cobrar direitos.
Base legal: Art. 7º, XXIX, CF; Art. 11 CLT.
Regras de Prescrição
Regra	Prazo	Contagem
Prescrição bienal (ajuizamento)	2 anos	A partir da data de rescisão do contrato
Prescrição quinquenal (créditos)	5 anos	Retroativos a partir da data do ajuizamento
FGTS (não depositado)	5 anos	A partir da data do depósito não realizado
Fluxo
[1] Pergunta: Ainda está empregado? (Sim/Não)
[2] Se não: Quando foi a rescisão? (data)
[3] Sistema calcula: data limite para ajuizar = data rescisão + 2 anos
[4] Sistema calcula: créditos cobráveis retroagem 5 anos da data de hoje
[5] Exibe: SINAL VERDE (dentro do prazo) ou SINAL VERMELHO (prescrito) + datas exatas

SERVIÇO 18 — Diagnóstico: Análise de Jornada e Horas Extras
Objetivo: Ajudar o trabalhador a identificar se tem horas extras não pagas.
Inputs
Campo	Tipo
Jornada contratual (ex: 8h/dia)	Seleção
Horário real de entrada	Hora
Horário real de saída	Hora
Intervalo para almoço (minutos)	Numérico
Trabalha aos sábados?	Sim/Não + horas
Trabalha em feriados?	Frequentemente/Às vezes/Nunca
Salário bruto (R$)	Numérico
Meses nessa situação	Numérico
Lógica
Jornada real diária = (Horário saída – Horário entrada) – Intervalo
HE diárias = Jornada real – Jornada contratual (se positivo)
HE mensais = HE diárias × dias úteis/mês (~22)
Intervalo intrajornada: Se jornada > 6h, intervalo mínimo = 1h. Se < 1h, o período suprimido é pago como hora extra com adicional de 50% (Art. 71, §4º CLT).
Relatório gerado: Estimativa mensal e acumulada de horas extras + valores, com integração de Serviço 03.

SERVIÇO 19 — Diagnóstico: Elegibilidade para Benefícios
Objetivo: Verificar se o trabalhador tem direito a benefícios como seguro-desemprego, abono salarial (PIS) e saque do FGTS.
Fluxo
[1] Pergunta: Situação atual? (Empregado / Desempregado / Afastado)
[2] Pergunta: Tempo de trabalho com carteira nos últimos 36 meses?
[3] Pergunta: Salário médio mensal?
[4] Pergunta: Já recebeu seguro-desemprego antes? (1ª, 2ª, 3ª+ vez)
[5] Pergunta: Possui cadastro no PIS há mais de 5 anos?
[6] Sistema verifica elegibilidade e gera relatório:
•	Seguro-desemprego: Elegível? Quantas parcelas? Valor estimado? (usa Serviço 06)
•	Abono salarial (PIS/PASEP): Se salário ≤ 2 salários mínimos e cadastro ≥ 5 anos
•	Saque FGTS: modalidade disponível (rescisão, anão, saque-aniversário)
•	Saque extraordinário: se houver modalidade vigente

SERVIÇO 20 — Simulador de Ação Trabalhista
Objetivo: Estimar o valor aproximado de uma ação trabalhista, considerando as principais verbas reclamáveis.
Aviso: Este simulador fornece estimativas. Valores reais dependem de provas, convenção coletiva e decisão judicial.
Inputs
Campo	Tipo
Salário bruto (R$)	Numérico
Tempo de serviço (anos e meses)	Numérico
Verbas a reclamar	Seleção múltipla
Verbas Reclamáveis pré-configuradas:
Verba	Fórmula Estimativa
Horas extras (média estimada)	Sal ÷ 220 × 1,5 × HE/mês × meses
Intervalo intrajornada suprimido	Sal ÷ 220 × 1,5 × tempo suprimido × dias × meses
Adicional noturno não pago	Sal ÷ 220 × 0,20 × horas noturnas × meses
Insalubridade não paga	SM × % grau × meses
Periculosidade não paga	Sal × 0,30 × meses
FGTS não depositado	Sal × 0,08 × meses + multa 40%
Férias não concedidas	Sal × 2 × 1,3333 (em dobro)
13º não pago	Sal × anos
Dano moral (estimativa)	3 a 50 × salário (conforme Art. 223-G CLT)
Diferenças salariais (desvio de função)	Diferença salarial × meses + reflexos
Fluxo de Cálculo
[1] Usuário seleciona verbas reclamáveis e preenche parâmetros
[2] Sistema calcula cada verba individualmente
[3] Soma reflexos: DSR, férias+1/3, 13º, FGTS+40% sobre cada verba
[4] Aplica correção monetária estimada (IPCA-E/Selic) sobre o período
[5] Exibe: valor estimado BAIXO / MÉDIO / ALTO (faixas de 20%)
[6] CTA forte: “Agende uma consulta gratuita com a ZATTAR para avaliar seu caso”
 
5. TABELAS DE REFERÊNCIA 2026

5.1 Dados Gerais
Parâmetro	Valor 2026
Salário mínimo nacional	R$ 1.621,00
Teto INSS	R$ 8.475,55
Teto seguro-desemprego	R$ 2.518,65
Dedução por dependente (IR)	R$ 189,59/mês
Desconto simplificado (IR)	R$ 607,20/mês
Salário-família (até R$ 1.819,26)	R$ 62,04 por filho
FGTS — depósito mensal	8% do salário bruto
FGTS — multa rescisória (sem justa causa)	40% do saldo
FGTS — multa rescisória (acordo)	20% do saldo
Vale-transporte — desconto máximo	6% do salário base
5.2 Tabela INSS 2026 Completa
Faixa Salarial	Alíquota	Parcela a Deduzir	Contribuição Acumulada
Até R$ 1.621,00	7,5%	R$ 0,00	Até R$ 121,58
R$ 1.621,01 a R$ 2.902,84	9%	R$ 24,32	Até R$ 236,93
R$ 2.902,85 a R$ 4.354,27	12%	R$ 111,40	Até R$ 411,11
R$ 4.354,28 a R$ 8.475,55	14%	R$ 198,49	Até R$ 951,63
5.3 Tabela IRRF 2026 Completa
Base de Cálculo Mensal	Alíquota	Parcela a Deduzir
Até R$ 2.259,20	Isento	—
R$ 2.259,21 a R$ 2.826,65	7,5%	R$ 169,44
R$ 2.826,66 a R$ 3.751,05	15%	R$ 381,44
R$ 3.751,06 a R$ 4.664,68	22,5%	R$ 662,77
Acima de R$ 4.664,68	27,5%	R$ 896,00
Redutor Mensal 2026 (Lei 15.270/2025):
Renda ≤ R$ 5.000: Redução = R$ 312,89 (imposto zerado)
Renda R$ 5.000,01 a R$ 7.350: Redução = R$ 978,62 – (0,133145 × rendimento bruto)
5.4 Tabela Seguro-Desemprego 2026
Faixa (média salarial)	Cálculo	Resultado
Até R$ 2.222,17	Média × 0,80	Mínimo R$ 1.621,00
R$ 2.222,18 a R$ 3.703,99	(Exc. R$ 2.222,17) × 0,50 + R$ 1.777,74	—
Acima de R$ 3.703,99	Fixo	R$ 2.518,65 (teto)
5.5 Aviso Prévio Proporcional (Lei 12.506/2011)
Tempo de Serviço	Dias de Aviso Prévio
Até 1 ano	30 dias
2 anos completos	33 dias
3 anos completos	36 dias
5 anos completos	42 dias
10 anos completos	57 dias
15 anos completos	72 dias
20 anos completos	87 dias
20+ anos	90 dias (máximo)
 
6. ESTRATÉGIA DE CONVERSÃO E UX

6.1 CTAs (Call to Action) por Serviço
Cada serviço deve incluir chamadas para ação inteligentes que convertam usuários em clientes:
Gatilho	CTA Sugerido	Serviços
Valor rescisório alto (> R$ 5.000)	“Seu caso pode valer mais. Fale com a ZATTAR.”	01, 16, 20
Irregularidade detectada	“Você pode ter direitos não pagos. Consulta gratuita.”	16, 17, 18
Prazo prescricional próximo	“⚠️ Corra! Seu prazo vence em X dias.”	17
Documento gerado	“Precisa de revisão profissional? A ZATTAR ajuda.”	11–15
Simulação de ação > R$ 10.000	“Vale a pena processar. Agende consulta gratuita.”	20
6.2 Linguagem para o Usuário
Princípios de comunicação:
•	Usar linguagem simples, evitar jargão jurídico quando possível
•	Traduzir termos técnicos com tooltips (ex: “Aviso prévio — período que a empresa deve pagar mesmo se você já saiu”)
•	Tom empático e acolhedor: “Sabemos que esse momento é difícil. Estamos aqui para ajudar.”
•	Resultados visuais: usar barras de progresso, gráficos de pizza para composição de verbas
•	Compartilhamento: botão para salvar PDF ou enviar por WhatsApp
6.3 Responsabilidade Legal
Disclaimer obrigatório em todos os serviços:
“Esta ferramenta tem caráter informativo e não substitui consulta jurídica profissional. Os valores apresentados são estimativas baseadas na legislação vigente e podem variar conforme convenções coletivas, acordos individuais e interpretação judicial. Para análise completa do seu caso, consulte a ZATTAR Advogados.”
