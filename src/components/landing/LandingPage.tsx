import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lenis from 'lenis';
import heroMobileImg from '../../assets/images/hero_mobile.png';

interface LandingPageProps {
  onAuthTrigger: (mode: 'signin' | 'signup' | 'demo') => void;
}

const animContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05
    }
  }
};

const animItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.16, 1, 0.3, 1] as const
    }
  }
};

const sectionRevealVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1] as const
    }
  }
};

// Predefined Savings Goals for Section 12
const SAVINGS_GOALS_DATA = [
  { id: 'laptop', name: 'MacBook Pro M4', target: 120000, current: 78000, progress: 65, duration: '3 Months', icon: 'laptop_mac' },
  { id: 'phone', name: 'iPhone 17 Pro', target: 110000, current: 44000, progress: 40, duration: '6 Months', icon: 'smartphone' },
  { id: 'trip', name: 'Goa Trip with Roomies', target: 20000, current: 18000, progress: 90, duration: '1 Month', icon: 'flight' },
  { id: 'bike', name: 'Electric Scooter', target: 150000, current: 30000, progress: 20, duration: '12 Months', icon: 'two_wheeler' },
  { id: 'pc', name: 'RTX 5080 Gaming PC', target: 180000, current: 117000, progress: 65, duration: '4 Months', icon: 'desktop_windows' },
  { id: 'camera', name: 'Sony Alpha Vlog Kit', target: 80000, current: 64000, progress: 80, duration: '2 Months', icon: 'photo_camera' }
];

// Predefined FAQ Data for Section 14
const FAQ_DATA = [
  {
    question: "Is FinBuddy actually free for students?",
    answer: "Yes, 100%! All core features—expense logging, budget planner, live bill splitting, savings goal tracker, and basic AI insights—are completely free for college students with no hidden charges or subscription gates."
  },
  {
    question: "How does the live bill splitting work without cards?",
    answer: "FinBuddy utilizes real-time Firestore listeners. You initiate a splitting session, which displays a room QR code. When roommates scan it on their phones, they are instantly added to your screen. You split items, and balances updates instantly across all connected screens in real-time."
  },
  {
    question: "Can I use FinBuddy without connecting my bank account?",
    answer: "Absolutely. FinBuddy is designed with student privacy in mind. We do not require direct bank login credentials. You input transactions via manual logging, voice entry, or receipt scanner OCR instantly."
  },
  {
    question: "How secure is my data on the dashboard?",
    answer: "Your security is our priority. We host our database on Firebase Secure Rules and secure Cloud Firestore. None of your data is shared, sold, or exposed to third-party ad companies."
  },
  {
    question: "What makes the AI Money Coach different from generic calculators?",
    answer: "Generic apps just show numbers. The AI Money Coach analyzes your personalized habits (e.g. 'You order dinner on Swiggy every Friday between 8-10 PM') and provides actionable strategies (e.g. 'Skipping Swiggy today gets you 12% closer to your Goa Trip goal')."
  }
];

export const LandingPage: React.FC<LandingPageProps> = ({ onAuthTrigger }) => {
  // ── CRITICAL: prevent browser scroll restoration from auto-scrolling on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.history.scrollRestoration = 'manual';
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, []);

  // Sticky Navbar blur on scroll state
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lenis Smooth Scroll Initialization
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  // Section 6: Live Showcase tabs
  const [showcaseTab, setShowcaseTab] = useState<'overview' | 'analytics' | 'goals' | 'subscriptions'>('overview');

  // Section 8: AI Money Coach chat simulator
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai', text: string }>>([
    { sender: 'ai', text: "Hey! I'm your AI Money Coach. Select a goal or write something to start saving smarter." }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const simulateAIResponse = (userPrompt: string, aiResponse: string) => {
    if (isTyping) return;
    
    // Add user message
    setChatMessages(prev => [...prev, { sender: 'user', text: userPrompt }]);
    setIsTyping(true);

    setTimeout(() => {
      // Simulate typing speed by slowly building the text
      let currentLength = 0;
      setChatMessages(prev => [...prev, { sender: 'ai', text: '' }]);
      
      const interval = setInterval(() => {
        currentLength += 3;
        if (currentLength >= aiResponse.length) {
          clearInterval(interval);
          setChatMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { sender: 'ai', text: aiResponse };
            return updated;
          });
          setIsTyping(false);
        } else {
          setChatMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { sender: 'ai', text: aiResponse.slice(0, currentLength) + '▎' };
            return updated;
          });
        }
      }, 15);
    }, 800);
  };

  // Only auto-scroll chat when the user has SENT a message (length > 1 = beyond initial AI greeting)
  useEffect(() => {
    if (chatMessages.length > 1) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isTyping]);

  // Section 12: Savings Goal carousel selected item
  const [selectedGoal, setSelectedGoal] = useState(SAVINGS_GOALS_DATA[0]);

  // Section 14: FAQ accordion expanded indices
  const [faqExpanded, setFaqExpanded] = useState<number | null>(null);

  // Social Proof counter simulation (triggered immediately for this design-only showcase)
  const [stats, setStats] = useState({ expenses: 0, accuracy: 0, students: 0, savings: 0 });
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const intervalTime = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      setStats({
        expenses: Math.min(Math.round((10000 / steps) * step), 10000),
        accuracy: Math.min(Math.round((98 / steps) * step), 98),
        students: Math.min(Math.round((5000 / steps) * step), 5000),
        savings: Math.min(Math.round((92 / steps) * step), 92),
      });

      if (step >= steps) {
        clearInterval(timer);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-white text-[#1b1c1c] w-full min-h-screen relative overflow-x-hidden selection:bg-neon-green selection:text-black">
      
      {/* ──────────────────────────────
          SECTION 1: NAVIGATION
          ────────────────────────────── */}
      {/* ── GLASSMORPHISM NAVBAR ──────────────────────────────── */}
      <nav
        style={{
          position:   'fixed',
          top:        scrolled ? '8px' : '16px',
          left:       '16px',
          right:      '16px',
          zIndex:     100,
          transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)',
          borderRadius: '18px',
          background:   scrolled
            ? 'rgba(10,10,10,0.82)'
            : 'rgba(10,10,10,0.55)',
          backdropFilter:       'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border:      '1px solid rgba(255,255,255,0.08)',
          boxShadow:   scrolled
            ? '0 8px 40px rgba(0,0,0,0.35)'
            : '0 4px 20px rgba(0,0,0,0.2)',
          padding:     scrolled ? '10px 24px' : '14px 24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1280px', margin: '0 auto' }}>
          {/* Logo */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <img src="/logo.png" alt="FinBuddy" style={{ width: '30px', height: '30px', objectFit: 'contain', borderRadius: '8px' }} />
            <span className="font-hanken" style={{ fontWeight: 800, fontSize: '15px', color: '#fff', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
              Fin<span style={{ color: '#0FEE65' }}>Buddy</span>
            </span>
          </div>

          {/* Centre nav links — desktop only */}
          <div className="hidden md:flex" style={{ gap: '2rem' }}>
            {[['Features','#features'],['Dashboard','#showcase'],['AI Coach','#coach'],['Pricing','#pricing'],['FAQ','#faq']].map(([label, href]) => (
              <a
                key={label}
                href={href}
                onClick={e => { e.preventDefault(); document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' }); }}
                className="font-hanken"
                style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.55)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
              >
                {label}
              </a>
            ))}
          </div>

          {/* Right CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => onAuthTrigger('signin')}
              className="font-hanken"
              style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 12px', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
            >
              Log in
            </button>
            <button
              onClick={() => onAuthTrigger('signup')}
              className="font-hanken"
              style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#000', background: '#0FEE65', border: 'none', cursor: 'pointer', padding: '10px 20px', borderRadius: '9999px', boxShadow: '0 0 20px rgba(15,238,101,0.3)', transition: 'all 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fff'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 24px rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#0FEE65'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 20px rgba(15,238,101,0.3)'; }}
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ──────────────────────────────
          SECTION 2: HERO (Scroll-Scrubbed Animation)
          ────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-6 md:px-12 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 min-h-[90vh] items-center bg-grid-pattern">
        
        {/* Left Side Content */}
        <motion.div 
          variants={animContainerVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-6 flex flex-col text-left justify-center gap-6 relative z-10"
        >
          <motion.div variants={animItemVariants} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/5 border border-black/10 self-start">
            <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse"></span>
            <span className="font-hanken text-[10px] font-bold uppercase tracking-wider text-black/65">
              AI Powered Student Finance Dashboard
            </span>
          </motion.div>

          <motion.h1 variants={animItemVariants} className="font-hanken text-5xl sm:text-7xl font-extrabold tracking-tight text-black leading-[1.05]">
            Money Management <br />
            Built <br />
            For <span className="text-[#00aa3b] underline decoration-neon-green decoration-wavy decoration-2 underline-offset-8">Students</span>.
          </motion.h1>

          <motion.p variants={animItemVariants} className="font-sans text-base text-black/60 max-w-lg leading-relaxed mt-2">
            Track expenses, plan budgets, save smarter, scan receipts, and receive AI-powered financial insights, all inside one beautiful dashboard.
          </motion.p>

          <motion.div variants={animItemVariants} className="flex flex-col sm:flex-row gap-4 mt-2">
            <button 
              onClick={() => onAuthTrigger('signup')}
              className="bg-[#121212] text-white hover:bg-black px-8 py-4 rounded-full font-hanken font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-lg cursor-pointer hover:scale-103"
            >
              Get Started Free
            </button>
            <a 
              href="#showcase"
              className="inline-flex items-center justify-center bg-white border border-gray-200 text-black hover:bg-gray-50 px-8 py-4 rounded-full font-hanken font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Watch Demo
            </a>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div variants={animItemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-8 border-t border-gray-150 pt-6">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-xl text-[#00aa3b]">done_all</span>
              <span className="text-[11px] font-hanken uppercase font-bold text-black/50 tracking-wider">10K+ Expenses</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-xl text-[#00aa3b]">bolt</span>
              <span className="text-[11px] font-hanken uppercase font-bold text-black/50 tracking-wider">AI Insights</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-xl text-[#00aa3b]">celebration</span>
              <span className="text-[11px] font-hanken uppercase font-bold text-black/50 tracking-wider">Free Forever</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-xl text-[#00aa3b]">verified_user</span>
              <span className="text-[11px] font-hanken uppercase font-bold text-black/50 tracking-wider">Secure AES</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Side Floating Mobile Graphic */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 relative flex justify-center items-center h-[540px] w-full"
        >
          {/* Large Hero Mobile Dashboard Graphic */}
          <img 
            src={heroMobileImg}
            alt="FinBuddy Mobile Dashboard Mockup"
            className="relative z-10 w-auto h-[560px] md:h-[660px] max-h-[580px] object-contain drop-shadow-[0_25px_45px_rgba(0,0,0,0.5)] transform rotate-2 hover:rotate-0 transition-all duration-500 hover:scale-[1.03]"
          />

          {/* Floating Cards (Around the mobile graphic to preserve high-fidelity visual context) */}
          <div className="absolute top-12 -left-8 bg-[#0B0B0C] border border-white/10 text-white py-2.5 px-4 rounded-2xl shadow-xl flex items-center gap-2 z-20 animate-float-slow">
            <span className="material-symbols-outlined text-sm text-neon-green">savings</span>
            <div className="text-left">
              <p className="text-[8px] text-white/40 font-bold uppercase tracking-wider">Saved This Week</p>
              <h4 className="text-xs font-bold text-white leading-tight">Saved ₹2,300</h4>
            </div>
          </div>

          <div className="absolute top-1/2 -right-8 bg-[#0B0B0C] border border-white/10 text-white py-2.5 px-4 rounded-2xl shadow-xl flex items-center gap-2 z-20 animate-float-medium">
            <span className="material-symbols-outlined text-sm text-neon-green">laptop_mac</span>
            <div className="text-left">
              <p className="text-[8px] text-white/40 font-bold uppercase tracking-wider">College Goal</p>
              <h4 className="text-xs font-bold text-white leading-tight">Laptop 65%</h4>
            </div>
          </div>

          <div className="absolute -bottom-8 left-12 bg-[#0B0B0C] border border-neon-green/30 text-white py-3 px-5 rounded-2xl shadow-2xl flex items-start gap-2.5 z-20 max-w-[280px] animate-float-slow">
            <span className="material-symbols-outlined text-base text-neon-green mt-0.5">lightbulb</span>
            <div className="text-left">
              <p className="text-[8px] text-neon-green font-bold uppercase tracking-wider">AI Insight</p>
              <p className="text-[10px] text-white/80 leading-normal font-sans mt-0.5">
                "Skipping Friday delivery puts you 12% closer to yourElectric Scooter goal."
              </p>
            </div>
          </div>

        </motion.div>
      </section>

      {/* ──────────────────────────────
          SECTION 3: SOCIAL PROOF
          ────────────────────────────── */}
      <section className="bg-[#fbf9f8] border-t border-b border-gray-150 py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="flex flex-col justify-center items-center">
            <span className="text-4xl sm:text-5xl font-black text-black tracking-tight leading-none numeric-display">
              {stats.expenses.toLocaleString()}+
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-black/40 font-hanken mt-2.5">
              Expenses Tracked
            </span>
          </div>

          <div className="flex flex-col justify-center items-center">
            <span className="text-4xl sm:text-5xl font-black text-black tracking-tight leading-none numeric-display">
              {stats.accuracy}%
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-black/40 font-hanken mt-2.5">
              Budget Accuracy
            </span>
          </div>

          <div className="flex flex-col justify-center items-center">
            <span className="text-4xl sm:text-5xl font-black text-black tracking-tight leading-none numeric-display">
              {stats.students.toLocaleString()}+
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-black/40 font-hanken mt-2.5">
              Students Active
            </span>
          </div>

          <div className="flex flex-col justify-center items-center">
            <span className="text-4xl sm:text-5xl font-black text-black tracking-tight leading-none numeric-display">
              {stats.savings}%
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-black/40 font-hanken mt-2.5">
              Savings Success
            </span>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────
          SECTION 4: THE PROBLEM
          ────────────────────────────── */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="text-[10px] uppercase font-bold tracking-widest text-black/40 font-hanken">The Challenge</span>
          <h2 className="font-hanken text-4xl md:text-5xl font-black text-black tracking-tight mt-3">
            Managing Money<br />Shouldn't Feel This Hard.
          </h2>
        </motion.div>

        <motion.div 
          variants={animContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {/* Card 1: Overspending */}
          <motion.div variants={animItemVariants} className="bg-[#0B0B0C] text-white p-6 rounded-[28px] border border-white/[0.08] hover-lift-dark text-left flex flex-col justify-between h-[300px]">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-3xl text-neon-green">credit_card_off</span>
              <span className="text-[9px] uppercase font-bold tracking-wider text-white/35">Problem 01</span>
            </div>
            <div>
              <h3 className="font-hanken font-bold text-lg text-white mb-2">Uncontrolled Overspending</h3>
              <p className="text-xs text-white/50 leading-relaxed font-sans">
                Chai rounds, late-night dinners, and shopping hauls drain your allowance before the mid-month mark hits.
              </p>
            </div>
            {/* Minimalist wallet illustration */}
            <div className="w-full h-12 border-t border-white/5 flex items-center justify-between text-[11px] text-white/30 pt-3">
              <span>Wallet Exhausted</span>
              <span className="material-symbols-outlined text-sm">trending_down</span>
            </div>
          </motion.div>

          {/* Card 2: No Savings */}
          <motion.div variants={animItemVariants} className="bg-[#0B0B0C] text-white p-6 rounded-[28px] border border-white/[0.08] hover-lift-dark text-left flex flex-col justify-between h-[300px]">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-3xl text-[#00aa3b]">database_off</span>
              <span className="text-[9px] uppercase font-bold tracking-wider text-white/35">Problem 02</span>
            </div>
            <div>
              <h3 className="font-hanken font-bold text-lg text-white mb-2">Zero Savings Rate</h3>
              <p className="text-xs text-white/50 leading-relaxed font-sans">
                Savings goals look like distant dreams because money disappears into miscellaneous expenses without a plan.
              </p>
            </div>
            {/* Piggy bank illustration */}
            <div className="w-full h-12 border-t border-white/5 flex items-center justify-between text-[11px] text-white/30 pt-3">
              <span>Broken Piggy Bank</span>
              <span className="material-symbols-outlined text-sm">hourglass_empty</span>
            </div>
          </motion.div>

          {/* Card 3: Forgotten Subscriptions */}
          <motion.div variants={animItemVariants} className="bg-[#0B0B0C] text-white p-6 rounded-[28px] border border-white/[0.08] hover-lift-dark text-left flex flex-col justify-between h-[300px]">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-3xl text-neon-green">autorenew</span>
              <span className="text-[9px] uppercase font-bold tracking-wider text-white/35">Problem 03</span>
            </div>
            <div>
              <h3 className="font-hanken font-bold text-lg text-white mb-2">Ghost Subscriptions</h3>
              <p className="text-xs text-white/50 leading-relaxed font-sans">
                Unchecked monthly renewals for Netflix, Spotify, ChatGPT, and gym memberships bleed your account dry.
              </p>
            </div>
            <div className="w-full h-12 border-t border-white/5 flex items-center gap-3 text-[10px] text-white/40 pt-3">
              <span className="bg-white/5 px-2 py-1 rounded">Netflix</span>
              <span className="bg-white/5 px-2 py-1 rounded">Spotify</span>
              <span className="bg-white/5 px-2 py-1 rounded">GPT Plus</span>
            </div>
          </motion.div>

          {/* Card 4: No Financial Awareness */}
          <motion.div variants={animItemVariants} className="bg-[#0B0B0C] text-white p-6 rounded-[28px] border border-white/[0.08] hover-lift-dark text-left flex flex-col justify-between h-[300px]">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-3xl text-[#00aa3b]">donut_large</span>
              <span className="text-[9px] uppercase font-bold tracking-wider text-white/35">Problem 04</span>
            </div>
            <div>
              <h3 className="font-hanken font-bold text-lg text-white mb-2">Complex Analytics</h3>
              <p className="text-xs text-white/50 leading-relaxed font-sans">
                Traditional banking apps are full of financial jargon, dry tables, and charts that are impossible to decrypt.
              </p>
            </div>
            {/* Spaghetti graphs */}
            <div className="w-full h-12 border-t border-white/5 flex items-center justify-between text-[11px] text-white/30 pt-3">
              <span>Confusing Spaghetti Charts</span>
              <span className="material-symbols-outlined text-sm">query_stats</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ──────────────────────────────
          SECTION 5: WHY FINBUDDY
          ────────────────────────────── */}
      <section id="features" className="px-6 md:px-12 py-12 max-w-7xl mx-auto">
        <div className="bg-[#0B0B0C] text-white rounded-[40px] p-8 md:p-16 relative overflow-hidden border border-white/15">
          {/* Subtle Ambient light */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-neon-green/5 rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="text-center max-w-xl mx-auto mb-16 relative z-10">
            <span className="text-[9px] uppercase font-bold tracking-widest text-neon-green font-hanken">Why FinBuddy</span>
            <h2 className="font-hanken text-3xl md:text-5xl font-black tracking-tight text-white mt-3">
              Everything You Need.<br />Nothing You Don't.
            </h2>
          </div>

          <motion.div
            variants={sectionRevealVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12 relative z-10"
          >
            {/* Feature 1 */}
            <div className="flex flex-col text-left gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-neon-green border border-white/10 shadow-lg">
                <span className="material-symbols-outlined">psychology</span>
              </div>
              <h4 className="font-hanken font-bold text-base text-white">AI Insights</h4>
              <p className="text-xs text-white/50 leading-relaxed font-sans">
                Predictive saving models that point out cost leaks automatically with smart suggestions.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col text-left gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#00aa3b] border border-white/10 shadow-lg">
                <span className="material-symbols-outlined">keyboard_voice</span>
              </div>
              <h4 className="font-hanken font-bold text-base text-white">Voice Expense Entry</h4>
              <p className="text-xs text-white/50 leading-relaxed font-sans">
                Just say "Spent ₹250 on campus lunch" to capture entries instantly without tapping.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col text-left gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-neon-green border border-white/10 shadow-lg">
                <span className="material-symbols-outlined">document_scanner</span>
              </div>
              <h4 className="font-hanken font-bold text-base text-white">Receipt Scanner</h4>
              <p className="text-xs text-white/50 leading-relaxed font-sans">
                Take a quick photo of physical receipts to scan and parse items automatically.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="flex flex-col text-left gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#00aa3b] border border-white/10 shadow-lg">
                <span className="material-symbols-outlined">schedule_send</span>
              </div>
              <h4 className="font-hanken font-bold text-base text-white">Budget Planner</h4>
              <p className="text-xs text-white/50 leading-relaxed font-sans">
                Configure limits for custom categories with live bar gauges that update on the fly.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="flex flex-col text-left gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#00aa3b] border border-white/10 shadow-lg">
                <span className="material-symbols-outlined">savings</span>
              </div>
              <h4 className="font-hanken font-bold text-base text-white">Savings Goals</h4>
              <p className="text-xs text-white/50 leading-relaxed font-sans">
                Set milestones for laptops, bike trips, or emergency funds with calculators.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="flex flex-col text-left gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-neon-green border border-white/10 shadow-lg">
                <span className="material-symbols-outlined">health_and_safety</span>
              </div>
              <h4 className="font-hanken font-bold text-base text-white">Financial Health Score</h4>
              <p className="text-xs text-white/50 leading-relaxed font-sans">
                Get an instant aggregate score of your overall financial fitness in one index.
              </p>
            </div>

            {/* Feature 7 */}
            <div className="flex flex-col text-left gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-neon-green border border-white/10 shadow-lg">
                <span className="material-symbols-outlined">event_repeat</span>
              </div>
              <h4 className="font-hanken font-bold text-base text-white">Subscription Tracker</h4>
              <p className="text-xs text-white/50 leading-relaxed font-sans">
                List running subscriptions and get alerts 3 days before renewal transactions occur.
              </p>
            </div>

            {/* Feature 8 */}
            <div className="flex flex-col text-left gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#00aa3b] border border-white/10 shadow-lg">
                <span className="material-symbols-outlined">query_stats</span>
              </div>
              <h4 className="font-hanken font-bold text-base text-white">Interactive Analytics</h4>
              <p className="text-xs text-white/50 leading-relaxed font-sans">
                Review gorgeous pie, line, and bar graphs representing detailed category divides.
              </p>
            </div>

            {/* Feature 9 */}
            <div className="flex flex-col text-left gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-neon-green border border-white/10 shadow-lg">
                <span className="material-symbols-outlined">notifications_active</span>
              </div>
              <h4 className="font-hanken font-bold text-base text-white">Smart Alerts</h4>
              <p className="text-xs text-white/50 leading-relaxed font-sans">
                Receive prompts when spending triggers reach 80% of configured category thresholds.
              </p>
            </div>

            {/* Feature 10 */}
            <div className="flex flex-col text-left gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#00aa3b] border border-white/10 shadow-lg">
                <span className="material-symbols-outlined">category</span>
              </div>
              <h4 className="font-hanken font-bold text-base text-white">Expense Categories</h4>
              <p className="text-xs text-white/50 leading-relaxed font-sans">
                Auto-sort tags like Food, Transport, Shopping, Entertainment, and Subscriptions.
              </p>
            </div>

            {/* Feature 11 */}
            <div className="flex flex-col text-left gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-neon-green border border-white/10 shadow-lg">
                <span className="material-symbols-outlined">shopping_basket</span>
              </div>
              <h4 className="font-hanken font-bold text-base text-white">Wishlist Planner</h4>
              <p className="text-xs text-white/50 leading-relaxed font-sans">
                Evaluate purchases by estimating how many hours of work or days of savings they take.
              </p>
            </div>

            {/* Feature 12 */}
            <div className="flex flex-col text-left gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#00aa3b] border border-white/10 shadow-lg">
                <span className="material-symbols-outlined">summarize</span>
              </div>
              <h4 className="font-hanken font-bold text-base text-white">Monthly Reports</h4>
              <p className="text-xs text-white/50 leading-relaxed font-sans">
                Download structured summaries of incomes, expenses, splits, and savings margins.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-6 md:px-12 py-6 max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          variants={sectionRevealVariants}
          className="overflow-hidden rounded-[36px] border border-black/10 bg-gradient-to-br from-[#0b0b0c] via-[#121212] to-[#151515] p-8 md:p-12 shadow-[0_24px_70px_rgba(0,0,0,0.08)]"
        >
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
            <div className="text-left">
              <span className="inline-flex items-center rounded-full border border-neon-green/25 bg-neon-green/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-neon-green">
                Split Smarter
              </span>
              <h3 className="mt-4 font-hanken text-3xl md:text-4xl font-black tracking-tight text-white">
                Share the bill, keep the vibe.
              </h3>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/65 font-sans">
                Create a live room, invite your roommates, and split dinner, rent, or groceries without the usual back-and-forth.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button onClick={() => onAuthTrigger('signup')} className="rounded-full bg-neon-green px-5 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-black transition-all hover:scale-[1.01]">
                  Start a Split
                </button>
                <a href="#showcase" className="rounded-full border border-white/15 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/75 transition-colors hover:text-white">
                  View Demo
                </a>
              </div>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-[#141415]/95 p-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.3em] text-white/40">Live Split Room</p>
                  <h4 className="mt-1 font-hanken text-lg font-bold text-white">Roomies Dinner</h4>
                </div>
                <span className="rounded-full bg-neon-green/15 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-neon-green">Live</span>
              </div>
              <div className="mt-4 space-y-3 text-sm text-white/70">
                <div className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-3">
                  <span>Pizza & mocktails</span>
                  <span className="font-semibold text-white">₹1,240</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-3">
                  <span>Shared rides</span>
                  <span className="font-semibold text-white">₹360</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-neon-green/20 bg-neon-green/10 px-3 py-3">
                  <span className="text-neon-green">Your share</span>
                  <span className="font-semibold text-neon-green">₹530</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ──────────────────────────────
          SECTION 6: LIVE DASHBOARD SHOWCASE
          ────────────────────────────── */}
      <section id="showcase" className="py-24 bg-[#fbf9f8] border-t border-gray-150">
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
          <span className="text-[10px] uppercase font-bold tracking-widest text-black/40 font-hanken">Interactive Sandbox</span>
          <h2 className="font-hanken text-4xl md:text-5xl font-black text-black tracking-tight mt-3 mb-4">
            Live Dashboard Showcase.
          </h2>
          <p className="font-sans text-sm text-black/60 max-w-xl mx-auto mb-12">
            Click on the navigation tabs below to preview different pages of the dashboard. Experience real-time responsive data shifts.
          </p>

          {/* Interactive Navigation Tabs */}
          <div className="flex justify-center mb-10">
            <div className="bg-[#121212] p-1.5 rounded-full flex gap-1 border border-white/5 shadow-xl max-w-md w-full">
              {(['overview', 'analytics', 'goals', 'subscriptions'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setShowcaseTab(tab)}
                  className={`flex-1 py-3 text-center text-[10px] font-hanken font-bold uppercase tracking-widest rounded-full transition-all duration-300 cursor-pointer ${
                    showcaseTab === tab 
                      ? 'bg-white text-black shadow-lg font-black' 
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Massive Dashboard Mockup Vessel */}
          <div className="bg-[#0B0B0C] border border-white/[0.08] text-white rounded-[32px] p-6 shadow-2xl relative overflow-hidden text-left min-h-[500px]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Sidebar layout */}
              <div className="lg:col-span-3 border-r border-white/5 pr-6 flex flex-col gap-6">
                <div className="flex items-center gap-2 pb-4 border-b border-white/5">
                  <div className="w-7 h-7 rounded-lg bg-neon-green/10 flex items-center justify-center text-neon-green font-hanken font-bold text-sm">F</div>
                  <span className="font-hanken font-extrabold text-sm uppercase tracking-tight text-white">FinBuddy</span>
                </div>
                <div className="flex flex-col gap-2.5 text-xs text-white/50">
                  <div 
                    className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer relative" 
                    onClick={() => setShowcaseTab('overview')}
                  >
                    {showcaseTab === 'overview' && (
                      <motion.div 
                        layoutId="showcaseTabActive" 
                        className="absolute inset-0 bg-white/5 rounded-xl border border-white/10 z-0" 
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="material-symbols-outlined text-sm relative z-10">dashboard</span>
                    <span className={`relative z-10 transition-colors duration-300 ${showcaseTab === 'overview' ? 'text-white font-bold' : ''}`}>Overview</span>
                  </div>
                  <div 
                    className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer relative" 
                    onClick={() => setShowcaseTab('analytics')}
                  >
                    {showcaseTab === 'analytics' && (
                      <motion.div 
                        layoutId="showcaseTabActive" 
                        className="absolute inset-0 bg-white/5 rounded-xl border border-white/10 z-0" 
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="material-symbols-outlined text-sm relative z-10">query_stats</span>
                    <span className={`relative z-10 transition-colors duration-300 ${showcaseTab === 'analytics' ? 'text-white font-bold' : ''}`}>Analytics</span>
                  </div>
                  <div 
                    className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer relative" 
                    onClick={() => setShowcaseTab('goals')}
                  >
                    {showcaseTab === 'goals' && (
                      <motion.div 
                        layoutId="showcaseTabActive" 
                        className="absolute inset-0 bg-white/5 rounded-xl border border-white/10 z-0" 
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="material-symbols-outlined text-sm relative z-10">track_changes</span>
                    <span className={`relative z-10 transition-colors duration-300 ${showcaseTab === 'goals' ? 'text-white font-bold' : ''}`}>Goals</span>
                  </div>
                  <div 
                    className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer relative" 
                    onClick={() => setShowcaseTab('subscriptions')}
                  >
                    {showcaseTab === 'subscriptions' && (
                      <motion.div 
                        layoutId="showcaseTabActive" 
                        className="absolute inset-0 bg-white/5 rounded-xl border border-white/10 z-0" 
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="material-symbols-outlined text-sm relative z-10">event_repeat</span>
                    <span className={`relative z-10 transition-colors duration-300 ${showcaseTab === 'subscriptions' ? 'text-white font-bold' : ''}`}>Subscriptions</span>
                  </div>
                </div>
              </div>

              {/* Main Content Pane */}
              <div className="lg:col-span-9 flex flex-col justify-between min-h-[380px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={showcaseTab}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                    className="w-full flex-1 flex flex-col justify-between"
                  >
                    {/* Showcase TAB 1: OVERVIEW */}
                    {showcaseTab === 'overview' && (
                      <div className="flex flex-col gap-6 w-full">
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                      <h4 className="font-hanken font-extrabold text-lg">Financial Overview</h4>
                      <span className="text-[10px] text-neon-green font-bold bg-neon-green/10 px-2.5 py-1 rounded">Live Syncing</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-[#141415] border border-white/5 p-4 rounded-2xl">
                        <span className="text-white/40 text-[9px] uppercase font-bold tracking-wider">Account Balance</span>
                        <h3 className="text-xl font-bold mt-1">₹12,750</h3>
                        <span className="text-neon-green text-[9px] flex items-center gap-0.5 mt-2">
                          <span className="material-symbols-outlined text-[10px]">arrow_upward</span>
                          12% increase this month
                        </span>
                      </div>
                      <div className="bg-[#141415] border border-white/5 p-4 rounded-2xl">
                        <span className="text-white/40 text-[9px] uppercase font-bold tracking-wider">Safe to Spend (Daily)</span>
                        <h3 className="text-xl font-bold mt-1">₹450</h3>
                        <span className="text-white/30 text-[9px] flex items-center gap-0.5 mt-2">
                          Calculated for remaining days
                        </span>
                      </div>
                      <div className="bg-[#141415] border border-white/5 p-4 rounded-2xl">
                        <span className="text-white/40 text-[9px] uppercase font-bold tracking-wider">Active Splits</span>
                        <h3 className="text-xl font-bold mt-1 text-neon-green">₹1,840</h3>
                        <span className="text-neon-green text-[9px] flex items-center gap-0.5 mt-2">
                          Pending Roomie Settle
                        </span>
                      </div>
                    </div>

                    <div className="bg-[#141415] border border-white/5 p-5 rounded-2xl text-left">
                      <h5 className="text-xs font-bold mb-3 uppercase tracking-wider text-white/55">Recent Transaction Log</h5>
                      <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center text-xs py-2 border-b border-white/5">
                          <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-sm bg-neon-green/10 text-neon-green p-1.5 rounded-lg">fastfood</span>
                            <span>Swiggy Delivery (Dinner)</span>
                          </div>
                          <span className="font-bold text-neon-green">-₹860</span>
                        </div>
                        <div className="flex justify-between items-center text-xs py-2 border-b border-white/5">
                          <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-sm bg-blue-500/10 text-blue-400 p-1.5 rounded-lg">payments</span>
                            <span>Freelance Frontend Design</span>
                          </div>
                          <span className="font-bold text-white">+₹12,000</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Showcase TAB 2: ANALYTICS */}
                {showcaseTab === 'analytics' && (
                  <div className="flex flex-col gap-6 w-full">
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                      <h4 className="font-hanken font-extrabold text-lg">Detailed Analytics</h4>
                      <span className="text-[10px] text-white/40">Updated 10m ago</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Custom SVG Pie Chart Graphic */}
                      <div className="bg-[#141415] border border-white/5 p-5 rounded-2xl flex flex-col justify-between h-[220px]">
                        <span className="text-white/45 text-[9px] uppercase font-bold tracking-wider">Category Split</span>
                        <div className="flex items-center justify-around gap-2 my-2">
                          <svg className="w-24 h-24 rotate-45" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#222" strokeWidth="16"></circle>
                            {/* Food slice */}
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#0fee65" strokeWidth="16" strokeDasharray="251" strokeDashoffset="100"></circle>
                            {/* Subscriptions slice */}
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#006e2a" strokeWidth="16" strokeDasharray="251" strokeDashoffset="180"></circle>
                            {/* Travel slice */}
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#b388ff" strokeWidth="16" strokeDasharray="251" strokeDashoffset="230"></circle>
                          </svg>
                          <div className="flex flex-col gap-1.5 text-[9px]">
                            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-neon-green"></span><span>Food (42%)</span></div>
                            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-[#006e2a]"></span><span>Subs (28%)</span></div>
                            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-[#b388ff]"></span><span>Travel (18%)</span></div>
                          </div>
                        </div>
                      </div>

                      {/* Custom SVG Bar Graph */}
                      <div className="bg-[#141415] border border-white/5 p-5 rounded-2xl flex flex-col justify-between h-[220px]">
                        <span className="text-white/45 text-[9px] uppercase font-bold tracking-wider">Weekly Categories</span>
                        <div className="h-28 flex items-end gap-3 mt-4">
                          {[65, 45, 80, 20, 50].map((val, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-1.5">
                              <div className="w-full bg-[#1c1c1d] rounded h-full relative flex items-end">
                                <div className="w-full bg-neon-green rounded" style={{ height: `${val}%` }}></div>
                              </div>
                              <span className="text-white/30 text-[8px] font-bold">{['Food','Rent','Shop','Uni','Sub'][idx]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Showcase TAB 3: GOALS */}
                {showcaseTab === 'goals' && (
                  <div className="flex flex-col gap-6 w-full">
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                      <h4 className="font-hanken font-extrabold text-lg">Goal Tracking</h4>
                      <span className="text-[10px] text-neon-green font-bold">On Track</span>
                    </div>

                    <div className="bg-[#141415] border border-white/5 p-5 rounded-2xl flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-4xl text-neon-green bg-neon-green/10 p-3 rounded-2xl">laptop_mac</span>
                        <div>
                          <h5 className="font-bold text-sm">MacBook Pro M4</h5>
                          <p className="text-[10px] text-white/40">Target: ₹1,20,000</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-white">₹78,000 saved</span>
                        <p className="text-[10px] text-neon-green font-medium">65% Completed</p>
                      </div>
                    </div>

                    <div className="bg-[#141415] border border-white/5 p-5 rounded-2xl text-left">
                      <h5 className="text-xs font-bold mb-3 uppercase tracking-wider text-white/55">Savings Milestones</h5>
                      <div className="flex flex-col gap-3">
                        <div className="flex justify-between text-xs font-semibold py-1">
                          <span className="text-white/70">₹10,000 (Initial Deposit)</span>
                          <span className="text-neon-green">Completed</span>
                        </div>
                        <div className="flex justify-between text-xs font-semibold py-1">
                          <span className="text-white/70">₹50,000 (Halfway mark)</span>
                          <span className="text-neon-green">Completed</span>
                        </div>
                        <div className="flex justify-between text-xs font-semibold py-1">
                          <span className="text-white/70">₹1,00,000 (Target close)</span>
                          <span className="text-white/35">3 months left</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Showcase TAB 4: SUBSCRIPTIONS */}
                {showcaseTab === 'subscriptions' && (
                  <div className="flex flex-col gap-6 w-full">
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                      <h4 className="font-hanken font-extrabold text-lg">Running Subscriptions</h4>
                      <span className="text-[10px] text-[#ba1a1a] font-bold">₹1,148 Due This Month</span>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="bg-[#141415] border border-white/5 p-4 rounded-2xl flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="w-2 h-2 rounded-full bg-[#00aa3b]"></span>
                          <div>
                            <h5 className="font-bold text-xs">Spotify Student Premium</h5>
                            <p className="text-[9px] text-white/30">Renews on August 12</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold">₹199 / mo</span>
                      </div>

                      <div className="bg-[#141415] border border-white/5 p-4 rounded-2xl flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="w-2 h-2 rounded-full bg-neon-green"></span>
                          <div>
                            <h5 className="font-bold text-xs">ChatGPT Plus</h5>
                            <p className="text-[9px] text-white/30">Renews on August 20</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold">₹949 / mo</span>
                      </div>
                    </div>
                  </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────
          SECTION 7: HOW IT WORKS
          ────────────────────────────── */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto text-center">
        <span className="text-[10px] uppercase font-bold tracking-widest text-black/40 font-hanken">Simple Process</span>
        <h2 className="font-hanken text-4xl md:text-5xl font-black text-black tracking-tight mt-3 mb-16">
          Four Steps To Better Habits.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          
          {/* Glowing horizontal connector line on larger screens */}
          <div className="hidden md:block absolute top-[44px] left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-neon-green via-[#00aa3b] to-black opacity-30 pointer-events-none"></div>

          {/* Step 1 */}
          <div className="flex flex-col items-center text-center gap-4 relative z-10">
            <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center text-neon-green border border-white/10 shadow-lg">
              <span className="font-hanken font-bold text-xs">01</span>
            </div>
            <h4 className="font-hanken font-bold text-base text-black mt-2">Create Account</h4>
            <p className="text-xs text-black/50 leading-relaxed font-sans max-w-[200px]">
              Set up your profile with your student email in 10 seconds.
            </p>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center text-center gap-4 relative z-10">
            <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center text-[#0fee65] border border-white/10 shadow-lg">
              <span className="font-hanken font-bold text-xs">02</span>
            </div>
            <h4 className="font-hanken font-bold text-base text-black mt-2">Add Income</h4>
            <p className="text-xs text-black/50 leading-relaxed font-sans max-w-[200px]">
              Add allowances, part-time earnings, or gig gig balances.
            </p>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center text-center gap-4 relative z-10">
            <div className="w-16 h-16 rounded-full bg-[#121212] flex items-center justify-center text-[#00aa3b] border border-white/10 shadow-lg">
              <span className="font-hanken font-bold text-xs">03</span>
            </div>
            <h4 className="font-hanken font-bold text-base text-black mt-2">Track Expenses</h4>
            <p className="text-xs text-black/50 leading-relaxed font-sans max-w-[200px]">
              Type, speak, or scan receipts to capture daily logs instantly.
            </p>
          </div>

          {/* Step 4 */}
          <div className="flex flex-col items-center text-center gap-4 relative z-10">
            <div className="w-16 h-16 rounded-full bg-[#0B0B0C] flex items-center justify-center text-neon-green border border-white/10 shadow-lg">
              <span className="font-hanken font-bold text-xs">04</span>
            </div>
            <h4 className="font-hanken font-bold text-base text-black mt-2">Grow Savings</h4>
            <p className="text-xs text-black/50 leading-relaxed font-sans max-w-[200px]">
              Let the AI coach budget limits trigger and watch goals hit 100%.
            </p>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────
          SECTION 8: AI MONEY COACH
          ────────────────────────────── */}
      <section id="coach" className="px-6 md:px-12 py-12 max-w-7xl mx-auto">
        <div className="bg-[#0B0B0C] text-white rounded-[40px] p-8 md:p-16 border border-white/15 relative overflow-hidden">
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-neon-green/5 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column Content */}
            <div className="lg:col-span-5 text-left flex flex-col gap-6 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-green/10 text-neon-green border border-neon-green/20 self-start">
                <span className="material-symbols-outlined text-sm">psychology</span>
                <span className="font-hanken text-[10px] font-bold uppercase tracking-wider">Meet Your Assistant</span>
              </div>
              <h2 className="font-hanken text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
                Meet Your Personal AI Money Coach
              </h2>
              <p className="font-sans text-sm text-white/60 leading-relaxed">
                The Coach reviews your transaction histories, categories, and targets to draft realistic saving paths. It replaces confusing financial calculators with direct, conversational feedback.
              </p>
              <button 
                onClick={() => onAuthTrigger('signup')}
                className="bg-neon-green text-black font-hanken font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-full self-start hover:shadow-[0_0_20px_rgba(15,238,101,0.5)] transition-all cursor-pointer hover:scale-102"
              >
                Try AI Coach
              </button>
            </div>

            {/* Right Column Interactive Chat Sandbox */}
            <div className="lg:col-span-7 flex flex-col relative z-10 w-full">
              <div className="bg-[#141415] border border-white/10 rounded-3xl p-5 flex flex-col gap-4 shadow-2xl h-[360px] justify-between">
                
                {/* Chat Message Window */}
                <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1 hide-scrollbar">
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl p-3.5 text-xs font-sans text-left leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-neon-green text-black font-bold'
                          : 'bg-[#1b1c1d] text-white border border-white/5'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-[#1b1c1d] text-white border border-white/5 max-w-[80%] rounded-2xl p-3.5 text-xs">
                        Thinking...
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Predefined Interactive Prompts */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-white/5">
                  <button 
                    disabled={isTyping}
                    onClick={() => simulateAIResponse(
                      "How can I save ₹3000?", 
                      "Reduce food delivery spending by 12% next week. Cancel your unused Netflix subscription, and transfer ₹100 daily to your Goa Trip goal."
                    )}
                    className="bg-[#1b1c1d] hover:bg-white/10 border border-white/5 text-[9px] font-bold text-white px-3 py-2 rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                  >
                    💡 How can I save ₹3000?
                  </button>
                  <button 
                    disabled={isTyping}
                    onClick={() => simulateAIResponse(
                      "Where am I leaking cash?", 
                      "Your logs show ₹1,850 spent on chai canteen lunches this month, which is 42% higher than your target. Bring that down to hit your Laptop Goal."
                    )}
                    className="bg-[#1b1c1d] hover:bg-white/10 border border-white/5 text-[9px] font-bold text-white px-3 py-2 rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                  >
                    🔍 Where am I leaking cash?
                  </button>
                  <button 
                    disabled={isTyping}
                    onClick={() => simulateAIResponse(
                      "Analyze my subscription costs.", 
                      "You have Spotify and ChatGPT Plus costing ₹1,148/mo. Cancel ChatGPT for the break month to save 28% instantly."
                    )}
                    className="bg-[#1b1c1d] hover:bg-white/10 border border-white/5 text-[9px] font-bold text-white px-3 py-2 rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                  >
                    💳 Subscription analysis
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ──────────────────────────────
          SECTION 9: FEATURES BENTO GRID
          ────────────────────────────── */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto text-center bg-grid-pattern">
        <span className="text-[10px] uppercase font-bold tracking-widest text-black/40 font-hanken">Bento Grid Layout</span>
        <h2 className="font-hanken text-4xl md:text-5xl font-black text-black tracking-tight mt-3 mb-16">
          Apple Inspired Bento Grid.
        </h2>

        {/* Bento Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[200px]">
          
          {/* Card 1 (Large - 8cols/2rows) */}
          <div className="md:col-span-8 md:row-span-2 bg-[#0B0B0C] border border-white/[0.08] text-white rounded-[32px] p-8 text-left flex flex-col justify-between hover-lift-dark">
            <div className="flex justify-between items-start">
              <span className="material-symbols-outlined text-4xl text-neon-green">trending_up</span>
              <span className="bg-neon-green/10 text-neon-green text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded">Visual Dashboard</span>
            </div>
            <div>
              <h3 className="font-hanken font-bold text-2xl text-white mb-2">Automated Expense Tracking</h3>
              <p className="text-sm text-white/50 leading-relaxed font-sans max-w-md">
                Sort transactions under food, subscriptions, or travel automatically. Local storage integration saves configurations instantly.
              </p>
            </div>
            <div className="w-full h-px bg-white/5 my-4"></div>
            <div className="flex gap-4 text-xs text-white/40">
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-neon-green"></span>Fast Loading</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#00aa3b]"></span>Local Cache</span>
            </div>
          </div>

          {/* Card 2 (Medium - 4cols/2rows) */}
          <div className="md:col-span-4 md:row-span-2 bg-[#0B0B0C] border border-white/[0.08] text-white rounded-[32px] p-6 text-left flex flex-col justify-between hover-lift-dark">
            <span className="material-symbols-outlined text-4xl text-[#00aa3b] self-start">document_scanner</span>
            <div>
              <h3 className="font-hanken font-bold text-xl text-white mb-2">OCR Receipt Scanner</h3>
              <p className="text-xs text-white/50 leading-relaxed font-sans">
                Snap a photo of store receipts to automatically parse prices, dates, and store names without keying anything in manually.
              </p>
            </div>
            <div className="bg-[#141415] border border-white/5 p-3 rounded-2xl flex items-center gap-3">
              <span className="material-symbols-outlined text-neon-green text-sm">check_circle</span>
              <div className="text-[9px]">
                <p className="text-white/40 font-bold uppercase tracking-wider">Scanned Canteen Bill</p>
                <p className="text-white font-bold">Total ₹180 parsed</p>
              </div>
            </div>
          </div>

          {/* Card 3 (Small - 4cols/1row) */}
          <div className="md:col-span-4 bg-[#0B0B0C] border border-white/[0.08] text-white rounded-[32px] p-6 text-left flex flex-col justify-between hover-lift-dark">
            <div className="flex justify-between items-center">
              <h4 className="font-hanken font-bold text-sm text-white">Voice Entry API</h4>
              <span className="material-symbols-outlined text-base text-neon-green">mic</span>
            </div>
            <p className="text-xs text-white/50 font-sans leading-normal">
              Talk directly to log meals, drinks, and tickets instantly.
            </p>
          </div>

          {/* Card 4 (Small - 4cols/1row) */}
          <div className="md:col-span-4 bg-[#0B0B0C] border border-white/[0.08] text-white rounded-[32px] p-6 text-left flex flex-col justify-between hover-lift-dark">
            <div className="flex justify-between items-center">
              <h4 className="font-hanken font-bold text-sm text-white">Firestore Sync</h4>
              <span className="material-symbols-outlined text-base text-[#00aa3b]">sync</span>
            </div>
            <p className="text-xs text-white/50 font-sans leading-normal">
              Sync bill splits live with roommates on any browser tab.
            </p>
          </div>

          {/* Card 5 (Small - 4cols/1row) */}
          <div className="md:col-span-4 bg-[#0B0B0C] border border-white/[0.08] text-white rounded-[32px] p-6 text-left flex flex-col justify-between hover-lift-dark">
            <div className="flex justify-between items-center">
              <h4 className="font-hanken font-bold text-sm text-white">Smart Reminders</h4>
              <span className="material-symbols-outlined text-base text-neon-green">notifications_active</span>
            </div>
            <p className="text-xs text-white/50 font-sans leading-normal">
              Get alerts 3 days before Spotify or ChatGPT triggers billing.
            </p>
          </div>

        </div>
      </section>

      {/* ──────────────────────────────
          SECTION 10: ANALYTICS
          ────────────────────────────── */}
      <section className="py-24 bg-[#fbf9f8] border-t border-b border-gray-150">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-[10px] uppercase font-bold tracking-widest text-black/40 font-hanken">Spend Flow</span>
            <h2 className="font-hanken text-4xl md:text-5xl font-black text-black tracking-tight mt-3">
              Visualize Every Rupee You Spend.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Card 1: Pie Chart Card */}
            <div className="bg-white border border-gray-150 rounded-[32px] p-6 text-left shadow-[0_10px_30px_rgba(0,0,0,0.02)] flex flex-col justify-between h-[380px]">
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider text-black/40 font-hanken">Monthly Spending</span>
                <h4 className="font-hanken font-bold text-lg text-black mt-1">Category Splits</h4>
              </div>
              <div className="flex justify-center items-center my-6">
                <svg className="w-36 h-36 rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#f5f5f5" strokeWidth="12"></circle>
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#0fee65" strokeWidth="12" strokeDasharray="251" strokeDashoffset="120" strokeLinecap="round"></circle>
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#00aa3b" strokeWidth="12" strokeDasharray="251" strokeDashoffset="200" strokeLinecap="round"></circle>
                </svg>
              </div>
              <div className="flex justify-between items-center text-xs text-black/60 border-t border-gray-100 pt-4">
                <span>🍔 Food (55%)</span>
                <span>🛍️ Shopping (30%)</span>
                <span>🎬 Entertainment (15%)</span>
              </div>
            </div>

            {/* Card 2: Line Graph Card */}
            <div className="bg-white border border-gray-150 rounded-[32px] p-6 text-left shadow-[0_10px_30px_rgba(0,0,0,0.02)] flex flex-col justify-between h-[380px]">
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider text-black/40 font-hanken">Weekly Trend</span>
                <h4 className="font-hanken font-bold text-lg text-black mt-1">Balance Progression</h4>
              </div>
              <div className="my-6 h-32 flex items-end justify-between relative px-2">
                {/* Horizontal Guide Lines */}
                <div className="absolute inset-x-0 top-0 border-t border-dashed border-gray-100"></div>
                <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-gray-100"></div>
                
                {/* High fidelity line dots representing line chart */}
                {[2000, 3400, 2100, 4800, 5200, 4100, 6800].map((val, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 z-10">
                    <div 
                      className="w-2.5 h-2.5 rounded-full bg-[#00aa3b] border-2 border-white shadow-md relative animate-float-fast"
                      style={{ bottom: `${(val / 7000) * 100}px` }}
                    ></div>
                    <span className="text-[9px] font-bold text-black/35 font-hanken">{['W1','W2','W3','W4','W5','W6','W7'][idx]}</span>
                  </div>
                ))}
              </div>
              <div className="text-xs text-black/50 leading-relaxed font-sans border-t border-gray-100 pt-4">
                * Cumulative savings increased by <strong className="text-[#00aa3b]">₹6,800</strong> over 7 weeks.
              </div>
            </div>

            {/* Card 3: Bar Graph Card */}
            <div className="bg-white border border-gray-150 rounded-[32px] p-6 text-left shadow-[0_10px_30px_rgba(0,0,0,0.02)] flex flex-col justify-between h-[380px]">
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider text-black/40 font-hanken">Category Analysis</span>
                <h4 className="font-hanken font-bold text-lg text-black mt-1">Limits vs Actual</h4>
              </div>
              <div className="flex flex-col gap-4 my-6">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-black/75 mb-1.5">
                    <span>🍔 Food & Dining</span>
                    <span>₹1,240 / ₹2,000</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-neon-green rounded-full" style={{ width: '62%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold text-black/75 mb-1.5">
                    <span>🎬 Entertainment</span>
                    <span>₹1,800 / ₹2,500</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-neon-green rounded-full" style={{ width: '72%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold text-black/75 mb-1.5">
                    <span>📚 Books & Study</span>
                    <span>₹600 / ₹1,500</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#00aa3b] rounded-full" style={{ width: '40%' }}></div>
                  </div>
                </div>
              </div>
              <div className="text-xs text-black/40 font-sans border-t border-gray-100 pt-4">
                Total limits configured: ₹6,000/mo.
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ──────────────────────────────
          SECTION 11: GAMIFICATION
          ────────────────────────────── */}
      <section className="px-6 md:px-12 py-12 max-w-7xl mx-auto">
        <div className="bg-[#0B0B0C] text-white rounded-[40px] p-8 md:p-16 border border-white/15 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-neon-green/5 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-[9px] uppercase font-bold tracking-widest text-neon-green font-hanken">Rewards Platform</span>
            <h2 className="font-hanken text-3xl md:text-5xl font-black tracking-tight text-white mt-3">
              Saving Money Should Be Fun.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Achievement 1 */}
            <div className="bg-[#141415] border border-white/5 p-6 rounded-3xl text-left flex flex-col justify-between h-[220px] relative overflow-hidden">
              <div className="flex justify-between items-center">
                <span className="material-symbols-outlined text-3xl text-orange-500">local_fire_department</span>
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-neon-green font-hanken">Active</span>
              </div>
              <div>
                <h4 className="font-hanken font-bold text-base text-white">15 Day Streak</h4>
                <p className="text-xs text-white/50 leading-relaxed font-sans mt-1">
                  Log entries daily for 15 days to lock saving habits.
                </p>
              </div>
              <div className="w-full bg-[#1e1e1f] h-1.5 rounded-full overflow-hidden mt-3">
                <div className="h-full bg-neon-green" style={{ width: '80%' }}></div>
              </div>
            </div>

            {/* Achievement 2 */}
            <div className="bg-[#141415] border border-white/5 p-6 rounded-3xl text-left flex flex-col justify-between h-[220px] relative overflow-hidden">
              <div className="flex justify-between items-center">
                <span className="material-symbols-outlined text-3xl text-yellow-500">military_tech</span>
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-white/30 font-hanken">Locked</span>
              </div>
              <div>
                <h4 className="font-hanken font-bold text-base text-white">Budget Master</h4>
                <p className="text-xs text-white/50 leading-relaxed font-sans mt-1">
                  Keep under monthly thresholds for 3 consecutive months.
                </p>
              </div>
              <div className="w-full bg-[#1e1e1f] h-1.5 rounded-full overflow-hidden mt-3">
                <div className="h-full bg-neon-green" style={{ width: '45%' }}></div>
              </div>
            </div>

            {/* Achievement 3 */}
            <div className="bg-[#141415] border border-white/5 p-6 rounded-3xl text-left flex flex-col justify-between h-[220px] relative overflow-hidden">
              <div className="flex justify-between items-center">
                <span className="material-symbols-outlined text-3xl text-neon-green">check_circle</span>
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-neon-green font-hanken">Earned</span>
              </div>
              <div>
                <h4 className="font-hanken font-bold text-base text-white">Smart Saver</h4>
                <p className="text-xs text-white/50 leading-relaxed font-sans mt-1">
                  Save ₹2000 from allowances inside your first month.
                </p>
              </div>
              <div className="w-full bg-[#1e1e1f] h-1.5 rounded-full overflow-hidden mt-3">
                <div className="h-full bg-neon-green" style={{ width: '100%' }}></div>
              </div>
            </div>

            {/* Achievement 4 */}
            <div className="bg-[#141415] border border-white/5 p-6 rounded-3xl text-left flex flex-col justify-between h-[220px] relative overflow-hidden">
              <div className="flex justify-between items-center">
                <span className="material-symbols-outlined text-3xl text-[#b388ff]">grade</span>
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#b388ff] font-hanken font-medium">90% Saved</span>
              </div>
              <div>
                <h4 className="font-hanken font-bold text-base text-white">Goal Achiever</h4>
                <p className="text-xs text-white/50 leading-relaxed font-sans mt-1">
                  Hit your Goa Trip budget goal ahead of schedule.
                </p>
              </div>
              <div className="w-full bg-[#1e1e1f] h-1.5 rounded-full overflow-hidden mt-3">
                <div className="h-full bg-neon-green" style={{ width: '90%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────
          SECTION 12: SAVINGS GOALS
          ────────────────────────────── */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[10px] uppercase font-bold tracking-widest text-black/40 font-hanken">Target Vault</span>
          <h2 className="font-hanken text-4xl md:text-5xl font-black text-black tracking-tight mt-3">
            Build Long-Term Goals.
          </h2>
          <p className="font-sans text-sm text-black/60 max-w-md mx-auto mt-4">
            Toggle target goals in the carousel below to see how FinBuddy organizes deadlines and progress maps.
          </p>
        </div>

        {/* Selected Savings Goal Display Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedGoal.id}
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="bg-white border border-gray-150 rounded-[32px] p-8 max-w-3xl mx-auto text-left shadow-[0_15px_40px_rgba(0,0,0,0.03)] flex flex-col md:flex-row justify-between items-center gap-8 mb-12 w-full"
          >
          <div className="flex items-center gap-5">
            <span className="material-symbols-outlined text-5xl text-[#00aa3b] bg-neon-green/10 p-4 rounded-3xl">
              {selectedGoal.icon}
            </span>
            <div>
              <span className="text-[9px] uppercase font-bold tracking-widest text-[#00aa3b] font-hanken">Target Milestone</span>
              <h3 className="font-hanken font-extrabold text-2xl text-black mt-1">{selectedGoal.name}</h3>
              <p className="text-xs text-black/45 mt-1 font-sans">
                Required completion time: <strong className="text-black">{selectedGoal.duration}</strong>
              </p>
            </div>
          </div>

          <div className="w-full md:w-auto text-left md:text-right flex flex-col gap-2">
            <div className="flex justify-between md:justify-end gap-6 text-sm font-bold">
              <div>
                <span className="block text-[10px] uppercase font-bold text-black/30 font-hanken">Target</span>
                <span className="text-black">₹{selectedGoal.target.toLocaleString()}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-black/30 font-hanken">Current Savings</span>
                <span className="text-[#00aa3b]">₹{selectedGoal.current.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 justify-between md:justify-end">
              <span className="text-xs font-extrabold text-[#00aa3b]">{selectedGoal.progress}% Saved</span>
              <div className="w-28 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-neon-green rounded-full" style={{ width: `${selectedGoal.progress}%` }}></div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>

        {/* Carousel below */}
        <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar max-w-4xl mx-auto px-4">
          {SAVINGS_GOALS_DATA.map((goal) => (
            <div
              key={goal.id}
              onClick={() => setSelectedGoal(goal)}
              className={`flex-shrink-0 w-[180px] p-5 rounded-2xl border text-left cursor-pointer transition-all duration-300 ${
                selectedGoal.id === goal.id
                  ? 'bg-black text-white border-black shadow-lg scale-102'
                  : 'bg-white text-black border-gray-150 hover:bg-gray-50'
              }`}
            >
              <span className={`material-symbols-outlined text-2xl mb-3 ${selectedGoal.id === goal.id ? 'text-neon-green' : 'text-black/50'}`}>
                {goal.icon}
              </span>
              <h5 className="font-hanken font-bold text-xs truncate">{goal.name}</h5>
              <p className={`text-[10px] mt-1 ${selectedGoal.id === goal.id ? 'text-white/50' : 'text-black/40'}`}>
                Target ₹{goal.target.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ──────────────────────────────
          SECTION 13: TESTIMONIALS
          ────────────────────────────── */}
      <section className="py-24 bg-[#fbf9f8] border-t border-gray-150">
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
          <span className="text-[10px] uppercase font-bold tracking-widest text-black/40 font-hanken">Reviews</span>
          <h2 className="font-hanken text-4xl md:text-5xl font-black text-black tracking-tight mt-3 mb-16">
            Approved By Students.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Review 1 */}
            <div className="bg-white border border-gray-150 rounded-[28px] p-6 text-left hover-lift shadow-[0_10px_35px_-10px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[220px]">
              <div>
                <div className="flex gap-1 mb-4 text-[#00aa3b]">
                  {[1, 2, 3, 4, 5].map((s) => <span key={s} className="material-symbols-outlined text-sm">star</span>)}
                </div>
                <p className="text-xs text-black/60 leading-relaxed font-sans">
                  "The live splitting is magic. In hostel rooms we split food bills instantly, scan the QR code and settle. Saves hours of calculator fights."
                </p>
              </div>
              <div className="flex items-center gap-3 mt-6 border-t border-gray-100 pt-4">
                <div className="w-9 h-9 rounded-full bg-[#00aa3b]/10 text-[#00aa3b] font-bold text-xs flex items-center justify-center">R</div>
                <div>
                  <h5 className="font-hanken font-bold text-xs text-black">Rohit Sen</h5>
                  <p className="text-[9px] text-black/40">BITS Pilani, CS Student</p>
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="bg-white border border-gray-150 rounded-[28px] p-6 text-left hover-lift shadow-[0_10px_35px_-10px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[220px]">
              <div>
                <div className="flex gap-1 mb-4 text-[#00aa3b]">
                  {[1, 2, 3, 4, 5].map((s) => <span key={s} className="material-symbols-outlined text-sm">star</span>)}
                </div>
                <p className="text-xs text-black/60 leading-relaxed font-sans">
                  "I was always leaking money on Swiggy and Zomato. The AI Coach showed me where I was overspending and I finally saved for my laptop!"
                </p>
              </div>
              <div className="flex items-center gap-3 mt-6 border-t border-gray-100 pt-4">
                <div className="w-9 h-9 rounded-full bg-[#b388ff]/15 text-[#b388ff] font-bold text-xs flex items-center justify-center">S</div>
                <div>
                  <h5 className="font-hanken font-bold text-xs text-black">Simran Kaur</h5>
                  <p className="text-[9px] text-black/40">SRCC, Commerce major</p>
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div className="bg-white border border-gray-150 rounded-[28px] p-6 text-left hover-lift shadow-[0_10px_35px_-10px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[220px]">
              <div>
                <div className="flex gap-1 mb-4 text-[#00aa3b]">
                  {[1, 2, 3, 4, 5].map((s) => <span key={s} className="material-symbols-outlined text-sm">star</span>)}
                </div>
                <p className="text-xs text-black/60 leading-relaxed font-sans">
                  "Zero bank connections makes this super secure. I just snap receipt photos and it parses items, dates, and names instantly. Absolute life saver."
                </p>
              </div>
              <div className="flex items-center gap-3 mt-6 border-t border-gray-100 pt-4">
                <div className="w-9 h-9 rounded-full bg-neon-green/20 text-[#006e2a] font-bold text-xs flex items-center justify-center">A</div>
                <div>
                  <h5 className="font-hanken font-bold text-xs text-black">Arnav Mehta</h5>
                  <p className="text-[9px] text-black/40">IIT Bombay, Design Sophomore</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────
          SECTION 15: FINAL CTA
          ────────────────────────────── */}
      <section id="pricing" className="px-6 md:px-12 py-12 max-w-7xl mx-auto text-center">
        <div className="bg-[#0B0B0C] text-white rounded-[40px] p-12 md:p-24 border border-white/15 relative overflow-hidden">
          
          {/* Ambient light pulse */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neon-green/5 via-transparent to-transparent pointer-events-none animate-pulse-glow"></div>

          <span className="text-[10px] uppercase font-bold tracking-widest text-neon-green font-hanken relative z-10">Start Tracking Today</span>
          <h2 className="font-hanken text-4xl sm:text-6xl font-black tracking-tight text-white mt-4 mb-6 relative z-10 max-w-2xl mx-auto leading-tight">
            Ready To Build Better Money Habits?
          </h2>
          <p className="text-sm text-white/55 font-sans leading-relaxed max-w-md mx-auto mb-10 relative z-10">
            Join thousands of college students saving smarter, splitting room bills live, and tracking budgets. Free forever, setup takes 10 seconds.
          </p>

          <button
            onClick={() => onAuthTrigger('signup')}
            className="bg-neon-green text-black font-hanken font-black text-sm uppercase tracking-wider px-10 py-5 rounded-full relative z-10 hover:shadow-[0_0_30px_rgba(15,238,101,0.65)] hover:scale-103 transition-all cursor-pointer"
          >
            Start Free Now
          </button>
        </div>
      </section>

      {/* ──────────────────────────────
          SECTION 14: FAQ
          ────────────────────────────── */}
      <section id="faq" className="py-24 px-6 md:px-12 max-w-4xl mx-auto text-center">
        <span className="text-[10px] uppercase font-bold tracking-widest text-black/40 font-hanken font-bold">Common Queries</span>
        <h2 className="font-hanken text-4xl md:text-5xl font-black text-black tracking-tight mt-3 mb-16">
          Frequently Asked Questions
        </h2>

        <div className="flex flex-col gap-4 text-left">
          {FAQ_DATA.map((faq, idx) => {
            const isExpanded = faqExpanded === idx;
            return (
              <div
                key={idx}
                className="border-b border-gray-150 pb-5 pt-1"
              >
                <button
                  onClick={() => setFaqExpanded(isExpanded ? null : idx)}
                  className="w-full flex justify-between items-center font-hanken font-bold text-base text-black text-left cursor-pointer focus:outline-none"
                >
                  <span>{faq.question}</span>
                  <span className="material-symbols-outlined text-black/40 transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(45deg)' : 'none' }}>
                    add
                  </span>
                </button>
                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isExpanded ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0 overflow-hidden'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="text-xs text-black/55 leading-relaxed font-sans pr-8">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ──────────────────────────────
          FOOTER
          ────────────────────────────── */}
      <footer className="bg-[#0B0B0C] text-white border-t border-white/[0.08] py-16 px-6 md:px-12 mt-20 font-sans">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 text-left">
          
          {/* Logo Column */}
          <div className="md:col-span-4 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="FinBuddy Logo" className="w-8 h-8 object-contain rounded-lg" />
              <span className="font-hanken font-extrabold text-lg text-white uppercase tracking-tight">FinBuddy</span>
            </div>
            <p className="text-xs text-white/40 leading-relaxed font-sans max-w-sm">
              An AI-powered personal finance dashboard built exclusively for student life. Track allowances, split rent, settle bills, and budget with ease.
            </p>
          </div>

          {/* Product Links */}
          <div className="md:col-span-2 flex flex-col gap-3">
            <h5 className="font-hanken font-bold text-xs uppercase tracking-wider text-white/80">Product</h5>
            <div className="flex flex-col gap-2 text-xs text-white/40 font-medium">
              <a href="#features" className="hover:text-neon-green transition-colors">Features</a>
              <a href="#showcase" className="hover:text-neon-green transition-colors">Dashboard</a>
              <a href="#coach" className="hover:text-neon-green transition-colors">AI Money Coach</a>
              <a href="#pricing" className="hover:text-neon-green transition-colors">Pricing Options</a>
            </div>
          </div>

          {/* Resources Links */}
          <div className="md:col-span-2 flex flex-col gap-3">
            <h5 className="font-hanken font-bold text-xs uppercase tracking-wider text-white/80">Resources</h5>
            <div className="flex flex-col gap-2 text-xs text-white/40 font-medium font-sans">
              <a href="#faq" className="hover:text-neon-green transition-colors font-sans">FAQ Centre</a>
              <a href="#" className="hover:text-neon-green transition-colors font-sans">Student Guides</a>
              <a href="#" className="hover:text-neon-green transition-colors font-sans">Privacy Policy</a>
              <a href="#" className="hover:text-neon-green transition-colors font-sans">Terms of Service</a>
            </div>
          </div>

          {/* Newsletter Column */}
          <div className="md:col-span-4 flex flex-col gap-4 font-sans">
            <h5 className="font-hanken font-bold text-xs uppercase tracking-wider text-white/80">Subscribe to Insights</h5>
            <p className="text-xs text-white/40 font-sans leading-relaxed">
              Get monthly student budgeting hacks and AI recommendations.
            </p>
            <div className="flex gap-2 w-full">
              <input
                type="email"
                required
                placeholder="your.email@college.edu"
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/30 outline-none focus:border-neon-green flex-1"
              />
              <button
                onClick={() => alert("Thanks for subscribing!")}
                className="bg-neon-green text-black font-hanken font-bold text-xs uppercase px-4 py-2.5 rounded-xl hover:bg-neon-green/95 cursor-pointer font-sans"
              >
                Join
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-white/5 mt-16 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-white/30 font-sans">
          <span>&copy; {new Date().getFullYear()} FinBuddy. Built for Hackathons.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
            <a href="#" className="hover:text-white transition-colors">Discord</a>
          </div>
        </div>
      </footer>

    </div>
  );
};
