'use client';

import { useEffect, useState, useCallback } from 'react';
import { App, Spin } from 'antd';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { ProviderDashboard, ProviderPlayerAgg } from '@/types';
import { AccountTag, EmptyState, LedgerTable, type LedgerColumn, type LedgerRow } from '@/components/ui';
import { formatMoney, formatTimeMinutes, formatPoint, fromNow, toNum } from '@/lib/format';
import BalanceOpModal, { PlayerLite } from '@/components/BalanceOpModal';

const COLUMNS: LedgerColumn[] = [
  { key: 'player', label: '玩家', width: '26%' },
  { key: 'active', label: '最近活跃', width: '14%', hide: 'sm' },
  { key: 'money', label: '金额', width: '13%', align: 'right' },
  { key: 'time', label: '时间', width: '12%', align: 'right' },
  { key: 'point', label: '点数', width: '11%', align: 'right' },
  { key: 'actions', label: '操作', width: '24%', align: 'right' },
];

export default function ProviderAccountsPage() {
  const { message } = App.useApp();
  const { user } = useAuthStore();
  const [data, setData] = useState<ProviderDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; mode: 'recharge' | 'deduct' | 'refund'; player: PlayerLite | null }>({
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

  const openModal = (p: ProviderPlayerAgg, mode: 'recharge' | 'deduct' | 'refund') => {
    setModal({
      open: true,
      mode,
      player: { player_id: p.player_id, nickname: p.nickname || p.username, money: p.money, time: p.time, point: p.point },
    });
  };

  if (loading)
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );

  const players = data?.active_players || [];

  const rows: LedgerRow[] = players.map((p) => {
    const name = p.nickname || p.username;
    const low = toNum(p.money) < 50;
    return {
      key: p.player_id,
      cells: {
        player: (
          <div className="pm-cell-name">
            <AccountTag name={name} size={24} />
            <span className="pm-cell-name-main" title={name}>
              {name}
            </span>
          </div>
        ),
        active: <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{p.last_active ? fromNow(p.last_active) : '—'}</span>,
        money: (
          <span className={`num${low ? ' pm-attention' : ''}`} style={{ fontSize: 13, fontWeight: 600 }}>
            {toNum(p.money) > 0 ? formatMoney(p.money) : '—'}
          </span>
        ),
        time: <span className="num" style={{ fontSize: 12.5 }}>{toNum(p.time) > 0 ? formatTimeMinutes(p.time) : '—'}</span>,
        point: <span className="num" style={{ fontSize: 12.5 }}>{toNum(p.point) > 0 ? formatPoint(p.point) : '—'}</span>,
        actions: (
          <span className="pm-row-actions">
            <button type="button" className="pm-row-action" onClick={() => openModal(p, 'recharge')}>
              充值
            </button>
            <button type="button" className="pm-row-action muted" onClick={() => openModal(p, 'deduct')}>
              扣费
            </button>
            <button type="button" className="pm-row-action muted" onClick={() => openModal(p, 'refund')}>
              退款
            </button>
          </span>
        ),
      },
    };
  });

  return (
    <div className="animate-pop">
      {players.length === 0 ? (
        <EmptyState title="还没有服务中的玩家" />
      ) : (
        <LedgerTable columns={COLUMNS} rows={rows} className="pm-accounts-table" caption="玩家余额" />
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
