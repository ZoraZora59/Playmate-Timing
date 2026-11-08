'use client';

import { useEffect, useState } from 'react';
import { App, Spin } from 'antd';
import apiClient from '@/lib/api';
import { Review, ReviewTargetType } from '@/types';
import { EmptyState, Stamp, Stars } from '@/components/ui';
import { formatDateTime } from '@/lib/format';

export default function PlayerReviewsPage() {
  const { message } = App.useApp();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.listMyReviews({ page_size: 100 });
        setReviews(res.list || []);
      } catch (e) {
        message.error(e instanceof Error ? e.message : '加载失败');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="animate-pop">
        <EmptyState title="还没有写过评价" />
      </div>
    );
  }

  return (
    <div className="animate-pop pm-review-list">
      {reviews.map((rv) => (
        <article key={rv.id} className="pm-review">
          <div className="pm-review-head">
            <Stamp tone="muted">{rv.target_type === ReviewTargetType.PROVIDER ? '服务者' : '工作室'}</Stamp>
            <Stars rating={rv.rating} size={14} />
            {rv.is_anonymous && <span className="pm-review-anon">匿名</span>}
            {rv.play_record && (
              <span className="pm-review-game">
                {rv.play_record.game_name || '未命名对局'}
                {rv.play_record.game_mode ? ` · ${rv.play_record.game_mode}` : ''}
              </span>
            )}
            <span className="pm-review-time">{formatDateTime(rv.created_at)}</span>
          </div>
          <p className="pm-review-text">{rv.content || '—'}</p>
        </article>
      ))}
    </div>
  );
}
