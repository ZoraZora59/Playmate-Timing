'use client';

import React from 'react';
import { Form, Input, Button, Card, Typography, message, Space, Divider } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { LoginForm } from '@/types';

const { Title, Paragraph } = Typography;

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [form] = Form.useForm();

  const handleSubmit = async (values: LoginForm) => {
    try {
      clearError();
      await login(values);
      message.success('登录成功！');
      router.push('/dashboard');
    } catch (error) {
      message.error('登录失败，请检查用户名和密码');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card className="shadow-lg">
          <div className="text-center mb-8">
            <Title level={2} className="text-gray-900">
              登录账户
            </Title>
            <Paragraph className="text-gray-600">
              登录您的陪玩平台账户
            </Paragraph>
          </div>

          <Form
            form={form}
            name="login"
            onFinish={handleSubmit}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="username"
              label="用户名或邮箱"
              rules={[
                { required: true, message: '请输入用户名或邮箱！' },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="请输入用户名或邮箱"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码！' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请输入密码"
              />
            </Form.Item>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="w-full"
                loading={isLoading}
              >
                登录
              </Button>
            </Form.Item>
          </Form>

          <Divider>或</Divider>

          <div className="text-center">
            <Space direction="vertical" size="small">
              <Paragraph className="text-gray-600 mb-0">
                还没有账户？
              </Paragraph>
              <Link href="/auth/register">
                <Button type="link" className="p-0">
                  立即注册
                </Button>
              </Link>
            </Space>
          </div>
        </Card>

        <div className="mt-8 text-center">
          <Link href="/">
            <Button type="link">
              返回首页
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}