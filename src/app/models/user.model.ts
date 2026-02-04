export interface User {
    _id?: string;
    id?: string;
    username: string;
    email: string;
    role: 'admin' | 'owner' | 'user';
    level: number;
    balance: number;
    commissionEarned: number;
    parentId?: string;
    path?: string;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface LoginRequest {
    username: string;
    password: string;
    captcha: string;
    sessionId: string;
}

export interface LoginResponse {
    success: boolean;
    user: User;
    message?: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    role?: string;
}

export interface CaptchaResponse {
    success: boolean;
    sessionId: string;
    captcha: string;
}