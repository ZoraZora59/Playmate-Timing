'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { App, Spin } from 'antd';
import apiClient from '@/lib/api';
import { AccountTag, EmptyState, LedgerTable, TextAction, type LedgerColumn, type LedgerRow } from '@/components/ui';
import { fromNow } from '@/lib/format';
import type { ProviderStudioRelation } from '@/types';

const COLUMNS: LedgerColumn[] = [
  { key: 'provider', label: '服务者', width: '22%' },
  { key: 'notes', label: '申请说明', width: '48%' },
  { key: 'time', label: '时间', width: '13%', hide: 'sm' },
  { key: 'actions', label: '操作', width: '17%', align: 'right' },
];

export default function StudioApprovalsPage() {
  const { message, modal } = App.useApp();
  const router = useRouter();
  const [apps, setApps] = useState<ProviderStudioRelation[]>([]);
  const [loading, setLoading] = useState(true);
  const [noStudio, setNoStudio] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<number | null>(null);

  const load = async () => {
    try {
      setLoadError(null);
      setNoStudio(false);
      const dashboard = await apiClient.getStudioDashboard();
      const res = await apiClient.getStudioApplications(dashboard.studio.id, {
        status: 'pending',
        page_size: 50,
      });
      setApps(res.list);
    } catch (e) {
      const status = (e as { status?: number }).status;
      if (status === 404) {
        setNoStudio(true);
      } else {
        setLoadError(e instanceof Error ? e.message : '加载失败');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleProcess = async (rel: ProviderStudioRelation, status: 'approved' | 'rejected') => {
    setProcessing(rel.id);
    try {
      await apiClient.processApplication(rel.id, status, rel.notes ?? '');
      message.success(status === 'approved' ? '已批准该申请' : '已拒绝该申请');
      setApps((prev) => prev.filter((a) => a.id !== rel.id));
    } catch (e) {
      message.error(e instanceof Error ? e.message : '审批失败');
    } finally {
      setProcessing(null);
    }
  };

  const confirmReject = (rel: ProviderStudioRelation) => {
    modal.confirm({
      title: '驳回这条申请？',
      okText: '确认驳回',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => handleProcess(rel, 'rejected'),
    });
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (loadError) {
    return <EmptyState title="没读到数据。" hint={loadError} action={<TextAction onClick={load}>再试一次</TextAction>} />;
  }

  if (noStudio) {
    return (
      <div className="animate-pop">
        <EmptyState
          title="你还没有创建工作室"
          action={<TextAction onClick={() => router.push('/studio/manage')}>创建工作室</TextAction>}
        />
      </div>
    );
  }

  if (apps.length === 0) {
    return (
      <div className="animate-pop">
        <EmptyState title="暂无待审批申请" />
      </div>
    );
  }

  const rows: LedgerRow[] = apps.map((rel) => {
    const provider = rel.provider;
    const name = provider?.nickname || provider?.username || '未知服务者';
    const busy = processing === rel.id;
    return {
      key: rel.id,
      cells: {
        provider: (
          <div className="pm-cell-name">
            <AccountTag name={name} size={24} />
            <span className="pm-cell-name-main" title={name}>
              {name}
            </span>
          </div>
        ),
        notes: (
          <span className="pm-cell-clamp" title={rel.notes || '—'} style={{ fontSize: 13, color: 'var(--ink-secondary)' }}>
            {rel.notes || '—'}
          </span>
        ),
        time: <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{fromNow(rel.applied_at)}</span>,
        actions: (
          <span className="pm-row-actions">
            <button type="button" className="pm-row-action" disabled={busy} onClick={() => handleProcess(rel, 'approved')}>
              批准
            </button>
            <button type="button" className="pm-row-action muted" disabled={busy} onClick={() => confirmReject(rel)}>
              拒绝
            </button>
          </span>
        ),
      },
    };
  });

  return (
    <div className="animate-pop">
      <LedgerTable columns={COLUMNS} rows={rows} className="pm-approvals-table" caption="待审批的入驻申请" />
    </div>
  );
}
