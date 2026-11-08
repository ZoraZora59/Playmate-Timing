'use client';

import { useState } from 'react';
import type { ComponentProps } from 'react';
import { Input } from 'antd';
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';

type Props = Omit<ComponentProps<typeof Input>, 'type' | 'suffix'>;

export default function PasswordField(props: Props) {
  const [visible, setVisible] = useState(false);
  return (
    <Input
      {...props}
      type={visible ? 'text' : 'password'}
      suffix={
        <button
          type="button"
          className="pm-password-toggle"
          aria-label={visible ? '隐藏密码' : '显示密码'}
          aria-pressed={visible}
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
        </button>
      }
    />
  );
}
