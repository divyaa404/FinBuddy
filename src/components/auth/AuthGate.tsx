import React, { useState, useEffect } from 'react';
import { auth, isFirebaseConfigured } from '../../firebase/config';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import Lottie from 'lottie-react';
import loadingMainAnim from '../../assets/animations/loading_main.json';
import { LandingPage } from '../landing/LandingPage';

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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
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

    if (!isFirebaseConfigured) {
      resolveAuth(null);
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

  // Sync pathname on mount and on popstate
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      if (path === '/login' || path === '/signup') {
        setAuthMode(path === '/login' ? 'signin' : 'signup');
        setIsAuthModalOpen(true);
        setError(null);
      } else {
        setIsAuthModalOpen(false);
      }
    };
    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const handleGoogleLogin = async () => {
    if (!isFirebaseConfigured) {
      setError("Google Login is not available in local demo mode. Please click 'Demo Login' to start.");
      return;
    }
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
        phoneNumber: '+91 98765 43210',
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
          phoneNumber: phone,
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
          phoneNumber: '+91 99999 88888',
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
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
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

  const handleAuthTrigger = (mode: 'signin' | 'signup' | 'demo') => {
    if (mode === 'demo') {
      handleDemoLogin();
    } else {
      setAuthMode(mode);
      setIsAuthModalOpen(true);
      setError(null);
      window.history.pushState(null, '', mode === 'signin' ? '/login' : '/signup');
    }
  };

  const handleCloseAuth = () => {
    setIsAuthModalOpen(false);
    window.history.pushState(null, '', '/');
  };

  if (user) {
    return <>{children(user)}</>;
  }

  if (isAuthModalOpen || window.location.pathname === '/login' || window.location.pathname === '/signup') {
    return (
      <div className="auth-page min-h-screen w-full bg-[#0a0a0a] flex items-center justify-center py-8 px-4 relative overflow-y-auto">
        {/* Subtle radial green glow behind content */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(15,238,101,0.06), transparent 50%)',
          }}
        />

        {/* Floating SaaS Navigation Dock for Auth Page */}
        <nav
          className="fixed top-4 left-1/2 -translate-x-1/2 w-[min(1100px,calc(100%-32px))] h-16 bg-[#121212]/78 backdrop-blur-xl border border-white/10 rounded-[18px] flex items-center justify-between px-6 z-50 shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
        >
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={handleCloseAuth}
          >
            <img src="/logo.png" alt="FinBuddy Logo" className="w-8 h-8 object-contain rounded-lg" />
            <span className="font-hanken font-bold text-sm uppercase tracking-tight text-white">
              Fin<span className="text-neon-green">Buddy</span>
            </span>
          </div>

          <button
            onClick={handleCloseAuth}
            className="font-hanken text-[10px] font-bold uppercase tracking-wider text-white/60 hover:text-white bg-transparent border-none cursor-pointer"
          >
            Back to Home
          </button>
        </nav>

        {/* Scoped Auth Card */}
        <div className="auth-card w-full max-w-[620px] bg-[#121212] border border-white/[0.08] rounded-[24px] p-8 md:p-10 shadow-[0_24px_90px_rgba(0,0,0,0.55)] flex flex-col gap-6 relative z-10 mt-4 text-left">

          {/* Subtle top glow line */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#0FEE65] to-transparent pointer-events-none" />

          {/* Logo and branding */}
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="FinBuddy Logo" className="w-7 h-7 object-contain rounded-lg" />
            <span className="font-hanken font-bold text-xs uppercase tracking-tight text-white">
              Fin<span className="text-neon-green">Buddy</span>
            </span>
          </div>

          <div>
            <h3 className="font-hanken font-black text-2xl text-white">
              {authMode === 'signin' ? 'Welcome Back' : 'Create Student Account'}
            </h3>
            <p className="text-xs text-white/50 font-sans mt-1 leading-normal">
              {authMode === 'signin'
                ? 'Access your student dashboard and resume financial tracking'
                : 'Start tracking, splitting room bills, and planning savings milestones'}
            </p>
          </div>

          {/* Mode Selector Toggle */}
          <div className="flex bg-[#1b1c1c] p-1 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setError(null);
                window.history.pushState(null, '', '/login');
              }}
              className={`flex-1 py-2 text-center text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all duration-300 cursor-pointer ${authMode === 'signin'
                  ? 'bg-[#0B0B0C] text-[#0FEE65] border border-white/5 font-extrabold shadow-sm'
                  : 'text-white/40 hover:text-white'
                }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setError(null);
                window.history.pushState(null, '', '/signup');
              }}
              className={`flex-1 py-2 text-center text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all duration-300 cursor-pointer ${authMode === 'signup'
                  ? 'bg-[#0B0B0C] text-[#0FEE65] border border-white/5 font-extrabold shadow-sm'
                  : 'text-white/40 hover:text-white'
                }`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-950/40 border border-red-500/20 text-red-200 rounded-xl text-xs font-semibold leading-relaxed">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLocalSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-4">
              {authMode === 'signup' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Full Name"
                      type="text"
                      placeholder="Enter name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                    <Input
                      label="Phone Number"
                      type="tel"
                      placeholder="+91..."
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <Input
                      label="Confirm Password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>

            <Button
              type="submit"
              variant="secondary"
              fullWidth
              className="h-12 text-xs font-bold uppercase tracking-wider mt-2 border border-white/10"
            >
              {authMode === 'signin' ? 'Log In' : 'Create Account'}
            </Button>
          </form>

          {/* Separator line */}
          <div className="flex items-center justify-between text-white/20 text-xs my-2">
            <span className="w-full h-px bg-white/5"></span>
            <span className="px-4 uppercase font-bold tracking-wider font-hanken text-[9px] flex-shrink-0 text-white/35">or connect via</span>
            <span className="w-full h-px bg-white/5"></span>
          </div>

          {/* Social connections */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Google Login */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex-1 h-12 bg-white text-black hover:bg-white/90 rounded-[14px] font-bold font-hanken text-[11px] uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-md transition-all active:scale-98 cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Quick Demo Login */}
            <button
              type="button"
              onClick={handleDemoLogin}
              className="flex-1 h-12 bg-[rgba(15,238,101,0.10)] border border-[rgba(15,238,101,0.30)] text-[#0FEE65] hover:bg-[rgba(15,238,101,0.20)] rounded-[14px] font-bold font-hanken text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm font-bold">bolt</span>
              <span>Continue with Demo</span>
            </button>
          </div>

          <span className="text-[9px] text-white/30 text-center font-medium font-sans mt-2">
            * Quick Demo Login provides immediate full feature access for judges.
          </span>

        </div>
      </div>
    );
  }

  return (
    <>
      <LandingPage onAuthTrigger={handleAuthTrigger} />
    </>
  );
};
