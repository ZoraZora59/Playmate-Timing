'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { App, Spin } from 'antd';
import apiClient from '@/lib/api';
import { COLORS } from '@/lib/theme';
import { formatMoney, fromNow } from '@/lib/format';
import { StatCard, ScoreStrip, SectionCard, Avatar, EmptyState, Pill } from '@/components/ui';
import type { StudioDashboard, ProviderStudioRelation } from '@/types';

const APPROVAL_GRID = '1.2fr 1.6fr .8fr auto';

export default function StudioDashboardView() {
  const { message } = App.useApp();
  const router = useRouter();
  const [data, setData] = useState<StudioDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [noStudio, setNoStudio] = useState(false);
  const [approving, setApproving] = useState<number | null>(null);

  const load = async () => {
    try {
      setNoStudio(false);
      setData(await apiClient.getStudioDashboard());
    } catch (e) {
      setNoStudio(true);
      void e;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApprove = async (rel: ProviderStudioRelation) => {
    setApproving(rel.id);
    try {
      await apiClient.processApplication(rel.id, 'approved');
      message.success('已批准该申请');
      await load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : '审批失败');
    } finally {
      setApproving(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (noStudio) {
    return (
      <div className="animate-pop">
        <div className="pm-panel" style={{ padding: '40px 28px', textAlign: 'center' }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 4,
              border: `1px solid ${COLORS.border}`,
              background: COLORS.bgSubtle,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COLORS.textSecondary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h.01M15 17h.01" />
            </svg>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.textPrimary }}>你还没有创建工作室</div>
          <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 6 }}>
            创建工作室后即可管理成员、审批入驻申请并查看经营数据。
          </div>
          <button
            className="pm-btn pm-btn-primary"
            style={{ marginTop: 18 }}
            onClick={() => router.push('/studio/manage')}
          >
            去创建工作室
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="animate-pop">
      <ScoreStrip>
        <StatCard label="活跃成员" value={data.member_count} unit="人" sub="已通过审批" color={COLORS.primary} />
        <StatCard label="服务玩家" value={data.served_player_count} unit="人" sub="累计服务" color={COLORS.teal} />
        <StatCard label="经营流水" value={formatMoney(data.monthly_flow)} sub="本月累计" color={COLORS.money} />
        <StatCard label="平均评分" value={data.average_rating.toFixed(1)} unit="分" sub="工作室评价" color={COLORS.point} />
      </ScoreStrip>

      <div style={{ marginTop: 16 }}>
        <SectionCard
          title={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              待审批申请
              {data.pending_count > 0 && <Pill color={COLORS.signal}>{data.pending_count}</Pill>}
            </span>
          }
          extra={
            <button className="pm-link" onClick={() => router.push('/studio/approvals')}>
              全部审批
            </button>
          }
          bodyPad={false}
        >
          {data.pending_applications.length === 0 ? (
            <EmptyState title="暂无待审批申请" hint="新的入驻申请会出现在这里" />
          ) : (
            <div className="pm-table-scroll">
              <div style={{ minWidth: 620 }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: APPROVAL_GRID,
                    gap: 12,
                    padding: '9px 18px',
                    background: COLORS.bgSubtle,
                    borderBottom: `1px solid ${COLORS.divider}`,
                    fontSize: 11,
                    fontWeight: 600,
                    color: COLORS.textMuted,
                  }}
                >
                  <div>服务者</div>
                  <div>申请说明</div>
                  <div>时间</div>
                  <div style={{ textAlign: 'right' }}>操作</div>
                </div>
                {data.pending_applications.map((rel) => (
                  <div
                    key={rel.id}
                    className="pm-row"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: APPROVAL_GRID,
                      gap: 12,
                      alignItems: 'center',
                      padding: '12px 18px',
                      borderBottom: `1px solid ${COLORS.divider}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <Avatar name={rel.provider?.nickname || rel.provider?.username} seed={rel.provider_id} size={30} />
                      <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {rel.provider?.nickname || rel.provider?.username || '服务者'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12.5, color: COLORS.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {rel.notes || '未填写说明'}
                    </div>
                    <div style={{ fontSize: 11.5, color: COLORS.textMuted }}>{fromNow(rel.applied_at)}</div>
                    <div style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleApprove(rel)}
                        disabled={approving === rel.id}
                        style={{
                          border: `1px solid ${COLORS.money}`,
                          borderRadius: 3,
                          padding: '5px 10px',
                          background: 'transparent',
                          color: COLORS.money,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: approving === rel.id ? 'default' : 'pointer',
                          opacity: approving === rel.id ? 0.6 : 1,
                        }}
                      >
                        {approving === rel.id ? '处理中' : '批准'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
