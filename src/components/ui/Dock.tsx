import React from 'react';

interface DockProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onPayTrigger: () => void;
}

export const Dock: React.FC<DockProps> = ({ activeTab, setActiveTab, onPayTrigger }) => {
  const getTabClass = (tab: string) => {
    return `flex flex-col items-center justify-center gap-0.5 transition-all duration-200 cursor-pointer ${
      activeTab === tab 
        ? 'text-neon-green font-semibold scale-105' 
        : 'text-[#e4e2e2]/60 hover:text-white'
    }`;
  };

  return (
    <nav className="fixed bottom-6 inset-x-4 z-50 max-w-md mx-auto bg-[#121212]/80 backdrop-blur-xl border border-white/10 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.4)] md:hidden">
      <div className="flex justify-between items-center h-16 px-6 relative">
        
        {/* Home Tab */}
        <button 
          onClick={() => setActiveTab('home')} 
          className={getTabClass('home')}
        >
          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: activeTab === 'home' ? "'FILL' 1" : "'FILL' 0" }}>home</span>
          <span className="font-hanken text-[8px] uppercase tracking-wider">Home</span>
        </button>

        {/* Insights Tab */}
        <button 
          onClick={() => setActiveTab('insights')} 
          className={getTabClass('insights')}
        >
          <span className="material-symbols-outlined text-xl">monitoring</span>
          <span className="font-hanken text-[8px] uppercase tracking-wider">Insights</span>
        </button>

        {/* Floating Pay Tab (Center) */}
        <div className="relative -mt-8 flex flex-col items-center">
          <button 
            onClick={onPayTrigger}
            className="flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 bg-neon-green text-[#121212] hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(15,238,101,0.4)] cursor-pointer"
          >
            <span className="material-symbols-outlined text-2xl font-bold">qr_code_scanner</span>
          </button>
          <span className="font-hanken text-[8px] uppercase tracking-wider text-[#e4e2e2]/60 mt-0.5 font-semibold">
            Pay
          </span>
        </div>

        {/* Goals Tab */}
        <button 
          onClick={() => setActiveTab('goals')} 
          className={getTabClass('goals')}
        >
          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: activeTab === 'goals' ? "'FILL' 1" : "'FILL' 0" }}>flag</span>
          <span className="font-hanken text-[8px] uppercase tracking-wider">Goals</span>
        </button>

        {/* Profile/Account Tab */}
        <button 
          onClick={() => setActiveTab('profile')} 
          className={getTabClass('profile')}
        >
          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: activeTab === 'profile' ? "'FILL' 1" : "'FILL' 0" }}>person</span>
          <span className="font-hanken text-[8px] uppercase tracking-wider">Account</span>
        </button>

      </div>
    </nav>
  );
};
