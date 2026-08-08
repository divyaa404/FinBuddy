import React, { useState, useEffect } from 'react';
import { auth, isFirebaseConfigured } from '../../firebase/config';
import { motion, AnimatePresence } from 'framer-motion';
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
      <AnimatePresence>
        {isAuthModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 md:p-6 bg-[#050505]/80 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.94, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.94, y: 16, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="w-full max-w-[500px] my-2 sm:my-0"
            >
              <Card 
                variant="vessel" 
                className="w-full p-5 sm:p-6 rounded-[30px] border border-white/10 shadow-[0_24px_90px_rgba(0,0,0,0.45)] flex flex-col gap-4 text-left relative overflow-y-auto max-h-[min(92vh,780px)] hide-scrollbar"
              >
                
                {/* Close Modal Button */}
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(false)}
                  className="absolute top-4 right-4 text-white/40 hover:text-white cursor-pointer transition-colors p-1"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>

                {/* Glowing Accent */}
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-neon-green/20 to-transparent pointer-events-none"></div>
                <div className="absolute -top-16 -right-16 w-32 h-32 bg-neon-green/10 rounded-full blur-2xl pointer-events-none"></div>

                {/* Logo */}
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="FinBuddy Logo" className="w-8 h-8 object-contain rounded-lg" />
                  <span className="font-hanken font-bold text-sm uppercase tracking-tight text-white">
                    Fin<span className="text-neon-green">Buddy</span>
                  </span>
                </div>

                <div>
                  <h3 className="font-hanken font-black text-lg text-white">
                    {authMode === 'signin' ? 'Welcome Back' : 'Create Account'}
                  </h3>
                  <p className="text-[10px] text-white/50 font-sans mt-0.5 leading-tight">
                    {authMode === 'signin' 
                      ? 'Access your college finances dashboard instantly' 
                      : 'Start tracking, splitting, and saving today'}
                  </p>
                </div>

                {/* Toggle Modes */}
                <div className="flex bg-[#1b1c1c] p-1 rounded-xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setError(null);
                    }}
                    className={`flex-1 py-1.5 text-center text-[9px] font-bold rounded-lg uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                      authMode === 'signin' 
                        ? 'bg-[#0B0B0C] text-neon-green border border-white/5 font-extrabold shadow-sm' 
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
                    }}
                    className={`flex-1 py-1.5 text-center text-[9px] font-bold rounded-lg uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                      authMode === 'signup' 
                        ? 'bg-[#0B0B0C] text-neon-green border border-white/5 font-extrabold shadow-sm' 
                        : 'text-white/40 hover:text-white'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>

                {error && (
                  <div className="p-2.5 bg-red-950/40 border border-red-500/20 text-red-200 rounded-xl text-[10px] font-semibold leading-relaxed">
                    {error}
                  </div>
                )}

                {/* Form with layout animation */}
                <form onSubmit={handleLocalSubmit} className="flex flex-col gap-3">
                  <motion.div
                    key={authMode}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-3"
                  >
                    {authMode === 'signup' ? (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            label="Full Name"
                            type="text"
                            placeholder="Enter name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="py-2 text-xs"
                          />
                          <Input
                            label="Phone Number"
                            type="tel"
                            placeholder="+91..."
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                            className="py-2 text-xs"
                          />
                        </div>

                        <Input
                          label="Email Address"
                          type="email"
                          placeholder="you@college.edu"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="py-2 text-xs"
                        />

                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="py-2 text-xs"
                          />
                          <Input
                            label="Confirm Password"
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="py-2 text-xs"
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
                  </motion.div>

                  <Button
                    type="submit"
                    variant="secondary"
                    fullWidth
                    className="py-2.5 text-[9px] font-bold uppercase tracking-wider mt-1.5 border border-white/10"
                  >
                    {authMode === 'signin' ? 'Log In' : 'Create Account'}
                  </Button>
                </form>

                <div className="flex items-center justify-between text-white/20 text-xs my-0.5">
                  <span className="w-full h-px bg-white/5"></span>
                  <span className="px-3 uppercase font-bold tracking-wider font-hanken text-[8px] flex-shrink-0 text-white/35">or connect via</span>
                  <span className="w-full h-px bg-white/5"></span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Google Login */}
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="bg-white text-black hover:bg-white/90 py-2.5 px-3 rounded-xl font-bold font-hanken text-[9px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <svg className="w-3.8 h-3.8" viewBox="0 0 48 48" aria-hidden="true">
                      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20c10.493 0 19.5-7.583 19.5-20 0-1.341-.138-2.647-.389-3.917z" />
                      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
                      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.001-.001 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.647-.389-3.917z" />
                    </svg>
                    Google
                  </button>

                  {/* Quick Demo Login */}
                  <button
                    type="button"
                    onClick={() => {
                      handleDemoLogin();
                      setIsAuthModalOpen(false);
                    }}
                    className="bg-neon-green text-black hover:bg-neon-green/90 neon-glow py-2.5 px-3 rounded-xl font-black font-hanken text-[9px] uppercase tracking-wider flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xs font-bold">bolt</span>
                    Demo Login
                  </button>
                </div>

                <span className="text-[7.5px] text-white/30 text-center font-medium font-sans mt-0.5">
                  * Judges: Bypass custom forms to launch dashboard instantly.
                </span>

              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
