import React, { useState, useMemo } from 'react';
import type { Transaction, Budget, SavingsGoal } from '../../types';
import { Doughnut, Bar, Bubble } from 'react-chartjs-2';
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

// Minimal icons as SVG components
const Icons = {
  Sales: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  ),
  Orders: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"></rect>
      <path d="M7 15h0M2 9.5h20"></path>
    </svg>
  ),
  Visitors: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  ),
  Products: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
      <line x1="8" y1="21" x2="16" y2="21"></line>
      <line x1="12" y1="17" x2="12" y2="21"></line>
    </svg>
  )
};

export const SpendingCharts: React.FC<SpendingChartsProps> = ({ 
  transactions,
  goals = []
}) => {
  const [habitPeriod] = useState('This year');
  const [statPeriod] = useState('Today');
  const [growthPeriod] = useState('Today');

  // Basic derived stats
  const now = new Date();
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

  const getChangeNum = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  const incomeChangeNum = getChangeNum(currentIncome, lastIncome);
  const expenseChangeNum = getChangeNum(currentExpense, lastExpense);
  const savingsRate = currentIncome > 0 ? Math.round(((currentIncome - currentExpense) / currentIncome) * 100) : 0;
  
  const balance = transactions.reduce((sum, tx) => sum + (tx.type === 'income' ? tx.amount : -tx.amount), 0);

  // Colors
  const brandBlue = '#2563eb';
  const vesselBg = '#121212';
  const textSecondary = 'rgba(255, 255, 255, 0.5)';
  const borderLight = 'rgba(255, 255, 255, 0.08)';

  const categoryColors = ['#0fee65', '#3b82f6', '#f43f5e', '#a855f7', '#fbbf24', '#64748b'];

  // --- Top Metrics (KPIs) ---
  const kpis = [
    {
      title: 'Total Income',
      value: `₹${currentIncome.toLocaleString()}`,
      change: getChange(currentIncome, lastIncome),
      isPositive: incomeChangeNum >= 0,
      icon: <Icons.Sales />,
      desc: 'Income vs last month',
      prominent: true
    },
    {
      title: 'Total Expenses',
      value: `₹${currentExpense.toLocaleString()}`,
      change: getChange(currentExpense, lastExpense),
      isPositive: expenseChangeNum <= 0,
      icon: <Icons.Orders />,
      desc: 'Expenses vs last month'
    },
    {
      title: 'Savings Rate',
      value: `${savingsRate}%`,
      change: '+2.0%',
      isPositive: true,
      icon: <Icons.Visitors />,
      desc: 'Savings vs last month'
    },
    {
      title: 'Net Balance',
      value: `₹${balance.toLocaleString()}`,
      change: '+12.1%',
      isPositive: true,
      icon: <Icons.Products />,
      desc: 'Balance vs last month'
    }
  ];

  // --- Product Statistics (Concentric Rings) ---
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    currentMonthTx.filter(t => t.type === 'expense').forEach(tx => {
      map[tx.category] = (map[tx.category] || 0) + tx.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [currentMonthTx]);

  const ringDatasets = expenseByCategory.map((item, idx) => {
    // Fill part, empty part
    return {
      data: [item[1], currentExpense - item[1]],
      backgroundColor: [categoryColors[idx % categoryColors.length], 'rgba(255,255,255,0.05)'],
      borderWidth: 0,
      circumference: 300, // Make it a partial ring
      rotation: 210, // Start from bottom left
      weight: 1, // uniform thickness
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

  // --- Customer Habits (Grouped Bar Chart) ---
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

  const last6Months = Object.keys(monthlyData).slice(-6);
  if (last6Months.length === 0) {
    last6Months.push('Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun');
    last6Months.forEach(m => monthlyData[m] = { income: 0, expense: 0 });
  }

  const habitData = {
    labels: last6Months,
    datasets: [
      {
        label: 'Income',
        data: last6Months.map(m => monthlyData[m]?.income || 0),
        backgroundColor: '#e4e2e2', // Light grey / surface variant
        borderRadius: 8,
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      },
      {
        label: 'Expense',
        data: last6Months.map(m => monthlyData[m]?.expense || 0),
        backgroundColor: '#2563eb', // Prominent Blue
        borderRadius: 8,
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      }
    ]
  };

  const habitOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1b1c1c',
        titleFont: { family: 'Manrope', size: 12 },
        bodyFont: { family: 'Manrope', size: 12 },
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: textSecondary, font: { family: 'Manrope', size: 11 } },
        border: { display: false }
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.03)', drawTicks: false },
        ticks: { 
          color: textSecondary, 
          font: { family: 'Manrope', size: 11 },
          callback: (value) => value === 0 ? '0' : `${Number(value) / 1000}k`,
          stepSize: 20000
        },
        border: { display: false }
      }
    }
  };

  // --- Customer Growth (Bubble Chart representing Goals) ---
  const bubbleData = {
    datasets: goals.length > 0 ? goals.map((g, i) => ({
      label: g.name,
      data: [{
        x: (i % 3) * 10 + Math.random() * 5,
        y: (i % 2) * 10 + Math.random() * 5,
        r: Math.max(15, Math.min(40, (g.currentAmount / (g.targetAmount || 1)) * 40)) // Radius based on progress
      }],
      backgroundColor: categoryColors[i % categoryColors.length] + 'cc',
      borderColor: vesselBg,
      borderWidth: 2,
    })) : [
      {
        label: 'No Goals',
        data: [{ x: 10, y: 10, r: 25 }, { x: 15, y: 15, r: 35 }, { x: 5, y: 20, r: 20 }],
        backgroundColor: ['#2563ebcc', '#a855f7cc', '#0fee65cc'],
      }
    ]
  };

  const bubbleOptions: ChartOptions<'bubble'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => context.dataset.label || '',
        }
      }
    },
    scales: {
      x: { display: false, min: 0, max: 30 },
      y: { display: false, min: 0, max: 30 }
    }
  };

  return (
    <div className="w-full h-full flex flex-col md:flex-row gap-6 p-1 md:p-6 text-white font-sans max-w-[1400px] mx-auto bg-white rounded-3xl" style={{ backgroundColor: '#fbf9f8' }}>
      
      {/* Left Column: KPIs and Customer Habits */}
      <div className="flex-1 flex flex-col gap-6">
        
        {/* KPI Grid (2x2) */}
        <div className="grid grid-cols-2 gap-6">
          {kpis.map((kpi, idx) => (
            <div 
              key={idx} 
              className="p-5 rounded-[20px] border flex flex-col gap-3 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300"
              style={{
                backgroundColor: kpi.prominent ? brandBlue : vesselBg,
                borderColor: kpi.prominent ? brandBlue : borderLight,
                boxShadow: '0 8px 30px rgba(0,0,0,0.04)'
              }}
            >
              <div className="flex justify-between items-start">
                <div 
                  className="w-10 h-10 rounded-[12px] flex items-center justify-center transition-colors"
                  style={{
                    backgroundColor: kpi.prominent ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                    color: kpi.prominent ? '#ffffff' : textSecondary
                  }}
                >
                  {kpi.icon}
                </div>
                <div 
                  className="px-2 py-1 rounded-md text-[10px] font-bold tracking-wide"
                  style={{
                    backgroundColor: kpi.isPositive ? 'rgba(15, 238, 101, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: kpi.isPositive ? '#0fee65' : '#ef4444'
                  }}
                >
                  {kpi.change}
                </div>
              </div>
              
              <div className="mt-2">
                <p 
                  className="text-xs font-semibold mb-1"
                  style={{ color: kpi.prominent ? 'rgba(255,255,255,0.8)' : textSecondary }}
                >
                  {kpi.title}
                </p>
                <h3 className="text-2xl lg:text-3xl font-bold tracking-tight text-white mb-1">
                  {kpi.value}
                </h3>
                <p 
                  className="text-[10px]"
                  style={{ color: kpi.prominent ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)' }}
                >
                  {kpi.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Customer Habits (Bar Chart) */}
        <div 
          className="p-6 rounded-[24px] border flex flex-col gap-6 flex-1 min-h-[320px] group hover:border-white/20 transition-colors"
          style={{ backgroundColor: vesselBg, borderColor: borderLight }}
        >
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Income vs Expenses</h2>
              <p className="text-xs text-white/50 mt-1">Track your financial habits</p>
            </div>
            
            {/* Period Dropdown */}
            <div className="flex items-center gap-2 cursor-pointer bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 transition-colors">
              <span className="text-xs text-white/70">{habitPeriod}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/50">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#e4e2e2]"></div>
              <span className="text-white/50">Income</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#2563eb]"></div>
              <span className="text-white/50">Expense</span>
            </div>
          </div>
          
          <div className="flex-1 w-full h-full relative">
            <Bar data={habitData} options={habitOptions} />
          </div>
        </div>
      </div>
      
      {/* Right Column: Product Statistics and Customer Growth */}
      <div className="flex-[0.7] flex flex-col gap-6">
        
        {/* Product Statistics (Concentric Rings) */}
        <div 
          className="p-6 rounded-[24px] border flex flex-col gap-6 flex-1 min-h-[380px] group hover:border-white/20 transition-colors"
          style={{ backgroundColor: vesselBg, borderColor: borderLight }}
        >
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Category Breakdown</h2>
              <p className="text-xs text-white/50 mt-1">Track your top expenses</p>
            </div>
            <div className="flex items-center gap-2 cursor-pointer bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 transition-colors">
              <span className="text-xs text-white/70">{statPeriod}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/50">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>
          
          {/* Concentric Chart */}
          <div className="relative flex justify-center items-center h-[200px] my-2">
            <Doughnut data={concentricData} options={concentricOptions} />
            {/* Center Stat */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-10">
              <span className="text-2xl font-bold tracking-tight">
                {expenseByCategory.length > 0 ? `₹${expenseByCategory[0][1]}` : '₹0'}
              </span>
              <span className="text-[10px] text-white/50 uppercase tracking-wider font-semibold mt-1">
                {expenseByCategory.length > 0 ? expenseByCategory[0][0] : 'No Data'}
              </span>
              {expenseByCategory.length > 0 && (
                <div className="mt-2 px-2 py-0.5 rounded text-[9px] font-bold bg-[#0fee65]/10 text-[#0fee65]">
                  {getChange(expenseByCategory[0][1], 0)}
                </div>
              )}
            </div>
          </div>
          
          {/* List Breakdown */}
          <div className="flex flex-col gap-3 mt-auto">
            {expenseByCategory.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors cursor-default">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 text-lg">
                    {idx === 0 ? '💻' : idx === 1 ? '🎮' : '🪑'} 
                  </div>
                  <span className="text-sm font-semibold text-white/90">{cat[0]}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-white">₹{cat[1].toLocaleString()}</span>
                  <div 
                    className="w-12 text-center py-0.5 rounded text-[9px] font-bold"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: categoryColors[idx] }}
                  >
                    +2.3%
                  </div>
                </div>
              </div>
            ))}
            {expenseByCategory.length === 0 && (
              <div className="text-center text-xs text-white/30 py-4">No categorised expenses found.</div>
            )}
          </div>
        </div>

        {/* Customer Growth (Bubble Chart representing Goals) */}
        <div 
          className="p-6 rounded-[24px] border flex flex-col gap-6 group hover:border-white/20 transition-colors"
          style={{ backgroundColor: vesselBg, borderColor: borderLight }}
        >
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Savings Goals</h2>
              <p className="text-xs text-white/50 mt-1">Track progress by target</p>
            </div>
            <div className="flex items-center gap-2 cursor-pointer bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 transition-colors">
              <span className="text-xs text-white/70">{growthPeriod}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/50">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>
          
          <div className="flex items-center gap-4 h-[180px]">
            {/* Bubble Chart Area */}
            <div className="flex-[0.6] h-full relative">
              <Bubble data={bubbleData} options={bubbleOptions} />
            </div>
            
            {/* Legend / List */}
            <div className="flex-[0.4] flex flex-col gap-3 justify-center">
              {goals.slice(0, 3).map((g, idx) => (
                <div key={idx} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 flex items-center justify-center text-[10px] rounded-sm bg-white/10">{idx === 0 ? '🇺🇸' : idx === 1 ? '🇩🇪' : '🇦🇺'}</div>
                      <span className="font-semibold text-white/90 truncate max-w-[70px]" title={g.name}>{g.name}</span>
                    </div>
                    <span className="font-bold">{(g.currentAmount / 1000).toFixed(1)}k</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full" 
                      style={{ 
                        width: `${Math.min(100, (g.currentAmount / (g.targetAmount || 1)) * 100)}%`,
                        backgroundColor: categoryColors[idx % categoryColors.length]
                      }}
                    ></div>
                  </div>
                </div>
              ))}
              {goals.length === 0 && (
                <div className="text-xs text-white/40 italic">No savings goals set.</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
