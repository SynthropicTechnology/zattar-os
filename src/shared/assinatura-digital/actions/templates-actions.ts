"use server";

/**
 * TEMPLATES ACTIONS - Server Actions para Templates de Assinatura
 */

import { revalidatePath } from "next/cache";
import { authenticatedAction } from "@/lib/safe-action";
import { z } from "zod";
import {
  createTemplateSchema,
  updateTemplateSchema,
  listTemplatesSchema,
} from "../domain";
import * as templatesService from "../services/templates.service";

// =============================================================================
// SCHEMAS
// =============================================================================

const templateIdSchema = z.object({
  id: z.number().int().positive("ID deve ser um número positivo"),
});

const templateUuidSchema = z.object({
  uuid: z.string().uuid("UUID inválido"),
});

// =============================================================================
// ACTIONS
// =============================================================================

export const actionCreateTemplate = authenticatedAction(
  createTemplateSchema,
  async (input) => {
    try {
      const template = await templatesService.createTemplate(input);

      revalidatePath("/app/assinatura-digital/templates");

      return {
        success: true,
        data: template,
        message: "Template criado com sucesso",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Erro ao criar template",
      };
    }
  }
);

export const actionUpdateTemplate = authenticatedAction(
  z.object({
    id: z.number().int().positive(),
    data: updateTemplateSchema,
  }),
  async (input) => {
    try {
      const template = await templatesService.updateTemplate(
        String(input.id),
        input.data
      );

      revalidatePath("/app/assinatura-digital/templates");
      revalidatePath(`/app/assinatura-digital/templates/${input.id}`);

      return {
        success: true,
        data: template,
        message: "Template atualizado com sucesso",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro ao atualizar template",
      };
    }
  }
);

export const actionDeleteTemplate = authenticatedAction(
  templateIdSchema,
  async (input) => {
    try {
      await templatesService.deleteTemplate(String(input.id));

      revalidatePath("/app/assinatura-digital/templates");

      return {
        success: true,
        message: "Template deletado com sucesso",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Erro ao deletar template",
      };
    }
  }
);

export const actionListTemplates = authenticatedAction(
  listTemplatesSchema,
  async (input) => {
    try {
      const resultado = await templatesService.listTemplates(input);

      return {
        success: true,
        data: resultado,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Erro ao listar templates",
      };
    }
  }
);

export const actionGetTemplateById = authenticatedAction(
  templateIdSchema,
  async (input) => {
    try {
      const template = await templatesService.getTemplate(String(input.id));

      if (!template) {
        return {
          success: false,
          error: "Template não encontrado",
        };
      }

      return {
        success: true,
        data: template,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Erro ao buscar template",
      };
    }
  }
);

export const actionGetTemplateByUuid = authenticatedAction(
  templateUuidSchema,
  async (input) => {
    try {
      const template = await templatesService.getTemplate(input.uuid);

      if (!template) {
        return {
          success: false,
          error: "Template não encontrado",
        };
      }

      return {
        success: true,
        data: template,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Erro ao buscar template",
      };
    }
  }
);
