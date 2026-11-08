'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/types';
import { useAuthStore } from '@/store/auth';
import { Stamp } from '@/components/ui';

const ROLES = [
  {
    key: UserRole.PLAYER,
    label: '玩家',
    title: '翻自己的账',
    text: '每个服务者单独一页，余额、时长、点数分开记，不串户。',
    cta: '以玩家身份开账',
  },
  {
    key: UserRole.PROVIDER,
    label: '服务者',
    title: '守今晚的班',
    text: '开局计时，结算扣费，余额见底的人排在最前面。',
    cta: '以服务者身份开账',
  },
  {
    key: UserRole.STUDIO,
    label: '工作室',
    title: '核整本的账',
    text: '谁在局、谁欠费、本月进了多少，一页看完再批申请。',
    cta: '以工作室身份开账',
  },
];


const ROWS = [
  { player: 'Momo', seen: '1 天前', money: '¥0.00', time: '45 分', point: '0 点', status: '待充值', tone: 'attention-solid' as const },
  { player: '迟到的猫', seen: '2 天前', money: '¥12.50', time: '15 分', point: '0 点', status: '待充值', tone: 'attention-solid' as const },
  { player: '林野', seen: '9 小时前', money: '¥1,286.50', time: '755 分', point: '2,340 点', status: '正常', tone: 'muted' as const },
  { player: '峡谷小鲁班', seen: '12 小时前', money: '¥86.00', time: '90 分', point: '320 点', status: '正常', tone: 'muted' as const },
  { player: '老白', seen: '3 天前', money: '¥328.50', time: '240 分', point: '1,500 点', status: '正常', tone: 'muted' as const },
];

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, loadProfile } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && !user) {
      loadProfile();
    }
  }, [isAuthenticated, user, loadProfile]);

  const goRegister = (role?: UserRole) => {
    router.push(isAuthenticated ? '/dashboard' : role ? `/auth/register?role=${role}` : '/auth/register');
  };

  return (
    <div className="pm-site">
      <header className="pm-nav">
        <div className="pm-container pm-nav-inner">
          <a className="pm-brand" href="#top" aria-label="陪玩平台首页">
            <span className="pm-brand-seal" aria-hidden="true">
              账房
            </span>
            <span className="pm-brand-text">
              <span className="pm-brand-name">陪玩平台</span>
              <span className="pm-brand-sub">今晚的局</span>
            </span>
          </a>
          <nav className="pm-nav-links" aria-label="页面导航">
            <a href="#product">工作台</a>
            <a href="#roles">身份</a>
          </nav>
          <div className="pm-nav-actions">
            <button
              type="button"
              className="pm-nav-login"
              onClick={() => router.push(isAuthenticated ? '/dashboard' : '/auth/login')}
            >
              {isAuthenticated ? '控制台' : '登录'}
            </button>
            <button type="button" className="pm-btn pm-btn-primary" onClick={() => goRegister()}>
              {isAuthenticated ? '回到账页' : '开一本账'}
            </button>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="pm-hero">
          <div className="pm-container">
            <div className="pm-hero-live">
              <span className="pm-live-dot" aria-hidden="true" />
              <span className="pm-hero-stat">
                今日流水 <b className="num">¥12,840.50</b>
              </span>
              <span className="pm-hero-sep" aria-hidden="true" />
              <span>在局 <b className="num">3</b></span>
              <span className="pm-hero-sep" aria-hidden="true" />
              <span>待充值 <b className="num pm-attention">1</b></span>
            </div>

            <h1 className="pm-hero-title">
              局可以散，
              <br />
              账不能乱。
            </h1>

            <nav className="pm-hero-index" aria-label="三种身份的账页">
              {ROLES.map((role) => (
                <a key={role.key} href="#roles">
                  <span className="pm-hi-label">{role.label}</span>
                  <span className="pm-hi-title">{role.title}</span>
                </a>
              ))}
            </nav>

            <p className="pm-hero-lede">
              开局、时长、消费、结算、评价，写在同一页上。
              <br />
              玩家、服务者、工作室，看的是同一本账。
            </p>
            <div className="pm-hero-actions">
              <button type="button" className="pm-btn pm-btn-primary pm-btn-lg" onClick={() => goRegister()}>
                {isAuthenticated ? '回到我的账页' : '开一本账'}
              </button>
              <a className="pm-hero-link" href="#product">
                先看一页账
              </a>
            </div>

            <div className="pm-product" id="product">
              <div className="pm-product-bar">
                <span className="pm-product-brand">
                  <span className="pm-product-seal" aria-hidden="true">账</span>
                  陪玩平台 · 服务者工作台
                </span>
                <span className="pm-product-meta">
                  <span className="pm-live-dot" aria-hidden="true" />
                  今晚 23:04 · 在局 2
                </span>
              </div>
              <div className="pm-product-body">
                <div className="pm-product-rail" aria-hidden="true">
                  <span className="active">控制台</span>
                  <span>玩家账户</span>
                  <span>游玩记录</span>
                  <span>余额总览</span>
                  <span>工作室归属</span>
                </div>
                <div className="pm-product-main">
                  <div className="pm-product-head">
                    <div className="pm-ph-item">
                      <span className="pm-ph-label">待催充</span>
                      <span className="pm-ph-value pm-attention">
                        2<span className="pm-ph-unit">位</span>
                      </span>
                    </div>
                    <div className="pm-ph-item">
                      <span className="pm-ph-label">账上余额</span>
                      <span className="pm-ph-value">¥4,820.50</span>
                    </div>
                    <div className="pm-ph-item">
                      <span className="pm-ph-label">时间余额</span>
                      <span className="pm-ph-value">
                        3,260<span className="pm-ph-unit">分钟</span>
                      </span>
                    </div>
                    <div className="pm-ph-item">
                      <span className="pm-ph-label">点数余额</span>
                      <span className="pm-ph-value">
                        5,680<span className="pm-ph-unit">点</span>
                      </span>
                    </div>
                  </div>

                  <table className="pm-product-table">
                    <caption className="pm-sr-only">工作台预览：服务者今晚的玩家余额</caption>
                    <thead>
                      <tr>
                        <th scope="col">玩家</th>
                        <th scope="col" className="pm-col-seen">最近活跃</th>
                        <th scope="col" className="num">金额</th>
                        <th scope="col" className="num pm-col-time">时间</th>
                        <th scope="col" className="num pm-col-point">点数</th>
                        <th scope="col" className="pm-td-status">状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ROWS.map((row) => (
                        <tr key={row.player}>
                          <td>
                            <span className="pm-product-avatar" aria-hidden="true">
                              {row.player.slice(0, 1)}
                            </span>
                            {row.player}
                          </td>
                          <td className="pm-col-seen pm-product-seen">{row.seen}</td>
                          <td className="num">{row.money}</td>
                          <td className="num pm-col-time">{row.time}</td>
                          <td className="num pm-col-point">{row.point}</td>
                          <td className="pm-td-status">
                            <Stamp tone={row.tone}>{row.status}</Stamp>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <p className="pm-product-note">工作台预览 · 示例数据</p>
          </div>
        </section>

        <section className="pm-roles" id="roles">
          <div className="pm-container">
            <div className="pm-section-head">
              <h2 className="pm-section-title">三个身份，一本账。</h2>
            </div>
            <div className="pm-role-grid">
              {ROLES.map((role) => (
                <article key={role.key} className="pm-role">
                  <div className="pm-role-label">{role.label}</div>
                  <h3 className="pm-role-title">{role.title}</h3>
                  <p className="pm-role-text">{role.text}</p>
                  <button type="button" className="pm-role-link" onClick={() => goRegister(role.key)}>
                    {role.cta}
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="pm-cta">
          <div className="pm-container pm-cta-inner">
            <div>
              <h2 className="pm-cta-title">开一本账，今晚就记。</h2>
            </div>
            <div className="pm-cta-actions">
              <button type="button" className="pm-btn pm-btn-paper pm-btn-lg" onClick={() => goRegister()}>
                {isAuthenticated ? '回到我的账页' : '开一本账'}
              </button>
              <a className="pm-cta-login" href="/auth/login">
                已有账号
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="pm-footer">
        <div className="pm-container pm-footer-inner">
          <span>陪玩平台 · 今晚的局</span>
          <span className="pm-footer-links">
            <a href="#product">工作台</a>
            <a href="#roles">身份</a>
          </span>
          <span>夜班账房</span>
        </div>
      </footer>
    </div>
  );
}
