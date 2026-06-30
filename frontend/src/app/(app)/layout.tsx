'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Spin } from 'antd';
import { useAuthStore } from '@/store/auth';
import AppShell from '@/components/AppShell';
import { COLORS } from '@/lib/theme';

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loadProfile } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.replace('/auth/login');
      return;
    }
    loadProfile().finally(() => setReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLORS.bgPage }}>
        <Spin size="large" />
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
