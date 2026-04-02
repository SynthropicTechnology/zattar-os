
import { FolhaDetalhes } from '@/app/app/rh';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function FolhaDetalhesPage({ params }: PageProps) {
  const { id } = await params;
  return <FolhaDetalhes folhaId={Number(id)} />;
}
