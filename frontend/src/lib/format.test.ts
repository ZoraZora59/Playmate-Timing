import { describe, it, expect } from 'vitest';
import {
  toNum,
  formatMoney,
  formatTimeMinutes,
  formatPoint,
  formatBalance,
  balanceMeta,
  initialOf,
  txTypeLabel,
  txIsCredit,
  playStatusMeta,
} from './format';
import { BalanceType } from '@/types';

describe('toNum', () => {
  it('解析 decimal 字符串', () => {
    expect(toNum('328.50')).toBe(328.5);
    expect(toNum('0')).toBe(0);
  });
  it('容错 null/undefined/非法值', () => {
    expect(toNum(null)).toBe(0);
    expect(toNum(undefined)).toBe(0);
    expect(toNum('abc')).toBe(0);
  });
  it('透传数字', () => {
    expect(toNum(42)).toBe(42);
  });
});

describe('金额格式化', () => {
  it('formatMoney 两位小数带符号', () => {
    expect(formatMoney('328.5')).toBe('¥328.50');
    expect(formatMoney(1500)).toBe('¥1,500.00');
    expect(formatMoney('0', false)).toBe('0.00');
  });
  it('formatTimeMinutes', () => {
    expect(formatTimeMinutes('240')).toBe('240 分钟');
  });
  it('formatPoint', () => {
    expect(formatPoint('1500')).toBe('1,500 点');
  });
  it('formatBalance 按类型分流', () => {
    expect(formatBalance(BalanceType.MONEY, '100')).toBe('¥100.00');
    expect(formatBalance(BalanceType.TIME, '90')).toBe('90 分钟');
    expect(formatBalance(BalanceType.POINT, '1500')).toBe('1,500 点');
  });
});

describe('balanceMeta', () => {
  it('三种类型的标签/颜色不同', () => {
    expect(balanceMeta(BalanceType.MONEY).label).toBe('金额');
    expect(balanceMeta(BalanceType.TIME).label).toBe('时间');
    expect(balanceMeta(BalanceType.POINT).label).toBe('点数');
    expect(balanceMeta(BalanceType.MONEY).color).not.toBe(balanceMeta(BalanceType.TIME).color);
  });
});

describe('initialOf', () => {
  it('中文取末位汉字', () => {
    expect(initialOf('晚风')).toBe('风');
    expect(initialOf('星轨陪玩')).toBe('玩');
  });
  it('英文取首字母大写', () => {
    expect(initialOf('alice')).toBe('A');
  });
  it('空值兜底', () => {
    expect(initialOf('')).toBe('?');
    expect(initialOf(undefined)).toBe('?');
  });
});

describe('交易类型', () => {
  it('txTypeLabel 映射中文', () => {
    expect(txTypeLabel('recharge')).toBe('充值');
    expect(txTypeLabel('consume')).toBe('消费');
    expect(txTypeLabel('refund')).toBe('退款');
  });
  it('txIsCredit 区分增减方向', () => {
    expect(txIsCredit('recharge')).toBe(true);
    expect(txIsCredit('refund')).toBe(true);
    expect(txIsCredit('consume')).toBe(false);
  });
});

describe('playStatusMeta', () => {
  it('三种状态有不同标签', () => {
    expect(playStatusMeta('active').label).toBe('进行中');
    expect(playStatusMeta('completed').label).toBe('已完成');
    expect(playStatusMeta('cancelled').label).toBe('已取消');
  });
});
