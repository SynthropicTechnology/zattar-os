/**
 * ASSINATURA DIGITAL - Teste E2E do Fluxo de Documentos
 *
 * Testa o fluxo completo de criação de documento com upload de PDF,
 * seleção de assinantes, definição de âncoras e geração de links públicos.
 */

import { test, expect } from "@playwright/test";

test.describe("Assinatura Digital - Fluxo de Documentos", () => {
  test.beforeEach(async ({ page }) => {
    // Mock de autenticação
    await page.route("**/api/auth/session", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            id: 1,
            nome: "Usuário Teste",
            email: "teste@zattar.adv.br",
            cargo: "Advogado",
          },
          session: {
            access_token: "mock-token",
            expires_at: Date.now() + 3600000,
          },
        }),
      })
    );
  });

  test("deve criar documento completo com assinantes e âncoras", async ({
    page,
  }) => {
    // Helper para upload (definido localmente pois não temos certeza dos imports)
    const mockFileUpload = async (
      page: any,
      fileName: string,
      mimeType: string,
      contentBase64: string
    ) => {
      await page.evaluate(
        ({ fileName, mimeType, contentBase64 }) => {
          const input = document.querySelector('input[type="file"]');
          if (!input) return;

          const bstr = atob(contentBase64);
          const n = bstr.length;
          const u8arr = new Uint8Array(n);
          for (let i = 0; i < n; i++) {
            u8arr[i] = bstr.charCodeAt(i);
          }
          const blob = new Blob([u8arr], { type: mimeType });
          const file = new File([blob], fileName, { type: mimeType });

          const dt = new DataTransfer();
          dt.items.add(file);
          (input as HTMLInputElement).files = dt.files;
          input.dispatchEvent(new Event("change", { bubbles: true }));
        },
        { fileName, mimeType, contentBase64 }
      );
    };

    // Mock APIs
    await page.route("**/api/assinatura-digital/documentos", async (route) => {
      if (route.request().method() === "POST") {
        const body = await route.request().postDataJSON();
        return route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: {
              documento: {
                id: 1,
                documento_uuid: "doc-123-456-789",
                titulo: body.titulo,
                status: "rascunho",
                selfie_habilitada: body.selfie_habilitada,
                pdf_original_url: body.pdf_original_url,
              },
              assinantes: body.assinantes.map((a: any, idx: number) => ({
                id: idx + 1,
                documento_id: 1,
                assinante_tipo: a.assinante_tipo,
                assinante_entidade_id: a.assinante_entidade_id,
                dados_snapshot: a.dados_snapshot || {},
                dados_confirmados: false,
                token: `token-${idx + 1}`,
                status: "pendente",
                public_link: `/assinatura/token-${idx + 1}`,
              })),
            },
          }),
        });
      }
      return route.continue();
    });

    await page.route(
      "**/api/assinatura-digital/assinantes/search**",
      (route) => {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: [
              {
                tipo: "cliente",
                id: 1,
                nome: "João da Silva",
                cpf: "12345678901",
                email: "joao@example.com",
                telefone: "11987654321",
              },
              {
                tipo: "parte_contraria",
                id: 2,
                nome: "Empresa XYZ Ltda",
                cnpj: "12345678000190",
                email: "contato@xyz.com.br",
              },
            ],
          }),
        });
      }
    );

    // Navegação para a página
    await page.goto("/assinatura-digital/documentos");
    await page.waitForLoadState("networkidle");

    // Verificar presença da página
    await expect(page.getByText(/enviar pdf para assinatura/i)).toBeVisible();

    // Step 1: Upload de PDF e configuração (NOVO FLUXO)
    // Abre o modal de novo documento
    const newDocBtn = page.getByRole("button", { name: /novo documento/i });
    await newDocBtn.click();
    await expect(page.getByTestId("workflow-stepper")).toBeVisible();

    // Simular upload de PDF via input
    const pdfBase64 =
      "data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1szIDAgUl0+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvTWVkaWFCb3hbMCAwIDMgM10+PgplbmRvYmoKeHJlZgowIDQKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTIgMDAwMDAgbiAKMDAwMDAwMDEwOSAwMDAwMCBuIAp0cmFpbGVyCjw8L1NpemUgNC9Sb290IDEgMCBSPj4Kc3RhcnR4cmVmCjE0OAolJUVPRgo=";

    // Remove data:application/pdf;base64, prefix for our helper
    const base64Content = pdfBase64.split(",")[1];
    await mockFileUpload(
      page,
      "contrato.pdf",
      "application/pdf",
      base64Content
    );

    // Aguarda o upload e clica em continuar
    await page.getByRole("button", { name: /continuar/i }).click();
    await expect(page.getByText("Documento enviado com sucesso")).toBeVisible();

    // Aguardar transição para Configuração
    await expect(page.getByText(/configurar/i)).toBeVisible();
    // Wait for canvas or sidebar
    await expect(page.getByText(/assinantes/i)).toBeVisible();

    // Habilitar selfie (se houver toggle no config sidebar)
    // await page.getByLabel(/exigir selfie/i).check();

    // Step 2: Adicionar assinantes (Agora via Floating Sidebar)
    await page.getByRole("button", { name: /adicionar/i }).click(); // Botão + na sidebar

    // Preencher modal de assinante
    // Assuming a modal opens with fields
    await page.getByLabel(/nome/i).fill("João da Silva");
    await page.getByLabel(/email/i).fill("joao@example.com");
    // Select type if needed
    // await page.getByRole('combobox').click();
    // await page.getByText('Cliente').click();

    await page.getByRole("button", { name: /salvar|adicionar/i }).click();

    // Verificar na sidebar
    await expect(page.getByText("João da Silva")).toBeVisible();

    // Step 3: Definir âncoras (simulado - editor visual)
    // Mock do salvamento de âncoras
    await page.route(
      "**/api/assinatura-digital/documentos/*/ancoras",
      (route) => {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            message: "Âncoras salvas com sucesso",
          }),
        });
      }
    );

    // Simular clique em Salvar/Próximo no header
    await page.getByRole("button", { name: /próximo|review/i }).click();
    await page.waitForTimeout(500);

    // Avançar para links (Step Review)
    // Se houver modal de confirmação ou step review
    await expect(page.getByText(/revisão/i)).toBeVisible();
    await page.getByRole("button", { name: /enviar|gerar links/i }).click();

    // Step 4: Validar links públicos gerados
    await expect(page.getByText(/links/i)).toBeVisible();
    // await expect(page.getByText(/documento criado/i)).toBeVisible();
  });

  test("deve listar documentos existentes", async ({ page }) => {
    // Mock lista de documentos
    await page.route("**/api/assinatura-digital/documentos**", (route) => {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            documentos: [
              {
                id: 1,
                documento_uuid: "doc-123",
                titulo: "Contrato A",
                status: "pronto",
                selfie_habilitada: true,
                assinantes_total: 2,
                assinantes_concluidos: 0,
                created_at: new Date().toISOString(),
              },
              {
                id: 2,
                documento_uuid: "doc-456",
                titulo: "Contrato B",
                status: "concluido",
                selfie_habilitada: false,
                assinantes_total: 1,
                assinantes_concluidos: 1,
                created_at: new Date().toISOString(),
              },
            ],
            total: 2,
            page: 1,
            pageSize: 20,
          },
        }),
      });
    });

    await page.goto("/assinatura-digital/documentos");
    await page.waitForLoadState("networkidle");

    // Validar listagem
    await expect(page.getByText("Contrato A")).toBeVisible();
    await expect(page.getByText("Contrato B")).toBeVisible();

    // Validar status
    await expect(page.getByText(/pronto/i)).toBeVisible();
    await expect(page.getByText(/concluído/i)).toBeVisible();

    // Validar contadores
    await expect(page.getByText(/0.*2/)).toBeVisible(); // 0 de 2 assinantes
    await expect(page.getByText(/1.*1/)).toBeVisible(); // 1 de 1 assinantes
  });

  test("deve validar formulário de criação", async ({ page }) => {
    await page.goto("/assinatura-digital/documentos");
    await page.waitForLoadState("networkidle");

    // Tentar avançar sem preencher
    await page.getByRole("button", { name: /próximo|continuar/i }).click();

    // Validar mensagens de erro
    await expect(page.getByText(/título é obrigatório/i)).toBeVisible();
    await expect(page.getByText(/selecione um arquivo pdf/i)).toBeVisible();
    await expect(
      page.getByText(/adicione pelo menos um assinante/i)
    ).toBeVisible();
  });
});

test.describe("Assinatura Digital - Fluxo Público (Assinante)", () => {
  test("deve permitir assinante preencher dados e assinar", async ({
    page,
  }) => {
    const token = "mock-token-123";

    // Mock do endpoint público
    await page.route(`**/api/assinatura-digital/public/${token}`, (route) => {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            documento: {
              id: 1,
              documento_uuid: "doc-123",
              titulo: "Contrato de Prestação de Serviços",
              selfie_habilitada: true,
            },
            assinante: {
              id: 1,
              assinante_tipo: "cliente",
              dados_snapshot: {
                nome_completo: "João da Silva",
                cpf: "12345678901",
                email: "joao@example.com",
                telefone: "",
              },
              dados_confirmados: false,
              status: "pendente",
            },
            ancoras: [
              {
                id: 1,
                tipo: "assinatura",
                pagina: 1,
                x_norm: 0.1,
                y_norm: 0.8,
                w_norm: 0.3,
                h_norm: 0.1,
              },
              {
                id: 2,
                tipo: "rubrica",
                pagina: 1,
                x_norm: 0.1,
                y_norm: 0.5,
                w_norm: 0.15,
                h_norm: 0.05,
              },
            ],
          },
        }),
      });
    });

    // Navegar para link público
    await page.goto(`/assinatura/${token}`);
    await page.waitForLoadState("networkidle");

    // Validar título
    await expect(
      page.getByText("Contrato de Prestação de Serviços")
    ).toBeVisible();

    // Step 1: Confirmação de dados
    await expect(page.getByText(/confirme seus dados/i)).toBeVisible();

    // Dados pré-preenchidos
    await expect(page.getByLabel(/nome completo/i)).toHaveValue(
      "João da Silva"
    );
    await expect(page.getByLabel(/cpf/i)).toHaveValue("123.456.789-01");

    // Preencher dados faltantes
    await page.getByLabel(/telefone/i).fill("11987654321");

    // Confirmar dados
    await page.getByRole("button", { name: /confirmar dados/i }).click();
    await page.waitForTimeout(500);

    // Step 2: Captura de selfie (se habilitada)
    await expect(page.getByText(/tire uma selfie/i)).toBeVisible();

    // Simular captura
    const selfieBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";
    await page.evaluate((dataUrl) => {
      const canvas = document.querySelector("canvas") as HTMLCanvasElement;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const img = new Image();
          img.onload = () => ctx.drawImage(img, 0, 0);
          img.src = dataUrl;
        }
      }
    }, selfieBase64);

    await page.getByRole("button", { name: /capturar selfie/i }).click();
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: /usar foto/i }).click();

    // Step 3: Assinatura
    await expect(page.getByText(/desenhe sua assinatura/i)).toBeVisible();

    // Simular desenho de assinatura
    const signatureCanvas = page.locator(
      'canvas[data-testid="signature-canvas"]'
    );
    await signatureCanvas.click({ position: { x: 50, y: 50 } });
    await signatureCanvas.dragTo(signatureCanvas, {
      sourcePosition: { x: 50, y: 50 },
      targetPosition: { x: 150, y: 50 },
    });

    await page.getByRole("button", { name: /próximo|continuar/i }).click();

    // Step 4: Rubrica (se necessária)
    await expect(page.getByText(/desenhe sua rubrica/i)).toBeVisible();

    const rubricaCanvas = page.locator('canvas[data-testid="rubrica-canvas"]');
    await rubricaCanvas.click({ position: { x: 30, y: 30 } });

    await page.getByRole("button", { name: /próximo|continuar/i }).click();

    // Step 5: Termos de aceite
    await page.getByRole("checkbox", { name: /aceito os termos/i }).check();

    // Mock finalização
    await page.route(
      `**/api/assinatura-digital/public/${token}/finalizar`,
      (route) => {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: {
              pdf_final_url: "https://storage.example.com/doc-123-final.pdf",
            },
            message: "Assinatura concluída com sucesso",
          }),
        });
      }
    );

    // Finalizar
    await page.getByRole("button", { name: /finalizar assinatura/i }).click();
    await page.waitForTimeout(500);

    // Validar sucesso
    await expect(
      page.getByText(/assinatura concluída com sucesso/i)
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /baixar documento/i })
    ).toBeVisible();
  });

  test("deve bloquear reuso de link já utilizado", async ({ page }) => {
    const token = "token-usado";

    await page.route(`**/api/assinatura-digital/public/${token}`, (route) => {
      return route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: "Este link já foi utilizado e não pode ser reutilizado",
        }),
      });
    });

    await page.goto(`/assinatura/${token}`);
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(/link já foi utilizado/i)).toBeVisible();
    await expect(page.getByText(/não pode ser reutilizado/i)).toBeVisible();
  });
});
