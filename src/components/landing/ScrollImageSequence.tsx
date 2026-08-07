/**
 * ScrollImageSequence.tsx
 *
 * ONE ScrollTrigger owns pinning + frame scrubbing.
 * Canvas uses window.innerWidth/innerHeight — never 0.
 * No ScrollTrigger.refresh() calls — prevents auto-scroll loops.
 */
import React, { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import heroMobileImg from '../../assets/images/hero_mobile.png';

gsap.registerPlugin(ScrollTrigger);

// ── Frame URLs sorted numerically ──────────────────────────────────────────
const rawModules = import.meta.glob(
  '../../assets/images/hero_animation/Comp 1/hero*.png',
  { eager: true, import: 'default', query: '?url' }
) as Record<string, string>;

const FRAME_URLS: string[] = Object.keys(rawModules)
  .sort((a, b) => {
    const n = (s: string) => parseInt(s.match(/hero(\d+)/)?.[1] ?? '0', 10);
    return n(a) - n(b);
  })
  .map((k) => rawModules[k]);

const TOTAL_FRAMES = FRAME_URLS.length; // 116

/** Increase for slower, more cinematic feel. Decrease for snappier. */
export const ANIMATION_SCROLL_DISTANCE = 5000;

// ── Props ──────────────────────────────────────────────────────────────────
interface Props {
  sectionRef:    React.RefObject<HTMLElement | null>;
  pinnedRef:     React.RefObject<HTMLDivElement | null>;
  introRef:      React.RefObject<HTMLDivElement | null>;
  outroRef:      React.RefObject<HTMLDivElement | null>;
  indicatorRef:  React.RefObject<HTMLDivElement | null>;
}

// ── Component ──────────────────────────────────────────────────────────────
export const ScrollImageSequence: React.FC<Props> = ({
  sectionRef, pinnedRef, introRef, outroRef, indicatorRef,
}) => {
  const canvasRef       = useRef<HTMLCanvasElement>(null);
  const imagesRef       = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef(0);
  const dimsRef         = useRef({ w: 0, h: 0, dpr: 1 });

  // ── renderFrame ────────────────────────────────────────────────────────
  const renderFrame = (index: number) => {
    const canvas = canvasRef.current;
    const img    = imagesRef.current[index];
    if (!canvas || !img?.complete) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { w, h } = dimsRef.current;
    ctx.clearRect(0, 0, w, h);

    // object-contain: preserve image aspect ratio, centre in canvas
    const ia = img.naturalWidth / img.naturalHeight;
    const ca = w / h;
    let dw = w, dh = h, dx = 0, dy = 0;
    if (ca > ia) { dw = h * ia; dx = (w - dw) / 2; }
    else         { dh = w / ia; dy = (h - dh) / 2; }

    ctx.drawImage(img, dx, dy, dw, dh);
    currentFrameRef.current = index;
  };

  // ── updateCanvasSize ───────────────────────────────────────────────────
  // Uses window dimensions — always correct, never 0, immune to layout timing.
  const updateCanvasSize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const w   = window.innerWidth;
    const h   = window.innerHeight;

    dimsRef.current = { w, h, dpr };
    canvas.width    = Math.floor(w * dpr);
    canvas.height   = Math.floor(h * dpr);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    }

    renderFrame(currentFrameRef.current);
  };

  // ── Main effect ────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    // Skip on mobile — no canvas, no ST
    if (window.innerWidth < 1024) return;
    if (!sectionRef.current || !pinnedRef.current || !canvasRef.current) return;
    if (TOTAL_FRAMES === 0) return;

    // 1. Size canvas immediately (window dims are always available)
    updateCanvasSize();

    // 2. Preload all frames; render frame 0 as soon as it arrives
    FRAME_URLS.forEach((url, i) => {
      const img = new Image();
      img.src   = url;
      img.onload = () => {
        imagesRef.current[i] = img;
        if (i === 0) renderFrame(0);
      };
    });

    // 3. Resize handler — re-size canvas and redraw current frame
    const onResize = () => {
      updateCanvasSize();
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);

    // 4. Text choreography helper (called inside onUpdate — no extra ST needed)
    const setTextProgress = (p: number) => {
      // Scroll indicator: fade out first 5%
      if (indicatorRef.current) {
        const op = p <= 0.05 ? 1 - p / 0.05 : 0;
        gsap.set(indicatorRef.current, { opacity: op, y: p * 14 });
      }
      // Intro content: visible 0-20%, fades 20-30%
      if (introRef.current) {
        const op = p <= 0.20 ? 1 : p >= 0.30 ? 0 : 1 - (p - 0.20) / 0.10;
        const y  = p > 0.20 ? -((p - 0.20) / 0.10) * 36 : 0;
        gsap.set(introRef.current, { opacity: op, y });
      }
      // Outro content: fades in 80-95%
      if (outroRef.current) {
        const op = p < 0.80 ? 0 : p > 0.95 ? 1 : (p - 0.80) / 0.15;
        const y  = p < 0.80 ? 36 : (1 - (p - 0.80) / 0.15) * 36;
        gsap.set(outroRef.current, { opacity: op, y: Math.max(0, y) });
      }
    };

    // 5. ONE master ScrollTrigger — owns pinning + scrubbing
    //    end: `+=5000` means the pin lasts exactly 5000 scrolled-px.
    //    Frame 115 is reached at progress=1 which is exactly when pin releases.
    const st = ScrollTrigger.create({
      trigger:      sectionRef.current,
      start:        'top top',
      end:          `+=${ANIMATION_SCROLL_DISTANCE}`,
      pin:          pinnedRef.current,
      pinSpacing:   true,   // spacer pushes next section down
      anticipatePin: 1,
      scrub:        true,   // 1:1 direct scroll-to-frame, fully reversible

      onUpdate(self) {
        const frame = Math.round(self.progress * (TOTAL_FRAMES - 1));
        if (imagesRef.current[frame]) renderFrame(frame);
        setTextProgress(self.progress);
      },

      // NOTE: Do NOT call ScrollTrigger.refresh() here — it creates
      //       an infinite refresh loop that auto-scrolls the page.
      onRefresh() {
        updateCanvasSize();
      },
    });

    return () => {
      st.kill();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <canvas
      ref={canvasRef}
      style={{
        position:         'absolute',
        inset:            0,
        width:            '100%',
        height:           '100%',
        display:          'block',
        willChange:       'contents',  // hint GPU to composite this layer
        transform:        'none',      // never let CSS move the canvas
        transition:       'none',
        backgroundColor:  'transparent',
      }}
    />
  );
};

// ── Mobile fallback ────────────────────────────────────────────────────────
export const MobileHeroFallback: React.FC<{
  onAuthTrigger: (m: 'signin' | 'signup' | 'demo') => void;
}> = ({ onAuthTrigger }) => (
  <div className="lg:hidden w-full min-h-screen flex flex-col items-center justify-center px-6 pt-28 pb-16 gap-6 text-center bg-[#0a0a0a]">
    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 self-center">
      <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
      <span className="font-hanken text-[10px] font-bold uppercase tracking-widest text-white/50">
        FinBuddy · Student Finance
      </span>
    </div>
    <h1 className="font-sans text-4xl font-extrabold text-white leading-[1.05] tracking-tight max-w-xs">
      Your money.<br />Your <span className="text-neon-green">way.</span>
    </h1>
    <img
      src={heroMobileImg}
      alt="FinBuddy App"
      className="w-auto max-w-[240px] object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
    />
    <p className="font-sans text-sm text-white/45 leading-relaxed max-w-sm">
      Track spending, plan budgets, split expenses and build better financial habits.
    </p>
    <div className="flex flex-col w-full gap-3 max-w-xs">
      <button onClick={() => onAuthTrigger('signup')}
        className="w-full bg-neon-green text-black px-7 py-4 rounded-full font-hanken font-bold text-xs uppercase tracking-widest cursor-pointer">
        Get Started Free
      </button>
      <button onClick={() => onAuthTrigger('demo')}
        className="w-full border border-white/10 text-white px-7 py-4 rounded-full font-hanken font-bold text-xs uppercase tracking-widest cursor-pointer">
        Live Demo
      </button>
    </div>
  </div>
);
