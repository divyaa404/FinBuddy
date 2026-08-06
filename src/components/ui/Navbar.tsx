import React, { useState } from 'react';
import { auth } from '../../firebase/config';
import { signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';

interface NavbarProps {
  user: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, activeTab, setActiveTab }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem('finbuddy_demo_user');
      await signOut(auth);
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const photoURL = user?.photoURL || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsjXR_VSCRGNFnub_Ti3YbTzEUKHVngE2ltAYacbKPmr8vceg4ltYckIztAtwOa7U4tNh01nACESnzWeVsp4G8QUUM8FSA4w5fokkGyS48KZlrDWRutWw6fIkeBnT72XUJHX9EZ6prfFGY7GvaomnU2-3xouz5jA0AAkjsoPFtbrhzBzfpT9VxHsTDEabevPfKLKCzpU04VnwEzFMldcs43237fTBqCGMGwHIYaMU84v7rVwviryh9';
  const displayName = user?.displayName || 'Divya Sharma';

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-xl pt-safe border-b border-outline-variant/20">
      <div className="h-16 px-6 max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          className="flex items-center gap-2 cursor-pointer select-none"
          onClick={() => setActiveTab('home')}
        >
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-neon-green font-bold text-lg shadow-sm">
            F
          </div>
          <span className="font-hanken font-extrabold text-lg text-primary tracking-tight">
            Fin<span className="text-neon-green text-shadow-glow">Buddy</span>
          </span>
        </div>

        {/* Dynamic Greeting (Middle) */}
        {user && (
          <div className="hidden md:flex flex-col text-center">
            <span className="text-xs text-on-surface-variant font-medium">{getGreeting()},</span>
            <span className="text-sm font-semibold text-on-surface">{displayName}</span>
          </div>
        )}

        {/* User Navigation Actions */}
        <div className="flex items-center gap-4 relative">
          {/* Quick Tab Indicators (Web View) */}
          {user && (
            <div className="hidden sm:flex items-center gap-1 bg-surface-container-low p-1 rounded-full border border-outline-variant/30">
              <button 
                onClick={() => setActiveTab('home')}
                className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                  activeTab === 'home' 
                    ? 'bg-[#121212] text-white' 
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Home
              </button>
              <button 
                onClick={() => setActiveTab('split')}
                className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                  activeTab === 'split' 
                    ? 'bg-[#121212] text-white' 
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Split
              </button>
            </div>
          )}

          {/* User Profile Dropdown */}
          {user ? (
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-full"
              >
                <img 
                  alt={displayName} 
                  className="w-9 h-9 rounded-full object-cover border border-outline-variant/50" 
                  src={photoURL}
                  onError={(e) => {
                    // Fallback avatar
                    (e.target as HTMLImageElement).src = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsjXR_VSCRGNFnub_Ti3YbTzEUKHVngE2ltAYacbKPmr8vceg4ltYckIztAtwOa7U4tNh01nACESnzWeVsp4G8QUUM8FSA4w5fokkGyS48KZlrDWRutWw6fIkeBnT72XUJHX9EZ6prfFGY7GvaomnU2-3xouz5jA0AAkjsoPFtbrhzBzfpT9VxHsTDEabevPfKLKCzpU04VnwEzFMldcs43237fTBqCGMGwHIYaMU84v7rVwviryh9';
                  }}
                />
              </button>

              {dropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setDropdownOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-48 bg-[#121212] border border-white/10 rounded-xl shadow-xl py-2 z-20 animate-fade-in">
                    <div className="px-4 py-2 border-b border-white/5">
                      <p className="text-xs text-white/50">Signed in as</p>
                      <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab('profile');
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">person</span>
                      My Account
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('goals');
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">flag</span>
                      Savings Goals
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('budget');
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">payments</span>
                      Category Budgets
                    </button>
                    <button
                      onClick={() => {
                        handleLogout();
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-error hover:bg-error/10 transition-colors flex items-center gap-2 border-t border-white/5 mt-1"
                    >
                      <span className="material-symbols-outlined text-sm">logout</span>
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button 
              onClick={() => setActiveTab('login')}
              className="bg-primary hover:bg-primary-container hover:text-primary transition-all text-white px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider"
            >
              Sign In
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
