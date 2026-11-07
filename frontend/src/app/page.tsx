'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { COLORS } from '@/lib/theme';
import { UserRole } from '@/types';
import { useAuthStore } from '@/store/auth';
import { Avatar, Pill } from '@/components/ui';

interface RoleEntry {
  role: UserRole;
  name: string;
  desc: string;
  hue: string;
}

const ROLE_ENTRIES: RoleEntry[] = [
  {
    role: UserRole.PLAYER,
    name: '玩家',
    desc: '查看在每位服务者处的余额、对局与评价。',
    hue: COLORS.primary,
  },
  {
    role: UserRole.PROVIDER,
    name: '服务者',
    desc: '管理玩家账户，开局、结算与收益。',
    hue: COLORS.teal,
  },
  {
    role: UserRole.STUDIO,
    name: '工作室',
    desc: '审批入驻、管理成员与经营数据。',
    hue: COLORS.signal,
  },
];

interface BoardRow {
  name: string;
  game: string;
  mode: string;
  money: string;
  time: string;
  point: string;
  status: string;
  statusColor: string;
}

const BOARD_ROWS: BoardRow[] = [
  { name: '晚风', game: '王者荣耀', mode: '排位赛', money: '328.50', time: '240', point: '1,500', status: '活跃', statusColor: COLORS.money },
  { name: '青野', game: '无畏契约', mode: '匹配', money: '86.00', time: '90', point: '320', status: '昨日', statusColor: COLORS.textMuted },
  { name: '小满', game: '永劫无间', mode: '三排', money: '0.00', time: '45', point: '0', status: '待充值', statusColor: COLORS.signal },
];

const RULES = [
  {
    label: '分开记',
    title: '每位服务者一个账户',
    desc: '同一玩家在不同服务者处的余额互不混用。',
    hue: COLORS.money,
  },
  {
    label: '连起来',
    title: '对局与结算同一条记录',
    desc: '开局、时长、消费与状态，都落在同一局上。',
    hue: COLORS.time,
  },
  {
    label: '可追溯',
    title: '评价跟着对局走',
    desc: '评价来自真实完成的对局，也可以匿名。',
    hue: COLORS.point,
  },
];

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, loadProfile } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && !user) {
      loadProfile();
    }
  }, [isAuthenticated, user, loadProfile]);

  const brand = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div
        className="font-display"
        style={{
          width: 32,
          height: 32,
          borderRadius: 4,
          background: COLORS.textPrimary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 16,
          color: '#fff',
        }}
      >
        陪
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>陪玩平台</div>
        <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 1 }}>账目与战绩</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bgPage }}>
      <header style={{ background: COLORS.bgCard, borderBottom: `1px solid ${COLORS.border}` }}>
        <div
          style={{
            maxWidth: 1180,
            margin: '0 auto',
            padding: '0 clamp(16px, 4vw, 32px)',
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
          }}
        >
          {brand}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isAuthenticated ? (
              <button className="pm-btn pm-btn-primary" onClick={() => router.push('/dashboard')}>
                进入控制台
              </button>
            ) : (
              <>
                <button className="pm-btn pm-btn-ghost" onClick={() => router.push('/auth/login')}>
                  登录
                </button>
                <button className="pm-btn pm-btn-primary" onClick={() => router.push('/auth/register')}>
                  注册账号
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1180, margin: '0 auto', padding: '0 clamp(16px, 4vw, 32px)' }}>
        <section className="pm-hero">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', marginBottom: 24 }}>
              {ROLE_ENTRIES.map((r) => (
                <span key={r.role} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, color: COLORS.textSecondary }}>
                  <span style={{ width: 7, height: 7, borderRadius: 1, background: r.hue }} />
                  {r.name}
                </span>
              ))}
            </div>

            <h1
              className="font-display"
              style={{
                margin: 0,
                fontWeight: 700,
                fontSize: 'clamp(36px, 5vw, 50px)',
                lineHeight: 1.1,
                letterSpacing: '-0.045em',
                color: COLORS.textPrimary,
                maxWidth: 540,
              }}
            >
              把每一局，
              <br />
              记成一本明白账。
            </h1>

            <p style={{ margin: '20px 0 0', fontSize: 15, lineHeight: 1.8, color: COLORS.textSecondary, maxWidth: 450 }}>
              玩家在每位服务者处的余额、每一局的时间与消费、每一次评价，都在同一个地方对齐。
            </p>

            <div style={{ display: 'flex', gap: 10, marginTop: 30, flexWrap: 'wrap' }}>
              {isAuthenticated ? (
                <button className="pm-btn pm-btn-primary" style={{ height: 44, padding: '0 22px' }} onClick={() => router.push('/dashboard')}>
                  继续到控制台
                </button>
              ) : (
                <>
                  <button className="pm-btn pm-btn-primary" style={{ height: 44, padding: '0 22px' }} onClick={() => router.push('/auth/register')}>
                    注册账号
                  </button>
                  <button className="pm-btn pm-btn-ghost" style={{ height: 44, padding: '0 22px' }} onClick={() => router.push('/auth/login')}>
                    已有账号登录
                  </button>
                </>
              )}
            </div>

            {!isAuthenticated && (
              <div style={{ marginTop: 38 }}>
                {ROLE_ENTRIES.map((r) => (
                  <button
                    key={r.role}
                    className="pm-role-row"
                    onClick={() => router.push(`/auth/register?role=${r.role}`)}
                  >
                    <span style={{ width: 4, height: 34, borderRadius: 1, background: r.hue }} />
                    <span>
                      <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: COLORS.textPrimary }}>{r.name}</span>
                      <span style={{ display: 'block', fontSize: 12.5, color: COLORS.textSecondary, marginTop: 2 }}>{r.desc}</span>
                    </span>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: r.hue }}>注册</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="pm-board">
              <div
                style={{
                  height: 48,
                  padding: '0 16px',
                  background: COLORS.primary,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 12.5, fontWeight: 700 }}>玩家账户</span>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: 'rgba(255,255,255,.72)' }}>3 处余额</span>
              </div>

              {BOARD_ROWS.map((row, i) => (
                <div key={row.name} className="pm-board-row board-row" style={{ animationDelay: `${i * 70}ms` }}>
                  <div className="pm-board-name">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <Avatar name={row.name} seed={i + 11} size={28} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>{row.name}</div>
                        <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 1 }}>
                          {row.game} / {row.mode}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="pm-board-cell">
                    <div style={{ fontSize: 10.5, fontWeight: 600, color: COLORS.textMuted }}>金额</div>
                    <div className="num" style={{ fontSize: 19, fontWeight: 700, color: COLORS.money, marginTop: 4 }}>
                      {row.money}
                      <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 2 }}>元</span>
                    </div>
                  </div>
                  <div className="pm-board-cell">
                    <div style={{ fontSize: 10.5, fontWeight: 600, color: COLORS.textMuted }}>时间</div>
                    <div className="num" style={{ fontSize: 19, fontWeight: 700, color: COLORS.time, marginTop: 4 }}>
                      {row.time}
                      <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 2 }}>分</span>
                    </div>
                  </div>
                  <div className="pm-board-cell">
                    <div style={{ fontSize: 10.5, fontWeight: 600, color: COLORS.textMuted }}>点数</div>
                    <div className="num" style={{ fontSize: 19, fontWeight: 700, color: COLORS.point, marginTop: 4 }}>
                      {row.point}
                      <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 2 }}>点</span>
                    </div>
                  </div>
                  <div className="pm-board-status">
                    <Pill color={row.statusColor}>{row.status}</Pill>
                  </div>
                </div>
              ))}

              <div
                style={{
                  padding: '11px 16px',
                  background: COLORS.bgSubtle,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <span style={{ fontSize: 11, color: COLORS.textMuted }}>最近一局</span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: COLORS.textPrimary, marginLeft: 8 }}>
                    王者荣耀 / 排位赛
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="num" style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary }}>60 分钟</span>
                  <span style={{ width: 1, height: 12, background: COLORS.border }} />
                  <span className="num" style={{ fontSize: 12, fontWeight: 700, color: COLORS.money }}>¥50.00</span>
                  <Pill color={COLORS.textMuted}>已完成</Pill>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 12, fontSize: 11.5, color: COLORS.textMuted }}>
              <span>示例账户</span>
              <span>余额按服务者独立记账</span>
            </div>
          </div>
        </section>

        <section style={{ padding: '0 0 64px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, marginBottom: 2 }}>
            <h2 className="font-display" style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: COLORS.textPrimary }}>
              账目怎么记
            </h2>
            <span style={{ fontSize: 12, color: COLORS.textMuted }}>玩家 / 服务者 / 工作室</span>
          </div>
          <div className="pm-rule-strip">
            {RULES.map((rule) => (
              <div key={rule.label} className="pm-rule">
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, fontWeight: 600, color: rule.hue }}>
                  <span style={{ width: 7, height: 7, borderRadius: 1, background: rule.hue }} />
                  {rule.label}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textPrimary, marginTop: 9 }}>{rule.title}</div>
                <div style={{ fontSize: 12.5, lineHeight: 1.7, color: COLORS.textSecondary, marginTop: 5, maxWidth: 300 }}>{rule.desc}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer style={{ borderTop: `1px solid ${COLORS.border}`, background: COLORS.bgCard }}>
        <div
          style={{
            maxWidth: 1180,
            margin: '0 auto',
            padding: '18px clamp(16px, 4vw, 32px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            fontSize: 12,
            color: COLORS.textMuted,
            flexWrap: 'wrap',
          }}
        >
          <span>陪玩平台</span>
          <span>玩家 / 服务者 / 工作室</span>
        </div>
      </footer>
    </div>
  );
}
