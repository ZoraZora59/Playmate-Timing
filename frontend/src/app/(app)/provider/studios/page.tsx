'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { App, Spin } from 'antd';
import apiClient from '@/lib/api';
import { ProviderStudioRelation, RelationStatus } from '@/types';
import { EmptyState } from '@/components/ui';
import { initialOf, formatDateTime } from '@/lib/format';

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
  const approved = list.filter((r) => r.status === RelationStatus.APPROVED);
  const pending = list.filter((r) => r.status === RelationStatus.PENDING);
  const rejected = list.filter((r) => r.status === RelationStatus.REJECTED);
  const hasAny = list.length > 0;

  return (
    <div className="animate-pop" style={{ maxWidth: 760 }}>
      {!hasAny && (
        <div
          style={{
            background: '#fff',
            border: '1px solid #EAEBF2',
            borderRadius: 18,
            padding: '40px 24px',
          }}
        >
          <EmptyState
            title="暂无工作室归属"
            hint="你目前是独立服务者，浏览工作室并提交申请即可加入团队运营。"
          />
          <button
            onClick={() => router.push('/studios')}
            style={{
              width: '100%',
              marginTop: 20,
              padding: 14,
              border: '1px dashed #C7C9D9',
              background: '#fff',
              borderRadius: 14,
              color: '#5B54F0',
              font: "600 14px 'Noto Sans SC', sans-serif",
              cursor: 'pointer',
            }}
          >
            ＋ 浏览工作室并申请加入
          </button>
        </div>
      )}

      {/* 当前归属：已批准 */}
      {approved.map((r) => (
        <div
          key={r.id}
          style={{
            background: 'linear-gradient(135deg,#0FB6A8,#15C8D8)',
            borderRadius: 18,
            padding: '24px 26px',
            color: '#fff',
            marginBottom: 18,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: -30,
              top: -30,
              width: 160,
              height: 160,
              borderRadius: '50%',
              background: 'rgba(255,255,255,.12)',
            }}
          />
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.8)', marginBottom: 6 }}>
            当前归属
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 13,
                background: 'rgba(255,255,255,.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 20,
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              {initialOf(r.studio?.name)}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>
                {r.studio?.name ?? `工作室 #${r.studio_id}`}
              </div>
              <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.8)' }}>
                已加入{r.processed_at ? ` · ${formatDateTime(r.processed_at)}` : ''}
              </div>
            </div>
            <span
              style={{
                marginLeft: 'auto',
                background: 'rgba(255,255,255,.22)',
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 12.5,
                fontWeight: 600,
              }}
            >
              已批准
            </span>
          </div>
        </div>
      ))}

      {/* 申请进度：待审核 */}
      {pending.map((r) => (
        <div
          key={r.id}
          style={{
            background: '#fff',
            border: '1px solid #EAEBF2',
            borderRadius: 16,
            padding: '22px 24px',
            marginBottom: 18,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 18 }}>申请进度</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 11,
                background: '#5B54F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              {initialOf(r.studio?.name)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600 }}>
                {r.studio?.name ?? `工作室 #${r.studio_id}`}
              </div>
              <div style={{ fontSize: 12, color: '#9AA0B5' }}>
                申请于 {formatDateTime(r.applied_at)}
                {r.notes ? ` · 备注「${r.notes}」` : ''}
              </div>
            </div>
            <span
              style={{
                background: '#FFF4E5',
                color: '#A9701A',
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 12.5,
                fontWeight: 600,
              }}
            >
              待审核
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1,
              }}
            >
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: '#1FB573',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </span>
              <span
                style={{ fontSize: 11.5, color: '#1B1C33', marginTop: 7, fontWeight: 500 }}
              >
                已提交
              </span>
            </div>
            <div
              style={{ height: 2, flex: 1, background: '#1FB573', marginBottom: 22 }}
            />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1,
              }}
            >
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: '#F5A524',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                2
              </span>
              <span
                style={{ fontSize: 11.5, color: '#1B1C33', marginTop: 7, fontWeight: 500 }}
              >
                审核中
              </span>
            </div>
            <div
              style={{ height: 2, flex: 1, background: '#EAEBF2', marginBottom: 22 }}
            />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1,
              }}
            >
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: '#EAEBF2',
                  color: '#9AA0B5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                3
              </span>
              <span style={{ fontSize: 11.5, color: '#9AA0B5', marginTop: 7 }}>结果</span>
            </div>
          </div>
        </div>
      ))}

      {/* 已拒绝 */}
      {rejected.map((r) => (
        <div
          key={r.id}
          style={{
            background: '#fff',
            border: '1px solid #EAEBF2',
            borderRadius: 16,
            padding: '22px 24px',
            marginBottom: 18,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 11,
                background: '#EAEBF2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9AA0B5',
                fontWeight: 700,
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              {initialOf(r.studio?.name)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: '#6B6D85' }}>
                {r.studio?.name ?? `工作室 #${r.studio_id}`}
              </div>
              <div style={{ fontSize: 12, color: '#9AA0B5' }}>
                {r.processed_at ? `${formatDateTime(r.processed_at)} · ` : ''}
                {r.notes ? `备注「${r.notes}」` : '申请未通过'}
              </div>
            </div>
            <span
              style={{
                background: '#F1F2F7',
                color: '#9AA0B5',
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 12.5,
                fontWeight: 600,
              }}
            >
              已拒绝
            </span>
          </div>
        </div>
      ))}

      {hasAny && (
        <button
          onClick={() => router.push('/studios')}
          style={{
            width: '100%',
            padding: 14,
            border: '1px dashed #C7C9D9',
            background: '#fff',
            borderRadius: 14,
            color: '#5B54F0',
            font: "600 14px 'Noto Sans SC', sans-serif",
            cursor: 'pointer',
          }}
        >
          ＋ 浏览更多工作室并申请加入
        </button>
      )}
    </div>
  );
}
