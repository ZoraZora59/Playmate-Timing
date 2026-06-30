'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { App, Spin } from 'antd';
import apiClient from '@/lib/api';
import { Balance } from '@/types';
import { COLORS } from '@/lib/theme';
import { Avatar, InfoBanner, EmptyState } from '@/components/ui';
import { formatBalance, balanceMeta } from '@/lib/format';

// 按 provider_id 分组后的结构
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

  if (loading) return <div style={{ padding: 60, textAlign: 'center' }}><Spin size="large" /></div>;

  const list = groups || [];

  return (
    <div className="animate-pop">
      <div style={{ marginBottom: 16 }}>
        <InfoBanner tone="info">
          余额按「服务者」分别记账 —— 你在每位服务者处都有独立的账户，互不通用。
        </InfoBanner>
      </div>

      {list.length === 0 ? (
        <div className="pm-card">
          <EmptyState title="还没有任何余额账户" hint="向服务者充值后，账户会显示在这里" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {list.map((g) => (
            <div
              key={g.providerId}
              style={{
                background: COLORS.bgCard,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 16,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 13,
                  padding: '18px 22px',
                  borderBottom: `1px solid ${COLORS.divider}`,
                }}
              >
                <Avatar name={g.name} seed={g.providerId} size={46} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{g.name}</div>
                  <div style={{ fontSize: 12.5, color: COLORS.textMuted }}>
                    {g.balances.length} 个余额账户
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/player/transactions?balance=${g.balances[0].id}`)}
                  style={{
                    border: `1px solid ${COLORS.border}`,
                    background: COLORS.bgCard,
                    borderRadius: 10,
                    padding: '8px 14px',
                    font: "600 12.5px 'Noto Sans SC',sans-serif",
                    color: COLORS.primary,
                    cursor: 'pointer',
                  }}
                >
                  查看流水
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, padding: '18px 22px' }}>
                {g.balances.map((b) => {
                  const meta = balanceMeta(b.type);
                  return (
                    <div
                      key={b.id}
                      style={{
                        flex: 1,
                        minWidth: 160,
                        border: `1px solid ${COLORS.divider}`,
                        borderRadius: 13,
                        padding: '15px 17px',
                        background: COLORS.bgSubtle,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 3, background: meta.color }} />
                        <span style={{ fontSize: 12.5, color: COLORS.textSecondary }}>{meta.label}余额</span>
                      </div>
                      <div className="font-display" style={{ fontWeight: 700, fontSize: 26, color: meta.color }}>
                        {formatBalance(b.type, b.amount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
