/**
 * Testes de Integração - File Manager Flow
 *
 * Testa o fluxo de listagem unificada e breadcrumbs do File Manager.
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import * as arquivosRepo from "../../repositories/arquivos-repository";
import * as pastasRepo from "../../repositories/pastas-repository";
import * as documentosRepo from "../../repositories/documentos-repository";

// Alias for backward compatibility in tests
const repository = { ...arquivosRepo, ...pastasRepo, ...documentosRepo };

// Mock dependencies
jest.mock("@/lib/storage/backblaze-b2.service", () => ({
  generatePresignedUrl: jest.fn(),
  uploadFileToB2: jest.fn(),
  generatePresignedUploadUrl: jest.fn(),
  getTipoMedia: jest.fn(),
  validateFileType: jest.fn(),
  validateFileSize: jest.fn(),
}));

jest.mock("../../repositories/arquivos-repository", () => ({
  listarItensUnificados: jest.fn(),
  listarArquivos: jest.fn(),
}));

jest.mock("../../repositories/pastas-repository", () => ({
  listarPastasComContadores: jest.fn(),
  buscarCaminhoPasta: jest.fn(),
  verificarAcessoPasta: jest.fn(),
}));

jest.mock("../../repositories/documentos-repository", () => ({
  listarDocumentos: jest.fn(),
}));

// Import service after mocks
// eslint-disable-next-line @typescript-eslint/no-require-imports
const service = require("../../service") as typeof import("../../service");

describe("File Manager Flow Integration", () => {
  const mockUser = { id: 123, email: "test@example.com" };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should list items without forcing criado_por filter", async () => {
    // Setup
    const params = { limit: 10, offset: 0 };
    (repository.listarItensUnificados as jest.Mock).mockResolvedValue({
      itens: [],
      total: 0,
    } as never);

    // Act
    await service.listarItensUnificados(params, mockUser.id);

    // Assert
    expect(repository.listarItensUnificados).toHaveBeenCalledWith(params);
    expect(repository.listarItensUnificados).not.toHaveBeenCalledWith(
      expect.objectContaining({
        criado_por: mockUser.id,
      })
    );
  });

  it("should fetch breadcrumbs with access check", async () => {
    // Setup
    const pastaId = 5;
    (repository.verificarAcessoPasta as jest.Mock).mockResolvedValue(
      true as never
    );
    (repository.buscarCaminhoPasta as jest.Mock).mockResolvedValue([
      { id: 1, nome: "Root" },
      { id: 5, nome: "Current" },
    ] as never);

    // Act
    const breadcrumbs = await service.buscarCaminhoPasta(pastaId, mockUser.id);

    // Assert
    expect(repository.verificarAcessoPasta).toHaveBeenCalledWith(
      pastaId,
      mockUser.id
    );
    expect(repository.buscarCaminhoPasta).toHaveBeenCalledWith(pastaId);
    expect(breadcrumbs).toHaveLength(2);
    expect(breadcrumbs[1].nome).toBe("Current");
  });

  it("should throw error if user has no access to folder for breadcrumbs", async () => {
    // Setup
    const pastaId = 99;
    (repository.verificarAcessoPasta as jest.Mock).mockResolvedValue(
      false as never
    );

    // Act & Assert
    await expect(
      service.buscarCaminhoPasta(pastaId, mockUser.id)
    ).rejects.toThrow("Acesso negado à pasta");

    expect(repository.buscarCaminhoPasta).not.toHaveBeenCalled();
  });
});
