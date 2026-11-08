'use client';

import { Suspense, useMemo } from 'react';
import { Form, Input, Button, Segmented, App, Spin } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, SmileOutlined, PhoneOutlined } from '@ant-design/icons';
import PasswordField from '@/components/PasswordField';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { RegisterForm, UserRole } from '@/types';

interface RegisterFields extends RegisterForm {
  confirm: string;
}

const ROLE_OPTIONS: { label: string; value: UserRole }[] = [
  { label: '玩家', value: UserRole.PLAYER },
  { label: '服务者', value: UserRole.PROVIDER },
  { label: '工作室', value: UserRole.STUDIO },
];

const TAPE = [
  { time: '22:41', name: 'Momo', delta: '+100.00', balance: '136.40' },
  { time: '22:12', name: '迟到的猫', delta: '−30.00', balance: '52.00' },
  { time: '21:50', name: '小满', delta: '−50.00', balance: '0.00' },
];

function isUserRole(v: string | null): v is UserRole {
  return v === UserRole.PLAYER || v === UserRole.PROVIDER || v === UserRole.STUDIO;
}

function RegisterView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { message } = App.useApp();
  const { register, isLoading } = useAuthStore();
  const [form] = Form.useForm<RegisterFields>();

  const initialRole: UserRole = useMemo(() => {
    const q = searchParams.get('role');
    return isUserRole(q) ? q : UserRole.PLAYER;
  }, [searchParams]);

  const handleSubmit = async (values: RegisterFields) => {
    try {
      const payload: RegisterForm = {
        username: values.username.trim(),
        email: values.email.trim(),
        password: values.password,
        role: values.role,
        nickname: values.nickname?.trim() || undefined,
        phone: values.phone?.trim() || undefined,
      };
      await register(payload);
      message.success('注册成功，欢迎加入陪玩平台！');
      router.push('/dashboard');
    } catch (e) {
      message.error(e instanceof Error ? e.message : '注册失败，请稍后重试');
    }
  };

  return (
    <div className="pm-auth pm-auth-wide">
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

        <div className="pm-auth-form pm-auth-form-wide">
          <h1 className="pm-auth-title">创建账号</h1>

          <Form
            form={form}
            name="register"
            layout="vertical"
            requiredMark={false}
            initialValues={{ role: initialRole }}
            onFinish={handleSubmit}
          >
            <Form.Item name="role" label="选择身份" style={{ marginBottom: 4 }}>
              <Segmented<UserRole> block options={ROLE_OPTIONS.map((o) => ({ label: o.label, value: o.value }))} />
            </Form.Item>
            <div className="pm-auth-hint">身份注册后不可更改。</div>

            <Form.Item
              name="username"
              label="用户名"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 3, max: 50, message: '用户名长度需为 3-50 个字符' },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="3-50 个字符，登录时使用" autoComplete="username" />
            </Form.Item>

            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' },
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="用于账号识别与通知" autoComplete="email" />
            </Form.Item>

            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少 6 位' },
              ]}
            >
              <PasswordField prefix={<LockOutlined />} placeholder="至少 6 位" autoComplete="new-password" />
            </Form.Item>

            <Form.Item
              name="confirm"
              label="确认密码"
              dependencies={['password']}
              rules={[
                { required: true, message: '请再次输入密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <PasswordField prefix={<LockOutlined />} placeholder="再次输入密码" autoComplete="new-password" />
            </Form.Item>

            <div className="pm-auth-pair">
              <Form.Item name="nickname" label="昵称（可选）">
                <Input prefix={<SmileOutlined />} placeholder="展示给他人的称呼" />
              </Form.Item>
              <Form.Item
                name="phone"
                label="手机号（可选）"
                rules={[{ pattern: /^1[3-9]\d{9}$/, message: '请输入 11 位手机号' }]}
              >
                <Input prefix={<PhoneOutlined />} placeholder="11 位手机号" autoComplete="tel" />
              </Form.Item>
            </div>

            <Button type="primary" htmlType="submit" block loading={isLoading} className="pm-auth-submit">
              注册
            </Button>
          </Form>

          <p className="pm-auth-switch">
            已有账号？
            <Link href="/auth/login">去登录</Link>
          </p>
        </div>
      </main>

      <aside className="pm-auth-preview" aria-label="示例数据">
        <div className="pm-auth-sheet">
          <div className="pm-auth-sheet-head">
            <span>最近流水</span>
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

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="pm-auth-loading">
          <Spin size="large" />
        </div>
      }
    >
      <RegisterView />
    </Suspense>
  );
}
