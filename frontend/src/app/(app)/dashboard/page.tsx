'use client';

import { useAuthStore } from '@/store/auth';
import { UserRole } from '@/types';
import PlayerDashboardView from '@/components/dashboards/PlayerDashboardView';
import ProviderDashboardView from '@/components/dashboards/ProviderDashboardView';
import StudioDashboardView from '@/components/dashboards/StudioDashboardView';

export default function DashboardPage() {
  const { user } = useAuthStore();
  if (!user) return null;
  if (user.role === UserRole.PROVIDER) return <ProviderDashboardView />;
  if (user.role === UserRole.STUDIO) return <StudioDashboardView />;
  return <PlayerDashboardView />;
}
