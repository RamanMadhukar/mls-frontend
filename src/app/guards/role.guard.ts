import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const snackBar = inject(MatSnackBar);

    const user = authService.getCurrentUser();
    const expectedRole = route.data['expectedRole'];

    if (!user) {
        router.navigate(['/login']);
        return false;
    }

    if (user.role === expectedRole) {
        return true;
    }

    snackBar.open('Access denied. Insufficient permissions.', 'Close', {
        duration: 3000
    });

    router.navigate(['/dashboard']);
    return false;
};