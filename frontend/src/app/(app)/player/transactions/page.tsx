'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { App, Spin } from 'antd';
import apiClient from '@/lib/api';
import { Balance, BalanceTransaction } from '@/types';
import { COLORS } from '@/lib/theme';
import { Avatar, EmptyState, Pill } from '@/components/ui';
import {
  balanceMeta,
  formatBalance,
  txTypeLabel,
  txIsCredit,
  formatDateTime,
} from '@/lib/format';

type TxFilter = 'all' | 'recharge' | 'consume';

const GRID = '1.6fr .8fr .9fr .9fr 1fr';

function TransactionsView() {
  const { message } = App.useApp();
  const searchParams = useSearchParams();
  const preselectId = Number(searchParams.get('balance')) || null;

  const [balances, setBalances] = useState<Balance[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [txList, setTxList] = useState<BalanceTransaction[]>([]);
  const [filter, setFilter] = useState<TxFilter>('all');
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);

  // 拉取全部余额账户
  const loadBalances = useCallback(async () => {
    try {
      const res = await apiClient.getPlayerBalances({ page_size: 100 });
      const list = res.list || [];
      setBalances(list);
      if (list.length > 0) {
        const pre = preselectId && list.some((b) => b.id === preselectId) ? preselectId : list[0].id;
        setActiveId(pre);
      }
    } catch (e) {
      message.error(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [message, preselectId]);

  useEffect(() => {
    loadBalances();
  }, [loadBalances]);

  // 选中账户后拉取流水
  const loadTransactions = useCallback(
    async (balanceId: number) => {
      setTxLoading(true);
      try {
        const res = await apiClient.getBalanceTransactions(balanceId, { page_size: 50 });
        setTxList(res.list || []);
      } catch (e) {
        message.error(e instanceof Error ? e.message : '加载失败');
        setTxList([]);
      } finally {
        setTxLoading(false);
      }
    },
    [message],
  );

  useEffect(() => {
    if (activeId != null) loadTransactions(activeId);
  }, [activeId, loadTransactions]);

  const active = useMemo(() => balances.find((b) => b.id === activeId) ?? null, [balances, activeId]);

  const filtered = useMemo(() => {
    if (filter === 'all') return txList;
    return txList.filter((t) => (filter === 'recharge' ? txIsCredit(t.type) : !txIsCredit(t.type)));
  }, [txList, filter]);

  if (loading) return <div style={{ padding: 60, textAlign: 'center' }}><Spin size="large" /></div>;

  if (balances.length === 0) {
    return (
      <div className="animate-pop">
        <div className="pm-card">
          <EmptyState title="还没有任何余额账户" hint="服务者为你充值后，余额账户会出现在这里" />
        </div>
      </div>
    );
  }

  const meta = active ? balanceMeta(active.type) : null;
  const headName = active?.provider?.nickname || active?.provider?.username || '服务者';

  const filters: { key: TxFilter; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'recharge', label: '充值' },
    { key: 'consume', label: '消费' },
  ];

  return (
    <div className="animate-pop">
      {/* 顶部：选中余额头部 + 过滤 chip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <Avatar name={headName} seed={active?.provider_id ?? 0} size={40} hue={meta?.color} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>
            {headName} · {meta?.label}账户
          </div>
          <div style={{ fontSize: 12.5, color: COLORS.textMuted }}>
            当前余额 {active ? formatBalance(active.type, active.amount) : '—'} · 共 {txList.length} 条记录
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {filters.map((f) => {
            const on = filter === f.key;
            return (
              <span
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  padding: '7px 13px',
                  borderRadius: 9,
                  fontSize: 12.5,
                  fontWeight: on ? 500 : 400,
                  cursor: 'pointer',
                  background: on ? COLORS.sidebar : COLORS.bgCard,
                  color: on ? '#fff' : COLORS.textSecondary,
                  border: on ? '1px solid ' + COLORS.sidebar : '1px solid ' + COLORS.border,
                }}
              >
                {f.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* 账户切换 chip */}
      {balances.length > 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {balances.map((b) => {
            const bm = balanceMeta(b.type);
            const on = b.id === activeId;
            const name = b.provider?.nickname || b.provider?.username || '服务者';
            return (
              <span
                key={b.id}
                onClick={() => {
                  setActiveId(b.id);
                  setFilter('all');
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '7px 13px',
                  borderRadius: 20,
                  fontSize: 12.5,
                  cursor: 'pointer',
                  background: on ? bm.softBg : COLORS.bgCard,
                  color: on ? bm.color : COLORS.textSecondary,
                  border: '1px solid ' + (on ? bm.softBg : COLORS.border),
                  fontWeight: on ? 600 : 400,
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: bm.color, flex: 'none' }} />
                {name} · {bm.label}
              </span>
            );
          })}
        </div>
      )}

      {/* 流水列表 */}
      <div style={{ background: COLORS.bgCard, border: '1px solid ' + COLORS.border, borderRadius: 16, overflow: 'hidden' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: GRID,
            gap: 12,
            padding: '13px 22px',
            background: COLORS.bgSubtle,
            borderBottom: '1px solid ' + COLORS.divider,
            fontSize: 11.5,
            fontWeight: 600,
            letterSpacing: '.5px',
            color: COLORS.textMuted,
          }}
        >
          <div>说明</div>
          <div>类型</div>
          <div style={{ textAlign: 'right' }}>变动</div>
          <div style={{ textAlign: 'right' }}>变动后</div>
          <div style={{ textAlign: 'right' }}>时间 / 操作人</div>
        </div>

        {txLoading ? (
          <div style={{ padding: 50, textAlign: 'center' }}><Spin /></div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '12px 0' }}>
            <EmptyState title="暂无流水记录" hint="该账户在当前筛选下还没有变动" />
          </div>
        ) : (
          filtered.map((t) => {
            const up = txIsCredit(t.type);
            const balType = active?.type ?? t.balance?.type ?? 'money';
            const operator = t.operator?.nickname || t.operator?.username || '系统';
            return (
              <div
                key={t.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: GRID,
                  gap: 12,
                  alignItems: 'center',
                  padding: '15px 22px',
                  borderTop: '1px solid ' + COLORS.divider,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      background: COLORS.bgPage,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: 'none',
                    }}
                  >
                    {up ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={COLORS.money} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 19V5M5 12l7-7 7 7" />
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={COLORS.danger} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14M5 12l7 7 7-7" />
                      </svg>
                    )}
                  </div>
                  <span style={{ fontSize: 13.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.description || txTypeLabel(t.type)}
                  </span>
                </div>
                <div>
                  <Pill>{txTypeLabel(t.type)}</Pill>
                </div>
                <div className="font-display" style={{ textAlign: 'right', fontWeight: 600, fontSize: 14.5, color: up ? COLORS.money : COLORS.danger }}>
                  {up ? '+' : '-'}
                  {formatBalance(balType, t.amount)}
                </div>
                <div className="font-display" style={{ textAlign: 'right', fontSize: 14, color: COLORS.textPrimary }}>
                  {formatBalance(balType, t.after_amount)}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12.5, color: COLORS.textPrimary }}>{formatDateTime(t.created_at)}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>{operator}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function PlayerTransactionsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 60, textAlign: 'center' }}><Spin size="large" /></div>}>
      <TransactionsView />
    </Suspense>
  );
}
