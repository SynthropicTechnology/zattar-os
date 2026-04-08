import { PageShell } from '@/components/shared';

export default function ProcessosLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <PageShell>{children}</PageShell>;
}
