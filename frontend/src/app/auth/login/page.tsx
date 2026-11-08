'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { App, Button, Form, Input } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import PasswordField from '@/components/PasswordField';
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
    <div className="pm-auth-desk">
      <div className="pm-auth-sheet">
        <div className="pm-binding" aria-hidden="true" />
        <div className="pm-auth-head">
          <div className="pm-auth-brand">
            <span className="pm-brand-seal" style={{ width: 30, height: 44, fontSize: 12 }} aria-hidden="true">
              账房
            </span>
            <div>
              <div className="pm-brand-name">陪玩平台</div>
              <div className="pm-brand-sub">今晚的局</div>
            </div>
          </div>
          <h1 className="pm-auth-title">欢迎回来</h1>
          <p className="pm-auth-sub">登录后翻自己的账页。</p>
        </div>

        <div className="pm-double-rule" aria-hidden="true" style={{ marginBottom: 22 }} />

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
            <Input prefix={<UserOutlined />} placeholder="用户名或邮箱" autoComplete="username" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <PasswordField
              prefix={<LockOutlined />}
              placeholder="请输入密码"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 4, marginBottom: 14 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={submitting}
              style={{ height: 44, borderRadius: 2, fontWeight: 600 }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', fontSize: 13, color: COLORS.textSecondary }}>
          还没有账号？
          <Link href="/auth/register" style={{ color: COLORS.primary, fontWeight: 600, marginLeft: 4 }}>
            去注册
          </Link>
        </div>
      </div>
    </div>
  );
}
