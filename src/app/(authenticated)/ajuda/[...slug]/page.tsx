'use client';

import { use, Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { resolveSlug } from '../docs-registry';

function DocLoading() {
  return (
    <div className="max-w-4xl space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function NotFound() {
  return (
    <div className="max-w-4xl space-y-4">
      <h1 className="text-page-title">Página não encontrada</h1>
      <p className="text-muted-foreground">
        O tópico de documentação que você procura não existe ou foi movido.
      </p>
      <Button variant="outline" asChild>
        <Link href="/ajuda">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para a Central de Ajuda
        </Link>
      </Button>
    </div>
  );
}

export default function DocPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = use(params);

  const entry = resolveSlug(slug);

  if (!entry || !entry.component) {
    return <NotFound />;
  }

  const Component = entry.component;

  return (
    <Suspense fallback={<DocLoading />}>
      <Component />
    </Suspense>
  );
}
