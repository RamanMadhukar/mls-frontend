import { Component, OnInit, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogRef } from '@angular/material/dialog';

import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-create-user',
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
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './create-user.html',
  styleUrl: './create-user.css'
})
export class CreateUserComponent implements OnInit {
  createUserForm: FormGroup;
  loading: boolean = false;
  hidePassword: boolean = true;
  hideConfirmPassword: boolean = true;
  currentUser: User | null = null;
  isDialog: boolean = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router,
    @Optional() private dialogRef?: MatDialogRef<CreateUserComponent>
  ) {
    this.currentUser = this.authService.getCurrentUser();
    this.isDialog = !!dialogRef;

    // Custom validator for password confirmation
    const passwordMatchValidator = (group: AbstractControl): ValidationErrors | null => {
      const password = group.get('password')?.value;
      const confirmPassword = group.get('confirmPassword')?.value;
      return password === confirmPassword ? null : { passwordMismatch: true };
    };

    this.createUserForm = this.fb.group({
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(20),
        Validators.pattern('^[a-zA-Z0-9_]+$')
      ]],
      email: ['', [
        Validators.required,
        Validators.email
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(30)
      ]],
      confirmPassword: ['', [
        Validators.required
      ]]
    }, { validators: passwordMatchValidator });
  }

  ngOnInit(): void {
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }
  }

  getPasswordStrength(password: string): { score: number, message: string, color: string } {
    let score = 0;
    let message = '';
    let color = '';

    // Length check
    if (password.length >= 8) score += 1;

    // Contains lowercase
    if (/[a-z]/.test(password)) score += 1;

    // Contains uppercase
    if (/[A-Z]/.test(password)) score += 1;

    // Contains number
    if (/[0-9]/.test(password)) score += 1;

    // Contains special character
    if (/[@$!%*?&]/.test(password)) score += 1;

    switch (score) {
      case 0:
      case 1:
        message = 'Very Weak';
        color = 'text-red-600';
        break;
      case 2:
        message = 'Weak';
        color = 'text-orange-600';
        break;
      case 3:
        message = 'Fair';
        color = 'text-yellow-600';
        break;
      case 4:
        message = 'Good';
        color = 'text-blue-600';
        break;
      case 5:
        message = 'Strong';
        color = 'text-green-600';
        break;
    }

    return { score, message, color };
  }

  onSubmit(): void {
    if (this.createUserForm.valid && !this.loading) {
      this.loading = true;

      const { username, email, password } = this.createUserForm.value;
      const userData = { username, email, password };

      this.userService.createNextLevelUser(userData)
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.snackBar.open('User created successfully!', 'Close', {
                duration: 3000
              });

              // Reset form
              this.createUserForm.reset();

              // Close dialog if opened as dialog
              if (this.isDialog && this.dialogRef) {
                this.dialogRef.close(response.user);
              }

              // Navigate to user hierarchy if not dialog
              if (!this.isDialog) {
                this.router.navigate(['/users/hierarchy']);
              }
            } else {
              this.snackBar.open(response.message || 'Failed to create user', 'Close', {
                duration: 3000
              });
            }
            this.loading = false;
          },
          error: (error) => {
            console.error('Error creating user:', error);
            let errorMessage = 'Error creating user';

            if (error.error?.message) {
              errorMessage = error.error.message;
            } else if (error.status === 400) {
              errorMessage = 'User already exists';
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
    if (this.isDialog && this.dialogRef) {
      this.dialogRef.close();
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  getPasswordStrengthInfo(): string {
    const password = this.createUserForm.get('password')?.value || '';
    const strength = this.getPasswordStrength(password);

    if (password.length === 0) return '';
    return `Password Strength: ${strength.message}`;
  }

  getPasswordRequirements(): string[] {
    const password = this.createUserForm.get('password')?.value || '';

    return [
      password.length >= 8 ? '✓ At least 8 characters' : '✗ At least 8 characters',
      /[a-z]/.test(password) ? '✓ Contains lowercase letter' : '✗ Contains lowercase letter',
      /[A-Z]/.test(password) ? '✓ Contains uppercase letter' : '✗ Contains uppercase letter',
      /[0-9]/.test(password) ? '✓ Contains number' : '✗ Contains number',
      /[@$!%*?&]/.test(password) ? '✓ Contains special character (@$!%*?&)' : '✗ Contains special character (@$!%*?&)'
    ];
  }
}