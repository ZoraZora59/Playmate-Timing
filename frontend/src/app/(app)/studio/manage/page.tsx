'use client';

import { useEffect, useState } from 'react';
import { App, Spin, Form, Input, Button } from 'antd';
import axios from 'axios';
import apiClient from '@/lib/api';
import { Studio, CreateStudioForm } from '@/types';
import { SectionCard, InfoBanner } from '@/components/ui';

export default function StudioManagePage() {
  const { message } = App.useApp();
  const [form] = Form.useForm<CreateStudioForm>();
  const [studio, setStudio] = useState<Studio | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
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
        message.error(e instanceof Error ? e.message : '加载失败');
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

  const isEdit = !!studio;

  return (
    <div className="animate-pop" style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 16 }}>
        <InfoBanner tone="info">
          {isEdit
            ? '完善工作室主页信息，玩家与服务者会看到这里的简介与联系方式。'
            : '你还没有创建工作室。填写下方信息即可开通，成为可被服务者申请加入的工作室。'}
        </InfoBanner>
      </div>

      <SectionCard title={isEdit ? '工作室信息' : '创建工作室'}>
        <Form
          form={form}
          layout="vertical"
          requiredMark="optional"
          onFinish={onFinish}
          style={{ paddingTop: 4 }}
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
              placeholder="介绍工作室的主营游戏、服务特色等"
              autoSize={{ minRows: 3, maxRows: 6 }}
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item
            label="Logo 链接"
            name="logo"
            extra="可选，填写一张图片的 URL"
          >
            <Input placeholder="https://…" allowClear />
          </Form.Item>

          <Form.Item label="联系方式" name="contact_info">
            <Input.TextArea
              placeholder="微信 / QQ / 客服电话等，便于玩家与服务者联系"
              autoSize={{ minRows: 2, maxRows: 4 }}
              maxLength={200}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 4 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              size="large"
              style={{ borderRadius: 10 }}
            >
              {isEdit ? '保存修改' : '创建工作室'}
            </Button>
          </Form.Item>
        </Form>
      </SectionCard>
    </div>
  );
}
