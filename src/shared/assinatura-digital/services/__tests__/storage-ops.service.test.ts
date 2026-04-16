import { extractStorageLocationFromUrl } from "../signature/storage-ops.service";

describe("storage-ops.service", () => {
  describe("extractStorageLocationFromUrl", () => {
    it("extrai bucket e key de URL Backblaze no formato /file/bucket/key", () => {
      const result = extractStorageLocationFromUrl(
        "https://f005.backblazeb2.com/file/documentos-privados/assinaturas/contrato.pdf"
      );

      expect(result).toEqual({
        bucket: "documentos-privados",
        key: "assinaturas/contrato.pdf",
        urlFormat: "backblaze-file",
      });
    });

    it("extrai bucket e key de URL virtual-hosted", () => {
      const result = extractStorageLocationFromUrl(
        "https://documentos-privados.s3.us-west-001.backblazeb2.com/assinaturas/contrato.pdf"
      );

      expect(result).toEqual({
        bucket: "documentos-privados",
        key: "assinaturas/contrato.pdf",
        urlFormat: "virtual-hosted",
      });
    });

    it("extrai bucket e key de URL path-style", () => {
      const result = extractStorageLocationFromUrl(
        "https://s3.us-west-001.backblazeb2.com/documentos-privados/assinaturas/contrato.pdf"
      );

      expect(result).toEqual({
        bucket: "documentos-privados",
        key: "assinaturas/contrato.pdf",
        urlFormat: "path-style",
      });
    });

    it("lança erro para URL sem bucket e key", () => {
      expect(() => extractStorageLocationFromUrl("https://f005.backblazeb2.com/file/documentos-privados")).toThrow(
        "URL de storage inválida"
      );
    });
  });
});