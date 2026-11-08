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

function countOf(data: ProviderDashboard, type: BalanceType) {
  return data.earnings.find((item) => item.type === type)?.player_count ?? 0;
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
    <div>
      <LedgerHead
        variant="compact"
        items={[
          {
            label: '账上余额',
            value: formatBalance(BalanceType.MONEY, totalOf(data, BalanceType.MONEY)),
            sub: `${countOf(data, BalanceType.MONEY)} 位玩家有金额余额`,
          },
          {
            label: '时间余额',
            value: formatTimeMinutes(totalOf(data, BalanceType.TIME)).replace(' 分钟', ''),
            unit: '分钟',
            sub: `${countOf(data, BalanceType.TIME)} 位玩家有时间余额`,
          },
          {
            label: '点数余额',
            value: formatPoint(totalOf(data, BalanceType.POINT)).replace(' 点', ''),
            unit: '点',
            sub: `${countOf(data, BalanceType.POINT)} 位玩家有点数余额`,
          },
          {
            label: '玩家数',
            value: data.player_count,
            unit: '位',
            sub: '有余额往来',
          },
        ]}
      />

      <SectionBlock title="近 7 天局数">
        <Tally data={data.weekly_play_counts} />
        <div style={{ marginTop: 12, fontSize: 12, lineHeight: 1.7, color: 'var(--ink-muted)' }}>
          近 7 天共 {data.weekly_play_counts.reduce((sum, item) => sum + item.count, 0)} 局。
        </div>
      </SectionBlock>

      <SectionBlock title="批注">
        <div
          style={{
            borderLeft: '1px solid var(--rule)',
            paddingLeft: 12,
            fontSize: 12.5,
            lineHeight: 1.7,
            color: 'var(--ink-secondary)',
          }}
        >
          这里统计的是玩家存在你这里的账上余额，不是平台结算收益。余额按服务者分账户，跨服务者不相加。
        </div>
      </SectionBlock>
    </div>
  );
}
