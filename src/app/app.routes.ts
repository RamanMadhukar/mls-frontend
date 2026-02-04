import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./components/login/login').then(m => m.LoginComponent)
    },
    {
        path: 'dashboard',
        loadComponent: () => import('./components/dashboard/dashboard').then(m => m.DashboardComponent),
        canActivate: [authGuard]
    },
    {
        path: 'users/hierarchy',
        loadComponent: () => import('./components/user-hierarchy/user-hierarchy').then(m => m.UserHierarchyComponent),
        canActivate: [authGuard]
    },
    {
        path: 'balance/transfer',
        loadComponent: () => import('./components/balance-transfer/balance-transfer').then(m => m.BalanceTransferComponent),
        canActivate: [authGuard]
    },
    {
        path: 'transactions',
        loadComponent: () => import('./components/transaction-history/transaction-history').then(m => m.TransactionHistoryComponent),
        canActivate: [authGuard]
    },
    {
        path: 'users/create',
        loadComponent: () => import('./components/create-user/create-user').then(m => m.CreateUserComponent),
        canActivate: [authGuard]
    },
    {
        path: 'admin/users',
        loadComponent: () => import('./components/user-hierarchy/user-hierarchy').then(m => m.UserHierarchyComponent),
        canActivate: [authGuard, roleGuard],
        data: { expectedRole: 'admin' }
    },
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    { path: '**', redirectTo: '/dashboard' }
];