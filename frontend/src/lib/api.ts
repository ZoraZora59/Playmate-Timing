import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  ApiResponse,
  PageResponse,
  User,
  Studio,
  Balance,
  BalanceTransaction,
  BalanceSummaryRow,
  ProviderStudioRelation,
  StudioMember,
  PlayRecord,
  Review,
  ReviewSummary,
  PlayerDashboard,
  ProviderDashboard,
  StudioDashboard,
  LoginForm,
  RegisterForm,
  LoginResponse,
  CreateStudioForm,
  BalanceOpForm,
  ReviewTargetType,
} from '@/types';

type Params = Record<string, string | number | undefined> | undefined;

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8090/api/v1',
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use((config) => {
      const token = this.getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.removeToken();
          if (typeof window !== 'undefined') window.location.href = '/auth/login';
        }
        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }
  private setToken(token: string): void {
    if (typeof window !== 'undefined') localStorage.setItem('token', token);
  }
  private removeToken(): void {
    if (typeof window !== 'undefined') localStorage.removeItem('token');
  }

  private async request<T>(
    method: 'get' | 'post' | 'put' | 'delete',
    url: string,
    data?: unknown,
    params?: Params
  ): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.request({ method, url, data, params });
    if (response.data.code !== 0) throw new Error(response.data.message);
    return response.data.data as T;
  }

  // ---------------- 认证 ----------------
  async login(form: LoginForm): Promise<LoginResponse> {
    const result = await this.request<LoginResponse>('post', '/login', form);
    this.setToken(result.token);
    return result;
  }
  async register(form: RegisterForm): Promise<LoginResponse> {
    const result = await this.request<LoginResponse>('post', '/register', form);
    this.setToken(result.token);
    return result;
  }
  logout(): void {
    this.removeToken();
    if (typeof window !== 'undefined') window.location.href = '/auth/login';
  }

  // ---------------- 用户 ----------------
  getProfile = () => this.request<User>('get', '/profile');
  updateProfile = (data: Partial<User>) => this.request<User>('put', '/profile', data);
  getUserById = (id: number) => this.request<User>('get', `/users/${id}`);
  getUserList = (params?: Params) => this.request<PageResponse<User>>('get', '/admin/users', null, params);

  // ---------------- 控制台聚合 ----------------
  getPlayerDashboard = () => this.request<PlayerDashboard>('get', '/player/dashboard');
  getProviderDashboard = () => this.request<ProviderDashboard>('get', '/provider/dashboard');
  getStudioDashboard = () => this.request<StudioDashboard>('get', '/studio/dashboard');

  // ---------------- 工作室 ----------------
  getStudioList = (params?: { page?: number; page_size?: number; keyword?: string }) =>
    this.request<PageResponse<Studio>>('get', '/studios', null, params);
  getStudioById = (id: number) => this.request<Studio>('get', `/studios/${id}`);
  createStudio = (form: CreateStudioForm) => this.request<Studio>('post', '/studio', form);
  updateStudio = (id: number, form: CreateStudioForm) => this.request<Studio>('put', `/studio/${id}`, form);
  applyToJoinStudio = (id: number, notes?: string) =>
    this.request<ProviderStudioRelation>('post', `/studio/${id}/apply`, { notes });
  getStudioApplications = (id: number, params?: Params) =>
    this.request<PageResponse<ProviderStudioRelation>>('get', `/studio/${id}/applications`, null, params);
  processApplication = (id: number, status: 'approved' | 'rejected', notes?: string) =>
    this.request<ProviderStudioRelation>('put', `/studio/applications/${id}`, { status, notes });
  getStudioMembers = () => this.request<StudioMember[]>('get', '/studio/members');
  getMyRelations = () => this.request<ProviderStudioRelation[]>('get', '/provider/relations');

  // ---------------- 余额 ----------------
  getPlayerBalances = (params?: { page?: number; page_size?: number; type?: string }) =>
    this.request<PageResponse<Balance>>('get', '/player/balances', null, params);
  getBalanceByProvider = (providerId: number, studioId?: number) =>
    this.request<Balance[]>('get', `/player/balances/provider/${providerId}`, null,
      studioId !== undefined ? { studio_id: studioId } : undefined);
  getBalanceTransactions = (balanceId: number, params?: Params, asProvider = false) =>
    this.request<PageResponse<BalanceTransaction>>(
      'get',
      `${asProvider ? '/provider' : '/player'}/balances/${balanceId}/transactions`,
      null,
      params
    );
  getProviderBalanceSummary = () => this.request<BalanceSummaryRow[]>('get', '/provider/balance-summary');

  // 充值 / 扣费 / 退款（asStudio 决定走 /studio 还是 /provider 前缀）
  recharge = (form: BalanceOpForm, asStudio = false) =>
    this.request<Balance>('post', `${asStudio ? '/studio' : '/provider'}/balances`, form);
  deduct = (form: BalanceOpForm, asStudio = false) =>
    this.request<Balance>('post', `${asStudio ? '/studio' : '/provider'}/balances/deduct`, form);
  refund = (form: BalanceOpForm, asStudio = false) =>
    this.request<Balance>('post', `${asStudio ? '/studio' : '/provider'}/balances/refund`, form);

  // ---------------- 游玩记录 ----------------
  listMyRecords = (params?: { page?: number; page_size?: number; status?: string }) =>
    this.request<PageResponse<PlayRecord>>('get', '/player/records', null, params);
  listHostedRecords = (params?: { page?: number; page_size?: number; status?: string }) =>
    this.request<PageResponse<PlayRecord>>('get', '/provider/play-records', null, params);
  createPlayRecord = (data: {
    player_id: number;
    game_name: string;
    game_mode?: string;
    settle_type?: string;
    studio_id?: number;
    description?: string;
  }) => this.request<PlayRecord>('post', '/provider/play-records', data);
  completePlayRecord = (id: number, data: { duration: number; amount: number; settle?: boolean }) =>
    this.request<PlayRecord>('put', `/provider/play-records/${id}/complete`, data);
  cancelPlayRecord = (id: number) => this.request<PlayRecord>('put', `/provider/play-records/${id}/cancel`, {});

  // ---------------- 评价 ----------------
  createReview = (data: {
    target_type: ReviewTargetType;
    target_id: number;
    rating: number;
    content?: string;
    tags?: string;
    is_anonymous?: boolean;
    play_record_id?: number;
  }) => this.request<Review>('post', '/player/reviews', data);
  listMyReviews = (params?: Params) => this.request<PageResponse<Review>>('get', '/player/reviews', null, params);
  listReviewsByTarget = (targetType: ReviewTargetType, targetId: number, params?: Params) =>
    this.request<PageResponse<Review>>('get', '/reviews', null, {
      ...params,
      target_type: targetType,
      target_id: targetId,
    });
  getReviewSummary = (targetType: ReviewTargetType, targetId: number) =>
    this.request<ReviewSummary>('get', '/reviews/summary', null, {
      target_type: targetType,
      target_id: targetId,
    });

  // ---------------- 健康检查 ----------------
  async healthCheck(): Promise<{ status: string; message: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
