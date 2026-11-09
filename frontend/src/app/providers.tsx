'use client';

import '@ant-design/v5-patch-for-react-19';
import { App as AntdApp, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { antdTheme } from '@/lib/theme';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider locale={zhCN} theme={antdTheme}>
      <AntdApp message={{ maxCount: 2, duration: 2 }}>{children}</AntdApp>
    </ConfigProvider>
  );
}
