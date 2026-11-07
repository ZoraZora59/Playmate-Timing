'use client';

import { useEffect, useState } from 'react';
import { App, Input, Modal, Rate, Segmented, Spin, Switch } from 'antd';
import apiClient from '@/lib/api';
import { Pill, EmptyState } from '@/components/ui';
import { COLORS } from '@/lib/theme';
import { formatBalance, fromNow, playStatusMeta } from '@/lib/format';
import { PlayStatus, ReviewTargetType, type PlayRecord } from '@/types';

export default function PlayerRecordsPage() {
  const { message } = App.useApp();
  const [records, setRecords] = useState<PlayRecord[]>([]);
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [reviewTarget, setReviewTarget] = useState<PlayRecord | null>(null);
  const [targetType, setTargetType] = useState<ReviewTargetType>(ReviewTargetType.PROVIDER);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const [res, reviews] = await Promise.all([
        apiClient.listMyRecords({ page_size: 100 }),
        apiClient.listMyReviews({ page_size: 100 }),
      ]);
      setRecords(res.list);
      const keys = new Set<string>();
      for (const rv of reviews.list || []) {
        if (rv.play_record_id) keys.add(`${rv.play_record_id}:${rv.target_type}`);
      }
      setReviewed(keys);
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

  const canReview = (r: PlayRecord, type: ReviewTargetType) => {
    if (reviewed.has(`${r.id}:${type}`)) return false;
    if (type === ReviewTargetType.STUDIO) return r.studio_id > 0;
    return true;
  };

  const openReview = (r: PlayRecord) => {
    setReviewTarget(r);
    setTargetType(canReview(r, ReviewTargetType.PROVIDER) ? ReviewTargetType.PROVIDER : ReviewTargetType.STUDIO);
    setRating(5);
    setContent('');
    setAnonymous(false);
  };

  const submitReview = async () => {
    if (!reviewTarget) return;
    setSubmitting(true);
    try {
      await apiClient.createReview({
        target_type: targetType,
        target_id: targetType === ReviewTargetType.PROVIDER ? reviewTarget.provider_id : reviewTarget.studio_id,
        rating,
        content: content.trim() || undefined,
        is_anonymous: anonymous,
        play_record_id: reviewTarget.id,
      });
      message.success('评价已提交');
      setReviewed((prev) => new Set(prev).add(`${reviewTarget.id}:${targetType}`));
      setReviewTarget(null);
    } catch (e) {
      message.error(e instanceof Error ? e.message : '评价失败');
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

  if (records.length === 0) {
    return (
      <div className="animate-pop">
        <EmptyState title="暂无游玩记录" hint="开始一局陪玩后，记录会出现在这里" />
      </div>
    );
  }

  return (
    <div className="animate-pop" style={{ position: 'relative', paddingLeft: 8 }}>
      {records.map((r) => {
        const isActive = r.status === PlayStatus.ACTIVE;
        const meta = playStatusMeta(r.status);
        const dotColor = isActive ? COLORS.money : COLORS.border;
        const canReviewAny =
          r.status === PlayStatus.COMPLETED &&
          (canReview(r, ReviewTargetType.PROVIDER) || canReview(r, ReviewTargetType.STUDIO));
        return (
          <div key={r.id} style={{ display: 'flex', gap: 18, paddingBottom: 6 }}>
            {/* 左侧时间线：圆点 + 竖线 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 14 }}>
              <span
                className={isActive ? 'live-dot' : undefined}
                style={{
                  width: 13,
                  height: 13,
                  borderRadius: '50%',
                  border: `3px solid ${dotColor}`,
                  background: '#fff',
                  flex: 'none',
                  marginTop: 22,
                }}
              />
              <span style={{ flex: 1, width: 2, background: COLORS.border }} />
            </div>

            {/* 右侧卡片 */}
            <div
              style={{
                flex: 1,
                marginBottom: 14,
                background: COLORS.bgCard,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 15,
                padding: '17px 20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{r.game_name || '未命名对局'}</div>
                {r.game_mode && <Pill>{r.game_mode}</Pill>}
                <span style={{ marginLeft: 'auto', fontSize: 12, color: COLORS.textMuted }}>
                  {fromNow(r.start_time)}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 26, marginTop: 13 }}>
                <div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>服务者</div>
                  <div style={{ fontSize: 13.5, fontWeight: 500, marginTop: 2 }}>
                    {r.provider?.nickname || '—'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>时长</div>
                  <div style={{ fontSize: 13.5, fontWeight: 500, marginTop: 2 }}>
                    {r.duration != null ? `${r.duration} 分钟` : '—'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>消费</div>
                  <div style={{ fontSize: 13.5, fontWeight: 500, marginTop: 2 }}>
                    {r.amount != null && r.settle_type
                      ? formatBalance(r.settle_type, r.amount)
                      : '—'}
                  </div>
                </div>
                <div style={{ marginLeft: 'auto', alignSelf: 'center', display: 'flex', alignItems: 'center', gap: 10 }}>
                  {canReviewAny && (
                    <button
                      onClick={() => openReview(r)}
                      style={{
                        border: `1px solid ${COLORS.primary}`,
                        background: '#fff',
                        color: COLORS.primary,
                        borderRadius: 9,
                        padding: '6px 14px',
                        fontSize: 12.5,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      评价
                    </button>
                  )}
                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      padding: '5px 13px',
                      borderRadius: 20,
                      background: meta.color,
                      color: '#fff',
                      opacity: 0.92,
                    }}
                  >
                    {meta.label}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <Modal
        title="评价本局"
        open={!!reviewTarget}
        onCancel={() => setReviewTarget(null)}
        onOk={submitReview}
        okText="提交评价"
        cancelText="取消"
        confirmLoading={submitting}
        okButtonProps={{ style: { borderRadius: 10 } }}
        cancelButtonProps={{ style: { borderRadius: 10 } }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 4 }}>
          <div style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.6 }}>
            {reviewTarget?.game_name || '未命名对局'}
            {reviewTarget?.game_mode ? ` · ${reviewTarget.game_mode}` : ''}
            {' · '}
            {targetType === ReviewTargetType.PROVIDER
              ? reviewTarget?.provider?.nickname || reviewTarget?.provider?.username || '服务者'
              : reviewTarget?.studio?.name || '工作室'}
          </div>

          <Segmented
            value={targetType}
            onChange={(v) => setTargetType(v as ReviewTargetType)}
            options={[
              ...(reviewTarget && canReview(reviewTarget, ReviewTargetType.PROVIDER)
                ? [{ label: '评价服务者', value: ReviewTargetType.PROVIDER }]
                : []),
              ...(reviewTarget && canReview(reviewTarget, ReviewTargetType.STUDIO)
                ? [{ label: '评价工作室', value: ReviewTargetType.STUDIO }]
                : []),
            ]}
          />

          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 6 }}>评分</div>
            <Rate value={rating} onChange={setRating} />
          </div>

          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 6 }}>评价内容</div>
            <Input.TextArea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              maxLength={300}
              showCount
              placeholder="说说这次陪玩的体验吧（可选）"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Switch checked={anonymous} onChange={setAnonymous} />
            <span style={{ fontSize: 13, color: COLORS.textSecondary }}>匿名评价</span>
          </div>
        </div>
      </Modal>
    </div>
  );
}
