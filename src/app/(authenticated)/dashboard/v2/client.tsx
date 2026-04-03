'use client';

import { WidgetDashboard } from '../components/widget-dashboard';
import type { DashboardData } from '../domain';

interface DashboardClientProps {
  currentUserId: number;
  currentUserName: string;
  initialData?: DashboardData | null;
}

export function DashboardClient({ currentUserId, currentUserName, initialData }: DashboardClientProps) {
  return (
    <WidgetDashboard
      currentUserId={currentUserId}
      currentUserName={currentUserName}
      initialData={initialData}
    />
  );
}
