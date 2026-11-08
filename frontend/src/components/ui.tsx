'use client';

import React from 'react';
import { COLORS } from '@/lib/theme';
import { initialOf } from '@/lib/format';

// ---------------- 印章 / 状态 ----------------
export type StampTone = 'ink' | 'attention' | 'attention-solid' | 'muted';

export function Stamp({
  children,
  tone = 'muted',
  rotate = false,
  className = '',
}: {
  children: React.ReactNode;
  tone?: StampTone;
  rotate?: boolean;
  className?: string;
}) {
  return (
    <span className={`pm-stamp tone-${tone}${rotate ? ' pm-stamp-rotate' : ''}${className ? ` ${className}` : ''}`}>
      {children}
    </span>
  );
}

// 兼容旧调用点：颜色不再承载语义，按 tone 渲染。
export function Pill({
  children,
  color,
  tone,
}: {
  children: React.ReactNode;
  color?: string;
  bg?: string;
  tone?: StampTone;
}) {
  const resolved: StampTone =
    tone ||
    (color === COLORS.danger || color === COLORS.signal
      ? 'attention'
      : color === COLORS.textMuted
        ? 'muted'
        : 'ink');
  return <Stamp tone={resolved}>{children}</Stamp>;
}

// ---------------- 账签（替代 seed 取色头像） ----------------
export function AccountTag({
  name,
  avatar,
  size = 24,
  initial,
  className = '',
}: {
  name?: string;
  avatar?: string;
  size?: number;
  initial?: string;
  className?: string;
}) {
  return (
    <span
      className={`pm-tag${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size, fontSize: Math.max(12, Math.round(size * 0.54)) }}
      aria-hidden="true"
    >
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt="" />
      ) : (
        initial || initialOf(name)
      )}
    </span>
  );
}

// 旧 API 兼容：seed / hue 已废弃，账户签不再取色。
export function Avatar(props: {
  name?: string;
  seed?: number | string;
  size?: number;
  hue?: string;
  avatar?: string;
}) {
  return <AccountTag name={props.name} avatar={props.avatar} size={props.size ?? 40} />;
}

// ---------------- 账头 ----------------
export interface LedgerHeadItem {
  label: string;
  value: React.ReactNode;
  unit?: string;
  sub?: string;
  attention?: boolean;
}

export function LedgerHead({
  items,
  variant = 'lead',
}: {
  items: LedgerHeadItem[];
  variant?: 'lead' | 'compact';
}) {
  return (
    <dl className={`pm-ledger-head${variant === 'compact' ? ' compact' : ''}`}>
      {items.map((item, index) => (
        <div className="pm-ledger-head-item" key={`${item.label}-${index}`}>
          <dt>{item.label}</dt>
          <dd>
            <span className={`pm-ledger-value${item.attention ? ' attention' : ''}`}>{item.value}</span>
            {item.unit && <span className="pm-ledger-unit">{item.unit}</span>}
          </dd>
          {item.sub && <div className="pm-ledger-subline">{item.sub}</div>}
        </div>
      ))}
    </dl>
  );
}

// ---------------- 区块：标题 + 账线 + 动作 ----------------
export function SectionBlock({
  title,
  action,
  attention = false,
  flush = false,
  children,
  className = '',
}: {
  title: React.ReactNode;
  action?: React.ReactNode;
  attention?: boolean;
  flush?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`pm-block${className ? ` ${className}` : ''}`}>
      <div className="pm-block-head">
        <span
          className="pm-block-attention"
          aria-hidden="true"
          style={{ visibility: attention ? 'visible' : 'hidden' }}
        />
        <h2 className="pm-block-title">{title}</h2>
        <span className="pm-block-rule" aria-hidden="true" />
        {action ? <div className="pm-block-action">{action}</div> : null}
      </div>
      <div className={`pm-block-body${flush ? ' flush' : ''}`}>{children}</div>
    </section>
  );
}

// 旧 SectionCard 兼容：映射到无卡片区块。
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
    <SectionBlock title={title ?? ''} action={extra} flush={!bodyPad}>
      {children}
    </SectionBlock>
  );
}

// ---------------- 账本表 ----------------
export interface LedgerColumn {
  key: string;
  label: string;
  align?: 'left' | 'right';
  width?: string;
  hide?: 'sm' | 'md';
}

export interface LedgerRow {
  key: string | number;
  cells: Record<string, React.ReactNode>;
  rowClassName?: string;
}

export function LedgerTable({
  columns,
  rows,
  caption = '',
  empty,
  className = '',
}: {
  columns: LedgerColumn[];
  rows: LedgerRow[];
  caption?: string;
  empty?: React.ReactNode;
  className?: string;
}) {
  if (rows.length === 0 && empty) return <>{empty}</>;

  return (
    <div className="pm-table-wrap">
      <table className={`pm-table${className ? ` ${className}` : ''}`}>
        <caption className="pm-sr-only">{caption}</caption>
        <colgroup>
          {columns.map((column) => (
            <col key={column.key} style={column.width ? { width: column.width } : undefined} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`${column.align === 'right' ? 'pm-num' : ''}${
                  column.hide === 'sm' ? ' pm-hide-sm' : column.hide === 'md' ? ' pm-hide-md' : ''
                }`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className={row.rowClassName}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  data-label={column.label}
                  className={`${column.align === 'right' ? 'pm-num' : ''}${
                    column.hide === 'sm' ? ' pm-hide-sm' : column.hide === 'md' ? ' pm-hide-md' : ''
                  }`}
                >
                  {row.cells[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------- 近 7 天方头墨柱 ----------------
export function Tally({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((item) => item.count));
  const todayIndex = data.length - 1;
  const label = data.map((item) => `${item.date.slice(-2)} 日 ${item.count} 局`).join('，');
  return (
    <div className="pm-tally" role="img" aria-label={label}>
      {data.map((item, index) => (
        <div key={item.date} className={`pm-tally-col${index === todayIndex ? ' today' : ''}`}>
          <span className="pm-tally-count">{item.count}</span>
          <span
            className="pm-tally-bar"
            style={{ height: `${Math.max(2, Math.round((item.count / max) * 72))}px` }}
          />
          <span className="pm-tally-label">
            {item.date.slice(-2)}
            {index === todayIndex && <span className="pm-tally-today">今</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------- 评分方块 ----------------
export function RatingSquares({
  rating,
  showValue = true,
}: {
  rating: number;
  showValue?: boolean;
}) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span className="pm-rating" aria-label={`评分 ${rating.toFixed(1)}`}>
      {[1, 2, 3, 4, 5].map((index) => (
        <span
          key={index}
          className={`pm-rating-square${index <= filled ? ' on' : ''}`}
          aria-hidden="true"
        />
      ))}
      {showValue && <span style={{ marginLeft: 4 }}>{rating.toFixed(1)}</span>}
    </span>
  );
}

// 旧 Stars 兼容：星形图标换成评分方块。
export function Stars({ rating }: { rating: number; size?: number }) {
  return <RatingSquares rating={rating} />;
}

// ---------------- 空状态 / 加载 ----------------
export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="pm-empty">
      <div className="pm-empty-title">{title}</div>
      {hint && <div className="pm-empty-hint">{hint}</div>}
      {action && <div className="pm-empty-action">{action}</div>}
    </div>
  );
}

export function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <EmptyState
      title="加载失败，请重试"
      action={<TextAction onClick={onRetry}>重新加载</TextAction>}
    />
  );
}

export function SkeletonLedger({ rows = 4 }: { rows?: number }) {
  return (
    <div className="pm-skeleton" aria-busy="true" aria-label="加载中">
      {Array.from({ length: rows }).map((_, index) => (
        <div className="pm-skeleton-line" key={index} />
      ))}
    </div>
  );
}

// ---------------- 文字动作 ----------------
export function TextAction({
  children,
  onClick,
  disabled = false,
  tone = 'ink',
  ariaLabel,
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: 'ink' | 'danger';
  ariaLabel?: string;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      className={`pm-action${tone === 'danger' ? ' pm-action-danger' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </button>
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
  return <div className={`pm-note-banner${tone === 'warn' ? ' warn' : ''}`}>{children}</div>;
}
