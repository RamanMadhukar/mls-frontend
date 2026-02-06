import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Transaction, TransactionResponse, CreditBalanceRequest, BalanceSummary } from '../models/transaction.model';

@Injectable({
    providedIn: 'root'
})
export class BalanceService {
    private apiUrl = 'http://localhost:3000/api/balance';

    constructor(private http: HttpClient) { }

    creditBalance(request: CreditBalanceRequest): Observable<any> {
        return this.http.post(`${this.apiUrl}/credit`, request, {
            withCredentials: true // 👈 Add this
        });
    }

    selfRecharge(amount: number): Observable<any> {
        return this.http.post(`${this.apiUrl}/recharge`, { amount }, {
            withCredentials: true // 👈 Add this
        });
    }

    getTransactionHistory(page: number = 1, limit: number = 10, type?: string): Observable<TransactionResponse> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());

        if (type) {
            params = params.set('type', type);
        }

        return this.http.get<TransactionResponse>(`${this.apiUrl}/transactions`, {
            params,
            withCredentials: true // 👈 Add this
        });
    }

    getBalanceSummary(): Observable<{ success: boolean; summary: BalanceSummary }> {
        return this.http.get<{ success: boolean; summary: BalanceSummary }>(`${this.apiUrl}/summary`, {
            withCredentials: true // 👈 Add this
        });
    }
}