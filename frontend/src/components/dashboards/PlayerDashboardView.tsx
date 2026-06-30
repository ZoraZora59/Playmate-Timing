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
  formatDateTime,
  initialOf,
} from '@/lib/format';
import { StatCard, SectionCard, EmptyState } from '@/components/ui';
import type { PlayerDashboard } from '@/types';

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

  return (
    <div className="animate-pop">
      {/* hero balance + ongoing */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18, marginBottom: 18 }}>
        {/* 余额合计 hero 卡 */}
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 18,
            padding: '26px 28px',
            background: 'linear-gradient(135deg,#16172A 0%,#2E2A6B 60%,#3D3490 100%)',
            color: '#fff',
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: -40,
              top: -40,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'radial-gradient(circle,rgba(21,200,216,.35),transparent 70%)',
            }}
          />
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', marginBottom: 6 }}>
            可用余额合计 · 折算金额
          </div>
          <div className="font-display" style={{ fontWeight: 700, fontSize: 46, letterSpacing: '-1px' }}>
            {formatMoney(data.money_total)}
          </div>
          <div style={{ display: 'flex', gap: 22, marginTop: 18 }}>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.55)' }}>时间余额</div>
              <div className="font-display" style={{ fontWeight: 600, fontSize: 18, marginTop: 2 }}>
                {formatTimeMinutes(data.time_total).replace(' 分钟', '')}{' '}
                <span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,.6)' }}>分钟</span>
              </div>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,.15)' }} />
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.55)' }}>点数余额</div>
              <div className="font-display" style={{ fontWeight: 600, fontSize: 18, marginTop: 2 }}>
                {formatPoint(data.point_total).replace(' 点', '')}{' '}
                <span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,.6)' }}>点</span>
              </div>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,.15)' }} />
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.55)' }}>服务者</div>
              <div className="font-display" style={{ fontWeight: 600, fontSize: 18, marginTop: 2 }}>
                {data.provider_count}{' '}
                <span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,.6)' }}>位</span>
              </div>
            </div>
          </div>
        </div>

        {/* 进行中的陪玩 */}
        <div
          style={{
            background: COLORS.bgCard,
            border: '1px solid ' + COLORS.border,
            borderRadius: 18,
            padding: '22px 24px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>进行中的陪玩</div>
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 16 }}>
            {data.ongoing_records.length} 局正在进行
          </div>

          {ongoing ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 13,
                borderRadius: 13,
                background: COLORS.bgPage,
              }}
            >
              <div
                className="font-display"
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 11,
                  background: COLORS.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  flex: 'none',
                }}
              >
                {initialOf(ongoingProviderName || ongoing.game_name)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                  {ongoing.game_name || '未命名对局'}
                  {ongoing.game_mode ? ` · ${ongoing.game_mode}` : ''}
                </div>
                <div style={{ fontSize: 11.5, color: COLORS.textMuted }}>
                  {ongoingProviderName ? `服务者 ${ongoingProviderName}` : '陪玩中'}
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  color: COLORS.money,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <span
                  className="live-dot"
                  style={{ width: 7, height: 7, borderRadius: '50%', background: COLORS.money }}
                />
                进行中
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 13,
                borderRadius: 13,
                background: COLORS.bgPage,
                fontSize: 13,
                color: COLORS.textMuted,
              }}
            >
              暂无进行中的陪玩
            </div>
          )}

          <button
            onClick={() => router.push('/player/balances')}
            style={{
              marginTop: 16,
              padding: 11,
              border: '1px solid ' + COLORS.border,
              background: COLORS.bgCard,
              borderRadius: 11,
              fontWeight: 600,
              fontSize: 13,
              color: COLORS.primary,
              cursor: 'pointer',
            }}
          >
            查看我的全部余额 →
          </button>
        </div>
      </div>

      {/* aggregate cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 18 }}>
        <StatCard
          label="金额合计"
          value={formatMoney(data.money_total)}
          sub={`${data.provider_count} 位服务者`}
          color={COLORS.money}
        />
        <StatCard
          label="时间合计"
          value={formatTimeMinutes(data.time_total).replace(' 分钟', '')}
          unit="分钟"
          sub={`${data.provider_count} 位服务者`}
          color={COLORS.time}
        />
        <StatCard
          label="点数合计"
          value={formatPoint(data.point_total).replace(' 点', '')}
          unit="点"
          sub={`${data.provider_count} 位服务者`}
          color={COLORS.point}
        />
      </div>

      {/* recent transactions */}
      <SectionCard
        title="最近流水"
        bodyPad={false}
        extra={
          <button
            onClick={() => router.push('/player/transactions')}
            style={{
              border: 'none',
              background: 'none',
              color: COLORS.primary,
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            查看全部
          </button>
        }
      >
        {data.recent_transactions.length === 0 ? (
          <EmptyState title="暂无流水记录" hint="充值或消费后会显示在这里" />
        ) : (
          data.recent_transactions.map((t) => {
            const credit = txIsCredit(t.type);
            const by = t.operator?.nickname || t.balance?.provider?.nickname;
            const type = t.balance?.type;
            const sign = credit ? '+' : '-';
            return (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 16px',
                  borderTop: '1px solid ' + COLORS.divider,
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    background: COLORS.bgPage,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 'none',
                  }}
                >
                  {credit ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.money} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 19V5M5 12l7-7 7 7" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.danger} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M5 12l7 7 7-7" />
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{t.description || '余额变动'}</div>
                  <div style={{ fontSize: 11.5, color: COLORS.textMuted }}>
                    {[by, formatDateTime(t.created_at)].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <div
                  className="font-display"
                  style={{ fontWeight: 600, fontSize: 15, color: credit ? COLORS.money : COLORS.danger }}
                >
                  {sign}
                  {type ? formatBalance(type, t.amount) : formatMoney(t.amount)}
                </div>
              </div>
            );
          })
        )}
      </SectionCard>
    </div>
  );
}
