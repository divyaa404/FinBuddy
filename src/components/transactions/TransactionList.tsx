import React, { useState } from 'react';
import type { Transaction } from '../../types';
import { Card } from '../ui/Card';
import Lottie from 'lottie-react';
import nothingHereAnim from '../../assets/animations/nothing_here_animation.json';

const LottiePlayer = (Lottie as any).default || Lottie;

interface TransactionListProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (tx: Transaction) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onDeleteTransaction,
  onEditTransaction
}) => {
  const [filterCategory, setFilterCategory] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Get unique categories for dropdown filter
  const categories = ['All', ...Array.from(new Set(transactions.map(tx => tx.category)))];

  // Filtering logic
  const filteredTransactions = transactions.filter(tx => {
    // 1. Category Filter
    if (filterCategory !== 'All' && tx.category !== filterCategory) {
      return false;
    }
    // 2. Start Date Filter
    if (startDate && new Date(tx.date) < new Date(startDate)) {
      return false;
    }
    // 3. End Date Filter
    if (endDate && new Date(tx.date) > new Date(endDate)) {
      return false;
    }
    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // sort newest first

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Food': return 'restaurant';
      case 'Transport': return 'directions_car';
      case 'Subscriptions': return 'subscriptions';
      case 'Shopping': return 'shopping_bag';
      case 'Entertainment': return 'local_play';
      case 'Income': return 'payments';
      default: return 'credit_card';
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Food': return 'bg-neon-green/10 text-neon-green border border-neon-green/20';
      case 'Transport': return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
      case 'Subscriptions': return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'Shopping': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'Entertainment': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'Income': return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20';
      default: return 'bg-white/5 text-white/70 border border-white/10';
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      
      {/* Search & Filter bar (White background, sit at level 0) */}
      <Card variant="light" className="p-4 rounded-xl flex flex-wrap gap-4 items-center justify-between">
        
        {/* Category Filter */}
        <div className="flex flex-col gap-1 text-left min-w-[140px]">
          <span className="font-hanken text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">Filter Category</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs bg-surface-container border border-outline-variant text-on-surface outline-none"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Date Ranges */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex flex-col gap-1 text-left">
            <span className="font-hanken text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">Start Date</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs bg-surface-container border border-outline-variant text-on-surface outline-none"
            />
          </div>
          <div className="flex flex-col gap-1 text-left">
            <span className="font-hanken text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">End Date</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs bg-surface-container border border-outline-variant text-on-surface outline-none"
            />
          </div>
        </div>

        {/* Clear Filters Button */}
        {(filterCategory !== 'All' || startDate || endDate) && (
          <button
            onClick={() => {
              setFilterCategory('All');
              setStartDate('');
              setEndDate('');
            }}
            className="text-xs font-semibold text-primary hover:underline self-end py-2"
          >
            Clear Filters
          </button>
        )}
      </Card>

      {/* Transaction List Card (Obsidian vessel context) */}
      <Card variant="vessel" className="p-5 rounded-2xl flex flex-col gap-4 border border-white/[0.08]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-hanken text-sm font-semibold uppercase tracking-wider text-white">Ledger Logs</h3>
          <span className="text-[10px] text-white/50">{filteredTransactions.length} logs found</span>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center text-white/40">
            <div className="w-32 h-32">
              <LottiePlayer animationData={nothingHereAnim} loop={true} />
            </div>
            <p className="text-xs font-semibold mt-2 text-white/50">No transaction records found</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">
            {filteredTransactions.map(tx => (
              <div 
                key={tx.id}
                className="flex justify-between items-center bg-[#1b1c1c] hover:bg-white/[0.04] p-3 rounded-xl border border-white/5 transition-all duration-200"
              >
                
                {/* Info Block */}
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${getCategoryBadgeClass(tx.category)}`}>
                    <span className="material-symbols-outlined text-base">
                      {getCategoryIcon(tx.category)}
                    </span>
                  </div>
                  
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-semibold text-white">
                      {tx.note || tx.category}
                    </span>
                    <span className="text-[10px] text-white/40">
                      {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Amount and Actions */}
                <div className="flex items-center gap-4">
                  <span className={`text-sm font-bold numeric-display ${
                    tx.type === 'income' ? 'text-neon-green' : 'text-white'
                  }`}>
                    {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onEditTransaction(tx)}
                      className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                      title="Edit"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button
                      onClick={() => onDeleteTransaction(tx.id)}
                      className="w-7 h-7 rounded-full bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 transition-colors"
                      title="Delete"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </Card>

    </div>
  );
};
