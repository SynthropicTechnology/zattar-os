import { PageShell } from '@/components/shared/page-shell';

export default function CapturaLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <PageShell>{children}</PageShell>;
}
