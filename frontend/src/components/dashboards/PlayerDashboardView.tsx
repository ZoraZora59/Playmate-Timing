'use client';

import { useCallback, useEffect, useState } from 'react';
import { App } from 'antd';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import {
  formatMoney,
  formatTimeMinutes,
  formatPoint,
  formatBalance,
  txIsCredit,
  txTypeLabel,
  formatDateTime,
} from '@/lib/format';
import {
  LedgerHead,
  LedgerTable,
  SectionBlock,
  EmptyState,
  Stamp,
  TextAction,
  SkeletonLedger,
  type LedgerColumn,
  type LedgerRow,
} from '@/components/ui';
import type { PlayerDashboard } from '@/types';

const COLUMNS: LedgerColumn[] = [
  { key: 'time', label: '时间', width: '17%', hide: 'sm' },
  { key: 'summary', label: '摘要', width: '38%' },
  { key: 'type', label: '类型', width: '12%', hide: 'sm' },
  { key: 'change', label: '变动', width: '17%', align: 'right' },
  { key: 'balance', label: '结余', width: '16%', align: 'right' },
];

function minutesSince(iso?: string): number {
  if (!iso) return 0;
  const start = new Date(iso).getTime();
  if (Number.isNaN(start)) return 0;
  return Math.max(0, Math.floor((Date.now() - start) / 60000));
}

export default function PlayerDashboardView() {
  const { message } = App.useApp();
  const router = useRouter();
  const [data, setData] = useState<PlayerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await apiClient.getPlayerDashboard());
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : '加载失败');
      message.error(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      load();
    };
    window.addEventListener('pm:refresh', handler);
    return () => window.removeEventListener('pm:refresh', handler);
  }, [load]);

  if (loading) {
    return <SkeletonLedger rows={5} />;
  }

  if (loadError) {
    return (
      <EmptyState
        title="没读到数据。"
        hint={loadError}
        action={<TextAction onClick={load}>再试一次</TextAction>}
      />
    );
  }

  if (!data) {
    return (
      <EmptyState
        title="这一页还空着。"
        hint="稍后再试，或刷新一次。"
        action={<TextAction onClick={load}>刷新</TextAction>}
      />
    );
  }

  const recent = data.recent_transactions.slice(0, 6);
  const ongoing = data.ongoing_records.slice(0, 2);
  const moreOngoing = Math.max(0, data.ongoing_records.length - ongoing.length);

  const rows: LedgerRow[] = recent.map((t) => {
    const credit = txIsCredit(t.type);
    const type = t.balance?.type ?? 'money';
    return {
      key: t.id,
      cells: {
        time: (
          <span className="num" style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
            {formatDateTime(t.created_at)}
          </span>
        ),
        summary: (
          <span className="pm-cell-name-main" title={t.description || txTypeLabel(t.type)}>
            {t.description || txTypeLabel(t.type)}
          </span>
        ),
        type: <Stamp tone="muted">{txTypeLabel(t.type)}</Stamp>,
        change: (
          <span className="pm-cell-amount num">
            {credit ? '+' : '−'}
            {formatBalance(type, t.amount)}
          </span>
        ),
        balance: (
          <span className="num" style={{ fontSize: 12.5, color: 'var(--ink-muted)' }}>
            {formatBalance(type, t.after_amount)}
          </span>
        ),
      },
    };
  });

  return (
    <div>
      <LedgerHead
        items={[
          {
            label: '金额余额',
            value: formatMoney(data.money_total),
          },
          {
            label: '时间余额',
            value: formatTimeMinutes(data.time_total).replace(' 分钟', ''),
            unit: '分钟',
          },
          {
            label: '点数余额',
            value: formatPoint(data.point_total).replace(' 点', ''),
            unit: '点',
          },
          {
            label: '服务者',
            value: data.provider_count,
            unit: '位',
          },
        ]}
      />

      <div className="pm-dash-grid pm-player-grid" style={{ marginTop: 28 }}>
        <div className="pm-dash-stack">
          <SectionBlock title="当前这一局">
            {ongoing.length === 0 ? (
              <EmptyState
                title="还没有开着的局。"
                action={<TextAction onClick={() => router.push('/player/records')}>去看游玩记录</TextAction>}
              />
            ) : (
              <>
                {ongoing.map((record) => {
                  const providerName = record.provider?.nickname || record.provider?.username;
                  return (
                    <div
                      key={record.id}
                      style={{ padding: '12px 0', borderBottom: '1px solid var(--rule)' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 15, fontWeight: 700 }}>{record.game_name || '未命名对局'}</span>
                        {record.game_mode && <Stamp tone="muted">{record.game_mode}</Stamp>}
                      </div>
                      <div className="pm-cell-meta" style={{ marginTop: 6 }}>
                        {providerName ? `服务者 ${providerName} · ` : ''}
                        开始于 {formatDateTime(record.start_time)} · 已进行 {minutesSince(record.start_time)} 分
                      </div>
                      <div className="pm-live-row" style={{ marginTop: 9 }}>
                        <span className="pm-live-dot" aria-hidden="true" />
                        <Stamp tone="ink">进行中</Stamp>
                      </div>
                    </div>
                  );
                })}
                {moreOngoing > 0 && (
                  <div style={{ paddingTop: 10 }}>
                    <TextAction onClick={() => router.push('/player/records')}>
                      另有 {moreOngoing} 局进行中
                    </TextAction>
                  </div>
                )}
                <div style={{ marginTop: 10, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                  <TextAction onClick={() => router.push('/player/records')}>查看游玩记录</TextAction>
                  <TextAction onClick={() => router.push('/player/balances')}>查看我的余额</TextAction>
                </div>
              </>
            )}
          </SectionBlock>
        </div>

        <SectionBlock
          title="最近流水"
          action={<TextAction onClick={() => router.push('/player/transactions')}>查看全部</TextAction>}
        >
          <LedgerTable
            columns={COLUMNS}
            rows={rows}
            className="pm-flow-table"
            caption="最近余额流水"
            empty={
              <EmptyState
                title="还没有流水。"
                action={<TextAction onClick={() => router.push('/player/balances')}>查看我的余额</TextAction>}
              />
            }
          />
        </SectionBlock>
      </div>
    </div>
  );
}
