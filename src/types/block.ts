import { User } from "./user";

export interface Block {
  _id: string;
  blockerId: string;
  blockedId: string;
  reason?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BlockStatus {
  isBlocked: boolean;
  isBlockedBy: boolean;
  block?: Block;
}

export interface BlockStats {
  blockedCount: number;
  blockedByCount: number;
  totalBlocks: number;
}

export interface BlockUser {
  _id: string;
  name?: string;
  username?: string;
  avatar?: string;
  block?: Block;
  blockedId?: User;
  blockerId?: User;
  reason?: string;
  createdAt?: string;
}

export interface BlockResponse {
  success: boolean;
  message: string;
  data?: Block | Block[] | BlockStats | BlockStatus;
}

export interface CreateBlockRequest {
  blockedId: string;
  reason?: string;
}

export interface UpdateBlockRequest {
  reason?: string;
  isActive?: boolean;
} 