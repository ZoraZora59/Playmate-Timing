'use client';

import React, { useEffect, useState } from 'react';
import { App } from 'antd';
import { COLORS } from '@/lib/theme';
import { BalanceType } from '@/types';
import { balanceMeta, formatBalance, toNum } from '@/lib/format';
import apiClient from '@/lib/api';

export interface PlayerLite {
  player_id: number;
  nickname: string;
  money: string | number;
  time: string | number;
  point: string | number;
}

interface Props {
  open: boolean;
  mode: 'recharge' | 'deduct';
  player: PlayerLite | null;
  providerId: number;
  asStudio?: boolean;
  onClose: () => void;
  onDone: () => void;
}

const TYPES: BalanceType[] = [BalanceType.MONEY, BalanceType.TIME, BalanceType.POINT];

export default function BalanceOpModal({ open, mode, player, providerId, asStudio, onClose, onDone }: Props) {
  const { message } = App.useApp();
  const [type, setType] = useState<BalanceType>(BalanceType.MONEY);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [step, setStep] = useState<'edit' | 'review'>('edit');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setType(BalanceType.MONEY);
      setAmount('');
      setNote('');
      setStep('edit');
    }
  }, [open, player, mode]);

  if (!open || !player) return null;

  const meta = balanceMeta(type);
  const accent = mode === 'recharge' ? COLORS.money : COLORS.danger;
  const modeLabel = mode === 'recharge' ? '充值' : '扣费';
  const current = type === BalanceType.MONEY ? player.money : type === BalanceType.TIME ? player.time : player.point;
  const before = toNum(current);
  const amt = toNum(amount);
  const after = mode === 'recharge' ? before + amt : Math.max(0, before - amt);
  const canNext = amt > 0;

  const submit = async () => {
    setSubmitting(true);
    try {
      const form = {
        player_id: player.player_id,
        provider_id: providerId,
        type,
        amount: amt,
        description: note,
      };
      if (mode === 'recharge') await apiClient.recharge(form, asStudio);
      else await apiClient.deduct(form, asStudio);
      message.success(`已为 ${player.nickname} ${modeLabel} ${formatBalance(type, amt)}`);
      onDone();
      onClose();
    } catch (e) {
      message.error(e instanceof Error ? e.message : '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const typeBtn = (t: BalanceType) => {
    const m = balanceMeta(t);
    const active = type === t;
    const label = t === BalanceType.MONEY ? '金额 ¥' : t === BalanceType.TIME ? '时间 分' : '点数 点';
    return (
      <button
        key={t}
        onClick={() => { setType(t); setAmount(''); }}
        style={{
          flex: 1, padding: '11px 0', borderRadius: 11, font: "600 13px 'Noto Sans SC',sans-serif", cursor: 'pointer',
          border: `1.5px solid ${active ? m.color : COLORS.border}`,
          background: active ? m.softBg : '#fff',
          color: active ? m.color : COLORS.textSecondary,
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(22,23,42,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'ovl .2s ease both' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-pop"
        style={{ width: 440, maxWidth: '92vw', background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,.35)' }}
      >
        {/* header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid ' + COLORS.divider, display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              {mode === 'recharge' ? <path d="M12 5v14M5 12h14" /> : <path d="M5 12h14" />}
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{modeLabel} · {player.nickname}</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted }}>当前{meta.label}余额 {formatBalance(type, before)}</div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: COLORS.bgPage, width: 30, height: 30, borderRadius: 9, color: COLORS.textSecondary, cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>✕</button>
        </div>

        {step === 'edit' ? (
          <>
            <div style={{ padding: '22px 24px' }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 9 }}>余额类型</div>
              <div style={{ display: 'flex', gap: 9, marginBottom: 20 }}>{TYPES.map(typeBtn)}</div>

              <div style={{ fontSize: 12.5, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 9 }}>{modeLabel}数量</div>
              <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid ' + COLORS.border, borderRadius: 12, padding: '0 16px', marginBottom: 20 }}>
                {type === BalanceType.MONEY && <span className="font-display" style={{ fontSize: 22, color: COLORS.textMuted, marginRight: 6 }}>¥</span>}
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                  inputMode="decimal"
                  placeholder="0"
                  autoFocus
                  className="font-display"
                  style={{ flex: 1, border: 'none', outline: 'none', padding: '14px 0', fontSize: 24, fontWeight: 600, color: COLORS.textPrimary, background: 'none', width: '100%' }}
                />
                <span style={{ fontSize: 13, color: COLORS.textMuted }}>{type === BalanceType.TIME ? '分钟' : type === BalanceType.POINT ? '点' : ''}</span>
              </div>

              <div style={{ fontSize: 12.5, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 9 }}>备注（可选）</div>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="例如：微信收款 / 排位陪练"
                style={{ width: '100%', border: '1.5px solid ' + COLORS.border, borderRadius: 12, padding: '12px 14px', fontSize: 13.5, color: COLORS.textPrimary, outline: 'none', background: 'none' }}
              />
            </div>
            <div style={{ padding: '0 24px 22px', display: 'flex', gap: 11 }}>
              <button onClick={onClose} style={{ flex: 1, padding: 13, border: '1px solid ' + COLORS.border, borderRadius: 12, background: '#fff', color: COLORS.textSecondary, font: "600 14px 'Noto Sans SC',sans-serif", cursor: 'pointer' }}>取消</button>
              <button
                disabled={!canNext}
                onClick={() => canNext && setStep('review')}
                style={{ flex: 1.6, padding: 13, border: 'none', borderRadius: 12, background: canNext ? COLORS.primary : '#C7C9D9', color: '#fff', font: "600 14px 'Noto Sans SC',sans-serif", cursor: canNext ? 'pointer' : 'not-allowed' }}
              >
                下一步 · 确认
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ padding: '22px 24px' }}>
              <div style={{ background: COLORS.bgSubtle, border: '1px solid ' + COLORS.divider, borderRadius: 14, padding: '18px 20px', marginBottom: 16 }}>
                <Row label="操作"><span style={{ fontSize: 14, fontWeight: 600, color: accent }}>{modeLabel} · {meta.label}</span></Row>
                <Row label={`${modeLabel}数量`}><span className="font-display" style={{ fontSize: 20, fontWeight: 700, color: accent }}>{formatBalance(type, amt)}</span></Row>
                <Row label="余额变化" last>
                  <span className="font-display" style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 600 }}>
                    <span style={{ color: COLORS.textMuted, fontSize: 15 }}>{formatBalance(type, before)}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                    <span style={{ color: COLORS.textPrimary, fontSize: 17 }}>{formatBalance(type, after)}</span>
                  </span>
                </Row>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 14px', background: COLORS.warnBg, borderRadius: 11, color: COLORS.warnText, fontSize: 12.5, lineHeight: 1.5 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flex: 'none' }}><path d="M12 9v4M12 17h.01" /><circle cx="12" cy="12" r="10" /></svg>
                请确认数额无误，提交后将立即写入 {player.nickname} 的账户流水。
              </div>
            </div>
            <div style={{ padding: '0 24px 22px', display: 'flex', gap: 11 }}>
              <button onClick={() => setStep('edit')} style={{ flex: 1, padding: 13, border: '1px solid ' + COLORS.border, borderRadius: 12, background: '#fff', color: COLORS.textSecondary, font: "600 14px 'Noto Sans SC',sans-serif", cursor: 'pointer' }}>返回修改</button>
              <button disabled={submitting} onClick={submit} style={{ flex: 1.6, padding: 13, border: 'none', borderRadius: 12, background: accent, color: '#fff', font: "600 14px 'Noto Sans SC',sans-serif", cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? '提交中…' : '确认提交'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: last ? '13px 0 0' : '0 0 13px', borderBottom: last ? 'none' : '1px dashed #E6E7EF', marginTop: last ? 0 : undefined }}>
      <span style={{ fontSize: 13, color: COLORS.textSecondary }}>{label}</span>
      {children}
    </div>
  );
}
