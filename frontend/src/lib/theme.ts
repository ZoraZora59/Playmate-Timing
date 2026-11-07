// 设计令牌 —— Squad Desk（车队前台）
// 冷灰战术底板 + 藏青文字 + 三种余额功能色；不使用渐变与装饰性光斑。
import type { ThemeConfig } from 'antd';

export const COLORS = {
  // 中性
  bgPage: '#EDF0F4',
  bgCard: '#FFFFFF',
  bgSubtle: '#F5F7F9',
  sidebar: '#FFFFFF',

  textPrimary: '#0E1A2B',
  textSecondary: '#4E5D6E',
  textMuted: '#7C8897',

  border: '#D3DBE4',
  divider: '#E4E9EF',

  // 主色（钴蓝）+ 功能色
  primary: '#1F4BFF',
  primaryHover: '#3D63FF',
  primaryDark: '#1637C4',
  primarySoft: '#E7EDFF',
  cyan: '#0B8A63',
  teal: '#0B8A63',
  signal: '#E8501F',

  // 余额类型
  money: '#0B8A63',
  moneySoft: '#E4F2EC',
  time: '#1F4BFF',
  timeSoft: '#E7EDFF',
  point: '#B7791F',
  pointSoft: '#F6ECD9',
  danger: '#C42B1C',
  dangerSoft: '#FBE9E7',

  warnBg: '#FBF0DC',
  warnText: '#8A5A12',
  infoBg: '#E7EDFF',
  infoText: '#1637C4',
} as const;

// 角色主色
export const ROLE_HUE: Record<string, string> = {
  player: COLORS.primary,
  provider: COLORS.teal,
  studio: COLORS.signal,
};

// 头像取色盘（按 id/名称稳定取色）
export const AVATAR_HUES = [
  '#0E1A2B', '#1F4BFF', '#0B8A63', '#B7791F', '#E8501F', '#355070', '#5C6B7A', '#3D63FF',
];

export const FONT_DISPLAY =
  "'Archivo', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif";
export const FONT_BODY =
  "'Archivo', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', 'Hiragino Sans GB', system-ui, sans-serif";

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
    colorBgContainer: COLORS.bgCard,
    borderRadius: 4,
    fontFamily: FONT_BODY,
    fontSize: 14,
    controlHeight: 38,
  },
  components: {
    Button: { controlHeight: 38, borderRadius: 4, fontWeight: 600, primaryShadow: 'none', defaultShadow: 'none' },
    Card: { borderRadiusLG: 4, paddingLG: 20 },
    Input: { controlHeight: 40, borderRadius: 4 },
    InputNumber: { controlHeight: 40, borderRadius: 4 },
    Select: { controlHeight: 40, borderRadius: 4 },
    Modal: { borderRadiusLG: 6 },
    Table: { borderRadiusLG: 4, headerBg: COLORS.bgSubtle, headerColor: COLORS.textMuted, headerSplitColor: COLORS.divider },
    Tag: { borderRadiusSM: 3 },
    Segmented: { borderRadius: 4, itemSelectedBg: COLORS.textPrimary, itemSelectedColor: '#ffffff', trackBg: COLORS.bgSubtle },
    Dropdown: { borderRadiusLG: 4 },
    Message: { borderRadiusLG: 4 },
  },
};
