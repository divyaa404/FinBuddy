import React from 'react';

interface FinalCTAProps {
  onAuthTrigger: (mode: 'signin' | 'signup' | 'demo') => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ onAuthTrigger }) => {
  return (
    <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto relative overflow-hidden">
      
      {/* Large Black Obsidian Vessel */}
      <div className="w-full bg-[#121212] border border-white/[0.08] text-white rounded-[32px] p-12 md:p-20 relative overflow-hidden flex flex-col items-center text-center gap-6 shadow-2xl">
        
        {/* Subtle radial green glow backdrop */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-green/[0.03] rounded-full blur-[140px] pointer-events-none" />

        {/* Technical Label */}
        <span className="font-hanken text-[10px] uppercase font-bold tracking-[0.25em] text-neon-green/80 relative z-10">
          Get Started Instant
        </span>

        {/* Large Headline */}
        <h2 className="font-sans text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.08] max-w-2xl mt-2 relative z-10">
          Your money deserves a better system.
        </h2>

        {/* Supporting Copy */}
        <p className="font-sans text-sm text-white/50 max-w-md leading-relaxed mt-1 relative z-10">
          Join thousands of college students who are logging, budget planning, and splitting expenses with FinBuddy. Zero fees.
        </p>

        {/* Interactive CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-6 relative z-10">
          <button 
            onClick={() => onAuthTrigger('signup')}
            className="px-8 py-4 bg-neon-green text-black hover:bg-white rounded-full font-hanken font-bold text-xs uppercase tracking-widest transition-all duration-300 shadow-[0_8px_25px_rgba(15,238,101,0.25)] hover:shadow-[0_8px_30px_rgba(255,255,255,0.4)] active:scale-[0.98] cursor-pointer"
          >
            Create Free Account
          </button>
          <button 
            onClick={() => onAuthTrigger('demo')}
            className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full font-hanken font-bold text-xs uppercase tracking-widest text-white transition-all duration-300 active:scale-[0.98] cursor-pointer"
          >
            Launch Guest Demo
          </button>
        </div>

      </div>
    </section>
  );
};
