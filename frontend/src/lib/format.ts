// 数值与展示格式化工具。
// 注意：后端金额为 decimal，序列化为 JSON「字符串」（如 "328.50"），这里统一解析。
import { BalanceType } from '@/types';
import { COLORS, AVATAR_HUES } from '@/lib/theme';

export function toNum(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

export function formatMoney(v: string | number, withSymbol = true): string {
  const n = toNum(v);
  const s = n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return withSymbol ? `¥${s}` : s;
}

export function formatTimeMinutes(v: string | number): string {
  return `${Math.round(toNum(v)).toLocaleString('zh-CN')} 分钟`;
}

export function formatPoint(v: string | number): string {
  return `${Math.round(toNum(v)).toLocaleString('zh-CN')} 点`;
}

export interface BalanceMeta {
  label: string;
  color: string;
  softBg: string;
  unit: string;
}

export function balanceMeta(type: BalanceType | string): BalanceMeta {
  switch (type) {
    case BalanceType.TIME:
      return { label: '时间', color: COLORS.time, softBg: COLORS.timeSoft, unit: '分钟' };
    case BalanceType.POINT:
      return { label: '点数', color: COLORS.point, softBg: COLORS.pointSoft, unit: '点' };
    case BalanceType.MONEY:
    default:
      return { label: '金额', color: COLORS.money, softBg: COLORS.moneySoft, unit: '¥' };
  }
}

export function formatBalance(type: BalanceType | string, v: string | number): string {
  switch (type) {
    case BalanceType.TIME:
      return formatTimeMinutes(v);
    case BalanceType.POINT:
      return formatPoint(v);
    default:
      return formatMoney(v);
  }
}

// 头像首字（取昵称/用户名最后一个汉字或首字符）
export function initialOf(name?: string): string {
  if (!name) return '?';
  const trimmed = name.trim();
  if (!trimmed) return '?';
  // 取末位汉字更自然（如「晚风」→「风」），否则取首字符
  const chars = Array.from(trimmed);
  const han = chars.filter((c) => /[一-龥]/.test(c));
  if (han.length > 0) return han[han.length - 1];
  return chars[0].toUpperCase();
}

export function hueFor(seed: number | string): string {
  const n = typeof seed === 'number' ? seed : Array.from(String(seed)).reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_HUES[Math.abs(n) % AVATAR_HUES.length];
}

// 交易类型 → 展示标签
export function txTypeLabel(type: string): string {
  return (
    {
      recharge: '充值',
      consume: '消费',
      refund: '退款',
      freeze: '冻结',
      unfreeze: '解冻',
    } as Record<string, string>
  )[type] || type;
}

// 交易是否为「增加余额」方向
export function txIsCredit(type: string): boolean {
  return type === 'recharge' || type === 'refund' || type === 'unfreeze';
}

// 游玩记录状态 → 展示
export function playStatusMeta(status: string): { label: string; color: string } {
  switch (status) {
    case 'active':
      return { label: '进行中', color: COLORS.money };
    case 'completed':
      return { label: '已完成', color: COLORS.textMuted };
    case 'cancelled':
      return { label: '已取消', color: COLORS.danger };
    default:
      return { label: status, color: COLORS.textMuted };
  }
}

// 相对时间（简版）
export function fromNow(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return '';
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60000);
  if (m < 1) return '刚刚';
  if (m < 60) return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  const day = Math.floor(h / 24);
  if (day < 30) return `${day} 天前`;
  return new Date(iso).toLocaleDateString('zh-CN');
}

export function formatDateTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
