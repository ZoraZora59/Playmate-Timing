'use client';

import React, { useEffect } from 'react';
import { Form, Input, Button, Card, Typography, message, Space, Divider, Select } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, PhoneOutlined, EditOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { RegisterForm, UserRole } from '@/types';

const { Title, Paragraph } = Typography;
const { Option } = Select;

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, isLoading, error, clearError } = useAuthStore();
  const [form] = Form.useForm();

  useEffect(() => {
    // 从URL参数获取角色预设
    const role = searchParams.get('role');
    if (role && Object.values(UserRole).includes(role as UserRole)) {
      form.setFieldsValue({ role: role as UserRole });
    }
  }, [searchParams, form]);

  const handleSubmit = async (values: RegisterForm) => {
    try {
      clearError();
      await register(values);
      message.success('注册成功！');
      router.push('/dashboard');
    } catch (error) {
      message.error('注册失败，请检查输入信息');
    }
  };

  const roleOptions = [
    {
      value: UserRole.PLAYER,
      label: '玩家',
      description: '享受陪玩服务，查看余额和游玩记录'
    },
    {
      value: UserRole.PROVIDER,
      label: '陪玩服务者',
      description: '提供陪玩服务，管理客户余额'
    },
    {
      value: UserRole.STUDIO,
      label: '工作室',
      description: '管理多个服务者，统一业务运营'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card className="shadow-lg">
          <div className="text-center mb-8">
            <Title level={2} className="text-gray-900">
              创建账户
            </Title>
            <Paragraph className="text-gray-600">
              加入陪玩服务平台，开始您的陪玩之旅
            </Paragraph>
          </div>

          <Form
            form={form}
            name="register"
            onFinish={handleSubmit}
            layout="vertical"
            size="large"
            initialValues={{
              role: UserRole.PLAYER
            }}
          >
            <Form.Item
              name="username"
              label="用户名"
              rules={[
                { required: true, message: '请输入用户名！' },
                { min: 3, message: '用户名至少3个字符！' },
                { max: 50, message: '用户名不能超过50个字符！' },
                { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线！' }
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="请输入用户名"
              />
            </Form.Item>

            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { required: true, message: '请输入邮箱！' },
                { type: 'email', message: '请输入有效的邮箱地址！' }
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="请输入邮箱"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码！' },
                { min: 6, message: '密码至少6个字符！' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请输入密码"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="确认密码"
              dependencies={['password']}
              rules={[
                { required: true, message: '请确认密码！' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次密码输入不一致！'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请再次输入密码"
              />
            </Form.Item>

            <Form.Item
              name="phone"
              label="手机号"
            >
              <Input
                prefix={<PhoneOutlined />}
                placeholder="请输入手机号（可选）"
              />
            </Form.Item>

            <Form.Item
              name="nickname"
              label="昵称"
            >
              <Input
                prefix={<EditOutlined />}
                placeholder="请输入昵称（可选）"
              />
            </Form.Item>

            <Form.Item
              name="role"
              label="角色类型"
              rules={[
                { required: true, message: '请选择角色类型！' }
              ]}
            >
              <Select placeholder="请选择您的角色">
                {roleOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-gray-500">{option.description}</div>
                    </div>
                  </Option>
                ))}
              </Select>
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
                注册
              </Button>
            </Form.Item>
          </Form>

          <Divider>或</Divider>

          <div className="text-center">
            <Space direction="vertical" size="small">
              <Paragraph className="text-gray-600 mb-0">
                已有账户？
              </Paragraph>
              <Link href="/auth/login">
                <Button type="link" className="p-0">
                  立即登录
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