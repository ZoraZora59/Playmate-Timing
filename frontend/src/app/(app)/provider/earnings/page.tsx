'use client';

import { useEffect, useState, useCallback } from 'react';
import { App, Spin } from 'antd';
import apiClient from '@/lib/api';
import { ProviderDashboard, BalanceType } from '@/types';
import { COLORS } from '@/lib/theme';
import { EmptyState } from '@/components/ui';
import { formatBalance, balanceMeta } from '@/lib/format';

// 收益类型 → 卡片标签
const EARN_LABEL: Record<string, string> = {
  [BalanceType.MONEY]: '金额收益',
  [BalanceType.TIME]: '时间消耗',
  [BalanceType.POINT]: '点数发放',
};

// 把日期字符串取「日」两位，作为柱状图 x 轴标签
function dayOf(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date.slice(-2);
  return String(d.getDate()).padStart(2, '0');
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

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  const earnings = data?.earnings ?? [];
  const weekly = data?.weekly_play_counts ?? [];
  const maxCount = weekly.reduce((m, w) => Math.max(m, w.count), 0);

  return (
    <div className="animate-pop">
      {/* 三张收益汇总卡 */}
      {earnings.length === 0 ? (
        <div style={{ marginBottom: 18 }}>
          <EmptyState title="暂无收益数据" hint="完成陪玩并产生流水后，这里会展示你的收益汇总" />
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(earnings.length, 3)}, 1fr)`,
            gap: 16,
            marginBottom: 18,
          }}
        >
          {earnings.map((a) => {
            const meta = balanceMeta(a.type);
            return (
              <div
                key={a.type}
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  background: COLORS.bgCard,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 16,
                  padding: '22px 24px',
                }}
              >
                <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 10 }}>
                  {EARN_LABEL[a.type] ?? meta.label}
                </div>
                <div
                  className="font-display"
                  style={{ fontWeight: 700, fontSize: 38, color: meta.color, lineHeight: 1.1 }}
                >
                  {formatBalance(a.type, a.total_amount)}
                </div>
                <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 6 }}>
                  本月 · {a.player_count} 位玩家
                </div>
                <div
                  style={{
                    position: 'absolute',
                    right: -20,
                    bottom: -20,
                    width: 90,
                    height: 90,
                    borderRadius: '50%',
                    background: meta.color,
                    opacity: 0.08,
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* 近 7 天 · 陪玩局数 柱状图 */}
      <div
        style={{
          background: COLORS.bgCard,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 16,
          padding: '22px 24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.textPrimary }}>
              近 7 天 · 陪玩局数
            </div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
              单位 局 · 反映接单局数趋势
            </div>
          </div>
        </div>

        {weekly.length === 0 ? (
          <EmptyState title="暂无局数记录" hint="近 7 天还没有陪玩局数" />
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 180 }}>
            {weekly.map((w) => {
              const pct = maxCount > 0 ? (w.count / maxCount) * 100 : 0;
              return (
                <div
                  key={w.date}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 9,
                    height: '100%',
                    justifyContent: 'flex-end',
                  }}
                >
                  <span
                    className="font-display"
                    style={{ fontSize: 12, color: COLORS.money, fontWeight: 600 }}
                  >
                    {w.count}
                  </span>
                  <div
                    style={{
                      width: '100%',
                      borderRadius: '7px 7px 0 0',
                      background: 'linear-gradient(180deg,#1FB573,#34D38C)',
                      height: `${pct}%`,
                      minHeight: w.count > 0 ? 4 : 0,
                    }}
                  />
                  <span style={{ fontSize: 11, color: COLORS.textMuted }}>{dayOf(w.date)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
