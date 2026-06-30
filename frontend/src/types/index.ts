// 用户角色枚举
export enum UserRole {
  PLAYER = 'player',
  PROVIDER = 'provider',
  STUDIO = 'studio',
}

// 关联状态枚举
export enum RelationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

// 余额类型枚举
export enum BalanceType {
  MONEY = 'money',
  TIME = 'time',
  POINT = 'point',
}

// 交易类型枚举
export enum TransactionType {
  RECHARGE = 'recharge',
  CONSUME = 'consume',
  REFUND = 'refund',
  FREEZE = 'freeze',
  UNFREEZE = 'unfreeze',
}

// 游玩记录状态
export enum PlayStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// 评价对象类型
export enum ReviewTargetType {
  PROVIDER = 'provider',
  STUDIO = 'studio',
}

// 注意：后端 decimal 金额序列化为字符串（"328.50"），故 amount 类型为 string。
export type Decimal = string;

// 用户接口
export interface User {
  id: number;
  username: string;
  email: string;
  phone?: string;
  nickname?: string;
  avatar?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 工作室接口
export interface Studio {
  id: number;
  name: string;
  description?: string;
  logo?: string;
  contact_info?: string;
  is_active: boolean;
  owner_id: number;
  created_at: string;
  updated_at: string;
  owner?: User;
  relations?: ProviderStudioRelation[];
}

// 服务者-工作室关联接口
export interface ProviderStudioRelation {
  id: number;
  provider_id: number;
  studio_id: number;
  status: RelationStatus;
  applied_at: string;
  processed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  provider?: User;
  studio?: Studio;
}

// 余额接口
export interface Balance {
  id: number;
  player_id: number;
  provider_id: number;
  studio_id: number;
  type: BalanceType;
  amount: Decimal;
  frozen_amount: Decimal;
  created_at: string;
  updated_at: string;
  player?: User;
  provider?: User;
  studio?: Studio;
}

// 余额交易记录接口
export interface BalanceTransaction {
  id: number;
  balance_id: number;
  type: TransactionType;
  amount: Decimal;
  before_amount: Decimal;
  after_amount: Decimal;
  description?: string;
  operator_id?: number;
  created_at: string;
  balance?: Balance;
  operator?: User;
}

// 游玩记录接口
export interface PlayRecord {
  id: number;
  player_id: number;
  provider_id: number;
  studio_id: number;
  game_name?: string;
  game_mode?: string;
  start_time: string;
  end_time?: string;
  duration?: number;
  amount?: Decimal;
  settle_type?: BalanceType;
  status: PlayStatus;
  description?: string;
  created_at: string;
  updated_at: string;
  player?: User;
  provider?: User;
  studio?: Studio;
}

// 评价接口
export interface Review {
  id: number;
  player_id: number;
  target_type: ReviewTargetType;
  target_id: number;
  rating: number;
  content?: string;
  tags?: string;
  is_anonymous: boolean;
  play_record_id?: number;
  created_at: string;
  updated_at: string;
  player?: User;
  play_record?: PlayRecord;
}

// 余额汇总行
export interface BalanceSummaryRow {
  type: BalanceType;
  total_amount: Decimal;
  player_count: number;
}

// 评分汇总
export interface ReviewSummary {
  average_rating: number;
  count: number;
  distribution: Record<string, number>;
}

// 工作室成员
export interface StudioMember {
  provider: User;
  status: RelationStatus;
  player_count: number;
  money_flow: Decimal;
  rating: number;
  joined_at?: string;
}

// 玩家控制台聚合
export interface PlayerDashboard {
  money_total: Decimal;
  time_total: Decimal;
  point_total: Decimal;
  provider_count: number;
  recent_transactions: BalanceTransaction[];
  ongoing_records: PlayRecord[];
}

// 服务者视角的玩家聚合
export interface ProviderPlayerAgg {
  player_id: number;
  nickname: string;
  username: string;
  money: Decimal;
  time: Decimal;
  point: Decimal;
  last_active?: string;
}

// 服务者控制台聚合
export interface ProviderDashboard {
  earnings: BalanceSummaryRow[];
  player_count: number;
  active_players: ProviderPlayerAgg[];
  weekly_play_counts: { date: string; count: number }[];
  todos: ProviderPlayerAgg[];
}

// 工作室控制台聚合
export interface StudioDashboard {
  studio: Studio;
  member_count: number;
  served_player_count: number;
  monthly_flow: Decimal;
  average_rating: number;
  pending_count: number;
  pending_applications: ProviderStudioRelation[];
}

// API响应格式
export interface ApiResponse<T> {
  code: number;
  message: string;
  data?: T;
}

// 分页响应格式
export interface PageResponse<T> {
  list: T[];
  total: number;
  page: number;
  page_size: number;
}

// 表单
export interface LoginForm {
  username: string;
  password: string;
}

export interface RegisterForm {
  username: string;
  email: string;
  password: string;
  phone?: string;
  nickname?: string;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface CreateStudioForm {
  name: string;
  description?: string;
  logo?: string;
  contact_info?: string;
}

// 余额操作表单（充值 / 扣费 / 退款共用）
export interface BalanceOpForm {
  player_id: number;
  provider_id: number;
  studio_id?: number;
  type: BalanceType;
  amount: number;
  description?: string;
}
