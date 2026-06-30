'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { App, Button, Form, Input } from 'antd';
import { useAuthStore } from '@/store/auth';
import { LoginForm } from '@/types';
import { COLORS } from '@/lib/theme';

export default function LoginPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const login = useAuthStore((s) => s.login);
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values: LoginForm) => {
    setSubmitting(true);
    try {
      await login({ username: values.username.trim(), password: values.password });
      message.success('登录成功');
      router.push('/dashboard');
    } catch (e) {
      message.error(e instanceof Error ? e.message : '登录失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="animate-pop"
      style={{
        minHeight: '100vh',
        width: '100%',
        background: COLORS.bgPage,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
      }}
    >
      <div
        className="pm-card"
        style={{
          width: 400,
          maxWidth: '100%',
          padding: '36px 34px 30px',
          boxShadow: '0 24px 60px rgba(22,23,42,.10)',
        }}
      >
        {/* logo + 标题 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 28,
          }}
        >
          <div
            className="font-display"
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: `linear-gradient(135deg,${COLORS.primary},${COLORS.cyan})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 28,
              color: '#fff',
              boxShadow: '0 10px 24px rgba(91,84,240,.4)',
            }}
          >
            陪
          </div>
          <h1
            className="font-display"
            style={{
              margin: '18px 0 4px',
              fontSize: 22,
              fontWeight: 700,
              color: COLORS.textPrimary,
              letterSpacing: '.2px',
            }}
          >
            欢迎回来
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: COLORS.textSecondary }}>
            登录陪玩平台，继续你的服务管理
          </p>
        </div>

        <Form<LoginForm>
          layout="vertical"
          requiredMark={false}
          onFinish={onFinish}
          disabled={submitting}
          size="large"
        >
          <Form.Item
            name="username"
            label="用户名 / 邮箱"
            rules={[{ required: true, message: '请输入用户名或邮箱' }]}
          >
            <Input placeholder="用户名或邮箱" autoComplete="username" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder="请输入密码" autoComplete="current-password" />
          </Form.Item>

          <Form.Item style={{ marginTop: 4, marginBottom: 12 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={submitting}
              style={{ height: 44, borderRadius: 12, fontWeight: 600 }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', fontSize: 13, color: COLORS.textSecondary }}>
          还没有账号？
          <Link
            href="/auth/register"
            style={{ color: COLORS.primary, fontWeight: 600, marginLeft: 4 }}
          >
            去注册
          </Link>
        </div>
      </div>
    </div>
  );
}
