'use client';

import { useEffect, useState, useCallback } from 'react';
import { App, Spin } from 'antd';
import apiClient from '@/lib/api';
import { StudioMember } from '@/types';
import { COLORS } from '@/lib/theme';
import { Avatar, EmptyState, Stars } from '@/components/ui';
import { formatMoney, formatDateTime } from '@/lib/format';

const GRID_COLUMNS = '1.8fr .8fr 1fr .8fr 1fr';

export default function StudioMembersPage() {
  const { message } = App.useApp();
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

  if (loading) return <div style={{ padding: 60, textAlign: 'center' }}><Spin size="large" /></div>;

  const list = members || [];

  return (
    <div className="animate-pop">
      {list.length === 0 ? (
        <div className="pm-card">
          <EmptyState title="还没有工作室成员" hint="服务者通过审批加入后会出现在这里" />
        </div>
      ) : (
        <div
          style={{
            background: COLORS.bgCard,
            border: '1px solid ' + COLORS.border,
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: GRID_COLUMNS,
              gap: 12,
              padding: '13px 22px',
              background: COLORS.bgSubtle,
              borderBottom: '1px solid ' + COLORS.divider,
              fontSize: 11.5,
              fontWeight: 600,
              letterSpacing: 0.5,
              color: COLORS.textMuted,
            }}
          >
            <div>成员</div>
            <div style={{ textAlign: 'right' }}>玩家数</div>
            <div style={{ textAlign: 'right' }}>本月流水</div>
            <div style={{ textAlign: 'right' }}>评分</div>
            <div style={{ textAlign: 'right' }}>加入时间</div>
          </div>

          {list.map((m) => {
            const name = m.provider.nickname || m.provider.username;
            return (
              <div
                key={m.provider.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: GRID_COLUMNS,
                  gap: 12,
                  alignItems: 'center',
                  padding: '15px 22px',
                  borderTop: '1px solid ' + COLORS.divider,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={name} seed={m.provider.id} size={38} />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{name}</span>
                </div>
                <div
                  className="font-display"
                  style={{ textAlign: 'right', fontWeight: 600, fontSize: 14 }}
                >
                  {m.player_count}
                </div>
                <div
                  className="font-display"
                  style={{ textAlign: 'right', fontWeight: 600, fontSize: 14, color: COLORS.money }}
                >
                  {formatMoney(m.money_flow)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {m.rating > 0 ? (
                    <Stars rating={m.rating} />
                  ) : (
                    <span style={{ fontSize: 13, color: COLORS.textMuted }}>暂无</span>
                  )}
                </div>
                <div style={{ textAlign: 'right', fontSize: 13, color: COLORS.textSecondary }}>
                  {m.joined_at ? formatDateTime(m.joined_at) : '—'}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
