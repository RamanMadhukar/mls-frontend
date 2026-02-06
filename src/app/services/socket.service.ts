import { Injectable, OnDestroy } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class SocketService implements OnDestroy {
    private destroy$ = new Subject<void>();
    private isConnected = false;

    constructor(private socket: Socket) {
        // Socket is already initialized via DI
    }

    connect(): void {
        if (!this.isConnected) {
            this.socket.connect();
            this.isConnected = true;
        }
    }

    disconnect(): void {
        if (this.isConnected) {
            this.socket.disconnect();
            this.isConnected = false;
        }
    }

    joinUserRoom(userId: string): void {
        this.socket.emit('join', userId);
    }

    onBalanceUpdate(): Observable<any> {
        return new Observable(observer => {
            this.socket.fromEvent('balanceUpdate')
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (data) => observer.next(data),
                    error: (err) => observer.error(err)
                });
        });
    }

    onNewTransaction(): Observable<any> {
        return new Observable(observer => {
            this.socket.fromEvent('newTransaction')
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (data) => observer.next(data),
                    error: (err) => observer.error(err)
                });
        });
    }

    onUserUpdate(): Observable<any> {
        return new Observable(observer => {
            this.socket.fromEvent('userUpdate')
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (data) => observer.next(data),
                    error: (err) => observer.error(err)
                });
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.disconnect();
    }
}