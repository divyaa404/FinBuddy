import React, { useState } from 'react';
import type { User } from 'firebase/auth';
import type { Transaction, Budget } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { AnimatedBalance } from './AnimatedBalance';
import Lottie from 'lottie-react';
import trophyAnim from '../../assets/animations/Trophy.json';
import splitCardImg from '../../assets/images/split_card.png';
import { motion } from 'framer-motion';

const LottiePlayer = (Lottie as any).default || Lottie;

interface StudentFinanceHomeProps {
  user: User;
  transactions: Transaction[];
  budgets: Budget[];
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (tx: Transaction) => void;
  onTabChange: (tab: string) => void;
}

export const StudentFinanceHome: React.FC<StudentFinanceHomeProps> = ({
  user,
  transactions,
  budgets,
  balance,
  setBalance,
  onAddTransaction,
  onDeleteTransaction,
  onEditTransaction,
  onTabChange,
}) => {
  // Deposit state
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositNote, setDepositNote] = useState('');

  // Mobile modal state for simple views
  const [showMobileStreaksModal, setShowMobileStreaksModal] = useState(false);

  // Hover state for interactive cards
  const [isHovered, setIsHovered] = useState(false);

  // Intersection observer for Leaderboard scroll detection (replays Lottie by incrementing key)
  const [playCount, setPlayCount] = useState(0);
  const leaderboardRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPlayCount(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );
    const currentRef = leaderboardRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }
    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);
  // Search & filter states
  const [filterView, setFilterView] = useState<'All' | 'Recent' | 'Critical'>('All');
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState('Nov 2025 - Today');

  const displayName = user.displayName || 'Divya Sharma';

  // 1. Calculate stats
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const currentMonthTx = transactions.filter(tx => {
    const d = new Date(tx.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const monthExpenses = currentMonthTx
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const monthIncome = currentMonthTx
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Compute Daily Average (real calculation based on current day of month)
  const currentDay = now.getDate();
  const averageDailyExpense = currentDay > 0 ? Math.round(monthExpenses / currentDay) : 0;

  // 2. Financial Health Score calculation
  const savings = Math.max(0, monthIncome - monthExpenses);
  const savingsRate = monthIncome > 0 ? (savings / monthIncome) : 0;
  const savingsScore = Math.min(100, Math.round((savingsRate / 0.25) * 100)) || 75; // fallback

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
        const overflowRatio = spent / b.limit;
        if (overflowRatio < 1.2) componentsUnderBudget += 0.5;
      }
    });
    adherenceScore = Math.round((componentsUnderBudget / budgets.length) * 100);
  } else {
    adherenceScore = 80;
  }

  const healthScore = Math.round((savingsScore * 0.4) + (adherenceScore * 0.4) + (82 * 0.2));

  let healthLabel = 'Good';
  let healthTip = 'healthy saving & spending habits';
  let healthBgColor = '#0fee65';
  let healthStatusIndicator = '🟢';

  if (healthScore >= 85) {
    healthLabel = 'Excellent';
    healthTip = "You're in great shape this month.";
    healthBgColor = '#0fee65';
    healthStatusIndicator = '🟢';
  } else if (healthScore >= 70) {
    healthLabel = 'Good';
    healthTip = 'on track with monthly targets.';
    healthBgColor = '#0fee65';
    healthStatusIndicator = '🟢';
  } else if (healthScore >= 50) {
    healthLabel = 'Fair';
    healthTip = 'some budget leaks noticed.';
    healthBgColor = '#eab308';
    healthStatusIndicator = '🟡';
  } else {
    healthLabel = 'Needs Attention';
    healthTip = 'high spending rate, low savings.';
    healthBgColor = '#ef4444';
    healthStatusIndicator = '🔴';
  }

  // Radial calculation (dashoffset)
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference - (healthScore / 100) * circumference;

  // 3. Last 7 days real transaction aggregates for hybrid spending line graph
  const getWeeklyTrend = () => {
    const points: number[] = [];
    const labels: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      labels.push(d.toLocaleDateString('en-IN', { weekday: 'short' }));

      const dayStr = d.toDateString();
      const daySum = transactions
        .filter(tx => tx.type === 'expense' && new Date(tx.date).toDateString() === dayStr)
        .reduce((s, tx) => s + tx.amount, 0);
      points.push(daySum);
    }
    return { labels, points };
  };

  const weeklyTrend = getWeeklyTrend();
  const maxWeeklyExpense = Math.max(...weeklyTrend.points, 1000);

  // SVG dimensions for trend graph
  const svgWidth = 500;
  const svgHeight = 160;
  const padding = 20;

  // Generate SVG path for real spending (Neon Green)
  const spendingPath = weeklyTrend.points.map((val, idx) => {
    const x = padding + (idx * (svgWidth - (padding * 2))) / 6;
    const y = svgHeight - padding - (val / maxWeeklyExpense) * (svgHeight - (padding * 2));
    return `${idx === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ');

  // Generate a comparison path for Dorm Average (Soft Purple, Fake/Smooth Bezier)
  const dormAvgPath = `M${padding},${svgHeight - padding - 35} 
    C${svgWidth * 0.25},${svgHeight - padding - 75} 
    ${svgWidth * 0.5},${svgHeight - padding - 15} 
    ${svgWidth * 0.75},${svgHeight - padding - 85} 
    ${svgWidth - padding},${svgHeight - padding - 45}`;

  // Generate a budget threshold limit path (Neon Orange flat dotted line)
  const budgetLimitY = svgHeight - padding - 60; // constant limit representation
  const budgetLimitPath = `M${padding},${budgetLimitY} L${svgWidth - padding},${budgetLimitY}`;

  // 4. Handle Deposit
  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) return;

    setBalance(prev => prev + amt);
    onAddTransaction({
      amount: amt,
      type: 'income',
      category: 'Income',
      date: new Date().toISOString().split('T')[0],
      note: depositNote.trim() || 'Account Deposit'
    });

    setDepositAmount('');
    setDepositNote('');
    setShowDepositForm(false);
  };

  // 5. Recent Transaction list filtering
  const filteredRecentTransactions = transactions
    .filter(tx => {
      // search filter
      if (searchText && !tx.note?.toLowerCase().includes(searchText.toLowerCase()) && !tx.category.toLowerCase().includes(searchText.toLowerCase())) {
        return false;
      }
      // view filters
      if (filterView === 'Recent') {
        // last 3 days
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() - 3);
        return new Date(tx.date) >= limitDate;
      }
      if (filterView === 'Critical') {
        // expenses above 1000
        return tx.type === 'expense' && tx.amount >= 1000;
      }
      return true;
    })
    .slice(0, 5); // 4-5 items as per spec



  // Streak Board Days (Static rendering of 7 days budget streak)
  const STREAK_DAYS = [
    { day: 'M', date: '3', streak: true, active: true },
    { day: 'T', date: '4', streak: true, active: true },
    { day: 'W', date: '5', streak: true, active: true },
    { day: 'T', date: '6', streak: true, active: true },
    { day: 'F', date: '7', streak: true, active: true },
    { day: 'S', date: '8', streak: false, active: false },
    { day: 'S', date: '9', streak: false, active: false }
  ];

  // Leaderboard data
  const LEADERBOARD_DATA = [
    { rank: 1, name: 'Indresh Suresh', score: 96, avatar: '👦', label: '🟢 Excellent' },
    { rank: 2, name: 'Divya Sharma (You)', score: healthScore, avatar: '👩', label: `${healthStatusIndicator} ${healthLabel}` },
    { rank: 3, name: 'Ankita Rajbhar', score: 87, avatar: '👩‍🎓', label: '🟢 Excellent' },
    { rank: 4, name: 'Akshat Sabnis', score: 79, avatar: '👨‍🎓', label: '🟡 Fair' },
    { rank: 5, name: 'Monish Sharma', score: 74, avatar: '👦', label: '🟡 Fair' },
    { rank: 6, name: 'Shashank Sharma', score: 65, avatar: '👨‍💻', label: '🟡 Fair' },
    { rank: 7, name: 'Utkarsh Pandey', score: 48, avatar: '👨‍🎓', label: '🔴 Warning' },
  ];

  return (
    <div className="flex flex-col gap-8 w-full font-sans text-left selection:bg-neon-green selection:text-[#121212]">
      
      {/* ──────────────────────────────
          TOP HEADING & BRIEF SUB-TEXT
          ────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#121212]/5 pb-4">
        <div>
          <h1 className="text-4xl font-extrabold text-[#121212] tracking-tight">
            Welcome, <span className="text-primary">{displayName}</span>
          </h1>
          <p className="font-hanken text-xs text-on-surface-variant font-medium tracking-wide uppercase mt-1">
            Student Finance Dashboard — Technical Overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => onTabChange('split')}
            variant="secondary"
            className="rounded-full text-xs font-semibold px-5 border-[#121212]/15"
          >
            Settle Split Lobby
          </Button>
          <Button
            onClick={() => setShowDepositForm(true)}
            variant="primary"
            className="rounded-full text-xs font-black px-6 shadow-md"
          >
            Deposit Money
          </Button>
        </div>
      </div>

      {/* Inline Deposit Form overlay */}
      {showDepositForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
          <Card variant="vessel" className="w-full max-w-sm p-6 border border-white/10 rounded-[24px] shadow-2xl relative bg-[#121212] text-white">
            <button
              onClick={() => setShowDepositForm(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
            <h3 className="font-hanken text-lg font-bold text-white mb-4">Add Funds to Account</h3>
            <form onSubmit={handleDepositSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] text-white/50 uppercase tracking-wider font-bold">Amount (₹)</label>
                <input
                  type="number"
                  placeholder="Enter amount to add"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-white/5 text-white border border-white/10 focus:border-neon-green outline-none font-bold"
                  required
                  min="1"
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] text-white/50 uppercase tracking-wider font-bold">Description / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Allowance, Part-time salary"
                  value={depositNote}
                  onChange={(e) => setDepositNote(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-white/5 text-white border border-white/10 focus:border-neon-green outline-none"
                />
              </div>
              <Button type="submit" variant="primary" className="w-full py-3 mt-2 text-xs font-bold uppercase tracking-wider">
                Confirm Deposit
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* ──────────────────────────────
          1. HEADER METRIC GRID (Dark, mimicking image_1.png style)
          ────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Total Balance */}
        <Card variant="vessel" className="bg-[#121212] text-white p-5 rounded-[24px] border border-white/[0.08] flex flex-col justify-between relative overflow-hidden min-h-[160px] group shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-neon-green/5 rounded-full blur-[30px] pointer-events-none"></div>
          <div className="flex justify-between items-start z-10">
            <span className="font-hanken text-[10px] uppercase font-bold tracking-widest text-white/50">Total Balance</span>
            <span className="material-symbols-outlined text-neon-green text-sm">account_balance_wallet</span>
          </div>
          <div className="my-2 text-left z-10">
            <div className="text-3xl font-extrabold tracking-tight numeric-display text-white">
              <AnimatedBalance value={balance} />
            </div>
            <button
              onClick={() => setShowDepositForm(true)}
              className="text-[9px] uppercase tracking-wider text-neon-green font-bold hover:underline mt-1 bg-neon-green/10 px-2 py-0.5 rounded border border-neon-green/20"
            >
              + Quick Deposit
            </button>
          </div>
          {/* Subtle sparkline trend preview */}
          <div className="w-full h-8 mt-2 opacity-60 z-10">
            <svg className="w-full h-full stroke-neon-green stroke-2 fill-none" viewBox="0 0 100 20" preserveAspectRatio="none">
              <path d="M0,15 Q20,5 40,12 T80,3 T100,8" />
            </svg>
          </div>
        </Card>

        {/* Card 2: Spending Trend (Hybrid Fake/Real Line Graph) */}
        <Card variant="vessel" className="bg-[#121212] text-white p-5 rounded-[24px] border border-white/[0.08] flex flex-col justify-between relative overflow-hidden min-h-[160px] col-span-1 lg:col-span-1 shadow-xl">
          <div className="flex justify-between items-start">
            <span className="font-hanken text-[10px] uppercase font-bold tracking-widest text-white/50">Spending Trend (7D)</span>
            <span className="text-[10px] text-neon-green font-mono">₹{monthExpenses.toLocaleString()} Total</span>
          </div>
          
          {/* Detailed multi-line SVG trend representation */}
          <div className="w-full h-16 my-2 relative">
            <svg className="w-full h-full pointer-events-none" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
              {/* Reference Grid lines */}
              <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <line x1={padding} y1={svgHeight/2} x2={svgWidth - padding} y2={svgHeight/2} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
              
              {/* Path 1: Budget Limit (Neon Orange Dotted) */}
              <path d={budgetLimitPath} stroke="#f97316" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
              
              {/* Path 2: Dorm Average (Soft Purple Dashed) */}
              <path d={dormAvgPath} stroke="#b388ff" strokeWidth="1.5" strokeDasharray="6 4" fill="none" />
              
              {/* Path 3: User Real Expenses (Neon Green glowing solid) */}
              <path d={spendingPath} stroke="#0fee65" strokeWidth="2.5" fill="none" style={{ filter: 'drop-shadow(0 0 3px #0fee6580)' }} />
            </svg>
          </div>

          <div className="flex items-center justify-between text-[9px] text-white/40 font-mono border-t border-white/5 pt-1 mt-1">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-neon-green"></span>You</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#b388ff]"></span>Dorm</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#f97316]"></span>Limit</span>
          </div>
        </Card>

        {/* Card 3: Average Daily Expense */}
        <Card variant="vessel" className="bg-[#121212] text-white p-5 rounded-[24px] border border-white/[0.08] flex flex-col justify-between relative overflow-hidden min-h-[160px] shadow-xl">
          <div className="flex justify-between items-start">
            <span className="font-hanken text-[10px] uppercase font-bold tracking-widest text-white/50">Avg Daily Expense</span>
            <span className="material-symbols-outlined text-white/40 text-sm">schedule</span>
          </div>
          <div className="my-1 text-left">
            <span className="text-3xl font-extrabold tracking-tight numeric-display text-white">₹{averageDailyExpense.toLocaleString()}</span>
            <span className="text-white/40 text-xs font-semibold"> / day</span>
          </div>
          {/* Student profiles list */}
          <div className="flex items-center gap-1 border-t border-white/5 pt-2 mt-2">
            <div className="flex -space-x-2 overflow-hidden">
              <span className="inline-block w-5 h-5 rounded-full bg-purple-600/30 text-[9px] flex items-center justify-center border border-white/10" title="Rohan">☕</span>
              <span className="inline-block w-5 h-5 rounded-full bg-blue-600/30 text-[9px] flex items-center justify-center border border-white/10" title="Priya">🍔</span>
              <span className="inline-block w-5 h-5 rounded-full bg-amber-600/30 text-[9px] flex items-center justify-center border border-white/10" title="Amit">🛺</span>
              <span className="inline-block w-5 h-5 rounded-full bg-[#121212] text-[7px] text-white/40 flex items-center justify-center border border-white/10">+3</span>
            </div>
            <span className="text-[9px] text-white/40 font-mono ml-2">Shared expenses log active</span>
          </div>
        </Card>

        {/* Card 4: Financial Health Score circular gauge */}
        <Card variant="vessel" className="bg-[#121212] text-white p-5 rounded-[24px] border border-white/[0.08] flex flex-col justify-between relative overflow-hidden min-h-[160px] shadow-xl">
          <div className="flex justify-between items-start">
            <span className="font-hanken text-[10px] uppercase font-bold tracking-widest text-white/50">Financial Health</span>
            <span className="text-[10px] text-neon-green font-bold">Excellent</span>
          </div>
          <div className="flex items-center justify-between gap-2 my-1">
            <div className="text-left">
              <div className="flex items-baseline">
                <span className="text-3xl font-extrabold numeric-display text-white">{healthScore}</span>
                <span className="text-white/40 text-xs">/100</span>
              </div>
              <p className="text-[9px] text-white/50 font-sans mt-0.5 max-w-[120px]">{healthStatusIndicator} {healthTip}</p>
            </div>
            
            {/* Health Score circle progress gauge */}
            <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" fill="none" r={radius} stroke="#1b1c1c" strokeWidth="12" />
                <circle 
                  cx="50" 
                  cy="50" 
                  fill="none" 
                  r={radius} 
                  stroke={healthBgColor} 
                  strokeDasharray={circumference} 
                  strokeDashoffset={dashoffset} 
                  strokeLinecap="round" 
                  strokeWidth="12"
                  className="transition-all duration-1000 ease-out"
                  style={{ filter: `drop-shadow(0 0 4px ${healthBgColor}60)` }}
                />
              </svg>
              <span className="text-[9px] font-bold text-white/80">{healthScore}%</span>
            </div>
          </div>
          <div className="text-[8px] text-white/30 font-mono border-t border-white/5 pt-1 mt-1">
            Budget adherence rate: {adherenceScore}%
          </div>
        </Card>

      </div>

      {/* ──────────────────────────────
          SOCIAL STREAK & LEADERBOARD (Web side-by-side / Mobile compact card trigger)
          ────────────────────────────── */}
      <div className="block lg:grid lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Col 1: Streak Stack */}
        <div className="hidden lg:flex lg:col-span-4 flex-col gap-4">
          {/* Card 1.1: Streak Board (Short height) */}
          <Card variant="light" className="bg-[#ffffff] text-[#121212] p-4.5 rounded-[24px] border border-outline-variant/30 flex flex-col gap-3 text-left shadow-md">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <span className="text-neon-green">🔥</span>
                <span className="font-hanken text-xs font-black uppercase tracking-wider text-[#121212]">Daily Streak</span>
              </div>
              <span className="text-[9px] bg-[#0fee65]/15 text-[#006626] border border-[#0fee65]/35 px-2 py-0.5 rounded-full font-bold">5 Days</span>
            </div>
            
            {/* 7-day streak board calendar dots */}
            <div className="grid grid-cols-7 gap-1 bg-[#f5f3f3] p-2.5 rounded-xl border border-black/5 text-center">
              {STREAK_DAYS.map((dayObj, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-[8px] text-black/40 uppercase font-semibold">{dayObj.day}</span>
                  <div className={`w-6.5 h-6.5 rounded-full flex items-center justify-center transition-all ${
                    dayObj.streak 
                      ? 'bg-neon-green/20 border border-neon-green/45 text-neon-green shadow-[0_0_8px_rgba(15,238,101,0.2)]' 
                      : 'bg-black/5 border border-black/5 text-black/30'
                  }`}>
                    {dayObj.streak ? (
                      <span className="material-symbols-outlined text-[10px] font-bold">check</span>
                    ) : (
                      <span className="text-[9px] font-mono">{dayObj.date}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[9px] text-black/40 leading-relaxed font-sans">
              Sunday settlements increase health multipliers!
            </p>
          </Card>

          {/* Card 1.2: Streak Rewards (Added below Streak Card) */}
          <Card variant="light" className="bg-[#ffffff] text-[#121212] p-4.5 rounded-[24px] border border-outline-variant/30 flex flex-col justify-between text-left shadow-md flex-1">
            <div className="flex justify-between items-center">
              <span className="font-hanken text-[10px] uppercase font-bold tracking-wider text-[#121212]">Streak Rewards</span>
              <span className="text-[9px] text-[#006e2a] font-bold">1.2x Boost Active</span>
            </div>
            <div className="my-1.5">
              <div className="flex justify-between text-[9px] text-black/50 mb-1">
                <span>Logging Multiplier Progress</span>
                <span>5/10 Days</span>
              </div>
              <div className="w-full h-1.5 bg-[#f5f3f3] rounded-full overflow-hidden border border-black/5">
                <div className="h-full bg-neon-green w-1/2 rounded-full" />
              </div>
            </div>
            <p className="text-[9px] text-black/50 leading-relaxed font-sans">
              Log daily allowance and expenses to claim the Leaderboard Multiplier.
            </p>
          </Card>
        </div>

        {/* Col 2: Split Promotional Stack */}
        <div className="hidden lg:flex lg:col-span-4 flex-col gap-4">
  {/* Card 2.1: Split Promotional Card */}
  <div 
    className="bg-[#1e2022] text-white rounded-[24px] p-4.5 relative overflow-hidden flex flex-col justify-between border border-white/10 shadow-xl min-h-[155px] cursor-pointer group active:scale-[0.98] transition-all duration-300"
    onClick={() => onTabChange('split')}
    onMouseEnter={() => setIsHovered(true)}
    onMouseLeave={() => setIsHovered(false)}
  >
    <div className="absolute inset-0 opacity-15 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-neon-green via-transparent to-transparent pointer-events-none"></div>
    
    <div className="flex justify-between items-start relative z-10 w-full">
      <div className="flex flex-col gap-1 text-left max-w-[65%]">
        <span className="text-[9px] uppercase tracking-wider text-neon-green font-extrabold px-2 py-0.5 rounded bg-neon-green/10 border border-neon-green/20 self-start">
          Quick Split
        </span>
        <h3 className="font-hanken font-bold text-xs text-white mt-1.5 leading-tight">Split bills. Settle faster.</h3>
        <p className="text-[9px] text-white/50 leading-relaxed font-sans mt-1">Set up live roomie split sessions with QR scanning.</p>
      </div>
      
      {/* Rotated split card image on right */}
      <div className="absolute -right-2 top-0 w-30 h-16 overflow-hidden pointer-events-none flex items-center justify-center">
        <img 
          src={splitCardImg} 
          alt="Split Card" 
          className="w-full h-auto object-contain transform rotate-6 drop-shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12" 
        />
      </div>
    </div>

    {/* Animated Sliding Button Effect */}
    <div className="relative z-10 w-full h-[36px] bg-neon-green rounded-xl overflow-hidden mt-2 shadow-[0_4px_12px_rgba(15,238,101,0.25)] border-none">
      {/* Sliding Background */}
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: isHovered ? "0%" : "-100%" }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 bg-white z-0 rounded-xl"
      />

      {/* Button Content Wrapper */}
      <div className="relative z-10 flex items-center justify-center w-full h-full overflow-hidden">
        {/* Default State */}
        <motion.div
          initial={false}
          animate={{
            y: isHovered ? 28 : 0,
            opacity: isHovered ? 0 : 1,
          }}
          transition={{ duration: 0.3 }}
          className="absolute flex items-center justify-center gap-1.5 font-hanken font-bold text-[10px] text-[#121212]"
        >
          <span>Split a bill</span>
          <span className="material-symbols-outlined text-[12px] font-bold">arrow_forward</span>
        </motion.div>

        {/* Hover State */}
        <motion.div
          initial={false}
          animate={{
            y: isHovered ? 0 : -28,
            opacity: isHovered ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
          className="absolute flex items-center justify-center gap-1.5 font-hanken font-bold text-[10px] text-black"
        >
          <motion.span
            initial={{ x: -8, opacity: 0 }}
            animate={{
              x: isHovered ? 0 : -8,
              opacity: isHovered ? 1 : 0,
            }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="flex items-center"
          >
            <span className="material-symbols-outlined text-[12px] font-bold">arrow_forward</span>
          </motion.span>
          <span>Settle Now</span>
        </motion.div>
      </div>
    </div>
  </div>

  {/* Card 2.2: Roomie Dues Card */}
  <Card variant="light" className="bg-[#ffffff] text-[#121212] p-4.5 rounded-[24px] border border-outline-variant/30 flex flex-col justify-between text-left shadow-md flex-1">
    <div className="flex justify-between items-center">
      <span className="font-hanken text-[10px] uppercase font-bold tracking-wider text-[#121212]">Roomie Dues Status</span>
      <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        No Dues
      </span>
    </div>
    <div className="flex items-center gap-1 mt-1">
      <div className="flex -space-x-1.5 overflow-hidden">
        <span className="inline-flex w-5 h-5 rounded-full bg-emerald-100 border border-white text-[9px] items-center justify-center" title="Rohan">👦</span>
        <span className="inline-flex w-5 h-5 rounded-full bg-emerald-100 border border-white text-[9px] items-center justify-center" title="Priya">👩‍🎓</span>
        <span className="inline-flex w-5 h-5 rounded-full bg-emerald-100 border border-white text-[9px] items-center justify-center" title="Amit">👨‍🎓</span>
      </div>
      <span className="text-[9px] text-black/40 font-mono ml-1.5">Rohan, Priya & Amit cleared</span>
    </div>
    <p className="text-[9px] text-black/50 leading-relaxed font-sans mt-1">
      All balances are settled for <code className="bg-black/5 px-1 py-0.5 rounded text-black/70">#COLAB-LUNCH-310</code>.
    </p>
  </Card>
</div>

        {/* Col 3: Dorm Leaderboard Card (Dark aspect-[3/4] size) */}
        <div className="hidden lg:block lg:col-span-4">
          <Card variant="vessel" className="bg-[#121212] text-white p-5 rounded-[24px] border border-white/[0.08] h-full flex flex-col justify-between text-left shadow-xl aspect-[3/4] min-h-[220px]">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-neon-green text-sm">trophy</span>
                <span className="font-hanken text-xs font-semibold uppercase tracking-wider text-white">Dorm Leaderboard</span>
              </div>
              <span className="text-[9px] bg-neon-green/10 text-neon-green border border-neon-green/20 px-2 py-0.5 rounded-full font-bold">Lobby #3</span>
            </div>
            
            {/* Big Centered Lottie Trophy Animation */}
            <div className="w-full flex justify-center py-0 -my-3 flex-shrink-0" ref={leaderboardRef}>
              <div className="w-52 h-52">
                <LottiePlayer key={playCount} animationData={trophyAnim} loop={false} autoplay={true} />
                </div>
            </div>
            
            {/* Leaderboard list showing all 7 members */}
            <div className="flex flex-col gap-1.5 mt-1">
              {LEADERBOARD_DATA.map((player) => {
                const isUser = player.name.includes('(You)');
                return (
                  <div 
                    key={player.rank} 
                    className={`flex justify-between items-center px-3 py-1 rounded-xl border ${
                      isUser 
                        ? 'bg-neon-green/5 border-neon-green/20' 
                        : 'bg-white/5 border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white/40 w-4">#{player.rank}</span>
                      <span className={`text-[11px] ${isUser ? 'font-bold text-neon-green' : 'text-white/80'}`}>{player.name.split(' ')[0]}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] uppercase tracking-wider text-white/40 font-mono">{player.label.split(' ')[0]}</span>
                      <span className="text-xs font-bold numeric-display text-white">{player.score}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-white/5 pt-2 text-[9px] text-white/40 flex justify-between items-center mt-1">
              <span>Reset: Sun 12 AM</span>
              <span className="text-neon-green font-bold">Top 5% rewarded</span>
            </div>
          </Card>
        </div>

        {/* Mobile View Toggle card (Simple view all button) */}
        <div className="block lg:hidden w-full">
          <Card 
            variant="vessel" 
            className="bg-[#121212] text-white p-5 rounded-[24px] border border-white/[0.08] flex items-center justify-between cursor-pointer"
            onClick={() => setShowMobileStreaksModal(true)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 -my-2 flex-shrink-0">
                <LottiePlayer animationData={trophyAnim} loop={false} autoplay={true} />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold text-white">Streaks, Split & Leaderboard</h4>
                <p className="text-[10px] text-white/50">Dorm Rank #3 • 5 Day Streak • Active Split</p>
              </div>
            </div>
            <Button
              variant="secondary"
              className="py-1 px-3 text-[10px] rounded-full uppercase tracking-wider bg-white/10 hover:bg-white/15 border-none text-white cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setShowMobileStreaksModal(true);
              }}
            >
              View All
            </Button>
          </Card>
        </div>

      </div>

      {/* Mobile Streaks & Leaderboard Modal */}
      {showMobileStreaksModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in lg:hidden">
          <Card variant="vessel" className="w-full max-w-sm p-6 border border-white/10 rounded-[24px] shadow-2xl relative bg-[#121212] text-white flex flex-col gap-5">
            <button
              onClick={() => setShowMobileStreaksModal(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
            
            {/* Streak widget section */}
            <div className="flex flex-col gap-3 text-left">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1">
                  <span>🔥</span> Streak Board
                </h4>
                <span className="text-xs text-neon-green font-bold font-mono">5 Days Active</span>
              </div>
              <div className="grid grid-cols-7 gap-1 bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                {STREAK_DAYS.map((dayObj, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <span className="text-[9px] text-white/40 uppercase font-semibold">{dayObj.day}</span>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      dayObj.streak 
                        ? 'bg-neon-green/20 border border-neon-green/45 text-neon-green' 
                        : 'bg-white/5 border border-white/5 text-white/30'
                    }`}>
                      {dayObj.streak ? '✓' : dayObj.date}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Split promo link section */}
            <div className="flex flex-col gap-3 text-left border-t border-white/5 pt-4">
              <div 
                className="flex justify-between items-center cursor-pointer hover:opacity-90"
                onClick={() => { setShowMobileStreaksModal(false); onTabChange('split'); }}
              >
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-neon-green text-sm">groups</span> Split Lobby
                </h4>
                <div className="flex items-center gap-1 text-[10px] text-neon-green font-bold">
                  <span>Go to Split</span>
                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </div>
              </div>
            </div>

            {/* Leaderboard section */}
            <div className="flex flex-col gap-3 text-left border-t border-white/5 pt-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-neon-green text-sm">trophy</span> Leaderboard
                </h4>
                <div className="w-10 h-10 -my-2">
                  <LottiePlayer animationData={trophyAnim} loop={false} autoplay={true} />
                </div>
              </div>
              <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto">
                {LEADERBOARD_DATA.map((player) => {
                  const isUser = player.name.includes('(You)');
                  return (
                    <div 
                      key={player.rank} 
                      className={`flex justify-between items-center px-3 py-1.5 rounded-lg border ${
                        isUser 
                          ? 'bg-neon-green/5 border-neon-green/20' 
                          : 'bg-white/5 border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white/40">#{player.rank}</span>
                        <span className="text-xs">{player.name}</span>
                      </div>
                      <span className="text-xs font-bold numeric-display text-white">{player.score}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ──────────────────────────────
          MIDDLE FILTER AND VIEW ROW (mimicking image_1.png sub-filters)
          ────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#121212] p-4 rounded-[24px] border border-white/[0.08] shadow-md text-white">
        {/* View Pills */}
        <div className="flex bg-white/5 p-1 rounded-full border border-white/5 self-start">
          {(['All', 'Recent', 'Critical'] as const).map(view => {
            const isSelected = filterView === view;
            return (
              <button
                key={view}
                onClick={() => setFilterView(view)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-[#ffffff] text-[#121212] font-black' 
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {view}
              </button>
            );
          })}
        </div>

        {/* Date Picker & Search input box */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs bg-white/5 text-white border border-white/10 outline-none pr-8 cursor-pointer"
            >
              <option value="Nov 2025 - Today">November 2025 - Today</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
            </select>
          </div>
          <div className="relative flex-1 sm:w-48">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-white/30 text-sm">search</span>
            <input
              type="text"
              placeholder="Search transaction..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-8 pr-4 py-2 rounded-xl text-xs bg-white/5 text-white border border-white/10 outline-none focus:border-neon-green"
            />
          </div>
        </div>
      </div>

      {/* ──────────────────────────────
          MAIN CONTENT BODY (Split Layout)
          ────────────────────────────── */}
      <div className="w-full">
        
        {/* Recent Transactions (Light Mode, Mimicking list layout in image_1.png) */}
        <Card 
          variant="light" 
          className="bg-[#ffffff] text-[#121212] p-6 rounded-[24px] border border-outline-variant/30 shadow-md flex flex-col gap-4 text-left w-full"
        >
          <div className="flex justify-between items-center border-b border-black/5 pb-3">
            <div>
              <h3 className="font-hanken text-sm font-black uppercase tracking-wider text-[#121212]">
                RECENT TRANSACTIONS
              </h3>
              <span className="text-[10px] text-black/50">Real-time ledger audit log</span>
            </div>
            <span className="text-xs bg-black/5 text-[#121212] border border-black/10 px-2 py-0.5 rounded-full font-bold">
              {filteredRecentTransactions.length} logs
            </span>
          </div>

          {filteredRecentTransactions.length === 0 ? (
            <div className="py-12 text-center text-black/40 flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-4xl mb-2 text-black/20">receipt_long</span>
              <p className="text-xs font-semibold">No recent transactions matches filters</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredRecentTransactions.map((tx) => {
                const isIncome = tx.type === 'income';
                
                // Category Icons
                let icon = 'credit_card';
                if (tx.category === 'Food') icon = 'coffee';
                else if (tx.category === 'Transport') icon = 'directions_bus';
                else if (tx.category === 'Shopping') icon = 'book';
                else if (tx.category === 'Subscriptions') icon = 'subscriptions';
                else if (tx.category === 'Income') icon = 'payments';

                return (
                  <div 
                    key={tx.id}
                    className="flex justify-between items-center bg-[#fbf9f8] hover:bg-[#efeded]/50 p-3 rounded-xl border border-black/5 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center bg-white border border-black/5 shadow-sm text-lg`}>
                        <span className="material-symbols-outlined text-sm font-bold text-black/70">
                          {icon}
                        </span>
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-[#121212] leading-tight">
                          {tx.note || tx.category}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] text-emerald-700 font-extrabold uppercase bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            {tx.category}
                          </span>
                          <span className="text-[9px] text-black/40 font-mono">
                            {tx.date}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-extrabold numeric-display ${
                        isIncome ? 'text-[#008037]' : 'text-[#121212]'
                      }`}>
                        {isIncome ? '+' : '-'}₹{tx.amount.toLocaleString()}
                      </span>
                      
                      {/* Custom Status Chips mimicking invoice status */}
                      <span className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-full ${
                        isIncome 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {isIncome ? 'Settled' : 'Paid'}
                      </span>

                      {/* Edit & Delete Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditTransaction(tx)}
                          className="w-5 h-5 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-black/60 hover:text-black transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-[12px] font-bold">edit</span>
                        </button>
                        <button
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="w-5 h-5 rounded-full bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-600 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-[12px] font-bold">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          <Button
            variant="secondary"
            onClick={() => onTabChange('insights')}
            className="w-full text-xs py-2 mt-2 border-[#121212]/15 text-[#121212]"
          >
            Analyze Spending Breakdown
          </Button>
        </Card>

      </div>

      {/* ──────────────────────────────
          TECHNICAL STATUS FOOTER
          ────────────────────────────── */}
      <div className="flex justify-between items-center text-[9px] text-[#121212]/40 font-mono border-t border-[#121212]/5 pt-4 mt-6">
        <span>System Status: 🟢 Fully Operational</span>
        <span>Secured API Encrypted (Local-State Sync Mode)</span>
      </div>

    </div>
  );
};
