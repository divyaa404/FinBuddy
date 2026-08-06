import React, { useState, useEffect } from 'react';
import { auth } from '../../firebase/config';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
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
    <>
      <LandingPage 
        onAuthTrigger={(mode) => {
          if (mode === 'demo') {
            handleDemoLogin();
          } else {
            setAuthMode(mode);
            setIsAuthModalOpen(true);
            setError(null);
          }
        }} 
      />

      {/* Modern High-Contrast Authentication Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-fade-in">
          
          <Card 
            variant="vessel" 
            className="w-full max-w-md p-7 rounded-[28px] border border-white/10 shadow-2xl flex flex-col gap-6 text-left relative overflow-hidden"
          >
            
            {/* Close Modal Button */}
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white cursor-pointer transition-colors p-1"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>

            {/* Glowing Accent */}
            <div className="absolute -top-16 -right-16 w-32 h-32 bg-neon-green/10 rounded-full blur-2xl pointer-events-none"></div>

            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-hanken font-black text-base">
                F
              </div>
              <span className="font-hanken font-bold text-sm uppercase tracking-tight text-white">
                Fin<span className="text-neon-green">Buddy</span>
              </span>
            </div>

            <div>
              <h3 className="font-hanken font-black text-xl text-white">
                {authMode === 'signin' ? 'Welcome Back' : 'Create Account'}
              </h3>
              <p className="text-[11px] text-white/50 font-sans mt-1">
                {authMode === 'signin' 
                  ? 'Access your college finances dashboard instantly' 
                  : 'Start tracking, splitting, and saving today'}
              </p>
            </div>

            {/* Toggle Modes */}
            <div className="flex bg-[#1b1c1c] p-1 rounded-xl border border-white/5">
              <button
                onClick={() => {
                  setAuthMode('signin');
                  setError(null);
                }}
                className={`flex-1 py-2 text-center text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                  authMode === 'signin' 
                    ? 'bg-[#0B0B0C] text-neon-green border border-white/5 font-extrabold shadow-sm' 
                    : 'text-white/40 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setAuthMode('signup');
                  setError(null);
                }}
                className={`flex-1 py-2 text-center text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                  authMode === 'signup' 
                    ? 'bg-[#0B0B0C] text-neon-green border border-white/5 font-extrabold shadow-sm' 
                    : 'text-white/40 hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-950/40 border border-red-500/20 text-red-200 rounded-xl text-[11px] font-semibold leading-relaxed">
                {error}
              </div>
            )}

            {/* Form */}
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
                className="py-3 text-[10px] font-bold uppercase tracking-wider mt-2 border border-white/10"
              >
                {authMode === 'signin' ? 'Log In' : 'Create Account'}
              </Button>
            </form>

            <div className="flex items-center justify-between text-white/20 text-xs">
              <span className="w-full h-px bg-white/5"></span>
              <span className="px-3 uppercase font-bold tracking-wider font-hanken text-[9px] flex-shrink-0">or continue with</span>
              <span className="w-full h-px bg-white/5"></span>
            </div>

            {/* Google Login */}
            <button
              onClick={handleGoogleLogin}
              className="w-full bg-white text-black hover:bg-white/90 p-3 rounded-xl font-bold font-hanken text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.986 0-.746-.08-1.32-.176-1.885H12.24z"/>
              </svg>
              Google Account
            </button>

            {/* Quick Demo Login */}
            <div className="border-t border-white/5 pt-4 flex flex-col gap-2">
              <button
                onClick={() => {
                  handleDemoLogin();
                  setIsAuthModalOpen(false);
                }}
                className="w-full bg-neon-green text-black hover:bg-neon-green/90 neon-glow p-3 rounded-xl font-black font-hanken text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm font-bold">bolt</span>
                Quick Demo Login
              </button>
              <span className="text-[8px] text-white/30 text-center font-medium font-sans">
                * Judges/Evaluators: Bypass custom forms to launch dashboard instantly.
              </span>
            </div>

          </Card>
        </div>
      )}
    </>
  );
};
