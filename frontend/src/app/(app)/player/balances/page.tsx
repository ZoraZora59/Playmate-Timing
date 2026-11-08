'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { App, Spin } from 'antd';
import apiClient from '@/lib/api';
import { Balance } from '@/types';
import { Avatar, EmptyState, TextAction } from '@/components/ui';
import { formatBalance, balanceMeta } from '@/lib/format';

interface ProviderGroup {
  providerId: number;
  name: string;
  balances: Balance[];
}

function groupByProvider(list: Balance[]): ProviderGroup[] {
  const map = new Map<number, ProviderGroup>();
  for (const b of list) {
    let g = map.get(b.provider_id);
    if (!g) {
      g = {
        providerId: b.provider_id,
        name: b.provider?.nickname || b.provider?.username || `服务者 #${b.provider_id}`,
        balances: [],
      };
      map.set(b.provider_id, g);
    }
    g.balances.push(b);
  }
  return Array.from(map.values());
}

export default function PlayerBalancesPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const [groups, setGroups] = useState<ProviderGroup[] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.getPlayerBalances({ page_size: 100 });
      setGroups(groupByProvider(res.list));
    } catch (e) {
      message.error(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading)
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );

  const list = groups || [];

  if (list.length === 0) {
    return (
      <div className="animate-pop">
        <EmptyState title="还没有余额账户" />
      </div>
    );
  }

  return (
    <div className="animate-pop">
      {list.map((g) => (
        <section key={g.providerId} className="pm-account">
          <div className="pm-account-head">
            <div className="pm-account-name">
              <Avatar name={g.name} size={28} />
              {g.name}
            </div>
            <TextAction onClick={() => router.push(`/player/transactions?balance=${g.balances[0].id}`)}>
              查看流水
            </TextAction>
          </div>
          <div className="pm-account-balances">
            {g.balances.map((b) => (
              <div key={b.id} className="pm-account-balance">
                <div className="pm-account-label">{balanceMeta(b.type).label}余额</div>
                <div className="pm-account-value num">{formatBalance(b.type, b.amount)}</div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
