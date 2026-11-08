'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Spin } from 'antd';
import apiClient from '@/lib/api';
import { Review, ReviewTargetType } from '@/types';
import { EmptyState, LoadError, Stamp, Stars, TextAction } from '@/components/ui';
import { formatDateTime } from '@/lib/format';

export default function PlayerReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.listMyReviews({ page_size: 100 });
      setReviews(res.list || []);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
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

  if (reviews.length === 0) {
    return (
      <div className="animate-pop">
        <EmptyState
          title="还没有写过评价"
          action={<TextAction onClick={() => router.push('/player/records')}>去游玩记录</TextAction>}
        />
      </div>
    );
  }

  return (
    <div className="animate-pop pm-review-list">
      {reviews.map((rv) => (
        <article key={rv.id} className="pm-review">
          <div className="pm-review-head">
            <Stamp tone="muted">{rv.target_type === ReviewTargetType.PROVIDER ? '服务者' : '工作室'}</Stamp>
            {rv.target_name && <span className="pm-review-target">{rv.target_name}</span>}
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
