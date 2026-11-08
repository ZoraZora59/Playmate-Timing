'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { App, Button, Form, Input } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import PasswordField from '@/components/PasswordField';
import { useAuthStore } from '@/store/auth';
import { LoginForm } from '@/types';

const TAPE = [
  { time: '22:58', name: '峡谷第一深情小鲁班', delta: '−50.00', balance: '328.50' },
  { time: '22:41', name: 'Momo', delta: '+100.00', balance: '136.40' },
  { time: '22:12', name: '迟到的猫', delta: '−30.00', balance: '52.00' },
  { time: '21:50', name: '小满', delta: '−50.00', balance: '0.00' },
];

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
    <div className="pm-auth">
      <main className="pm-auth-panel">
        <div className="pm-auth-top">
          <Link href="/" className="pm-brand" aria-label="陪玩平台首页">
            <span className="pm-brand-seal" aria-hidden="true">
              陪
            </span>
            <span className="pm-brand-text">
              <span className="pm-brand-name">陪玩平台</span>
            </span>
          </Link>
          <Link href="/" className="pm-auth-back">
            返回首页
          </Link>
        </div>

        <div className="pm-auth-form">
          <h1 className="pm-auth-title">登录</h1>

          <Form<LoginForm> layout="vertical" requiredMark={false} onFinish={onFinish} disabled={submitting}>
            <Form.Item
              name="username"
              label="用户名 / 邮箱"
              rules={[{ required: true, message: '请输入用户名或邮箱' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="用户名或邮箱" autoComplete="username" />
            </Form.Item>

            <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
              <PasswordField
                prefix={<LockOutlined />}
                placeholder="请输入密码"
                autoComplete="current-password"
              />
            </Form.Item>

            <Button type="primary" htmlType="submit" block loading={submitting} className="pm-auth-submit">
              登录
            </Button>
          </Form>

          <p className="pm-auth-switch">
            还没有账号？
            <Link href="/auth/register">去注册</Link>
          </p>
        </div>
      </main>

      <aside className="pm-auth-preview" aria-label="示例数据">
        <div className="pm-auth-sheet">
          <div className="pm-auth-sheet-head">
            <span>今晚的流水</span>
            <span className="num">22:58</span>
          </div>
          {TAPE.map((row, i) => (
            <div className="pm-auth-sheet-row" key={`${row.time}-${i}`}>
              <span className="pm-auth-sheet-time num">{row.time}</span>
              <span className="pm-auth-sheet-name">{row.name}</span>
              <span className="pm-auth-sheet-delta num">{row.delta}</span>
              <span className="pm-auth-sheet-balance num">{row.balance}</span>
            </div>
          ))}
          <div className="pm-auth-sheet-foot">示例数据</div>
        </div>
      </aside>
    </div>
  );
}
