'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card className={cn('transition-all hover:shadow-md', href && 'cursor-pointer')}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={cn('p-2 rounded-lg', color)}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-bold">{value}</div>
          {href && <ExternalLink className="h-4 w-4 text-muted-foreground" />}
        </div>
      </CardContent>
    </Card>
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
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Processos"
        value={stats.processos}
        icon={<Briefcase className="h-4 w-4 text-sky-700 dark:text-sky-400" />}
        href={`/app/processos?responsavel=${usuarioId}`}
        color="bg-sky-500/15"
      />
      <StatCard
        title="Audiências"
        value={stats.audiencias}
        icon={<Calendar className="h-4 w-4 text-violet-700 dark:text-violet-400" />}
        href={`/audiencias?responsavel=${usuarioId}`}
        color="bg-violet-500/15"
      />
      <StatCard
        title="Pendentes"
        value={stats.pendentes}
        icon={<FileText className="h-4 w-4 text-orange-700 dark:text-orange-400" />}
        href={`/app/expedientes/lista?responsavel=${usuarioId}`}
        color="bg-orange-500/15"
      />
      <StatCard
        title="Contratos"
        value={stats.contratos}
        icon={<FileCheck className="h-4 w-4 text-green-700 dark:text-green-400" />}
        href={`/contratos?responsavel=${usuarioId}`}
        color="bg-green-500/15"
      />
    </div>
  );
}
