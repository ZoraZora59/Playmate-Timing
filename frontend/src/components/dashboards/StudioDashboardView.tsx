'use client';

import { useCallback, useEffect, useState } from 'react';
import { App, Modal } from 'antd';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { formatMoney, fromNow, formatDateTime } from '@/lib/format';
import {
  LedgerHead,
  LedgerTable,
  SectionBlock,
  EmptyState,
  Stamp,
  TextAction,
  AccountTag,
  RatingSquares,
  SkeletonLedger,
  type LedgerColumn,
  type LedgerRow,
} from '@/components/ui';
import type { StudioDashboard, ProviderStudioRelation, StudioMember } from '@/types';

const PENDING_COLUMNS: LedgerColumn[] = [
  { key: 'provider', label: '服务者', width: '24%' },
  { key: 'notes', label: '申请说明', width: '44%' },
  { key: 'time', label: '时间', width: '14%', hide: 'sm' },
  { key: 'actions', label: '操作', width: '18%', align: 'right' },
];

const MEMBER_COLUMNS: LedgerColumn[] = [
  { key: 'provider', label: '服务者', width: '28%' },
  { key: 'players', label: '玩家数', width: '14%', align: 'right' },
  { key: 'flow', label: '账上余额', width: '20%', align: 'right' },
  { key: 'rating', label: '评分', width: '16%' },
  { key: 'joined', label: '加入时间', width: '22%', hide: 'sm' },
];

export default function StudioDashboardView() {
  const { message } = App.useApp();
  const router = useRouter();
  const [data, setData] = useState<StudioDashboard | null>(null);
  const [members, setMembers] = useState<StudioMember[] | null>(null);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [noStudio, setNoStudio] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<number | null>(null);
  const [rejectRel, setRejectRel] = useState<ProviderStudioRelation | null>(null);

  const load = useCallback(async () => {
    try {
      setLoadError(null);
      setNoStudio(false);
      const dashboard = await apiClient.getStudioDashboard();
      setData(dashboard);
      try {
        const memberList = await apiClient.getStudioMembers();
        setMembers(memberList);
        setMembersError(null);
      } catch (e) {
        setMembers(null);
        setMembersError(e instanceof Error ? e.message : '加载失败');
      }
    } catch (e) {
      const status = (e as { status?: number }).status;
      if (status === 404) {
        setNoStudio(true);
        setData(null);
      } else {
        setLoadError(e instanceof Error ? e.message : '加载失败');
      }
    } finally {
      setLoading(false);
    }
  }, []);

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

  const handleProcess = async (rel: ProviderStudioRelation, status: 'approved' | 'rejected') => {
    setProcessing(rel.id);
    try {
      // 审批不会覆盖申请人写的说明：把原 notes 原样带回。
      await apiClient.processApplication(rel.id, status, rel.notes ?? '');
      message.success(status === 'approved' ? '已批准该申请' : '已驳回该申请');
      setRejectRel(null);
      await load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : '审批失败');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return <SkeletonLedger rows={4} />;
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

  if (noStudio) {
    return (
      <SectionBlock title="工作室" attention>
        <EmptyState
          title="还没有工作室。"
          hint="创建工作室后，审批、成员和本月充值会出现在这里。"
          action={
            <button className="pm-btn pm-btn-primary" onClick={() => router.push('/studio/manage')}>
              创建工作室
            </button>
          }
        />
      </SectionBlock>
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

  const pendingRows: LedgerRow[] = data.pending_applications.map((rel) => {
    const name = rel.provider?.nickname || rel.provider?.username || '服务者';
    const busy = processing === rel.id;
    return {
      key: rel.id,
      cells: {
        provider: (
          <div className="pm-cell-name">
            <AccountTag name={name} size={24} />
            <div className="pm-cell-name-text">
              <div className="pm-cell-name-main" title={name}>
                {name}
              </div>
              {rel.provider?.username && <div className="pm-cell-name-sub">{`@${rel.provider.username}`}</div>}
            </div>
          </div>
        ),
        notes: (
          <div className="pm-cell-clamp" title={rel.notes || '未填写说明'}>
            {rel.notes || '未填写说明'}
          </div>
        ),
        time: (
          <span className="pm-cell-time" title={formatDateTime(rel.applied_at)}>
            {fromNow(rel.applied_at)}
          </span>
        ),
        actions: (
          <div className="pm-cell-actions">
            <button
              className="pm-btn pm-btn-primary pm-btn-sm"
              onClick={() => handleProcess(rel, 'approved')}
              disabled={busy}
            >
              {busy ? '处理中' : '批准'}
            </button>
            <TextAction onClick={() => setRejectRel(rel)} disabled={busy}>
              驳回
            </TextAction>
          </div>
        ),
      },
    };
  });

  const visibleMembers = (members ?? []).slice(0, 6);
  const memberRows: LedgerRow[] = visibleMembers.map((member, index) => {
    const name = member.provider?.nickname || member.provider?.username || '服务者';
    return {
      key: member.provider?.id ?? index,
      cells: {
        provider: (
          <div className="pm-cell-name">
            <AccountTag name={name} size={24} />
            <div className="pm-cell-name-text">
              <div className="pm-cell-name-main" title={name}>
                {name}
              </div>
              {member.provider?.username && (
                <div className="pm-cell-name-sub">{`@${member.provider.username}`}</div>
              )}
            </div>
          </div>
        ),
        players: <span className="num">{member.player_count}</span>,
        flow: <span className="num">{formatMoney(member.money_flow)}</span>,
        rating:
          member.rating > 0 ? (
            <RatingSquares rating={member.rating} />
          ) : (
            <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>暂无</span>
          ),
        joined: (
          <span className="pm-cell-time" title={formatDateTime(member.joined_at)}>
            {member.joined_at ? fromNow(member.joined_at) : '—'}
          </span>
        ),
      },
    };
  });

  const hasReviews = data.review_count > 0 && data.average_rating !== null;

  return (
    <div>
      <SectionBlock
        title={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            待审批
            {data.pending_count > 0 && <Stamp tone="attention-solid">{data.pending_count}</Stamp>}
          </span>
        }
        attention={data.pending_count > 0}
        action={<TextAction onClick={() => router.push('/studio/approvals')}>全部审批</TextAction>}
      >
        <LedgerTable
          columns={PENDING_COLUMNS}
          rows={pendingRows}
          caption="待审批的入驻申请"
          empty={
            <EmptyState
              title="没有待批的申请。"
              hint="新的入驻申请会出现在这里。"
              action={<TextAction onClick={() => router.push('/studio/members')}>去成员管理</TextAction>}
            />
          }
        />
      </SectionBlock>

      <div style={{ marginTop: 28 }}>
        <div
          style={{
            marginBottom: 8,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.02em',
            color: 'var(--ink-muted)',
          }}
        >
          本月账头
        </div>
        <LedgerHead
          variant="compact"
          items={[
            {
              label: '本月充值',
              value: formatMoney(data.monthly_flow),
              sub: `${data.studio.name} · 金额充值 · 本月 1 日至今`,
            },
            {
              label: '成员',
              value: data.member_count,
              unit: '人',
              sub: '已通过审批',
            },
            {
              label: '平均评分',
              value: hasReviews ? data.average_rating!.toFixed(1) : '—',
              unit: hasReviews ? '分' : undefined,
              sub: hasReviews ? `${data.review_count} 条评价` : '暂无评价',
            },
            {
              label: '服务玩家',
              value: data.served_player_count,
              unit: '人',
              sub: '有对局记录',
            },
          ]}
        />
      </div>

      {(members !== null || membersError) && (
        <SectionBlock
          title="成员"
          action={<TextAction onClick={() => router.push('/studio/members')}>成员管理</TextAction>}
        >
          <div style={{ marginBottom: 4, fontSize: 11.5, color: 'var(--ink-muted)' }}>
            共 {data.member_count} 位{members ? ` · 显示 ${visibleMembers.length} 位` : ''}
          </div>
          {membersError ? (
            <EmptyState
              title="没读到成员。"
              hint={membersError}
              action={<TextAction onClick={load}>再试一次</TextAction>}
            />
          ) : (
            <LedgerTable
              columns={MEMBER_COLUMNS}
              rows={memberRows}
              caption="工作室成员"
              empty={
                <EmptyState
                  title="还没有成员。"
                  hint="批准入驻申请后，成员会出现在这里。"
                  action={<TextAction onClick={() => router.push('/studio/approvals')}>去审批</TextAction>}
                />
              }
            />
          )}
        </SectionBlock>
      )}

      <Modal
        open={!!rejectRel}
        title="驳回这条申请？"
        okText="确认驳回"
        cancelText="取消"
        centered
        confirmLoading={!!rejectRel && processing === rejectRel.id}
        onCancel={() => setRejectRel(null)}
        onOk={() => rejectRel && handleProcess(rejectRel, 'rejected')}
      >
        <p style={{ margin: '8px 0 0', fontSize: 13, lineHeight: 1.7, color: 'var(--ink-secondary)' }}>
          申请说明会原样保留。
        </p>
        {rejectRel?.notes && (
          <p
            style={{
              margin: '10px 0 0',
              paddingLeft: 10,
              borderLeft: '1px solid var(--rule)',
              fontSize: 12.5,
              lineHeight: 1.7,
              color: 'var(--ink-muted)',
            }}
          >
            “{rejectRel.notes}”
          </p>
        )}
      </Modal>
    </div>
  );
}
