// 设计令牌 —— 明亮工作台
// 纸、墨、线、章四种材料；朱印只表示“要动手 / 待处理 / 透支 / 危险”。
import type { ThemeConfig } from 'antd';

export const COLORS = {
  // 中性 / 纸墨
  bgPage: '#F6F6F2',
  bgCard: '#FFFFFF',
  bgSubtle: '#EDEFE8',
  sidebar: '#FFFFFF',

  textPrimary: '#14181B',
  textSecondary: '#4D5651',
  textMuted: '#78827C',

  border: '#DCDFD6',
  divider: '#DCDFD6',
  lineHeavy: '#B8BEB4',

  // 墨色主操作
  primary: '#14181B',
  primaryHover: '#2B3339',
  primaryDark: '#0E1215',
  primarySoft: '#EDEFE8',

  // 兼容旧页面：金额/时间/点数不再各发一色
  cyan: '#4D5651',
  teal: '#4D5651',
  signal: '#C0392B',
  money: '#14181B',
  moneySoft: '#EDEFE8',
  time: '#14181B',
  timeSoft: '#EDEFE8',
  point: '#14181B',
  pointSoft: '#EDEFE8',

  danger: '#C0392B',
  dangerSoft: '#FBEAE7',
  warnBg: '#FBEAE7',
  warnText: '#93291F',
  infoBg: '#EDEFE8',
  infoText: '#4D5651',

  // 纸墨与印章
  ink: '#14181B',
  inkHover: '#2B3339',
  sheetEdge: '#0B0F12',
  seal: '#C0392B',
  sealDeep: '#93291F',
  sealSoft: '#FBEAE7',
  sidebarText: '#14181B',
  sidebarMuted: '#78827C',
} as const;

// 角色不靠颜色区分；保留导出以兼容旧引用。
export const ROLE_HUE: Record<string, string> = {
  player: COLORS.textPrimary,
  provider: COLORS.textPrimary,
  studio: COLORS.textPrimary,
};

// 头像取色盘已废弃；保留空数组避免旧 import 报错。
export const AVATAR_HUES = [COLORS.textMuted];

export const FONT_BODY =
  "'PingFang SC', 'Hiragino Sans GB', 'Noto Sans SC', 'Source Han Sans SC', 'Microsoft YaHei', system-ui, sans-serif";
export const FONT_DISPLAY = FONT_BODY;
export const FONT_SERIF =
  "'Songti SC', 'STSong', 'Noto Serif SC', 'Source Han Serif SC', 'SimSun', serif";
export const FONT_NUM = "'Archivo', 'DIN Alternate', 'Helvetica Neue', Arial, sans-serif";

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: COLORS.primary,
    colorPrimaryHover: COLORS.primaryHover,
    colorPrimaryActive: COLORS.primaryDark,
    colorPrimaryBg: COLORS.primarySoft,
    colorPrimaryBorder: COLORS.lineHeavy,
    colorLink: COLORS.textPrimary,
    colorLinkHover: COLORS.inkHover,
    colorSuccess: COLORS.textSecondary,
    colorWarning: COLORS.seal,
    colorError: COLORS.seal,
    colorInfo: COLORS.textSecondary,
    colorText: COLORS.textPrimary,
    colorTextSecondary: COLORS.textSecondary,
    colorTextTertiary: COLORS.textMuted,
    colorTextPlaceholder: COLORS.textMuted,
    colorBorder: COLORS.border,
    colorBorderSecondary: COLORS.divider,
    colorBgLayout: COLORS.bgPage,
    colorBgContainer: COLORS.bgCard,
    colorBgElevated: COLORS.bgCard,
    colorFillSecondary: COLORS.bgSubtle,
    borderRadius: 2,
    borderRadiusLG: 3,
    fontFamily: FONT_BODY,
    fontSize: 14,
    controlHeight: 38,
    controlOutline: 'rgba(20,24,27,.12)',
    boxShadow: 'none',
    boxShadowSecondary: '0 18px 50px rgba(20,24,27,.18)',
  },
  components: {
    Button: {
      controlHeight: 38,
      borderRadius: 2,
      fontWeight: 600,
      primaryShadow: 'none',
      defaultShadow: 'none',
      dangerShadow: 'none',
    },
    Card: { borderRadiusLG: 0, paddingLG: 20 },
    Input: {
      controlHeight: 40,
      borderRadius: 2,
      activeBorderColor: COLORS.textPrimary,
      activeShadow: '0 0 0 2px rgba(20,24,27,.12)',
      hoverBorderColor: COLORS.lineHeavy,
    },
    InputNumber: {
      controlHeight: 40,
      borderRadius: 2,
      activeBorderColor: COLORS.textPrimary,
      activeShadow: '0 0 0 2px rgba(20,24,27,.12)',
      hoverBorderColor: COLORS.lineHeavy,
    },
    Select: {
      controlHeight: 40,
      borderRadius: 2,
      activeBorderColor: COLORS.textPrimary,
      activeOutlineColor: 'rgba(20,24,27,.12)',
      hoverBorderColor: COLORS.lineHeavy,
    },
    Modal: {
      borderRadiusLG: 3,
      contentBg: COLORS.bgCard,
      boxShadow: '0 18px 50px rgba(20,24,27,.18)',
    },
    Table: {
      borderRadiusLG: 0,
      headerBg: 'transparent',
      headerColor: COLORS.textMuted,
      headerSplitColor: 'transparent',
      borderColor: COLORS.divider,
      rowHoverBg: COLORS.bgSubtle,
    },
    Tag: { borderRadiusSM: 1 },
    Segmented: {
      borderRadius: 2,
      itemSelectedBg: COLORS.textPrimary,
      itemSelectedColor: COLORS.bgCard,
      trackBg: 'transparent',
    },
    Dropdown: { borderRadiusLG: 2 },
    Message: { borderRadiusLG: 2 },
  },
};
