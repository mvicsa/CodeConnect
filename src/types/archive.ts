import { UserReaction } from "@/store/slices/reactionsSlice";

export interface TestCase {
    input: string;
    output: string;
    explanation?: string;
}

export interface User {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    avatar: string;
    role: string;
    name?: string;
}

export interface Comment {
    _id: string;
    text: string;
    code: string;
    codeLang: string;
    createdBy: User;
    postId: string;
    reactions: {
        like: number;
        love: number;
        wow: number;
        funny: number;
        dislike: number;
        happy: number;
    };
    hasAiEvaluation: boolean;
    aiComment?: {
        _id: string;
        postId: string;
        commentId: string;
        evaluation: string;
        createdAt: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface ArchiveItem {
    _id: string;
    text: string;
    code: string;
    codeLang: string;
    createdBy: User;
    tags: string[];
    reactions: {
        like: number;
        love: number;
        wow: number;
        happy: number;
        funny: number;
        dislike: number;
    };
    userReactions:  UserReaction[];
    image: string;
    video: string;
    hasAiSuggestions: boolean;
    createdAt: string;
    updatedAt: string;
    comments: Comment[];
}