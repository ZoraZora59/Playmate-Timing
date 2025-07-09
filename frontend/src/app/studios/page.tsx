'use client';

import React, { useEffect, useState } from 'react';
import { 
  Layout, 
  Card, 
  Row, 
  Col, 
  Typography, 
  Input, 
  Button, 
  Pagination,
  message,
  Avatar,
  Space,
  Tag
} from 'antd';
import { SearchOutlined, UserOutlined, CalendarOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { Studio, PageResponse } from '@/types';
import apiClient from '@/lib/api';

const { Header, Content } = Layout;
const { Title, Paragraph } = Typography;
const { Search } = Input;

export default function StudiosPage() {
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0,
  });
  const [keyword, setKeyword] = useState('');

  const fetchStudios = async (page = 1, searchKeyword = '') => {
    setLoading(true);
    try {
      const response: PageResponse<Studio> = await apiClient.getStudioList({
        page,
        page_size: pagination.pageSize,
        keyword: searchKeyword || undefined,
      });
      
      setStudios(response.list);
      setPagination(prev => ({
        ...prev,
        current: page,
        total: response.total,
      }));
    } catch (error) {
      message.error('获取工作室列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudios();
  }, []);

  const handleSearch = (value: string) => {
    setKeyword(value);
    fetchStudios(1, value);
  };

  const handlePageChange = (page: number) => {
    fetchStudios(page, keyword);
  };

  return (
    <Layout className="min-h-screen">
      <Header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto flex justify-between items-center h-full">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Title level={3} className="m-0 text-blue-600 cursor-pointer">
                陪玩平台
              </Title>
            </Link>
          </div>
          <Space>
            <Link href="/auth/login">
              <Button>登录</Button>
            </Link>
            <Link href="/auth/register">
              <Button type="primary">注册</Button>
            </Link>
          </Space>
        </div>
      </Header>

      <Content className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* 页面标题和搜索 */}
          <div className="mb-8">
            <Title level={2}>工作室列表</Title>
            <Paragraph className="text-gray-600 mb-4">
              浏览所有活跃的陪玩工作室，找到最适合您的服务
            </Paragraph>
            
            <div className="max-w-md">
              <Search
                placeholder="搜索工作室名称或描述"
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                onSearch={handleSearch}
                loading={loading}
              />
            </div>
          </div>

          {/* 工作室卡片列表 */}
          <Row gutter={[24, 24]} className="mb-8">
            {studios.map((studio) => (
              <Col xs={24} sm={12} lg={8} xl={6} key={studio.id}>
                <Card
                  hoverable
                  className="h-full"
                  cover={
                    <div className="h-32 bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                      {studio.logo ? (
                        <img 
                          src={studio.logo} 
                          alt={studio.name}
                          className="h-16 w-16 rounded-full object-cover bg-white"
                        />
                      ) : (
                        <Avatar size={64} icon={<UserOutlined />} />
                      )}
                    </div>
                  }
                  actions={[
                    <Link href={`/studios/${studio.id}`} key="view">
                      <Button type="link">查看详情</Button>
                    </Link>
                  ]}
                >
                  <Card.Meta
                    title={
                      <div className="flex items-center justify-between">
                        <span className="truncate">{studio.name}</span>
                        <Tag color="green">活跃</Tag>
                      </div>
                    }
                    description={
                      <div className="space-y-2">
                        <Paragraph 
                          className="text-gray-600 mb-2" 
                          ellipsis={{ rows: 2, tooltip: studio.description }}
                        >
                          {studio.description || '暂无描述'}
                        </Paragraph>
                        
                        <div className="flex items-center text-sm text-gray-500">
                          <UserOutlined className="mr-1" />
                          <span>所有者: {studio.owner?.nickname || studio.owner?.username}</span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-500">
                          <CalendarOutlined className="mr-1" />
                          <span>创建: {new Date(studio.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>

          {/* 空状态 */}
          {!loading && studios.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">
                <UserOutlined />
              </div>
              <Title level={4} className="text-gray-600">
                {keyword ? '未找到相关工作室' : '暂无工作室'}
              </Title>
              <Paragraph className="text-gray-500">
                {keyword ? '请尝试其他关键词搜索' : '目前还没有工作室注册'}
              </Paragraph>
              {keyword && (
                <Button onClick={() => handleSearch('')}>
                  清除搜索条件
                </Button>
              )}
            </div>
          )}

          {/* 分页 */}
          {pagination.total > 0 && (
            <div className="flex justify-center mt-8">
              <Pagination
                current={pagination.current}
                total={pagination.total}
                pageSize={pagination.pageSize}
                onChange={handlePageChange}
                showSizeChanger={false}
                showQuickJumper
                showTotal={(total, range) =>
                  `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
                }
              />
            </div>
          )}
        </div>
      </Content>
    </Layout>
  );
}