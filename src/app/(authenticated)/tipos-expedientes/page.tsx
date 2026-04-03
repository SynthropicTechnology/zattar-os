import { Suspense } from 'react';
import { PageShell } from '@/components/shared/page-shell';
import { TiposExpedientesList, listar } from '@/app/(authenticated)/tipos-expedientes';

export const dynamic = 'force-dynamic';

export default async function TiposExpedientesPage() {
    // Fetch inicial data (optional, but good for SEO/SSR)
    const initialData = await listar({ pagina: 1, limite: 50 });

    return (
        <PageShell title="Tipos de Expedientes">
            <Suspense fallback={<div>Carregando...</div>}>
                <TiposExpedientesList initialData={initialData} />
            </Suspense>
        </PageShell>
    );
}
