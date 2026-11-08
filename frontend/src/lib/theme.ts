// 设计令牌 —— 夜班账房 · 今晚的局
// 纸、墨、线、章四种材料；朱印只表示“要动手 / 待处理 / 透支 / 危险”。
import type { ThemeConfig } from 'antd';

export const COLORS = {
  // 中性 / 纸墨
  bgPage: '#F1F2EC',
  bgCard: '#F7F8F4',
  bgSubtle: '#E7E9E0',
  sidebar: '#141B20',

  textPrimary: '#1D272D',
  textSecondary: '#46534E',
  textMuted: '#5E6A64',

  border: '#CBD1C6',
  divider: '#CBD1C6',
  lineHeavy: '#A8B1A5',

  // 墨色主操作
  primary: '#1D272D',
  primaryHover: '#2A353B',
  primaryDark: '#141B20',
  primarySoft: '#E7E9E0',

  // 兼容旧页面：金额/时间/点数不再各发一色
  cyan: '#46534E',
  teal: '#46534E',
  signal: '#B5342B',
  money: '#1D272D',
  moneySoft: '#E7E9E0',
  time: '#1D272D',
  timeSoft: '#E7E9E0',
  point: '#1D272D',
  pointSoft: '#E7E9E0',

  danger: '#B5342B',
  dangerSoft: '#F3E4E1',
  warnBg: '#F3E4E1',
  warnText: '#8C2720',
  infoBg: '#E7E9E0',
  infoText: '#46534E',

  // 夜班账房新增
  ink: '#141B20',
  inkHover: '#2A353B',
  sheetEdge: '#0B0F12',
  seal: '#B5342B',
  sealDeep: '#8C2720',
  sealSoft: '#F3E4E1',
  sidebarText: '#E9EBE3',
  sidebarMuted: '#9AA49D',
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
    controlOutline: 'rgba(29,39,45,.12)',
    boxShadow: 'none',
    boxShadowSecondary: '0 18px 50px rgba(20,27,32,.28)',
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
      activeShadow: '0 0 0 2px rgba(29,39,45,.12)',
      hoverBorderColor: COLORS.lineHeavy,
    },
    InputNumber: {
      controlHeight: 40,
      borderRadius: 2,
      activeBorderColor: COLORS.textPrimary,
      activeShadow: '0 0 0 2px rgba(29,39,45,.12)',
      hoverBorderColor: COLORS.lineHeavy,
    },
    Select: {
      controlHeight: 40,
      borderRadius: 2,
      activeBorderColor: COLORS.textPrimary,
      activeOutlineColor: 'rgba(29,39,45,.12)',
      hoverBorderColor: COLORS.lineHeavy,
    },
    Modal: {
      borderRadiusLG: 3,
      contentBg: COLORS.bgCard,
      boxShadow: '0 18px 50px rgba(20,27,32,.28)',
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
