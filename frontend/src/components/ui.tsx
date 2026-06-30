'use client';

import React from 'react';
import { COLORS } from '@/lib/theme';
import { initialOf, hueFor } from '@/lib/format';

// ---------------- 头像 ----------------
export function Avatar({
  name,
  seed,
  size = 40,
  hue,
}: {
  name?: string;
  seed?: number | string;
  size?: number;
  hue?: string;
}) {
  const bg = hue || hueFor(seed ?? name ?? 0);
  return (
    <div
      className="font-display"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        background: bg,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: Math.round(size * 0.42),
        flex: 'none',
      }}
    >
      {initialOf(name)}
    </div>
  );
}

// ---------------- 数据卡 ----------------
export function StatCard({
  label,
  value,
  unit,
  sub,
  color = COLORS.primary,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="pm-card" style={{ padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: COLORS.textSecondary }}>{label}</span>
        <span style={{ width: 30, height: 30, borderRadius: 9, background: color, opacity: 0.14 }} />
      </div>
      <div className="font-display" style={{ fontWeight: 700, fontSize: 30, color }}>
        {value}
        {unit && <span style={{ fontSize: 14, color: COLORS.textMuted, fontWeight: 500 }}> {unit}</span>}
      </div>
      {sub && <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ---------------- 胶囊标签 ----------------
export function Pill({
  children,
  color = COLORS.textSecondary,
  bg = COLORS.divider,
}: {
  children: React.ReactNode;
  color?: string;
  bg?: string;
}) {
  return (
    <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, background: bg, color }}>
      {children}
    </span>
  );
}

// ---------------- 提示横幅 ----------------
export function InfoBanner({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'warn';
  children: React.ReactNode;
}) {
  const styles =
    tone === 'warn'
      ? { bg: COLORS.warnBg, fg: COLORS.warnText }
      : { bg: COLORS.infoBg, fg: COLORS.infoText };
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 16px',
        background: styles.bg,
        borderRadius: 12,
        color: styles.fg,
        fontSize: 13,
        lineHeight: 1.5,
      }}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flex: 'none' }}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
      <span>{children}</span>
    </div>
  );
}

// ---------------- 卡片容器 ----------------
export function SectionCard({
  title,
  extra,
  children,
  bodyPad = true,
}: {
  title?: React.ReactNode;
  extra?: React.ReactNode;
  children: React.ReactNode;
  bodyPad?: boolean;
}) {
  return (
    <div className="pm-card" style={{ overflow: 'hidden' }}>
      {(title || extra) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid ' + COLORS.divider,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
          {extra}
        </div>
      )}
      <div style={{ padding: bodyPad ? '8px 20px 16px' : 0 }}>{children}</div>
    </div>
  );
}

// ---------------- 空状态 ----------------
export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div style={{ padding: '48px 20px', textAlign: 'center', color: COLORS.textMuted }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: COLORS.bgPage,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 14px',
        }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={COLORS.textMuted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="16" rx="3" />
          <path d="M3 9h18M8 4v16" />
        </svg>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.textSecondary }}>{title}</div>
      {hint && <div style={{ fontSize: 12.5, marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

// ---------------- 星级 ----------------
export function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: COLORS.point, fontWeight: 600, fontSize: size }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill={COLORS.point} stroke="none">
        <path d="M12 2l3 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.9 21l1.2-6.8-5-4.9 6.9-1z" />
      </svg>
      {rating.toFixed(1)}
    </span>
  );
}
