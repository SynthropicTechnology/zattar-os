import {
  criarAudiencia,
  atualizarAudiencia,
  atualizarStatusAudiencia,
} from "../../service";
import * as repo from "../../repository";
import { StatusAudiencia, CreateAudienciaInput, UpdateAudienciaInput } from "../../domain";

// Mock repository
jest.mock("../../repository");

// Helper for result types since we can't import ok/err easily if they are missing
const ok = <T>(data: T) => ({ success: true as const, data });
// const err = <E>(error: E) => ({ success: false as const, error });

describe("Audiencias Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("criarAudiencia", () => {
    const validAudiencia = {
      processoId: 1,
      tipoAudienciaId: 2,
      dataInicio: "2023-01-01T10:00:00Z",
      dataFim: "2023-01-01T11:00:00Z",
    };

    it("deve criar audiencia com sucesso", async () => {
      // Arrange
      (repo.processoExists as jest.Mock).mockResolvedValue(ok(true));
      (repo.tipoAudienciaExists as jest.Mock).mockResolvedValue(ok(true));
      (repo.saveAudiencia as jest.Mock).mockResolvedValue(
        ok({ id: 1, ...validAudiencia })
      );

      // Act
      const result = await criarAudiencia(validAudiencia as unknown as CreateAudienciaInput);

      // Assert
      expect(result.success).toBe(true);
      expect(repo.saveAudiencia).toHaveBeenCalled();
    });

    it("deve falhar se processo nao existir", async () => {
      // Arrange
      (repo.processoExists as jest.Mock).mockResolvedValue(ok(false));
      (repo.tipoAudienciaExists as jest.Mock).mockResolvedValue(ok(true));

      // Act
      const result = await criarAudiencia(validAudiencia as unknown as CreateAudienciaInput);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("VALIDATION_ERROR");
      }
    });

    it("deve falhar de validacao Zod", async () => {
      // Arrange
      const invalid = { ...validAudiencia };
      // @ts-expect-error forcing invalid input
      delete invalid.processoId;

      (repo.processoExists as jest.Mock).mockResolvedValue(ok(true));

      // Act
      const result = await criarAudiencia(invalid as unknown as CreateAudienciaInput);

      // Assert
      expect(result.success).toBe(false);
      expect(repo.saveAudiencia).not.toHaveBeenCalled();
    });
  });

  describe("atualizarAudiencia", () => {
    const existingAudiencia = { id: 1, processoId: 1 };

    it("deve atualizar com sucesso", async () => {
      // Arrange
      const updateData = { dataInicio: "2023-01-02T10:00:00Z" };
      (repo.findAudienciaById as jest.Mock).mockResolvedValue(
        ok(existingAudiencia)
      );
      (repo.updateAudiencia as jest.Mock).mockResolvedValue(
        ok({ ...existingAudiencia, ...updateData })
      );

      // Act
      const result = await atualizarAudiencia(1, updateData as unknown as UpdateAudienciaInput);

      // Assert
      expect(result.success).toBe(true);
      expect(repo.updateAudiencia).toHaveBeenCalled();
    });

    it("deve falhar se audiencia nao existir", async () => {
      (repo.findAudienciaById as jest.Mock).mockResolvedValue(ok(null));
      const result = await atualizarAudiencia(99, {});
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.code).toBe("NOT_FOUND");
    });
  });

  describe("atualizarStatusAudiencia", () => {
    it("deve atualizar status com sucesso", async () => {
      (repo.findAudienciaById as jest.Mock).mockResolvedValue(ok({ id: 1 }));
      (repo.atualizarStatus as jest.Mock).mockResolvedValue(
        ok({ id: 1, status: StatusAudiencia.Finalizada })
      );

      const result = await atualizarStatusAudiencia(
        1,
        StatusAudiencia.Finalizada
      );

      expect(result.success).toBe(true);
      expect(repo.atualizarStatus).toHaveBeenCalledWith(
        1,
        StatusAudiencia.Finalizada,
        undefined
      );
    });
  });
});
