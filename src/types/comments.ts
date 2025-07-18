import type { User as UserType } from './user'

export type User = {
  _id: string
  firstName: string
  lastName: string
  avatar: string
  username: string
  email: string
  createdAt: Date | string
  updatedAt: Date | string
}

export type UserReaction = {
  userId: UserType
  username: string
  reaction: string
  createdAt: string
}

export type Reactions = {
  like: number
  love: number
  wow: number
  funny: number
  dislike: number
  happy: number
}

export type Reply = {
  _id: string
  parentCommentId: string
  createdBy: User
  text?: string
  code?: string
  codeLang?: string
  createdAt: Date | string
  postId: string
  reactions: Reactions
  userReactions: UserReaction[]
}

export type Comment = {
  _id: string
  createdBy: User
  text?: string
  code?: string
  codeLang?: string
  parentCommentId?: string
  createdAt: Date | string
  postId: string
  reactions: Reactions
  userReactions: UserReaction[]
  replies: Reply[]
}
  