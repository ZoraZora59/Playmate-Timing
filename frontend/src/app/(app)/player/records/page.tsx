'use client';

import { useEffect, useState } from 'react';
import { App, Input, Modal, Rate, Segmented, Spin, Switch } from 'antd';
import apiClient from '@/lib/api';
import {
  EmptyState,
  LedgerTable,
  LoadError,
  Stamp,
  type LedgerColumn,
  type LedgerRow,
} from '@/components/ui';
import { formatBalance, formatDateTime, playStatusMeta } from '@/lib/format';
import { PlayStatus, ReviewTargetType, type PlayRecord } from '@/types';

const COLUMNS: LedgerColumn[] = [
  { key: 'game', label: '游戏 · 模式', width: '28%' },
  { key: 'provider', label: '服务者', width: '14%' },
  { key: 'duration', label: '时长', width: '10%', align: 'right', hide: 'sm' },
  { key: 'amount', label: '消费', width: '12%', align: 'right' },
  { key: 'start', label: '开始', width: '14%', align: 'right', hide: 'sm' },
  { key: 'status', label: '状态', width: '10%', align: 'right' },
  { key: 'action', label: '操作', width: '12%', align: 'right' },
];

export default function PlayerRecordsPage() {
  const { message } = App.useApp();
  const [records, setRecords] = useState<PlayRecord[]>([]);
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
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
      setError(false);
    } catch (e) {
      setError(true);
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

  if (error) {
    return (
      <div className="animate-pop">
        <LoadError onRetry={() => { setLoading(true); load(); }} />
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="animate-pop">
        <EmptyState title="暂无游玩记录" hint="服务者开局后会显示在这里。" />
      </div>
    );
  }

  const rows: LedgerRow[] = records.map((r) => {
    const meta = playStatusMeta(r.status);
    const settled = r.status === PlayStatus.COMPLETED;
    const canReviewAny =
      r.status === PlayStatus.COMPLETED &&
      (canReview(r, ReviewTargetType.PROVIDER) || canReview(r, ReviewTargetType.STUDIO));
    return {
      key: r.id,
      cells: {
        game: (
          <span>
            <span className="pm-cell-name-main" title={`${r.game_name || '未命名对局'}${r.game_mode ? ` · ${r.game_mode}` : ''}`}>
              {r.game_name || '未命名对局'}
              {r.game_mode ? <span style={{ fontWeight: 400, color: 'var(--ink-muted)' }}> · {r.game_mode}</span> : null}
            </span>
            <span className="pm-cell-mobile-meta">
              {formatDateTime(r.start_time)}
              {settled && r.duration != null ? ` · ${r.duration} 分钟` : ''}
            </span>
          </span>
        ),
        provider: <span style={{ fontSize: 13 }}>{r.provider?.nickname || r.provider?.username || '—'}</span>,
        duration: (
          <span className="num" style={{ fontSize: 12.5 }}>
            {settled && r.duration != null ? `${r.duration} 分钟` : '—'}
          </span>
        ),
        amount: (
          <span className="num" style={{ fontSize: 12.5 }}>
            {settled && r.amount != null && r.settle_type ? formatBalance(r.settle_type, r.amount) : '—'}
          </span>
        ),
        start: <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{formatDateTime(r.start_time)}</span>,
        status: <Stamp tone={r.status === PlayStatus.ACTIVE ? 'ink' : 'muted'}>{meta.label}</Stamp>,
        action: canReviewAny ? (
          <button type="button" className="pm-row-action" onClick={() => openReview(r)}>
            评价
          </button>
        ) : null,
      },
    };
  });

  return (
    <div className="animate-pop">
      <LedgerTable columns={COLUMNS} rows={rows} caption="我的游玩记录" />

      <Modal
        title="评价本局"
        open={!!reviewTarget}
        onCancel={() => setReviewTarget(null)}
        onOk={submitReview}
        okText="提交评价"
        cancelText="取消"
        confirmLoading={submitting}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 4 }}>
          <div style={{ fontSize: 13, color: 'var(--ink-secondary)', lineHeight: 1.6 }}>
            {reviewTarget?.game_name || '未命名对局'}
            {reviewTarget?.game_mode ? ` · ${reviewTarget.game_mode}` : ''}
            {reviewTarget?.provider?.nickname ? ` · ${reviewTarget.provider.nickname}` : ''}
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
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-secondary)', marginBottom: 6 }}>评分</div>
            <Rate value={rating} onChange={setRating} />
          </div>

          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-secondary)', marginBottom: 6 }}>评价内容</div>
            <Input.TextArea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              maxLength={300}
              showCount
              placeholder="可选"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Switch checked={anonymous} onChange={setAnonymous} />
            <span style={{ fontSize: 13, color: 'var(--ink-secondary)' }}>匿名评价</span>
          </div>
        </div>
      </Modal>
    </div>
  );
}
