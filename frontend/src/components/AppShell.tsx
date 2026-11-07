'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Dropdown } from 'antd';
import { useAuthStore } from '@/store/auth';
import { COLORS, ROLE_HUE } from '@/lib/theme';
import { UserRole } from '@/types';
import { initialOf } from '@/lib/format';
import { Pill } from '@/components/ui';

// ---- 图标 ----
function Icon({ name }: { name: string }) {
  const common = {
    width: 17,
    height: 17,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'grid':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="8" /><rect x="14" y="3" width="7" height="5" />
          <rect x="14" y="12" width="7" height="9" /><rect x="3" y="15" width="7" height="6" />
        </svg>
      );
    case 'wallet':
      return <svg {...common}><rect x="2" y="6" width="20" height="13" /><path d="M16 12h2" /><path d="M2 10h20" /></svg>;
    case 'list':
      return <svg {...common}><path d="M3 6h18M3 12h18M3 18h12" /></svg>;
    case 'clock':
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case 'users':
      return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /></svg>;
    case 'chart':
      return <svg {...common}><path d="M3 3v18h18" /><path d="M7 14l4-4 3 3 5-6" /></svg>;
    case 'home':
      return <svg {...common}><path d="M3 21V8l9-5 9 5v13" /><path d="M3 21h18M9 21v-6h6v6" /></svg>;
    case 'check':
      return <svg {...common}><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>;
    case 'compass':
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M16 8l-2 6-6 2 2-6z" /></svg>;
    case 'star':
      return <svg {...common}><path d="M12 2l3 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.9 21l1.2-6.8-5-4.9 6.9-1z" /></svg>;
    default:
      return null;
  }
}

interface NavItem {
  key: string;
  label: string;
  icon: string;
}

const NAV: Record<string, { group: string; items: NavItem[] }> = {
  player: {
    group: '玩家工作台',
    items: [
      { key: '/dashboard', label: '控制台', icon: 'grid' },
      { key: '/player/balances', label: '我的余额', icon: 'wallet' },
      { key: '/player/transactions', label: '余额流水', icon: 'list' },
      { key: '/player/records', label: '游玩记录', icon: 'clock' },
      { key: '/player/reviews', label: '我的评价', icon: 'star' },
    ],
  },
  provider: {
    group: '服务者工作台',
    items: [
      { key: '/dashboard', label: '控制台', icon: 'grid' },
      { key: '/provider/accounts', label: '玩家账户管理', icon: 'users' },
      { key: '/provider/play-records', label: '游玩记录', icon: 'clock' },
      { key: '/provider/earnings', label: '收益汇总', icon: 'chart' },
      { key: '/provider/studios', label: '工作室归属', icon: 'home' },
    ],
  },
  studio: {
    group: '工作室工作台',
    items: [
      { key: '/dashboard', label: '控制台', icon: 'grid' },
      { key: '/studio/approvals', label: '入驻申请审批', icon: 'check' },
      { key: '/studio/members', label: '成员管理', icon: 'users' },
      { key: '/studio/manage', label: '工作室信息', icon: 'home' },
    ],
  },
};

const SUBTITLE: Record<string, string> = {
  '/player/balances': '按服务者分别记账，点击查看明细',
  '/player/transactions': '每一笔余额变动，含变动前后金额',
  '/player/records': '你的陪玩历史，区分进行中与已完成',
  '/player/reviews': '你对服务者与工作室的评价',
  '/provider/accounts': '管理你服务的玩家余额，发起充值、扣费或退款',
  '/provider/play-records': '开局、完成结算与取消记录',
  '/provider/earnings': '按余额类型统计你的收益',
  '/provider/studios': '当前归属状态与加入申请进度',
  '/studio/approvals': '审核服务者的加入申请',
  '/studio/members': '已加入工作室的服务者',
  '/studio/manage': '维护你的工作室资料',
  '/studios': '寻找并申请加入心仪的工作室',
  '/settings': '管理你的账号资料',
};

function titleFor(pathname: string, role?: UserRole): { title: string; sub: string } {
  if (pathname === '/dashboard') {
    const sub =
      role === UserRole.PLAYER
        ? '你的余额、对局与流水'
        : role === UserRole.PROVIDER
        ? '玩家账户、待办与近 7 天局数'
        : '成员、流水与待审批申请';
    return { title: '控制台', sub };
  }
  for (const role0 of Object.values(NAV)) {
    const item = role0.items.find((i) => i.key === pathname);
    if (item) return { title: item.label, sub: SUBTITLE[pathname] || '' };
  }
  if (pathname.startsWith('/studios/')) return { title: '工作室详情', sub: '查看简介、评价并申请加入' };
  if (pathname === '/studios') return { title: '浏览工作室', sub: SUBTITLE['/studios'] };
  if (pathname === '/settings') return { title: '账号设置', sub: SUBTITLE['/settings'] };
  return { title: '陪玩平台', sub: '' };
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const role = user?.role || UserRole.PLAYER;
  const nav = NAV[role];
  const meHue = ROLE_HUE[role] || COLORS.primary;
  const roleLabel = role === UserRole.PLAYER ? '玩家' : role === UserRole.PROVIDER ? '服务者' : '工作室';
  const { title, sub } = titleFor(pathname, role);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (key: string) => (key === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(key));

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <aside className={`pm-sidebar${mobileOpen ? ' open' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '18px 14px 16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '2px 6px 16px',
              borderBottom: `1px solid ${COLORS.divider}`,
              marginBottom: 14,
            }}
          >
            <div
              className="font-display"
              style={{
                width: 36,
                height: 36,
                borderRadius: 4,
                background: COLORS.textPrimary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 18,
                color: '#fff',
                flex: 'none',
              }}
            >
              陪
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>陪玩平台</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 1 }}>账目与战绩</div>
            </div>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: COLORS.textMuted, padding: '0 10px 8px' }}>
              {nav.group}
            </div>
            {nav.items.map((item) => {
              const active = isActive(item.key);
              return (
                <button
                  key={item.key}
                  onClick={() => router.push(item.key)}
                  className={`pm-nav-item${active ? ' active' : ''}`}
                >
                  <Icon name={item.icon} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {role === UserRole.PROVIDER && (
            <button
              onClick={() => router.push('/studios')}
              className="pm-btn pm-btn-ghost"
              style={{ width: '100%', height: 36, fontSize: 12.5, marginTop: 8 }}
            >
              <Icon name="compass" /> 浏览工作室
            </button>
          )}

          <div style={{ marginTop: 14, padding: 10, background: COLORS.bgSubtle, borderRadius: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div
                className="font-display"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 3,
                  background: meHue,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 13,
                  flex: 'none',
                }}
              >
                {initialOf(user?.nickname || user?.username)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: COLORS.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.nickname || user?.username}
                </div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 1 }}>{roleLabel}</div>
              </div>
            </div>
          </div>
        </div>
      </aside>
      <div className={`pm-overlay${mobileOpen ? ' open' : ''}`} onClick={() => setMobileOpen(false)} />

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <header
          className="pm-topbar"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
            padding: '13px 28px',
            background: COLORS.bgCard,
            borderBottom: `1px solid ${COLORS.border}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <button
              className="pm-mobile-btn"
              aria-label="打开菜单"
              onClick={() => setMobileOpen(true)}
              style={{
                border: `1px solid ${COLORS.border}`,
                background: COLORS.bgCard,
                borderRadius: 3,
                width: 36,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flex: 'none',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLORS.textPrimary} strokeWidth="1.8" strokeLinecap="round">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>
            <div style={{ minWidth: 0 }}>
              <h1 className="font-display" style={{ margin: 0, fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em', color: COLORS.textPrimary }}>
                {title}
              </h1>
              {sub && <p style={{ margin: '2px 0 0', fontSize: 12.5, color: COLORS.textSecondary }}>{sub}</p>}
            </div>
          </div>

          <Dropdown
            menu={{
              items: [
                { key: 'settings', label: '账号设置', onClick: () => router.push('/settings') },
                { key: 'logout', label: '退出登录', danger: true, onClick: () => logout() },
              ],
            }}
          >
            <button
              className="pm-row"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '4px 6px',
                border: 'none',
                background: 'transparent',
                borderRadius: 3,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div
                className="font-display"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 3,
                  background: meHue,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                {initialOf(user?.nickname || user?.username)}
              </div>
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{user?.nickname || user?.username}</div>
                <div style={{ marginTop: 3 }}>
                  <Pill color={meHue}>{roleLabel}</Pill>
                </div>
              </div>
            </button>
          </Dropdown>
        </header>

        <main className="pm-content" style={{ flex: 1, padding: '26px 32px 64px', maxWidth: 1220, width: '100%' }}>{children}</main>
      </div>
    </div>
  );
}
