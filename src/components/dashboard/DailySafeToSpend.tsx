import React from 'react';
import type { Transaction, Budget } from '../../types';
import { Card } from '../ui/Card';

interface DailySafeToSpendProps {
  transactions: Transaction[];
  budgets: Budget[];
}

export const DailySafeToSpend: React.FC<DailySafeToSpendProps> = ({ transactions, budgets }) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // 1. Calculate spent so far this month (only expenses)
  const currentMonthExpenses = transactions
    .filter(tx => {
      const d = new Date(tx.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear && tx.type === 'expense';
    })
    .reduce((sum, tx) => sum + tx.amount, 0);

  // 2. Calculate total monthly budget set by user
  const totalMonthlyBudget = budgets.reduce((sum, b) => sum + b.limit, 0);

  // 3. Calculate days remaining in the month
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysRemaining = Math.max(1, totalDaysInMonth - currentDay + 1); // include today

  // Calculate Safe-To-Spend
  const hasBudgets = totalMonthlyBudget > 0;
  const remainingBudget = Math.max(0, totalMonthlyBudget - currentMonthExpenses);
  const safeToSpend = hasBudgets ? Math.round(remainingBudget / daysRemaining) : 0;

  // Render a helper message
  const getHelperText = () => {
    if (!hasBudgets) {
      return 'Set your category budgets to activate this metric.';
    }
    if (remainingBudget <= 0) {
      return 'You have exceeded your total monthly budget!';
    }
    if (safeToSpend < 100) {
      return 'Budget is tight! Try limiting expenses today.';
    }
    return 'You are in a healthy spending zone.';
  };

  return (
    <Card variant="vessel" className="relative overflow-hidden flex flex-col gap-4 p-5 rounded-2xl border border-white/[0.08] shadow-lg">
      <div className="absolute top-0 right-0 w-24 h-24 bg-neon-green/10 rounded-full blur-[40px] pointer-events-none"></div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-neon-green text-xl">payments</span>
          <span className="font-hanken text-[10px] uppercase font-bold tracking-wider text-white/50">Daily Safe-to-Spend</span>
        </div>
        {hasBudgets && (
          <span className="text-[10px] text-white/40 font-medium">
            {daysRemaining} days left
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-1.5 text-left my-1">
        {hasBudgets ? (
          <>
            <span className="text-4xl font-extrabold text-neon-green numeric-display">
              ₹{safeToSpend.toLocaleString()}
            </span>
            <span className="text-white/40 text-xs">/ day</span>
          </>
        ) : (
          <span className="text-xl font-bold text-white/70">₹0.00</span>
        )}
      </div>

      <div className="flex flex-col text-left gap-1">
        <p className="text-xs text-white/70 font-medium">
          {getHelperText()}
        </p>

        {hasBudgets && (
          <div className="text-[10px] text-white/35 font-hanken mt-1 flex items-center justify-between border-t border-white/5 pt-1.5">
            <span>(₹{totalMonthlyBudget.toLocaleString()} Budget - ₹{currentMonthExpenses.toLocaleString()} Spent) / {daysRemaining} days</span>
          </div>
        )}
      </div>
    </Card>
  );
};
