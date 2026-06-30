'use client';

import { useEffect, useState } from 'react';
import { App, Spin } from 'antd';
import apiClient from '@/lib/api';
import { Pill, EmptyState } from '@/components/ui';
import { COLORS } from '@/lib/theme';
import { formatBalance, fromNow, playStatusMeta } from '@/lib/format';
import { PlayStatus, type PlayRecord } from '@/types';

export default function PlayerRecordsPage() {
  const { message } = App.useApp();
  const [records, setRecords] = useState<PlayRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await apiClient.listMyRecords({ page_size: 50 });
      setRecords(res.list);
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

  if (records.length === 0) {
    return (
      <div className="animate-pop">
        <EmptyState title="暂无游玩记录" hint="开始一局陪玩后，记录会出现在这里" />
      </div>
    );
  }

  return (
    <div className="animate-pop" style={{ position: 'relative', paddingLeft: 8 }}>
      {records.map((r) => {
        const isActive = r.status === PlayStatus.ACTIVE;
        const meta = playStatusMeta(r.status);
        const dotColor = isActive ? COLORS.money : COLORS.border;
        return (
          <div key={r.id} style={{ display: 'flex', gap: 18, paddingBottom: 6 }}>
            {/* 左侧时间线：圆点 + 竖线 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 14 }}>
              <span
                className={isActive ? 'live-dot' : undefined}
                style={{
                  width: 13,
                  height: 13,
                  borderRadius: '50%',
                  border: `3px solid ${dotColor}`,
                  background: '#fff',
                  flex: 'none',
                  marginTop: 22,
                }}
              />
              <span style={{ flex: 1, width: 2, background: COLORS.border }} />
            </div>

            {/* 右侧卡片 */}
            <div
              style={{
                flex: 1,
                marginBottom: 14,
                background: COLORS.bgCard,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 15,
                padding: '17px 20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{r.game_name || '未命名对局'}</div>
                {r.game_mode && <Pill>{r.game_mode}</Pill>}
                <span style={{ marginLeft: 'auto', fontSize: 12, color: COLORS.textMuted }}>
                  {fromNow(r.start_time)}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 26, marginTop: 13 }}>
                <div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>服务者</div>
                  <div style={{ fontSize: 13.5, fontWeight: 500, marginTop: 2 }}>
                    {r.provider?.nickname || '—'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>时长</div>
                  <div style={{ fontSize: 13.5, fontWeight: 500, marginTop: 2 }}>
                    {r.duration != null ? `${r.duration} 分钟` : '—'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>消费</div>
                  <div style={{ fontSize: 13.5, fontWeight: 500, marginTop: 2 }}>
                    {r.amount != null && r.settle_type
                      ? formatBalance(r.settle_type, r.amount)
                      : '—'}
                  </div>
                </div>
                <div style={{ marginLeft: 'auto', alignSelf: 'center' }}>
                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      padding: '5px 13px',
                      borderRadius: 20,
                      background: meta.color,
                      color: '#fff',
                      opacity: 0.92,
                    }}
                  >
                    {meta.label}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
