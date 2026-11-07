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
import { COLORS } from '@/lib/theme';
import { Avatar, EmptyState, Pill } from '@/components/ui';
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

export default function ProviderPlayRecordsPage() {
  const { message, modal } = App.useApp();
  const [createForm] = Form.useForm<CreateForm>();
  const [completeForm] = Form.useForm<CompleteForm>();

  const [players, setPlayers] = useState<ProviderPlayerAgg[]>([]);
  const [records, setRecords] = useState<PlayRecord[]>([]);
  const [loading, setLoading] = useState(true);
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
    } catch (e) {
      message.error(e instanceof Error ? e.message : '游玩记录加载失败');
    } finally {
      setLoading(false);
    }
  }, [filter, message]);

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
      content: '取消后该局会标记为已取消，且不会产生扣费。',
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

  return (
    <div className="animate-pop">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {FILTERS.map((f) => {
            const on = filter === f.key;
            return (
              <span
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  padding: '8px 15px',
                  borderRadius: 10,
                  fontSize: 12.5,
                  fontWeight: on ? 600 : 400,
                  cursor: 'pointer',
                  background: on ? COLORS.sidebar : COLORS.bgCard,
                  color: on ? '#fff' : COLORS.textSecondary,
                  border: `1px solid ${on ? COLORS.sidebar : COLORS.border}`,
                }}
              >
                {f.label}
              </span>
            );
          })}
        </div>
        <Button type="primary" onClick={openCreate} style={{ marginLeft: 'auto', borderRadius: 11, fontWeight: 600 }}>
          ＋ 开始一局
        </Button>
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center' }}>
          <Spin size="large" />
        </div>
      ) : records.length === 0 ? (
        <div className="pm-card">
          <EmptyState title="暂无游玩记录" hint="点击「开始一局」，记录会实时出现在这里" />
        </div>
      ) : (
        <div className="pm-card pm-table-scroll" style={{ overflow: 'hidden' }}>
          <div style={{ minWidth: 760 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.4fr 1.3fr 1fr .8fr 1fr .8fr',
                gap: 12,
                padding: '13px 20px',
                background: COLORS.bgSubtle,
                borderBottom: `1px solid ${COLORS.divider}`,
                fontSize: 11.5,
                fontWeight: 600,
                color: COLORS.textMuted,
              }}
            >
              <div>玩家</div>
              <div>游戏 / 模式</div>
              <div>开始时间</div>
              <div>时长</div>
              <div style={{ textAlign: 'right' }}>结算</div>
              <div style={{ textAlign: 'right' }}>操作</div>
            </div>
            {records.map((r) => {
              const meta = playStatusMeta(r.status);
              const active = r.status === PlayStatus.ACTIVE;
              return (
                <div
                  key={r.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.4fr 1.3fr 1fr .8fr 1fr .8fr',
                    gap: 12,
                    alignItems: 'center',
                    padding: '14px 20px',
                    borderTop: `1px solid ${COLORS.divider}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <Avatar name={playerName(r)} seed={r.player_id} size={34} />
                    <span style={{ fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {playerName(r)}
                    </span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{r.game_name || '未命名对局'}</div>
                    {r.game_mode && <div style={{ fontSize: 11.5, color: COLORS.textMuted }}>{r.game_mode}</div>}
                  </div>
                  <div style={{ fontSize: 12.5, color: COLORS.textSecondary }}>{formatDateTime(r.start_time)}</div>
                  <div style={{ fontSize: 13, color: COLORS.textSecondary }}>{r.duration ? `${r.duration} 分钟` : '—'}</div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="font-display" style={{ fontSize: 13.5, fontWeight: 600 }}>
                      {r.amount && Number(r.amount) > 0 && r.settle_type
                        ? formatBalance(r.settle_type, r.amount)
                        : '—'}
                    </div>
                    <div style={{ marginTop: 4, display: 'flex', justifyContent: 'flex-end' }}>
                      <Pill color={meta.color} bg={COLORS.divider}>{meta.label}</Pill>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                    {active ? (
                      <>
                        <button
                          onClick={() => openComplete(r)}
                          style={{ border: 'none', borderRadius: 8, padding: '7px 11px', background: COLORS.money, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                        >
                          完成
                        </button>
                        <button
                          onClick={() => cancelRecord(r)}
                          style={{ border: '1px solid #F2C2CD', borderRadius: 8, padding: '7px 11px', background: '#fff', color: COLORS.danger, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                        >
                          取消
                        </button>
                      </>
                    ) : (
                      <span style={{ fontSize: 12, color: COLORS.textMuted }}>—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Modal
        title="开始一局"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={submitCreate}
        okText="开始"
        cancelText="取消"
        confirmLoading={creating}
        okButtonProps={{ style: { borderRadius: 10 } }}
        cancelButtonProps={{ style: { borderRadius: 10 } }}
      >
        {players.length === 0 && (
          <div style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 10, background: COLORS.warnBg, color: COLORS.warnText, fontSize: 12.5 }}>
            还没有可选的玩家。请先在「玩家账户管理」为玩家充值，玩家才会出现在这里。
          </div>
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
        title={`完成并结算 · ${completeTarget?.game_name || '本局'}`}
        open={!!completeTarget}
        onCancel={() => setCompleteTarget(null)}
        onOk={submitComplete}
        okText="确认完成"
        cancelText="返回"
        confirmLoading={completing}
        okButtonProps={{ style: { borderRadius: 10 } }}
        cancelButtonProps={{ style: { borderRadius: 10 } }}
      >
        <Form form={completeForm} layout="vertical" requiredMark={false}>
          <Form.Item name="duration" label="游玩时长（分钟）" rules={[{ required: true, message: '请输入时长' }]}>
            <InputNumber min={0} max={1440} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="amount" label="结算数额" rules={[{ required: true, message: '请输入结算数额' }]}>
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="settle" label="从玩家余额扣费" valuePropName="checked">
            <Switch />
          </Form.Item>
          <div style={{ fontSize: 12.5, color: COLORS.textMuted }}>
            关闭扣费开关时只记录本局结果，不改动玩家余额。
          </div>
        </Form>
      </Modal>
    </div>
  );
}
