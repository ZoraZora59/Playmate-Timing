'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { App, Spin } from 'antd';
import apiClient from '@/lib/api';
import { Avatar, EmptyState } from '@/components/ui';
import { COLORS } from '@/lib/theme';
import { fromNow } from '@/lib/format';
import type { ProviderStudioRelation } from '@/types';

export default function StudioApprovalsPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const [apps, setApps] = useState<ProviderStudioRelation[]>([]);
  const [loading, setLoading] = useState(true);
  const [noStudio, setNoStudio] = useState(false);
  const [processing, setProcessing] = useState<number | null>(null);

  const load = async () => {
    try {
      setNoStudio(false);
      const dashboard = await apiClient.getStudioDashboard();
      const res = await apiClient.getStudioApplications(dashboard.studio.id, {
        status: 'pending',
        page_size: 50,
      });
      setApps(res.list);
    } catch (e) {
      // 工作室未创建时接口抛 404，展示引导卡而非错误提示
      setNoStudio(true);
      void e;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProcess = async (rel: ProviderStudioRelation, status: 'approved' | 'rejected') => {
    setProcessing(rel.id);
    try {
      await apiClient.processApplication(rel.id, status);
      message.success(status === 'approved' ? '已批准该申请' : '已拒绝该申请');
      setApps((prev) => prev.filter((a) => a.id !== rel.id));
    } catch (e) {
      message.error(e instanceof Error ? e.message : '审批失败');
    } finally {
      setProcessing(null);
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
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke={COLORS.primary}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h.01M15 17h.01" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: COLORS.textPrimary }}>你还没有创建工作室</div>
            <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 6 }}>
              创建工作室后即可审批服务者的入驻申请
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

  if (apps.length === 0) {
    return (
      <div className="animate-pop">
        <EmptyState title="暂无待审批申请" hint="服务者提交入驻申请后会显示在这里" />
      </div>
    );
  }

  return (
    <div className="animate-pop" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {apps.map((rel) => {
        const provider = rel.provider;
        const name = provider?.nickname || provider?.username || '未知服务者';
        const busy = processing === rel.id;
        return (
          <div
            key={rel.id}
            style={{
              background: COLORS.bgCard,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 16,
              padding: '20px 22px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <Avatar name={name} seed={rel.provider_id} size={48} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: COLORS.textPrimary }}>{name}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: COLORS.textMuted }}>
                    {fromNow(rel.applied_at)}
                  </span>
                </div>
                {provider?.username && (
                  <div style={{ fontSize: 12.5, color: COLORS.textSecondary, marginTop: 5 }}>
                    @{provider.username}
                  </div>
                )}
                {rel.notes && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: '12px 14px',
                      background: COLORS.bgSubtle,
                      border: `1px solid ${COLORS.divider}`,
                      borderRadius: 11,
                      fontSize: 13,
                      color: '#4A4C63',
                      lineHeight: 1.6,
                    }}
                  >
                    “{rel.notes}”
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                  <button
                    onClick={() => handleProcess(rel, 'approved')}
                    disabled={busy}
                    style={{
                      padding: '10px 22px',
                      border: 'none',
                      borderRadius: 10,
                      background: COLORS.money,
                      color: '#fff',
                      font: "600 13px 'Noto Sans SC', sans-serif",
                      cursor: busy ? 'not-allowed' : 'pointer',
                      opacity: busy ? 0.6 : 1,
                    }}
                  >
                    批准加入
                  </button>
                  <button
                    onClick={() => handleProcess(rel, 'rejected')}
                    disabled={busy}
                    style={{
                      padding: '10px 22px',
                      border: '1px solid #F2C2CD',
                      borderRadius: 10,
                      background: COLORS.bgCard,
                      color: COLORS.danger,
                      font: "600 13px 'Noto Sans SC', sans-serif",
                      cursor: busy ? 'not-allowed' : 'pointer',
                      opacity: busy ? 0.6 : 1,
                    }}
                  >
                    拒绝
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
