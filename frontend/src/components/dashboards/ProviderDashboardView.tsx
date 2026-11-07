'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { App, Spin } from 'antd';
import apiClient from '@/lib/api';
import { ProviderDashboard, BalanceType } from '@/types';
import { COLORS } from '@/lib/theme';
import { formatBalance, formatMoney, formatTimeMinutes, formatPoint, fromNow } from '@/lib/format';
import { StatCard, ScoreStrip, SectionCard, EmptyState, Avatar } from '@/components/ui';

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

const BOARD_GRID = '1.5fr 1fr .8fr .8fr .8fr';

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
  const earnOf = (type: BalanceType) => data.earnings.find((e) => e.type === type);
  const maxCount = Math.max(1, ...data.weekly_play_counts.map((w) => w.count));
  const weeklyTotal = data.weekly_play_counts.reduce((sum, w) => sum + w.count, 0);
  const activePlayers = data.active_players.slice(0, 5);

  return (
    <div className="animate-pop">
      <ScoreStrip>
        <StatCard
          label={EARN_LABEL[BalanceType.MONEY]}
          value={formatBalance(BalanceType.MONEY, earnOf(BalanceType.MONEY)?.total_amount ?? '0')}
          sub={`${earnOf(BalanceType.MONEY)?.player_count ?? 0} 位玩家`}
          color={EARN_COLOR[BalanceType.MONEY]}
        />
        <StatCard
          label={EARN_LABEL[BalanceType.TIME]}
          value={formatTimeMinutes(earnOf(BalanceType.TIME)?.total_amount ?? '0').replace(' 分钟', '')}
          unit="分钟"
          sub={`${earnOf(BalanceType.TIME)?.player_count ?? 0} 位玩家`}
          color={EARN_COLOR[BalanceType.TIME]}
        />
        <StatCard
          label={EARN_LABEL[BalanceType.POINT]}
          value={formatPoint(earnOf(BalanceType.POINT)?.total_amount ?? '0').replace(' 点', '')}
          unit="点"
          sub={`${earnOf(BalanceType.POINT)?.player_count ?? 0} 位玩家`}
          color={EARN_COLOR[BalanceType.POINT]}
        />
        <StatCard label="玩家数" value={data.player_count} unit="位" sub="有余额往来" color={COLORS.primary} />
      </ScoreStrip>

      <div className="pm-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        <SectionCard title="今日待办" bodyPad={false}>
          {data.todos.length === 0 ? (
            <EmptyState title="今日暂无待办" hint="余额偏低的玩家会出现在这里" />
          ) : (
            data.todos.map((t) => (
              <div
                key={t.player_id}
                className="pm-row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '3px 1fr auto',
                  gap: 12,
                  alignItems: 'center',
                  padding: '12px 18px',
                  borderBottom: `1px solid ${COLORS.divider}`,
                }}
              >
                <span style={{ width: 3, height: 26, borderRadius: 1, background: COLORS.point }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>{t.nickname}</div>
                  <div style={{ fontSize: 11.5, color: COLORS.textMuted, marginTop: 2 }}>余额偏低，建议提醒充值</div>
                </div>
                <button className="pm-link" onClick={goAccounts}>
                  去处理
                </button>
              </div>
            ))
          )}
        </SectionCard>

        <SectionCard
          title="近 7 天局数"
          bodyPad={false}
          extra={<span style={{ fontSize: 12, color: COLORS.textMuted }}>共 {weeklyTotal} 局</span>}
        >
          <div style={{ padding: '18px 18px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 118 }}>
              {data.weekly_play_counts.map((w) => (
                <div
                  key={w.date}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 7,
                    height: '100%',
                    justifyContent: 'flex-end',
                  }}
                >
                  <span className="num" style={{ fontSize: 11, fontWeight: 600, color: COLORS.textSecondary }}>
                    {w.count}
                  </span>
                  <div
                    style={{
                      width: '100%',
                      background: COLORS.primary,
                      height: `${(w.count / maxCount) * 100}%`,
                      minHeight: w.count > 0 ? 4 : 2,
                      opacity: w.count > 0 ? 1 : 0.16,
                    }}
                  />
                  <span style={{ fontSize: 10.5, color: COLORS.textMuted }}>{w.date.slice(-2)}</span>
                </div>
              ))}
            </div>
            <div style={{ height: 1, background: COLORS.border, marginTop: 2 }} />
          </div>
        </SectionCard>
      </div>

      <div style={{ marginTop: 16 }}>
        <SectionCard
          title="近期活跃玩家"
          bodyPad={false}
          extra={
            <button className="pm-link" onClick={goAccounts}>
              管理全部
            </button>
          }
        >
          {activePlayers.length === 0 ? (
            <EmptyState title="暂无活跃玩家" hint="为玩家充值后，他们会出现在这里" />
          ) : (
            <div className="pm-table-scroll">
              <div style={{ minWidth: 660 }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: BOARD_GRID,
                    gap: 12,
                    padding: '9px 18px',
                    background: COLORS.bgSubtle,
                    borderBottom: `1px solid ${COLORS.divider}`,
                    fontSize: 11,
                    fontWeight: 600,
                    color: COLORS.textMuted,
                  }}
                >
                  <div>玩家</div>
                  <div>最近活跃</div>
                  <div style={{ textAlign: 'right' }}>金额</div>
                  <div style={{ textAlign: 'right' }}>时间</div>
                  <div style={{ textAlign: 'right' }}>点数</div>
                </div>
                {activePlayers.map((p) => (
                  <div
                    key={p.player_id}
                    className="pm-row"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: BOARD_GRID,
                      gap: 12,
                      alignItems: 'center',
                      padding: '12px 18px',
                      borderBottom: `1px solid ${COLORS.divider}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <Avatar name={p.nickname || p.username} seed={p.player_id} size={30} />
                      <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.nickname || p.username}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{fromNow(p.last_active) || '暂无记录'}</div>
                    <div className="num" style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, color: COLORS.money }}>
                      {formatMoney(p.money)}
                    </div>
                    <div className="num" style={{ textAlign: 'right', fontSize: 13, color: COLORS.textSecondary }}>
                      {formatTimeMinutes(p.time).replace(' 分钟', '')} 分
                    </div>
                    <div className="num" style={{ textAlign: 'right', fontSize: 13, color: COLORS.textSecondary }}>
                      {formatPoint(p.point).replace(' 点', '')} 点
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
