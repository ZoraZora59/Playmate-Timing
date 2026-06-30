'use client';

import { Suspense, useMemo } from 'react';
import { Form, Input, Button, Segmented, App, Spin } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, SmileOutlined, PhoneOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { RegisterForm, UserRole } from '@/types';
import { COLORS, FONT_DISPLAY, ROLE_HUE } from '@/lib/theme';

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
  const accent = ROLE_HUE[selectedRole];
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
        style={{
          width: 440,
          maxWidth: '100%',
          background: COLORS.bgCard,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 20,
          padding: '34px 34px 30px',
          boxShadow: '0 24px 70px rgba(22,23,42,.10)',
        }}
      >
        {/* logo + 标题 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 26 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 15,
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.cyan})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: FONT_DISPLAY,
              fontWeight: 700,
              fontSize: 25,
              color: '#fff',
              boxShadow: '0 10px 24px rgba(91,84,240,.4)',
            }}
          >
            陪
          </div>
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              fontWeight: 700,
              fontSize: 22,
              color: COLORS.textPrimary,
              marginTop: 14,
            }}
          >
            创建账户
          </div>
          <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 4 }}>
            加入陪玩平台 · {roleDesc}
          </div>
        </div>

        <Form
          form={form}
          name="register"
          layout="vertical"
          size="large"
          requiredMark={false}
          initialValues={{ role: initialRole }}
          onFinish={handleSubmit}
        >
          <Form.Item name="role" label="选择身份" style={{ marginBottom: 18 }}>
            <Segmented<UserRole>
              block
              options={ROLE_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
            />
          </Form.Item>

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
            <Input prefix={<MailOutlined />} placeholder="用于找回账户" autoComplete="email" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少 6 位' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="至少 6 位" autoComplete="new-password" />
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
            <Input.Password prefix={<LockOutlined />} placeholder="再次输入密码" autoComplete="new-password" />
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
                height: 46,
                borderRadius: 12,
                background: accent,
                borderColor: accent,
                fontWeight: 600,
                boxShadow: `0 8px 20px ${accent}33`,
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
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin size="large" />
        </div>
      }
    >
      <RegisterCard />
    </Suspense>
  );
}
