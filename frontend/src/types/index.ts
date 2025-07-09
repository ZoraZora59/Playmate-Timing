// 用户角色枚举
export enum UserRole {
  PLAYER = 'player',
  PROVIDER = 'provider',
  STUDIO = 'studio'
}

// 关联状态枚举
export enum RelationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

// 余额类型枚举
export enum BalanceType {
  MONEY = 'money',
  TIME = 'time',
  POINT = 'point'
}

// 交易类型枚举
export enum TransactionType {
  RECHARGE = 'recharge',
  CONSUME = 'consume',
  REFUND = 'refund',
  FREEZE = 'freeze',
  UNFREEZE = 'unfreeze'
}

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
  reviews?: Review[];
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
  amount: number;
  frozen_amount: number;
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
  amount: number;
  before_amount: number;
  after_amount: number;
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
  amount?: number;
  status: string;
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
  target_type: string;
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

// 登录表单
export interface LoginForm {
  username: string;
  password: string;
}

// 注册表单
export interface RegisterForm {
  username: string;
  email: string;
  password: string;
  phone?: string;
  nickname?: string;
  role: UserRole;
}

// 登录响应
export interface LoginResponse {
  token: string;
  user: User;
}

// 创建工作室表单
export interface CreateStudioForm {
  name: string;
  description?: string;
  logo?: string;
  contact_info?: string;
}

// 添加余额表单
export interface AddBalanceForm {
  player_id: number;
  provider_id: number;
  studio_id?: number;
  type: BalanceType;
  amount: number;
  description?: string;
}