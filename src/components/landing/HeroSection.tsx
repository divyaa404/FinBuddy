import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import heroMobileImg from '../../assets/images/hero_mobile.png';

gsap.registerPlugin(ScrollTrigger);

// Frame loading
const rawModules = import.meta.glob(
  '../../assets/images/hero_animation/Comp 1/hero*.png',
  { eager: true }
) as Record<string, { default: string }>;

const FRAME_URLS: string[] = Object.keys(rawModules)
  .sort((a, b) => {
    const n = (s: string) => parseInt(s.match(/hero(\d+)/)?.[1] ?? '0', 10);
    return n(a) - n(b);
  })
  .map((k) => rawModules[k].default);

const TOTAL_FRAMES = FRAME_URLS.length;
const SCROLL_DISTANCE = 5000;

interface HeroSectionProps {
  onAuthTrigger: (mode: 'signin' | 'signup' | 'demo') => void;
  prefersReducedMotion?: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ 
  onAuthTrigger, 
  prefersReducedMotion = false 
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const borderLRef = useRef<HTMLDivElement>(null);
  const borderRRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const frameRef = useRef(0);
  const dimsRef = useRef({ w: 0, h: 0, dpr: 1 });

  const renderFrame = (idx: number) => {
    const canvas = canvasRef.current;
    const img = imagesRef.current[idx];
    if (!canvas || !img?.complete) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { w, h, dpr } = dimsRef.current;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const canvasAspect = w / h;
    
    let drawWidth, drawHeight, offsetX, offsetY;
    
    if (canvasAspect > imgAspect) {
      drawHeight = h;
      drawWidth = h * imgAspect;
      offsetX = (w - drawWidth) / 2;
      offsetY = 0;
    } else {
      drawWidth = w;
      drawHeight = w / imgAspect;
      offsetX = 0;
      offsetY = (h - drawHeight) / 2;
    }
    
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    frameRef.current = idx;
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    
    if (w === 0 || h === 0) return;
    
    const dpr = window.devicePixelRatio || 1;
    dimsRef.current = { w, h, dpr };
    
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    }
    
    renderFrame(frameRef.current);
  };

  useEffect(() => {
    if (prefersReducedMotion || window.innerWidth < 1024) return;
    if (!sectionRef.current || !canvasRef.current) return;
    if (TOTAL_FRAMES === 0) return;

    let loadedCount = 0;
    FRAME_URLS.forEach((url, i) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      img.onload = () => {
        imagesRef.current[i] = img;
        loadedCount++;
        if (loadedCount === 1 || loadedCount === TOTAL_FRAMES) {
          resizeCanvas();
        }
      };
    });

    requestAnimationFrame(() => {
      resizeCanvas();
    });

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resizeCanvas, 100);
    };
    
    window.addEventListener('resize', onResize);

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    
    if (sectionRef.current) {
      resizeObserver.observe(sectionRef.current);
    }

    const st = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top top',
      end: `+=${SCROLL_DISTANCE}`,
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      scrub: true,

      onUpdate(self) {
        const p = self.progress;
        const frame = Math.round(p * (TOTAL_FRAMES - 1));
        if (imagesRef.current[frame]) renderFrame(frame);

        if (leftRef.current) {
          const lo = p <= 0.15 ? 1 : p >= 0.30 ? 0 : 1 - (p - 0.15) / 0.15;
          gsap.set(leftRef.current, {
            opacity: lo,
            y: -(Math.max(0, (p - 0.10) / 0.20)) * 50,
            scale: 1 - Math.max(0, (p - 0.15) / 0.30) * 0.05,
          });
        }

        if (rightRef.current) {
          const ro = p <= 0.15 ? 1 : p >= 0.30 ? 0 : 1 - (p - 0.15) / 0.15;
          gsap.set(rightRef.current, {
            opacity: ro,
            y: -(Math.max(0, (p - 0.10) / 0.20)) * 40,
            scale: 1 - Math.max(0, (p - 0.15) / 0.30) * 0.05,
          });
        }

        if (indicatorRef.current) {
          gsap.set(indicatorRef.current, {
            opacity: p <= 0.05 ? 1 - p / 0.05 : 0,
          });
        }

        if (borderLRef.current) {
          const bo = p > 0.05 && p < 0.90 ? Math.min(1, (p - 0.05) / 0.10) : p >= 0.90 ? 1 - (p - 0.90) / 0.10 : 0;
          gsap.set(borderLRef.current, { opacity: bo * 0.6, scaleY: 0.3 + bo * 0.7 });
        }
        if (borderRRef.current) {
          const bo = p > 0.05 && p < 0.90 ? Math.min(1, (p - 0.05) / 0.10) : p >= 0.90 ? 1 - (p - 0.90) / 0.10 : 0;
          gsap.set(borderRRef.current, { opacity: bo * 0.6, scaleY: 0.3 + bo * 0.7 });
        }
      },

      onRefresh() {
        resizeCanvas();
      },
    });

    return () => {
      st.kill();
      window.removeEventListener('resize', onResize);
      resizeObserver.disconnect();
      clearTimeout(resizeTimeout);
    };
  }, [prefersReducedMotion]);

  // MOBILE / Reduced motion fallback
  if (prefersReducedMotion || window.innerWidth < 1024) {
    return (
      <section className="relative pt-32 pb-20 px-6 md:px-12 max-w-7xl mx-auto flex flex-col items-center gap-12 min-h-[90vh] justify-center bg-white">
        <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(15,238,101,0.06),transparent_50%)]" />
        
        <div className="flex flex-col items-center text-center gap-6 relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 border border-black/10">
            <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse"></span>
            <span className="font-hanken text-[10px] font-bold uppercase tracking-wider text-black/65">
              PERSONAL FINANCE FOR STUDENTS
            </span>
          </div>

          <h1 className="font-hanken text-4xl sm:text-5xl font-black tracking-tight text-[#121212] leading-[1.1]">
            SMARTER MONEY.<br />SIMPLER LIFE.
          </h1>

          <div className="w-full max-w-[320px] h-[320px] flex items-center justify-center bg-black/5 rounded-[32px] overflow-hidden p-4">
            <img 
              src={FRAME_URLS[115] || heroMobileImg} 
              alt="FinBuddy Mockup" 
              className="w-full h-full object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.2)]" 
            />
          </div>

          <p className="font-sans text-sm text-[#121212]/60 leading-relaxed">
            Take control of your money, without the spreadsheets. Track expenses, plan budgets, split room bills, and build better financial habits.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <button 
              onClick={() => onAuthTrigger('signup')}
              className="bg-[#121212] text-white hover:bg-black px-8 py-4 rounded-full font-hanken font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Get Started Free
            </button>
            <button 
              onClick={() => onAuthTrigger('demo')}
              className="bg-white border border-gray-200 text-black hover:bg-gray-50 px-8 py-4 rounded-full font-hanken font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Explore Demo
            </button>
          </div>
        </div>
      </section>
    );
  }

  // DESKTOP Full Hero with Canvas
  return (
    <section
      ref={sectionRef}
      className="hidden lg:block relative w-full h-screen bg-white overflow-hidden"
    >
      {/* Canvas Background */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full"
        style={{ display: 'block', zIndex: 0 }}
      />

      {/* Radial Gradient Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(15,238,101,0.08),transparent_45%)]" style={{ zIndex: 1 }} />

      {/* Side Borders */}
      <div 
        ref={borderLRef} 
        className="absolute top-20 left-8 bottom-20 w-[1.5px] pointer-events-none origin-top"
        style={{
          zIndex: 5,
          background: 'linear-gradient(to bottom, transparent, rgba(15, 238, 101, 0.25), transparent)',
          boxShadow: '0 0 8px rgba(15, 238, 101, 0.1)',
        }}
      />
      <div 
        ref={borderRRef} 
        className="absolute top-20 right-8 bottom-20 w-[1.5px] pointer-events-none origin-bottom"
        style={{
          zIndex: 5,
          background: 'linear-gradient(to bottom, transparent, rgba(15, 238, 101, 0.25), transparent)',
          boxShadow: '0 0 8px rgba(15, 238, 101, 0.1)',
        }}
      />

      {/* Content Grid */}
      <div className="relative w-full h-full max-w-7xl mx-auto grid grid-cols-12 gap-8 items-center px-6" style={{ zIndex: 10 }}>
        
        {/* Left Content */}
        <div ref={leftRef} className="col-span-3 flex flex-col gap-6 text-left relative z-30">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/5 border border-black/10 self-start">
            <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse"></span>
            <span className="font-hanken text-[10px] font-bold uppercase tracking-wider text-[#121212]/70">
              PERSONAL FINANCE FOR STUDENTS
            </span>
          </div>

          <h1 className="font-hanken text-4xl xl:text-5.5xl font-extrabold tracking-tight text-[#121212] leading-[1.08]">
            SMARTER MONEY.<br />SIMPLER LIFE.
          </h1>

          <p className="font-sans text-sm text-[#121212]/70 leading-relaxed max-w-xs font-semibold">
            Take control of your money, without the spreadsheets. Track expenses and plan budgets.
          </p>

          <div className="flex gap-4">
            <button 
              onClick={() => onAuthTrigger('signup')}
              className="bg-[#121212] text-white hover:bg-black px-6 py-3.5 rounded-full font-hanken font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer hover:scale-103 shadow-[0_10px_30px_rgba(0,0,0,0.15)]"
            >
              GET STARTED
            </button>
            <a 
              href="#features"
              className="inline-flex items-center justify-center bg-black/5 border border-black/10 text-[#121212] hover:bg-black/10 px-6 py-3.5 rounded-full font-hanken font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              EXPLORE FEATURES
            </a>
          </div>
        </div>

        {/* Center - Canvas Space (empty, canvas fills behind) */}
        <div className="col-span-6" />

        {/* Right Content */}
        <div ref={rightRef} className="col-span-3 flex flex-col gap-4 items-end relative z-30">
          <div className="bg-[#121212] border border-white/10 text-white p-4 rounded-[20px] shadow-2xl flex items-center gap-3.5 w-full max-w-[240px] text-left transform transition-transform hover:scale-[1.03]">
            <span className="material-symbols-outlined text-2.5xl text-[#0FEE65]">savings</span>
            <div>
              <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider">Saved this month</p>
              <h4 className="text-base font-black text-white leading-tight">₹1,500</h4>
            </div>
          </div>

          <div className="bg-[#121212] border border-white/10 text-white p-4 rounded-[20px] shadow-2xl flex items-center gap-3.5 w-full max-w-[240px] text-left transform transition-transform hover:scale-[1.03]">
            <span className="material-symbols-outlined text-2.5xl text-[#0FEE65]">favorite</span>
            <div>
              <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider">Financial health</p>
              <h4 className="text-base font-black text-[#0FEE65] leading-tight">+18.4%</h4>
            </div>
          </div>

          <div className="bg-[#121212] border border-white/10 text-white p-4 rounded-[20px] shadow-2xl flex items-center gap-3.5 w-full max-w-[240px] text-left transform transition-transform hover:scale-[1.03]">
            <span className="material-symbols-outlined text-2.5xl text-[#0FEE65]">account_balance_wallet</span>
            <div>
              <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider">Safe to spend today</p>
              <h4 className="text-base font-black text-white leading-tight">₹420</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div ref={indicatorRef} className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center gap-2 pointer-events-none">
        <span className="font-hanken text-[9px] font-bold uppercase tracking-[0.2em] text-[#121212]/60">Scroll to explore</span>
        <div className="w-[1.5px] h-8 bg-black/20 relative overflow-hidden rounded-full">
          <div className="absolute top-0 left-0 w-full h-1/2 bg-[#121212] rounded-full animate-scroll-dash" />
        </div>
      </div>
    </section>
  );
};