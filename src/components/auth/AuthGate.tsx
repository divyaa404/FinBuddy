import React, { useState, useEffect } from 'react';
import { auth } from '../../firebase/config';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import Lottie from 'lottie-react';
import loadingMainAnim from '../../assets/animations/loading_main.json';

const LottiePlayer = (Lottie as any).default || Lottie;

interface AuthGateProps {
  children: (user: User) => React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSplitRoute, setIsSplitRoute] = useState(false);

  // Login form state
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Check if current URL is a guest split participant view (e.g., #/split/123 or ?split=123)
  useEffect(() => {
    const checkRoute = () => {
      const hash = window.location.hash;
      const searchParams = new URLSearchParams(window.location.search);
      const isSplit = hash.startsWith('#/split/') || searchParams.has('splitId');
      setIsSplitRoute(isSplit);
    };

    checkRoute();
    window.addEventListener('hashchange', checkRoute);
    return () => window.removeEventListener('hashchange', checkRoute);
  }, []);

  // Monitor Firebase Auth state, but check if local demo user is stored in session
  useEffect(() => {
    const startTime = Date.now();

    const resolveAuth = (currentUser: any) => {
      const elapsed = Date.now() - startTime;
      const delay = Math.max(0, 2000 - elapsed);
      setTimeout(() => {
        if (currentUser) {
          setUser(currentUser);
        }
        setLoading(false);
      }, delay);
    };

    const savedDemoUser = sessionStorage.getItem('finbuddy_demo_user');
    if (savedDemoUser) {
      resolveAuth(JSON.parse(savedDemoUser));
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      resolveAuth(currentUser);
    }, (err) => {
      console.error("Auth state error:", err);
      setError("Failed to check login status.");
      setTimeout(() => setLoading(false), 2000);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      sessionStorage.removeItem('finbuddy_demo_user');
    } catch (err: any) {
      console.error("Google Auth failed:", err);
      setError(err.message || "Failed to log in with Google.");
    } finally {
      setLoading(false);
    }
  };

  // Demo user login for judges/evaluators
  const handleDemoLogin = () => {
    setLoading(true);
    setTimeout(() => {
      const mockUser = {
        uid: 'demo_user_123',
        displayName: 'Demo Evaluator',
        email: 'evaluator@finbuddy.com',
        photoURL: null
      } as any;
      setUser(mockUser);
      sessionStorage.setItem('finbuddy_demo_user', JSON.stringify(mockUser));
      setLoading(false);
    }, 800);
  };

  // Local signup/signin simulation to ensure immediate logins without strict firebase email setup
  const handleLocalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (authMode === 'signup') {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (!name || !email || !password || !phone) {
        setError('Please fill in all sign-up fields.');
        return;
      }
      
      // Simulate account registration & log in
      setLoading(true);
      setTimeout(() => {
        const mockUser = {
          uid: `local_user_${Date.now()}`,
          displayName: name,
          email: email,
          photoURL: null
        } as any;
        setUser(mockUser);
        sessionStorage.setItem('finbuddy_demo_user', JSON.stringify(mockUser));
        setLoading(false);
      }, 800);

    } else {
      if (!email || !password) {
        setError('Please fill in email and password.');
        return;
      }
      
      // Simulate sign in
      setLoading(true);
      setTimeout(() => {
        const mockUser = {
          uid: `local_user_${Date.now()}`,
          displayName: email.split('@')[0],
          email: email,
          photoURL: null
        } as any;
        setUser(mockUser);
        sessionStorage.setItem('finbuddy_demo_user', JSON.stringify(mockUser));
        setLoading(false);
      }, 800);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbf9f8] flex flex-col items-center justify-center p-6">
        <div className="w-40 h-40">
          <LottiePlayer animationData={loadingMainAnim} loop={true} />
        </div>
        <p className="mt-2 font-hanken text-sm font-semibold uppercase tracking-wider text-[#121212]/60">Loading FinBuddy...</p>
      </div>
    );
  }

  // Bypass Google Login gate if this is a split guest route
  if (isSplitRoute) {
    return <>{children(null as any)}</>;
  }

  if (user) {
    return <>{children(user)}</>;
  }

  return (
    <div className="min-h-screen bg-[#fbf9f8] text-on-surface flex flex-col relative overflow-x-hidden pt-8 pb-16">
      
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 -right-48 w-96 h-96 bg-neon-green/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 -left-48 w-96 h-96 bg-[#b388ff]/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Landing Header */}
      <header className="px-6 max-w-6xl mx-auto w-full flex items-center justify-between h-16 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-neon-green font-bold text-xl shadow-md shadow-primary/20">
            F
          </div>
          <span className="font-hanken font-black text-xl text-primary tracking-tight uppercase">
            Fin<span className="text-neon-green">Buddy</span>
          </span>
        </div>
        <a 
          href="#auth-deck"
          className="bg-[#1b1c1c] text-white hover:bg-[#2e3031] px-5 py-2.5 rounded-full font-hanken font-bold text-xs uppercase tracking-wider transition-colors"
        >
          Sign In
        </a>
      </header>

      {/* Main Core Container */}
      <main className="flex-1 flex flex-col px-6 max-w-6xl mx-auto w-full relative z-10 pt-12 gap-16">
        
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Content Left */}
          <div className="lg:col-span-7 flex flex-col text-left gap-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-green/10 text-primary border border-neon-green/20 self-start">
              <span className="material-symbols-outlined text-sm font-bold animate-pulse">emergency_share</span>
              <span className="font-hanken text-[10px] font-bold uppercase tracking-wider">Built for Student Hackathons</span>
            </div>

            <h1 className="font-sans text-4xl sm:text-6xl font-extrabold text-[#121212] leading-[1.1] tracking-tight">
              Finance tracking <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#00aa3b]">simplified</span> for students.
            </h1>

            <p className="font-sans text-base text-[#121212]/60 max-w-lg">
              Track part-time income, auto-categorize daily spending, evaluate your financial health score, and split bills instantly with real-time roomie settlement.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              <a 
                href="#auth-deck"
                className="bg-neon-green text-[#121212] hover:bg-neon-green/90 neon-glow px-8 py-4 rounded-xl font-hanken font-bold text-sm uppercase tracking-wider text-center transition-all duration-200"
              >
                Get Started Now
              </a>
              <a 
                href="#features"
                className="inline-flex items-center justify-center font-hanken font-semibold text-sm text-[#121212]/70 hover:text-[#121212] transition-colors"
              >
                Explore Features
                <span className="material-symbols-outlined text-sm ml-1">arrow_downward</span>
              </a>
            </div>

            <div className="flex items-center gap-6 mt-6 border-t border-outline-variant/30 pt-6">
              <div>
                <span className="block text-2xl font-bold text-[#121212] numeric-display">₹0</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant font-hanken">Setup Fee</span>
              </div>
              <div className="w-px h-8 bg-outline-variant/30"></div>
              <div>
                <span className="block text-2xl font-bold text-[#121212] numeric-display">100%</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant font-hanken">Firestore Sync</span>
              </div>
              <div className="w-px h-8 bg-outline-variant/30"></div>
              <div>
                <span className="block text-2xl font-bold text-[#121212] numeric-display">10s</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant font-hanken">Bill Splitting</span>
              </div>
            </div>

          </div>

          {/* Hero Visual Right */}
          <div className="lg:col-span-5 relative flex justify-center">
            <Card variant="vessel" className="w-full max-w-[360px] p-5 rounded-[24px] relative overflow-hidden flex flex-col gap-5 border border-white/10 shadow-2xl scale-105 transform hover:rotate-1 hover:scale-108 duration-500">
              
              {/* Glow Accent */}
              <div className="absolute -top-16 -right-16 w-48 h-48 bg-neon-green/20 rounded-full blur-3xl pointer-events-none"></div>

              {/* Fake Score Display */}
              <div className="flex justify-between items-center text-left">
                <div>
                  <span className="text-white/50 text-[10px] font-bold uppercase tracking-wider font-hanken">Financial Score</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-3xl font-extrabold text-neon-green numeric-display">84</span>
                    <span className="text-white/40 text-xs font-semibold">/100</span>
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-neon-green/10 text-neon-green border border-neon-green/20 text-[10px] font-bold uppercase tracking-wider">
                  Excellent
                </div>
              </div>

              {/* Tiny Visual Circle Graph */}
              <div className="relative w-full h-32 flex items-center justify-center my-2">
                <svg className="absolute w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#222" strokeWidth="8"></circle>
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#0fee65" strokeWidth="8" strokeDasharray="264" strokeDashoffset="42" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(15,238,101,0.5)]"></circle>
                </svg>
                <span className="material-symbols-outlined text-4xl text-neon-green">monitor_heart</span>
              </div>

              {/* Fake Budget Indicator */}
              <div className="flex flex-col text-left gap-1 bg-[#1b1c1c] p-3.5 rounded-xl border border-white/5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-white/60">🍔 Food & Dining</span>
                  <span className="text-neon-green">₹1,240 / ₹2,000</span>
                </div>
                <div className="w-full h-1.5 bg-[#222] rounded-full overflow-hidden mt-1.5">
                  <div className="h-full bg-neon-green rounded-full" style={{ width: '62%' }}></div>
                </div>
              </div>

              {/* Split Prompt Trigger */}
              <div className="flex items-center justify-between p-3.5 bg-neon-green text-[#121212] rounded-xl font-bold font-hanken text-xs hover:opacity-95 transition-opacity cursor-pointer">
                <span>⚡ Live Splitting (FinBuddy)</span>
                <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
              </div>

            </Card>
          </div>

        </div>

        {/* Authentication Deck (Centered Card) */}
        <div id="auth-deck" className="w-full flex justify-center py-8 border-t border-outline-variant/20 pt-16">
          <Card variant="vessel" className="w-full max-w-md p-6 rounded-[28px] border border-white/10 shadow-2xl flex flex-col gap-6 text-left">
            
            {/* Toggle Modes */}
            <div className="flex bg-[#222] p-1 rounded-xl border border-white/5">
              <button
                onClick={() => {
                  setAuthMode('signin');
                  setError(null);
                }}
                className={`flex-1 py-2.5 text-center text-xs font-bold rounded-lg uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                  authMode === 'signin' 
                    ? 'bg-[#121212] text-neon-green border border-white/5 font-extrabold shadow-sm' 
                    : 'text-white/50 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setAuthMode('signup');
                  setError(null);
                }}
                className={`flex-1 py-2.5 text-center text-xs font-bold rounded-lg uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                  authMode === 'signup' 
                    ? 'bg-[#121212] text-neon-green border border-white/5 font-extrabold shadow-sm' 
                    : 'text-white/50 hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>

            {error && (
              <div className="p-3 bg-error-container border border-error/25 text-error rounded-xl text-xs font-semibold leading-relaxed">
                {error}
              </div>
            )}

            {/* Custom Input Fields Form */}
            <form onSubmit={handleLocalSubmit} className="flex flex-col gap-4">
              {authMode === 'signup' && (
                <>
                  <Input
                    label="Full Name"
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <Input
                    label="Phone Number"
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </>
              )}

              <Input
                label="Email Address"
                type="email"
                placeholder="you@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {authMode === 'signup' && (
                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              )}

              <Button
                type="submit"
                variant="secondary"
                fullWidth
                className="py-3 text-xs uppercase tracking-wider mt-2 border border-white/10"
              >
                {authMode === 'signin' ? 'Log In' : 'Create Account'}
              </Button>
            </form>

            <div className="flex items-center justify-between text-white/30 text-xs">
              <span className="w-full h-px bg-white/5"></span>
              <span className="px-3 uppercase font-bold tracking-wider font-hanken text-[10px] flex-shrink-0">or continue with</span>
              <span className="w-full h-px bg-white/5"></span>
            </div>

            {/* Google Sign In Option */}
            <button
              onClick={handleGoogleLogin}
              className="w-full bg-white text-[#121212] hover:bg-white/90 p-3.5 rounded-xl font-bold font-hanken text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.986 0-.746-.08-1.32-.176-1.885H12.24z"/>
              </svg>
              Google Account
            </button>

            {/* Quick Demo Access (Glowing Hackathon Button) */}
            <div className="border-t border-white/5 pt-4 flex flex-col gap-2">
              <button
                onClick={handleDemoLogin}
                className="w-full bg-neon-green text-[#121212] hover:bg-neon-green/90 neon-glow p-3.5 rounded-xl font-extrabold font-hanken text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm font-bold">bolt</span>
                Quick Demo Login
              </button>
              <span className="text-[9px] text-white/40 text-center font-medium font-sans">
                * Evaluators/Judges: Bypass custom forms to launch dashboard instantly.
              </span>
            </div>

          </Card>
        </div>

      </main>

      {/* Feature Showcase Grid */}
      <section id="features" className="max-w-6xl mx-auto w-full px-6 pt-24 border-t border-outline-variant/20 mt-20">
        <h2 className="font-hanken font-bold text-center text-xs uppercase tracking-widest text-on-surface-variant mb-3">Feature Suite</h2>
        <p className="font-sans text-3xl font-extrabold text-[#121212] text-center mb-12">Designed for the student budget lifecycle</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="light" className="flex flex-col text-left gap-3">
            <span className="material-symbols-outlined text-3xl text-primary">analytics</span>
            <h3 className="text-lg font-bold text-[#121212]">Category Tracking</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Auto-suggest categories using note keywords (like Swiggy, Uber, Netflix) without machine learning. Persisted dynamically in local storage.
            </p>
          </Card>

          <Card variant="light" className="flex flex-col text-left gap-3">
            <span className="material-symbols-outlined text-3xl text-[#b388ff]">insights</span>
            <h3 className="text-lg font-bold text-[#121212]">Financial Health Score</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Real-time rating (0-100) calculated by balancing monthly savings rates, budget limits, and weekly spending consistency.
            </p>
          </Card>

          <Card variant="light" className="flex flex-col text-left gap-3">
            <span className="material-symbols-outlined text-3xl text-neon-green">qr_code_2</span>
            <h3 className="text-lg font-bold text-[#121212]">Split & Settle</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Real-time Firestore-powered bill split. Generate a QR code, watch your friends join live on your screen, split itemized costs, and settle in one tap.
            </p>
          </Card>
        </div>
      </section>

    </div>
  );
};
