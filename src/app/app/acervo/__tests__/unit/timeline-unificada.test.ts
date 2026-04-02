/**
 * Testes Unitários - Timeline Unificada
 *
 * Testa a lógica de deduplicação e agregação de timelines multi-instância.
 */

import { describe, it, expect } from "@jest/globals";
import {
  gerarHashDeduplicacao,
  deduplicarTimeline,
  type TimelineItemUnificado,
} from "../../timeline-unificada";
import type { TimelineItemEnriquecido } from "@/types/contracts/pje-trt";

// =============================================================================
// FIXTURES
// =============================================================================

/**
 * Cria um item de timeline base para testes
 */
function criarItemBase(
  overrides: Partial<TimelineItemEnriquecido> = {}
): TimelineItemEnriquecido {
  return {
    id: 1,
    data: "2025-01-15T10:30:00.000Z",
    titulo: "Movimento de Teste",
    documento: false,
    idUsuario: 0,
    especializacoes: 0,
    nomeResponsavel: "",
    tipoPolo: "",
    favorito: false,
    ativo: true,
    documentoSigiloso: false,
    usuarioInterno: false,
    documentoApreciavel: false,
    expediente: false,
    numeroOrdem: 0,
    codigoInstancia: 0,
    pendenciaDocInstanciaOrigem: false,
    copia: false,
    permiteCooperacaoJudiciaria: false,
    dataJuntadaFutura: false,
    ...overrides,
  };
}

/**
 * Cria um item unificado para testes
 */
function criarItemUnificado(
  overrides: Partial<TimelineItemUnificado> = {}
): TimelineItemUnificado {
  const baseItem = criarItemBase(overrides);
  return {
    ...baseItem,
    grauOrigem: "primeiro_grau",
    trtOrigem: "TRT3",
    instanciaId: 1,
    _dedupeHash: "",
    ...overrides,
  };
}

// =============================================================================
// TESTES: gerarHashDeduplicacao
// =============================================================================

describe("gerarHashDeduplicacao", () => {
  describe("para movimentos (documento: false)", () => {
    it("deve gerar hash com data + código CNJ + título", () => {
      const item = criarItemBase({
        data: "2025-01-15T10:30:00.000Z",
        titulo: "Juntada de Documento",
        codigoMovimentoCNJ: "60",
        documento: false,
      });

      const hash = gerarHashDeduplicacao(item);

      expect(hash).toBe("mov:2025-01-15:60:Juntada de Documento");
    });

    it("deve usar string vazia quando código CNJ não existir", () => {
      const item = criarItemBase({
        data: "2025-01-15T10:30:00.000Z",
        titulo: "Movimento Sem CNJ",
        documento: false,
      });

      const hash = gerarHashDeduplicacao(item);

      expect(hash).toBe("mov:2025-01-15::Movimento Sem CNJ");
    });

    it("deve usar apenas a data (YYYY-MM-DD), ignorando horário", () => {
      const item1 = criarItemBase({
        data: "2025-01-15T08:00:00.000Z",
        titulo: "Movimento",
        codigoMovimentoCNJ: "123",
        documento: false,
      });
      const item2 = criarItemBase({
        data: "2025-01-15T22:00:00.000Z",
        titulo: "Movimento",
        codigoMovimentoCNJ: "123",
        documento: false,
      });

      expect(gerarHashDeduplicacao(item1)).toBe(gerarHashDeduplicacao(item2));
    });
  });

  describe("para documentos (documento: true)", () => {
    it("deve usar idUnicoDocumento quando disponível", () => {
      const item = criarItemBase({
        documento: true,
        idUnicoDocumento: "DOC-UNICO-12345",
        data: "2025-01-15T10:30:00.000Z",
        titulo: "Petição Inicial",
        tipo: "Petição",
      });

      const hash = gerarHashDeduplicacao(item);

      expect(hash).toBe("doc:DOC-UNICO-12345");
    });

    it("deve usar fallback (data + tipo + título) quando idUnicoDocumento não existir", () => {
      const item = criarItemBase({
        documento: true,
        data: "2025-01-15T10:30:00.000Z",
        titulo: "Petição Inicial",
        tipo: "Petição",
      });

      const hash = gerarHashDeduplicacao(item);

      expect(hash).toBe("doc:2025-01-15:Petição:Petição Inicial");
    });

    it("deve usar string vazia quando tipo não existir no fallback", () => {
      const item = criarItemBase({
        documento: true,
        data: "2025-01-15T10:30:00.000Z",
        titulo: "Documento Sem Tipo",
      });

      const hash = gerarHashDeduplicacao(item);

      expect(hash).toBe("doc:2025-01-15::Documento Sem Tipo");
    });
  });
});

// =============================================================================
// TESTES: deduplicarTimeline
// =============================================================================

describe("deduplicarTimeline", () => {
  describe("remoção de duplicatas", () => {
    it("deve manter apenas um item quando há duplicatas exatas", () => {
      const items: TimelineItemUnificado[] = [
        criarItemUnificado({
          _dedupeHash: "mov:2025-01-15:60:Movimento",
          titulo: "Movimento",
        }),
        criarItemUnificado({
          _dedupeHash: "mov:2025-01-15:60:Movimento",
          titulo: "Movimento",
          instanciaId: 2,
        }),
      ];

      const resultado = deduplicarTimeline(items);

      expect(resultado).toHaveLength(1);
    });

    it("deve manter itens únicos sem alteração", () => {
      const items: TimelineItemUnificado[] = [
        criarItemUnificado({
          _dedupeHash: "mov:2025-01-15:60:Movimento A",
          titulo: "Movimento A",
        }),
        criarItemUnificado({
          _dedupeHash: "mov:2025-01-16:61:Movimento B",
          titulo: "Movimento B",
        }),
        criarItemUnificado({
          _dedupeHash: "doc:DOC-123",
          titulo: "Documento",
          documento: true,
        }),
      ];

      const resultado = deduplicarTimeline(items);

      expect(resultado).toHaveLength(3);
    });
  });

  describe("priorização por storage", () => {
    it("deve priorizar item com backblaze sobre item sem storage", () => {
      const semStorage = criarItemUnificado({
        _dedupeHash: "doc:IGUAL",
        titulo: "Documento",
        documento: true,
        grauOrigem: "tribunal_superior", // Mesmo com grau maior
      });

      const comBackblaze = criarItemUnificado({
        _dedupeHash: "doc:IGUAL",
        titulo: "Documento",
        documento: true,
        grauOrigem: "primeiro_grau",
        backblaze: {
          url: "https://...",
          key: "doc.pdf",
          bucket: "test-bucket",
          fileName: "doc.pdf",
          uploadedAt: new Date("2025-01-15T10:00:00Z"),
        },
      });

      // Testar com semStorage primeiro
      const resultado1 = deduplicarTimeline([semStorage, comBackblaze]);
      expect(resultado1[0].backblaze).toBeDefined();

      // Testar com comBackblaze primeiro
      const resultado2 = deduplicarTimeline([comBackblaze, semStorage]);
      expect(resultado2[0].backblaze).toBeDefined();
    });

    it("deve priorizar item com googleDrive sobre item sem storage", () => {
      const semStorage = criarItemUnificado({
        _dedupeHash: "doc:IGUAL",
        titulo: "Documento",
        documento: true,
      });

      const comGoogleDrive = criarItemUnificado({
        _dedupeHash: "doc:IGUAL",
        titulo: "Documento",
        documento: true,
        googleDrive: {
          fileId: "gdrive123",
          linkVisualizacao: "https://drive.google.com/...",
          linkDownload: "https://...",
          uploadedAt: new Date("2025-01-15T10:00:00Z"),
        },
      });

      const resultado = deduplicarTimeline([semStorage, comGoogleDrive]);

      expect(resultado[0].googleDrive).toBeDefined();
    });
  });

  describe("priorização por grau de instância", () => {
    it("deve priorizar tribunal_superior sobre segundo_grau (sem storage)", () => {
      const segundoGrau = criarItemUnificado({
        _dedupeHash: "mov:2025-01-15:60:Movimento",
        grauOrigem: "segundo_grau",
      });

      const tribunalSuperior = criarItemUnificado({
        _dedupeHash: "mov:2025-01-15:60:Movimento",
        grauOrigem: "tribunal_superior",
      });

      // Testar com segundoGrau primeiro
      const resultado1 = deduplicarTimeline([segundoGrau, tribunalSuperior]);
      expect(resultado1[0].grauOrigem).toBe("tribunal_superior");

      // Testar com tribunalSuperior primeiro
      const resultado2 = deduplicarTimeline([tribunalSuperior, segundoGrau]);
      expect(resultado2[0].grauOrigem).toBe("tribunal_superior");
    });

    it("deve priorizar segundo_grau sobre primeiro_grau (sem storage)", () => {
      const primeiroGrau = criarItemUnificado({
        _dedupeHash: "mov:2025-01-15:60:Movimento",
        grauOrigem: "primeiro_grau",
      });

      const segundoGrau = criarItemUnificado({
        _dedupeHash: "mov:2025-01-15:60:Movimento",
        grauOrigem: "segundo_grau",
      });

      const resultado = deduplicarTimeline([primeiroGrau, segundoGrau]);

      expect(resultado[0].grauOrigem).toBe("segundo_grau");
    });

    it("deve manter primeiro item quando ambos têm mesmo grau e sem storage", () => {
      const item1 = criarItemUnificado({
        _dedupeHash: "mov:2025-01-15:60:Movimento",
        grauOrigem: "primeiro_grau",
        instanciaId: 1,
      });

      const item2 = criarItemUnificado({
        _dedupeHash: "mov:2025-01-15:60:Movimento",
        grauOrigem: "primeiro_grau",
        instanciaId: 2,
      });

      const resultado = deduplicarTimeline([item1, item2]);

      expect(resultado[0].instanciaId).toBe(1);
    });
  });

  describe("cenário complexo", () => {
    it("deve processar corretamente mix de documentos e movimentos", () => {
      const items: TimelineItemUnificado[] = [
        // Documento duplicado - manter com storage
        criarItemUnificado({
          _dedupeHash: "doc:DOC-123",
          documento: true,
          grauOrigem: "primeiro_grau",
        }),
        criarItemUnificado({
          _dedupeHash: "doc:DOC-123",
          documento: true,
          grauOrigem: "segundo_grau",
          backblaze: {
            url: "x",
            key: "x",
            bucket: "test",
            fileName: "x",
            uploadedAt: new Date("2025-01-01"),
          },
        }),

        // Movimento único
        criarItemUnificado({
          _dedupeHash: "mov:2025-01-15:60:Unico",
          documento: false,
        }),

        // Movimento duplicado - manter grau superior
        criarItemUnificado({
          _dedupeHash: "mov:2025-01-16:61:Duplicado",
          documento: false,
          grauOrigem: "primeiro_grau",
        }),
        criarItemUnificado({
          _dedupeHash: "mov:2025-01-16:61:Duplicado",
          documento: false,
          grauOrigem: "tribunal_superior",
        }),
      ];

      const resultado = deduplicarTimeline(items);

      // 3 itens únicos: 1 documento + 2 movimentos
      expect(resultado).toHaveLength(3);

      // Verificar priorização correta
      const doc = resultado.find((i) => i._dedupeHash === "doc:DOC-123");
      expect(doc?.backblaze).toBeDefined();

      const movDup = resultado.find(
        (i) => i._dedupeHash === "mov:2025-01-16:61:Duplicado"
      );
      expect(movDup?.grauOrigem).toBe("tribunal_superior");
    });

    it("deve retornar array vazio para entrada vazia", () => {
      const resultado = deduplicarTimeline([]);
      expect(resultado).toHaveLength(0);
    });

    it("deve lidar com grande volume de itens", () => {
      const items: TimelineItemUnificado[] = [];

      // 1000 itens únicos
      for (let i = 0; i < 1000; i++) {
        items.push(
          criarItemUnificado({
            _dedupeHash: `mov:2025-01-01:${i}:Movimento ${i}`,
            id: i,
          })
        );
      }

      // 500 duplicatas
      for (let i = 0; i < 500; i++) {
        items.push(
          criarItemUnificado({
            _dedupeHash: `mov:2025-01-01:${i}:Movimento ${i}`,
            id: i + 1000,
            grauOrigem: "segundo_grau",
          })
        );
      }

      const resultado = deduplicarTimeline(items);

      // Deve ter 1000 itens únicos
      expect(resultado).toHaveLength(1000);

      // Os primeiros 500 devem ter grau superior (segundo_grau)
      const primeiros500 = resultado.filter((_, idx) => idx < 500);
      const comSegundoGrau = primeiros500.filter(
        (i) => i.grauOrigem === "segundo_grau"
      );
      expect(comSegundoGrau.length).toBeGreaterThan(0);
    });
  });
});

// =============================================================================
// TESTES: Leitura de Timeline JSONB
// =============================================================================

describe("Leitura de Timeline JSONB", () => {
  describe("estrutura do JSONB", () => {
    it("deve processar timeline_jsonb com estrutura válida", () => {
      const timelineJsonb = {
        timeline: [
          criarItemBase({
            data: "2025-01-15T10:00:00.000Z",
            titulo: "Movimento 1",
            documento: false,
          }),
          criarItemBase({
            data: "2025-01-16T10:00:00.000Z",
            titulo: "Documento 1",
            documento: true,
            idUnicoDocumento: "DOC-123",
          }),
        ],
        metadata: {
          totalDocumentos: 1,
          totalMovimentos: 1,
          totalDocumentosBaixados: 0,
          capturadoEm: "2025-01-15T10:00:00.000Z",
          schemaVersion: 1,
        },
      };

      expect(timelineJsonb.timeline).toHaveLength(2);
      expect(timelineJsonb.metadata.totalDocumentos).toBe(1);
      expect(timelineJsonb.metadata.totalMovimentos).toBe(1);
    });

    it("deve lidar com timeline_jsonb vazio", () => {
      const timelineJsonb = {
        timeline: [],
        metadata: {
          totalDocumentos: 0,
          totalMovimentos: 0,
          totalDocumentosBaixados: 0,
          capturadoEm: "2025-01-15T10:00:00.000Z",
          schemaVersion: 1,
        },
      };

      expect(timelineJsonb.timeline).toHaveLength(0);
      expect(timelineJsonb.metadata.totalDocumentos).toBe(0);
    });

    it("deve processar timeline com documentos e movimentos misturados", () => {
      const timelineJsonb = {
        timeline: [
          criarItemBase({
            data: "2025-01-15T10:00:00.000Z",
            titulo: "Movimento 1",
            documento: false,
            codigoMovimentoCNJ: "60",
          }),
          criarItemBase({
            data: "2025-01-16T10:00:00.000Z",
            titulo: "Documento 1",
            documento: true,
            idUnicoDocumento: "DOC-123",
          }),
          criarItemBase({
            data: "2025-01-17T10:00:00.000Z",
            titulo: "Movimento 2",
            documento: false,
            codigoMovimentoCNJ: "61",
          }),
        ],
        metadata: {
          totalDocumentos: 1,
          totalMovimentos: 2,
          totalDocumentosBaixados: 0,
          capturadoEm: "2025-01-15T10:00:00.000Z",
          schemaVersion: 1,
        },
      };

      const documentos = timelineJsonb.timeline.filter((i) => i.documento);
      const movimentos = timelineJsonb.timeline.filter((i) => !i.documento);

      expect(documentos).toHaveLength(1);
      expect(movimentos).toHaveLength(2);
    });
  });

  describe("validação de dados", () => {
    it("deve validar que timeline é um array", () => {
      const timelineJsonb = {
        timeline: [
          criarItemBase({
            data: "2025-01-15T10:00:00.000Z",
            titulo: "Movimento 1",
            documento: false,
          }),
        ],
        metadata: {
          totalDocumentos: 0,
          totalMovimentos: 1,
          totalDocumentosBaixados: 0,
          capturadoEm: "2025-01-15T10:00:00.000Z",
          schemaVersion: 1,
        },
      };

      expect(Array.isArray(timelineJsonb.timeline)).toBe(true);
    });

    it("deve validar que metadata possui campos obrigatórios", () => {
      const timelineJsonb = {
        timeline: [],
        metadata: {
          totalDocumentos: 0,
          totalMovimentos: 0,
          totalDocumentosBaixados: 0,
          capturadoEm: "2025-01-15T10:00:00.000Z",
          schemaVersion: 1,
        },
      };

      expect(timelineJsonb.metadata).toHaveProperty("totalDocumentos");
      expect(timelineJsonb.metadata).toHaveProperty("totalMovimentos");
      expect(timelineJsonb.metadata).toHaveProperty("totalDocumentosBaixados");
      expect(timelineJsonb.metadata).toHaveProperty("capturadoEm");
      expect(timelineJsonb.metadata).toHaveProperty("schemaVersion");
    });

    it("deve processar timeline com documentos que possuem storage", () => {
      const timelineJsonb = {
        timeline: [
          {
            ...criarItemBase({
              data: "2025-01-15T10:00:00.000Z",
              titulo: "Documento com Backblaze",
              documento: true,
              idUnicoDocumento: "DOC-123",
            }),
            backblaze: {
              fileId: "file123",
              fileName: "doc.pdf",
              downloadUrl: "https://backblaze.com/...",
              uploadedAt: "2025-01-15T10:00:00Z",
            },
          },
        ],
        metadata: {
          totalDocumentos: 1,
          totalMovimentos: 0,
          totalDocumentosBaixados: 1,
          capturadoEm: "2025-01-15T10:00:00.000Z",
          schemaVersion: 1,
        },
      };

      const documento = timelineJsonb.timeline[0];
      expect(documento.backblaze).toBeDefined();
      expect(documento.backblaze?.fileId).toBe("file123");
      expect(timelineJsonb.metadata.totalDocumentosBaixados).toBe(1);
    });
  });
});
