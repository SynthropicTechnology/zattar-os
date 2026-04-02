/**
 * Testes de Integração - Server Actions de Arquivos Genéricos
 *
 * Testa as Server Actions que expõem as operações de arquivos para o frontend:
 * - actionUploadArquivoGenerico
 * - actionListarItensUnificados
 * - actionMoverArquivo
 * - actionDeletarArquivo
 * - actionBuscarCaminhoPasta
 *
 * Estes testes verificam:
 * - Autenticação obrigatória
 * - Chamada correta ao service
 * - Tratamento de erros
 * - Revalidação de cache (revalidatePath)
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// Mock next/cache
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

// Mock auth
const mockUser = { id: 1, email: "user@test.com" };
jest.mock("@/lib/auth/session", () => ({
  authenticateRequest: jest.fn(),
}));

// Mock service
jest.mock("../../service", () => ({
  uploadArquivoGenerico: jest.fn(),
  listarItensUnificados: jest.fn(),
  moverArquivo: jest.fn(),
  deletarArquivo: jest.fn(),
  buscarCaminhoPasta: jest.fn(),
}));

// Import mocks after setup
import { revalidatePath } from "next/cache";
import { authenticateRequest } from "@/lib/auth/session";
import * as service from "../../service";

// Import actions after mocks
import {
  actionUploadArquivoGenerico,
  actionListarItensUnificados,
  actionMoverArquivo,
  actionDeletarArquivo,
  actionBuscarCaminhoPasta,
} from "../../actions/arquivos-actions";

import type { Arquivo, Pasta } from "../../domain";

describe("Arquivos Actions Integration", () => {
  const mockArquivo: Arquivo = {
    id: 1,
    nome: "documento.pdf",
    tipo_mime: "application/pdf",
    tamanho_bytes: 1024000,
    pasta_id: null,
    b2_key: "arquivos/documento.pdf",
    b2_url: "https://b2.example.com/arquivos/documento.pdf",
    tipo_media: "pdf",
    criado_por: mockUser.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("actionUploadArquivoGenerico", () => {
    it("deve retornar erro quando não autenticado", async () => {
      // Setup
      (authenticateRequest as jest.Mock).mockResolvedValue(null as never);

      const formData = new FormData();
      formData.append("file", new Blob(["content"]), "test.pdf");

      // Act
      const result = await actionUploadArquivoGenerico(formData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Não autenticado");
      expect(service.uploadArquivoGenerico).not.toHaveBeenCalled();
    });

    it("deve retornar erro quando nenhum arquivo enviado", async () => {
      // Setup
      (authenticateRequest as jest.Mock).mockResolvedValue(mockUser as never);

      const formData = new FormData();
      // Não adiciona arquivo

      // Act
      const result = await actionUploadArquivoGenerico(formData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Nenhum arquivo enviado.");
    });

    it("deve fazer upload com sucesso e revalidar cache", async () => {
      // Setup
      (authenticateRequest as jest.Mock).mockResolvedValue(mockUser as never);
      (service.uploadArquivoGenerico as jest.Mock).mockResolvedValue(
        mockArquivo as never
      );

      const formData = new FormData();
      formData.append("file", new Blob(["content"]), "test.pdf");

      // Act
      const result = await actionUploadArquivoGenerico(formData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockArquivo);
      expect(revalidatePath).toHaveBeenCalledWith("/app/documentos");
    });

    it("deve fazer upload para pasta específica", async () => {
      // Setup
      (authenticateRequest as jest.Mock).mockResolvedValue(mockUser as never);
      (service.uploadArquivoGenerico as jest.Mock).mockResolvedValue({
        ...mockArquivo,
        pasta_id: 5,
      } as never);

      const formData = new FormData();
      formData.append("file", new Blob(["content"]), "test.pdf");
      formData.append("pasta_id", "5");

      // Act
      const result = await actionUploadArquivoGenerico(formData);

      // Assert
      expect(result.success).toBe(true);
      expect(service.uploadArquivoGenerico).toHaveBeenCalledWith(
        expect.any(Object), // File
        5, // pasta_id parsed
        mockUser.id
      );
    });

    it("deve tratar erro do service graciosamente", async () => {
      // Setup
      (authenticateRequest as jest.Mock).mockResolvedValue(mockUser as never);
      (service.uploadArquivoGenerico as jest.Mock).mockRejectedValue(
        new Error("Tipo de arquivo não permitido.") as never
      );

      const formData = new FormData();
      formData.append("file", new Blob(["content"]), "malware.exe");

      // Act
      const result = await actionUploadArquivoGenerico(formData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Tipo de arquivo não permitido.");
    });
  });

  describe("actionListarItensUnificados", () => {
    it("deve retornar erro quando não autenticado", async () => {
      // Setup
      (authenticateRequest as jest.Mock).mockResolvedValue(null as never);

      // Act
      const result = await actionListarItensUnificados({});

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Não autenticado");
    });

    it("deve listar itens com sucesso", async () => {
      // Setup
      (authenticateRequest as jest.Mock).mockResolvedValue(mockUser as never);
      (service.listarItensUnificados as jest.Mock).mockResolvedValue({
        itens: [{ tipo: "arquivo", dados: mockArquivo }],
        total: 1,
      } as never);

      // Act
      const result = await actionListarItensUnificados({ limit: 10, offset: 0 });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it("deve passar filtros corretamente", async () => {
      // Setup
      (authenticateRequest as jest.Mock).mockResolvedValue(mockUser as never);
      (service.listarItensUnificados as jest.Mock).mockResolvedValue({
        itens: [],
        total: 0,
      } as never);

      const params = {
        pasta_id: 5,
        busca: "contrato",
        tipo_media: "pdf" as const,
        limit: 20,
        offset: 10,
      };

      // Act
      await actionListarItensUnificados(params);

      // Assert
      expect(service.listarItensUnificados).toHaveBeenCalledWith(
        params,
        mockUser.id
      );
    });

    it("deve tratar erro do service", async () => {
      // Setup
      (authenticateRequest as jest.Mock).mockResolvedValue(mockUser as never);
      (service.listarItensUnificados as jest.Mock).mockRejectedValue(
        new Error("Erro de banco de dados") as never
      );

      // Act
      const result = await actionListarItensUnificados({});

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Erro de banco de dados");
    });
  });

  describe("actionMoverArquivo", () => {
    it("deve retornar erro quando não autenticado", async () => {
      // Setup
      (authenticateRequest as jest.Mock).mockResolvedValue(null as never);

      // Act
      const result = await actionMoverArquivo(1, 5);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Não autenticado");
    });

    it("deve mover arquivo com sucesso", async () => {
      // Setup
      (authenticateRequest as jest.Mock).mockResolvedValue(mockUser as never);
      (service.moverArquivo as jest.Mock).mockResolvedValue({
        ...mockArquivo,
        pasta_id: 10,
      } as never);

      // Act
      const result = await actionMoverArquivo(1, 10);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.pasta_id).toBe(10);
      expect(revalidatePath).toHaveBeenCalledWith("/app/documentos");
    });

    it("deve mover arquivo para raiz (null)", async () => {
      // Setup
      (authenticateRequest as jest.Mock).mockResolvedValue(mockUser as never);
      (service.moverArquivo as jest.Mock).mockResolvedValue({
        ...mockArquivo,
        pasta_id: null,
      } as never);

      // Act
      const result = await actionMoverArquivo(1, null);

      // Assert
      expect(result.success).toBe(true);
      expect(service.moverArquivo).toHaveBeenCalledWith(1, null, mockUser.id);
    });

    it("deve tratar erro de acesso negado", async () => {
      // Setup
      (authenticateRequest as jest.Mock).mockResolvedValue(mockUser as never);
      (service.moverArquivo as jest.Mock).mockRejectedValue(
        new Error("Acesso negado ao arquivo.") as never
      );

      // Act
      const result = await actionMoverArquivo(1, 10);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Acesso negado ao arquivo.");
    });
  });

  describe("actionDeletarArquivo", () => {
    it("deve retornar erro quando não autenticado", async () => {
      // Setup
      (authenticateRequest as jest.Mock).mockResolvedValue(null as never);

      // Act
      const result = await actionDeletarArquivo(1);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Não autenticado");
    });

    it("deve deletar arquivo com sucesso", async () => {
      // Setup
      (authenticateRequest as jest.Mock).mockResolvedValue(mockUser as never);
      (service.deletarArquivo as jest.Mock).mockResolvedValue(
        undefined as never
      );

      // Act
      const result = await actionDeletarArquivo(1);

      // Assert
      expect(result.success).toBe(true);
      expect(service.deletarArquivo).toHaveBeenCalledWith(1, mockUser.id);
      expect(revalidatePath).toHaveBeenCalledWith("/app/documentos");
      expect(revalidatePath).toHaveBeenCalledWith("/app/documentos/lixeira");
    });

    it("deve tratar erro de acesso negado", async () => {
      // Setup
      (authenticateRequest as jest.Mock).mockResolvedValue(mockUser as never);
      (service.deletarArquivo as jest.Mock).mockRejectedValue(
        new Error("Acesso negado: apenas o proprietário pode deletar.") as never
      );

      // Act
      const result = await actionDeletarArquivo(1);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "Acesso negado: apenas o proprietário pode deletar."
      );
    });
  });

  describe("actionBuscarCaminhoPasta", () => {
    const mockCaminho: Partial<Pasta>[] = [
      { id: 1, nome: "Raiz", pasta_pai_id: null },
      { id: 2, nome: "Subpasta", pasta_pai_id: 1 },
      { id: 3, nome: "Atual", pasta_pai_id: 2 },
    ];

    it("deve retornar erro quando não autenticado", async () => {
      // Setup
      (authenticateRequest as jest.Mock).mockResolvedValue(null as never);

      // Act
      const result = await actionBuscarCaminhoPasta(3);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Não autenticado");
    });

    it("deve retornar caminho completo da pasta", async () => {
      // Setup
      (authenticateRequest as jest.Mock).mockResolvedValue(mockUser as never);
      (service.buscarCaminhoPasta as jest.Mock).mockResolvedValue(
        mockCaminho as never
      );

      // Act
      const result = await actionBuscarCaminhoPasta(3);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.data?.[0].nome).toBe("Raiz");
      expect(result.data?.[2].nome).toBe("Atual");
    });

    it("deve tratar erro de acesso negado", async () => {
      // Setup
      (authenticateRequest as jest.Mock).mockResolvedValue(mockUser as never);
      (service.buscarCaminhoPasta as jest.Mock).mockRejectedValue(
        new Error("Acesso negado à pasta.") as never
      );

      // Act
      const result = await actionBuscarCaminhoPasta(99);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Acesso negado à pasta.");
    });
  });

  describe("Error Handling - Erros não-Error", () => {
    it("deve converter string para mensagem de erro", async () => {
      // Setup
      (authenticateRequest as jest.Mock).mockResolvedValue(mockUser as never);
      (service.listarItensUnificados as jest.Mock).mockRejectedValue(
        "Erro inesperado" as never
      );

      // Act
      const result = await actionListarItensUnificados({});

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Erro inesperado");
    });

    it("deve tratar erro genérico sem mensagem", async () => {
      // Setup
      (authenticateRequest as jest.Mock).mockResolvedValue(mockUser as never);
      (service.deletarArquivo as jest.Mock).mockRejectedValue({} as never);

      // Act
      const result = await actionDeletarArquivo(1);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("[object Object]");
    });
  });
});
