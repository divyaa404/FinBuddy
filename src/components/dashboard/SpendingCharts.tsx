import React, { useState } from 'react';
import type { Transaction } from '../../types';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { Card } from '../ui/Card';
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
}

export const SpendingCharts: React.FC<SpendingChartsProps> = ({ transactions }) => {
  const [timeframe, setTimeframe] = useState<'week' | 'month'>('week');

  // Category Colors matching Inverted Neon palette
  const categoryColors: { [key: string]: string } = {
    Food: '#0fee65',          // Neon Green
    Transport: '#ffb300',     // Neon Yellow/Orange
    Subscriptions: '#b388ff', // Soft Purple
    Shopping: '#38bdf8',      // Blue
    Entertainment: '#f43f5e', // Rose Red
    Others: '#94a3b8'         // Slate Grey
  };

  // 1. DOUGHNUT CHART DATA: Spending by Category
  const expenseTransactions = transactions.filter(tx => tx.type === 'expense');
  const categoryTotals: { [cat: string]: number } = {};
  
  expenseTransactions.forEach(tx => {
    categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
  });

  const categories = Object.keys(categoryTotals);
  const doughnutData = {
    labels: categories,
    datasets: [
      {
        data: categories.map(cat => categoryTotals[cat]),
        backgroundColor: categories.map(cat => categoryColors[cat] || '#888888'),
        borderColor: '#121212',
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: 'rgba(255,255,255,0.7)',
          font: { family: 'Hanken Grotesk', size: 11 },
          boxWidth: 10,
        },
      },
      tooltip: {
        backgroundColor: '#1b1c1c',
        titleFont: { family: 'Manrope', size: 12, weight: 'bold' },
        bodyFont: { family: 'Hanken Grotesk', size: 12 },
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
      },
    },
    cutout: '70%',
  };

  // 2. BAR CHART DATA: Income vs Expenses (Last 3 Months)
  // Let's gather sums for May, June, July, August 2026 based on timestamp year/month
  const monthlyData: { [key: string]: { income: number; expense: number } } = {};
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  transactions.forEach(tx => {
    const date = new Date(tx.date);
    const mName = monthNames[date.getMonth()];
    if (!monthlyData[mName]) {
      monthlyData[mName] = { income: 0, expense: 0 };
    }
    if (tx.type === 'income') {
      monthlyData[mName].income += tx.amount;
    } else {
      monthlyData[mName].expense += tx.amount;
    }
  });

  const lastMonths = Object.keys(monthlyData).slice(-4); // Take last 4 months with data
  const barData = {
    labels: lastMonths,
    datasets: [
      {
        label: 'Income',
        data: lastMonths.map(m => monthlyData[m].income),
        backgroundColor: '#0fee65', // Neon Green
        borderRadius: 4,
      },
      {
        label: 'Expenses',
        data: lastMonths.map(m => monthlyData[m].expense),
        backgroundColor: '#ffb300', // Yellow
        borderRadius: 4,
      },
    ],
  };

  const barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: 'rgba(255,255,255,0.7)',
          font: { family: 'Hanken Grotesk', size: 10 },
          boxWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: '#1b1c1c',
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10 } },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10 } },
      },
    },
  };

  // 3. LINE CHART DATA: Spending Trend over current week / month
  // Create daily aggregates for line representation
  const getLineData = () => {
    const now = new Date();
    const days = timeframe === 'week' ? 7 : 30;
    const labels: string[] = [];
    const dataset: number[] = [];
    
    // Generate dates
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const label = timeframe === 'week' 
        ? d.toLocaleDateString('en-IN', { weekday: 'short' })
        : d.getDate().toString();
      labels.push(label);

      // Sum expenses for this date
      const dateStr = d.toDateString();
      const dailySum = transactions
        .filter(tx => tx.type === 'expense' && new Date(tx.date).toDateString() === dateStr)
        .reduce((sum, tx) => sum + tx.amount, 0);
      dataset.push(dailySum);
    }

    return { labels, dataset };
  };

  const trend = getLineData();
  
  const lineData = {
    labels: trend.labels,
    datasets: [
      {
        fill: true,
        label: 'Spending',
        data: trend.dataset,
        borderColor: '#0fee65',
        borderWidth: 2,
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return null;
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(15, 238, 101, 0.2)');
          gradient.addColorStop(1, 'rgba(15, 238, 101, 0)');
          return gradient;
        },
        tension: 0.4,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#ffb300',
        pointBorderWidth: 1.5,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const lineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1b1c1c',
        titleColor: '#0fee65',
        bodyColor: '#ffffff',
        displayColors: false,
        callbacks: {
          label: (context) => `Spent: ₹${context.raw}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 } },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { 
          color: 'rgba(255,255,255,0.4)', 
          font: { size: 10 },
          callback: (value) => `₹${value}`,
        },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
      
      {/* 1. Spending Trend Line Chart */}
      <Card variant="vessel" className="col-span-1 md:col-span-2 flex flex-col gap-4 relative">
        <div className="flex justify-between items-center z-10 relative">
          <div className="flex items-center gap-2 text-left">
            <span className="material-symbols-outlined text-white/50">bar_chart</span>
            <span className="font-hanken text-sm font-semibold uppercase tracking-wider text-white">Spending Trend</span>
          </div>
          <div className="flex bg-[#222] p-0.5 rounded-full border border-white/5">
            <button
              onClick={() => setTimeframe('week')}
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                timeframe === 'week' ? 'bg-neon-green text-[#121212]' : 'text-white/60 hover:text-white'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setTimeframe('month')}
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                timeframe === 'month' ? 'bg-neon-green text-[#121212]' : 'text-white/60 hover:text-white'
              }`}
            >
              Month
            </button>
          </div>
        </div>
        
        <div className="h-64 w-full relative mt-2">
          {trend.dataset.every(val => val === 0) ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40">
              <span className="material-symbols-outlined text-4xl mb-1">finance_mode</span>
              <p className="text-xs">No expense data yet to plot trend</p>
            </div>
          ) : (
            <Line data={lineData} options={lineOptions} />
          )}
        </div>
      </Card>

      {/* 2. Category-wise Spending (Doughnut) */}
      <Card variant="vessel" className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-left">
          <span className="material-symbols-outlined text-white/50">pie_chart</span>
          <span className="font-hanken text-sm font-semibold uppercase tracking-wider text-white">By Category</span>
        </div>
        <div className="h-48 w-full relative mt-2">
          {categories.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40">
              <span className="material-symbols-outlined text-4xl mb-1">pie_chart</span>
              <p className="text-xs">No expenses categorized yet</p>
            </div>
          ) : (
            <Doughnut data={doughnutData} options={doughnutOptions} />
          )}
        </div>
      </Card>

      {/* 3. Monthly Income vs Expenses (Bar) */}
      <Card variant="vessel" className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-left">
          <span className="material-symbols-outlined text-white/50">equalizer</span>
          <span className="font-hanken text-sm font-semibold uppercase tracking-wider text-white">Monthly Comparison</span>
        </div>
        <div className="h-48 w-full relative mt-2">
          {transactions.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40">
              <span className="material-symbols-outlined text-4xl mb-1">equalizer</span>
              <p className="text-xs">No monthly tracking logs found</p>
            </div>
          ) : (
            <Bar data={barData} options={barOptions} />
          )}
        </div>
      </Card>

    </div>
  );
};
