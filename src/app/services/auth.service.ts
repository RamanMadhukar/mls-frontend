import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // Add HttpHeaders
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

import { User, LoginRequest, LoginResponse, CaptchaResponse } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'http://localhost:3000/api/auth';
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();
    private isBrowser: boolean;

    constructor(
        private http: HttpClient,
        private router: Router,
        @Inject(PLATFORM_ID) platformId: Object
    ) {
        this.isBrowser = isPlatformBrowser(platformId);
        this.loadUserFromStorage();
    }

    private loadUserFromStorage(): void {
        if (this.isBrowser) {
            const user = localStorage.getItem('currentUser');
            if (user) {
                this.currentUserSubject.next(JSON.parse(user));
            }
        }
    }

    getCaptcha(): Observable<CaptchaResponse> {
        return this.http.get<CaptchaResponse>(`${this.apiUrl}/captcha`);
    }

    login(loginData: LoginRequest): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.apiUrl}/login`, loginData, {
            withCredentials: true // 👈 Add this for login
        }).pipe(
            tap(response => {
                if (response.success && response.user) {
                    this.setCurrentUser(response.user);
                }
            })
        );
    }

    register(userData: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/register`, userData, {
            withCredentials: true // 👈 Add this
        });
    }

    logout(): Observable<any> {
        return this.http.post(`${this.apiUrl}/logout`, {}, {
            withCredentials: true // 👈 Add this
        }).pipe(
            tap(() => {
                this.clearCurrentUser();
                this.router.navigate(['/login']);
            })
        );
    }

    refreshToken(): Observable<any> {
        return this.http.post(`${this.apiUrl}/refresh-token`, {}, {
            withCredentials: true // 👈 Add this
        });
    }

    private setCurrentUser(user: User): void {
        if (this.isBrowser) {
            localStorage.setItem('currentUser', JSON.stringify(user));
        }
        this.currentUserSubject.next(user);
    }

    private clearCurrentUser(): void {
        if (this.isBrowser) {
            localStorage.removeItem('currentUser');
        }
        this.currentUserSubject.next(null);
    }

    getCurrentUser(): User | null {
        return this.currentUserSubject.value;
    }

    isAuthenticated(): boolean {
        return !!this.currentUserSubject.value;
    }

    hasRole(role: string): boolean {
        const user = this.currentUserSubject.value;
        return user?.role === role;
    }

    updateUserBalance(newBalance: number): void {
        const user = this.currentUserSubject.value;
        if (user) {
            user.balance = newBalance;
            this.setCurrentUser(user);
        }
    }
}