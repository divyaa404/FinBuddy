import React, { useState } from 'react';
import type { Budget, Transaction } from '../../types';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface BudgetPlannerProps {
  budgets: Budget[];
  onUpdateBudget: (budget: Budget) => void;
  transactions: Transaction[];
}

const CATEGORIES = ['Food', 'Transport', 'Subscriptions', 'Shopping', 'Entertainment', 'Others'];

export const BudgetPlanner: React.FC<BudgetPlannerProps> = ({
  budgets,
  onUpdateBudget,
  transactions
}) => {
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [limitAmount, setLimitAmount] = useState('');

  // Calculate current month's category expenses
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const currentMonthExpenses = transactions.filter(tx => {
    const d = new Date(tx.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear && tx.type === 'expense';
  });

  const categorySpentMap: { [cat: string]: number } = {};
  currentMonthExpenses.forEach(tx => {
    categorySpentMap[tx.category] = (categorySpentMap[tx.category] || 0) + tx.amount;
  });

  const handleSetBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!limitAmount || parseFloat(limitAmount) < 0) return;

    onUpdateBudget({
      category: selectedCategory,
      limit: parseFloat(limitAmount)
    });
    setLimitAmount('');
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 90) return 'bg-error'; // Red
    if (percent >= 50) return 'bg-yellow-500'; // Yellow
    return 'bg-neon-green shadow-[0_0_8px_rgba(15,238,101,0.5)]'; // Neon Green
  };

  const getProgressTextClass = (percent: number) => {
    if (percent >= 90) return 'text-error';
    if (percent >= 50) return 'text-yellow-500';
    return 'text-neon-green';
  };

  return (
    <div className="flex flex-col gap-6 w-full text-left">
      
      {/* Configure Budget Vessel */}
      <Card variant="vessel" className="p-5 border border-white/[0.08] rounded-2xl flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-white/5 pb-2 mb-1">
          <span className="material-symbols-outlined text-neon-green">savings</span>
          <h3 className="font-hanken text-sm font-semibold uppercase tracking-wider text-white">Set Monthly Category Budgets</h3>
        </div>

        <form onSubmit={handleSetBudget} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[140px] flex flex-col gap-1.5">
            <label className="font-hanken text-xs font-semibold uppercase tracking-wider text-white/60">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg text-sm bg-[#222] text-white border border-white/10 focus:border-neon-green focus:ring-1 focus:ring-neon-green outline-none"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[140px]">
            <Input
              label="Limit (₹)"
              type="number"
              placeholder="e.g. 3000"
              value={limitAmount}
              onChange={(e) => setLimitAmount(e.target.value)}
              required
              min="0"
            />
          </div>

          <Button type="submit" variant="primary" className="h-10 px-6">
            Apply Limit
          </Button>
        </form>
      </Card>

      {/* Budgets List Vessel */}
      <Card variant="vessel" className="p-5 border border-white/[0.08] rounded-2xl flex flex-col gap-4">
        <h3 className="font-hanken text-sm font-semibold uppercase tracking-wider text-white mb-2">Category Limits Progress</h3>

        <div className="flex flex-col gap-5">
          {CATEGORIES.map(cat => {
            const budget = budgets.find(b => b.category === cat);
            const limit = budget ? budget.limit : 0;
            const spent = categorySpentMap[cat] || 0;
            const remaining = Math.max(0, limit - spent);
            const percent = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;

            return (
              <div key={cat} className="flex flex-col gap-2">
                {/* Title & Spent labels */}
                <div className="flex justify-between items-baseline">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-white">{cat}</span>
                    {limit > 0 && percent >= 100 && (
                      <span className="px-2 py-0.5 rounded bg-error/15 text-error text-[8px] uppercase tracking-wider font-extrabold border border-error/25">
                        Exceeded
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-baseline gap-1 text-xs">
                    <span className="font-bold text-white numeric-display">₹{spent.toLocaleString()}</span>
                    {limit > 0 ? (
                      <>
                        <span className="text-white/40">/</span>
                        <span className="text-white/60 font-medium font-hanken">₹{limit.toLocaleString()}</span>
                      </>
                    ) : (
                      <span className="text-white/30 text-[10px] uppercase font-bold tracking-wider font-hanken">No Limit Set</span>
                    )}
                  </div>
                </div>

                {/* Progress bar container */}
                {limit > 0 ? (
                  <>
                    <div className="w-full h-2 bg-[#222] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${getProgressColor(percent)}`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>

                    {/* Meta info (remaining / percentage) */}
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-white/40">
                        {remaining > 0 ? `₹${remaining.toLocaleString()} left` : '₹0 remaining'}
                      </span>
                      <span className={`font-semibold ${getProgressTextClass(percent)}`}>
                        {Math.round(percent)}% used
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-2 bg-[#222]/50 rounded-full border border-white/[0.03]"></div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

    </div>
  );
};
