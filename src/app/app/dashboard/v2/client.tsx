'use client';

import { WidgetDashboard } from '../components/widget-dashboard';

interface DashboardClientProps {
  currentUserId: number;
  currentUserName: string;
}

export function DashboardClient({ currentUserId, currentUserName }: DashboardClientProps) {
  return (
    <WidgetDashboard
      currentUserId={currentUserId}
      currentUserName={currentUserName}
    />
  );
}
