// 设计令牌 —— 源自设计师交付的「陪玩平台」高保真原型。
// 单一事实来源：颜色、圆角、字体均在此定义，组件与页面统一引用。
import type { ThemeConfig } from 'antd';

export const COLORS = {
  // 中性
  bgPage: '#F4F5FA',
  bgCard: '#FFFFFF',
  bgSubtle: '#FBFBFE',
  sidebar: '#16172A',

  textPrimary: '#1B1C33',
  textSecondary: '#6B6D85',
  textMuted: '#9AA0B5',

  border: '#EAEBF2',
  divider: '#F1F2F7',

  // 主色（紫）+ 青
  primary: '#5B54F0',
  primaryHover: '#7C75FF',
  primaryDark: '#4B45C9',
  primarySoft: '#ECEBFE',
  cyan: '#15C8D8',
  teal: '#0FB6A8',

  // 语义 / 余额类型
  money: '#1FB573',
  moneySoft: '#E7F7EF',
  time: '#2E90FA',
  timeSoft: '#E7F1FE',
  point: '#F5A524',
  pointSoft: '#FEF4E2',
  danger: '#F0476A',
  dangerSoft: '#FFF1F4',

  warnBg: '#FFF4E5',
  warnText: '#A9701A',
  infoBg: '#ECEBFE',
  infoText: '#4B45C9',
} as const;

// 角色主色
export const ROLE_HUE: Record<string, string> = {
  player: COLORS.primary,
  provider: COLORS.teal,
  studio: COLORS.point,
};

// 头像取色盘（按 id/名称稳定取色）
export const AVATAR_HUES = [
  '#5B54F0', '#0FB6A8', '#2E90FA', '#F5A524', '#F0476A', '#1FB573', '#8B83FF', '#15C8D8',
];

export const FONT_DISPLAY = "'Space Grotesk', 'Noto Sans SC', sans-serif";
export const FONT_BODY = "'Noto Sans SC', system-ui, -apple-system, sans-serif";

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: COLORS.primary,
    colorSuccess: COLORS.money,
    colorWarning: COLORS.point,
    colorError: COLORS.danger,
    colorInfo: COLORS.time,
    colorText: COLORS.textPrimary,
    colorTextSecondary: COLORS.textSecondary,
    colorTextTertiary: COLORS.textMuted,
    colorBorder: COLORS.border,
    colorBorderSecondary: COLORS.divider,
    colorBgLayout: COLORS.bgPage,
    borderRadius: 12,
    fontFamily: FONT_BODY,
    fontSize: 14,
  },
  components: {
    Button: { controlHeight: 40, borderRadius: 10, fontWeight: 600, primaryShadow: 'none' },
    Card: { borderRadiusLG: 16, paddingLG: 22 },
    Input: { controlHeight: 42, borderRadius: 11 },
    InputNumber: { controlHeight: 42, borderRadius: 11 },
    Select: { controlHeight: 42, borderRadius: 11 },
    Modal: { borderRadiusLG: 20 },
    Table: { borderRadiusLG: 16, headerBg: COLORS.bgSubtle, headerColor: COLORS.textMuted },
    Tag: { borderRadiusSM: 20 },
  },
};
