import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { BalanceService } from '../../services/balance.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-balance-transfer',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatSliderModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './balance-transfer.html',
  styleUrl: './balance-transfer.css'
})
export class BalanceTransferComponent implements OnInit {
  transferForm: FormGroup;
  downlineUsers: User[] = [];
  loading: boolean = false;
  userBalance: number = 0;
  currentUser: User | null = null;
  commissionPercentage: number = 5;
  estimatedCommission: number = 0;
  estimatedNetAmount: number = 0;

  constructor(
    private fb: FormBuilder,
    private balanceService: BalanceService,
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.currentUser = this.authService.getCurrentUser();
    this.userBalance = this.currentUser?.balance || 0;

    // Custom validator for amount
    const amountValidator = (control: AbstractControl): ValidationErrors | null => {
      const amount = control.value;
      if (amount && amount > this.userBalance) {
        return { insufficientBalance: true };
      }
      if (amount && amount <= 0) {
        return { minAmount: true };
      }
      return null;
    };

    this.transferForm = this.fb.group({
      receiverId: ['', [Validators.required]],
      amount: ['', [Validators.required, Validators.min(1), amountValidator]],
      commissionPercentage: [5, [Validators.min(0), Validators.max(50)]],
      description: ['Balance transfer', [Validators.maxLength(200)]]
    });
  }

  ngOnInit(): void {
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadDownlineUsers();

    // Listen for form changes to calculate estimates
    this.transferForm.get('amount')?.valueChanges.subscribe(() => this.calculateEstimates());
    this.transferForm.get('commissionPercentage')?.valueChanges.subscribe(() => this.calculateEstimates());
  }

  loadDownlineUsers(): void {
    this.userService.getDownline().subscribe({
      next: (response) => {
        if (response.success) {
          this.extractImmediateDownline(response.downline || []);
        }
      },
      error: (error) => {
        console.error('Error loading downline:', error);
        this.snackBar.open('Error loading downline users', 'Close', {
          duration: 3000
        });
      }
    });
  }

  extractImmediateDownline(downline: any[]): void {
    const immediateDownline: User[] = [];

    const extract = (nodes: any[]) => {
      nodes.forEach(item => {
        // Check if this user is immediate downline (parent is current user)
        if (item.user.parentId === this.currentUser?.id) {
          immediateDownline.push(item.user);
        }
        // Recursively check children
        if (item.children && item.children.length > 0) {
          extract(item.children);
        }
      });
    };

    extract(downline);
    this.downlineUsers = immediateDownline;
  }

  calculateEstimates(): void {
    const amount = this.transferForm.get('amount')?.value || 0;
    const commissionPercent = this.transferForm.get('commissionPercentage')?.value || 0;

    this.estimatedCommission = amount * (commissionPercent / 100);
    this.estimatedNetAmount = amount - this.estimatedCommission;
  }

  onSubmit(): void {
    if (this.transferForm.valid && !this.loading) {
      this.loading = true;

      const transferData: any = {
        receiverId: this.transferForm.value.receiverId,
        amount: this.transferForm.value.amount,
        commissionPercentage: this.transferForm.value.commissionPercentage
      };

      this.balanceService.creditBalance(transferData).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Transfer successful!', 'Close', {
              duration: 3000
            });

            // Update user balance
            const newBalance = this.userBalance - transferData.amount;
            this.authService.updateUserBalance(newBalance);
            this.userBalance = newBalance;

            // Reset form
            this.transferForm.reset({
              receiverId: '',
              amount: '',
              commissionPercentage: 5,
              description: 'Balance transfer'
            });

            // Reset estimates
            this.estimatedCommission = 0;
            this.estimatedNetAmount = 0;

            // Navigate to transaction history
            setTimeout(() => {
              this.router.navigate(['/transactions']);
            }, 1500);
          } else {
            this.snackBar.open(response.message || 'Transfer failed', 'Close', {
              duration: 3000
            });
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Transfer error:', error);
          let errorMessage = 'Transfer failed';

          if (error.status === 400) {
            errorMessage = error.error?.message || 'Invalid transfer request';
          } else if (error.status === 403) {
            errorMessage = 'You are not authorized to transfer to this user';
          } else if (error.status === 422) {
            errorMessage = 'Insufficient balance';
          }

          this.snackBar.open(errorMessage, 'Close', {
            duration: 3000
          });
          this.loading = false;
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/dashboard']);
  }

  formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  getMaxAmount(): number {
    return Math.min(this.userBalance, 100000);
  }

  getSelectedUser(): User | undefined {
    const receiverId = this.transferForm.get('receiverId')?.value;
    return this.downlineUsers.find(user => user.id === receiverId);
  }
}