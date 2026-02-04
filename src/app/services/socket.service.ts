import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SocketService {
    constructor(private socket: Socket) { }

    connect(): void {
        this.socket.connect();
    }

    disconnect(): void {
        this.socket.disconnect();
    }

    joinUserRoom(userId: string): void {
        this.socket.emit('join', userId);
    }

    onBalanceUpdate(): Observable<any> {
        return this.socket.fromEvent('balanceUpdate');
    }

    onNewTransaction(): Observable<any> {
        return this.socket.fromEvent('newTransaction');
    }

    onUserUpdate(): Observable<any> {
        return this.socket.fromEvent('userUpdate');
    }
}