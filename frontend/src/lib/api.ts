import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  ApiResponse,
  PageResponse,
  User,
  Studio,
  Balance,
  BalanceTransaction,
  ProviderStudioRelation,
  LoginForm,
  RegisterForm,
  LoginResponse,
  CreateStudioForm,
  AddBalanceForm
} from '@/types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器 - 添加token
    this.client.interceptors.request.use((config) => {
      const token = this.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // 响应拦截器 - 处理错误
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.removeToken();
          // 重定向到登录页面
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Token管理
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  private setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  private removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  // 通用请求方法
  private async request<T>(
    method: 'get' | 'post' | 'put' | 'delete',
    url: string,
    data?: any,
    params?: any
  ): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.request({
      method,
      url,
      data,
      params,
    });

    if (response.data.code !== 0) {
      throw new Error(response.data.message);
    }

    return response.data.data as T;
  }

  // 认证相关API
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
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  }

  // 用户相关API
  async getProfile(): Promise<User> {
    return this.request<User>('get', '/profile');
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    return this.request<User>('put', '/profile', data);
  }

  async getUserById(id: number): Promise<User> {
    return this.request<User>('get', `/users/${id}`);
  }

  async getUserList(params?: {
    page?: number;
    page_size?: number;
    role?: string;
  }): Promise<PageResponse<User>> {
    return this.request<PageResponse<User>>('get', '/admin/users', null, params);
  }

  // 工作室相关API
  async getStudioList(params?: {
    page?: number;
    page_size?: number;
    keyword?: string;
  }): Promise<PageResponse<Studio>> {
    return this.request<PageResponse<Studio>>('get', '/studios', null, params);
  }

  async getStudioById(id: number): Promise<Studio> {
    return this.request<Studio>('get', `/studios/${id}`);
  }

  async createStudio(form: CreateStudioForm): Promise<Studio> {
    return this.request<Studio>('post', '/studio', form);
  }

  async updateStudio(id: number, form: CreateStudioForm): Promise<Studio> {
    return this.request<Studio>('put', `/studio/${id}`, form);
  }

  async applyToJoinStudio(id: number, notes?: string): Promise<ProviderStudioRelation> {
    return this.request<ProviderStudioRelation>('post', `/studio/${id}/apply`, { notes });
  }

  async getStudioApplications(
    id: number,
    params?: {
      page?: number;
      page_size?: number;
      status?: string;
    }
  ): Promise<PageResponse<ProviderStudioRelation>> {
    return this.request<PageResponse<ProviderStudioRelation>>(
      'get',
      `/studio/${id}/applications`,
      null,
      params
    );
  }

  async processApplication(
    id: number,
    status: 'approved' | 'rejected',
    notes?: string
  ): Promise<ProviderStudioRelation> {
    return this.request<ProviderStudioRelation>('put', `/studio/applications/${id}`, {
      status,
      notes,
    });
  }

  // 余额相关API
  async getPlayerBalances(params?: {
    page?: number;
    page_size?: number;
    type?: string;
  }): Promise<PageResponse<Balance>> {
    return this.request<PageResponse<Balance>>('get', '/player/balances', null, params);
  }

  async getBalanceByProvider(
    providerId: number,
    studioId?: number
  ): Promise<Balance[]> {
    const params = studioId ? { studio_id: studioId } : undefined;
    return this.request<Balance[]>('get', `/player/balances/provider/${providerId}`, null, params);
  }

  async getBalanceTransactions(
    balanceId: number,
    params?: {
      page?: number;
      page_size?: number;
      type?: string;
    }
  ): Promise<PageResponse<BalanceTransaction>> {
    return this.request<PageResponse<BalanceTransaction>>(
      'get',
      `/player/balances/${balanceId}/transactions`,
      null,
      params
    );
  }

  async addBalance(form: AddBalanceForm): Promise<Balance> {
    return this.request<Balance>('post', '/provider/balances', form);
  }

  async addBalanceByStudio(form: AddBalanceForm): Promise<Balance> {
    return this.request<Balance>('post', '/studio/balances', form);
  }

  async getProviderBalanceSummary(): Promise<any[]> {
    return this.request<any[]>('get', '/provider/balance-summary');
  }

  // 健康检查
  async healthCheck(): Promise<{ status: string; message: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;