'use client';

import { useEffect, useState } from 'react';
import { App, Spin, Form, Input, Button } from 'antd';
import axios from 'axios';
import apiClient from '@/lib/api';
import { Studio, CreateStudioForm } from '@/types';
import { LoadError } from '@/components/ui';

export default function StudioManagePage() {
  const { message } = App.useApp();
  const [form] = Form.useForm<CreateStudioForm>();
  const [studio, setStudio] = useState<Studio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const dashboard = await apiClient.getStudioDashboard();
      setStudio(dashboard.studio ?? null);
      form.setFieldsValue({
        name: dashboard.studio?.name ?? '',
        description: dashboard.studio?.description ?? '',
        logo: dashboard.studio?.logo ?? '',
        contact_info: dashboard.studio?.contact_info ?? '',
      });
    } catch (e) {
      // 404 视为「尚未创建工作室」，进入创建模式而非报错
      const notFound =
        axios.isAxiosError(e) && e.response?.status === 404;
      if (notFound) {
        setStudio(null);
        form.resetFields();
      } else {
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFinish = async (values: CreateStudioForm) => {
    setSubmitting(true);
    try {
      if (studio) {
        await apiClient.updateStudio(studio.id, values);
        message.success('工作室信息已更新');
      } else {
        await apiClient.createStudio(values);
        message.success('工作室创建成功');
      }
      await load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : '提交失败');
    } finally {
      setSubmitting(false);
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
        <LoadError onRetry={load} />
      </div>
    );
  }

  const isEdit = !!studio;

  return (
    <div className="animate-pop" style={{ maxWidth: 560 }}>
      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        onFinish={onFinish}
        style={{ borderTop: '2px solid var(--ink-text)', paddingTop: 20 }}
      >
        <Form.Item
          label="工作室名称"
          name="name"
          rules={[{ required: true, message: '请输入工作室名称' }]}
        >
          <Input placeholder="例如：星轨陪玩" maxLength={50} allowClear />
        </Form.Item>

        <Form.Item label="工作室简介" name="description">
          <Input.TextArea
            placeholder="主营游戏、服务特色"
            autoSize={{ minRows: 3, maxRows: 6 }}
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Form.Item label="Logo 链接" name="logo">
          <Input placeholder="https://…" allowClear />
        </Form.Item>

        <Form.Item label="联系方式" name="contact_info">
          <Input.TextArea
            placeholder="微信 / QQ / 客服电话"
            autoSize={{ minRows: 2, maxRows: 4 }}
            maxLength={200}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 4 }}>
          <Button type="primary" htmlType="submit" loading={submitting} size="large">
            {isEdit ? '保存修改' : '创建工作室'}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
