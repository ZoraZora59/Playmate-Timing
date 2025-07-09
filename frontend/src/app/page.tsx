'use client';

import React, { useEffect } from 'react';
import { Layout, Button, Card, Row, Col, Typography, Space, Divider } from 'antd';
import { 
  UserOutlined, 
  TeamOutlined, 
  WalletOutlined, 
  StarOutlined,
  ShopOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';

const { Header, Content, Footer } = Layout;
const { Title, Paragraph } = Typography;

export default function Home() {
  const { user, isAuthenticated, loadProfile } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && !user) {
      loadProfile();
    }
  }, [isAuthenticated, user, loadProfile]);

  const features = [
    {
      icon: <UserOutlined style={{ fontSize: '2rem', color: '#1890ff' }} />,
      title: '多角色支持',
      description: '支持玩家、陪玩服务者、工作室三种角色，满足不同用户需求'
    },
    {
      icon: <ShopOutlined style={{ fontSize: '2rem', color: '#52c41a' }} />,
      title: '工作室管理',
      description: '工作室可以管理多个服务者，批准关联申请，统一管理服务'
    },
    {
      icon: <WalletOutlined style={{ fontSize: '2rem', color: '#faad14' }} />,
      title: '余额管理',
      description: '支持金额、时间、点数等多种余额类型，完整的充值消费记录'
    },
    {
      icon: <PlayCircleOutlined style={{ fontSize: '2rem', color: '#722ed1' }} />,
      title: '游玩记录',
      description: '详细记录每次游玩服务，包含时长、消费等信息'
    },
    {
      icon: <StarOutlined style={{ fontSize: '2rem', color: '#eb2f96' }} />,
      title: '评价系统',
      description: '玩家可以对工作室和服务者进行评价，建立信誉体系'
    },
    {
      icon: <TeamOutlined style={{ fontSize: '2rem', color: '#13c2c2' }} />,
      title: '关联管理',
      description: '灵活的服务者与工作室关联机制，支持独立服务者'
    }
  ];

  return (
    <Layout className="min-h-screen">
      <Header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto flex justify-between items-center h-full">
          <div className="flex items-center space-x-4">
            <Title level={3} className="m-0 text-blue-600">
              陪玩平台
            </Title>
          </div>
          <Space>
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span>欢迎, {user?.nickname || user?.username}</span>
                <Link href="/dashboard">
                  <Button type="primary">控制台</Button>
                </Link>
              </div>
            ) : (
              <div className="space-x-2">
                <Link href="/auth/login">
                  <Button>登录</Button>
                </Link>
                <Link href="/auth/register">
                  <Button type="primary">注册</Button>
                </Link>
              </div>
            )}
          </Space>
        </div>
      </Header>

      <Content>
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <Title level={1} className="text-white mb-4">
              专业的陪玩服务信息平台
            </Title>
            <Paragraph className="text-xl mb-8 text-white">
              连接陪玩工作室、服务者与玩家，提供完整的服务管理和信息查询平台
            </Paragraph>
            <Space size="large">
              {!isAuthenticated && (
                <>
                  <Link href="/auth/register">
                    <Button size="large" type="primary" className="bg-white text-blue-600 border-white hover:bg-gray-100">
                      立即注册
                    </Button>
                  </Link>
                  <Link href="/studios">
                    <Button size="large" className="text-white border-white hover:bg-white hover:text-blue-600">
                      浏览工作室
                    </Button>
                  </Link>
                </>
              )}
              {isAuthenticated && (
                <Link href="/dashboard">
                  <Button size="large" type="primary" className="bg-white text-blue-600 border-white hover:bg-gray-100">
                    进入控制台
                  </Button>
                </Link>
              )}
            </Space>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <Title level={2}>平台特色</Title>
              <Paragraph className="text-lg text-gray-600">
                专为陪玩行业设计的全方位信息管理平台
              </Paragraph>
            </div>
            
            <Row gutter={[24, 24]}>
              {features.map((feature, index) => (
                <Col xs={24} md={12} lg={8} key={index}>
                  <Card className="h-full text-center hover:shadow-lg transition-shadow">
                    <div className="mb-4">{feature.icon}</div>
                    <Title level={4}>{feature.title}</Title>
                    <Paragraph className="text-gray-600">
                      {feature.description}
                    </Paragraph>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <Title level={2}>开始使用</Title>
            <Paragraph className="text-lg mb-8 text-gray-600">
              根据您的身份选择合适的注册类型，享受专业的陪玩服务平台
            </Paragraph>
            
            <Row gutter={24}>
              <Col xs={24} md={8}>
                <Card className="text-center hover:shadow-lg transition-shadow">
                  <UserOutlined style={{ fontSize: '3rem', color: '#1890ff' }} />
                  <Title level={4}>玩家</Title>
                  <Paragraph>
                    查看余额、游玩记录、评价服务者和工作室
                  </Paragraph>
                  {!isAuthenticated && (
                    <Link href="/auth/register?role=player">
                      <Button type="primary">注册为玩家</Button>
                    </Link>
                  )}
                </Card>
              </Col>
              
              <Col xs={24} md={8}>
                <Card className="text-center hover:shadow-lg transition-shadow">
                  <TeamOutlined style={{ fontSize: '3rem', color: '#52c41a' }} />
                  <Title level={4}>陪玩服务者</Title>
                  <Paragraph>
                    管理客户余额、申请加入工作室、查看收益
                  </Paragraph>
                  {!isAuthenticated && (
                    <Link href="/auth/register?role=provider">
                      <Button type="primary">注册为服务者</Button>
                    </Link>
                  )}
                </Card>
              </Col>
              
              <Col xs={24} md={8}>
                <Card className="text-center hover:shadow-lg transition-shadow">
                  <ShopOutlined style={{ fontSize: '3rem', color: '#faad14' }} />
                  <Title level={4}>工作室</Title>
                  <Paragraph>
                    创建工作室、管理服务者、统一业务管理
                  </Paragraph>
                  {!isAuthenticated && (
                    <Link href="/auth/register?role=studio">
                      <Button type="primary">注册为工作室</Button>
                    </Link>
                  )}
                </Card>
              </Col>
            </Row>
          </div>
        </div>
      </Content>

      <Footer className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}>
              <Title level={4} className="text-white">陪玩服务平台</Title>
              <Paragraph className="text-gray-300">
                专业的陪玩工作室、服务者、玩家信息管理平台
              </Paragraph>
            </Col>
            <Col xs={24} md={8}>
              <Title level={5} className="text-white">快速链接</Title>
              <div className="space-y-2">
                <div><Link href="/studios" className="text-gray-300 hover:text-white">工作室列表</Link></div>
                <div><Link href="/auth/login" className="text-gray-300 hover:text-white">用户登录</Link></div>
                <div><Link href="/auth/register" className="text-gray-300 hover:text-white">用户注册</Link></div>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <Title level={5} className="text-white">联系我们</Title>
              <Paragraph className="text-gray-300">
                如有问题或建议，请随时联系我们
              </Paragraph>
            </Col>
          </Row>
          <Divider className="border-gray-600" />
          <div className="text-center text-gray-400">
            © 2024 陪玩服务信息平台. All rights reserved.
          </div>
        </div>
      </Footer>
    </Layout>
  );
}
