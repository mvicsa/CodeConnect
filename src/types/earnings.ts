// Purchase Status Enum
export enum PurchaseStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  FAILED = 'failed',
  EXPIRED = 'expired'
}

// Purchase Messages
export const PURCHASE_MESSAGES = {
  [PurchaseStatus.PENDING]: 'Your purchase is being processed. Please wait...',
  [PurchaseStatus.COMPLETED]: 'Payment successful! You can now join the session.',
  [PurchaseStatus.FAILED]: 'Payment failed. Please try again.',
  [PurchaseStatus.EXPIRED]: 'Purchase session expired. Please try again.',
  [PurchaseStatus.CANCELLED]: 'Purchase was cancelled. You can try again.',
  [PurchaseStatus.REFUNDED]: 'Your payment has been refunded.'
};

export interface MeetingPurchase {
  _id: string;
  userId: string;
  roomId: string;
  roomName?: string;
  amountPaid: number;
  currencyUsed: string;
  transactionId: string;
  status: PurchaseStatus;
  purchaseDate: string;
  // الحقول الجديدة
  expiresAt?: string;
  failureReason?: string;
  retryCount: number;
  lastRetryAt?: string;
  stripePaymentIntentId?: string;
  // Actions المتاحة
  actions?: {
    canCancel: boolean;
    canRetry: boolean;
    message: string;
    expiresIn?: number; // بالدقائق
  };
}

export type EarningsEscrow = {
  _id: string;
  roomId: { _id: string; name: string } | string;
  roomName?: string;
  amount: number;
  amountPaid?: number;
  currency: string;
  currencyUsed?: string;
  status: string;
  type?: string;
  releaseDate?: string;
} & Record<string, unknown>

export interface WithdrawalRequestDto {
  amount: number;
  currency: string;
}

export interface QuickStats {
  totalEarnings: number;
  totalSpent: number;
  availableBalance: number;
  pendingEarnings: number;
  totalSessionsCreated: number;
  totalSessionsPurchased: number;
  totalParticipants: number;
  currency: string;
}

export interface EarningsHistory {
  _id: string;
  roomId: string;
  roomName: string;
  amount: number;
  currency: string;
  status: 'pending' | 'released' | 'refunded' | 'disputed';
  releaseDate: string;
  createdAt: string;
}

export interface PurchasesHistory {
  _id: string;
  roomId: string;
  roomName: string;
  amountPaid: number;
  currencyUsed: string;
  status: PurchaseStatus;
  purchaseDate: string;
  transactionId: string;
  // الحقول الجديدة
  expiresAt?: string;
  failureReason?: string;
  retryCount: number;
  lastRetryAt?: string;
  stripePaymentIntentId?: string;
  // Actions المتاحة
  actions?: {
    canCancel: boolean;
    canRetry: boolean;
    message: string;
    expiresIn?: number;
  };
}

export interface BalanceSummary {
  availableBalance: number;
  pendingBalance: number;
  totalEarnings: number;
  totalPurchases: number;
  currency: string;
}

export interface EscrowSummary {
  totalPendingEscrow: number;
  totalReleasedEscrow: number;
  totalRefundedEscrow: number;
  totalDisputedEscrow: number;
  currency: string;
}

export interface EarningsDashboardData {
  stats: QuickStats;
  recentActivities: {
    _id: string;
    type: string;
    description: string;
    amount: number;
    currency: string;
    date: string;
    roomName: string;
    roomId: string;
    status: string;
  }[];
  monthlyEarnings: { month: string; earnings: number; purchases: number }[];
  monthlyPurchases: { month: string; earnings: number; purchases: number }[];
}

export interface EarningsHistoryResponse extends Pagination {
  earnings: EarningsHistory[];
  totalEarningsUSD: number;
  totalCount: number;
}

export interface PurchasesHistoryResponse extends Pagination {
  purchases: PurchasesHistory[];
  totalSpentUSD: number;
  totalCount: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status?: number;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

// Payment Dashboard Types
export type DashboardStats = {
  totalEarnings: number;
  totalSpent: number;
  availableBalance: number;
  pendingEarnings: number;
  totalSessionsCreated: number;
  totalSessionsPurchased: number;
  totalParticipants: number;
};

export interface RecentActivity {
  _id?: string;
  type: "earning" | "purchase" | string;
  description?: string;
  amount?: number;
  currency?: string;
  date?: string;
  roomName?: string;
  roomId?: string;
  status?: string;
}

export type MonthlyPoint = { month: string; total: number; earnings: number; purchases: number };

export type DashboardResponse = {
  stats: DashboardStats;
  recentActivities: RecentActivity[];
  monthlyEarnings: MonthlyPoint[];
};

// Purchase Actions Response
export interface PurchaseActionResponse {
  success: boolean;
  message: string;
}

// Retry Limits Response
export interface RetryLimitsResponse {
  canRetry: boolean;
  reason?: string;
  hourlyAttempts?: number;
  dailyAttempts?: number;
  hourlyLimit?: number;
  dailyLimit?: number;
}

export interface EscrowsResponse {
  data: EarningsEscrow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface WithdrawalHistory {
  _id: string;
  creatorId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  processedAt?: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  failedAt?: string;
  failureReason?: string;
  title: string;
  type: string;
  date: string;
  releaseDate: string;
  roomId: { _id: string; name: string } | string;
  roomName: string;
  amountPaid: number;
  currencyUsed: string;
  purchaseDate: string;
  transactionId: string;
  expiresAt?: string;
}

export interface WithdrawalsHistoryResponse extends Pagination {
  data: WithdrawalHistory[];
}

export interface RecentActivitiesResponse {
  data: RecentActivity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
