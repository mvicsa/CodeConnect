import axios, { AxiosError } from 'axios';
import { 
  Block, 
  BlockStatus, 
  BlockStats, 
  BlockUser, 
  CreateBlockRequest, 
  UpdateBlockRequest,
  BlockResponse 
} from '@/types/block';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

class BlockService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  // Block a user
  async blockUser(blockedId: string, reason?: string): Promise<Block> {
    const data: CreateBlockRequest = { blockedId, reason };
    return this.request<Block>(`${API_URL}/blocks`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Unblock a user
  async unblockUser(blockedId: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`${API_URL}/blocks/${blockedId}`, {
      method: 'DELETE'
    });
  }

  // Update block
  async updateBlock(blockedId: string, data: UpdateBlockRequest): Promise<Block> {
    return this.request<Block>(`${API_URL}/blocks/${blockedId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Get blocked users
  async getBlockedUsers(): Promise<BlockUser[]> {
    return this.request<BlockUser[]>(`${API_URL}/blocks/blocked`);
  }

  // Get users who blocked you
  async getBlockedByUsers(): Promise<BlockUser[]> {
    const result = await this.request<BlockUser[]>(`${API_URL}/blocks/blocked-by`);
    return result;
  }

  // Check block relationship
  async checkBlockRelationship(userId: string): Promise<BlockStatus> {
    return this.request<BlockStatus>(`${API_URL}/blocks/check/${userId}`);
  }

  // Get block statistics
  async getBlockStats(): Promise<BlockStats> {
    return this.request<BlockStats>(`${API_URL}/blocks/stats`);
  }

  // Check if user is blocked
  async isBlocked(userId: string): Promise<boolean> {
    return this.request<boolean>(`${API_URL}/blocks/is-blocked/${userId}`);
  }

  // Check if user is blocked by
  async isBlockedBy(userId: string): Promise<boolean> {
    return this.request<boolean>(`${API_URL}/blocks/is-blocked-by/${userId}`);
  }
}

export const blockService = new BlockService(); 