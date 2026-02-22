import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const AUTH_TOKEN_KEY = 'authToken';

/**
 * Resolves the API base URL.
 * Priority: EXPO_PUBLIC_API_URL > dev fallback for emulator.
 * Para dispositivo físico, defina no .env: EXPO_PUBLIC_API_URL=http://192.168.100.17:3000 (ou o IP da sua máquina).
 */
function getBaseURL(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }
  if (__DEV__) {
    // Android emulator: 10.0.2.2 maps to host machine's localhost
    // iOS simulator: localhost works
    return Platform.OS === 'android'
      ? 'http://10.0.2.2:3000'
      : 'http://localhost:3000';
  }
  return process.env.EXPO_PUBLIC_API_URL || '';
}

export const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT from SecureStore
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      if (__DEV__) {
        console.warn('[API] Failed to read token from SecureStore:', err);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 (token expired) and error logging
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const config = error.config;

    if (__DEV__) {
      const fullUrl = config?.baseURL && config?.url ? `${config.baseURL}${config.url}` : config?.url;
      const err = error as AxiosError & { code?: string; errno?: string };
      console.error(
        `[API] ${config?.method?.toUpperCase()} ${fullUrl}`,
        '| status:', status ?? 'no response',
        '| code:', err.code ?? 'N/A',
        '| errno:', err.errno ?? 'N/A',
        '| message:', error.message,
        '| data:', error.response?.data ?? 'N/A'
      );
    }

    if (status === 401 && config && !(config as { _retry?: boolean })._retry) {
      (config as { _retry?: boolean })._retry = true;
      try {
        await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
        // Emit event or redirect to login - handled by auth context
        const onAuthExpired = (global as { onAuthExpired?: () => void }).onAuthExpired;
        if (typeof onAuthExpired === 'function') {
          onAuthExpired();
        }
      } catch (e) {
        if (__DEV__) {
          console.warn('[API] Failed to clear token on 401:', e);
        }
      }
    }

    return Promise.reject(error);
  }
);

export async function setAuthToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
}

export async function clearAuthToken(): Promise<void> {
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
}

export async function getAuthToken(): Promise<string | null> {
  return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
}

// --- API data helpers (Next.js backend)

export interface ApiUser {
  _id: string;
  email?: string;
  currencyId?: string;
}

export interface ApiMeResponse {
  isLoggedIn: boolean;
  user?: ApiUser;
}

export async function fetchMe(): Promise<ApiMeResponse> {
  const { data } = await api.get<ApiMeResponse>('/api/auth/me');
  return data;
}

export interface TransactionCategory {
  _id: string;
  name: string;
}

export interface ApiTransaction {
  _id: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  type: 'expense' | 'income';
  is_fixed?: boolean | null;
  category: string | TransactionCategory;
  userId: string;
}

export interface TransactionsResponse {
  data: ApiTransaction[];
  totalCount: number;
  totalPages: number;
}

export interface TransactionFilters {
  description?: string;
  category?: string;
  type?: string;
  minAmount?: string;
  maxAmount?: string;
  startDate?: string;
  endDate?: string;
  fixedOnly?: boolean;
}

export async function fetchTransactions(
  userId: string,
  page: number = 1,
  limit: number = 10,
  filters: TransactionFilters = {}
): Promise<TransactionsResponse> {
  const params: Record<string, string> = {
    userId,
    page: String(page),
    limit: String(limit),
    ...(filters.description && { description: filters.description }),
    ...(filters.category && { category: filters.category }),
    ...(filters.type && { type: filters.type }),
    ...(filters.minAmount && { minAmount: filters.minAmount }),
    ...(filters.maxAmount && { maxAmount: filters.maxAmount }),
    ...(filters.startDate && { startDate: filters.startDate }),
    ...(filters.endDate && { endDate: filters.endDate }),
    ...(filters.fixedOnly && { fixedOnly: 'true' }),
  };
  const qs = new URLSearchParams(params).toString();
  const { data } = await api.get<TransactionsResponse>(`/api/transactions?${qs}`);
  return data;
}

export async function fetchAllTransactionsForSummary(
  userId: string,
  filters: TransactionFilters = {}
): Promise<TransactionsResponse> {
  const params: Record<string, string> = {
    userId,
    page: '1',
    limit: '9999',
    ...(filters.startDate && { startDate: filters.startDate }),
    ...(filters.endDate && { endDate: filters.endDate }),
  };
  const qs = new URLSearchParams(params).toString();
  const { data } = await api.get<TransactionsResponse>(`/api/transactions?${qs}`);
  return data;
}

export interface UpdateTransactionPayload {
  description: string;
  amount: number;
  currency: string;
  type: 'expense' | 'income';
  category: string;
  is_fixed?: boolean | null;
}

export async function updateTransaction(
  transactionId: string,
  payload: UpdateTransactionPayload
): Promise<ApiTransaction> {
  const { data } = await api.put<ApiTransaction>(`/api/transactions/${transactionId}`, payload);
  return data;
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  await api.delete(`/api/transactions/${transactionId}`);
}

export interface CreateTransactionPayload {
  description: string;
  amount: number;
  currency: string;
  date: string; // ISO date
  type: 'expense' | 'income';
  category: string;
  is_fixed?: boolean | null;
}

export async function createTransaction(payload: CreateTransactionPayload): Promise<ApiTransaction> {
  const { data } = await api.post<ApiTransaction>('/api/transactions', payload);
  return data;
}

export interface ApiCategory {
  _id: string;
  name: string;
}

export async function fetchCategories(): Promise<ApiCategory[]> {
  const { data } = await api.get<ApiCategory[]>('/api/categories');
  return Array.isArray(data) ? data : [];
}

export async function createCategory(name: string): Promise<ApiCategory> {
  const { data } = await api.post<ApiCategory>('/api/categories', { name });
  return data;
}

export async function updateCategory(id: string, name: string): Promise<ApiCategory> {
  const { data } = await api.put<ApiCategory>(`/api/categories/${id}`, { name });
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  await api.delete(`/api/categories/${id}`);
}

export interface CurrencyItem {
  _id: string;
  name: string;
  code: string;
}

export async function fetchCurrencies(): Promise<CurrencyItem[]> {
  const { data } = await api.get<{ success: boolean; currencies: CurrencyItem[] }>('/api/currencies');
  if (!data.success || !data.currencies) return [];
  return data.currencies;
}

export async function updateUserCurrency(currencyId: string): Promise<void> {
  await api.put('/api/user/update-currency', { currencyId });
}

export interface ParsedReceiptItem {
  description: string;
  amount: number;
  quantity?: number;
}

export interface ParsedReceipt {
  storeName: string;
  date: string;
  items: ParsedReceiptItem[];
  total: number;
  type: 'expense' | 'income';
  suggestedCategory: string;
  currency: string;
}

export interface ParseReceiptResponse {
  success: boolean;
  data?: ParsedReceipt;
  error?: string;
}

const PARSE_RECEIPT_TIMEOUT_MS = 95000;

export async function parseReceipt(
  base64Image: string,
  mimeType: string,
  locale: string,
  existingCategories: string[]
): Promise<ParseReceiptResponse> {
  const { data } = await api.post<ParseReceiptResponse>(
    '/api/receipt/parse',
    { base64Image, mimeType, locale, existingCategories },
    { timeout: PARSE_RECEIPT_TIMEOUT_MS }
  );
  return data;
}

/**
 * Envia a imagem do recibo via FormData (uri, name, type) para o ambiente nativo.
 * Evita payload JSON grande e respeita limite de 10MB no servidor.
 */
export async function parseReceiptWithFile(
  uri: string,
  name: string,
  type: string,
  locale: string,
  existingCategories: string[]
): Promise<ParseReceiptResponse> {
  const formData = new FormData();
  formData.append('image', { uri, name, type } as unknown as Blob);
  formData.append('locale', locale);
  formData.append('existingCategories', JSON.stringify(existingCategories));

  const token = await getAuthToken();
  const baseURL = getBaseURL();
  const url = `${baseURL}/api/receipt/parse`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PARSE_RECEIPT_TIMEOUT_MS);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
    signal: controller.signal,
  });
  clearTimeout(timeoutId);

  const data = (await response.json().catch(() => ({}))) as ParseReceiptResponse;
  if (!response.ok) {
    throw new Error(data.error ?? `HTTP ${response.status}`);
  }
  return data;
}

export interface InsightsData {
  summary: string;
  anomalies: string[];
  ghostExpenses: Array<{ description: string; amount: number; monthsRepeated: number; suggestion: string }>;
  cashFlowForecast: { endOfMonth: number; next90Days: number; canAffordInstallment: string };
  savingsProjection: string;
  categoryBreakdowns: Array<{
    category: string;
    currentMonth: number;
    previousAverage: number;
    percentChange: number;
  }>;
  motivationalTip: string;
}

export interface InsightsResponse {
  success: boolean;
  data?: InsightsData;
  error?: string;
}

const INSIGHTS_TIMEOUT_MS = 95000;

export async function fetchInsights(locale: string): Promise<InsightsResponse> {
  const { data } = await api.get<InsightsResponse>(
    `/api/insights?locale=${encodeURIComponent(locale)}`,
    { timeout: INSIGHTS_TIMEOUT_MS }
  );
  return data;
}
