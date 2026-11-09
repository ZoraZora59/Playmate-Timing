'use client';

import { useEffect, useState } from 'react';
import { App, Spin, Form, Input, Button } from 'antd';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { User, UserRole } from '@/types';
import { COLORS } from '@/lib/theme';
import { Avatar, EmptyState, LoadError } from '@/components/ui';

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
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const data = await apiClient.getProfile();
      setProfile(data);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
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

  if (error) {
    return (
      <div className="animate-pop" style={{ maxWidth: 560 }}>
        <LoadError onRetry={() => { setLoading(true); load(); }} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="animate-pop" style={{ maxWidth: 560 }}>
        <EmptyState title="暂无账号信息" />
      </div>
    );
  }

  const displayName = profile.nickname || profile.username;

  return (
    <div className="animate-pop" style={{ maxWidth: 560 }}>
      <div className="pm-profile-head">
        <Avatar name={displayName} size={56} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', color: COLORS.textPrimary }}>
            {displayName}
          </div>
          <div style={{ fontSize: 12.5, color: COLORS.textMuted, marginTop: 4 }}>@{profile.username}</div>
        </div>
        <span className="pm-profile-role">{ROLE_LABEL[profile.role]}</span>
      </div>

      <section className="pm-settings-section">
        <h2 className="pm-settings-title">账号信息</h2>
        <dl className="pm-settings-list">
          <div className="pm-settings-row">
            <dt>用户名</dt>
            <dd>{profile.username}</dd>
          </div>
          <div className="pm-settings-row">
            <dt>邮箱</dt>
            <dd>{profile.email}</dd>
          </div>
        </dl>
      </section>

      <section className="pm-settings-section">
        <h2 className="pm-settings-title">编辑资料</h2>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
          initialValues={{ nickname: profile.nickname, phone: profile.phone, avatar: profile.avatar }}
        >
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
            rules={[{ pattern: /^1[3-9]\d{9}$/, message: '请输入 11 位手机号' }]}
          >
            <Input placeholder="11 位手机号" size="large" allowClear maxLength={11} />
          </Form.Item>
          <Form.Item
            name="avatar"
            label="头像地址"
            rules={[{ type: 'url', message: '请输入有效的图片链接' }]}
          >
            <Input placeholder="https://…" size="large" allowClear />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, marginTop: 4 }}>
            <Button type="primary" htmlType="submit" size="large" loading={saving}>
              保存修改
            </Button>
          </Form.Item>
        </Form>
      </section>
    </div>
  );
}
