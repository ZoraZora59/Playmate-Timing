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
    title: '查余额与记录',
    text: '查看每个服务者下的余额、消费记录和进行中的对局。',
    cta: '注册玩家账号',
  },
  {
    key: UserRole.PROVIDER,
    label: '服务者',
    title: '管玩家与对局',
    text: '给玩家充值、扣费、退款，记录每局的开局和结算。',
    cta: '注册服务者账号',
  },
  {
    key: UserRole.STUDIO,
    label: '工作室',
    title: '管成员与审批',
    text: '审批入驻申请，查看成员余额和本月充值。',
    cta: '注册工作室账号',
  },
];


const ROWS = [
  { player: 'Momo', seen: '1 天前', money: '¥0.00', time: '45 分', point: '0 点', status: '待充值', tone: 'attention-solid' as const },
  { player: '迟到的猫', seen: '2 天前', money: '¥12.50', time: '15 分', point: '0 点', status: '待充值', tone: 'attention-solid' as const },
  { player: '林野', seen: '9 小时前', money: '¥1,286.50', time: '755 分', point: '2,340 点', status: '余额充足', tone: 'muted' as const },
  { player: '峡谷小鲁班', seen: '12 小时前', money: '¥86.00', time: '90 分', point: '320 点', status: '余额充足', tone: 'muted' as const },
  { player: '老白', seen: '3 天前', money: '¥328.50', time: '240 分', point: '1,500 点', status: '余额充足', tone: 'muted' as const },
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
              陪
            </span>
            <span className="pm-brand-text">
              <span className="pm-brand-name">陪玩平台</span>
            </span>
          </a>
          <nav className="pm-nav-links" aria-label="页面导航">
            <a href="#product">产品</a>
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
              {isAuthenticated ? '进入控制台' : '免费注册'}
            </button>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="pm-hero">
          <div className="pm-container">
            <h1 className="pm-hero-title">
              陪玩计时与余额管理
            </h1>

            <p className="pm-hero-lede">
              记录每局的开局、时长、消费和结算。
              <br />
              金额、时间、点数分开记，两边都能查。
            </p>
            <div className="pm-hero-actions">
              <button type="button" className="pm-btn pm-btn-primary pm-btn-lg" onClick={() => goRegister()}>
                {isAuthenticated ? '进入控制台' : '免费注册'}
              </button>
              <a className="pm-hero-link" href="#product">
                查看示例
              </a>
            </div>

            <div className="pm-product" id="product">
              <div className="pm-product-bar">
                <span className="pm-product-brand">
                  <span className="pm-product-seal" aria-hidden="true">陪</span>
                  陪玩平台 · 服务者工作台
                </span>
                <span className="pm-product-meta">
                  <span className="pm-live-dot" aria-hidden="true" />
                  在局 2
                </span>
              </div>
              <div className="pm-product-body">
                <div className="pm-product-rail" aria-hidden="true">
                  <span className="active">控制台</span>
                  <span>玩家账户</span>
                  <span>游玩记录</span>
                  <span>余额总览</span>
                  <span>入驻工作室</span>
                </div>
                <div className="pm-product-main">
                  <div className="pm-product-head">
                    <div className="pm-ph-item">
                      <span className="pm-ph-label">待充值</span>
                      <span className="pm-ph-value pm-attention">
                        2<span className="pm-ph-unit">位</span>
                      </span>
                    </div>
                    <div className="pm-ph-item">
                      <span className="pm-ph-label">玩家余额</span>
                      <span className="pm-ph-value">¥4,820.50</span>
                    </div>
                    <div className="pm-ph-item">
                      <span className="pm-ph-label">玩家时长</span>
                      <span className="pm-ph-value">
                        3,260<span className="pm-ph-unit">分钟</span>
                      </span>
                    </div>
                    <div className="pm-ph-item">
                      <span className="pm-ph-label">玩家点数</span>
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
            <p className="pm-product-note">示例数据</p>
          </div>
        </section>

        <section className="pm-roles" id="roles">
          <div className="pm-container">
            <div className="pm-section-head">
              <h2 className="pm-section-title">三种身份</h2>
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
              <h2 className="pm-cta-title">开始使用陪玩平台</h2>
            </div>
            <div className="pm-cta-actions">
              <button type="button" className="pm-btn pm-btn-paper pm-btn-lg" onClick={() => goRegister()}>
                {isAuthenticated ? '进入控制台' : '免费注册'}
              </button>
              <a className="pm-cta-login" href="/auth/login">
                已有账号，登录
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="pm-footer">
        <div className="pm-container pm-footer-inner">
          <span>陪玩平台</span>
          <span className="pm-footer-links">
            <a href="#product">产品</a>
            <a href="#roles">身份</a>
          </span>
        </div>
      </footer>
    </div>
  );
}
