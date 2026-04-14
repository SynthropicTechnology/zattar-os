'use client';

import { useEffect, useState } from 'react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { IconContainer } from '@/components/ui/icon-container';
import { AnimatedNumber } from '@/app/(authenticated)/dashboard/mock/widgets/primitives';
import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase, Calendar, FileText, FileCheck, ExternalLink } from 'lucide-react';
import { actionBuscarEstatisticasAtividades } from '../../actions/atividades-actions';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface AtividadesCardsProps {
  usuarioId: number;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  href?: string;
  color: string;
}

function StatCard({ title, value, icon, href, color }: StatCardProps) {
  const content = (
    <GlassPanel depth={2} className={cn('p-4 transition-all hover:shadow-md', href && 'cursor-pointer')}>
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <p className="text-sm font-medium">{title}</p>
        <IconContainer size="md" className={color}>
          {icon}
        </IconContainer>
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <AnimatedNumber value={value} className="text-2xl font-bold" />
          {href && <ExternalLink className="h-4 w-4 text-muted-foreground" />}
        </div>
        {href && (
          <div className="text-[10px] text-primary mt-1 cursor-pointer">Ver todos →</div>
        )}
      </div>
    </GlassPanel>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

export function AtividadesCards({ usuarioId }: AtividadesCardsProps) {
  const [stats, setStats] = useState({
    processos: 0,
    audiencias: 0,
    pendentes: 0,
    contratos: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setIsLoading(true);

      const result = await actionBuscarEstatisticasAtividades(usuarioId);

      if (result.success) {
        setStats(result.data);
      }

      setIsLoading(false);
    }

    loadStats();
  }, [usuarioId]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <GlassPanel key={i} depth={2} className="p-4">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <div>
              <Skeleton className="h-8 w-16" />
            </div>
          </GlassPanel>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Processos"
        value={stats.processos}
        icon={<Briefcase className="h-4 w-4 text-info" />}
        href={`/app/processos?responsavel=${usuarioId}`}
        color="bg-info/15"
      />
      <StatCard
        title="Audiências"
        value={stats.audiencias}
        icon={<Calendar className="h-4 w-4 text-primary" />}
        href={`/audiencias?responsavel=${usuarioId}`}
        color="bg-primary/15"
      />
      <StatCard
        title="Pendentes"
        value={stats.pendentes}
        icon={<FileText className="h-4 w-4 text-warning" />}
        href={`/app/expedientes/lista?responsavel=${usuarioId}`}
        color="bg-warning/15"
      />
      <StatCard
        title="Contratos"
        value={stats.contratos}
        icon={<FileCheck className="h-4 w-4 text-success" />}
        href={`/contratos?responsavel=${usuarioId}`}
        color="bg-success/15"
      />
    </div>
  );
}
