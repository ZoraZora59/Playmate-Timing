'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { App, Spin } from 'antd';
import apiClient from '@/lib/api';
import { ProviderStudioRelation, RelationStatus } from '@/types';
import { AccountTag, EmptyState, Stamp, TextAction } from '@/components/ui';
import { formatDateTime } from '@/lib/format';

export default function ProviderStudiosPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const [relations, setRelations] = useState<ProviderStudioRelation[] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setRelations(await apiClient.getMyRelations());
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

  const list = relations ?? [];

  if (list.length === 0) {
    return (
      <div className="animate-pop">
        <EmptyState
          title="暂无工作室归属"
          action={<TextAction onClick={() => router.push('/studios')}>浏览工作室</TextAction>}
        />
      </div>
    );
  }

  const statusOf = (r: ProviderStudioRelation) => {
    if (r.status === RelationStatus.APPROVED) return { label: '已加入', tone: 'muted' as const, date: r.processed_at };
    if (r.status === RelationStatus.PENDING) return { label: '待审核', tone: 'attention' as const, date: r.applied_at };
    if (r.status === RelationStatus.REMOVED) return { label: '已移除', tone: 'muted' as const, date: r.processed_at };
    return { label: '已拒绝', tone: 'muted' as const, date: r.processed_at };
  };

  return (
    <div className="animate-pop pm-rel-list">
      {list.map((r) => {
        const name = r.studio?.name ?? `工作室 #${r.studio_id}`;
        const status = statusOf(r);
        return (
          <div key={r.id} className="pm-rel-row">
            <div className="pm-rel-main">
              <AccountTag name={name} size={26} />
              <span className="pm-rel-name">{name}</span>
            </div>
            <span className="pm-rel-date">{status.date ? formatDateTime(status.date) : '—'}</span>
            <Stamp tone={status.tone}>{status.label}</Stamp>
          </div>
        );
      })}
      <div className="pm-rel-foot">
        <TextAction onClick={() => router.push('/studios')}>浏览工作室</TextAction>
      </div>
    </div>
  );
}
