'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/types';
import { useAuthStore } from '@/store/auth';
import { Stamp } from '@/components/ui';

const TABS: { key: UserRole; label: string; note: string }[] = [
  {
    key: UserRole.PLAYER,
    label: '玩家',
    note: '玩家：翻账、看局、给这一局落款。余额按服务者分开记，不串户。',
  },
  {
    key: UserRole.PROVIDER,
    label: '服务者',
    note: '服务者：开局、催充、结算，今晚的班记清楚。',
  },
  {
    key: UserRole.STUDIO,
    label: '工作室',
    note: '工作室：批申请、核成员、看本月充值。',
  },
];

const NOTES = [
  { num: '一', title: '分账', text: '一位服务者一页账，三个余额分栏记，不串户。' },
  { num: '二', title: '连页', text: '开局、时长、消费、结算，写在同一局上。' },
  { num: '三', title: '留痕', text: '一笔变动都有前后额和经手人。' },
  { num: '四', title: '落款', text: '评价只跟在已完成的对局后面。' },
];

const TAB_NOTE_INDEX: Record<string, number> = {
  [UserRole.PLAYER]: 0,
  [UserRole.PROVIDER]: 1,
  [UserRole.STUDIO]: 3,
};

const ROWS = [
  {
    player: 'Momo',
    serial: '№ 000129',
    game: '英雄联盟 · 云顶之弈双人',
    gameSub: '云顶之弈 / 双人 · 青野',
    start: '11-07 23:21',
    duration: '45 分',
    spend: '¥50.00',
    balance: '¥86.40',
    status: '已完成',
    tone: 'muted' as const,
  },
  {
    player: '迟到的猫',
    serial: '№ 000130',
    game: '无畏契约 · 排位',
    gameSub: '排位 / 双排 · 晚风',
    start: '11-07 22:05',
    duration: '0 分',
    spend: '¥0.00',
    balance: '¥52.00',
    status: '进行中',
    tone: 'ink' as const,
    live: true,
  },
  {
    player: '小满',
    serial: '№ 000131',
    game: '永劫无间 · 三排',
    gameSub: '三排 / 排位 · 青野',
    start: '11-07 21:40',
    duration: '90 分',
    spend: '¥50.00',
    balance: '¥0.00',
    status: '待充值',
    tone: 'attention-solid' as const,
  },
  {
    player: '老白',
    serial: '№ 000132',
    game: '永劫无间 · 三排',
    gameSub: '三排 / 匹配 · 晚风',
    start: '11-07 20:10',
    duration: '0 分',
    spend: '¥0.00',
    balance: '¥128.60',
    status: '已取消',
    tone: 'muted' as const,
  },
];

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, loadProfile } = useAuthStore();
  const [tab, setTab] = useState<UserRole>(UserRole.PLAYER);

  useEffect(() => {
    if (isAuthenticated && !user) {
      loadProfile();
    }
  }, [isAuthenticated, user, loadProfile]);

  const activeTab = TABS.find((item) => item.key === tab) ?? TABS[0];
  const activeNote = TAB_NOTE_INDEX[tab] ?? 0;

  const onTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const keys = ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (index + direction + TABS.length) % TABS.length;
    setTab(TABS[nextIndex].key);
    const buttons = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    buttons?.[nextIndex]?.focus();
  };

  return (
    <div className="pm-desk">
      <main className="pm-sheet">
        <div className="pm-binding" aria-hidden="true" />

        <header className="pm-sheet-head">
          <div className="pm-brand">
            <span className="pm-brand-seal" aria-hidden="true">
              账房
            </span>
            <div>
              <div className="pm-brand-name">陪玩平台</div>
              <div className="pm-brand-sub">今晚的局</div>
            </div>
          </div>
          <button className="pm-action" onClick={() => router.push(isAuthenticated ? '/dashboard' : '/auth/login')}>
            {isAuthenticated ? '进入控制台' : '已有账号，登录'}
          </button>
        </header>

        <div className="pm-double-rule" aria-hidden="true" />

        <section className="pm-landing-hero">
          <div>
            <h1 className="pm-landing-title" data-testid="landing-h1">
              局可以散，
              <br />
              账不能乱。
            </h1>
            <p className="pm-landing-lede">开局、时长、消费、结算、评价，写在同一局上。</p>
            <div className="pm-landing-cta">
              <button
                className="pm-btn pm-btn-primary"
                onClick={() => router.push(isAuthenticated ? '/dashboard' : `/auth/register?role=${tab}`)}
              >
                {isAuthenticated ? '回到我的账页' : '开一本账'}
              </button>
            </div>
            {!isAuthenticated && <div className="pm-cta-note">注册时选择玩家 / 服务者 / 工作室</div>}
          </div>
          <span className="pm-seal-mark" aria-hidden="true">
            账清
          </span>
        </section>

        <div className="pm-landing-body">
          <div className="pm-role-tabs" role="tablist" aria-label="选择身份">
            <span className="pm-tabs-label pm-tabs-label-desktop" aria-hidden="true">
              身份
            </span>
            <span className="pm-tabs-label pm-tabs-label-mobile" aria-hidden="true">
              以什么身份开账
            </span>
            {TABS.map((item, index) => (
              <button
                key={item.key}
                id={`landing-tab-${item.key}`}
                role="tab"
                aria-selected={tab === item.key}
                aria-controls="landing-ledger-panel"
                tabIndex={tab === item.key ? 0 : -1}
                className={`pm-role-tab${tab === item.key ? ' active' : ''}`}
                onClick={() => setTab(item.key)}
                onKeyDown={(event) => onTabKeyDown(event, index)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="pm-role-note-mobile">{activeTab.note}</div>

          <div className="pm-landing-ledger-wrap">
            <div role="tabpanel" id="landing-ledger-panel" aria-labelledby={`landing-tab-${tab}`}>
              <table className="pm-ledger">
                <caption className="pm-sr-only">示例局账：一局的全账</caption>
                <colgroup>
                  <col style={{ width: '17%' }} />
                  <col style={{ width: '22%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '15%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col">玩家</th>
                    <th scope="col">游戏 · 模式</th>
                    <th scope="col" className="pm-hide-mobile">
                      开局
                    </th>
                    <th scope="col" className="pm-hide-mobile">
                      时长
                    </th>
                    <th scope="col" className="pm-col-num pm-hide-mobile">
                      消费
                    </th>
                    <th scope="col" className="pm-col-num">
                      结余
                    </th>
                    <th scope="col" className="pm-col-status">
                      状态
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="pm-ledger-game">
                    <td data-label="玩家" title="峡谷第一深情小鲁班">
                      <div className="pm-cell-main">
                        峡谷第一深情小鲁班<span className="pm-sup">一</span>
                      </div>
                      <div className="pm-cell-sub">№ 000128</div>
                    </td>
                    <td data-label="游戏 · 模式" title="三角洲行动 · 烽火地带">
                      <div className="pm-cell-main">
                        三角洲行动 · 烽火地带<span className="pm-sup">二</span>
                      </div>
                      <div className="pm-cell-sub">
                        烽火地带 / 排位 · 晚风 / 夜航工作室
                        <span className="pm-mobile-only"> · 11-08 00:26 · 240 分</span>
                      </div>
                    </td>
                    <td data-label="开局" className="pm-hide-mobile">
                      11-08 00:26
                    </td>
                    <td data-label="时长" className="pm-hide-mobile">
                      240 分
                    </td>
                    <td data-label="消费" className="pm-col-num pm-amount pm-hide-mobile">
                      ¥50.00<span className="pm-sup">三</span>
                    </td>
                    <td data-label="消费 → 结余" className="pm-col-num pm-amount">
                      <span>
                        <span className="pm-mobile-only">¥50.00 → </span>
                        ¥328.50
                      </span>
                    </td>
                    <td data-label="状态" className="pm-col-status">
                      <Stamp tone="muted">已完成</Stamp>
                    </td>
                  </tr>
                  <tr className="pm-ledger-subrow">
                    <td colSpan={7}>
                      <div className="pm-ledger-subrows">
                        <div className="pm-subline">
                          <span className="pm-sub-time">00:26</span>
                          <span className="pm-sub-desc">开局 · 经手 晚风 · 余额不变。</span>
                        </div>
                        <div className="pm-subline">
                          <span className="pm-sub-time">02:31</span>
                          <span className="pm-sub-desc">消费 −¥50.00 · 经手 晚风</span>
                          <span className="pm-sub-money">¥378.50 → ¥328.50</span>
                        </div>
                        <div className="pm-subline">
                          <span className="pm-sub-time">04:26</span>
                          <span className="pm-sub-desc">完成结算 · 经手 晚风 · 评价 5.0 · 落款 匿名</span>
                          <span className="pm-sup">四</span>
                        </div>
                      </div>
                    </td>
                  </tr>

                  {ROWS.map((row) => (
                    <tr key={row.player}>
                      <td data-label="玩家" title={row.player}>
                        <div className="pm-cell-main">{row.player}</div>
                        <div className="pm-cell-sub">{row.serial}</div>
                      </td>
                      <td data-label="游戏 · 模式" title={row.game}>
                        <div className="pm-cell-main">{row.game}</div>
                        <div className="pm-cell-sub">
                          {row.gameSub}
                          <span className="pm-mobile-only">
                            {' '}
                            · {row.start} · {row.duration}
                          </span>
                        </div>
                      </td>
                      <td data-label="开局" className="pm-hide-mobile">
                        {row.start}
                      </td>
                      <td data-label="时长" className="pm-hide-mobile">
                        {row.duration}
                      </td>
                      <td data-label="消费" className="pm-col-num pm-amount pm-hide-mobile">
                        {row.spend}
                      </td>
                      <td
                        data-label="消费 → 结余"
                        className={`pm-col-num pm-amount${row.balance === '¥0.00' ? ' pm-zero' : ''}`}
                      >
                        <span>
                          <span className="pm-mobile-only">{row.spend} → </span>
                          {row.balance}
                        </span>
                      </td>
                      <td data-label="状态" className="pm-col-status">
                        {row.live ? (
                          <span className="pm-live-row">
                            <span className="pm-live-dot" aria-hidden="true" />
                            <Stamp tone={row.tone}>{row.status}</Stamp>
                          </span>
                        ) : (
                          <Stamp tone={row.tone}>{row.status}</Stamp>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pm-ledger-foot">
                <span>{activeTab.note}</span>
                <span>示例账页，数字为演示</span>
              </div>
            </div>

            <aside className="pm-notes" aria-label="账规">
              <div className="pm-notes-label">批注</div>
              {NOTES.map((note, index) => (
                <div key={note.num} className={`pm-note${index === activeNote ? ' active' : ''}`}>
                  <div className="pm-note-num">{note.num}</div>
                  <div className="pm-note-title">{note.title}</div>
                  <div className="pm-note-text">{note.text}</div>
                </div>
              ))}
            </aside>
          </div>
        </div>

        <div className="pm-double-rule" aria-hidden="true" />

        <footer
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
            padding: '14px 0 18px',
            fontSize: 12,
            color: 'var(--ink-muted)',
          }}
        >
          <span>陪玩平台 · 夜班账房</span>
          <span>局账</span>
        </footer>
      </main>
    </div>
  );
}
