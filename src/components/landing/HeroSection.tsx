/**
 * HeroSection.tsx
 *
 * The hero section IS the pinned element (trigger === pin).
 * This is the standard, proven GSAP ScrollTrigger pattern.
 *
 * Layout:
 *   [section - 100vh, position:relative, bg:#0a0a0a]
 *     [canvas  - absolute, fills section, z-index:0]    ← animation bg
 *     [gradient- absolute, left fade,     z-index:5]    ← text legibility
 *     [content - absolute, left side,     z-index:10]   ← text + CTAs
 *     [scroll  - absolute, bottom centre, z-index:10]   ← indicator
 *
 * GSAP pins the <section> itself from "top top" for 5000px,
 * then releases — the section naturally scrolls up revealing next content.
 */
import React, { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import heroMobileImg from '../../assets/images/hero_mobile.png';

gsap.registerPlugin(ScrollTrigger);

// ── Frame loading — NO query:?url, use default export directly ──────────────
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
const SCROLL_DISTANCE = 5000; // px pinned scroll distance

// ── Component ───────────────────────────────────────────────────────────────
interface HeroSectionProps {
  onAuthTrigger: (mode: 'signin' | 'signup' | 'demo') => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onAuthTrigger }) => {
  const sectionRef  = useRef<HTMLElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const imagesRef   = useRef<HTMLImageElement[]>([]);
  const frameRef    = useRef(0);
  const dimsRef     = useRef({ w: 0, h: 0, dpr: 1 });

  // ── draw one frame ────────────────────────────────────────────────────────
  const renderFrame = (idx: number) => {
    const canvas = canvasRef.current;
    const img    = imagesRef.current[idx];
    if (!canvas || !img?.complete) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { w, h } = dimsRef.current;
    ctx.clearRect(0, 0, w, h);

    // object-contain: centre image, preserve aspect ratio
    const ia = img.naturalWidth / img.naturalHeight;
    const ca = w / h;
    let dw = w, dh = h, dx = 0, dy = 0;
    if (ca > ia) { dw = h * ia; dx = (w - dw) / 2; }
    else         { dh = w / ia; dy = (h - dh) / 2; }

    ctx.drawImage(img, dx, dy, dw, dh);
    frameRef.current = idx;
  };

  // ── set canvas pixel buffer ────────────────────────────────────────────────
  const resizeCanvas = () => {
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
    renderFrame(frameRef.current);
  };

  // ── Main effect ────────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    if (window.innerWidth < 1024) return; // mobile uses static image
    if (!sectionRef.current || !canvasRef.current) return;
    if (TOTAL_FRAMES === 0) return;

    // 1. Size canvas immediately
    resizeCanvas();

    // 2. Preload: frame 0 first, rest in background
    FRAME_URLS.forEach((url, i) => {
      const img = new Image();
      img.src   = url;
      img.onload = () => {
        imagesRef.current[i] = img;
        if (i === 0) renderFrame(0); // show first frame as soon as ready
      };
    });

    // 3. Resize listener
    const onResize = () => resizeCanvas();
    window.addEventListener('resize', onResize);

    // 4. THE master ScrollTrigger
    //    trigger === pin (section pins itself) — clean, standard pattern
    const st = ScrollTrigger.create({
      trigger:      sectionRef.current,
      start:        'top top',
      end:          `+=${SCROLL_DISTANCE}`,
      pin:          true,        // pin the trigger element (section) itself
      pinSpacing:   true,        // pushes following content down
      anticipatePin: 1,
      scrub:        true,

      onUpdate(self) {
        const frame = Math.round(self.progress * (TOTAL_FRAMES - 1));
        if (imagesRef.current[frame]) renderFrame(frame);
      },

      onRefresh() {
        resizeCanvas();
      },
    });

    return () => {
      st.kill();
      window.removeEventListener('resize', onResize);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── DESKTOP: full-screen pinned hero ── */}
      <section
        ref={sectionRef}
        className="hidden lg:block"
        style={{
          position:   'relative',
          width:      '100%',
          height:     '100vh',
          background: '#0a0a0a',
          overflow:   'hidden',
        }}
      >
        {/* 0. Subtle radial green glow behind animation */}
        <div style={{
          position:   'absolute',
          inset:      0,
          zIndex:     0,
          background: 'radial-gradient(ellipse 55% 60% at 68% 50%, rgba(15,238,101,0.09) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        {/* 1. CANVAS — the animation, z-index 1 */}
        <canvas
          ref={canvasRef}
          style={{
            position:   'absolute',
            inset:      0,
            width:      '100%',
            height:     '100%',
            display:    'block',
            zIndex:     1,
            transform:  'none',
            transition: 'none',
          }}
        />

        {/* 2. Left gradient fade — text legibility over animation, z-index 5 */}
        <div style={{
          position:      'absolute',
          inset:         0,
          zIndex:        5,
          pointerEvents: 'none',
          background:    'linear-gradient(to right, rgba(10,10,10,0.90) 0%, rgba(10,10,10,0.65) 35%, rgba(10,10,10,0.15) 60%, transparent 75%)',
        }} />

        {/* 3. Top bar gradient — navbar readability, z-index 5 */}
        <div style={{
          position:      'absolute',
          top: 0, left: 0, right: 0,
          height:        '8rem',
          zIndex:        5,
          pointerEvents: 'none',
          background:    'linear-gradient(to bottom, rgba(10,10,10,0.6) 0%, transparent 100%)',
        }} />

        {/* 4. LEFT text content, z-index 10 */}
        <div style={{
          position:      'absolute',
          inset:         0,
          zIndex:        10,
          display:       'flex',
          alignItems:    'center',
          pointerEvents: 'none',
        }}>
          <div style={{
            pointerEvents: 'auto',
            marginLeft:    'clamp(40px, 7vw, 120px)',
            maxWidth:      '480px',
            display:       'flex',
            flexDirection: 'column',
            gap:           '1.5rem',
          }}>
            {/* Badge */}
            <div style={{
              display:        'inline-flex',
              alignItems:     'center',
              gap:            '6px',
              padding:        '5px 14px',
              borderRadius:   '9999px',
              border:         '1px solid rgba(255,255,255,0.12)',
              background:     'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(8px)',
              alignSelf:      'flex-start',
            }}>
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: '#0FEE65', boxShadow: '0 0 8px #0FEE65',
                animation: 'pulse 2s infinite',
              }} />
              <span className="font-hanken" style={{
                fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.14em', color: 'rgba(255,255,255,0.5)',
              }}>
                FinBuddy · Student Finance
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-sans" style={{
              fontSize:      'clamp(44px, 5vw, 76px)',
              fontWeight:    800,
              color:         '#fff',
              lineHeight:    1.03,
              letterSpacing: '-0.035em',
              margin:        0,
            }}>
              Your money.<br />
              Your{' '}
              <span style={{ color: '#0FEE65', textShadow: '0 0 32px rgba(15,238,101,0.5)' }}>
                way.
              </span>
            </h1>

            {/* Subtext */}
            <p className="font-sans" style={{
              fontSize:   '14.5px',
              color:      'rgba(255,255,255,0.5)',
              lineHeight: 1.65,
              maxWidth:   '360px',
              margin:     0,
            }}>
              FinBuddy gives students one simple place to track spending, manage
              budgets, split expenses, and build better financial habits.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={() => onAuthTrigger('signup')}
                className="font-hanken"
                style={{
                  background:    '#0FEE65',
                  color:         '#000',
                  border:        'none',
                  padding:       '14px 28px',
                  borderRadius:  '9999px',
                  fontWeight:    700,
                  fontSize:      '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  cursor:        'pointer',
                  boxShadow:     '0 6px 24px rgba(15,238,101,0.35)',
                  transition:    'all 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.background = '#0FEE65')}
              >
                Get Started Free
              </button>
              <button
                onClick={() => onAuthTrigger('demo')}
                className="font-hanken"
                style={{
                  background:     'rgba(255,255,255,0.08)',
                  color:          '#fff',
                  border:         '1px solid rgba(255,255,255,0.15)',
                  padding:        '14px 28px',
                  borderRadius:   '9999px',
                  fontWeight:     700,
                  fontSize:       '11px',
                  textTransform:  'uppercase',
                  letterSpacing:  '0.14em',
                  cursor:         'pointer',
                  backdropFilter: 'blur(8px)',
                  transition:     'all 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}
              >
                Explore FinBuddy
              </button>
            </div>

            {/* Stats */}
            <div style={{
              display:    'flex',
              gap:        '2rem',
              paddingTop: '1.25rem',
              borderTop:  '1px solid rgba(255,255,255,0.08)',
            }}>
              {[['100% Free','For Students'],['Real-Time','Split Ledger'],['Private','No Bank Login']].map(([v, l]) => (
                <div key={l} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span className="font-sans" style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{v}</span>
                  <span className="font-hanken" style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.28)' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 5. Scroll indicator, z-index 10 */}
        <div style={{
          position:      'absolute',
          bottom:        '2rem',
          left:          '50%',
          transform:     'translateX(-50%)',
          zIndex:        10,
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           '6px',
          pointerEvents: 'none',
        }}>
          <span className="font-hanken" style={{
            fontSize: '9px', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.2em', color: 'rgba(255,255,255,0.2)',
          }}>
            Scroll to explore
          </span>
          <div style={{
            width: '1.5px', height: '2rem',
            background: 'rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden', borderRadius: '999px',
          }}>
            <div className="animate-scroll-dash" style={{
              position: 'absolute', top: 0, left: 0,
              width: '100%', height: '50%',
              background: '#0FEE65', borderRadius: '999px',
            }} />
          </div>
        </div>
      </section>

      {/* ── MOBILE: static fallback ── */}
      <div className="lg:hidden w-full min-h-screen flex flex-col items-center justify-center px-6 pt-28 pb-16 gap-6 text-center bg-[#0a0a0a]">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 self-center">
          <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
          <span className="font-hanken text-[10px] font-bold uppercase tracking-widest text-white/50">
            FinBuddy · Student Finance
          </span>
        </div>
        <h1 className="font-sans text-4xl font-extrabold text-white leading-tight tracking-tight max-w-xs">
          Your money.<br />Your <span className="text-neon-green">way.</span>
        </h1>
        <img
          src={heroMobileImg}
          alt="FinBuddy App"
          className="w-auto max-w-[260px] object-contain drop-shadow-[0_24px_48px_rgba(0,0,0,0.6)]"
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
            Explore FinBuddy
          </button>
        </div>
      </div>
    </>
  );
};
