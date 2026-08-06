import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { Transaction, Budget, SavingsGoal } from './types';
import { AuthGate } from './components/auth/AuthGate';
import { Navbar } from './components/ui/Navbar';
import { Dock } from './components/ui/Dock';
import { Sidebar } from './components/ui/Sidebar';
import { Card } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { GPayModal } from './components/dashboard/GPayModal';
import splitCardImg from './assets/images/split_card.png';

// Dashboard Components
import { FinancialHealthHero } from './components/dashboard/FinancialHealthHero';
import { QuickStats } from './components/dashboard/QuickStats';
import { DailySafeToSpend } from './components/dashboard/DailySafeToSpend';
import { SpendingCharts } from './components/dashboard/SpendingCharts';

// Split Components
import { CreateSplit } from './components/split/CreateSplit';
import { LiveSplitOwner } from './components/split/LiveSplitOwner';
import { SplitParticipant } from './components/split/SplitParticipant';

// Budget & Savings Components
import { BudgetPlanner } from './components/budget/BudgetPlanner';
import { GoalTracker } from './components/savings/GoalTracker';

// Transaction Components
import { TransactionForm } from './components/transactions/TransactionForm';
import { TransactionList } from './components/transactions/TransactionList';

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

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);

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
  };

  const handleUpdateTransaction = (updatedTx: Transaction) => {
    setTransactions(prev => prev.map(tx => tx.id === updatedTx.id ? updatedTx : tx));
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (id: string) => {
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
        <div className="flex flex-col min-h-screen bg-[#fbf9f8] relative md:flex-row">
          
          {/* Web/Desktop Sidebar */}
          <Sidebar 
            user={user} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
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
            
            {/* 1. HOMEPAGE TAB */}
            {activeTab === 'home' && (
              <div className="flex flex-col gap-6 w-full">
                
                {/* Financial Health radial meter */}
                <FinancialHealthHero transactions={transactions} budgets={budgets} />

                {/* Safe-To-Spend metric & Quick totals cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  <DailySafeToSpend transactions={transactions} budgets={budgets} />
                  <div className="bg-[#121212] p-5 rounded-2xl border border-white/[0.08] flex flex-col justify-center items-center text-center text-white relative overflow-hidden h-full">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-neon-green/5 rounded-full blur-[40px] pointer-events-none"></div>
                    <span className="material-symbols-outlined text-neon-green text-3xl mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>add_card</span>
                    <h4 className="font-hanken text-[10px] uppercase font-bold tracking-wider text-white/50">Ledger Entry</h4>
                    <p className="text-xs text-white/70 max-w-[220px] mt-1 mb-4">Instantly record daily expense logs with note keywords auto-categories.</p>
                    <Button 
                      onClick={() => setShowAddModal(true)} 
                      variant="primary" 
                      className="gap-1.5 px-6 font-bold"
                    >
                      <span className="material-symbols-outlined text-sm font-bold">add</span>
                      Log Expense
                    </Button>
                  </div>
                </div>

                {/* Split Bill Promotional Bridge Card */}
                <div 
                  className="bg-[#121212] text-white rounded-[24px] p-6 relative overflow-hidden flex justify-between items-center border border-white/5 shadow-xl min-h-[148px] cursor-pointer group active:scale-98 transition-all duration-300"
                  onClick={() => setActiveTab('split')}
                >
                  <div className="absolute inset-0 opacity-15 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-neon-green via-transparent to-transparent pointer-events-none"></div>
                  <div className="flex flex-col gap-4 relative z-10 max-w-[60%]">
                    <div className="flex flex-col gap-1 text-left">
                      <span className="text-[9px] uppercase tracking-wider text-neon-green font-extrabold px-2 py-0.5 rounded bg-neon-green/10 border border-neon-green/20 self-start">
                        Quick Split
                      </span>
                      <h3 className="font-hanken font-bold text-lg text-white mt-1.5">Split bills. Settle faster.</h3>
                      <p className="text-xs text-white/50 leading-relaxed font-sans">Set up live roomie split sessions with QR scanning.</p>
                    </div>
                    <button className="bg-neon-green text-[#121212] px-4 py-2 rounded-full font-hanken font-bold text-[11px] self-start flex items-center gap-1.5 group-hover:scale-105 active:scale-95 transition-all shadow-[0_4px_12px_rgba(15,238,101,0.25)] cursor-pointer">
                      Split a bill
                      <span className="material-symbols-outlined text-[14px] font-bold">arrow_forward</span>
                    </button>
                  </div>
                  <div className="absolute top-1/2 -translate-y-1/2 right-2 md:right-8 w-32 h-32 md:w-40 md:h-40 overflow-hidden pointer-events-none flex items-center justify-center">
                    <img 
                      src={splitCardImg} 
                      alt="Split Card" 
                      className="w-full h-auto object-contain transform rotate-6 drop-shadow-xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12" 
                    />
                  </div>
                </div>

                {/* Horizontal scroll cards: income, expense, savings */}
                <QuickStats transactions={transactions} />

                {/* Recent Transaction Logs */}
                <TransactionList 
                  transactions={transactions} 
                  onDeleteTransaction={handleDeleteTransaction}
                  onEditTransaction={(tx) => {
                    setEditingTransaction(tx);
                    setShowAddModal(true);
                  }}
                />

              </div>
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
            {activeTab === 'profile' && (
              <Card variant="vessel" className="p-6 border border-white/[0.08] rounded-[24px] text-left flex flex-col gap-6">
                <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                  <img 
                    src={user.photoURL || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsjXR_VSCRGNFnub_Ti3YbTzEUKHVngE2ltAYacbKPmr8vceg4ltYckIztAtwOa7U4tNh01nACESnzWeVsp4G8QUUM8FSA4w5fokkGyS48KZlrDWRutWw6fIkeBnT72XUJHX9EZ6prfFGY7GvaomnU2-3xouz5jA0AAkjsoPFtbrhzBzfpT9VxHsTDEabevPfKLKCzpU04VnwEzFMldcs43237fTBqCGMGwHIYaMU84v7rVwviryh9'} 
                    alt={user.displayName || 'Profile'} 
                    className="w-14 h-14 rounded-full border border-white/10" 
                  />
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight">{user.displayName || 'Guest User'}</h3>
                    <p className="text-xs text-white/50">{user.email}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-4 text-xs">
                  <div>
                    <h4 className="font-hanken font-bold uppercase tracking-wider text-neon-green mb-1.5">Project Overview</h4>
                    <p className="text-white/70 leading-relaxed font-sans">
                      FinBuddy is a Student Finance Dashboard optimized for budgeting, tracking, and peer splitting. Built using React, Tailwind CSS v4, Chart.js, and Firebase Firestore for high-fidelity interactive sync.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-hanken font-bold uppercase tracking-wider text-neon-green mb-1.5">Firestore Connection</h4>
                    <p className="text-white/70 leading-relaxed font-sans">
                      Split & Settle sessions are live synced using Firestore collections. Tapping "Split Now" computes debts instantly, pushing balances to joined roomies via listeners.
                    </p>
                  </div>

                  <div className="border-t border-white/5 pt-4 flex justify-between items-center text-[10px] text-white/40">
                    <span>Host ID: {user.uid}</span>
                    <span>Version 1.0.0 (Hackathon scope)</span>
                  </div>
                </div>
              </Card>
            )}

          </main>

          {/* Add / Edit Transaction Modal */}
          {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
              <Card variant="vessel" className="w-full max-w-sm p-6 border border-white/10 rounded-2xl shadow-2xl relative">
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
            setActiveTab={setActiveTab} 
            onPayTrigger={() => setShowPayModal(true)} 
          />

        </div>
      )}
    </AuthGate>
  );
}

export default App;
