'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { App } from 'antd';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { ProviderDashboard, BalanceType, PlayRecord, ProviderPlayerAgg } from '@/types';
import {
  formatBalance,
  formatMoney,
  formatTimeMinutes,
  formatPoint,
  fromNow,
  toNum,
  formatDateTime,
} from '@/lib/format';
import {
  LedgerHead,
  LedgerTable,
  SectionBlock,
  EmptyState,
  Stamp,
  TextAction,
  AccountTag,
  Tally,
  SkeletonLedger,
  type LedgerColumn,
  type LedgerRow,
} from '@/components/ui';
import BalanceOpModal, { PlayerLite } from '@/components/BalanceOpModal';

const EARN_LABEL: Record<string, string> = {
  [BalanceType.MONEY]: '账上余额',
  [BalanceType.TIME]: '时间余额',
  [BalanceType.POINT]: '点数余额',
};

const COLUMNS: LedgerColumn[] = [
  { key: 'player', label: '玩家', width: '31%' },
  { key: 'active', label: '最近活跃', width: '16%' },
  { key: 'money', label: '金额', width: '14%', align: 'right' },
  { key: 'time', label: '时间', width: '12%', align: 'right', hide: 'sm' },
  { key: 'point', label: '点数', width: '10%', align: 'right', hide: 'sm' },
  { key: 'status', label: '状态', width: '17%', align: 'right' },
];

function minutesSince(iso?: string): number {
  if (!iso) return 0;
  const start = new Date(iso).getTime();
  if (Number.isNaN(start)) return 0;
  return Math.max(0, Math.floor((Date.now() - start) / 60000));
}

export default function ProviderDashboardView() {
  const router = useRouter();
  const { message } = App.useApp();
  const { user } = useAuthStore();
  const [data, setData] = useState<ProviderDashboard | null>(null);
  const [activeRecords, setActiveRecords] = useState<PlayRecord[]>([]);
  const [shiftError, setShiftError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalPlayer, setModalPlayer] = useState<PlayerLite | null>(null);

  const load = useCallback(async () => {
    try {
      const [dashboard, records] = await Promise.all([
        apiClient.getProviderDashboard(),
        apiClient.listHostedRecords({ status: 'active', page_size: 20 }).catch(() => null),
      ]);
      setData(dashboard);
      setLoadError(null);
      if (records) {
        setActiveRecords(records.list || []);
        setShiftError(false);
      } else {
        setActiveRecords([]);
        setShiftError(true);
      }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : '加载失败');
      message.error(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      load();
    };
    window.addEventListener('pm:refresh', handler);
    return () => window.removeEventListener('pm:refresh', handler);
  }, [load]);

  const mergedPlayers = useMemo(() => {
    if (!data) return [] as ProviderPlayerAgg[];
    const map = new Map<number, ProviderPlayerAgg>();
    for (const player of data.active_players) map.set(player.player_id, player);
    for (const player of data.todos) {
      if (!map.has(player.player_id)) map.set(player.player_id, player);
    }
    const all = Array.from(map.values());
    const isLow = (player: ProviderPlayerAgg) => toNum(player.money) < 50;
    return all.sort((a, b) => {
      const aLow = isLow(a);
      const bLow = isLow(b);
      if (aLow !== bLow) return aLow ? -1 : 1;
      if (aLow && bLow) return toNum(a.money) - toNum(b.money);
      return new Date(b.last_active || 0).getTime() - new Date(a.last_active || 0).getTime();
    });
  }, [data]);

  if (loading) {
    return <SkeletonLedger rows={5} />;
  }

  if (loadError) {
    return (
      <EmptyState
        title="没读到数据。"
        hint={loadError}
        action={<TextAction onClick={load}>再试一次</TextAction>}
      />
    );
  }

  if (!data) {
    return (
      <EmptyState
        title="这一页还空着。"
        hint="稍后再试，或刷新一次。"
        action={<TextAction onClick={load}>刷新</TextAction>}
      />
    );
  }

  const earnOf = (type: BalanceType) => data.earnings.find((item) => item.type === type);
  const weeklyTotal = data.weekly_play_counts.reduce((sum, item) => sum + item.count, 0);
  const lowCount = mergedPlayers.filter((player) => toNum(player.money) < 50).length;
  const visiblePlayers = mergedPlayers.slice(0, 8);

  const openRecharge = (player: ProviderPlayerAgg) => {
    setModalPlayer({
      player_id: player.player_id,
      nickname: player.nickname || player.username,
      money: player.money,
      time: player.time,
      point: player.point,
    });
  };

  const rows: LedgerRow[] = visiblePlayers.map((player) => {
    const name = player.nickname || player.username;
    const money = toNum(player.money);
    const low = money < 50;
    const zero = money === 0;
    return {
      key: player.player_id,
      cells: {
        player: (
          <div className="pm-cell-name">
            <AccountTag name={name} size={24} />
            <span className="pm-cell-name-main" title={name}>
              {name}
            </span>
          </div>
        ),
        active: (
          <span title={formatDateTime(player.last_active)}>
            {player.last_active ? fromNow(player.last_active) : '暂无记录'}
          </span>
        ),
        money: (
          <span
            className={`pm-cell-amount num${zero ? ' zero' : ''}${low && !zero ? ' attention' : ''}`}
            style={{ whiteSpace: 'nowrap' }}
          >
            {formatMoney(player.money)}
          </span>
        ),
        time: (
          <span className="num" style={{ whiteSpace: 'nowrap' }}>
            {formatTimeMinutes(player.time).replace(' 分钟', '')} 分
          </span>
        ),
        point: (
          <span className="num" style={{ whiteSpace: 'nowrap' }}>
            {formatPoint(player.point).replace(' 点', '')} 点
          </span>
        ),
        status: (
          <div className="pm-cell-actions">
            <Stamp tone={zero ? 'attention-solid' : low ? 'attention' : 'muted'}>
              {low ? '待充值' : '正常'}
            </Stamp>
            {low && <TextAction onClick={() => openRecharge(player)}>代充值</TextAction>}
          </div>
        ),
      },
    };
  });

  return (
    <div>
      <div className="pm-shift-line">
        <div className="pm-shift-line-main">
          <span className="pm-live-dot" aria-hidden="true" />
          <span className="pm-shift-line-title">在局 {activeRecords.length}</span>
          {activeRecords.slice(0, 2).map((record) => {
            const name = record.player?.nickname || record.player?.username || '玩家';
            return (
              <span className="pm-shift-line-item" key={record.id}>
                {name} · {record.game_name || '对局'} · {minutesSince(record.start_time)} 分
              </span>
            );
          })}
          {shiftError && <span className="pm-shift-line-item">在局数据没读到。</span>}
          {!shiftError && activeRecords.length === 0 && (
            <span className="pm-shift-line-item">今晚还没有开着的局。</span>
          )}
        </div>
        <div>
          {shiftError ? (
            <TextAction onClick={load}>刷新</TextAction>
          ) : activeRecords.length === 0 ? (
            <TextAction onClick={() => router.push('/provider/play-records')}>去开局</TextAction>
          ) : (
            <TextAction onClick={() => router.push('/provider/play-records?status=active')}>全部</TextAction>
          )}
        </div>
      </div>

      <LedgerHead
        variant="compact"
        items={[
          {
            label: '待催充',
            value: lowCount,
            unit: '位',
            attention: lowCount > 0,
          },
          {
            label: EARN_LABEL[BalanceType.MONEY],
            value: formatBalance(BalanceType.MONEY, earnOf(BalanceType.MONEY)?.total_amount ?? '0'),
          },
          {
            label: EARN_LABEL[BalanceType.TIME],
            value: formatTimeMinutes(earnOf(BalanceType.TIME)?.total_amount ?? '0').replace(' 分钟', ''),
            unit: '分钟',
          },
          {
            label: EARN_LABEL[BalanceType.POINT],
            value: formatPoint(earnOf(BalanceType.POINT)?.total_amount ?? '0').replace(' 点', ''),
            unit: '点',
          },
        ]}
      />

      <div className="pm-dash-grid" style={{ marginTop: 28 }}>
        <SectionBlock
          title="当班名单"
          attention={lowCount > 0}
          action={<TextAction onClick={() => router.push('/provider/accounts')}>全部玩家</TextAction>}
        >
          <LedgerTable
            columns={COLUMNS}
            rows={rows}
            caption="当班玩家名单"
            empty={
              <EmptyState
                title="没有要催的账。"
                action={<TextAction onClick={() => router.push('/provider/accounts')}>查看全部玩家</TextAction>}
              />
            }
          />
        </SectionBlock>

        <SectionBlock title={`近 7 天局数 · ${weeklyTotal} 局`}>
          <Tally data={data.weekly_play_counts} />
        </SectionBlock>
      </div>

      <BalanceOpModal
        open={!!modalPlayer}
        mode="recharge"
        player={modalPlayer}
        providerId={user?.id || 0}
        onClose={() => setModalPlayer(null)}
        onDone={load}
      />
    </div>
  );
}
