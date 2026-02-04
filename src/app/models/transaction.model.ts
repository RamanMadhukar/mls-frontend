export interface Commission {
    amount: number;
    percentage: number;
}

export interface Transaction {
    _id: string;
    sender: {
        _id: string;
        username: string;
        email: string;
    };
    receiver: {
        _id: string;
        username: string;
        email: string;
    };
    amount: number;
    type: 'credit' | 'debit' | 'commission';
    description: string;
    commission?: Commission;
    balanceBefore: number;
    balanceAfter: number;
    createdAt: string;
    updatedAt?: string;
}

export interface TransactionResponse {
    success: boolean;
    transactions: Transaction[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export interface CreditBalanceRequest {
    receiverId: string;
    amount: number;
    commissionPercentage?: number;
}

export interface BalanceSummary {
    totalBalance: number;
    totalCommission: number;
    userCount: number;
    averageBalance: number;
}