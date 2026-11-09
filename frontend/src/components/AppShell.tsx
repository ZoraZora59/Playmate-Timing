'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Dropdown } from 'antd';
import { useAuthStore } from '@/store/auth';
import { UserRole } from '@/types';
import { AccountTag, Stamp } from '@/components/ui';

// ---- 图标 ----
function Icon({ name }: { name: string }) {
  const common = {
    width: 17,
    height: 17,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'grid':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="8" />
          <rect x="14" y="3" width="7" height="5" />
          <rect x="14" y="12" width="7" height="9" />
          <rect x="3" y="15" width="7" height="6" />
        </svg>
      );
    case 'wallet':
      return (
        <svg {...common}>
          <rect x="2" y="6" width="20" height="13" />
          <path d="M16 12h2" />
          <path d="M2 10h20" />
        </svg>
      );
    case 'list':
      return (
        <svg {...common}>
          <path d="M3 6h18M3 12h18M3 18h12" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case 'users':
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        </svg>
      );
    case 'chart':
      return (
        <svg {...common}>
          <path d="M3 3v18h18" />
          <path d="M7 14l4-4 3 3 5-6" />
        </svg>
      );
    case 'home':
      return (
        <svg {...common}>
          <path d="M3 21V8l9-5 9 5v13" />
          <path d="M3 21h18M9 21v-6h6v6" />
        </svg>
      );
    case 'check':
      return (
        <svg {...common}>
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      );
    case 'compass':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M16 8l-2 6-6 2 2-6z" />
        </svg>
      );
    case 'refresh':
      return (
        <svg {...common}>
          <path d="M20 11a8 8 0 1 1-2.34-5.66" />
          <path d="M20 3v6h-6" />
        </svg>
      );
    case 'star':
      return (
        <svg {...common}>
          <path d="M12 2l3 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.9 21l1.2-6.8-5-4.9 6.9-1z" />
        </svg>
      );
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
      { key: '/provider/earnings', label: '余额总览', icon: 'chart' },
      { key: '/provider/studios', label: '入驻工作室', icon: 'home' },
    ],
  },
  studio: {
    group: '工作室工作台',
    items: [
      { key: '/dashboard', label: '控制台', icon: 'grid' },
      { key: '/studio/approvals', label: '入驻审核', icon: 'check' },
      { key: '/studio/members', label: '成员管理', icon: 'users' },
      { key: '/studio/manage', label: '工作室信息', icon: 'home' },
    ],
  },
};

function titleFor(pathname: string): string {
  if (pathname === '/dashboard') return '控制台';
  for (const role0 of Object.values(NAV)) {
    const item = role0.items.find((i) => i.key === pathname);
    if (item) return item.label;
  }
  if (pathname.startsWith('/studios/')) return '工作室详情';
  if (pathname === '/studios') return '浏览工作室';
  if (pathname === '/settings') return '账号设置';
  return '陪玩平台';
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [dateLabel, setDateLabel] = useState('');
  const sidebarRef = useRef<HTMLElement>(null);
  const mobileBtnRef = useRef<HTMLButtonElement>(null);

  const role = user?.role || UserRole.PLAYER;
  const nav = NAV[role];
  const roleLabel = role === UserRole.PLAYER ? '玩家' : role === UserRole.PROVIDER ? '服务者' : '工作室';
  const title = titleFor(pathname);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const d = new Date();
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    setDateLabel(`${d.getMonth() + 1} 月 ${d.getDate()} 日 ${weekdays[d.getDay()]}`);
  }, []);

  useEffect(() => {
    const aside = sidebarRef.current;
    if (!aside) return;
    if (isMobile && !mobileOpen) aside.setAttribute('inert', '');
    else aside.removeAttribute('inert');
  }, [isMobile, mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => {
      sidebarRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    }, 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMobile();
        return;
      }
      if (event.key !== 'Tab' || !sidebarRef.current) return;
      const focusable = Array.from(
        sidebarRef.current.querySelectorAll<HTMLElement>('button, a[href], [tabindex]:not([tabindex="-1"])')
      ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileOpen]);

  const closeMobile = () => {
    setMobileOpen(false);
    mobileBtnRef.current?.focus();
  };

  const handleRefresh = () => {
    const event = new CustomEvent('pm:refresh', { cancelable: true });
    const notHandled = window.dispatchEvent(event);
    if (notHandled) window.location.reload();
  };

  const isActive = (key: string) => (key === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(key));

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <a className="pm-skip" href="#pm-main">
        跳到主要内容
      </a>

      <aside
        ref={sidebarRef}
        className={`pm-sidebar${mobileOpen ? ' open' : ''}`}
        tabIndex={-1}
        role={isMobile && mobileOpen ? 'dialog' : undefined}
        aria-modal={isMobile && mobileOpen ? true : undefined}
        aria-label={isMobile && mobileOpen ? '导航菜单' : undefined}
      >
        <div className="pm-sidebar-inner">
          <div className="pm-sidebar-brand">
            <span className="pm-brand-seal pm-brand-seal-sm" aria-hidden="true">
              陪
            </span>
            <div style={{ minWidth: 0 }}>
              <div className="pm-brand-name">陪玩平台</div>
            </div>
            <button className="pm-sidebar-close pm-icon-btn" aria-label="关闭菜单" onClick={closeMobile}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }} aria-label={nav.group}>
            <div className="pm-sidebar-group">{nav.group}</div>
            {nav.items.map((item) => {
              const active = isActive(item.key);
              return (
                <button
                  key={item.key}
                  onClick={() => router.push(item.key)}
                  className={`pm-nav-item${active ? ' active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon name={item.icon} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {(role === UserRole.PROVIDER || role === UserRole.STUDIO) && (
            <button
              onClick={() => router.push('/studios')}
              className="pm-btn pm-btn-ghost pm-btn-sm"
              style={{ width: '100%', marginTop: 8 }}
            >
              <Icon name="compass" /> 浏览工作室
            </button>
          )}

          <div className="pm-sidebar-foot">
            <button className="pm-sidebar-action" onClick={() => router.push('/settings')}>
              账号设置
            </button>
            <button className="pm-sidebar-action" onClick={logout}>
              退出登录
            </button>
          </div>
        </div>
      </aside>

      <div className={`pm-overlay${mobileOpen ? ' open' : ''}`} onClick={closeMobile} aria-hidden="true" />

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <header className="pm-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <button
              ref={mobileBtnRef}
              className="pm-mobile-btn pm-icon-btn"
              aria-label="打开菜单"
              onClick={() => setMobileOpen(true)}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>
            <div style={{ minWidth: 0 }}>
              <h1 className="pm-page-title">{title}</h1>
            </div>
          </div>

          <div className="pm-topbar-meta">
            <span className="pm-topbar-date" aria-hidden={!dateLabel}>
              {dateLabel}
            </span>
            <button className="pm-icon-btn" aria-label="刷新" onClick={handleRefresh}>
              <Icon name="refresh" />
            </button>
            <Dropdown
              trigger={['click']}
              placement="bottomRight"
              menu={{
                items: [
                  { key: 'settings', label: '账号设置', onClick: () => router.push('/settings') },
                  { key: 'logout', label: '退出登录', danger: true, onClick: logout },
                ],
              }}
            >
              <button className="pm-user-btn" aria-label="账户菜单">
                <AccountTag
                  name={user?.nickname || user?.username}
                  avatar={user?.avatar}
                  size={24}
                  initial={
                    role === UserRole.STUDIO
                      ? (user?.nickname || user?.username || '?').trim().charAt(0)
                      : undefined
                  }
                />
                <div style={{ lineHeight: 1.2, minWidth: 0 }}>
                  <div className="pm-user-name">{user?.nickname || user?.username}</div>
                  <div className="pm-user-role">
                    <Stamp tone="muted">{roleLabel}</Stamp>
                  </div>
                </div>
              </button>
            </Dropdown>
          </div>
        </header>

        <main id="pm-main" className="pm-content">
          {children}
        </main>
      </div>
    </div>
  );
}
