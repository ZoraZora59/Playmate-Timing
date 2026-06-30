'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Dropdown } from 'antd';
import { useAuthStore } from '@/store/auth';
import { COLORS, ROLE_HUE } from '@/lib/theme';
import { UserRole } from '@/types';
import { initialOf } from '@/lib/format';

// ---- 图标 ----
function Icon({ name }: { name: string }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'grid':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" />
          <rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" />
        </svg>
      );
    case 'wallet':
      return <svg {...common}><rect x="2" y="6" width="20" height="13" rx="2.5" /><path d="M16 12h2" /><path d="M2 10h20" /></svg>;
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
    group: '玩家 PLAYER',
    items: [
      { key: '/dashboard', label: '控制台', icon: 'grid' },
      { key: '/player/balances', label: '我的余额', icon: 'wallet' },
      { key: '/player/transactions', label: '余额流水', icon: 'list' },
      { key: '/player/records', label: '游玩记录', icon: 'clock' },
    ],
  },
  provider: {
    group: '服务者 PROVIDER',
    items: [
      { key: '/dashboard', label: '控制台', icon: 'grid' },
      { key: '/provider/accounts', label: '玩家账户管理', icon: 'users' },
      { key: '/provider/earnings', label: '收益汇总', icon: 'chart' },
      { key: '/provider/studios', label: '工作室归属', icon: 'home' },
    ],
  },
  studio: {
    group: '工作室 STUDIO',
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
  '/provider/accounts': '管理你服务的玩家余额，发起充值或扣费',
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
        ? '欢迎回来，这里是你的余额与陪玩概览'
        : role === UserRole.PROVIDER
        ? '今日待办与玩家活跃概览'
        : '入驻审批与工作室经营概览';
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
  const role = user?.role || UserRole.PLAYER;
  const nav = NAV[role];
  const meHue = ROLE_HUE[role] || COLORS.primary;
  const roleLabel = role === UserRole.PLAYER ? '玩家' : role === UserRole.PROVIDER ? '服务者' : '工作室';
  const { title, sub } = titleFor(pathname, role);

  const isActive = (key: string) => (key === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(key));

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      {/* SIDEBAR */}
      <aside
        style={{
          width: 248,
          flex: 'none',
          background: COLORS.sidebar,
          display: 'flex',
          flexDirection: 'column',
          padding: '22px 16px 18px',
          position: 'sticky',
          top: 0,
          height: '100vh',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '4px 8px 22px' }}>
          <div
            className="font-display"
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              background: 'linear-gradient(135deg,#5B54F0,#15C8D8)',
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
            <div className="font-display" style={{ fontWeight: 700, fontSize: 16, color: '#fff', letterSpacing: 0.2 }}>陪玩平台</div>
            <div className="font-display" style={{ fontSize: 10.5, color: 'rgba(255,255,255,.4)', letterSpacing: 2 }}>COMPANION HUB</div>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          <div className="font-display" style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 1.5, color: 'rgba(255,255,255,.32)', padding: '8px 14px 6px' }}>
            {nav.group}
          </div>
          {nav.items.map((item) => {
            const active = isActive(item.key);
            return (
              <button
                key={item.key}
                onClick={() => router.push(item.key)}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: '11px 14px 11px 16px',
                  border: 'none',
                  borderRadius: 11,
                  font: "500 14px 'Noto Sans SC', sans-serif",
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: '.15s',
                  background: active ? 'rgba(124,117,255,0.20)' : 'transparent',
                  color: active ? '#fff' : 'rgba(255,255,255,0.58)',
                }}
              >
                <span style={{ position: 'absolute', left: -16, top: '50%', transform: 'translateY(-50%)', width: 3, height: 18, borderRadius: 3, background: active ? '#8B83FF' : 'transparent' }} />
                <Icon name={item.icon} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {role === UserRole.PROVIDER && (
          <button
            onClick={() => router.push('/studios')}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', marginTop: 8,
              border: '1px dashed rgba(255,255,255,0.18)', borderRadius: 11, background: 'transparent',
              color: 'rgba(255,255,255,0.6)', font: "600 13px 'Noto Sans SC', sans-serif", cursor: 'pointer',
            }}
          >
            <Icon name="compass" /> 浏览工作室
          </button>
        )}

        <div style={{ marginTop: 14, padding: 12, background: 'rgba(255,255,255,.05)', borderRadius: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div className="font-display" style={{ width: 32, height: 32, borderRadius: 9, background: meHue, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
              {initialOf(user?.nickname || user?.username)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.nickname || user?.username}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)' }}>{roleLabel}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
            padding: '18px 34px',
            background: 'rgba(244,245,250,.82)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid ' + COLORS.border,
          }}
        >
          <div>
            <h1 className="font-display" style={{ margin: 0, fontWeight: 700, fontSize: 23, color: COLORS.textPrimary }}>{title}</h1>
            {sub && <p style={{ margin: '3px 0 0', fontSize: 13, color: COLORS.textSecondary }}>{sub}</p>}
          </div>
          <Dropdown
            menu={{
              items: [
                { key: 'settings', label: '账号设置', onClick: () => router.push('/settings') },
                { key: 'logout', label: '退出登录', danger: true, onClick: () => logout() },
              ],
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid ' + COLORS.border, borderRadius: 12, padding: '6px 14px 6px 7px', cursor: 'pointer' }}>
              <div className="font-display" style={{ width: 34, height: 34, borderRadius: 9, background: meHue, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
                {initialOf(user?.nickname || user?.username)}
              </div>
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{user?.nickname || user?.username}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted }}>{roleLabel}</div>
              </div>
            </div>
          </Dropdown>
        </header>

        <main style={{ flex: 1, padding: '30px 34px 60px', maxWidth: 1180, width: '100%' }}>{children}</main>
      </div>
    </div>
  );
}
