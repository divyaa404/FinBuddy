import React, { useState } from 'react';
import type { SavingsGoal, Transaction } from '../../types';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import Lottie from 'lottie-react';
import nothingHereAnim from '../../assets/animations/nothing_here_animation.json';

const LottiePlayer = (Lottie as any).default || Lottie;

interface GoalTrackerProps {
  goals: SavingsGoal[];
  onAddGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  onUpdateGoalAmount: (id: string, amount: number) => void;
  onDeleteGoal: (id: string) => void;
  transactions: Transaction[];
}

export const GoalTracker: React.FC<GoalTrackerProps> = ({
  goals,
  onAddGoal,
  onUpdateGoalAmount,
  onDeleteGoal,
  transactions
}) => {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [updateAmounts, setUpdateAmounts] = useState<{ [id: string]: string }>({});

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount || !targetDate) return;

    onAddGoal({
      name,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount) || 0,
      targetDate
    });

    setName('');
    setTargetAmount('');
    setCurrentAmount('');
    setTargetDate('');
  };

  const handleUpdateAmountSubmit = (e: React.FormEvent, goalId: string) => {
    e.preventDefault();
    const amountStr = updateAmounts[goalId];
    if (!amountStr || parseFloat(amountStr) < 0) return;

    onUpdateGoalAmount(goalId, parseFloat(amountStr));
    setUpdateAmounts(prev => ({ ...prev, [goalId]: '' }));
  };

  // Calculate actual savings rate (from recent month transactions: income - expense)
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const currentMonthTx = transactions.filter(tx => {
    const d = new Date(tx.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const monthlyIncome = currentMonthTx.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
  const monthlyExpense = currentMonthTx.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
  const actualSavingsRate = Math.max(0, monthlyIncome - monthlyExpense);

  return (
    <div className="flex flex-col gap-6 w-full text-left">
      
      {/* Create Goal Vessel */}
      <Card variant="vessel" className="p-5 border border-white/[0.08] rounded-2xl flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-white/5 pb-2 mb-1">
          <span className="material-symbols-outlined text-neon-green">flag</span>
          <h3 className="font-hanken text-sm font-semibold uppercase tracking-wider text-white">Create New Savings Goal</h3>
        </div>

        <form onSubmit={handleAddGoal} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          <Input
            label="Goal Name"
            type="text"
            placeholder="e.g. New Laptop"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Target Amount (₹)"
            type="number"
            placeholder="e.g. 50000"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            required
            min="1"
          />

          <Input
            label="Saved So Far (₹)"
            type="number"
            placeholder="e.g. 10000"
            value={currentAmount}
            onChange={(e) => setCurrentAmount(e.target.value)}
            min="0"
          />

          <Input
            label="Target Date"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            required
            min={new Date().toISOString().split('T')[0]}
          />

          <div className="sm:col-span-2 md:col-span-4 flex justify-end">
            <Button type="submit" variant="primary" className="px-8">
              Start Goal
            </Button>
          </div>
        </form>
      </Card>

      {/* Goals Trackers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.length === 0 ? (
          <Card variant="vessel" className="col-span-1 md:col-span-2 py-8 text-center text-white/40 flex flex-col items-center border border-white/[0.08]">
            <div className="w-32 h-32">
              <LottiePlayer animationData={nothingHereAnim} loop={true} />
            </div>
            <p className="text-xs font-semibold mt-2 text-white/50">No savings goals created yet</p>
            <p className="text-[10px] text-white/30 mt-1">Set a goal above to start monitoring your milestone pace.</p>
          </Card>
        ) : (
          goals.map(goal => {
            // Calculations
            const goalDate = new Date(goal.targetDate);
            const today = new Date();
            
            // Calculate remaining months
            const diffTime = goalDate.getTime() - today.getTime();
            const daysRemaining = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
            const monthsRemaining = Math.max(1, Math.round(daysRemaining / 30));

            const debtToSaved = Math.max(0, goal.targetAmount - goal.currentAmount);
            const requiredMonthlySaving = Math.round(debtToSaved / monthsRemaining);
            const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));

            // Pace Indicator
            let paceStatus = 'On Pace';
            let paceColor = 'text-neon-green border-neon-green/20 bg-neon-green/10';
            
            if (goal.currentAmount >= goal.targetAmount) {
              paceStatus = 'Completed';
              paceColor = 'text-neon-green border-neon-green/20 bg-neon-green/10';
            } else if (actualSavingsRate === 0) {
              paceStatus = 'Needs Savings';
              paceColor = 'text-error border-error/20 bg-error/10';
            } else if (actualSavingsRate < requiredMonthlySaving) {
              const monthsBehind = Math.round((requiredMonthlySaving - actualSavingsRate) / Math.max(1, actualSavingsRate));
              paceStatus = monthsBehind <= 0 ? 'Behind Pace' : `${monthsBehind}m Behind`;
              paceColor = 'text-red-400 border-red-400/20 bg-red-400/10';
            }

            return (
              <Card 
                key={goal.id} 
                variant="vessel" 
                className="p-5 border border-white/[0.08] rounded-2xl flex flex-col gap-4 relative overflow-hidden"
              >
                
                {/* Visual Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-bold text-white leading-tight">{goal.name}</h4>
                    <span className="text-[10px] text-white/40 font-medium uppercase font-hanken">
                      Target: {goalDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  <span className={`px-2.5 py-0.5 text-[9px] uppercase tracking-wider font-extrabold rounded-full border ${paceColor}`}>
                    {paceStatus}
                  </span>
                </div>

                {/* Savings Progress Ring/Bar */}
                <div className="flex flex-col gap-2 mt-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/60 font-medium">Progress</span>
                    <div className="flex items-baseline gap-1">
                      <span className="font-bold text-white numeric-display">₹{goal.currentAmount.toLocaleString()}</span>
                      <span className="text-white/40">/</span>
                      <span className="text-white/50 text-[10px]">₹{goal.targetAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="w-full h-2.5 bg-[#222] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-neon-green rounded-full shadow-[0_0_8px_rgba(15,238,101,0.5)] transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-white/40">
                      ₹{debtToSaved.toLocaleString()} left
                    </span>
                    <span className="text-neon-green font-bold font-hanken">
                      {percent}%
                    </span>
                  </div>
                </div>

                {/* Calculations details */}
                {goal.currentAmount < goal.targetAmount && (
                  <div className="bg-[#1b1c1c] border border-white/5 rounded-xl p-3 flex flex-col gap-1.5 mt-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-white/50">Required Monthly Savings:</span>
                      <span className="font-bold text-white font-hanken">₹{requiredMonthlySaving.toLocaleString()} / mo</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Time remaining:</span>
                      <span className="text-white/70">{monthsRemaining} months ({daysRemaining} days)</span>
                    </div>
                  </div>
                )}

                {/* Actions: Update progress amount inline / Delete */}
                <div className="flex items-center gap-3 mt-2 border-t border-white/5 pt-3.5">
                  <form 
                    onSubmit={(e) => handleUpdateAmountSubmit(e, goal.id)} 
                    className="flex-1 flex gap-2"
                  >
                    <input
                      type="number"
                      placeholder="Add funds (₹)"
                      value={updateAmounts[goal.id] || ''}
                      onChange={(e) => setUpdateAmounts(prev => ({ ...prev, [goal.id]: e.target.value }))}
                      className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-[#222] text-white border border-white/10 focus:border-neon-green outline-none"
                      min="1"
                    />
                    <Button type="submit" variant="primary" size="sm" className="px-3 py-1.5 text-xs">
                      Add
                    </Button>
                  </form>

                  <button
                    onClick={() => onDeleteGoal(goal.id)}
                    className="w-8 h-8 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-all cursor-pointer"
                    title="Delete Goal"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>

              </Card>
            );
          })
        )}
      </div>

    </div>
  );
};
