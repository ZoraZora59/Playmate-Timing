'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { App, Spin, Modal, Input, Button } from 'antd';
import apiClient from '@/lib/api';
import { COLORS } from '@/lib/theme';
import { initialOf, fromNow } from '@/lib/format';
import { Avatar, SectionCard, EmptyState, Stars, Stamp, LoadError, TextAction } from '@/components/ui';
import { useAuthStore } from '@/store/auth';
import {
  Studio,
  Review,
  ReviewSummary,
  ProviderStudioRelation,
  ReviewTargetType,
  RelationStatus,
  UserRole,
} from '@/types';

export default function StudioDetailPage() {
  const params = useParams();
  const idStr = Array.isArray(params.id) ? params.id[0] : params.id;
  const studioId = Number(idStr);

  const { message } = App.useApp();
  const user = useAuthStore((s) => s.user);

  const router = useRouter();
  const [studio, setStudio] = useState<Studio | null>(null);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const [applyOpen, setApplyOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    setLoadError(false);
    try {
      const [s, sum, rv] = await Promise.all([
        apiClient.getStudioById(studioId),
        apiClient.getReviewSummary(ReviewTargetType.STUDIO, studioId),
        apiClient.listReviewsByTarget(ReviewTargetType.STUDIO, studioId, { page_size: 50 }),
      ]);
      setStudio(s);
      setSummary(sum);
      setReviews(rv.list ?? []);
    } catch (e) {
      const status = (e as { status?: number }).status;
      if (status === 404) {
        setNotFound(true);
      } else {
        setLoadError(true);
      }
    } finally {
      setLoading(false);
    }
  }, [studioId]);

  useEffect(() => {
    if (Number.isFinite(studioId)) {
      load();
    } else {
      setNotFound(true);
      setLoading(false);
    }
  }, [studioId, load]);

  const submitApply = async () => {
    setSubmitting(true);
    try {
      await apiClient.applyToJoinStudio(studioId, notes.trim() || undefined);
      message.success('申请已提交，请等待工作室审核');
      setApplyOpen(false);
      setNotes('');
    } catch (e) {
      message.error(e instanceof Error ? e.message : '申请失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="animate-pop">
        <LoadError onRetry={load} />
      </div>
    );
  }

  if (notFound || !studio) {
    return (
      <div className="animate-pop">
        <EmptyState
          title="未找到该工作室"
          action={<TextAction onClick={() => router.push('/studios')}>返回工作室列表</TextAction>}
        />
      </div>
    );
  }

  const approved = (studio.relations ?? []).filter((r) => r.status === RelationStatus.APPROVED);
  const memberCount = approved.length;
  const avgRating = summary?.average_rating ?? 0;
  const reviewCount = summary?.count ?? reviews.length;
  const myRelation =
    user?.role === UserRole.PROVIDER
      ? (studio.relations ?? []).find((r) => r.provider_id === user.id)
      : undefined;
  const canApply =
    user?.role === UserRole.PROVIDER &&
    (!myRelation ||
      myRelation.status === RelationStatus.REJECTED ||
      myRelation.status === RelationStatus.REMOVED);

  return (
    <div className="animate-pop">
      {/* 工作室头部 */}
      <div
        style={{
          padding: '24px 0 20px',
          marginBottom: 20,
          borderTop: `2px solid ${COLORS.textPrimary}`,
          borderBottom: '1px solid ' + COLORS.divider,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 2,
              background: COLORS.bgSubtle,
              border: '1px solid ' + COLORS.divider,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: 24,
              color: COLORS.textPrimary,
              flex: 'none',
            }}
          >
            {initialOf(studio.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', color: COLORS.textPrimary }}>
              {studio.name}
            </div>
            <div
              style={{
                fontSize: 13.5,
                color: COLORS.textSecondary,
                marginTop: 6,
                lineHeight: 1.7,
                maxWidth: 620,
              }}
            >
              {studio.description || '这家工作室还没有填写简介。'}
            </div>
          </div>
          {user?.role === UserRole.PROVIDER &&
            (myRelation?.status === RelationStatus.APPROVED ? (
              <Stamp tone="muted">已加入</Stamp>
            ) : myRelation?.status === RelationStatus.PENDING ? (
              <Stamp tone="attention">待审核</Stamp>
            ) : (
              <Button
                type="primary"
                onClick={() => setApplyOpen(true)}
                style={{ flex: 'none', height: 40, borderRadius: 2, fontWeight: 600 }}
              >
                {canApply && myRelation ? '重新申请' : '申请加入'}
              </Button>
            ))}
        </div>

        {/* 一行统计 */}
        <div style={{ display: 'flex', gap: 26, marginTop: 22 }}>
          <div>
            <div style={{ fontSize: 11.5, color: COLORS.textMuted }}>成员数</div>
            <div style={{ fontWeight: 600, fontSize: 20, marginTop: 3, color: COLORS.textPrimary }}>
              {memberCount}{' '}
              <span style={{ fontSize: 12, fontWeight: 400, color: COLORS.textMuted }}>位</span>
            </div>
          </div>
          <div style={{ width: 1, background: COLORS.divider }} />
          <div>
            <div style={{ fontSize: 11.5, color: COLORS.textMuted }}>平均评分</div>
            <div style={{ fontWeight: 600, fontSize: 20, marginTop: 3, color: COLORS.textPrimary }}>
              {avgRating > 0 ? (
                <Stars rating={avgRating} size={16} />
              ) : (
                <span style={{ color: COLORS.textMuted, fontSize: 16 }}>暂无</span>
              )}
            </div>
          </div>
          <div style={{ width: 1, background: COLORS.divider }} />
          <div>
            <div style={{ fontSize: 11.5, color: COLORS.textMuted }}>评价数</div>
            <div style={{ fontWeight: 600, fontSize: 20, marginTop: 3, color: COLORS.textPrimary }}>
              {reviewCount}{' '}
              <span style={{ fontSize: 12, fontWeight: 400, color: COLORS.textMuted }}>条</span>
            </div>
          </div>
        </div>
      </div>

      {/* 成员区 */}
      <div style={{ marginBottom: 18 }}>
        <SectionCard title={`工作室成员（${memberCount}）`}>
          {memberCount === 0 ? (
            <EmptyState title="暂无成员" />
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px 32px', padding: '8px 0' }}>
              {approved.map((rel: ProviderStudioRelation) => {
                const name = rel.provider?.nickname || rel.provider?.username || '服务者';
                return (
                  <div key={rel.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={name} size={30} />
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{name}</span>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      {/* 评价区 */}
      <SectionCard title="玩家评价" bodyPad={false}>
        {reviews.length === 0 ? (
          <EmptyState title="暂无评价" />
        ) : (
          reviews.map((rv) => {
            const author = rv.is_anonymous
              ? '匿名玩家'
              : rv.player?.nickname || rv.player?.username || '玩家';
            return (
              <div
                key={rv.id}
                style={{
                  display: 'flex',
                  gap: 13,
                  padding: '15px 20px',
                  borderTop: '1px solid ' + COLORS.divider,
                }}
              >
                <Avatar name={author} seed={rv.is_anonymous ? rv.id : rv.player_id} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600 }}>{author}</span>
                    <Stars rating={rv.rating} />
                    <span style={{ marginLeft: 'auto', fontSize: 12, color: COLORS.textMuted }}>
                      {fromNow(rv.created_at)}
                    </span>
                  </div>
                  {rv.content && (
                    <div style={{ fontSize: 13.5, color: COLORS.textSecondary, marginTop: 7, lineHeight: 1.6 }}>
                      {rv.content}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </SectionCard>

      {/* 申请加入弹窗 */}
      <Modal
        title={`申请加入：${studio.name}`}
        open={applyOpen}
        onCancel={() => setApplyOpen(false)}
        onOk={submitApply}
        okText="提交申请"
        cancelText="取消"
        confirmLoading={submitting}
      >
        <Input.TextArea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="例如：主玩王者荣耀，2 年陪练经验，工作日晚间稳定在线。"
          rows={4}
          maxLength={200}
          showCount
        />
      </Modal>
    </div>
  );
}
