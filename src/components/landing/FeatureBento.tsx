import React from 'react';

export const FeatureBento: React.FC = () => {
  return (
    <section id="features" className="py-24 px-6 md:px-12 max-w-7xl mx-auto text-left relative overflow-hidden">
      {/* Title */}
      <div className="flex flex-col gap-3 mb-16 max-w-2xl">
        <span className="font-hanken text-[10px] uppercase font-bold tracking-widest text-[#006E2A]">Core Engine</span>
        <h2 className="font-sans text-4xl sm:text-5xl font-extrabold text-black leading-tight tracking-tight">
          Budgeting and splitting, engineered for students.
        </h2>
        <p className="font-sans text-sm text-[#5F5E5E] leading-relaxed">
          No complex spreadsheets or bloated interfaces. Clean features designed around college life, roommates, and personal saving goals.
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full">
        
        {/* Card 1: Spend Tracking - Dark Span 7 */}
        <div className="md:col-span-7 bg-[#121212] text-white rounded-[24px] p-8 border border-white/[0.08] flex flex-col justify-between min-h-[350px] relative overflow-hidden group hover:border-white/20 transition-all duration-300 shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-neon-green/[0.02] rounded-full blur-[80px] pointer-events-none" />
          
          <div className="flex flex-col gap-2 relative z-10">
            <span className="material-symbols-outlined text-neon-green text-2xl">receipt_long</span>
            <h3 className="font-sans text-lg font-bold text-white mt-2">Intelligent Expense Ledger</h3>
            <p className="font-sans text-xs text-white/50 leading-relaxed max-w-sm">
              Log transactions instantly. Categorize with tags like Dorm, Food, or Subscriptions to visualize exactly where your money goes.
            </p>
          </div>

          {/* Visual mockup block */}
          <div className="mt-6 flex flex-col gap-2 bg-white/[0.02] border border-white/5 p-4 rounded-2xl relative z-10 transform group-hover:translate-y-[-4px] transition-transform duration-300">
            <div className="flex justify-between items-center text-[10px] border-b border-white/5 pb-2">
              <span className="text-white/40 uppercase font-black tracking-widest font-hanken">Dorm Expense Log</span>
              <span className="text-neon-green font-bold">Updated Just Now</span>
            </div>
            <div className="flex justify-between items-center text-xs py-1">
              <div className="flex items-center gap-2">
                <span>🍕</span>
                <span className="font-semibold">Colab Dinner Split</span>
              </div>
              <span className="font-bold text-white">-₹450.00</span>
            </div>
            <div className="flex justify-between items-center text-xs py-1">
              <div className="flex items-center gap-2">
                <span>📚</span>
                <span className="font-semibold">Semester Reference Books</span>
              </div>
              <span className="font-bold text-white">-₹1,200.00</span>
            </div>
          </div>
        </div>

        {/* Card 2: Smart Budgeting - Light Span 5 */}
        <div className="md:col-span-5 bg-[#FFFFFF] text-[#121212] rounded-[24px] p-8 border border-black/[0.08] flex flex-col justify-between min-h-[350px] group hover:border-black/25 transition-all duration-300 shadow-sm">
          <div className="flex flex-col gap-2">
            <span className="material-symbols-outlined text-[#006E2A] text-2xl">donut_large</span>
            <h3 className="font-sans text-lg font-bold text-[#121212] mt-2">Dynamic Allowance Budgets</h3>
            <p className="font-sans text-xs text-[#5F5E5E] leading-relaxed">
              Set monthly constraints and track allowance pacing. Receive automated alerts before you cross limits in any category.
            </p>
          </div>

          {/* Visual progress mock */}
          <div className="mt-6 bg-black/[0.02] border border-black/[0.06] p-4.5 rounded-2xl flex flex-col gap-2 transform group-hover:translate-y-[-4px] transition-transform duration-300">
            <div className="flex justify-between text-[10px] text-black/50 font-bold uppercase tracking-wider font-hanken">
              <span>Food Budget Pacing</span>
              <span>80% Limit Reach</span>
            </div>
            <div className="w-full h-2 bg-black/[0.06] rounded-full overflow-hidden border border-black/[0.04]">
              <div className="h-full bg-orange-500 w-[80%] rounded-full" />
            </div>
            <span className="text-[9px] text-[#5F5E5E] font-semibold">₹4,000 / ₹5,000 Spent this month</span>
          </div>
        </div>

        {/* Card 3: Split Sessions - Light Span 5 */}
        <div className="md:col-span-5 bg-[#FFFFFF] text-[#121212] rounded-[24px] p-8 border border-black/[0.08] flex flex-col justify-between min-h-[350px] group hover:border-black/25 transition-all duration-300 shadow-sm">
          <div className="flex flex-col gap-2">
            <span className="material-symbols-outlined text-[#006E2A] text-2xl">qr_code_scanner</span>
            <h3 className="font-sans text-lg font-bold text-[#121212] mt-2">Live Splitting Lobbies</h3>
            <p className="font-sans text-xs text-[#5F5E5E] leading-relaxed">
              Scan, join, and split bills dynamically. Watch roomie updates in real-time and settle balances instantly through local QR generation.
            </p>
          </div>

          {/* Visual indicators */}
          <div className="mt-6 flex items-center justify-between bg-black/[0.02] border border-black/[0.06] p-4.5 rounded-2xl transform group-hover:translate-y-[-4px] transition-transform duration-300">
            <div className="flex -space-x-1.5 overflow-hidden">
              <span className="inline-flex w-7.5 h-7.5 rounded-full bg-emerald-100 border border-white text-xs items-center justify-center">👦</span>
              <span className="inline-flex w-7.5 h-7.5 rounded-full bg-emerald-100 border border-white text-xs items-center justify-center">👩‍🎓</span>
              <span className="inline-flex w-7.5 h-7.5 rounded-full bg-emerald-100 border border-white text-xs items-center justify-center">👨‍🎓</span>
            </div>
            <span className="text-[10px] bg-neon-green/20 text-[#006E2A] border border-neon-green/40 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
              Lobby Active
            </span>
          </div>
        </div>

        {/* Card 4: Savings Goals - Dark Span 7 */}
        <div className="md:col-span-7 bg-[#121212] text-white rounded-[24px] p-8 border border-white/[0.08] flex flex-col justify-between min-h-[350px] relative overflow-hidden group hover:border-white/20 transition-all duration-300 shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-neon-green/[0.02] rounded-full blur-[80px] pointer-events-none" />
          
          <div className="flex flex-col gap-2 relative z-10">
            <span className="material-symbols-outlined text-neon-green text-2xl">track_changes</span>
            <h3 className="font-sans text-lg font-bold text-white mt-2">Targeted Savings Goals</h3>
            <p className="font-sans text-xs text-white/50 leading-relaxed max-w-sm">
              Save for laptops, trips, or courses. Track compound progress and let the AI Money Coach compute daily saving milestones for your goals.
            </p>
          </div>

          {/* Visual Goal mock */}
          <div className="mt-6 bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex flex-col gap-2 relative z-10 transform group-hover:translate-y-[-4px] transition-transform duration-300">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span>✈️</span>
                <span className="text-xs font-bold">Goa Trip with Roomies</span>
              </div>
              <span className="text-neon-green text-xs font-bold font-mono">90% Done</span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
              <div className="h-full bg-neon-green w-[90%] rounded-full shadow-[0_0_10px_rgba(15,238,101,0.5)]" />
            </div>
            <div className="flex justify-between text-[9px] text-white/40 mt-0.5">
              <span>Saved ₹18,000</span>
              <span>Target ₹20,000</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
