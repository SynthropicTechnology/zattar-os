import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/require-permission';
import { getFormulario, updateFormulario } from '@/app/(authenticated)/assinatura-digital/feature/services/formularios.service';
import { validateFormSchema } from '@/app/(authenticated)/assinatura-digital/feature/utils';
import type { DynamicFormSchema } from '@/app/(authenticated)/assinatura-digital/feature/types';

/**
 * GET /api/assinatura-digital/formularios/[id]/schema - Obter schema do formulário
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission(request, 'assinatura_digital', 'listar');
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do formulário é obrigatório' },
        { status: 400 },
      );
    }

    const formulario = await getFormulario(id);

    if (!formulario) {
      return NextResponse.json(
        { success: false, error: 'Formulário não encontrado' },
        { status: 404 },
      );
    }

    const formSchema = formulario.form_schema;

    if (!formSchema) {
      return NextResponse.json(
        { success: false, error: 'Schema não configurado para este formulário' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: formSchema,
    });
  } catch (error) {
    console.error('[API][FORMULARIOS][SCHEMA] Failed to get form schema', { error });
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/assinatura-digital/formularios/[id]/schema - Atualizar schema do formulário
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission(request, 'assinatura_digital', 'editar');
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do formulário é obrigatório' },
        { status: 400 },
      );
    }

    const formSchema: DynamicFormSchema = await request.json();

    // Validar schema
    const schemaValidation = validateFormSchema(formSchema);
    if (!schemaValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Schema inválido',
          errors: schemaValidation.errors,
          warnings: schemaValidation.warnings,
        },
        { status: 400 },
      );
    }

    // Buscar formulário atual para pegar a versão
    const currentFormulario = await getFormulario(id);

    if (!currentFormulario) {
      return NextResponse.json(
        { success: false, error: 'Formulário não encontrado' },
        { status: 404 },
      );
    }

    // Incrementar schema_version
    const currentVersion = currentFormulario.schema_version || '1.0.0';
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    const newVersion = `${major}.${minor + 1}.${patch}`;

    // Atualizar formulário com novo schema
    const updatedFormulario = await updateFormulario(id, {
      form_schema: formSchema,
      schema_version: newVersion,
    });

    return NextResponse.json({
      success: true,
      data: updatedFormulario,
      message: 'Schema atualizado com sucesso',
    });
  } catch (error) {
    console.error('[API][FORMULARIOS][SCHEMA] Failed to update form schema', { error });
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}