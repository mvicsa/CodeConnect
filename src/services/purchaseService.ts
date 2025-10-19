import axiosInstance from '@/lib/axios';
import { 
  PurchaseActionResponse, 
  RetryLimitsResponse,
  MeetingPurchase,
  PurchasesHistoryResponse,
  DashboardResponse
} from '@/types/earnings';

export class PurchaseService {
  /**
   * Cancel a pending purchase
   */
  static async cancelPurchase(purchaseId: string): Promise<PurchaseActionResponse> {
    try {
      const response = await axiosInstance.post<PurchaseActionResponse>(
        `/livekit/purchases/${purchaseId}/cancel`
      );
      return response.data;
    } catch (error) {
      throw new Error((error as { response: { data: { message: string } } }).response?.data?.message || 'Failed to cancel purchase');
    }
  }

  /**
   * Retry a failed purchase
   */
  static async retryPurchase(purchaseId: string): Promise<PurchaseActionResponse> {
    try {
      const response = await axiosInstance.post<PurchaseActionResponse>(
        `/livekit/purchases/${purchaseId}/retry`
      );
      return response.data;
    } catch (error) {
      throw new Error((error as { response: { data: { message: string } } }).response?.data?.message || 'Failed to retry purchase');
    }
  }

  /**
   * Get user purchases with new fields
   */
  static async getUserPurchases(params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    currency?: string;
    roomId?: string;
  }): Promise<PurchasesHistoryResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);
      if (params?.currency) queryParams.append('currency', params.currency);
      if (params?.roomId) queryParams.append('roomId', params.roomId);

      const response = await axiosInstance.get<PurchasesHistoryResponse>(
        `/payment/my-purchases?${queryParams.toString()}`
      );
      return response.data;
    } catch (error) {
      throw new Error((error as { response: { data: { message: string } } }).response?.data?.message || 'Failed to fetch purchases');
    }
  }

  /**
   * Get specific purchase by ID
   */
  static async getPurchaseById(purchaseId: string): Promise<MeetingPurchase> {
    try {
      const response = await axiosInstance.get<MeetingPurchase>(
        `/livekit/purchases/${purchaseId}`
      );
      return response.data;
    } catch (error) {
      throw new Error((error as { response: { data: { message: string } } }).response?.data?.message || 'Failed to fetch purchase');
    }
  }

  /**
   * Check retry limits for user
   */
  static async checkRetryLimits(): Promise<RetryLimitsResponse> {
    try {
      const response = await axiosInstance.get<RetryLimitsResponse>(
        '/livekit/purchases/retry-limits'
      );
      return response.data;
    } catch (error) {
      throw new Error((error as { response: { data: { message: string } } }).response?.data?.message || 'Failed to check retry limits');
    }
  }

  /**
   * Get payment dashboard data
   */
  static async getPaymentDashboard(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<DashboardResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);
      const qs = queryParams.toString();
      const url = `/payment/dashboard${qs ? `?${qs}` : ''}`;
      const response = await axiosInstance.get<DashboardResponse>(url);
      return response.data;
    } catch (error) {
      throw new Error((error as { response: { data: { message: string } } }).response?.data?.message || 'Failed to fetch dashboard');
    }
  }

  /**
   * Get purchase status message
   */
  static getPurchaseStatusMessage(status: string): string {
    const messages: Record<string, string> = {
      'pending': 'Your purchase is being processed. Please wait...',
      'completed': 'Payment successful! You can now join the session.',
      'failed': 'Payment failed. Please try again.',
      'expired': 'Purchase session expired. Please try again.',
      'cancelled': 'Purchase was cancelled. You can try again.',
      'refunded': 'Your payment has been refunded.'
    };
    
    return messages[status] || 'Unknown status';
  }

  /**
   * Check if purchase can be cancelled
   */
  static canCancelPurchase(purchase: MeetingPurchase): boolean {
    return purchase.status === 'pending' && 
           purchase.actions?.canCancel === true;
  }

  /**
   * Check if purchase can be retried
   */
  static canRetryPurchase(purchase: MeetingPurchase): boolean {
    return ['failed', 'expired', 'cancelled'].includes(purchase.status) && 
           purchase.actions?.canRetry === true;
  }

  /**
   * Check if purchase is expired
   */
  static isPurchaseExpired(purchase: MeetingPurchase): boolean {
    if (!purchase.expiresAt) return false;
    return new Date() > new Date(purchase.expiresAt);
  }

  /**
   * Get time remaining until expiry
   */
  static getTimeUntilExpiry(expiresAt: string): number {
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    return Math.max(0, expiry - now);
  }

  /**
   * Format time remaining as human readable
   */
  static formatTimeRemaining(milliseconds: number): string {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }
}

// Export singleton instance
export const purchaseService = new PurchaseService();

