import { lerPacotePorToken } from '@/shared/assinatura-digital/services/pacote.service';
import { notFound } from 'next/navigation';
import { AssinaturaPacoteClient } from './page-client';

export const runtime = 'nodejs';

export default async function AssinaturaPacotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!token || token.length !== 64) {
    notFound();
  }

  const pacote = await lerPacotePorToken(token);
  if (!pacote) notFound();

  return <AssinaturaPacoteClient pacote={pacote} />;
}
