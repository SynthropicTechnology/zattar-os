# Regras de Negocio - Chat

## Contexto
Modulo de comunicacao interna do Sinesys responsavel por salas de chat (texto, midia), chamadas de audio/video (via Dyte) com transcricao e gravacao, e historico de conversas. Integra-se com Supabase Realtime para mensagens em tempo real e com IA para geracao de resumos de chamadas.

## Entidades Principais
- **SalaChat**: Sala de conversa com tipo (geral, documento, privado, grupo), vinculacao opcional a documento ou participante, e flag de arquivamento
- **MensagemChat**: Mensagem enviada em uma sala, com tipo de midia, status de entrega e dados extras (arquivo, imagem, video, audio)
- **ChatItem**: Extensao de SalaChat com dados de exibicao (ultima mensagem, contagem de nao lidas, avatar)
- **Chamada**: Chamada de audio/video vinculada a uma sala, com meetingId do Dyte, status, transcricao, resumo e URL de gravacao
- **ChamadaParticipante**: Registro de participacao em chamada com timestamps de entrada/saida e resposta
- **UsuarioChat**: Dados resumidos de usuario para exibicao no chat (avatar, status online, ultima vez visto)

## Enums e Tipos
- **TipoSalaChat**: `geral`, `documento`, `privado`, `grupo`
- **TipoMensagemChat**: `texto`, `arquivo`, `imagem`, `video`, `audio`, `sistema`
- **MessageStatus**: `sending`, `sent`, `forwarded`, `read`, `failed` (apenas `sent`, `forwarded` e `read` sao persistidos)
- **TipoChamada**: `audio`, `video`
- **StatusChamada**: `iniciada`, `em_andamento`, `finalizada`, `cancelada`, `recusada`

## Regras de Validacao

### Criacao de Sala (criarSalaChatSchema)
- `nome`: obrigatorio, 1-200 caracteres
- `tipo`: enum TipoSalaChat obrigatorio
- `documentoId`: obrigatorio quando tipo = `documento`
- `participanteId`: obrigatorio quando tipo = `privado`

### Criacao de Mensagem (criarMensagemChatSchema)
- `salaId`: numero obrigatorio
- `conteudo`: string nao vazia obrigatoria
- `tipo`: default `texto`
- `data`: objeto opcional com campos de midia (fileName, fileUrl, fileKey, mimeType, size, duration, cover)

### Criacao de Chamada (criarChamadaSchema)
- `salaId`: numero obrigatorio
- `tipo`: enum TipoChamada obrigatorio
- `meetingId`: string obrigatoria

### Resposta a Chamada (responderChamadaSchema)
- `chamadaId`: numero obrigatorio
- `aceitou`: booleano obrigatorio

## Regras de Negocio

### Salas
1. **Sala Geral**: Nao pode ser criada via `criarSala()`. Existe apenas uma, criada por seed/migracao. Nao pode ser deletada nem removida da lista.
2. **Salas Privadas**: Antes de criar, o sistema verifica se ja existe conversa 1-para-1 entre os dois usuarios. Se existir, retorna a sala existente e garante membership para ambos.
3. **Grupos**: Requerem nome nao vazio e pelo menos um membro alem do criador. O criador e automaticamente adicionado como membro.
4. **Edicao de Nome**: Apenas grupos podem ter nome editado, e somente pelo criador.
5. **Arquivamento/Desarquivamento**: Apenas criador ou participante podem arquivar/desarquivar. A flag `isArchive` e na tabela da sala.
6. **Remocao de Conversa**: Soft delete por usuario via membership. A conversa continua existindo para outros participantes.
7. **Hard Delete**: Apenas o criador pode deletar permanentemente uma sala. Sala Geral nunca pode ser deletada.

### Mensagens
1. A sala deve existir para aceitar mensagens.
2. Status default ao salvar e `sent`. Status `sending` e `failed` sao temporarios (apenas UI).
3. Supabase Realtime dispara evento automaticamente ao inserir mensagem.
4. Soft delete de mensagens (campo `deletedAt`).

### Chamadas
1. **Iniciar Chamada**: Valida schema, verifica se sala existe, verifica se usuario e membro ativo da sala. Cria meeting no Dyte, persiste chamada com status `iniciada`, adiciona iniciador como participante e registra entrada automaticamente.
2. **Responder Chamada**: Chamada nao pode estar finalizada ou cancelada. Se recusou, status muda para `recusada`. Se aceitou, gera token Dyte como `group_call_participant`.
3. **Entrar na Chamada**: Nao permite entrar em chamada encerrada. Se status era `iniciada`, muda para `em_andamento` quando participante entra.
4. **Sair da Chamada**: Registra saida e verifica se ainda ha participantes ativos. Se ninguem mais estiver ativo, finaliza a chamada automaticamente com calculo de duracao.
5. **Finalizar Chamada**: Apenas o iniciador pode encerrar para todos. Calcula duracao total. Dispara geracao de resumo por IA em background se houver transcricao.
6. **Transcricao**: Apenas iniciador ou participante que aceitou/entrou pode salvar transcricao. Transcricao nao pode ser vazia.
7. **Resumo IA**: Requer transcricao existente. Usa `gerarResumoTranscricao()` de `@/lib/ai/summarization`.
8. **Gravacao**: Apenas o iniciador pode iniciar gravacao. Depende de feature flag `isDyteRecordingEnabled`.
9. **Historico Global**: Limite maximo de 100 resultados por pagina. Usuarios nao-admin veem apenas suas proprias chamadas.

## Filtros Disponiveis

### Listagem de Salas (ListarSalasParams)
- `tipo`: filtro por TipoSalaChat
- `documentoId`: filtro por documento vinculado
- `limite` e `offset`: paginacao
- `arquivadas`: filtrar salas arquivadas

### Listagem de Mensagens (ListarMensagensParams)
- `salaId`: obrigatorio
- `antesDe`: cursor temporal para paginacao
- `limite`: quantidade de mensagens

### Listagem de Chamadas (ListarChamadasParams)
- `tipo`: filtro por TipoChamada
- `status`: filtro por StatusChamada
- `dataInicio` e `dataFim`: intervalo temporal
- `usuarioId`: filtro por usuario
- `limite`, `offset`, `pagina`: paginacao

## Restricoes de Acesso
- Todas as actions exigem usuario autenticado via `getCurrentUserId()` ou `getCurrentUser()`.
- Historico global de chamadas: usuarios nao-admin sao filtrados para ver apenas suas chamadas.
- Gravacao: restrita ao iniciador da chamada.
- Transcricao: restrita a iniciador ou participante confirmado.

## Integracoes
- **Supabase Realtime**: Disparo automatico de eventos ao inserir mensagens
- **Dyte**: Criacao de meetings, tokens de participante, presets de transcricao, gravacao
- **IA (Summarization)**: Geracao de resumos de transcricoes via `@/lib/ai/summarization`
- **Dyte Config**: Feature flags `isDyteTranscriptionEnabled`, `isDyteRecordingEnabled`

## Revalidacao de Cache
- `revalidatePath('/app/chat')`: ao criar sala, criar grupo, arquivar, desarquivar, remover conversa, deletar sala, atualizar nome, finalizar chamada, gerar resumo, salvar gravacao
- `revalidatePath('/app/chat/${salaId}')`: ao iniciar chamada em sala especifica
