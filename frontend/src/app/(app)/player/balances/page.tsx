'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Spin } from 'antd';
import apiClient from '@/lib/api';
import { Balance, BalanceType } from '@/types';
import { Avatar, EmptyState, LoadError, TextAction } from '@/components/ui';
import { formatBalance } from '@/lib/format';

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
  const router = useRouter();
  const [groups, setGroups] = useState<ProviderGroup[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.getPlayerBalances({ page_size: 100 });
      setGroups(groupByProvider(res.list));
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

  if (loading)
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );

  if (error) {
    return (
      <div className="animate-pop">
        <LoadError onRetry={() => { setLoading(true); load(); }} />
      </div>
    );
  }

  const list = groups || [];

  if (list.length === 0) {
    return (
      <div className="animate-pop">
        <EmptyState title="还没有余额账户" hint="服务者充值后会显示在这里。" />
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
                <div className="pm-account-label">
                  {b.type === BalanceType.TIME ? '时长' : b.type === BalanceType.POINT ? '点数' : '金额'}
                </div>
                <div className="pm-account-value num">{formatBalance(b.type, b.amount)}</div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
