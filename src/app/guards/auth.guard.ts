import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const snackBar = inject(MatSnackBar);

    if (authService.isAuthenticated()) {
        return true;
    }

    snackBar.open('Please login to access this page', 'Close', {
        duration: 3000
    });

    router.navigate(['/login'], {
        queryParams: { returnUrl: state.url }
    });

    return false;
};