'use client';

import React, { useEffect } from 'react';
import { Layout, Card, Row, Col, Typography, Button, Statistic, Space } from 'antd';
import { 
  UserOutlined, 
  WalletOutlined, 
  ShopOutlined, 
  LogoutOutlined,
  SettingOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { UserRole } from '@/types';

const { Header, Content } = Layout;
const { Title, Paragraph } = Typography;

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, loadProfile } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (!user) {
      loadProfile();
    }
  }, [isAuthenticated, user, router, loadProfile]);

  const handleLogout = () => {
    logout();
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">加载中...</div>;
  }

  const getRoleDisplay = (role: UserRole) => {
    switch (role) {
      case UserRole.PLAYER:
        return '玩家';
      case UserRole.PROVIDER:
        return '陪玩服务者';
      case UserRole.STUDIO:
        return '工作室';
      default:
        return role;
    }
  };

  const getQuickActions = () => {
    switch (user.role) {
      case UserRole.PLAYER:
        return [
          { title: '查看余额', href: '/player/balances', icon: <WalletOutlined /> },
          { title: '浏览工作室', href: '/studios', icon: <ShopOutlined /> },
        ];
      case UserRole.PROVIDER:
        return [
          { title: '余额管理', href: '/provider/balances', icon: <WalletOutlined /> },
          { title: '申请工作室', href: '/provider/studios', icon: <ShopOutlined /> },
        ];
      case UserRole.STUDIO:
        return [
          { title: '工作室管理', href: '/studio/manage', icon: <ShopOutlined /> },
          { title: '申请管理', href: '/studio/applications', icon: <UserOutlined /> },
        ];
      default:
        return [];
    }
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
            <span>欢迎, {user.nickname || user.username}</span>
            <Button icon={<SettingOutlined />}>
              设置
            </Button>
            <Button icon={<LogoutOutlined />} onClick={handleLogout}>
              退出
            </Button>
          </Space>
        </div>
      </Header>

      <Content className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* 用户信息卡片 */}
          <Card className="mb-6">
            <Row gutter={24} align="middle">
              <Col>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserOutlined className="text-2xl text-blue-600" />
                </div>
              </Col>
              <Col flex="auto">
                <Title level={3} className="mb-1">
                  {user.nickname || user.username}
                </Title>
                <Paragraph className="mb-2 text-gray-600">
                  {getRoleDisplay(user.role)} • {user.email}
                </Paragraph>
                <Space>
                  <span className="text-sm text-gray-500">
                    注册时间: {new Date(user.created_at).toLocaleDateString()}
                  </span>
                  {user.phone && (
                    <span className="text-sm text-gray-500">
                      手机: {user.phone}
                    </span>
                  )}
                </Space>
              </Col>
            </Row>
          </Card>

          {/* 统计卡片 */}
          <Row gutter={[24, 24]} className="mb-6">
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="账户状态"
                  value={user.is_active ? "正常" : "已禁用"}
                  valueStyle={{ color: user.is_active ? '#3f8600' : '#cf1322' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="角色权限"
                  value={getRoleDisplay(user.role)}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="用户ID"
                  value={user.id}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>

          {/* 快捷操作 */}
          <Card title="快捷操作" className="mb-6">
            <Row gutter={[16, 16]}>
              {getQuickActions().map((action, index) => (
                <Col xs={24} sm={12} md={8} lg={6} key={index}>
                  <Link href={action.href}>
                    <Card 
                      hoverable 
                      className="text-center"
                      bodyStyle={{ padding: '24px 16px' }}
                    >
                      <div className="text-2xl mb-2 text-blue-600">
                        {action.icon}
                      </div>
                      <div className="font-medium">{action.title}</div>
                    </Card>
                  </Link>
                </Col>
              ))}
            </Row>
          </Card>

          {/* 角色特定内容 */}
          {user.role === UserRole.PLAYER && (
            <Card title="玩家专区">
              <Paragraph>
                作为玩家，您可以：
              </Paragraph>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>查看在各个工作室和服务者的余额</li>
                <li>查看详细的余额变动记录</li>
                <li>浏览工作室和服务者信息</li>
                <li>查看游玩记录和评价</li>
              </ul>
            </Card>
          )}

          {user.role === UserRole.PROVIDER && (
            <Card title="服务者专区">
              <Paragraph>
                作为陪玩服务者，您可以：
              </Paragraph>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>为玩家充值和管理余额</li>
                <li>申请加入多个工作室</li>
                <li>查看余额统计和收益概览</li>
                <li>管理客户关系</li>
              </ul>
            </Card>
          )}

          {user.role === UserRole.STUDIO && (
            <Card title="工作室专区">
              <Paragraph>
                作为工作室，您可以：
              </Paragraph>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>创建和管理工作室信息</li>
                <li>审批服务者加入申请</li>
                <li>统一管理关联的服务者</li>
                <li>为玩家充值和管理余额</li>
              </ul>
            </Card>
          )}
        </div>
      </Content>
    </Layout>
  );
}