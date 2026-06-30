'use client';

import { useEffect, useState, useCallback } from 'react';
import { App, Spin } from 'antd';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { ProviderDashboard, ProviderPlayerAgg } from '@/types';
import { COLORS } from '@/lib/theme';
import { Avatar, InfoBanner, EmptyState } from '@/components/ui';
import { formatMoney, formatTimeMinutes, formatPoint, fromNow, toNum } from '@/lib/format';
import BalanceOpModal, { PlayerLite } from '@/components/BalanceOpModal';

export default function ProviderAccountsPage() {
  const { message } = App.useApp();
  const { user } = useAuthStore();
  const [data, setData] = useState<ProviderDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; mode: 'recharge' | 'deduct'; player: PlayerLite | null }>({
    open: false,
    mode: 'recharge',
    player: null,
  });

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

  const openModal = (p: ProviderPlayerAgg, mode: 'recharge' | 'deduct') => {
    setModal({
      open: true,
      mode,
      player: { player_id: p.player_id, nickname: p.nickname || p.username, money: p.money, time: p.time, point: p.point },
    });
  };

  if (loading) return <div style={{ padding: 60, textAlign: 'center' }}><Spin size="large" /></div>;

  const players = data?.active_players || [];

  return (
    <div className="animate-pop">
      <div style={{ marginBottom: 18 }}>
        <InfoBanner tone="warn">充值 / 扣费 会直接改变玩家余额，属敏感操作，提交前需二次确认。</InfoBanner>
      </div>

      {players.length === 0 ? (
        <div className="pm-card">
          <EmptyState title="还没有服务中的玩家" hint="为玩家充值后，他们会出现在这里" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
          {players.map((p) => (
            <div key={p.player_id} className="pm-card" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <Avatar name={p.nickname || p.username} seed={p.player_id} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{p.nickname || p.username}</div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted }}>
                    {p.last_active ? `最近活跃 ${fromNow(p.last_active)}` : '暂无陪玩记录'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <MiniStat label="金额" value={toNum(p.money) > 0 ? formatMoney(p.money) : '—'} color={COLORS.money} />
                <MiniStat label="时间" value={toNum(p.time) > 0 ? formatTimeMinutes(p.time) : '—'} color={COLORS.time} />
                <MiniStat label="点数" value={toNum(p.point) > 0 ? formatPoint(p.point) : '—'} color={COLORS.point} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => openModal(p, 'recharge')}
                  style={{ flex: 1, padding: 10, border: 'none', borderRadius: 10, background: COLORS.money, color: '#fff', font: "600 13px 'Noto Sans SC',sans-serif", cursor: 'pointer' }}
                >
                  充值
                </button>
                <button
                  onClick={() => openModal(p, 'deduct')}
                  style={{ flex: 1, padding: 10, border: '1px solid #F2C2CD', borderRadius: 10, background: '#fff', color: COLORS.danger, font: "600 13px 'Noto Sans SC',sans-serif", cursor: 'pointer' }}
                >
                  扣费
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <BalanceOpModal
        open={modal.open}
        mode={modal.mode}
        player={modal.player}
        providerId={user?.id || 0}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
        onDone={load}
      />
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ flex: 1, background: COLORS.bgSubtle, border: '1px solid ' + COLORS.divider, borderRadius: 11, padding: '11px 12px' }}>
      <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 3 }}>{label}</div>
      <div className="font-display" style={{ fontWeight: 600, fontSize: 15, color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value}
      </div>
    </div>
  );
}
