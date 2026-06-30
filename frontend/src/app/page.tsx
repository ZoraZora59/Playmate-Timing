'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'antd';
import { COLORS } from '@/lib/theme';
import { UserRole } from '@/types';
import { useAuthStore } from '@/store/auth';

interface RoleEntry {
  role: UserRole;
  badge: string;
  title: string;
  en: string;
  desc: string;
  points: string[];
  hue: string;
  hueSoft: string;
}

const ROLE_ENTRIES: RoleEntry[] = [
  {
    role: UserRole.PLAYER,
    badge: '玩',
    title: '玩家',
    en: 'PLAYER',
    desc: '查看每位服务者处的独立余额、游玩记录与历史流水，随时给服务打分评价。',
    points: ['多账户余额一目了然', '游玩记录时间轴', '匿名 / 实名评价'],
    hue: COLORS.primary,
    hueSoft: COLORS.primarySoft,
  },
  {
    role: UserRole.PROVIDER,
    badge: '服',
    title: '陪玩服务者',
    en: 'PROVIDER',
    desc: '管理玩家余额、充值扣费、查看收益走势，并申请加入心仪的工作室。',
    points: ['玩家账户充值 / 扣费', '收益汇总与趋势', '申请加入工作室'],
    hue: COLORS.teal,
    hueSoft: '#E3F8F5',
  },
  {
    role: UserRole.STUDIO,
    badge: '室',
    title: '工作室',
    en: 'STUDIO',
    desc: '统一运营多名服务者，审批入驻申请，掌握成员表现与整体经营数据。',
    points: ['入驻申请审批', '成员与服务者管理', '整体经营看板'],
    hue: COLORS.point,
    hueSoft: COLORS.pointSoft,
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

  return (
    <div className="animate-pop" style={{ minHeight: '100vh', background: COLORS.bgPage }}>
      {/* ===== 顶部导航（落地页自带） ===== */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
          padding: '16px 34px',
          background: 'rgba(244,245,250,.82)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div
            className="font-display"
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              background: `linear-gradient(135deg,${COLORS.primary},${COLORS.cyan})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 19,
              color: '#fff',
              boxShadow: '0 6px 16px rgba(91,84,240,.4)',
            }}
          >
            陪
          </div>
          <div>
            <div
              className="font-display"
              style={{ fontWeight: 700, fontSize: 16, color: COLORS.textPrimary, letterSpacing: '.2px' }}
            >
              陪玩平台
            </div>
            <div
              className="font-display"
              style={{ fontSize: 10.5, color: COLORS.textMuted, letterSpacing: 2 }}
            >
              COMPANION HUB
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isAuthenticated ? (
            <Button
              type="primary"
              size="large"
              style={{ borderRadius: 11, fontWeight: 600, paddingInline: 22 }}
              onClick={() => router.push('/dashboard')}
            >
              进入控制台
            </Button>
          ) : (
            <>
              <Button
                size="large"
                style={{
                  borderRadius: 11,
                  fontWeight: 600,
                  borderColor: COLORS.border,
                  color: COLORS.textPrimary,
                }}
                onClick={() => router.push('/auth/login')}
              >
                登录
              </Button>
              <Button
                type="primary"
                size="large"
                style={{ borderRadius: 11, fontWeight: 600, paddingInline: 22 }}
                onClick={() => router.push('/auth/register')}
              >
                注册
              </Button>
            </>
          )}
        </div>
      </header>

      <main style={{ maxWidth: 1180, width: '100%', margin: '0 auto', padding: '40px 34px 72px' }}>
        {/* ===== Hero ===== */}
        <section
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 22,
            padding: '54px 48px 58px',
            marginBottom: 40,
            background: `linear-gradient(135deg, ${COLORS.sidebar} 0%, #2E2A6B 60%, #3D3490 100%)`,
            color: '#fff',
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: -60,
              top: -60,
              width: 280,
              height: 280,
              borderRadius: '50%',
              background: 'radial-gradient(circle,rgba(21,200,216,.35),transparent 70%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: -40,
              bottom: -80,
              width: 240,
              height: 240,
              borderRadius: '50%',
              background: 'radial-gradient(circle,rgba(91,84,240,.4),transparent 70%)',
            }}
          />
          <div style={{ position: 'relative', maxWidth: 720 }}>
            <span
              style={{
                display: 'inline-block',
                padding: '6px 14px',
                borderRadius: 20,
                background: 'rgba(255,255,255,.12)',
                fontSize: 12.5,
                fontWeight: 600,
                letterSpacing: '.5px',
                marginBottom: 22,
              }}
            >
              陪玩工作室 · 服务者 · 玩家 三方信息平台
            </span>
            <h1
              className="font-display"
              style={{
                margin: 0,
                fontWeight: 700,
                fontSize: 50,
                lineHeight: 1.12,
                letterSpacing: '-1px',
              }}
            >
              让陪玩服务的每一笔
              <br />
              余额、记录与评价都<span style={{ color: COLORS.cyan }}>清清楚楚</span>
            </h1>
            <p
              style={{
                margin: '20px 0 0',
                fontSize: 16,
                lineHeight: 1.7,
                color: 'rgba(255,255,255,.72)',
                maxWidth: 600,
              }}
            >
              一站式管理玩家余额、陪玩记录、收益结算与工作室协作。玩家看得明白，服务者算得清楚，工作室管得高效。
            </p>
            <div style={{ display: 'flex', gap: 14, marginTop: 32, flexWrap: 'wrap' }}>
              {isAuthenticated ? (
                <Button
                  type="primary"
                  size="large"
                  style={{ borderRadius: 12, fontWeight: 600, height: 46, paddingInline: 28 }}
                  onClick={() => router.push('/dashboard')}
                >
                  进入控制台 →
                </Button>
              ) : (
                <>
                  <Button
                    size="large"
                    style={{
                      borderRadius: 12,
                      fontWeight: 600,
                      height: 46,
                      paddingInline: 28,
                      background: '#fff',
                      color: COLORS.primary,
                      border: 'none',
                    }}
                    onClick={() => router.push('/auth/register')}
                  >
                    免费注册 →
                  </Button>
                  <Button
                    size="large"
                    style={{
                      borderRadius: 12,
                      fontWeight: 600,
                      height: 46,
                      paddingInline: 28,
                      background: 'rgba(255,255,255,.1)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,.25)',
                    }}
                    onClick={() => router.push('/auth/login')}
                  >
                    已有账号登录
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ===== 角色入口 ===== */}
        <div style={{ marginBottom: 22 }}>
          <h2
            className="font-display"
            style={{ margin: 0, fontSize: 24, fontWeight: 700, color: COLORS.textPrimary }}
          >
            选择你的身份，立即开始
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: COLORS.textSecondary }}>
            三种角色对应不同的工作台，注册后即可进入对应控制台。
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: 18,
          }}
        >
          {ROLE_ENTRIES.map((entry) => (
            <button
              key={entry.role}
              onClick={() => router.push(`/auth/register?role=${entry.role}`)}
              style={{
                textAlign: 'left',
                cursor: 'pointer',
                background: COLORS.bgCard,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 18,
                padding: '24px 24px 26px',
                display: 'flex',
                flexDirection: 'column',
                transition: '.18s',
                boxShadow: '0 1px 2px rgba(27,28,51,.03)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = entry.hue;
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(27,28,51,.08)';
                e.currentTarget.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = COLORS.border;
                e.currentTarget.style.boxShadow = '0 1px 2px rgba(27,28,51,.03)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 16 }}>
                <div
                  className="font-display"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 13,
                    background: entry.hue,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 20,
                  }}
                >
                  {entry.badge}
                </div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: COLORS.textPrimary }}>
                    {entry.title}
                  </div>
                  <div
                    className="font-display"
                    style={{ fontSize: 11, letterSpacing: 1.5, color: COLORS.textMuted }}
                  >
                    {entry.en}
                  </div>
                </div>
              </div>

              <p
                style={{
                  margin: '0 0 16px',
                  fontSize: 13.5,
                  lineHeight: 1.7,
                  color: COLORS.textSecondary,
                  flex: 1,
                }}
              >
                {entry.desc}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                {entry.points.map((p) => (
                  <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 7,
                        background: entry.hueSoft,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 'none',
                      }}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={entry.hue}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </span>
                    <span style={{ fontSize: 13, color: COLORS.textPrimary }}>{p}</span>
                  </div>
                ))}
              </div>

              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  alignSelf: 'flex-start',
                  padding: '9px 16px',
                  borderRadius: 11,
                  background: entry.hueSoft,
                  color: entry.hue,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                注册为{entry.title} →
              </span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
