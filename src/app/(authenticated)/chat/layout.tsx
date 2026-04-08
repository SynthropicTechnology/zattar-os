import { PageShell } from '@/components/shared/page-shell';

export default function ChatModuleLayout({ children }: { children: React.ReactNode }) {
    return <PageShell>{children}</PageShell>;
}
