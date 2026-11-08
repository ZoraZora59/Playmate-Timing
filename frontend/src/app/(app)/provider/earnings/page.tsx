'use client';

import { useCallback, useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import { ProviderDashboard, BalanceType } from '@/types';
import { formatBalance, formatPoint, formatTimeMinutes } from '@/lib/format';
import {
  LedgerHead,
  SectionBlock,
  Tally,
  EmptyState,
  TextAction,
  LoadError,
  SkeletonLedger,
} from '@/components/ui';

function totalOf(data: ProviderDashboard, type: BalanceType) {
  return data.earnings.find((item) => item.type === type)?.total_amount ?? '0';
}

export default function ProviderEarningsPage() {
  const [data, setData] = useState<ProviderDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await apiClient.getProviderDashboard());
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      load();
    };
    window.addEventListener('pm:refresh', handler);
    return () => window.removeEventListener('pm:refresh', handler);
  }, [load]);

  if (loading) {
    return <SkeletonLedger rows={3} />;
  }

  if (error) {
    return <LoadError onRetry={() => { setLoading(true); load(); }} />;
  }

  if (!data) {
    return <EmptyState title="暂无数据" action={<TextAction onClick={load}>重新加载</TextAction>} />;
  }

  return (
    <div className="pm-earnings">
      <LedgerHead
        variant="compact"
        items={[
          {
            label: '玩家余额',
            value: formatBalance(BalanceType.MONEY, totalOf(data, BalanceType.MONEY)),
          },
          {
            label: '玩家时长',
            value: formatTimeMinutes(totalOf(data, BalanceType.TIME)).replace(' 分钟', ''),
            unit: '分钟',
          },
          {
            label: '玩家点数',
            value: formatPoint(totalOf(data, BalanceType.POINT)).replace(' 点', ''),
            unit: '点',
          },
          {
            label: '玩家数',
            value: data.player_count,
            unit: '位',
          },
        ]}
      />

      <SectionBlock
        title={`近 7 天 ${data.weekly_play_counts.reduce((sum, item) => sum + item.count, 0)} 局`}
      >
        <Tally data={data.weekly_play_counts} />
      </SectionBlock>
    </div>
  );
}
