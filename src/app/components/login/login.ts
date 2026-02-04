import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

// Material imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  captchaImage: string = '';
  sessionId: string = '';
  loading: boolean = false;
  returnUrl: string = '/dashboard';
  captchaLoading: boolean = false;
  hidePassword: boolean = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
      captcha: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';

    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.returnUrl]);
    }

    this.loadCaptcha();
  }

  loadCaptcha(): void {
    this.captchaLoading = true;
    this.authService.getCaptcha().subscribe({
      next: (response) => {
        if (response.success) {
          this.captchaImage = response.captcha;
          this.sessionId = response.sessionId;
        }
        this.captchaLoading = false;
      },
      error: (error) => {
        this.snackBar.open('Error loading CAPTCHA', 'Close', { duration: 3000 });
        this.captchaLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid && !this.loading) {
      this.loading = true;

      const loginData: LoginRequest = {
        username: this.loginForm.value.username,
        password: this.loginForm.value.password,
        captcha: this.loginForm.value.captcha,
        sessionId: this.sessionId
      };

      this.authService.login(loginData).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Login successful!', 'Close', { duration: 3000 });
            this.router.navigate([this.returnUrl]);
          } else {
            this.snackBar.open('Login failed', 'Close', { duration: 3000 });
            this.loadCaptcha();
            this.loginForm.get('captcha')?.reset();
          }
          this.loading = false;
        },
        error: (error) => {
          this.snackBar.open('Login error', 'Close', { duration: 3000 });
          this.loadCaptcha();
          this.loginForm.get('captcha')?.reset();
          this.loading = false;
        }
      });
    }
  }

  refreshCaptcha(): void {
    this.loadCaptcha();
    this.loginForm.get('captcha')?.reset();
  }
}