import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTreeModule, MatTreeNestedDataSource } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NestedTreeControl } from '@angular/cdk/tree';

import { UserService, DownlineUser } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

interface HierarchyNode {
  user: User;
  children?: HierarchyNode[];
}

@Component({
  selector: 'app-user-hierarchy',
  standalone: true,
  imports: [
    CommonModule,
    MatTreeModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './user-hierarchy.html',
  styleUrl: './user-hierarchy.css'
})
export class UserHierarchyComponent implements OnInit {
  treeControl = new NestedTreeControl<HierarchyNode>(node => node.children);
  dataSource = new MatTreeNestedDataSource<HierarchyNode>();
  loading: boolean = false;
  currentUser: User | null = null;
  totalUsers: number = 0;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadHierarchy();
  }

  loadHierarchy(): void {
    this.loading = true;
    this.userService.getDownline().subscribe({
      next: (response) => {
        if (response.success) {
          this.dataSource.data = this.convertToTreeNodes(response.downline || []);
          this.totalUsers = response.count || 0;
        } else {
          this.snackBar.open('Failed to load hierarchy', 'Close', {
            duration: 3000
          });
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading hierarchy:', error);
        this.snackBar.open('Error loading hierarchy', 'Close', {
          duration: 3000
        });
        this.loading = false;
      }
    });
  }

  convertToTreeNodes(downline: DownlineUser[]): HierarchyNode[] {
    // First, create a map of users by their ID
    const userMap = new Map<string, HierarchyNode>();

    downline.forEach(item => {
      userMap.set(item.user._id || '', {
        user: item.user,
        children: []
      });
    });

    // Build the tree structure
    const rootNodes: HierarchyNode[] = [];

    downline.forEach(item => {
      const node = userMap.get(item.user._id || '')!;

      if (!item.user.parentId || item.user.parentId === this.currentUser?.id) {
        // This is a direct child of current user
        rootNodes.push(node);
      } else {
        // Find parent and add as child
        const parentNode = userMap.get(item.user.parentId);
        if (parentNode) {
          if (!parentNode.children) {
            parentNode.children = [];
          }
          parentNode.children.push(node);
        }
      }
    });

    return rootNodes;
  }

  hasChild = (_: number, node: HierarchyNode) =>
    !!node.children && node.children.length > 0;

  getLevelColor(level: number): string {
    const colors = [
      'bg-blue-100 text-blue-800',    // Level 0
      'bg-green-100 text-green-800',  // Level 1
      'bg-yellow-100 text-yellow-800',// Level 2
      'bg-purple-100 text-purple-800',// Level 3
      'bg-pink-100 text-pink-800',    // Level 4
      'bg-indigo-100 text-indigo-800',// Level 5
      'bg-red-100 text-red-800',      // Level 6
      'bg-gray-100 text-gray-800',    // Level 7+
    ];
    return colors[level] || colors[colors.length - 1];
  }

  getRoleIcon(role: string): string {
    switch (role) {
      case 'admin': return 'admin_panel_settings';
      case 'owner': return 'business';
      case 'user': return 'person';
      default: return 'help';
    }
  }

  getRoleColor(role: string): string {
    switch (role) {
      case 'admin': return 'text-red-600';
      case 'owner': return 'text-purple-600';
      case 'user': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  }

  getBalanceColor(balance: number): string {
    if (balance > 10000) return 'text-green-600 font-bold';
    if (balance > 1000) return 'text-green-500';
    if (balance > 100) return 'text-blue-500';
    return 'text-gray-500';
  }

  formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  toggleNode(node: HierarchyNode): void {
    if (this.treeControl.isExpanded(node)) {
      this.treeControl.collapse(node);
    } else {
      this.treeControl.expand(node);
    }
  }

  expandAll(): void {
    this.treeControl.expandAll();
  }

  collapseAll(): void {
    this.treeControl.collapseAll();
  }

  refresh(): void {
    this.loadHierarchy();
  }

  calculateTotalBalance(): number {
    let total = 0;
    const calculate = (nodes: HierarchyNode[]) => {
      nodes.forEach(node => {
        total += node.user.balance || 0;
        if (node.children) {
          calculate(node.children);
        }
      });
    };
    calculate(this.dataSource.data);
    return total;
  }

  calculateTotalCommission(): number {
    let total = 0;
    const calculate = (nodes: HierarchyNode[]) => {
      nodes.forEach(node => {
        total += node.user.commissionEarned || 0;
        if (node.children) {
          calculate(node.children);
        }
      });
    };
    calculate(this.dataSource.data);
    return total;
  }

  getActiveUsers(): number {
    let count = 0;
    const countActive = (nodes: HierarchyNode[]) => {
      nodes.forEach(node => {
        if (node.user.isActive) {
          count++;
        }
        if (node.children) {
          countActive(node.children);
        }
      });
    };
    countActive(this.dataSource.data);
    return count;
  }

  getInactiveUsers(): number {
    return this.totalUsers - this.getActiveUsers();
  }
}