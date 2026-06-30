'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { App, Spin } from 'antd';
import apiClient from '@/lib/api';
import { ProviderDashboard, BalanceType } from '@/types';
import { COLORS } from '@/lib/theme';
import { formatBalance, formatMoney, fromNow, hueFor, initialOf } from '@/lib/format';
import { StatCard, SectionCard, EmptyState } from '@/components/ui';

// 收益类型 → 标签
const EARN_LABEL: Record<string, string> = {
  [BalanceType.MONEY]: '金额收益',
  [BalanceType.TIME]: '时间消耗',
  [BalanceType.POINT]: '点数发放',
};

const EARN_COLOR: Record<string, string> = {
  [BalanceType.MONEY]: COLORS.money,
  [BalanceType.TIME]: COLORS.time,
  [BalanceType.POINT]: COLORS.point,
};

export default function ProviderDashboardView() {
  const router = useRouter();
  const { message } = App.useApp();
  const [data, setData] = useState<ProviderDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setData(await apiClient.getProviderDashboard());
    } catch (e) {
      message.error(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!data) return null;

  const goAccounts = () => router.push('/provider/accounts');

  const maxCount = Math.max(1, ...data.weekly_play_counts.map((w) => w.count));
  const activePlayers = data.active_players.slice(0, 5);

  return (
    <div className="animate-pop">
      {/* ① 三个收益数据卡 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 18 }}>
        {data.earnings.map((e) => (
          <StatCard
            key={e.type}
            label={EARN_LABEL[e.type] ?? e.type}
            value={formatBalance(e.type, e.total_amount)}
            sub={`共 ${e.player_count} 位玩家`}
            color={EARN_COLOR[e.type] ?? COLORS.primary}
          />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
        {/* ② 今日待办 */}
        <div className="pm-card" style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>今日待办</div>
          {data.todos.length === 0 ? (
            <EmptyState title="今日暂无待办" />
          ) : (
            data.todos.map((t, i) => (
              <div
                key={t.player_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '13px 0',
                  borderBottom: i === data.todos.length - 1 ? 'none' : `1px solid ${COLORS.divider}`,
                }}
              >
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: COLORS.point, flex: 'none' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{t.nickname}</div>
                  <div style={{ fontSize: 11.5, color: COLORS.textMuted }}>余额偏低，建议提醒充值</div>
                </div>
                <button
                  onClick={goAccounts}
                  style={{
                    border: `1px solid ${COLORS.border}`,
                    background: '#fff',
                    borderRadius: 9,
                    padding: '7px 13px',
                    fontWeight: 600,
                    fontSize: 12,
                    color: COLORS.primary,
                    cursor: 'pointer',
                  }}
                >
                  去处理
                </button>
              </div>
            ))
          )}
        </div>

        {/* ③ 本月活跃趋势 */}
        <div className="pm-card" style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>本月活跃趋势</div>
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 18 }}>近 7 天 · 陪玩局数</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 120 }}>
            {data.weekly_play_counts.map((w) => (
              <div
                key={w.date}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  height: '100%',
                  justifyContent: 'flex-end',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    borderRadius: '6px 6px 0 0',
                    background: 'linear-gradient(180deg,#5B54F0,#7C75FF)',
                    height: `${(w.count / maxCount) * 100}%`,
                  }}
                />
                <span style={{ fontSize: 11, color: COLORS.textMuted }}>{w.date.slice(-2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ④ 近期活跃玩家 */}
      <SectionCard
        title="近期活跃玩家"
        bodyPad={false}
        extra={
          <button
            onClick={goAccounts}
            style={{
              border: 'none',
              background: 'none',
              color: COLORS.primary,
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            管理全部
          </button>
        }
      >
        {activePlayers.length === 0 ? (
          <EmptyState title="暂无活跃玩家" />
        ) : (
          activePlayers.map((p, i) => (
            <div
              key={p.player_id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 13,
                padding: '12px 20px',
                borderTop: i === 0 ? 'none' : `1px solid ${COLORS.divider}`,
              }}
            >
              <div
                className="font-display"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: hueFor(p.player_id),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  flex: 'none',
                }}
              >
                {initialOf(p.nickname)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{p.nickname}</div>
                <div style={{ fontSize: 11.5, color: COLORS.textMuted }}>{fromNow(p.last_active)}</div>
              </div>
              <div className="font-display" style={{ fontWeight: 600, fontSize: 14, color: COLORS.money }}>
                {formatMoney(p.money)}
              </div>
            </div>
          ))
        )}
      </SectionCard>
    </div>
  );
}
