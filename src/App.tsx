import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { Transaction, Budget, SavingsGoal } from './types';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import loadingMainAnim from './assets/animations/loading_main.json';

const LottiePlayer = (Lottie as any).default || Lottie;
import { AuthGate } from './components/auth/AuthGate';
import { Navbar } from './components/ui/Navbar';
import { Dock } from './components/ui/Dock';
import { Sidebar } from './components/ui/Sidebar';
import { Card } from './components/ui/Card';
import { GPayModal } from './components/dashboard/GPayModal';
import { downloadStatementPDF } from './utils/pdfGenerator';

// Dashboard Components
import { SpendingCharts } from './components/dashboard/SpendingCharts';
import { StudentFinanceHome } from './components/dashboard/StudentFinanceHome';

// Split Components
import { CreateSplit } from './components/split/CreateSplit';
import { LiveSplitOwner } from './components/split/LiveSplitOwner';
import { SplitParticipant } from './components/split/SplitParticipant';

// Budget & Savings Components
import { BudgetPlanner } from './components/budget/BudgetPlanner';
import { GoalTracker } from './components/savings/GoalTracker';

// Transaction Components
import { TransactionForm } from './components/transactions/TransactionForm';

// Seed Data
const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 't1', amount: 8000, type: 'income', category: 'Income', date: '2026-08-01', note: 'Monthly Pocket Allowance' },
  { id: 't2', amount: 12000, type: 'income', category: 'Income', date: '2026-08-05', note: 'Freelance Frontend Design' },
  { id: 't3', amount: 860, type: 'expense', category: 'Food', date: '2026-08-06', note: 'Swiggy Dinner' },
  { id: 't4', amount: 350, type: 'expense', category: 'Transport', date: '2026-08-04', note: 'Uber cab to campus' },
  { id: 't5', amount: 199, type: 'expense', category: 'Subscriptions', date: '2026-08-02', note: 'Spotify Premium' },
  { id: 't6', amount: 1800, type: 'expense', category: 'Shopping', date: '2026-08-03', note: 'Amazon textbooks & shirt' },
  { id: 't7', amount: 420, type: 'expense', category: 'Food', date: '2026-08-05', note: 'McDonalds lunch' },
  { id: 't8', amount: 150, type: 'expense', category: 'Food', date: '2026-08-06', note: 'Campus Canteen chai' },
  { id: 't9', amount: 120, type: 'expense', category: 'Transport', date: '2026-08-06', note: 'Metro card recharge' },
  { id: 't10', amount: 650, type: 'expense', category: 'Entertainment', date: '2026-08-01', note: 'Movie tickets PVR' }
];

const INITIAL_BUDGETS: Budget[] = [
  { category: 'Food', limit: 4000 },
  { category: 'Transport', limit: 1500 },
  { category: 'Subscriptions', limit: 1000 },
  { category: 'Shopping', limit: 3000 },
  { category: 'Entertainment', limit: 2000 },
  { category: 'Others', limit: 1500 }
];

const INITIAL_GOALS: SavingsGoal[] = [
  { id: 'g1', name: 'iPad for College', targetAmount: 40000, currentAmount: 15000, targetDate: '2026-12-31' },
  { id: 'g2', name: 'Goa Trip with Roomies', targetAmount: 12000, currentAmount: 8000, targetDate: '2026-10-15' }
];

function App() {
  // Navigation & Router
  const [activeTab, setActiveTab] = useState('home');
  const [guestSplitId, setGuestSplitId] = useState<string | null>(null);

  // Global State (LocalStorage synced)
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
  const [budgets, setBudgets] = useLocalStorage<Budget[]>('budgets', INITIAL_BUDGETS);
  const [goals, setGoals] = useLocalStorage<SavingsGoal[]>('goals', INITIAL_GOALS);
  const [activeSplitId, setActiveSplitId] = useLocalStorage<string | null>('active_split_id', null);
  const [balance, setBalance] = useLocalStorage<number>('account_balance', 25000);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleTabChange = (tab: string) => {
    if (tab === activeTab) return;
    setIsTabLoading(true);
    setTimeout(() => {
      setActiveTab(tab);
      setIsTabLoading(false);
    }, 600);
  };

  // Hash-based client router for participant view (#/split/:id)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/split/')) {
        const splitId = hash.split('#/split/')[1];
        setGuestSplitId(splitId);
      } else {
        setGuestSplitId(null);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // CRUD Transaction Operations
  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const transaction: Transaction = {
      ...newTx,
      id: `t_${Date.now()}`
    };
    setTransactions(prev => [transaction, ...prev]);
    
    // Sync balance
    if (newTx.type === 'expense') {
      setBalance(prev => Math.max(0, prev - newTx.amount));
    } else if (newTx.type === 'income') {
      setBalance(prev => prev + newTx.amount);
    }
  };

  const handleUpdateTransaction = (updatedTx: Transaction) => {
    const oldTx = transactions.find(tx => tx.id === updatedTx.id);
    if (oldTx) {
      setBalance(prev => {
        let val = prev;
        // reverse old transaction
        if (oldTx.type === 'expense') val += oldTx.amount;
        else if (oldTx.type === 'income') val = Math.max(0, val - oldTx.amount);
        
        // apply new transaction
        if (updatedTx.type === 'expense') val = Math.max(0, val - updatedTx.amount);
        else if (updatedTx.type === 'income') val += updatedTx.amount;
        
        return val;
      });
    }
    setTransactions(prev => prev.map(tx => tx.id === updatedTx.id ? updatedTx : tx));
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (id: string) => {
    const oldTx = transactions.find(tx => tx.id === id);
    if (oldTx) {
      setBalance(prev => {
        if (oldTx.type === 'expense') return prev + oldTx.amount;
        if (oldTx.type === 'income') return Math.max(0, prev - oldTx.amount);
        return prev;
      });
    }
    setTransactions(prev => prev.filter(tx => tx.id !== id));
  };

  // CRUD Budget Limit updates
  const handleUpdateBudget = (updatedBudget: Budget) => {
    setBudgets(prev => {
      const exists = prev.some(b => b.category === updatedBudget.category);
      if (exists) {
        return prev.map(b => b.category === updatedBudget.category ? updatedBudget : b);
      } else {
        return [...prev, updatedBudget];
      }
    });
  };

  // CRUD Savings Goals Operations
  const handleAddGoal = (newGoal: Omit<SavingsGoal, 'id'>) => {
    const goal: SavingsGoal = {
      ...newGoal,
      id: `g_${Date.now()}`
    };
    setGoals(prev => [...prev, goal]);
  };

  const handleUpdateGoalAmount = (id: string, amount: number) => {
    setGoals(prev => prev.map(g => {
      if (g.id === id) {
        return { ...g, currentAmount: g.currentAmount + amount };
      }
      return g;
    }));
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  // Auto record Split Finalization Transaction from host
  const handleRecordSplitTransaction = (splitTx: Omit<Transaction, 'id'>) => {
    handleAddTransaction(splitTx);
  };

  // Render guest split participant route (completely standalone view, bypassing login gate)
  if (guestSplitId) {
    return <SplitParticipant splitId={guestSplitId} />;
  }

  return (
    <AuthGate>
      {(user: User) => (
        <div className="flex flex-col min-h-screen bg-surface relative md:flex-row">
          
          {/* Web/Desktop Sidebar */}
          <Sidebar 
            user={user} 
            activeTab={activeTab} 
            setActiveTab={handleTabChange} 
            isExpanded={isExpanded} 
            setIsExpanded={setIsExpanded} 
            onPayTrigger={() => setShowPayModal(true)} 
          />

          {/* Mobile Navbar Header */}
          <div className="md:hidden">
            <Navbar user={user} activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>

          {/* Main Application Canvas */}
          <main className={`flex-1 max-w-lg md:max-w-none w-full px-6 pt-24 pb-32 md:pt-12 md:pb-12 md:pr-12 md:mx-0 transition-all duration-300 ${isExpanded ? 'md:pl-80' : 'md:pl-36'}`}>
            
            {isTabLoading ? (
              <div className="min-h-[500px] flex flex-col items-center justify-center w-full">
                <div className="w-40 h-40">
                  <LottiePlayer animationData={loadingMainAnim} loop={true} />
                </div>
                <p className="font-hanken text-[10px] uppercase font-bold tracking-widest text-[#121212]/40 animate-pulse mt-2">
                  Syncing FinBuddy logs...
                </p>
              </div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex flex-col gap-6 w-full"
              >
                {/* 1. HOMEPAGE TAB */}
                {activeTab === 'home' && (
                  <StudentFinanceHome
                    user={user}
                    transactions={transactions}
                    budgets={budgets}
                    balance={balance}
                    setBalance={setBalance}
                    onAddTransaction={handleAddTransaction}
                    onDeleteTransaction={handleDeleteTransaction}
                    onEditTransaction={(tx) => {
                      setEditingTransaction(tx);
                      setShowAddModal(true);
                    }}
                    onTabChange={handleTabChange}
                  />
                )}

            {/* 2. INSIGHTS TAB */}
            {activeTab === 'insights' && (
              <div className="w-full">
                <SpendingCharts transactions={transactions} />
              </div>
            )}

            {/* 3. SPLIT & SETTLE TAB */}
            {activeTab === 'split' && (
              <div className="w-full">
                {activeSplitId ? (
                  <LiveSplitOwner 
                    splitId={activeSplitId}
                    onReset={() => setActiveSplitId(null)}
                    onRecordSplitTransaction={handleRecordSplitTransaction}
                  />
                ) : (
                  <CreateSplit 
                    ownerId={user.uid}
                    ownerName={user.displayName || 'Host'}
                    onCreateSuccess={(id) => setActiveSplitId(id)}
                  />
                )}
              </div>
            )}

            {/* 4. GOALS TAB */}
            {activeTab === 'goals' && (
              <div className="w-full">
                <GoalTracker 
                  goals={goals}
                  onAddGoal={handleAddGoal}
                  onUpdateGoalAmount={handleUpdateGoalAmount}
                  onDeleteGoal={handleDeleteGoal}
                  transactions={transactions}
                />
              </div>
            )}

            {/* 5. BUDGET TAB */}
            {activeTab === 'budget' && (
              <div className="w-full">
                <BudgetPlanner 
                  budgets={budgets}
                  onUpdateBudget={handleUpdateBudget}
                  transactions={transactions}
                />
              </div>
            )}

            {/* 6. PROFILE TAB */}
            {activeTab === 'profile' && (() => {
              const totalIncome = transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);

              const totalExpense = transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

              const savingsRate = totalIncome > 0 
                ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) 
                : 0;

              return (
                <div className="flex flex-col gap-6 w-full text-left">
                  
                  {/* Detailed Student Profile Card */}
                  <Card variant="vessel" className="p-6 border border-white/[0.08] rounded-[28px] relative overflow-hidden flex flex-col gap-6">
                    {/* Glow Accent */}
                    <div className="absolute top-0 right-0 w-36 h-36 bg-neon-green/5 rounded-full blur-2xl pointer-events-none"></div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-5 border-b border-white/5">
                      <img 
                        src={user.photoURL || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsjXR_VSCRGNFnub_Ti3YbTzEUKHVngE2ltAYacbKPmr8vceg4ltYckIztAtwOa7U4tNh01nACESnzWeVsp4G8QUUM8FSA4w5fokkGyS48KZlrDWRutWw6fIkeBnT72XUJHX9EZ6prfFGY7GvaomnU2-3xouz5jA0AAkjsoPFtbrhzBzfpT9VxHsTDEabevPfKLKCzpU04VnwEzFMldcs43237fTBqCGMGwHIYaMU84v7rVwviryh9'} 
                        alt={user.displayName || 'Profile'} 
                        className="w-16 h-16 rounded-full border border-white/10 shadow-lg object-cover" 
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold text-white leading-tight">{user.displayName || 'Guest User'}</h3>
                          <span className="text-[9px] uppercase font-bold bg-neon-green/10 text-neon-green border border-neon-green/20 px-2 py-0.5 rounded-full">
                            Student Account
                          </span>
                        </div>
                        <p className="text-xs text-white/50 mt-1">{user.email}</p>
                      </div>
                    </div>

                    {/* Detailed User Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                        <span className="text-white/40 uppercase font-bold tracking-wider text-[8px]">Student Name</span>
                        <p className="text-white font-medium mt-0.5 text-sm">{user.displayName || 'Guest User'}</p>
                      </div>
                      <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                        <span className="text-white/40 uppercase font-bold tracking-wider text-[8px]">Registered Email</span>
                        <p className="text-white font-medium mt-0.5 text-sm">{user.email || 'N/A'}</p>
                      </div>
                    </div>
                  </Card>

                  {/* Financial Overview Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-[#0B0B0C] border border-white/[0.06] rounded-[20px] p-4 text-left">
                      <span className="text-white/35 text-[8px] uppercase font-bold tracking-wider block">Wallet Balance</span>
                      <span className="text-white font-hanken font-bold text-base md:text-lg block mt-1">₹{balance.toLocaleString()}</span>
                    </div>
                    <div className="bg-[#0B0B0C] border border-white/[0.06] rounded-[20px] p-4 text-left">
                      <span className="text-white/35 text-[8px] uppercase font-bold tracking-wider block">Total Incomes</span>
                      <span className="text-neon-green font-hanken font-bold text-base md:text-lg block mt-1">₹{totalIncome.toLocaleString()}</span>
                    </div>
                    <div className="bg-[#0B0B0C] border border-white/[0.06] rounded-[20px] p-4 text-left">
                      <span className="text-white/35 text-[8px] uppercase font-bold tracking-wider block">Total Spendings</span>
                      <span className="text-red-400 font-hanken font-bold text-base md:text-lg block mt-1">₹{totalExpense.toLocaleString()}</span>
                    </div>
                    <div className="bg-[#0B0B0C] border border-white/[0.06] rounded-[20px] p-4 text-left">
                      <span className="text-white/35 text-[8px] uppercase font-bold tracking-wider block">Savings Ratio</span>
                      <span className="text-blue-400 font-hanken font-bold text-base md:text-lg block mt-1">{savingsRate}%</span>
                    </div>
                  </div>

                  {/* Download Statement PDF Card */}
                  <Card variant="vessel" className="p-5 border border-white/[0.08] rounded-[24px] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-hanken font-bold text-white text-sm">Download Ledger Statement</h4>
                      <p className="text-[10px] text-white/50 mt-1 leading-normal max-w-md">
                        Export all local transaction histories, category budget limits, and active savings milestone records into a clean, formatted PDF document.
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        setPdfLoading(true);
                        await downloadStatementPDF(user, transactions, budgets, goals, balance);
                        setPdfLoading(false);
                      }}
                      disabled={pdfLoading}
                      className="bg-neon-green text-black hover:bg-neon-green/90 disabled:opacity-50 disabled:cursor-not-allowed neon-glow py-3 px-6 rounded-xl font-bold font-hanken text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all duration-200 active:scale-97 cursor-pointer self-stretch md:self-auto text-center justify-center border-none"
                    >
                      <span className={`material-symbols-outlined text-sm font-bold ${pdfLoading ? 'animate-spin' : ''}`}>
                        {pdfLoading ? 'autorenew' : 'picture_as_pdf'}
                      </span>
                      {pdfLoading ? 'Generating...' : 'Download Statement PDF'}
                    </button>
                  </Card>

                  {/* Technical Overview Info */}
                  <div className="text-[9px] text-white/20 flex flex-col sm:flex-row justify-between items-center px-2 py-1 gap-2">
                    <span>Secure Local Ledger Encryption v1.0.0</span>
                  </div>

                </div>
              );
            })()}

              </motion.div>
            )}

          </main>

          {/* Add / Edit Transaction Modal */}
          {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
              <Card variant="vessel" className="w-full max-w-sm p-6 border border-white/10 rounded-2xl shadow-2xl relative bg-[#1e2022]">
                <TransactionForm
                  onAddTransaction={handleAddTransaction}
                  onClose={() => {
                    setShowAddModal(false);
                    setEditingTransaction(null);
                  }}
                  editingTransaction={editingTransaction}
                  onUpdateTransaction={handleUpdateTransaction}
                />
              </Card>
            </div>
          )}

          {/* GPay Modal Overlay */}
          <GPayModal 
            isOpen={showPayModal} 
            onClose={() => setShowPayModal(false)} 
            onAddTransaction={handleAddTransaction} 
          />

          {/* Sticky Bottom Dock */}
          <Dock 
            activeTab={activeTab === 'budget' ? 'goals' : activeTab} 
            setActiveTab={handleTabChange} 
            onPayTrigger={() => setShowPayModal(true)} 
          />

        </div>
      )}
    </AuthGate>
  );
}

export default App;
