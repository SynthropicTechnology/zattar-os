/**
 * Testes: documento-card-adapter
 *
 * Verifica a conversão de DocumentoListItem (banco) → DocumentoCardData (UI).
 */

import {
  documentoToCardData,
  documentosToCardData,
} from '../../adapters/documento-card-adapter';
import {
  criarDocumentoListItemMock,
  criarDocumentoRascunhoMock,
  criarDocumentoConcluidoMock,
  criarDocumentoCanceladoMock,
  criarListaDocumentosMock,
} from '../fixtures';

describe('documento-card-adapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('documentoToCardData', () => {
    it('deve converter documento com assinantes corretamente', () => {
      const item = criarDocumentoListItemMock();
      const result = documentoToCardData(item);

      expect(result.id).toBe(1);
      expect(result.uuid).toBe(item.documento_uuid);
      expect(result.titulo).toBe('Contrato de Honorários — Maria Silva');
      expect(result.status).toBe('pronto');
      expect(result.selfieHabilitada).toBe(true);
      expect(result.origem).toBe('documento');
      expect(result.criadoPor).toBe('Dr. Marcos Vieira');
    });

    it('deve mapear assinantes com nomes do snapshot', () => {
      const item = criarDocumentoListItemMock();
      const result = documentoToCardData(item);

      expect(result.assinantes).toHaveLength(3);
      expect(result.assinantes[0].nome).toBe('Maria Fernanda Silva');
      expect(result.assinantes[0].tipo).toBe('cliente');
      expect(result.assinantes[0].status).toBe('concluido');
      expect(result.assinantes[0].email).toBe('maria@email.com');
    });

    it('deve calcular diasPendente para assinantes pendentes', () => {
      const item = criarDocumentoListItemMock();
      const result = documentoToCardData(item);

      const pendente = result.assinantes.find(a => a.status === 'pendente');
      expect(pendente).toBeDefined();
      expect(pendente!.diasPendente).toBeGreaterThanOrEqual(0);
    });

    it('deve ter diasPendente undefined para assinantes concluidos', () => {
      const item = criarDocumentoListItemMock();
      const result = documentoToCardData(item);

      const concluido = result.assinantes.find(a => a.status === 'concluido');
      expect(concluido).toBeDefined();
      expect(concluido!.diasPendente).toBeUndefined();
    });

    it('deve definir concluidoEm para assinantes concluidos', () => {
      const item = criarDocumentoListItemMock();
      const result = documentoToCardData(item);

      const concluido = result.assinantes[0];
      expect(concluido.concluidoEm).toBe('2026-03-29T10:00:00Z');
    });

    it('deve converter documento rascunho sem assinantes', () => {
      const item = criarDocumentoRascunhoMock();
      const result = documentoToCardData(item);

      expect(result.status).toBe('rascunho');
      expect(result.assinantes).toHaveLength(0);
    });

    it('deve converter documento concluido', () => {
      const item = criarDocumentoConcluidoMock();
      const result = documentoToCardData(item);

      expect(result.status).toBe('concluido');
      expect(result.assinantes).toHaveLength(2);
      expect(result.assinantes.every(a => a.status === 'concluido')).toBe(true);
      expect(result.origem).toBe('formulario');
    });

    it('deve converter documento cancelado', () => {
      const item = criarDocumentoCanceladoMock();
      const result = documentoToCardData(item);

      expect(result.status).toBe('cancelado');
      expect(result.assinantes).toHaveLength(1);
      expect(result.assinantes[0].status).toBe('pendente');
    });

    it('deve usar fallback para titulo quando null', () => {
      const item = criarDocumentoListItemMock({ titulo: null });
      const result = documentoToCardData(item);

      expect(result.titulo).toBe('Documento #1');
    });

    it('deve usar fallback para nome do assinante quando snapshot vazio', () => {
      const item = criarDocumentoListItemMock({
        assinantes: [{
          id: 99,
          documento_id: 1,
          assinante_tipo: 'convidado',
          dados_snapshot: {},
          status: 'pendente',
          concluido_em: null,
          created_at: '2026-03-28T10:00:00Z',
        }],
      });
      const result = documentoToCardData(item);

      expect(result.assinantes[0].nome).toBe('Sem nome');
    });

    it('deve usar _cliente_nome como criadoPor', () => {
      const item = criarDocumentoListItemMock({ _cliente_nome: 'Dra. Patrícia' });
      const result = documentoToCardData(item);

      expect(result.criadoPor).toBe('Dra. Patrícia');
    });

    it('deve usar "Sistema" quando _cliente_nome ausente', () => {
      const item = criarDocumentoListItemMock({ _cliente_nome: undefined });
      const result = documentoToCardData(item);

      expect(result.criadoPor).toBe('Sistema');
    });

    it('deve usar "documento" como origem default', () => {
      const item = criarDocumentoListItemMock({ _origem: undefined });
      const result = documentoToCardData(item);

      expect(result.origem).toBe('documento');
    });
  });

  describe('documentosToCardData', () => {
    it('deve converter lista de documentos', () => {
      const items = criarListaDocumentosMock();
      const result = documentosToCardData(items);

      expect(result).toHaveLength(4);
      expect(result.map(d => d.status)).toEqual([
        'pronto',
        'rascunho',
        'concluido',
        'cancelado',
      ]);
    });

    it('deve retornar array vazio para lista vazia', () => {
      const result = documentosToCardData([]);
      expect(result).toEqual([]);
    });
  });
});
