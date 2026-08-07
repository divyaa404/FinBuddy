import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';
import type { User } from 'firebase/auth';
import { 
  Home, 
  TrendingUp, 
  CreditCard, 
  Target, 
  Coins, 
  User as UserIcon, 
  LogOut 
} from 'lucide-react';

interface SidebarProps {
  user: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  onPayTrigger: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  activeTab,
  setActiveTab,
  isExpanded,
  setIsExpanded,
  onPayTrigger
}) => {
  if (!user) return null;

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem('finbuddy_demo_user');
      await signOut(auth);
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const menuItems = [
    { key: 'home', label: 'Home', icon: <Home size={22} /> },
    { key: 'insights', label: 'Insights', icon: <TrendingUp size={22} /> },
    { key: 'pay', label: 'Quick Pay', icon: <CreditCard size={22} className="text-neon-green" />, isAction: true },
    { key: 'goals', label: 'Savings Goals', icon: <Target size={22} /> },
    { key: 'budget', label: 'Budgets', icon: <Coins size={22} /> },
    { key: 'profile', label: 'Account', icon: <UserIcon size={22} /> }
  ];

  // Animation Variants for Sidebar
  const sidebarVariants = {
    collapsed: { 
      width: "5.5rem", 
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } 
    },
    expanded: { 
      width: "16rem", 
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } 
    }
  } as any;

  // Variants for staggered children (the labels)
  const labelVariants = {
    hidden: { opacity: 0, x: -15, filter: "blur(4px)" },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
      transition: { 
        delay: i * 0.08, 
        duration: 0.3,
        ease: "easeOut" 
      }
    }),
    exit: { 
      opacity: 0, 
      x: -10, 
      transition: { duration: 0.15 } 
    }
  } as any;

  const photoURL = user.photoURL || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsjXR_VSCRGNFnub_Ti3YbTzEUKHVngE2ltAYacbKPmr8vceg4ltYckIztAtwOa7U4tNh01nACESnzWeVsp4G8QUUM8FSA4w5fokkGyS48KZlrDWRutWw6fIkeBnT72XUJHX9EZ6prfFGY7GvaomnU2-3xouz5jA0AAkjsoPFtbrhzBzfpT9VxHsTDEabevPfKLKCzpU04VnwEzFMldcs43237fTBqCGMGwHIYaMU84v7rVwviryh9';
  const displayName = user.displayName || 'Divya Sharma';

  return (
    <motion.aside 
      initial={false}
      animate={isExpanded ? "expanded" : "collapsed"}
      variants={sidebarVariants}
      className="hidden md:flex flex-col items-center py-8 gap-6 fixed left-6 top-6 bottom-6 bg-[#1e2022]/85 backdrop-blur-xl border border-white/10 shadow-2xl rounded-[2.5rem] z-40 overflow-visible"
    >
      {/* Subtle glass overlay */}
      <div className="absolute inset-0 bg-white/[0.02] pointer-events-none rounded-[2.5rem]" />

      {/* LOGO - Clickable Toggle */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="relative z-10 w-12 h-12 bg-black/40 hover:bg-black/60 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner hover:scale-105 active:scale-95 transition-transform cursor-pointer"
      >
        <img src="/logo.png" alt="FinBuddy Logo" className="w-8 h-8 object-contain rounded-lg" />
      </button>

      {/* Navigation Items */}
      <nav className="relative z-10 flex-1 flex flex-col gap-3 mt-6 w-full px-4 text-left">
        {menuItems.map((item, i) => {
          const isActive = activeTab === item.key;
          const isAction = item.isAction;

          return (
            <button
              key={item.key}
              onClick={() => {
                if (isAction) {
                  onPayTrigger();
                } else {
                  setActiveTab(item.key);
                }
              }}
              className={`p-3.5 rounded-2xl transition-all duration-300 relative group flex items-center cursor-pointer
                ${isExpanded ? "justify-start gap-4 px-5" : "justify-center px-3.5"}
                ${isActive 
                  ? "bg-neon-green text-[#121212] neon-glow font-bold" 
                  : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5"}`}
            >
              {isActive && !isAction && (
                <motion.div 
                  layoutId="sidebarActive"
                  className="absolute -left-2 top-[10%] w-1.5 h-[80%] bg-neon-green rounded-r-full shadow-[2px_0_10px_rgba(15,238,101,0.6)]"
                />
              )}
              
              <div className="relative z-10 transition-transform duration-300 group-hover:rotate-6 shrink-0">
                {item.icon}
              </div>
              
              {/* Sliding labels */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    custom={i}
                    variants={labelVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="font-bold tracking-wide whitespace-nowrap text-xs font-hanken uppercase"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              
              {/* Tooltip on collapsed state */}
              {!isExpanded && (
                <span className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-[#1e2022]/80 backdrop-blur-md border border-white/20 text-white text-[11px] px-4 py-2.5 rounded-xl pointer-events-none uppercase tracking-wider font-extrabold whitespace-nowrap origin-left scale-x-0 opacity-0 transition-all duration-300 ease-out group-hover:scale-x-100 group-hover:opacity-100 shadow-2xl z-50 shadow-neon-green/5">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Info Section */}
      <div className="relative z-10 px-4 w-full">
        <div className={`flex items-center gap-3 transition-all duration-300 relative group ${isExpanded ? "bg-white/5 border border-white/5 p-2 rounded-2xl" : "justify-center cursor-pointer"}`}>
          <img 
            src={photoURL}
            alt={displayName} 
            className="w-9 h-9 rounded-xl border border-white/20 object-cover shrink-0"
          />
          {isExpanded ? (
            <motion.div 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: 0.2 }}
              className="flex-1 min-w-0 text-left"
            >
              <p className="text-white text-xs font-bold truncate leading-tight">{displayName}</p>
              <p className="text-white/40 text-[9px] truncate mt-0.5 font-mono">{user.email}</p>
            </motion.div>
          ) : (
            <span className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-[#121212]/80 backdrop-blur-md border border-white/20 text-white text-left px-4 py-3 rounded-2xl pointer-events-none origin-left scale-x-0 opacity-0 transition-all duration-300 ease-out group-hover:scale-x-100 group-hover:opacity-100 shadow-2xl z-50 flex flex-col gap-0.5 min-w-[160px]">
              <span className="text-[9px] text-neon-green uppercase tracking-wider font-extrabold">Active Account</span>
              <span className="text-xs font-bold truncate">{displayName}</span>
              <span className="text-[9px] text-white/50 font-mono truncate">{user.email}</span>
            </span>
          )}
        </div>
      </div>

      {/* Logout Action */}
      <div className="relative z-10 px-4 w-full">
        <button
          onClick={handleLogout}
          className={`p-3.5 rounded-2xl transition-all duration-300 relative group flex items-center w-full cursor-pointer
            ${isExpanded ? "justify-start gap-4 px-5" : "justify-center px-3.5"}
            text-white/60 hover:text-error hover:bg-error/10 hover:border-error/10 border border-transparent`}
        >
          <div className="relative z-10 transition-transform duration-300 group-hover:rotate-6 shrink-0">
            <LogOut size={20} className="group-hover:text-error text-white/60" />
          </div>
          {isExpanded && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-bold tracking-wide whitespace-nowrap text-xs font-hanken uppercase"
            >
              Sign Out
            </motion.span>
          )}
          {!isExpanded && (
            <span className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-error/10 border border-error/20 text-error text-[11px] px-4 py-2 rounded-xl pointer-events-none uppercase tracking-wider font-bold whitespace-nowrap origin-left scale-x-0 opacity-0 transition-all duration-300 ease-out group-hover:scale-x-100 group-hover:opacity-100 shadow-xl">
              Sign Out
            </span>
          )}
        </button>
      </div>

    </motion.aside>
  );
};
