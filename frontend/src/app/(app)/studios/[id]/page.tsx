'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { App, Spin, Modal, Input, Button } from 'antd';
import apiClient from '@/lib/api';
import { COLORS } from '@/lib/theme';
import { initialOf, fromNow } from '@/lib/format';
import { Avatar, SectionCard, EmptyState, Stars } from '@/components/ui';
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

  const [studio, setStudio] = useState<Studio | null>(null);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [applyOpen, setApplyOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const [s, sum, rv] = await Promise.all([
        apiClient.getStudioById(studioId),
        apiClient.getReviewSummary(ReviewTargetType.STUDIO, studioId),
        apiClient.listReviewsByTarget(ReviewTargetType.STUDIO, studioId),
      ]);
      setStudio(s);
      setSummary(sum);
      setReviews(rv.list ?? []);
    } catch (e) {
      setNotFound(true);
      message.error(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [studioId, message]);

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

  if (notFound || !studio) {
    return (
      <div className="animate-pop">
        <SectionCard>
          <EmptyState title="未找到该工作室" hint="工作室可能已删除，或链接有误。" />
        </SectionCard>
      </div>
    );
  }

  const approved = (studio.relations ?? []).filter((r) => r.status === RelationStatus.APPROVED);
  const memberCount = approved.length;
  const avgRating = summary?.average_rating ?? 0;
  const reviewCount = summary?.count ?? reviews.length;
  const canApply = user?.role === UserRole.PROVIDER;

  return (
    <div className="animate-pop">
      {/* 工作室头卡 · 青紫渐变 */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 18,
          padding: '26px 28px',
          marginBottom: 18,
          background: 'linear-gradient(135deg,#16172A 0%,#2E2A6B 55%,#3D3490 100%)',
          color: '#fff',
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: -36,
            top: -36,
            width: 190,
            height: 190,
            borderRadius: '50%',
            background: 'radial-gradient(circle,rgba(21,200,216,.35),transparent 70%)',
          }}
        />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div
            className="font-display"
            style={{
              width: 60,
              height: 60,
              borderRadius: 16,
              background: 'rgba(255,255,255,.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 26,
              flex: 'none',
            }}
          >
            {initialOf(studio.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="font-display" style={{ fontSize: 24, fontWeight: 700, letterSpacing: '.2px' }}>
              {studio.name}
            </div>
            <div
              style={{
                fontSize: 13,
                color: 'rgba(255,255,255,.78)',
                marginTop: 6,
                lineHeight: 1.6,
                maxWidth: 620,
              }}
            >
              {studio.description || '这家工作室还没有填写简介。'}
            </div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.55)', marginTop: 10 }}>
              负责人 · {studio.owner?.nickname || studio.owner?.username || '未知'}
            </div>
          </div>
          {canApply && (
            <Button
              type="primary"
              onClick={() => setApplyOpen(true)}
              style={{
                flex: 'none',
                background: '#fff',
                borderColor: '#fff',
                color: COLORS.primaryDark,
                fontWeight: 600,
                borderRadius: 11,
                height: 40,
              }}
            >
              申请加入
            </Button>
          )}
        </div>

        {/* 一行统计 */}
        <div style={{ position: 'relative', display: 'flex', gap: 26, marginTop: 22 }}>
          <div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.55)' }}>成员数</div>
            <div className="font-display" style={{ fontWeight: 600, fontSize: 20, marginTop: 3 }}>
              {memberCount}{' '}
              <span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,.6)' }}>位</span>
            </div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,.15)' }} />
          <div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.55)' }}>平均评分</div>
            <div className="font-display" style={{ fontWeight: 600, fontSize: 20, marginTop: 3 }}>
              {avgRating > 0 ? (
                <Stars rating={avgRating} size={16} />
              ) : (
                <span style={{ color: 'rgba(255,255,255,.6)', fontSize: 16 }}>暂无</span>
              )}
            </div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,.15)' }} />
          <div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.55)' }}>评价数</div>
            <div className="font-display" style={{ fontWeight: 600, fontSize: 20, marginTop: 3 }}>
              {reviewCount}{' '}
              <span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,.6)' }}>条</span>
            </div>
          </div>
        </div>
      </div>

      {/* 成员区 */}
      <div style={{ marginBottom: 18 }}>
        <SectionCard title={`工作室成员 · ${memberCount}`}>
          {memberCount === 0 ? (
            <EmptyState title="暂无成员" hint="还没有服务者加入这家工作室。" />
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: '6px 0' }}>
              {approved.map((rel: ProviderStudioRelation) => {
                const name = rel.provider?.nickname || rel.provider?.username || '服务者';
                return (
                  <div
                    key={rel.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 11,
                      padding: '11px 16px 11px 11px',
                      border: '1px solid ' + COLORS.divider,
                      borderRadius: 13,
                      background: COLORS.bgSubtle,
                    }}
                  >
                    <Avatar name={name} seed={rel.provider_id} size={38} />
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{name}</span>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      {/* 评价区 */}
      <SectionCard title={`玩家评价 · ${reviewCount}`} bodyPad={false}>
        {reviews.length === 0 ? (
          <EmptyState title="暂无评价" hint="还没有玩家评价过这家工作室。" />
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
        title={`申请加入 · ${studio.name}`}
        open={applyOpen}
        onCancel={() => setApplyOpen(false)}
        onOk={submitApply}
        okText="提交申请"
        cancelText="取消"
        confirmLoading={submitting}
        okButtonProps={{ style: { borderRadius: 10 } }}
        cancelButtonProps={{ style: { borderRadius: 10 } }}
      >
        <div style={{ fontSize: 13, color: COLORS.textSecondary, margin: '8px 0 10px' }}>
          填写一段备注，向工作室说明你的主玩游戏与经验（可选）。
        </div>
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
