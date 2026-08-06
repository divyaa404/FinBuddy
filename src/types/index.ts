export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  note?: string;
}

export interface Budget {
  category: string;
  limit: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
}

export interface SplitItem {
  id: string;
  name: string;
  price: number;
}

export interface Split {
  id: string;
  ownerId: string;
  ownerName: string;
  totalAmount: number;
  gstPercent: number;
  mode: 'even' | 'itemized';
  items?: SplitItem[];
  participantCount?: number;
  createdAt: any; // Firestore timestamp
  status: 'collecting' | 'finalized';
}

export interface Participant {
  id: string;
  name: string;
  selectedItemIds: string[];
  hasPaid: boolean;
  amountOwed: number;
}
