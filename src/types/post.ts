import type { User } from './user';

export interface UserReaction {
  userId: User; // now a populated user object!
  username: string;
  reaction: string;
  createdAt: string;
}

export interface Reactions {
  like: number;
  love: number;
  wow: number;
  funny: number;
  dislike: number;
  happy: number;
}

export interface CreatedBy {
  _id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  avatar?: string;
}

export interface PostType {
  _id: string;
  text: string;
  code?: string;
  codeLang?: string;
  video?: string;
  image?: string;
  tags?: string[];
  createdBy: CreatedBy;
  createdAt: string;
  updatedAt: string;
  reactions: Reactions;
  userReactions: UserReaction[];
}