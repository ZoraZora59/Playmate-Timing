'use client';

import { useEffect, useState } from 'react';
import { App, Spin, Form, Input, Button } from 'antd';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { User, UserRole } from '@/types';
import { COLORS, ROLE_HUE } from '@/lib/theme';
import { Avatar } from '@/components/ui';

const ROLE_LABEL: Record<UserRole, string> = {
  [UserRole.PLAYER]: '玩家',
  [UserRole.PROVIDER]: '服务者',
  [UserRole.STUDIO]: '工作室',
};

interface ProfileForm {
  nickname?: string;
  phone?: string;
  avatar?: string;
}

export default function SettingsPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm<ProfileForm>();
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const data = await apiClient.getProfile();
      setProfile(data);
      form.setFieldsValue({
        nickname: data.nickname,
        phone: data.phone,
        avatar: data.avatar,
      });
    } catch (e) {
      message.error(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFinish = async (values: ProfileForm) => {
    setSaving(true);
    try {
      await updateProfile(values);
      setProfile((prev) => (prev ? { ...prev, ...values } : prev));
      message.success('资料已更新');
    } catch (e) {
      message.error(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="animate-pop" style={{ maxWidth: 720 }}>
        <div className="pm-card" style={{ padding: '40px 24px', textAlign: 'center', color: COLORS.textMuted }}>
          暂无账号信息
        </div>
      </div>
    );
  }

  const roleHue = ROLE_HUE[profile.role] ?? COLORS.primary;
  const displayName = profile.nickname || profile.username;

  const readonlyRow = (label: string, value: string) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '13px 16px',
        background: COLORS.bgSubtle,
        border: '1px solid ' + COLORS.divider,
        borderRadius: 12,
      }}
    >
      <span style={{ fontSize: 13, color: COLORS.textSecondary }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.textPrimary }}>{value}</span>
    </div>
  );

  return (
    <div className="animate-pop" style={{ maxWidth: 720 }}>
      {/* 账号头部卡片 */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 18,
          padding: '24px 26px',
          marginBottom: 18,
          background: `linear-gradient(135deg, ${COLORS.sidebar} 0%, ${roleHue} 140%)`,
          color: '#fff',
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: -40,
            top: -40,
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: 'rgba(255,255,255,.10)',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
          <Avatar name={displayName} hue="rgba(255,255,255,.22)" size={56} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="font-display" style={{ fontSize: 22, fontWeight: 700 }}>
              {displayName}
            </div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.78)', marginTop: 3 }}>
              @{profile.username} · {ROLE_LABEL[profile.role]}
            </div>
          </div>
          <span
            style={{
              background: 'rgba(255,255,255,.22)',
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            {ROLE_LABEL[profile.role]}
          </span>
        </div>
      </div>

      {/* 只读账号信息 */}
      <div className="pm-card" style={{ padding: '20px 22px', marginBottom: 18 }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>账号信息</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {readonlyRow('用户名', profile.username)}
          {readonlyRow('邮箱', profile.email)}
          {readonlyRow('角色', ROLE_LABEL[profile.role])}
        </div>
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 12 }}>
          用户名、邮箱与角色不可修改。
        </div>
      </div>

      {/* 可编辑资料 */}
      <div className="pm-card" style={{ padding: '22px 24px' }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 18 }}>编辑资料</div>
        <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            name="nickname"
            label="昵称"
            rules={[{ max: 30, message: '昵称不超过 30 个字符' }]}
          >
            <Input placeholder="给自己起个昵称" size="large" allowClear />
          </Form.Item>
          <Form.Item
            name="phone"
            label="手机号"
            rules={[{ pattern: /^1\d{10}$/, message: '请输入有效的 11 位手机号' }]}
          >
            <Input placeholder="11 位手机号" size="large" allowClear maxLength={11} />
          </Form.Item>
          <Form.Item
            name="avatar"
            label="头像地址"
            rules={[{ type: 'url', message: '请输入有效的图片链接' }]}
            extra="填写一张图片的 URL 作为头像。"
          >
            <Input placeholder="https://…" size="large" allowClear />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, marginTop: 4 }}>
            <Button type="primary" htmlType="submit" size="large" loading={saving}>
              保存修改
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
