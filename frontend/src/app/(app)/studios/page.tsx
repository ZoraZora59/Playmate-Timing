'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { App, Input, Pagination, Spin } from 'antd';
import apiClient from '@/lib/api';
import { Studio } from '@/types';
import { Avatar, EmptyState } from '@/components/ui';
import { COLORS } from '@/lib/theme';

const PAGE_SIZE = 12;

export default function StudiosPage() {
  const { message } = App.useApp();
  const router = useRouter();

  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [studios, setStudios] = useState<Studio[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async (kw: string, p: number) => {
    setLoading(true);
    try {
      const res = await apiClient.getStudioList({ keyword: kw, page: p, page_size: PAGE_SIZE });
      setStudios(res.list);
      setTotal(res.total);
    } catch (e) {
      message.error(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(search, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page]);

  const onSearch = (value: string) => {
    setPage(1);
    setSearch(value.trim());
  };

  return (
    <div className="animate-pop">
      {/* 搜索 */}
      <div style={{ marginBottom: 18, maxWidth: 420 }}>
        <Input.Search
          allowClear
          size="large"
          placeholder="搜索工作室名称…"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onSearch={onSearch}
          enterButton
        />
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center' }}>
          <Spin size="large" />
        </div>
      ) : studios.length === 0 ? (
        <div className="pm-card" style={{ padding: '12px 20px' }}>
          <EmptyState
            title="没有找到工作室"
            hint={search ? `没有匹配「${search}」的工作室，换个关键词试试。` : '暂时还没有可浏览的工作室。'}
          />
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 18,
            }}
          >
            {studios.map((studio) => (
              <div
                key={studio.id}
                className="pm-card"
                style={{
                  padding: '20px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <Avatar name={studio.name} seed={studio.id} size={46} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: COLORS.textPrimary,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {studio.name}
                    </div>
                    {studio.owner?.nickname && (
                      <div
                        style={{
                          fontSize: 12.5,
                          color: COLORS.textMuted,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        负责人 · {studio.owner.nickname}
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: COLORS.textSecondary,
                    marginBottom: 18,
                    minHeight: 42,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {studio.description || '该工作室还没有填写简介。'}
                </div>

                <button
                  onClick={() => router.push(`/studios/${studio.id}`)}
                  style={{
                    marginTop: 'auto',
                    padding: 11,
                    border: `1px solid ${COLORS.border}`,
                    background: COLORS.bgCard,
                    borderRadius: 11,
                    color: COLORS.primary,
                    font: "600 13px 'Noto Sans SC', sans-serif",
                    cursor: 'pointer',
                  }}
                >
                  查看详情 →
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
            <Pagination
              current={page}
              total={total}
              pageSize={PAGE_SIZE}
              showSizeChanger={false}
              onChange={(p) => setPage(p)}
            />
          </div>
        </>
      )}
    </div>
  );
}
