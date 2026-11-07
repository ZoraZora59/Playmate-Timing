'use client';

import { useEffect, useState } from 'react';
import { App, Spin } from 'antd';
import apiClient from '@/lib/api';
import { Review, ReviewTargetType } from '@/types';
import { COLORS } from '@/lib/theme';
import { EmptyState, Pill, Stars } from '@/components/ui';
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
        <div className="pm-card">
          <EmptyState title="还没有写过评价" hint="完成一局陪玩后，可在「游玩记录」里评价服务者或工作室" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-pop" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {reviews.map((rv) => (
        <div key={rv.id} className="pm-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Pill
              color={rv.target_type === ReviewTargetType.PROVIDER ? COLORS.teal : COLORS.point}
              bg={rv.target_type === ReviewTargetType.PROVIDER ? '#E3F8F5' : COLORS.pointSoft}
            >
              {rv.target_type === ReviewTargetType.PROVIDER ? '服务者评价' : '工作室评价'}
            </Pill>
            <Stars rating={rv.rating} size={14} />
            {rv.is_anonymous && <Pill>匿名</Pill>}
            <span style={{ marginLeft: 'auto', fontSize: 12, color: COLORS.textMuted }}>
              {formatDateTime(rv.created_at)}
            </span>
          </div>
          {rv.play_record && (
            <div style={{ fontSize: 12.5, color: COLORS.textMuted, marginTop: 10 }}>
              关联对局：{rv.play_record.game_name || '未命名对局'}
              {rv.play_record.game_mode ? ` · ${rv.play_record.game_mode}` : ''}
            </div>
          )}
          <div style={{ fontSize: 13.5, color: COLORS.textSecondary, marginTop: 8, lineHeight: 1.7 }}>
            {rv.content || '（未填写评价内容）'}
          </div>
        </div>
      ))}
    </div>
  );
}
