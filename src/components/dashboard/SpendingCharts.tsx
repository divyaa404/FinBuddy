import React, { useState, useMemo } from 'react';
import type { Transaction, Budget, SavingsGoal } from '../../types';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import type { ChartOptions } from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SpendingChartsProps {
  transactions: Transaction[];
  budgets?: Budget[];
  goals?: SavingsGoal[];
}

export const SpendingCharts: React.FC<SpendingChartsProps> = ({ 
  transactions,
  budgets = [],
  _goals = []
}) => {
  const [period, setPeriod] = useState('This Month');

  // Basic derived stats
  const now = useMemo(() => new Date(), []);
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const currentMonthTx = useMemo(() => transactions.filter(tx => {
    const d = new Date(tx.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }), [transactions, currentMonth, currentYear]);

  const lastMonthTx = useMemo(() => transactions.filter(tx => {
    const d = new Date(tx.date);
    const lm = currentMonth === 0 ? 11 : currentMonth - 1;
    const ly = currentMonth === 0 ? currentYear - 1 : currentYear;
    return d.getMonth() === lm && d.getFullYear() === ly;
  }), [transactions, currentMonth, currentYear]);

  const currentIncome = currentMonthTx.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
  const currentExpense = currentMonthTx.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
  const lastIncome = lastMonthTx.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
  const lastExpense = lastMonthTx.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);

  const getChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? '+100%' : '0%';
    const pct = ((curr - prev) / prev) * 100;
    return `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`;
  };

  // const incomeChange = getChange(currentIncome, lastIncome);
  const expenseChange = getChange(currentExpense, lastExpense);
  const currentSavings = Math.max(0, currentIncome - currentExpense);
  const lastSavings = Math.max(0, lastIncome - lastExpense);
  const savingsChange = getChange(currentSavings, lastSavings);
  // const savingsRate = currentIncome > 0 ? Math.round((currentSavings / currentIncome) * 100) : 0;
  
  const currentDays = now.getDate();
  const avgDailySpend = currentDays > 0 ? Math.round(currentExpense / currentDays) : 0;
  
  const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0) || 10000;
  const budgetUsedPct = Math.round((currentExpense / totalBudget) * 100);

  // Colors strict
  const neonGreen = '#0fee65';
  // const vesselBg = '#121212';
  const textSecondary = 'rgba(255, 255, 255, 0.5)';

  // KPIs
  const kpis = [
    { title: 'Total Spending', value: `₹${currentExpense.toLocaleString()}`, change: expenseChange, pos: currentExpense <= lastExpense },
    { title: 'Avg Daily Spend', value: `₹${avgDailySpend.toLocaleString()}`, change: 'Current Month', pos: true },
    { title: 'Total Savings', value: `₹${currentSavings.toLocaleString()}`, change: savingsChange, pos: currentSavings >= lastSavings },
    { title: 'Transactions', value: currentMonthTx.length.toString(), change: 'This month', pos: true },
    { title: 'Budget Used', value: `${budgetUsedPct}%`, change: `₹${Math.max(0, totalBudget - currentExpense)} left`, pos: budgetUsedPct <= 100 },
    { title: 'Health Score', value: '88/100', change: 'Good Standing', pos: true },
  ];

  // Spending Trend (Line)
  const trendLabels = Array.from({length: 14}, (_, i) => {
    const d = new Date();
    d.setDate(now.getDate() - (13 - i));
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const trendDataPoints = useMemo(() => {
    return trendLabels.map(label => {
      // Very basic matching for demo purposes
      const daySum = transactions
        .filter(tx => tx.type === 'expense' && new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) === label)
        .reduce((sum, tx) => sum + tx.amount, 0);
      return daySum;
    });
  }, [transactions, trendLabels]);

  const trendData = {
    labels: trendLabels,
    datasets: [{
      label: 'Spending',
      data: trendDataPoints,
      borderColor: neonGreen,
      backgroundColor: 'rgba(15, 238, 101, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4
    }]
  };

  const commonOptions: ChartOptions<'line' | 'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: '#1b1c1c', titleFont: { family: 'Manrope', size: 12 }, bodyFont: { family: 'Manrope', size: 12 } }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: textSecondary, font: { size: 10 } } },
      y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: textSecondary, font: { size: 10 } } }
    }
  };

  // Income vs Expense (Bar)
  const monthlyData = useMemo(() => {
    const data: Record<string, { income: number; expense: number }> = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    transactions.forEach(tx => {
      const d = new Date(tx.date);
      const mName = monthNames[d.getMonth()];
      if (!data[mName]) data[mName] = { income: 0, expense: 0 };
      if (tx.type === 'income') data[mName].income += tx.amount;
      if (tx.type === 'expense') data[mName].expense += tx.amount;
    });
    return data;
  }, [transactions]);

  const last6Months = [...Object.keys(monthlyData).slice(-6)];
  if (last6Months.length === 0) {
    const defaultMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    last6Months.push(...defaultMonths);
  }

  const incExpData = {
    labels: last6Months,
    datasets: [
      { label: 'Income', data: last6Months.map(m => monthlyData[m]?.income || 0), backgroundColor: '#ffffff', borderRadius: 4 },
      { label: 'Expense', data: last6Months.map(m => monthlyData[m]?.expense || 0), backgroundColor: neonGreen, borderRadius: 4 }
    ]
  };

  // Category Analytics
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    currentMonthTx.filter(t => t.type === 'expense').forEach(tx => {
      map[tx.category] = (map[tx.category] || 0) + tx.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [currentMonthTx]);

  // Weekly Pattern
  const weeklyPattern = useMemo(() => {
    const days = [0, 0, 0, 0, 0, 0, 0]; // Mon to Sun
    transactions.filter(t => t.type === 'expense').forEach(tx => {
      const d = new Date(tx.date).getDay();
      const idx = d === 0 ? 6 : d - 1; // Make Mon=0, Sun=6
      days[idx] += tx.amount;
    });
    return days;
  }, [transactions]);

  const weeklyData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      data: weeklyPattern,
      backgroundColor: weeklyPattern.map(v => v === Math.max(...weeklyPattern) ? neonGreen : 'rgba(255,255,255,0.2)'),
      borderRadius: 4
    }]
  };

  // Insights
  const insights = [];
  if (expenseByCategory.length > 0) {
    insights.push(`${expenseByCategory[0][0]} is currently your highest spending category.`);
  }
  if (currentExpense < lastExpense) {
    insights.push(`Your spending decreased compared with the previous period.`);
  }
  if (currentExpense <= totalBudget) {
    insights.push(`You are currently within your monthly budget.`);
  }

  // Concentric Rings for Category Breakdown
  const ringDatasets = expenseByCategory.slice(0, 3).map((item, idx) => {
    const colors = ['#0fee65', '#ffffff', 'rgba(255,255,255,0.4)'];
    return {
      data: [item[1], currentExpense - item[1]],
      backgroundColor: [colors[idx % colors.length], 'rgba(255,255,255,0.05)'],
      borderWidth: 0,
      circumference: 300,
      rotation: 210,
      weight: 1,
    };
  });

  const concentricOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '40%',
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    }
  };

  const concentricData = {
    labels: ['Spent', 'Other'],
    datasets: ringDatasets.length > 0 ? ringDatasets : [{
      data: [1, 1],
      backgroundColor: ['#333', '#333'],
      borderWidth: 0,
    }]
  };

  return (
    <div className="w-full flex flex-col gap-6 text-white font-sans selection:bg-[#0fee65] selection:text-black pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Analytics</h1>
          <p className="text-white/50 text-sm mt-1">Understand your spending patterns, budget performance, and financial progress.</p>
        </div>
        <select 
          className="bg-[#1b1c1c] text-white border border-white/10 rounded-lg px-4 py-2 text-sm font-semibold outline-none focus:border-[#0fee65]"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          <option>7 Days</option>
          <option>30 Days</option>
          <option>This Month</option>
          <option>3 Months</option>
          <option>This Year</option>
        </select>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-[#121212] border border-white/10 rounded-[16px] p-4 flex flex-col gap-2 hover:border-[#0fee65]/50 transition-colors">
            <span className="text-[10px] uppercase tracking-wider text-white/50 font-bold">{kpi.title}</span>
            <span className="text-xl font-bold">{kpi.value}</span>
            <div className={`text-[10px] font-bold ${kpi.pos ? 'text-[#0fee65]' : 'text-white/40'}`}>
              {kpi.change}
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Spending Trend */}
        <div className="lg:col-span-2 bg-[#121212] border border-white/10 rounded-[20px] p-5 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-lg">Spending Trend</h2>
            <button className="text-xs text-[#0fee65] hover:underline font-semibold flex items-center gap-1">Ask AI <span className="material-symbols-outlined text-[14px]">arrow_forward</span></button>
          </div>
          <div className="h-[250px] w-full">
            <Line data={trendData} options={commonOptions} />
          </div>
        </div>

        {/* Category Breakdown (Concentric Rings) */}
        <div className="bg-[#121212] border border-white/10 rounded-[20px] p-5 flex flex-col gap-6 flex-1 min-h-[380px] hover:border-white/20 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Category Breakdown</h2>
              <p className="text-xs text-white/50 mt-1">Track your top expenses</p>
            </div>
          </div>
          
          {/* Concentric Chart */}
          <div className="relative flex justify-center items-center h-[180px] my-2">
            <Doughnut data={concentricData} options={concentricOptions} />
            {/* Center Stat */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-10">
              <span className="text-2xl font-bold tracking-tight">
                {expenseByCategory.length > 0 ? `₹${expenseByCategory[0][1]}` : '₹0'}
              </span>
              <span className="text-[10px] text-white/50 uppercase tracking-wider font-semibold mt-1">
                {expenseByCategory.length > 0 ? expenseByCategory[0][0] : 'No Data'}
              </span>
            </div>
          </div>
          
          {/* List Breakdown */}
          <div className="flex flex-col gap-3 mt-auto">
            {expenseByCategory.slice(0, 3).map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors cursor-default">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 text-lg">
                    {idx === 0 ? '🍔' : idx === 1 ? '🎬' : '🛒'} 
                  </div>
                  <span className="text-sm font-semibold text-white/90">{cat[0]}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-white">₹{cat[1].toLocaleString()}</span>
                  <div 
                    className="w-10 text-center py-0.5 rounded text-[9px] font-bold"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: ['#0fee65', '#ffffff', 'rgba(255,255,255,0.4)'][idx % 3] }}
                  >
                    {Math.round((cat[1]/currentExpense)*100)}%
                  </div>
                </div>
              </div>
            ))}
            {expenseByCategory.length === 0 && (
              <div className="text-center text-xs text-white/30 py-4">No categorised expenses found.</div>
            )}
          </div>
        </div>

      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Income vs Expenses */}
        <div className="bg-[#121212] border border-white/10 rounded-[20px] p-5 flex flex-col gap-4">
          <h2 className="font-bold text-lg">Income vs Expenses</h2>
          <div className="h-[200px] w-full">
            <Bar data={incExpData} options={commonOptions} />
          </div>
        </div>

        {/* Weekly Pattern */}
        <div className="bg-[#121212] border border-white/10 rounded-[20px] p-5 flex flex-col gap-4">
          <h2 className="font-bold text-lg">Weekly Pattern</h2>
          <div className="h-[200px] w-full">
            <Bar data={weeklyData} options={commonOptions} />
          </div>
        </div>

        {/* Budget Performance */}
        <div className="bg-[#121212] border border-white/10 rounded-[20px] p-5 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-lg">Budget Performance</h2>
            <button className="text-xs text-[#0fee65] hover:underline font-semibold flex items-center gap-1">Ask AI <span className="material-symbols-outlined text-[14px]">arrow_forward</span></button>
          </div>
          <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-2 scrollbar-thin">
            {budgets.map((b, i) => {
              const spent = expenseByCategory.find(c => c[0] === b.category)?.[1] || 0;
              const pct = Math.min(100, Math.round((spent / b.limit) * 100));
              return (
                <div key={i} className="flex flex-col gap-1 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span>{b.category}</span>
                    <span className={pct > 90 ? 'text-red-400' : ''}>{pct}%</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${pct > 90 ? 'bg-red-400' : 'bg-[#0fee65]'}`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
            {budgets.length === 0 && <div className="text-white/40 text-sm italic">No budgets set</div>}
          </div>
        </div>

      </div>

      {/* Third Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Financial Insights */}
        <div className="bg-[#121212] border border-white/10 rounded-[20px] p-5 flex flex-col gap-4">
          <h2 className="font-bold text-lg flex items-center gap-2"><span className="material-symbols-outlined text-[#0fee65]">tips_and_updates</span> Financial Insights</h2>
          <div className="flex flex-col gap-3">
            {insights.length > 0 ? insights.map((ins, i) => (
              <div key={i} className="bg-[#1b1c1c] border border-white/5 p-3 rounded-xl text-sm leading-relaxed border-l-2 border-l-[#0fee65]">
                {ins}
              </div>
            )) : (
              <div className="text-white/40 text-sm italic">Add more transactions to unlock insights.</div>
            )}
          </div>
        </div>

        {/* Transaction Analytics */}
        <div className="bg-[#121212] border border-white/10 rounded-[20px] p-5 flex flex-col gap-4">
          <h2 className="font-bold text-lg">Transaction Analytics</h2>
          <div className="grid grid-cols-2 gap-4 flex-1">
            <div className="bg-white/5 rounded-xl p-3 flex flex-col gap-1">
              <span className="text-[10px] text-white/50 uppercase font-bold">Avg Txn Value</span>
              <span className="text-lg font-bold">₹{currentMonthTx.length > 0 ? Math.round(currentExpense / currentMonthTx.filter(t=>t.type==='expense').length) : 0}</span>
            </div>
            <div className="bg-white/5 rounded-xl p-3 flex flex-col gap-1">
              <span className="text-[10px] text-white/50 uppercase font-bold">Largest Txn</span>
              <span className="text-lg font-bold">₹{Math.max(0, ...currentMonthTx.filter(t=>t.type==='expense').map(t=>t.amount))}</span>
            </div>
            <div className="bg-white/5 rounded-xl p-3 flex flex-col gap-1">
              <span className="text-[10px] text-white/50 uppercase font-bold">Most Active Day</span>
              <span className="text-lg font-bold">Saturday</span>
            </div>
            <div className="bg-white/5 rounded-xl p-3 flex flex-col gap-1">
              <span className="text-[10px] text-white/50 uppercase font-bold">Frequent Category</span>
              <span className="text-lg font-bold">{expenseByCategory.length > 0 ? expenseByCategory[0][0] : 'N/A'}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
