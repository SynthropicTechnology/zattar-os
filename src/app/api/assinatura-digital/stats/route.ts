import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/require-permission';
import { getDashboardStats } from '@/app/(authenticated)/assinatura-digital/feature/services/dashboard.service';

export async function GET(request: NextRequest) {
  const authOrError = await requirePermission(request, 'assinatura_digital', 'visualizar');
  if (authOrError instanceof NextResponse) {
    return authOrError;
  }

  try {
    const stats = await getDashboardStats();
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao carregar métricas';
    console.error('Erro em /assinatura-digital/stats:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}