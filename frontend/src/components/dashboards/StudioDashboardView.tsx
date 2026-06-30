'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { App, Spin } from 'antd';
import apiClient from '@/lib/api';
import { COLORS } from '@/lib/theme';
import { formatMoney, fromNow } from '@/lib/format';
import { StatCard, SectionCard, Avatar, EmptyState } from '@/components/ui';
import type { StudioDashboard, ProviderStudioRelation } from '@/types';

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
      // 工作室未创建时接口抛 404，展示引导卡而非错误提示
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
        <div
          className="pm-card"
          style={{
            padding: '48px 32px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: COLORS.primarySoft,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h.01M15 17h.01" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: COLORS.textPrimary }}>你还没有创建工作室</div>
            <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 6 }}>
              创建工作室后即可管理成员、审批关联申请并统一运营
            </div>
          </div>
          <button
            onClick={() => router.push('/studio/manage')}
            style={{
              border: 'none',
              borderRadius: 11,
              padding: '11px 24px',
              background: COLORS.primary,
              color: '#fff',
              font: "600 13.5px 'Noto Sans SC', sans-serif",
              cursor: 'pointer',
            }}
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
      {/* 四个数据卡 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 18 }}>
        <StatCard label="活跃成员" value={data.member_count} unit="人" sub="工作室成员" color={COLORS.primary} />
        <StatCard label="服务玩家" value={data.served_player_count} unit="人" sub="累计服务" color={COLORS.teal} />
        <StatCard label="经营流水" value={formatMoney(data.monthly_flow)} sub="本月累计" color={COLORS.money} />
        <StatCard label="平均评分" value={data.average_rating.toFixed(1)} unit="分" sub="近 30 天" color={COLORS.point} />
      </div>

      {/* 待审批申请 */}
      <SectionCard
        title={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
            <span>待审批申请</span>
            {data.pending_count > 0 && (
              <span
                className="font-display"
                style={{
                  background: COLORS.danger,
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 20,
                }}
              >
                {data.pending_count}
              </span>
            )}
          </span>
        }
        extra={
          <button
            onClick={() => router.push('/studio/approvals')}
            style={{
              border: 'none',
              background: 'none',
              color: COLORS.primary,
              font: "600 13px 'Noto Sans SC', sans-serif",
              cursor: 'pointer',
            }}
          >
            全部审批
          </button>
        }
        bodyPad={false}
      >
        {data.pending_applications.length === 0 ? (
          <EmptyState title="暂无待审批申请" hint="新的关联申请会出现在这里" />
        ) : (
          data.pending_applications.map((rel, idx) => (
            <div
              key={rel.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 13,
                padding: '14px 20px',
                borderTop: idx === 0 ? 'none' : '1px solid ' + COLORS.divider,
              }}
            >
              <Avatar name={rel.provider?.nickname || rel.provider?.username} seed={rel.provider_id} size={38} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.textPrimary }}>
                  {rel.provider?.nickname || rel.provider?.username || '服务者'}
                </div>
                <div style={{ fontSize: 11.5, color: COLORS.textMuted, marginTop: 2 }}>
                  {rel.notes ? `“${rel.notes}” · ` : ''}
                  {fromNow(rel.applied_at)}
                </div>
              </div>
              <button
                onClick={() => handleApprove(rel)}
                disabled={approving === rel.id}
                style={{
                  border: 'none',
                  borderRadius: 9,
                  padding: '8px 15px',
                  background: COLORS.money,
                  color: '#fff',
                  font: "600 12.5px 'Noto Sans SC', sans-serif",
                  cursor: approving === rel.id ? 'default' : 'pointer',
                  opacity: approving === rel.id ? 0.6 : 1,
                }}
              >
                {approving === rel.id ? '处理中' : '批准'}
              </button>
            </div>
          ))
        )}
      </SectionCard>
    </div>
  );
}
