'use client';

import { useEffect, useState } from 'react';
import { App, Spin } from 'antd';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { COLORS } from '@/lib/theme';
import {
  formatMoney,
  formatTimeMinutes,
  formatPoint,
  formatBalance,
  txIsCredit,
  txTypeLabel,
  formatDateTime,
} from '@/lib/format';
import { StatCard, ScoreStrip, SectionCard, EmptyState, Pill } from '@/components/ui';
import type { PlayerDashboard } from '@/types';

const TX_GRID = '1.6fr .8fr .9fr';

const QUICK_LINKS = [
  { label: '余额账户', to: '/player/balances', color: COLORS.money },
  { label: '余额流水', to: '/player/transactions', color: COLORS.time },
  { label: '游玩记录', to: '/player/records', color: COLORS.point },
  { label: '我的评价', to: '/player/reviews', color: COLORS.primary },
];

export default function PlayerDashboardView() {
  const { message } = App.useApp();
  const router = useRouter();
  const [data, setData] = useState<PlayerDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setData(await apiClient.getPlayerDashboard());
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

  if (!data) {
    return (
      <div className="animate-pop">
        <EmptyState title="暂无控制台数据" hint="稍后再试或刷新页面" />
      </div>
    );
  }

  const ongoing = data.ongoing_records[0];
  const ongoingProviderName = ongoing?.provider?.nickname || ongoing?.provider?.username;
  const recent = data.recent_transactions.slice(0, 6);

  return (
    <div className="animate-pop">
      <ScoreStrip>
        <StatCard label="金额余额" value={formatMoney(data.money_total)} sub="可用余额" color={COLORS.money} />
        <StatCard
          label="时间余额"
          value={formatTimeMinutes(data.time_total).replace(' 分钟', '')}
          unit="分钟"
          sub="按服务者累计"
          color={COLORS.time}
        />
        <StatCard
          label="点数余额"
          value={formatPoint(data.point_total).replace(' 点', '')}
          unit="点"
          sub="按服务者累计"
          color={COLORS.point}
        />
        <StatCard label="服务者" value={data.provider_count} unit="位" sub="有余额往来" color={COLORS.primary} />
      </ScoreStrip>

      <div className="pm-grid-2" style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 16, marginTop: 16 }}>
        <SectionCard
          title="最近流水"
          bodyPad={false}
          extra={
            <button className="pm-link" onClick={() => router.push('/player/transactions')}>
              查看全部
            </button>
          }
        >
          {recent.length === 0 ? (
            <EmptyState title="暂无流水记录" hint="充值或消费后会显示在这里" />
          ) : (
            <div className="pm-table-scroll">
              <div className="pm-tx-table">
                <div
                  className="pm-tx-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: TX_GRID,
                    gap: 12,
                    padding: '9px 18px',
                    background: COLORS.bgSubtle,
                    borderBottom: `1px solid ${COLORS.divider}`,
                    fontSize: 11,
                    fontWeight: 600,
                    color: COLORS.textMuted,
                  }}
                >
                  <div>说明</div>
                  <div className="pm-tx-type">类型</div>
                  <div style={{ textAlign: 'right' }}>变动</div>
                </div>
                {recent.map((t) => {
                  const credit = txIsCredit(t.type);
                  const by = t.operator?.nickname || t.balance?.provider?.nickname;
                  const type = t.balance?.type;
                  return (
                    <div
                      key={t.id}
                      className="pm-row pm-tx-grid"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: TX_GRID,
                        gap: 12,
                        alignItems: 'center',
                        padding: '12px 18px',
                        borderBottom: `1px solid ${COLORS.divider}`,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.description || '余额变动'}
                        </div>
                        <div style={{ fontSize: 11.5, color: COLORS.textMuted, marginTop: 2 }}>
                          {[by, formatDateTime(t.created_at)].filter(Boolean).join('，')}
                        </div>
                      </div>
                      <div className="pm-tx-type">
                        <Pill color={credit ? COLORS.money : COLORS.textSecondary}>{txTypeLabel(t.type)}</Pill>
                      </div>
                      <div
                        className="font-display num"
                        style={{ textAlign: 'right', fontWeight: 700, fontSize: 14, color: credit ? COLORS.money : COLORS.danger }}
                      >
                        {credit ? '+' : '-'}
                        {type ? formatBalance(type, t.amount) : formatMoney(t.amount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </SectionCard>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SectionCard title="进行中的陪玩" bodyPad={false}>
            {ongoing ? (
              <div style={{ padding: '16px 18px', borderLeft: `3px solid ${COLORS.primary}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: COLORS.textPrimary }}>
                    {ongoing.game_name || '未命名对局'}
                  </span>
                  {ongoing.game_mode && <Pill color={COLORS.primary}>{ongoing.game_mode}</Pill>}
                </div>
                <div style={{ fontSize: 12.5, color: COLORS.textSecondary, marginTop: 8 }}>
                  {ongoingProviderName ? `服务者 ${ongoingProviderName}` : '陪玩中'}
                </div>
                <div style={{ fontSize: 11.5, color: COLORS.textMuted, marginTop: 3 }}>
                  开始于 {formatDateTime(ongoing.start_time)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 12, fontWeight: 600, color: COLORS.money }}>
                  <span className="live-dot" style={{ width: 7, height: 7, borderRadius: 1, background: COLORS.money }} />
                  进行中
                </div>
              </div>
            ) : (
              <EmptyState title="暂无进行中的陪玩" hint="服务者开局后会显示在这里" />
            )}
          </SectionCard>

          <div className="pm-panel" style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>余额按服务者分开记</div>
            <div style={{ fontSize: 12.5, lineHeight: 1.7, color: COLORS.textSecondary, marginTop: 6 }}>
              你在不同服务者处的账户互不通用，充值、消费与退款只影响对应账户。
            </div>
            <button
              className="pm-btn pm-btn-ghost"
              style={{ width: '100%', height: 36, marginTop: 14 }}
              onClick={() => router.push('/player/balances')}
            >
              查看我的余额
            </button>
          </div>

          <SectionCard title="快速入口" bodyPad={false}>
            {QUICK_LINKS.map((link) => (
              <button
                key={link.to}
                className="pm-row"
                onClick={() => router.push(link.to)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  width: '100%',
                  padding: '10px 18px',
                  border: 'none',
                  borderTop: `1px solid ${COLORS.divider}`,
                  background: 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: 1, background: link.color, flex: 'none' }} />
                <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: COLORS.textPrimary }}>{link.label}</span>
                <span style={{ fontSize: 11.5, color: COLORS.textMuted }}>查看</span>
              </button>
            ))}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
