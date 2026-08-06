import React, { useState } from 'react';
import type { Transaction, Budget } from '../../types';
import { Card } from '../ui/Card';

interface FinancialHealthHeroProps {
  transactions: Transaction[];
  budgets: Budget[];
}

export const FinancialHealthHero: React.FC<FinancialHealthHeroProps> = ({ transactions, budgets }) => {
  const [showBreakdown, setShowBreakdown] = useState(false);

  // 1. Calculate Monthly Income & Expense
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

  // 2. Savings Rate Score (40% Weight)
  // Target savings rate for students is 20%+ for 100 score, scale accordingly
  const savings = Math.max(0, income - expenses);
  const savingsRate = income > 0 ? (savings / income) : 0;
  const savingsScore = Math.min(100, Math.round((savingsRate / 0.25) * 100)); // 25% savings rate = 100 score

  // 3. Budget Adherence Score (40% Weight)
  const categorySpentMap: { [cat: string]: number } = {};
  currentMonthTx.filter(tx => tx.type === 'expense').forEach(tx => {
    categorySpentMap[tx.category] = (categorySpentMap[tx.category] || 0) + tx.amount;
  });

  let adherenceScore = 100;
  if (budgets.length > 0) {
    let componentsUnderBudget = 0;
    budgets.forEach(b => {
      const spent = categorySpentMap[b.category] || 0;
      if (spent <= b.limit) {
        componentsUnderBudget++;
      } else {
        // partial penalty based on overflow
        const overflowRatio = spent / b.limit;
        if (overflowRatio < 1.2) componentsUnderBudget += 0.5; // slight overflow
      }
    });
    adherenceScore = Math.round((componentsUnderBudget / budgets.length) * 100);
  } else {
    // If no budget set, default to 75
    adherenceScore = 75;
  }

  // 4. Spending Consistency Score (20% Weight)
  // Calculate weekly spending variance for the current month
  const weeklySpent = [0, 0, 0, 0]; // 4 weeks
  currentMonthTx.filter(tx => tx.type === 'expense').forEach(tx => {
    const day = new Date(tx.date).getDate();
    const weekIndex = Math.min(3, Math.floor((day - 1) / 7));
    weeklySpent[weekIndex] += tx.amount;
  });

  const avgWeeklySpent = weeklySpent.reduce((a, b) => a + b, 0) / 4;
  let consistencyScore = 100;
  if (avgWeeklySpent > 0) {
    const varianceSum = weeklySpent.reduce((sum, w) => sum + Math.pow(w - avgWeeklySpent, 2), 0);
    const stdDev = Math.sqrt(varianceSum / 4);
    // Lower relative standard deviation (coefficient of variation) = higher consistency
    const cv = stdDev / avgWeeklySpent;
    consistencyScore = Math.max(0, Math.min(100, Math.round(100 - (cv * 50))));
  } else {
    consistencyScore = 80;
  }

  // 5. Total Weighted Health Score
  // Default score if no data
  const finalScore = transactions.length === 0 
    ? 78 
    : Math.round((savingsScore * 0.4) + (adherenceScore * 0.4) + (consistencyScore * 0.2));

  // Determine status details
  let rating = 'Good';
  let label = 'on track this month';
  let ratingColor = 'text-neon-green';
  let ratingFill = '#0fee65';
  
  if (finalScore >= 85) {
    rating = 'Excellent';
    label = 'perfect financial balance';
    ratingColor = 'text-neon-green';
    ratingFill = '#0fee65';
  } else if (finalScore >= 70) {
    rating = 'Good';
    label = 'healthy saving & spending habits';
    ratingColor = 'text-neon-green font-semibold';
    ratingFill = '#0fee65';
  } else if (finalScore >= 50) {
    rating = 'Fair';
    label = 'some category overruns';
    ratingColor = 'text-orange-500';
    ratingFill = '#f97316';
  } else {
    rating = 'Needs Attention';
    label = 'high spending, low savings rate';
    ratingColor = 'text-error';
    ratingFill = '#ba1a1a';
  }

  // Radial calculation (dashoffset)
  const radius = 42;
  const circumference = 2 * Math.PI * radius; // ~263.89
  const dashoffset = circumference - (finalScore / 100) * circumference;

  return (
    <div className="w-full">
      <Card variant="vessel" className="relative overflow-hidden flex flex-col gap-6 shadow-xl p-6 rounded-[24px]">
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-neon-green/10 rounded-full blur-[80px] pointer-events-none"></div>

        {/* Header */}
        <div className="flex justify-between items-start relative z-10">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-neon-green">monitor_heart</span>
            <span className="font-hanken text-[11px] uppercase tracking-widest text-white/60">Financial Health Score</span>
          </div>
        </div>

        {/* Score & Gauge */}
        <div className="flex items-center justify-between relative z-10 flex-col sm:flex-row gap-6">
          <div className="flex flex-col text-left">
            <div className="flex items-baseline gap-1">
              <span className="text-[64px] font-extrabold leading-none text-white numeric-display">{finalScore}</span>
              <span className="text-white/40 text-lg">/100</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-lg font-bold ${ratingColor}`}>{rating}</span>
              <span className="text-white/50 text-sm">— {label}</span>
            </div>
          </div>

          {/* Gauge Graph */}
          <div className="relative w-32 h-32 flex items-center justify-center flex-shrink-0">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle 
                cx="50" 
                cy="50" 
                fill="none" 
                r={radius} 
                stroke="#1b1c1c" 
                strokeWidth="8"
              />
              <circle 
                cx="50" 
                cy="50" 
                fill="none" 
                r={radius} 
                stroke={ratingFill} 
                strokeDasharray={circumference} 
                strokeDashoffset={dashoffset} 
                strokeLinecap="round" 
                strokeWidth="8"
                className="transition-all duration-1000 ease-out"
                style={{ filter: `drop-shadow(0 0 6px ${ratingFill}70)` }}
              />
            </svg>
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center relative z-10 border border-white/10 shadow-inner">
              <span className="material-symbols-outlined text-2xl text-neon-green" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
            </div>
          </div>
        </div>

        {/* Action Toggle */}
        <div className="flex flex-col gap-4 pt-4 border-t border-white/5 relative z-10">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white font-hanken text-xs font-semibold"
            >
              <span>{showBreakdown ? 'Hide factor weights' : 'View insights'}</span>
              <span className={`material-symbols-outlined text-xs transition-transform ${showBreakdown ? 'rotate-180' : ''}`}>expand_more</span>
            </button>
            
            <div className="flex items-center gap-2 text-right">
              <div className="flex flex-col items-end">
                <span className="text-neon-green font-bold font-hanken text-sm">+6</span>
                <span className="text-[9px] uppercase tracking-wider text-white/40">vs last month</span>
              </div>
            </div>
          </div>

          {/* Animated Factor weights */}
          {showBreakdown && (
            <div className="grid grid-cols-3 gap-3 bg-white/5 p-4 rounded-xl border border-white/5 animate-fade-in text-left">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-white/50 uppercase font-bold tracking-wider">Savings Rate</span>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-lg font-bold text-white numeric-display">{savingsScore}</span>
                  <span className="text-white/40 text-[10px]">/100</span>
                </div>
                <div className="text-[9px] text-white/40">Weight: 40%</div>
              </div>

              <div className="flex flex-col gap-1 border-x border-white/5 px-3">
                <span className="text-[10px] text-white/50 uppercase font-bold tracking-wider">Budget Limit</span>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-lg font-bold text-white numeric-display">{adherenceScore}</span>
                  <span className="text-white/40 text-[10px]">/100</span>
                </div>
                <div className="text-[9px] text-white/40">Weight: 40%</div>
              </div>

              <div className="flex flex-col gap-1 pl-1">
                <span className="text-[10px] text-white/50 uppercase font-bold tracking-wider">Consistency</span>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-lg font-bold text-white numeric-display">{consistencyScore}</span>
                  <span className="text-white/40 text-[10px]">/100</span>
                </div>
                <div className="text-[9px] text-white/40">Weight: 20%</div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
