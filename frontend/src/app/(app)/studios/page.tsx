'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { App, Input, Pagination, Spin } from 'antd';
import apiClient from '@/lib/api';
import { Studio } from '@/types';
import { EmptyState } from '@/components/ui';

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
      <div style={{ marginBottom: 20, maxWidth: 380 }}>
        <Input.Search
          allowClear
          size="large"
          placeholder="搜索工作室"
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
        <EmptyState title="没有找到工作室" />
      ) : (
        <>
          <div className="pm-studio-list">
            {studios.map((studio) => (
              <button
                key={studio.id}
                type="button"
                className="pm-studio-row"
                onClick={() => router.push(`/studios/${studio.id}`)}
              >
                <span className="pm-studio-main">
                  <span className="pm-studio-name">{studio.name}</span>
                  <span className="pm-studio-desc">{studio.description || '暂无简介'}</span>
                </span>
                <span className="pm-studio-owner">
                  {studio.owner?.nickname ? `负责人 ${studio.owner.nickname}` : ''}
                </span>
                <span className="pm-studio-go">查看</span>
              </button>
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
