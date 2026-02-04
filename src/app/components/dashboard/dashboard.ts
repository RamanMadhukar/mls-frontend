import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { Subscription } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { SocketService } from '../../services/socket.service';
import { BalanceService } from '../../services/balance.service';
import { Transaction } from '../../models/transaction.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatToolbarModule,
    MatMenuModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  user: User | null = null;
  balance: number = 0;
  recentTransactions: Transaction[] = [];
  loading: boolean = true;

  // Quick stats
  totalDownline: number = 0;
  commissionEarned: number = 0;
  todayTransactions: number = 0;

  private socketSubscription!: Subscription;

  constructor(
    public authService: AuthService,
    private balanceService: BalanceService,
    private socketService: SocketService,
    private router: Router,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();

    if (!this.user) {
      this.router.navigate(['/login']);
      return;
    }

    this.balance = this.user.balance || 0;
    this.commissionEarned = this.user.commissionEarned || 0;

    // Load dashboard data
    this.loadDashboardData();

    // Subscribe to real-time updates
    this.setupSocketListeners();
  }

  loadDashboardData(): void {
    this.loading = true;

    // Load recent transactions
    this.balanceService.getTransactionHistory(1, 5)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.recentTransactions = response.transactions || [];
            this.calculateTodayTransactions();
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading dashboard data:', error);
          this.snackBar.open('Error loading dashboard data', 'Close', {
            duration: 3000
          });
          this.loading = false;
        }
      });

    // For now, simulate downline count
    this.totalDownline = Math.floor(Math.random() * 50) + 10;
  }

  calculateTodayTransactions(): void {
    const today = new Date().toDateString();
    this.todayTransactions = this.recentTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.createdAt).toDateString();
      return transactionDate === today;
    }).length;
  }

  setupSocketListeners(): void {
    // Listen for balance updates
    this.socketSubscription = this.socketService.onBalanceUpdate()
      .subscribe((update: any) => {
        if (update.userId === this.user?.id ||
          update.senderId === this.user?.id ||
          update.receiverId === this.user?.id) {
          // Refresh dashboard data
          this.loadDashboardData();

          // Update user balance if needed
          if (this.user && update.newBalance !== undefined) {
            this.user.balance = update.newBalance;
            this.balance = update.newBalance;
            this.authService.updateUserBalance(update.newBalance);
          }
        }
      });

    // Listen for new transactions
    this.socketService.onNewTransaction()
      .subscribe((transaction: any) => {
        if (transaction.sender?._id === this.user?.id ||
          transaction.receiver?._id === this.user?.id) {
          // Add to recent transactions
          this.recentTransactions.unshift(transaction);
          if (this.recentTransactions.length > 5) {
            this.recentTransactions.pop();
          }
          this.calculateTodayTransactions();
        }
      });
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }

  getRoleBadgeColor(): string {
    switch (this.user?.role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'owner': return 'bg-purple-100 text-purple-800';
      case 'user': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getRoleIcon(): string {
    switch (this.user?.role) {
      case 'admin': return 'admin_panel_settings';
      case 'owner': return 'business';
      case 'user': return 'person';
      default: return 'help';
    }
  }

  formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  ngOnDestroy(): void {
    if (this.socketSubscription) {
      this.socketSubscription.unsubscribe();
    }
  }
}