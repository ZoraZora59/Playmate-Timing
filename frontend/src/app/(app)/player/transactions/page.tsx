'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { App, Select, Spin } from 'antd';
import apiClient from '@/lib/api';
import { Balance, BalanceTransaction } from '@/types';
import { EmptyState, LedgerTable, Stamp, type LedgerColumn, type LedgerRow } from '@/components/ui';
import { balanceMeta, formatBalance, txTypeLabel, txIsCredit, formatDateTime } from '@/lib/format';

type TxFilter = 'all' | 'recharge' | 'consume';

const COLUMNS: LedgerColumn[] = [
  { key: 'desc', label: '说明', width: '32%' },
  { key: 'type', label: '类型', width: '12%', hide: 'sm' },
  { key: 'change', label: '变动', width: '16%', align: 'right' },
  { key: 'after', label: '变动后', width: '16%', align: 'right' },
  { key: 'time', label: '时间', width: '13%', align: 'right', hide: 'sm' },
  { key: 'operator', label: '操作人', width: '11%', align: 'right', hide: 'sm' },
];

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

  if (loading)
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );

  if (balances.length === 0) {
    return (
      <div className="animate-pop">
        <EmptyState title="还没有余额账户" />
      </div>
    );
  }

  const meta = active ? balanceMeta(active.type) : null;
  const offset = (b: Balance) => `${b.provider?.nickname || b.provider?.username || '服务者'} · ${balanceMeta(b.type).label}`;

  const filters: { key: TxFilter; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'recharge', label: '充值' },
    { key: 'consume', label: '消费' },
  ];

  const rows: LedgerRow[] = filtered.map((t) => {
    const credit = txIsCredit(t.type);
    const balType = active?.type ?? t.balance?.type ?? 'money';
    return {
      key: t.id,
      cells: {
        desc: (
          <span className="pm-cell-name-main" title={t.description || txTypeLabel(t.type)}>
            {t.description || txTypeLabel(t.type)}
          </span>
        ),
        type: <Stamp tone="muted">{txTypeLabel(t.type)}</Stamp>,
        change: (
          <span className="num" style={{ fontSize: 13.5, fontWeight: 600 }}>
            {credit ? '+' : '−'}
            {formatBalance(balType, t.amount)}
          </span>
        ),
        after: <span className="num" style={{ fontSize: 13 }}>{formatBalance(balType, t.after_amount)}</span>,
        time: <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{formatDateTime(t.created_at)}</span>,
        operator: (
          <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
            {t.operator?.nickname || t.operator?.username || '系统'}
          </span>
        ),
      },
    };
  });

  return (
    <div className="animate-pop">
      <div className="pm-tx-bar">
        <Select
          value={activeId ?? undefined}
          onChange={(id) => {
            setActiveId(id);
            setFilter('all');
          }}
          style={{ width: 220 }}
          options={balances.map((b) => ({ value: b.id, label: offset(b) }))}
        />
        <div className="pm-tx-balance">
          <span>余额</span>
          <span className="num">{active ? formatBalance(active.type, active.amount) : '—'}</span>
        </div>
        <div className="pm-tx-filters">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`pm-tx-filter${filter === f.key ? ' on' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {txLoading ? (
        <div style={{ padding: 50, textAlign: 'center' }}>
          <Spin />
        </div>
      ) : (
        <LedgerTable
          columns={COLUMNS}
          rows={rows}
          caption={`${meta?.label ?? ''}账户流水`}
          empty={<EmptyState title="暂无流水" />}
        />
      )}
    </div>
  );
}

export default function PlayerTransactionsPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 60, textAlign: 'center' }}>
          <Spin size="large" />
        </div>
      }
    >
      <TransactionsView />
    </Suspense>
  );
}
