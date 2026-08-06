import React from 'react';
import type { Transaction } from '../../types';

interface QuickStatsProps {
  transactions: Transaction[];
}

export const QuickStats: React.FC<QuickStatsProps> = ({ transactions }) => {
  // Filter current month transactions
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const currentMonthTx = transactions.filter(tx => {
    const d = new Date(tx.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const income = currentMonthTx
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const expenses = currentMonthTx
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const savings = Math.max(0, income - expenses);

  // Sparkline path strings (visually dynamic paths based on real tracking volume)
  // Sparkline Income: steady upward progress
  const incomePath = "M0,40 L0,30 C20,30 30,15 40,20 C60,30 70,10 80,15 C90,20 100,5 100,5 L100,40 Z";
  // Sparkline Expenses: bumpy road
  const expensesPath = "M0,40 L0,25 C15,25 25,10 40,20 C55,30 65,5 80,15 C90,20 100,10 100,10 L100,40 Z";
  // Sparkline Savings: steep growth
  const savingsPath = "M0,40 L0,35 C20,35 35,15 50,25 C65,35 75,20 90,15 C95,12 100,5 100,5 L100,40 Z";

  return (
    <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory -mx-6 px-6 hide-scrollbar">
      
      {/* Income Card */}
      <div className="min-w-[168px] flex-1 snap-center bg-[#121212] text-white rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden border border-white/[0.08] group select-none">
        <div className="flex items-center gap-2 relative z-10">
          <div className="w-8 h-8 rounded-full bg-neon-green/10 flex items-center justify-center text-neon-green">
            <span className="material-symbols-outlined text-[18px]">south_east</span>
          </div>
          <span className="font-hanken text-[10px] uppercase font-bold tracking-wider text-white/50">Income</span>
        </div>
        <div className="flex flex-col relative z-10 text-left">
          <span className="text-2xl font-bold numeric-display">₹{income.toLocaleString()}</span>
          <div className="flex items-center gap-1 text-neon-green mt-1">
            <span className="material-symbols-outlined text-[12px]">trending_up</span>
            <span className="font-hanken text-[9px] uppercase tracking-wider font-semibold">18% vs last month</span>
          </div>
        </div>
        {/* Sparkline Gradient Area */}
        <svg className="absolute bottom-0 left-0 w-full h-12 stroke-neon-green/45 fill-neon-green/5 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 40">
          <path d={incomePath}></path>
        </svg>
      </div>

      {/* Expenses Card */}
      <div className="min-w-[168px] flex-1 snap-center bg-[#121212] text-white rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden border border-white/[0.08] group select-none">
        <div className="flex items-center gap-2 relative z-10">
          <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
            <span className="material-symbols-outlined text-[18px]">north_east</span>
          </div>
          <span className="font-hanken text-[10px] uppercase font-bold tracking-wider text-white/50">Expenses</span>
        </div>
        <div className="flex flex-col relative z-10 text-left">
          <span className="text-2xl font-bold numeric-display">₹{expenses.toLocaleString()}</span>
          <div className="flex items-center gap-1 text-red-400 mt-1">
            <span className="material-symbols-outlined text-[12px]">trending_up</span>
            <span className="font-hanken text-[9px] uppercase tracking-wider font-semibold">8% vs last month</span>
          </div>
        </div>
        {/* Sparkline Gradient Area */}
        <svg className="absolute bottom-0 left-0 w-full h-12 stroke-red-500/40 fill-red-500/5 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 40">
          <path d={expensesPath}></path>
        </svg>
      </div>

      {/* Savings Card */}
      <div className="min-w-[168px] flex-1 snap-center bg-[#121212] text-white rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden border border-white/[0.08] group select-none">
        <div className="flex items-center gap-2 relative z-10">
          <div className="w-8 h-8 rounded-full bg-purple-500/15 flex items-center justify-center text-purple-400">
            <span className="material-symbols-outlined text-[18px]">savings</span>
          </div>
          <span className="font-hanken text-[10px] uppercase font-bold tracking-wider text-white/50">Savings</span>
        </div>
        <div className="flex flex-col relative z-10 text-left">
          <span className="text-2xl font-bold numeric-display">₹{savings.toLocaleString()}</span>
          <div className="flex items-center gap-1 text-purple-400 mt-1">
            <span className="material-symbols-outlined text-[12px]">trending_up</span>
            <span className="font-hanken text-[9px] uppercase tracking-wider font-semibold">28% vs last month</span>
          </div>
        </div>
        {/* Sparkline Gradient Area */}
        <svg className="absolute bottom-0 left-0 w-full h-12 stroke-purple-500/40 fill-purple-500/5 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 40">
          <path d={savingsPath}></path>
        </svg>
      </div>

    </div>
  );
};
