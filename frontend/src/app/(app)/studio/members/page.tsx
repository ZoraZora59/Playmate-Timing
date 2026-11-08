'use client';

import { useEffect, useState, useCallback } from 'react';
import { App, Spin } from 'antd';
import apiClient from '@/lib/api';
import { StudioMember } from '@/types';
import {
  AccountTag,
  EmptyState,
  LedgerTable,
  Stars,
  type LedgerColumn,
  type LedgerRow,
} from '@/components/ui';
import { formatMoney, formatDateTime } from '@/lib/format';

const COLUMNS: LedgerColumn[] = [
  { key: 'member', label: '成员', width: '26%' },
  { key: 'players', label: '玩家数', width: '12%', align: 'right' },
  { key: 'money', label: '账上余额', width: '18%', align: 'right' },
  { key: 'rating', label: '评分', width: '16%', align: 'right' },
  { key: 'joined', label: '加入时间', width: '16%', align: 'right', hide: 'sm' },
  { key: 'actions', label: '操作', width: '12%', align: 'right' },
];

export default function StudioMembersPage() {
  const { message, modal } = App.useApp();
  const [members, setMembers] = useState<StudioMember[] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setMembers(await apiClient.getStudioMembers());
    } catch (e) {
      message.error(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    load();
  }, [load]);

  const removeMember = (m: StudioMember) => {
    const name = m.provider.nickname || m.provider.username;
    modal.confirm({
      title: `移除 ${name}？`,
      okText: '确认移除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try {
          await apiClient.removeStudioMember(m.provider.id);
          message.success('已移除该成员');
          await load();
        } catch (e) {
          message.error(e instanceof Error ? e.message : '移除失败');
        }
      },
    });
  };

  if (loading)
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );

  const list = members || [];

  if (list.length === 0) {
    return (
      <div className="animate-pop">
        <EmptyState title="还没有工作室成员" />
      </div>
    );
  }

  const rows: LedgerRow[] = list.map((m) => {
    const name = m.provider.nickname || m.provider.username;
    return {
      key: m.provider.id,
      cells: {
        member: (
          <div className="pm-cell-name">
            <AccountTag name={name} size={24} />
            <span className="pm-cell-name-main" title={name}>
              {name}
            </span>
          </div>
        ),
        players: <span className="num" style={{ fontSize: 13 }}>{m.player_count}</span>,
        money: <span className="num" style={{ fontSize: 13, fontWeight: 600 }}>{formatMoney(m.money_flow)}</span>,
        rating: (
          <span style={{ display: 'inline-flex', justifyContent: 'flex-end' }}>
            {m.rating > 0 ? <Stars rating={m.rating} /> : <span style={{ fontSize: 12.5, color: 'var(--ink-muted)' }}>暂无</span>}
          </span>
        ),
        joined: (
          <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
            {m.joined_at ? formatDateTime(m.joined_at) : '—'}
          </span>
        ),
        actions: (
          <button type="button" className="pm-row-action muted" onClick={() => removeMember(m)}>
            移除
          </button>
        ),
      },
    };
  });

  return (
    <div className="animate-pop">
      <LedgerTable columns={COLUMNS} rows={rows} caption="工作室成员" />
    </div>
  );
}
