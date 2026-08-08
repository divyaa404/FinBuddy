import React, { useState, useMemo } from 'react';
import type { Transaction, Budget } from '../../types';

interface ActivityCalendarProps {
  transactions: Transaction[];
  budgets: Budget[];
}

export const ActivityCalendar: React.FC<ActivityCalendarProps> = ({ transactions, budgets }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date()); // default to today
  
  const today = new Date();

  // Navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Calendar logic
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  // Adjust so Monday is first day of week (0) instead of Sunday (0 => 6, others -1)
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const weekdays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  // Activity calculation
  const activityData = useMemo(() => {
    const data: Record<string, { spent: number, count: number }> = {};
    transactions.forEach(tx => {
      if (tx.type === 'expense') {
        const txDate = new Date(tx.date).toDateString();
        if (!data[txDate]) data[txDate] = { spent: 0, count: 0 };
        data[txDate].spent += tx.amount;
        data[txDate].count += 1;
      }
    });
    return data;
  }, [transactions]);

  const maxSpent = useMemo(() => {
    let max = 1;
    Object.values(activityData).forEach(d => {
      if (d.spent > max) max = d.spent;
    });
    return max;
  }, [activityData]);

  // Total monthly budget
  const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0) || 10000;
  const dailyBudget = totalBudget / 30;

  const getIntensityClass = (spent: number) => {
    if (spent === 0) return 'bg-transparent text-white/70 hover:bg-white/5 border border-transparent';
    const ratio = spent / maxSpent;
    if (ratio < 0.2) return 'bg-[#0fee65]/20 text-[#0fee65] border border-[#0fee65]/10'; // low
    if (ratio < 0.6) return 'bg-[#0fee65]/50 text-[#121212] font-bold border border-[#0fee65]/30'; // medium
    return 'bg-[#0fee65] text-[#121212] font-bold border border-[#0fee65]/80 shadow-[0_0_8px_rgba(15,238,101,0.4)]'; // high
  };

  const isToday = (d: number) => {
    return today.getDate() === d && today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();
  };

  const isSelected = (d: number) => {
    return selectedDate && selectedDate.getDate() === d && selectedDate.getMonth() === currentDate.getMonth() && selectedDate.getFullYear() === currentDate.getFullYear();
  };

  return (
    <div className="bg-[#121212] text-white p-4.5 rounded-[24px] border border-white/[0.08] shadow-xl flex flex-col gap-3">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#0fee65] text-sm">calendar_month</span>
            <span className="font-hanken text-xs font-black uppercase tracking-wider text-white">Activity Calendar</span>
          </div>
          <p className="text-[9px] text-white/50 font-sans mt-0.5">Track your daily financial activity</p>
        </div>
        <div className="flex items-center gap-2 bg-[#1b1c1c] rounded-full px-2 py-1 border border-white/5">
          <button onClick={prevMonth} className="w-5 h-5 rounded-full hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer border-none bg-transparent">
            <span className="material-symbols-outlined text-[12px]">chevron_left</span>
          </button>
          <span className="text-[10px] font-bold uppercase tracking-wider min-w-[70px] text-center">
            {monthNames[currentDate.getMonth()].slice(0,3)} {currentDate.getFullYear()}
          </span>
          <button onClick={nextMonth} className="w-5 h-5 rounded-full hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer border-none bg-transparent">
            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1 mt-1">
        {/* Weekdays */}
        {weekdays.map(day => (
          <div key={day} className="text-[8px] text-white/40 uppercase font-bold text-center mb-1">{day}</div>
        ))}
        
        {/* Empty offsets */}
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="w-full aspect-square" />
        ))}
        
        {/* Days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const date = i + 1;
          const fullDateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), date).toDateString();
          const activity = activityData[fullDateStr] || { spent: 0, count: 0 };
          const budgetStatus = activity.spent > dailyBudget * 1.5 ? "Over limit" : (activity.spent > 0 ? "Within limit" : "No activity");
          
          return (
            <div key={date} className="relative group w-full aspect-square flex items-center justify-center">
              <button
                onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), date))}
                className={`w-[85%] h-[85%] rounded-[6px] flex items-center justify-center text-[10px] transition-all cursor-pointer ${getIntensityClass(activity.spent)} ${isSelected(date) ? 'ring-1 ring-white shadow-lg scale-110 z-10' : ''} ${isToday(date) && !isSelected(date) ? 'ring-1 ring-[#0fee65]' : ''}`}
              >
                {date}
              </button>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 p-2 bg-[#1b1c1c] border border-white/10 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-white border-b border-white/10 pb-1 text-center">
                  {monthNames[currentDate.getMonth()].slice(0,3)} {date}
                </span>
                <div className="flex justify-between text-[9px]">
                  <span className="text-white/60">Spent</span>
                  <span className="font-mono text-white">₹{activity.spent}</span>
                </div>
                <div className="flex justify-between text-[9px]">
                  <span className="text-white/60">Txns</span>
                  <span className="font-mono text-white">{activity.count}</span>
                </div>
                <div className="flex justify-between text-[9px] mt-0.5 pt-0.5 border-t border-white/5">
                  <span className="text-white/60">Budget</span>
                  <span className={budgetStatus === 'Over limit' ? 'text-red-400 font-semibold' : 'text-[#0fee65] font-semibold'}>{budgetStatus}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
