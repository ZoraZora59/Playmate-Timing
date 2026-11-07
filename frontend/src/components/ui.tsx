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
        borderRadius: Math.max(2, Math.round(size * 0.1)),
        background: bg,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: Math.round(size * 0.4),
        flex: 'none',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.16)',
      }}
    >
      {initialOf(name)}
    </div>
  );
}

// ---------------- 记分板数据格 ----------------
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
    <div className="pm-scorecell" style={{ borderTopColor: color }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted }}>{label}</div>
      <div
        className="font-display num"
        style={{ fontWeight: 700, fontSize: 30, lineHeight: 1.08, color: COLORS.textPrimary, marginTop: 7 }}
      >
        {value}
        {unit && (
          <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted, marginLeft: 5 }}>
            {unit}
          </span>
        )}
      </div>
      {sub && <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 5 }}>{sub}</div>}
    </div>
  );
}

export function ScoreStrip({ children }: { children: React.ReactNode }) {
  return <div className="pm-scorestrip">{children}</div>;
}

// ---------------- 矩形标签 ----------------
export function Pill({
  children,
  color = COLORS.textSecondary,
  bg = COLORS.bgSubtle,
}: {
  children: React.ReactNode;
  color?: string;
  bg?: string;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: 11.5,
        fontWeight: 600,
        lineHeight: 1.2,
        padding: '3px 8px',
        borderRadius: 3,
        background: bg,
        color,
        border: `1px solid ${color}2E`,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

// ---------------- 提示条 ----------------
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
        padding: '10px 14px',
        background: styles.bg,
        borderLeft: `3px solid ${styles.fg}`,
        borderRadius: 3,
        color: styles.fg,
        fontSize: 12.5,
        lineHeight: 1.6,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flex: 'none' }}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
      <span>{children}</span>
    </div>
  );
}

// ---------------- 面板容器 ----------------
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
    <div className="pm-panel">
      {(title || extra) && (
        <div className="pm-panel-head">
          <div className="pm-panel-title">{title}</div>
          {extra}
        </div>
      )}
      <div style={{ padding: bodyPad ? '14px 18px' : 0 }}>{children}</div>
    </div>
  );
}

// ---------------- 空状态 ----------------
export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div style={{ padding: '40px 18px', textAlign: 'center', color: COLORS.textMuted }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 3,
          border: `1px solid ${COLORS.border}`,
          background: COLORS.bgSubtle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 12px',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLORS.textMuted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 9h18M8 4v16" />
        </svg>
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: COLORS.textSecondary }}>{title}</div>
      {hint && <div style={{ fontSize: 12.5, marginTop: 4 }}>{hint}</div>}
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
