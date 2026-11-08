'use client';

import { Suspense, useMemo } from 'react';
import { Form, Input, Button, Segmented, App, Spin } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, SmileOutlined, PhoneOutlined } from '@ant-design/icons';
import PasswordField from '@/components/PasswordField';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { RegisterForm, UserRole } from '@/types';
import { COLORS } from '@/lib/theme';

interface RegisterFields extends RegisterForm {
  confirm: string;
}

const ROLE_OPTIONS: { label: string; value: UserRole; desc: string }[] = [
  { label: '玩家', value: UserRole.PLAYER, desc: '查看余额与游玩记录' },
  { label: '服务者', value: UserRole.PROVIDER, desc: '管理玩家余额与收益' },
  { label: '工作室', value: UserRole.STUDIO, desc: '管理成员与审批入驻' },
];

function isUserRole(v: string | null): v is UserRole {
  return v === UserRole.PLAYER || v === UserRole.PROVIDER || v === UserRole.STUDIO;
}

function RegisterCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { message } = App.useApp();
  const { register, isLoading } = useAuthStore();
  const [form] = Form.useForm<RegisterFields>();

  const initialRole: UserRole = useMemo(() => {
    const q = searchParams.get('role');
    return isUserRole(q) ? q : UserRole.PLAYER;
  }, [searchParams]);

  const selectedRole: UserRole = Form.useWatch('role', form) ?? initialRole;
  const roleDesc = ROLE_OPTIONS.find((o) => o.value === selectedRole)?.desc ?? '';

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
    <div className="pm-auth-desk">
      <div className="pm-auth-sheet pm-auth-sheet-wide">
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
          <h1 className="pm-auth-title">创建账户</h1>
          <p className="pm-auth-sub">加入陪玩平台 · {roleDesc}</p>
        </div>

        <div className="pm-double-rule" aria-hidden="true" style={{ marginBottom: 22 }} />

        <Form
          form={form}
          name="register"
          layout="vertical"
          size="large"
          requiredMark={false}
          initialValues={{ role: initialRole }}
          onFinish={handleSubmit}
        >
          <Form.Item name="role" label="选择身份" style={{ marginBottom: 8 }}>
            <Segmented<UserRole>
              block
              options={ROLE_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
            />
          </Form.Item>
          <div style={{ marginTop: 0, marginBottom: 18, fontSize: 11.5, color: COLORS.textMuted }}>
            身份注册后不可更改。
          </div>

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
            <PasswordField
              prefix={<LockOutlined />}
              placeholder="至少 6 位"
              autoComplete="new-password"
            />
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
            <PasswordField
              prefix={<LockOutlined />}
              placeholder="再次输入密码"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item name="nickname" label="昵称（可选）">
            <Input prefix={<SmileOutlined />} placeholder="展示给他人的称呼" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="手机号（可选）"
            rules={[{ pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="11 位手机号" autoComplete="tel" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 14, marginTop: 4 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={isLoading}
              style={{
                height: 44,
                borderRadius: 2,
                fontWeight: 600,
              }}
            >
              注册
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', fontSize: 13, color: COLORS.textSecondary }}>
          已有账号？
          <Link href="/auth/login" style={{ color: COLORS.primary, fontWeight: 600, marginLeft: 4 }}>
            去登录
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="pm-auth-desk">
          <Spin size="large" />
        </div>
      }
    >
      <RegisterCard />
    </Suspense>
  );
}
