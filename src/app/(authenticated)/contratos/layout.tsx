import { PageShell } from '@/components/shared/page-shell';

export default function ContratosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageShell>{children}</PageShell>;
}
