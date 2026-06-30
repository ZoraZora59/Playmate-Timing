import type { Metadata } from 'next'
import './globals.css'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import { ConfigProvider, App as AntdApp } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { antdTheme } from '@/lib/theme'

export const metadata: Metadata = {
  title: '陪玩平台 · Companion Hub',
  description: '陪玩工作室、服务者、玩家信息管理平台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AntdRegistry>
          <ConfigProvider locale={zhCN} theme={antdTheme}>
            <AntdApp>{children}</AntdApp>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  )
}
