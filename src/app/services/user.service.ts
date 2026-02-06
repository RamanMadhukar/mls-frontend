import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { User } from '../models/user.model';

export interface DownlineUser {
    user: User;
    children: DownlineUser[];
}

export interface UserHierarchyResponse {
    success: boolean;
    downline: DownlineUser[];
    count: number;
}

export interface CreateUserRequest {
    username: string;
    email: string;
    password: string;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = 'http://localhost:3000/api/users';

    constructor(private http: HttpClient) { }

    getDownline(): Observable<UserHierarchyResponse> {
        return this.http.get<UserHierarchyResponse>(`${this.apiUrl}/downline`, {
            withCredentials: true // 👈 Add this
        });
    }

    createNextLevelUser(userData: CreateUserRequest): Observable<any> {
        return this.http.post(`${this.apiUrl}/create-user`, userData, {
            withCredentials: true // 👈 Add this
        });
    }

    changePassword(userId: string, newPassword: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/change-password`, { userId, newPassword }, {
            withCredentials: true // 👈 Add this
        });
    }

    getAllUsers(): Observable<{ success: boolean; users: User[] }> {
        return this.http.get<{ success: boolean; users: User[] }>(`${this.apiUrl}/all`, {
            withCredentials: true // 👈 Add this
        });
    }

    getImmediateDownline(): Observable<User[]> {
        return this.http.get<User[]>(`${this.apiUrl}/immediate-downline`, {
            withCredentials: true // 👈 Add this
        });
    }
}