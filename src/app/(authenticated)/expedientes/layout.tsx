import { PageShell } from '@/components/shared';

export default function ExpedientesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <PageShell>{children}</PageShell>;
}
