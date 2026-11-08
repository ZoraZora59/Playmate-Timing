'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  App,
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Spin,
  Switch,
} from 'antd';
import apiClient from '@/lib/api';
import { BalanceType, PlayStatus, type PlayRecord, type ProviderPlayerAgg } from '@/types';
import {
  AccountTag,
  EmptyState,
  LedgerTable,
  LoadError,
  Stamp,
  type LedgerColumn,
  type LedgerRow,
} from '@/components/ui';
import { formatBalance, formatDateTime, playStatusMeta } from '@/lib/format';

interface CreateForm {
  player_id: number;
  game_name: string;
  game_mode?: string;
  settle_type: BalanceType;
  description?: string;
}

interface CompleteForm {
  duration: number;
  amount: number;
  settle: boolean;
}

const FILTERS: { key: 'all' | PlayStatus; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: PlayStatus.ACTIVE, label: '进行中' },
  { key: PlayStatus.COMPLETED, label: '已完成' },
  { key: PlayStatus.CANCELLED, label: '已取消' },
];

const COLUMNS: LedgerColumn[] = [
  { key: 'player', label: '玩家', width: '20%' },
  { key: 'game', label: '游戏 · 模式', width: '25%' },
  { key: 'start', label: '开始', width: '14%', align: 'right', hide: 'sm' },
  { key: 'duration', label: '时长', width: '8%', align: 'right', hide: 'sm' },
  { key: 'amount', label: '结算', width: '12%', align: 'right' },
  { key: 'status', label: '状态', width: '9%', align: 'right' },
  { key: 'actions', label: '操作', width: '12%', align: 'right' },
];

export default function ProviderPlayRecordsPage() {
  const { message, modal } = App.useApp();
  const [createForm] = Form.useForm<CreateForm>();
  const [completeForm] = Form.useForm<CompleteForm>();

  const [players, setPlayers] = useState<ProviderPlayerAgg[]>([]);
  const [records, setRecords] = useState<PlayRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<'all' | PlayStatus>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [completeTarget, setCompleteTarget] = useState<PlayRecord | null>(null);
  const [completing, setCompleting] = useState(false);

  const loadPlayers = useCallback(async () => {
    try {
      const dashboard = await apiClient.getProviderDashboard();
      setPlayers(dashboard.active_players || []);
    } catch (e) {
      message.error(e instanceof Error ? e.message : '玩家列表加载失败');
    }
  }, [message]);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.listHostedRecords({
        page_size: 100,
        status: filter === 'all' ? undefined : filter,
      });
      setRecords(res.list || []);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const openCreate = () => {
    createForm.resetFields();
    createForm.setFieldsValue({ settle_type: BalanceType.MONEY });
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    const values = await createForm.validateFields();
    setCreating(true);
    try {
      await apiClient.createPlayRecord({
        player_id: values.player_id,
        game_name: values.game_name.trim(),
        game_mode: values.game_mode?.trim() || undefined,
        settle_type: values.settle_type,
        description: values.description?.trim() || undefined,
      });
      message.success('陪玩已开始');
      setCreateOpen(false);
      await loadRecords();
    } catch (e) {
      message.error(e instanceof Error ? e.message : '开局失败');
    } finally {
      setCreating(false);
    }
  };

  const openComplete = (record: PlayRecord) => {
    completeForm.resetFields();
    completeForm.setFieldsValue({ duration: 60, amount: 0, settle: true });
    setCompleteTarget(record);
  };

  const submitComplete = async () => {
    if (!completeTarget) return;
    const values = await completeForm.validateFields();
    setCompleting(true);
    try {
      await apiClient.completePlayRecord(completeTarget.id, {
        duration: values.duration,
        amount: values.amount,
        settle: values.settle,
      });
      message.success('陪玩已完成');
      setCompleteTarget(null);
      await loadRecords();
    } catch (e) {
      message.error(e instanceof Error ? e.message : '完成结算失败');
    } finally {
      setCompleting(false);
    }
  };

  const cancelRecord = (record: PlayRecord) => {
    modal.confirm({
      title: '取消这一局？',
      okText: '确认取消',
      okButtonProps: { danger: true },
      cancelText: '再想想',
      onOk: async () => {
        try {
          await apiClient.cancelPlayRecord(record.id);
          message.success('已取消该局');
          await loadRecords();
        } catch (e) {
          message.error(e instanceof Error ? e.message : '取消失败');
        }
      },
    });
  };

  const playerName = (r: PlayRecord) => r.player?.nickname || r.player?.username || `玩家 #${r.player_id}`;

  const rows: LedgerRow[] = records.map((r) => {
    const meta = playStatusMeta(r.status);
    const active = r.status === PlayStatus.ACTIVE;
    return {
      key: r.id,
      cells: {
        player: (
          <div className="pm-cell-name">
            <AccountTag name={playerName(r)} size={24} />
            <span className="pm-cell-name-main" title={playerName(r)}>
              {playerName(r)}
            </span>
          </div>
        ),
        game: (
          <span className="pm-cell-name-main" title={`${r.game_name || '未命名对局'}${r.game_mode ? ` · ${r.game_mode}` : ''}`}>
            {r.game_name || '未命名对局'}
            {r.game_mode ? <span style={{ fontWeight: 400, color: 'var(--ink-muted)' }}> · {r.game_mode}</span> : null}
          </span>
        ),
        start: <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{formatDateTime(r.start_time)}</span>,
        duration: <span className="num" style={{ fontSize: 12.5 }}>{r.duration ? `${r.duration} 分钟` : '—'}</span>,
        amount: (
          <span className="num" style={{ fontSize: 13, fontWeight: 600 }}>
            {r.amount && Number(r.amount) > 0 && r.settle_type ? formatBalance(r.settle_type, r.amount) : '—'}
          </span>
        ),
        status: <Stamp tone={active ? 'ink' : 'muted'}>{meta.label}</Stamp>,
        actions: active ? (
          <span className="pm-row-actions">
            <button type="button" className="pm-row-action" onClick={() => openComplete(r)}>
              完成
            </button>
            <button type="button" className="pm-row-action muted" onClick={() => cancelRecord(r)}>
              取消
            </button>
          </span>
        ) : null,
      },
    };
  });

  return (
    <div className="animate-pop">
      <div className="pm-records-bar">
        <div className="pm-records-filters">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`pm-tx-filter${filter === f.key ? ' on' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Button type="primary" onClick={openCreate} style={{ marginLeft: 'auto', fontWeight: 600 }}>
          开始一局
        </Button>
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center' }}>
          <Spin size="large" />
        </div>
      ) : error ? (
        <LoadError onRetry={() => loadRecords()} />
      ) : records.length === 0 ? (
        <EmptyState title="暂无游玩记录" />
      ) : (
        <LedgerTable columns={COLUMNS} rows={rows} className="pm-records-table" caption="服务者的游玩记录" />
      )}

      <Modal
        title="开始一局"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={submitCreate}
        okText="开始"
        cancelText="取消"
        confirmLoading={creating}
      >
        {players.length === 0 && (
          <div className="pm-form-warn">还没有可选的玩家，请先在「玩家账户管理」为玩家充值。</div>
        )}
        <Form form={createForm} layout="vertical" requiredMark={false}>
          <Form.Item name="player_id" label="玩家" rules={[{ required: true, message: '请选择玩家' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="选择玩家"
              options={players.map((p) => ({
                value: p.player_id,
                label: `${p.nickname || p.username || `玩家 #${p.player_id}`}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="game_name" label="游戏名称" rules={[{ required: true, message: '请输入游戏名称' }]}>
            <Input placeholder="例如：王者荣耀" maxLength={100} />
          </Form.Item>
          <Form.Item name="game_mode" label="游戏模式">
            <Input placeholder="例如：排位赛 / 巅峰赛" maxLength={50} />
          </Form.Item>
          <Form.Item name="settle_type" label="结算类型" rules={[{ required: true }]}>
            <Select
              options={[
                { value: BalanceType.MONEY, label: '金额（元）' },
                { value: BalanceType.TIME, label: '时间（分钟）' },
                { value: BalanceType.POINT, label: '点数' },
              ]}
            />
          </Form.Item>
          <Form.Item name="description" label="备注">
            <Input.TextArea rows={2} maxLength={200} placeholder="可选" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`完成并结算：${completeTarget?.game_name || '本局'}`}
        open={!!completeTarget}
        onCancel={() => setCompleteTarget(null)}
        onOk={submitComplete}
        okText="确认完成"
        cancelText="返回"
        confirmLoading={completing}
      >
        <Form form={completeForm} layout="vertical" requiredMark={false}>
          <Form.Item name="duration" label="游玩时长（分钟）" rules={[{ required: true, message: '请输入时长' }]}>
            <InputNumber min={0} max={1440} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="amount"
            label={`结算数额（${
              completeTarget?.settle_type === BalanceType.TIME
                ? '分钟'
                : completeTarget?.settle_type === BalanceType.POINT
                  ? '点'
                  : '元'
            }）`}
            rules={[{ required: true, message: '请输入结算数额' }]}
          >
            <InputNumber
              min={0}
              precision={completeTarget?.settle_type === BalanceType.MONEY ? 2 : 0}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item name="settle" label="从玩家余额扣费" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
