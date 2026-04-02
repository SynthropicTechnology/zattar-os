# Regras de Negócio - Audiências

## Contexto
Módulo para gestão de audiências judiciais vinculadas a processos trabalhistas. Controla agendamento, modalidade (virtual/presencial/híbrida), status e responsáveis. Integra-se com calendário e sistema de notificações.

## Entidades Principais
- **Audiencia**: Registro de audiência judicial
- **EnderecoPresencial**: Endereço para audiências presenciais
- **TipoAudiencia**: Tabela auxiliar de tipos de audiência

## Enums e Tipos

### Status de Audiência
- `M` (Marcada): Audiência agendada
- `F` (Finalizada): Audiência realizada
- `C` (Cancelada): Audiência cancelada

### Modalidade
- `virtual`: Audiência por videoconferência
- `presencial`: Audiência em local físico
- `hibrida`: Combinação virtual + presencial

### Presença Híbrida
- `advogado`: Advogado presencial, cliente virtual
- `cliente`: Cliente presencial, advogado virtual

## Regras de Validação

### Campos Obrigatórios
- `processoId`: ID do processo vinculado
- `dataInicio`: Data/hora de início (ISO datetime)
- `dataFim`: Data/hora de fim (ISO datetime)

### Validações de Data
- `dataFim` DEVE ser posterior a `dataInicio`
- Não permitir audiências em datas passadas (para criação)
- Verificar conflitos de horário com outras audiências

### URL de Audiência Virtual
- Se modalidade é `virtual` ou `hibrida`, validar formato URL
- Aceitar URLs de plataformas conhecidas (Zoom, Teams, etc.)

### Endereço Presencial
- Obrigatório se modalidade é `presencial` ou `hibrida`
- Campos: cep, logradouro, numero, bairro, cidade, uf
- `complemento` é opcional

## Regras de Negócio

### Criação de Audiência
1. Validar existência do processo
2. Verificar conflitos de horário para mesmo advogado/responsável
3. Verificar conflitos para mesma sala de audiência
4. Status inicial: `M` (Marcada)
5. Notificar advogado e responsável

### Conflito de Horários
1. Duas audiências conflitam se:
   - Mesmo advogado/responsável
   - Intervalos de data/hora se sobrepõem
2. Tolerância: 30 minutos entre audiências
3. Alertar mas permitir criação com confirmação

### Atualização de Status
- `M → F`: Marcar como finalizada (após data)
- `M → C`: Cancelar audiência (antes ou após)
- `F → M`: Não permitido (audiência já realizada)
- `C → M`: Permitido (remarcar audiência cancelada)

### Finalização Automática
1. Job diário verifica audiências com `dataFim` passada
2. Status `M` → `F` automaticamente
3. Registrar em log/auditoria

## Campos do Registro

### Identificação
- `id`: ID interno
- `idPje`: ID no sistema PJE
- `processoId`: Vinculação ao processo
- `numeroProcesso`: Número CNJ (denormalizado)

### Localização
- `trt`: Código do tribunal (TRT1-24)
- `grau`: primeiro_grau, segundo_grau, tribunal_superior
- `orgaoJulgadorId`: ID do órgão julgador

### Agenda
- `dataInicio`, `dataFim`: Período da audiência
- `horaInicio`, `horaFim`: Horários específicos
- `salaAudienciaNome`, `salaAudienciaId`: Sala designada

### Modalidade
- `modalidade`: virtual, presencial, hibrida
- `presencaHibrida`: advogado, cliente
- `urlAudienciaVirtual`: Link da videoconferência
- `enderecoPresencial`: Objeto com endereço completo

### Status
- `status`: M, F, C
- `statusDescricao`: Descrição livre do status
- `designada`: Se foi designada formalmente
- `emAndamento`: Se está ocorrendo agora

### Partes
- `poloAtivoNome`: Nome do autor (denormalizado)
- `poloPassivoNome`: Nome do réu (denormalizado)

### Responsabilidade
- `advogadoId`: Advogado designado
- `responsavelId`: Responsável interno
- `observacoes`: Notas sobre a audiência

## Fluxos Especiais

### Captura do PJE
1. Autenticar no tribunal
2. Consultar pauta de audiências
3. Para cada audiência:
   - Verificar se já existe (por idPje)
   - Criar ou atualizar registro
4. Sincronizar status com PJE

### Notificações
1. Ao criar: notificar advogado e responsável
2. 24h antes: lembrete automático
3. 1h antes: alerta de proximidade
4. Ao cancelar: notificar envolvidos

### Reagendamento
1. Cancelar audiência atual (status `C`)
2. Criar nova audiência com mesmos dados
3. Vincular audiências (referência)
4. Notificar envolvidos sobre mudança

## Filtros Disponíveis
- **Status**: status (M, F, C)
- **Modalidade**: modalidade (virtual, presencial, hibrida)
- **Tribunal**: trt, grau
- **Tipo**: tipoAudienciaId
- **Responsável**: responsavelId, semResponsavel
- **Datas**: dataInicioInicio/Fim, dataFimInicio/Fim
- **Busca**: busca (número processo, partes)

## Restrições de Acesso
- Apenas advogados podem criar/editar audiências
- Responsável pode visualizar suas audiências
- Audiências em segredo de justiça herdam restrição do processo

## Integrações
- **PJE**: Captura automática de pautas
- **Calendário**: Sincronização com Google/Outlook
- **Notificações**: Push, e-mail, SMS
- **Sistema de IA**: Indexação para busca semântica

## Revalidação de Cache
Após mutações, revalidar:
- `/audiencias` - Lista de audiências
- `/audiencias/[id]` - Detalhe da audiência
- `/processos/[processoId]` - Processo vinculado
- `/calendar` - Calendário
- `/dashboard` - Métricas do dashboard
