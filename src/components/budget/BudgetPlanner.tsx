import React, { useState, useEffect } from 'react';
import type { Budget, Transaction, WishItem } from '../../types';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface BudgetPlannerProps {
  budgets: Budget[];
  onUpdateBudget: (budget: Budget) => void;
  transactions: Transaction[];
  balance?: number;
  onAddTransaction?: (tx: Omit<Transaction, 'id'>) => void;
}

const CATEGORIES = ['Food', 'Transport', 'Subscriptions', 'Shopping', 'Entertainment', 'Others'];

export const BudgetPlanner: React.FC<BudgetPlannerProps> = ({
  budgets,
  onUpdateBudget,
  transactions,
  balance = 0,
  onAddTransaction
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

  // Wishlist State & Form fields
  const [wishlist, setWishlist] = useState<WishItem[]>(() => {
    const saved = localStorage.getItem('wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  const [wishName, setWishName] = useState('');
  const [wishPrice, setWishPrice] = useState('');
  const [wishCategory, setWishCategory] = useState('General');

  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const handleAddWish = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(wishPrice);
    if (!wishName.trim() || isNaN(price) || price <= 0) return;

    const newWish: WishItem = {
      id: `wish_${Date.now()}`,
      name: wishName.trim(),
      price,
      category: wishCategory
    };

    setWishlist(prev => [...prev, newWish]);
    setWishName('');
    setWishPrice('');
    setWishCategory('General');
  };

  const handleRemoveWish = (id: string) => {
    setWishlist(prev => prev.filter(w => w.id !== id));
  };

  const handlePurchaseWish = (wish: WishItem) => {
    if (!onAddTransaction) return;
    onAddTransaction({
      amount: wish.price,
      type: 'expense',
      category: wish.category === 'General' ? 'Others' : wish.category,
      date: new Date().toISOString().split('T')[0],
      note: `Wishlist purchase: ${wish.name}`
    });
    // Remove from wishlist
    setWishlist(prev => prev.filter(w => w.id !== wish.id));
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

      {/* Personal Wishlist Card */}
      <Card variant="vessel" className="p-5 border border-white/[0.08] rounded-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-neon-green">card_giftcard</span>
            <h3 className="font-hanken text-sm font-semibold uppercase tracking-wider text-white">Personal Wishlist & Affordability Check</h3>
          </div>
          <span className="text-[9px] bg-neon-green/10 text-neon-green border border-neon-green/20 px-2 py-0.5 rounded-full font-bold">
            {wishlist.length} Dreams
          </span>
        </div>

        {/* Form to Add Wish */}
        <form onSubmit={handleAddWish} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end bg-white/[0.02] p-4 rounded-xl border border-white/5">
          <div className="sm:col-span-2 flex flex-col gap-1.5 text-left">
            <label className="font-hanken text-xs font-semibold uppercase tracking-wider text-white/60">Wish Name</label>
            <input
              type="text"
              placeholder="e.g. Mechanical Keyboard"
              value={wishName}
              onChange={(e) => setWishName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg text-xs bg-[#222] text-white border border-white/10 focus:border-neon-green focus:ring-1 focus:ring-neon-green outline-none"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5 text-left">
            <label className="font-hanken text-xs font-semibold uppercase tracking-wider text-white/60">Price (₹)</label>
            <input
              type="number"
              placeholder="Price"
              value={wishPrice}
              onChange={(e) => setWishPrice(e.target.value)}
              className="w-full px-4 py-2 rounded-lg text-xs bg-[#222] text-white border border-white/10 focus:border-neon-green focus:ring-1 focus:ring-neon-green outline-none font-bold"
              required
              min="1"
            />
          </div>

          <div className="flex flex-col gap-1.5 text-left">
            <label className="font-hanken text-xs font-semibold uppercase tracking-wider text-white/60">Category</label>
            <select
              value={wishCategory}
              onChange={(e) => setWishCategory(e.target.value)}
              className="w-full px-4 py-2 rounded-lg text-xs bg-[#222] text-white border border-white/10 focus:border-neon-green focus:ring-1 focus:ring-neon-green outline-none"
            >
              <option value="General">General (Others)</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-4 flex justify-end">
            <Button type="submit" variant="primary" className="py-2 px-6 text-xs font-bold uppercase tracking-wider">
              Add to Wishlist
            </Button>
          </div>
        </form>

        {/* Wishlist Items List */}
        {wishlist.length === 0 ? (
          <div className="py-8 text-center text-white/40 flex flex-col items-center justify-center bg-white/[0.01] rounded-xl border border-white/[0.03]">
            <span className="material-symbols-outlined text-3xl mb-1 text-white/20">favorite</span>
            <p className="text-xs">Your wishlist is empty. Add a dream item to start auditing!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {wishlist.map(wish => {
              // Calculate affordability status
              const hasEnoughWalletBalance = balance >= wish.price;
              
              let fitsCategoryBudget = true;
              let categoryRemaining = Infinity;
              
              if (wish.category !== 'General') {
                const budget = budgets.find(b => b.category === wish.category);
                const limit = budget ? budget.limit : 0;
                const spent = categorySpentMap[wish.category] || 0;
                categoryRemaining = Math.max(0, limit - spent);
                
                if (limit > 0 && wish.price > categoryRemaining) {
                  fitsCategoryBudget = false;
                }
              }
              
              let statusText = "";
              let statusColorClass = "";
              let statusDesc = "";
              
              if (hasEnoughWalletBalance) {
                if (wish.category === 'General' || fitsCategoryBudget) {
                  statusText = "🟢 Affordable";
                  statusColorClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                  statusDesc = `You have enough balance (₹${balance.toLocaleString()}) and category budget room.`;
                } else {
                  statusText = "🟡 Exceeds Category Budget";
                  statusColorClass = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                  statusDesc = `Balance is OK, but this will exceed your ${wish.category} budget limit by ₹${(wish.price - categoryRemaining).toLocaleString()} this month.`;
                }
              } else {
                statusText = "🔴 Need Savings";
                statusColorClass = "bg-red-500/10 text-red-400 border-red-500/20";
                statusDesc = `You need ₹${(wish.price - balance).toLocaleString()} more in your wallet balance to purchase this.`;
              }

              return (
                <div key={wish.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all duration-200">
                  <div className="flex-1 flex flex-col gap-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white leading-tight">{wish.name}</span>
                      <span className="text-[9px] uppercase tracking-wider bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white/50 font-semibold">
                        {wish.category}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/40 font-mono">
                      Target Cost: <span className="text-white font-bold">₹{wish.price.toLocaleString()}</span>
                    </p>
                    <p className="text-[10px] text-white/60 leading-normal mt-1 flex items-center gap-1 select-none text-left">
                      <span className="material-symbols-outlined text-xs">info</span> {statusDesc}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3.5">
                    {/* Status Badge */}
                    <span className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-lg border ${statusColorClass}`}>
                      {statusText}
                    </span>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      {onAddTransaction && (
                        <button
                          onClick={() => handlePurchaseWish(wish)}
                          disabled={!hasEnoughWalletBalance}
                          className="px-3 py-1.5 rounded-lg bg-neon-green hover:bg-neon-green/90 text-[#121212] font-hanken font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none active:scale-95 border-none"
                          title={hasEnoughWalletBalance ? "Instant Purchase (Logs Transaction & Removes)" : "Insufficient Balance"}
                        >
                          Buy Now
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveWish(wish.id)}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/15 text-white/40 hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer border border-white/5 hover:border-red-500/10"
                        title="Remove wish"
                      >
                        <span className="material-symbols-outlined text-[16px] font-bold">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

    </div>
  );
};
