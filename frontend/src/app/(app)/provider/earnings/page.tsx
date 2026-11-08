'use client';

import { useCallback, useEffect, useState } from 'react';
import { App } from 'antd';
import apiClient from '@/lib/api';
import { ProviderDashboard, BalanceType } from '@/types';
import { formatBalance, formatPoint, formatTimeMinutes } from '@/lib/format';
import {
  LedgerHead,
  SectionBlock,
  Tally,
  EmptyState,
  TextAction,
  SkeletonLedger,
} from '@/components/ui';

function totalOf(data: ProviderDashboard, type: BalanceType) {
  return data.earnings.find((item) => item.type === type)?.total_amount ?? '0';
}

export default function ProviderEarningsPage() {
  const { message } = App.useApp();
  const [data, setData] = useState<ProviderDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setData(await apiClient.getProviderDashboard());
    } catch (e) {
      message.error(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [message]);

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

  if (!data) {
    return (
      <EmptyState
        title="这一页还空着。"
        hint="稍后再试，或刷新一次。"
        action={<TextAction onClick={load}>刷新</TextAction>}
      />
    );
  }

  return (
    <div className="pm-earnings">
      <LedgerHead
        variant="compact"
        items={[
          {
            label: '账上余额',
            value: formatBalance(BalanceType.MONEY, totalOf(data, BalanceType.MONEY)),
          },
          {
            label: '时间余额',
            value: formatTimeMinutes(totalOf(data, BalanceType.TIME)).replace(' 分钟', ''),
            unit: '分钟',
          },
          {
            label: '点数余额',
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
        title={`近 7 天局数 · ${data.weekly_play_counts.reduce((sum, item) => sum + item.count, 0)} 局`}
      >
        <Tally data={data.weekly_play_counts} />
      </SectionBlock>
    </div>
  );
}
