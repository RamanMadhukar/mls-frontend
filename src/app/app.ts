import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

// Material imports
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';

import { AuthService } from './services/auth.service';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatToolbarModule,
        MatIconModule,
        MatButtonModule,
        MatMenuModule
    ],
    templateUrl: './app.html',
    styleUrl: './app.css'
})
export class App implements OnInit {
    title = 'MLM System';
    showHeader = false;

    constructor(
        private router: Router,
        public authService: AuthService
    ) { }

    ngOnInit(): void {
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe((event: any) => {
            this.showHeader = event.url !== '/login' && this.authService.isAuthenticated();
        });
    }

    logout(): void {
        this.authService.logout().subscribe();
    }

    getRoleBadgeColor(role?: string): string {
        switch (role) {
            case 'admin': return 'bg-red-100 text-red-800';
            case 'owner': return 'bg-purple-100 text-purple-800';
            case 'user': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }
}