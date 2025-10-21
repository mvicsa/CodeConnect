import axiosInstance from '@/lib/axios';
import { DEFAULT_TABLE_LIMIT } from '@/constants/pagination';
import {
  EarningsDashboardData,
  QuickStats,
  BalanceSummary,
  EscrowSummary,
  ApiResponse,
  EarningsHistoryResponse,
  PurchasesHistoryResponse,
  PurchaseActionResponse,
  RetryLimitsResponse,
  MeetingPurchase,
  DashboardResponse,
  EscrowsResponse,
  WithdrawalsHistoryResponse,
  MonthlyPoint,
  RecentActivity,
  RecentActivitiesResponse,
  WithdrawalHistory,
} from '@/types/earnings';

// API calls for Payment Controller
export const getEarningsDashboard = async (params?: { startDate?: string; endDate?: string }): Promise<ApiResponse<EarningsDashboardData>> => {
  // Fetch the new dashboard response and map it to our internal shape
  const response = await axiosInstance.get<DashboardResponse>('/payment/dashboard', { params });

  const raw = response.data;

  const normalizeMonth = (m?: string): string | undefined => {
    if (!m) return undefined;
    // Already in YYYY-MM
    if (/^\d{4}-\d{2}$/.test(m)) return m;
    // Try direct Date parse (e.g., "Aug 2025")
    let d = new Date(m);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${year}-${month}`;
    }
    // Try with day suffix variants
    d = new Date(`${m}-01`);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${year}-${month}`;
    }
    d = new Date(`${m} 01`);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${year}-${month}`;
    }
    return m; // fallback
  };

  const labelFromYyyyMm = (ym: string): string => {
    const [y, m] = ym.split('-').map((v) => parseInt(v, 10));
    const d = new Date(y, (m || 1) - 1, 1);
    return d.toLocaleString(undefined, { month: 'short', year: 'numeric' });
  };

  // Collect all months from API-provided series
  const monthsSet = new Set<string>();
  const rawMonthlyEarnings: MonthlyPoint[] | undefined = (raw as unknown as { monthlyEarnings: MonthlyPoint[] })?.monthlyEarnings;
  if (Array.isArray(rawMonthlyEarnings)) rawMonthlyEarnings.forEach((m) => {
    const key = normalizeMonth(m?.month);
    if (key) monthsSet.add(key);
  });
  const rawMonthlyPurchases: MonthlyPoint[] | undefined = (raw as unknown as { monthlyPurchases: MonthlyPoint[] })?.monthlyPurchases;
  if (Array.isArray(rawMonthlyPurchases)) rawMonthlyPurchases.forEach((m) => {
    const key = normalizeMonth(m?.month);
    if (key) monthsSet.add(key);
  });

  // If backend did not provide purchases series, derive by summing purchase amounts per month from recentActivities
  const derivedPurchasesByMonth = (() => {
    const map = new Map<string, number>();
    (raw?.recentActivities || []).forEach((a) => {
      if (a?.type === 'purchase' && a?.date) {
        const month = a.date.slice(0, 7);
        const amount = typeof a.amount === 'number' ? a.amount : 0;
        map.set(month, (map.get(month) || 0) + amount);
        monthsSet.add(month);
      }
    });
    return map;
  })();

  // Normalize to sorted array of months
  const months = Array.from(monthsSet).sort((a, b) => {
    // Sort chronologically by year, then month
    const [ay, am] = a.split('-').map((v) => parseInt(v, 10));
    const [by, bm] = b.split('-').map((v) => parseInt(v, 10));
    if (ay !== by) return ay - by;
    return (am || 0) - (bm || 0);
  });

  // Build normalized earnings series (fill missing months with 0)
  const earningsByMonth = new Map<string, number>();
  if (Array.isArray(rawMonthlyEarnings)) {
    rawMonthlyEarnings.forEach((m) => {
      const total = typeof m?.earnings === 'number' ? m.earnings : (typeof m?.total === 'number' ? m.total : 0);
      const key = normalizeMonth(m?.month);
      if (key) earningsByMonth.set(key, total);
    });
  }
  const earningsSeries = months.map((m) => ({ month: labelFromYyyyMm(m), earnings: earningsByMonth.get(m) || 0, purchases: 0 }));

  // Build normalized purchases series (prefer API totals, otherwise derived amounts)
  const purchasesByMonth = new Map<string, number>();
  if (Array.isArray(rawMonthlyPurchases)) {
    rawMonthlyPurchases.forEach((m) => {
      const total = typeof m?.purchases === 'number' ? m.purchases : (typeof m?.total === 'number' ? m.total : 0);
      const key = normalizeMonth(m?.month);
      if (key) purchasesByMonth.set(key, total);
    });
  }
  // If monthlyPurchases not provided in response, attempt to read from monthlyEarnings entries' purchases field
  if (!purchasesByMonth.size && Array.isArray(rawMonthlyEarnings)) {
    rawMonthlyEarnings.forEach((m) => {
      const total = typeof m?.purchases === 'number' ? m.purchases : 0;
      const key = normalizeMonth(m?.month);
      if (key && (purchasesByMonth.get(key) == null)) purchasesByMonth.set(key, total);
    });
  }
  // If still empty, derive from recent activities (sum of purchase amounts)
  if (!purchasesByMonth.size) {
    derivedPurchasesByMonth.forEach((v, k) => purchasesByMonth.set(k, v));
  }
  const purchasesSeries = months.map((m) => ({ month: labelFromYyyyMm(m), earnings: 0, purchases: purchasesByMonth.get(m) || 0 }));

  const mapped: EarningsDashboardData = {
    stats: {
      totalEarnings: raw?.stats?.totalEarnings ?? 0,
      totalSpent: raw?.stats?.totalSpent ?? 0,
      availableBalance: raw?.stats?.availableBalance ?? 0,
      pendingEarnings: raw?.stats?.pendingEarnings ?? 0,
      totalSessionsCreated: raw?.stats?.totalSessionsCreated ?? 0,
      totalSessionsPurchased: raw?.stats?.totalSessionsPurchased ?? 0,
      totalParticipants: raw?.stats?.totalParticipants ?? 0,
      currency: 'USD',
    },
    recentActivities: Array.isArray(raw?.recentActivities) ? raw.recentActivities.map((a) => ({
      _id: (a as unknown as { _id: string })._id || `${a.date}-${a.roomId || ''}-${a.amount}`,
      type: a.type,
      description: a.description || '',
      amount: a.amount || 0,
      currency: a.currency || 'USD',
      date: a.date || '',
      roomName: a.roomName || '',
      roomId: a.roomId || '',
      status: a.status || '',
    })) : [],
    monthlyEarnings: earningsSeries,
    monthlyPurchases: purchasesSeries,
  };

  return { data: mapped };
};

// interface OldQuickStats {
//   thisMonthEarnings: number;
//   thisMonthSpending: number;
//   availableForWithdrawal: number;
//   pendingInEscrow: number;
//   currency?: string;
// }

export const getQuickStats = async (): Promise<ApiResponse<QuickStats>> => {
  try {
    const response = await axiosInstance.get<{ thisMonthEarnings: number; thisMonthSpending: number; availableForWithdrawal: number; pendingInEscrow: number }>('/payment/quick-stats');
    // Map the actual API response to our QuickStats interface
    const quickStats: QuickStats = {
      totalEarnings: response.data.thisMonthEarnings ?? 0,
      totalSpent: response.data.thisMonthSpending ?? 0,
      availableBalance: response.data.availableForWithdrawal ?? 0,
      pendingEarnings: response.data.pendingInEscrow ?? 0,
      totalSessionsCreated: 0, // These weren't in the original response
      totalSessionsPurchased: 0,
      totalParticipants: 0,
      currency: 'USD', // Default currency
    };

    return { data: quickStats };
  } catch (error) {
    // Throw a more informative error
    throw new Error(`Failed to fetch quick stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getMyEarnings = async (params?: { page?: number; limit?: number; startDate?: string; endDate?: string; currency?: string; search?: string }): Promise<ApiResponse<EarningsHistoryResponse>> => {
  try {
    const qp = new URLSearchParams();
    if (params) {
      if (params.page != null) qp.append('page', String(params.page));
      if (params.limit != null) qp.append('limit', String(params.limit));
      if (params.startDate) qp.append('startDate', params.startDate);
      if (params.endDate) qp.append('endDate', params.endDate);
      if (params.currency) qp.append('currency', params.currency);
      if (params.search) qp.append('search', params.search);
    }
    const queryParams = qp.toString();
    const response = await axiosInstance.get<ApiResponse<EarningsHistoryResponse>>(`/payment/my-earnings?${queryParams}`);

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getMyPurchases = async (params?: { page?: number; limit?: number; startDate?: string; endDate?: string; currency?: string; roomId?: string; search?: string }): Promise<ApiResponse<PurchasesHistoryResponse>> => {
  try {
    const qp = new URLSearchParams();
    if (params) {
      if (params.page != null) qp.append('page', String(params.page));
      if (params.limit != null) qp.append('limit', String(params.limit));
      if (params.startDate) qp.append('startDate', params.startDate);
      if (params.endDate) qp.append('endDate', params.endDate);
      if (params.currency) qp.append('currency', params.currency);
      if (params.roomId) qp.append('roomId', params.roomId);
      if (params.search) qp.append('search', params.search);
    }
    const queryParams = qp.toString();
    const response = await axiosInstance.get<ApiResponse<PurchasesHistoryResponse>>(`/payment/my-purchases?${queryParams}`);

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getMyWithdrawals = async (params?: { page?: number; limit?: number; startDate?: string; endDate?: string; status?: string; search?: string }): Promise<WithdrawalsHistoryResponse> => {
  try {
    const qp = new URLSearchParams();
    if (params) {
      if (params.page != null) qp.append('page', String(params.page));
      if (params.limit != null) qp.append('limit', String(params.limit));
      if (params.startDate) qp.append('startDate', params.startDate);
      if (params.endDate) qp.append('endDate', params.endDate);
      if (params.status) qp.append('status', params.status);
      if (params.search) qp.append('search', params.search);
    }
    const queryParams = qp.toString();
    const response = await axiosInstance.get<WithdrawalsHistoryResponse>(`/earnings-escrow/withdrawals?${queryParams}`);

    return response.data;
  } catch (error) {
    throw error;
  }
};

// New Recent Activities endpoint with pagination
export const getRecentActivities = async (params?: { page?: number; limit?: number; startDate?: string; endDate?: string; search?: string }): Promise<ApiResponse<{
  data: RecentActivity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}>> => {
  try {
    const qp = new URLSearchParams();
    if (params) {
      if (params.page != null) qp.append('page', String(params.page));
      if (params.limit != null) qp.append('limit', String(params.limit));
      if (params.startDate) qp.append('startDate', params.startDate);
      if (params.endDate) qp.append('endDate', params.endDate);
      if (params.search) qp.append('search', params.search);
    }
    const queryParams = qp.toString();
    const response = await axiosInstance.get<RecentActivitiesResponse>(`/payment/recent-activities?${queryParams}`);
    
    // Ensure the response matches the expected structure
    return { 
      data: {
        data: response.data.data,
        total: response.data.total,
        page: response.data.page,
        limit: response.data.limit,
        totalPages: response.data.totalPages
      }
    };
  } catch (error) {
    throw error;
  }
};

export const getBalanceSummary = async (): Promise<ApiResponse<BalanceSummary>> => {
  try {
    const response = await axiosInstance.get<ApiResponse<BalanceSummary>>('/balance/summary');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// interface OldEscrowSummary {
//   totalPendingAmount: number;
//   totalReleasedAmount: number;
//   totalRefundedAmount: number;
//   escrows: any[];
// }

export const getEscrowSummary = async (params?: { startDate?: string; endDate?: string }): Promise<ApiResponse<EscrowSummary>> => {
  try {
    const queryParams = new URLSearchParams();

    // Only add non-undefined parameters
    if (params?.startDate !== undefined && params?.startDate !== null) {
      queryParams.append('startDate', params.startDate);
    }
    if (params?.endDate !== undefined && params?.endDate !== null) {
      queryParams.append('endDate', params.endDate);
    }

    const queryString = queryParams.toString();
    const url = `/balance/escrow-summary${queryString ? `?${queryString}` : ''}`;
    const response = await axiosInstance.get<{ totalPendingAmount: number; totalReleasedAmount: number; totalRefundedAmount: number; totalDisputedAmount: number; currency: string, message?: string }>(url);

    // Extract escrow data from response
    const escrowData = response.data || {};

    const mappedEscrow: EscrowSummary = {
      totalPendingEscrow: escrowData.totalPendingAmount || 0,
      totalReleasedEscrow: escrowData.totalReleasedAmount || 0,
      totalRefundedEscrow: escrowData.totalRefundedAmount || 0,
      totalDisputedEscrow: escrowData.totalDisputedAmount || 0,
      currency: escrowData.currency || 'USD',
    };

    return { 
      data: mappedEscrow, 
      message: response.data?.message 
    };
  } catch (error) {
    throw error;
  }
};

export const getEscrows = async (params?: {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  currency?: string;
  roomId?: string;
  search?: string;
}): Promise<ApiResponse<EscrowsResponse>> => {
  try {
    const qp = new URLSearchParams();
    if (params) {
      if (params.page != null) qp.append('page', String(params.page));
      if (params.limit != null) qp.append('limit', String(params.limit));
      if (params.startDate) qp.append('startDate', params.startDate);
      if (params.endDate) qp.append('endDate', params.endDate);
      if (params.currency) qp.append('currency', params.currency);
      if (params.roomId) qp.append('roomId', params.roomId);
      if (params.search) qp.append('search', params.search);
    }
    const queryParams = qp.toString();
    const response = await axiosInstance.get<ApiResponse<EscrowsResponse>>(`/balance/escrows?${queryParams}`);

    // Ensure the response matches the expected EscrowsResponse structure
    return {
      ...response.data,
      data: response.data.data || [],
      total: response.data.total || 0,
      page: response.data.page || 1,
      limit: response.data.limit || DEFAULT_TABLE_LIMIT, // Assuming DEFAULT_TABLE_LIMIT is defined elsewhere or needs to be imported
      totalPages: response.data.totalPages || 0
    };
  } catch (error) {
    throw error;
  }
};

export const postWithdrawEarnings = async (amount: number): Promise<ApiResponse<WithdrawalHistory>> => {
  const response = await axiosInstance.post<ApiResponse<WithdrawalHistory>>('/balance/withdraw', { amount });
  return response.data;
};

// Purchase Management API calls
export const cancelPurchase = async (purchaseId: string): Promise<PurchaseActionResponse> => {
  try {
    const response = await axiosInstance.post<PurchaseActionResponse>(
      `/livekit/purchases/${purchaseId}/cancel`
    );
    return response.data;
  } catch (error) {
    throw new Error((error as { response: { data: { message: string } } }).response?.data?.message || 'Failed to cancel purchase');
  }
};

export const retryPurchase = async (purchaseId: string): Promise<PurchaseActionResponse> => {
  try {
    const response = await axiosInstance.post<PurchaseActionResponse>(
      `/livekit/purchases/${purchaseId}/retry`
    );
    return response.data;
  } catch (error) {
    throw new Error((error as { response: { data: { message: string } } }).response?.data?.message || 'Failed to retry purchase');
  }
};

export const getPurchaseById = async (purchaseId: string): Promise<MeetingPurchase> => {
  try {
    const response = await axiosInstance.get<MeetingPurchase>(
      `/livekit/purchases/${purchaseId}`
    );
    return response.data;
  } catch (error) {
    throw new Error((error as { response: { data: { message: string } } }).response?.data?.message || 'Failed to fetch purchase');
  }
};

export const checkRetryLimits = async (): Promise<RetryLimitsResponse> => {
  try {
    const response = await axiosInstance.get<RetryLimitsResponse>(
      '/livekit/purchases/retry-limits'
    );
    return response.data;
  } catch (error) {
    throw new Error((error as { response: { data: { message: string } } }).response?.data?.message || 'Failed to check retry limits');
  }
};
