import type {
  SalaChat,
  MensagemChat,
  Chamada,
  ChamadaParticipante,
  UsuarioChat,
  ChatMessageData,
} from '../domain';

import {
  TipoSalaChat,
  TipoMensagemChat,
  TipoChamada,
  StatusChamada,
} from '../domain';

export function criarSalaMock(overrides?: Partial<SalaChat>): SalaChat {
  return {
    id: 1,
    nome: 'Sala Teste',
    tipo: TipoSalaChat.Geral,
    documentoId: null,
    participanteId: null,
    criadoPor: 1,
    createdAt: new Date('2024-01-01T10:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-01T10:00:00Z').toISOString(),
    isArchive: false,
    ...overrides,
  };
}

export function criarMensagemMock(overrides?: Partial<MensagemChat>): MensagemChat {
  return {
    id: 1,
    salaId: 1,
    usuarioId: 1,
    conteudo: 'Mensagem teste',
    tipo: TipoMensagemChat.Texto,
    createdAt: new Date('2024-01-01T10:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-01T10:00:00Z').toISOString(),
    deletedAt: null,
    status: 'sent',
    ownMessage: false,
    read: false,
    ...overrides,
  };
}

export function criarChamadaMock(overrides?: Partial<Chamada>): Chamada {
  return {
    id: 1,
    salaId: 1,
    tipo: TipoChamada.Video,
    meetingId: 'meeting-123',
    iniciadoPor: 1,
    status: StatusChamada.EmAndamento,
    iniciadaEm: new Date('2024-01-01T10:00:00Z').toISOString(),
    finalizadaEm: undefined,
    duracaoSegundos: undefined,
    transcricao: undefined,
    resumo: undefined,
    gravacaoUrl: undefined,
    createdAt: new Date('2024-01-01T10:00:00Z').toISOString(),
    ...overrides,
  };
}

export function criarChamadaParticipanteMock(
  overrides?: Partial<ChamadaParticipante>
): ChamadaParticipante {
  return {
    id: 1,
    chamadaId: 1,
    usuarioId: 1,
    entrouEm: new Date('2024-01-01T10:00:00Z').toISOString(),
    saiuEm: undefined,
    duracaoSegundos: undefined,
    aceitou: true,
    respondeuEm: new Date('2024-01-01T10:00:00Z').toISOString(),
    createdAt: new Date('2024-01-01T10:00:00Z').toISOString(),
    ...overrides,
  };
}

export function criarUsuarioChatMock(overrides?: Partial<UsuarioChat>): UsuarioChat {
  return {
    id: 1,
    nomeCompleto: 'Usuário Teste',
    nomeExibicao: null,
    emailCorporativo: 'usuario@test.com',
    avatar: undefined,
    about: undefined,
    phone: undefined,
    country: undefined,
    email: undefined,
    gender: undefined,
    website: undefined,
    onlineStatus: 'online',
    lastSeen: undefined,
    socialLinks: undefined,
    medias: undefined,
    ...overrides,
  };
}

export function criarChatMessageDataMock(
  overrides?: Partial<ChatMessageData>
): ChatMessageData {
  return {
    fileName: 'arquivo.pdf',
    fileUrl: 'https://b2.example.com/arquivo.pdf',
    fileKey: 'arquivos/arquivo.pdf',
    mimeType: 'application/pdf',
    size: '1024000',
    duration: undefined,
    cover: undefined,
    images: undefined,
    uploadedAt: new Date('2024-01-01T10:00:00Z').toISOString(),
    uploadedBy: 1,
    ...overrides,
  };
}
