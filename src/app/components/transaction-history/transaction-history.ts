import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { DatePipe } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription } from 'rxjs';

import { BalanceService } from '../../services/balance.service';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-transaction-history',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatPaginatorModule,
    MatSortModule,
    MatTableModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './transaction-history.html',
  styleUrl: './transaction-history.css'
})
export class TransactionHistoryComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns: string[] = [
    'date',
    'type',
    'sender',
    'receiver',
    'amount',
    'commission',
    'description',
    'balanceBefore',
    'balanceAfter'
  ];

  dataSource = new MatTableDataSource<any>([]);
  loading: boolean = false;
  filterForm: FormGroup;
  totalTransactions: number = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private socketSubscription!: Subscription;

  // Transaction type options
  transactionTypes = [
    { value: '', label: 'All' },
    { value: 'credit', label: 'Credit' },
    { value: 'debit', label: 'Debit' },
    { value: 'commission', label: 'Commission' }
  ];

  constructor(
    private balanceService: BalanceService,
    private fb: FormBuilder,
    private socketService: SocketService,
    private snackBar: MatSnackBar
  ) {
    this.filterForm = this.fb.group({
      type: [''],
      startDate: [''],
      endDate: [''],
      search: ['']
    });
  }

  initializeSocket(): void {
    this.socketService.connect();
  }

  ngOnInit(): void {
    this.loadTransactions();

    this.initializeSocket();

    // Subscribe to real-time transaction updates
    this.socketSubscription = this.socketService.onNewTransaction()
      .subscribe((transaction: any) => {
        this.addNewTransaction(transaction);
      });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Configure custom sorting
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'date': return new Date(item.createdAt);
        case 'sender': return item.sender?.username || '';
        case 'receiver': return item.receiver?.username || '';
        case 'amount': return item.amount;
        case 'type': return item.type;
        default: return (item as any)[property];
      }
    };
  }

  loadTransactions(): void {
    this.loading = true;
    const page = this.paginator?.pageIndex || 0;
    const limit = this.paginator?.pageSize || 10;
    const type = this.filterForm.get('type')?.value;

    this.balanceService.getTransactionHistory(page + 1, limit, type)
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.dataSource.data = response.transactions || [];
            this.totalTransactions = response.pagination?.total || 0;

            // Apply date filters if set
            this.applyDateFilters();

            // Apply search filter if set
            this.applySearchFilter();
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading transactions:', error);
          this.snackBar.open('Error loading transactions', 'Close', {
            duration: 3000
          });
          this.loading = false;
        }
      });
  }

  applyDateFilters(): void {
    const startDate = this.filterForm.get('startDate')?.value;
    const endDate = this.filterForm.get('endDate')?.value;

    if (startDate || endDate) {
      const filteredData = this.dataSource.data.filter(transaction => {
        const transactionDate = new Date(transaction.createdAt);
        let match = true;

        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          match = match && transactionDate >= start;
        }

        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          match = match && transactionDate <= end;
        }

        return match;
      });

      this.dataSource.data = filteredData;
    }
  }

  applySearchFilter(): void {
    const searchTerm = this.filterForm.get('search')?.value?.toLowerCase();

    if (searchTerm) {
      this.dataSource.data = this.dataSource.data.filter(transaction => {
        return (
          transaction.description?.toLowerCase().includes(searchTerm) ||
          transaction.sender?.username?.toLowerCase().includes(searchTerm) ||
          transaction.receiver?.username?.toLowerCase().includes(searchTerm) ||
          transaction.type?.toLowerCase().includes(searchTerm)
        );
      });
    }
  }

  onFilter(): void {
    this.loadTransactions();
  }

  onReset(): void {
    this.filterForm.reset({
      type: '',
      startDate: '',
      endDate: '',
      search: ''
    });
    this.loadTransactions();
  }

  addNewTransaction(transaction: any): void {
    // Add new transaction to the beginning of the list
    const currentData = this.dataSource.data;
    currentData.unshift(transaction);
    this.dataSource.data = [...currentData];

    // Update total count
    this.totalTransactions++;

    // Show notification
    this.snackBar.open(`New ${transaction.type} transaction received`, 'Close', {
      duration: 3000
    });
  }

  formatDate(date: string): string {
    // Use native JavaScript instead of DatePipe
    if (!date) return '';

    const dateObj = new Date(date);

    // Check if date is valid
    if (isNaN(dateObj.getTime())) return '';

    // Format: dd/MM/yyyy HH:mm
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  getTransactionColor(type: string): string {
    switch (type) {
      case 'credit': return 'text-green-600';
      case 'debit': return 'text-red-600';
      case 'commission': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  }

  getTransactionIcon(type: string): string {
    switch (type) {
      case 'credit': return 'arrow_downward';
      case 'debit': return 'arrow_upward';
      case 'commission': return 'account_balance_wallet';
      default: return 'payment';
    }
  }

  formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  exportToCSV(): void {
    const transactions = this.dataSource.data;
    const csvRows = [];

    // Add headers
    const headers = [
      'Date',
      'Type',
      'Sender',
      'Receiver',
      'Amount',
      'Commission',
      'Description',
      'Balance Before',
      'Balance After'
    ];
    csvRows.push(headers.join(','));

    // Add data rows
    transactions.forEach(transaction => {
      const row = [
        this.formatDate(transaction.createdAt),
        transaction.type,
        transaction.sender?.username || 'N/A',
        transaction.receiver?.username || 'N/A',
        transaction.amount,
        transaction.commission?.amount || 0,
        transaction.description || '',
        transaction.balanceBefore,
        transaction.balanceAfter
      ];
      csvRows.push(row.join(','));
    });

    // Create CSV blob
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  onPageChange(event: any): void {
    this.loadTransactions();
  }

  ngOnDestroy(): void {
    if (this.socketSubscription) {
      this.socketSubscription.unsubscribe();
    }
  }
}