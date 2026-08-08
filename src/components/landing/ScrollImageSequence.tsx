import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScrollImageSequenceProps {
  frameUrls: string[];
  totalFrames: number;
  scrollDistance?: number;
  className?: string;
  onFrameRender?: (frame: number) => void;
}

export const ScrollImageSequence: React.FC<ScrollImageSequenceProps> = ({
  frameUrls,
  totalFrames,
  scrollDistance = 5000,
  className = '',
  onFrameRender,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef(0);

  const renderFrame = (index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = imagesRef.current[index];
    if (!img || !img.complete) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    if (canvas.width !== Math.floor(rect.width * dpr) || canvas.height !== Math.floor(rect.height * dpr)) {
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    }

    const w = rect.width;
    const h = rect.height;
    ctx.clearRect(0, 0, w, h);

    const ia = img.naturalWidth / img.naturalHeight;
    const ca = w / h;
    let dw = w, dh = h, dx = 0, dy = 0;

    if (ca > ia) {
      dw = h * ia;
      dx = (w - dw) / 2;
    } else {
      dh = w / ia;
      dy = (h - dh) / 2;
    }

    ctx.drawImage(img, dx, dy, dw, dh);
    currentFrameRef.current = index;
    onFrameRender?.(index);
  };

  useEffect(() => {
    // Load first frame immediately
    const img0 = new Image();
    img0.src = frameUrls[0];
    img0.onload = () => {
      imagesRef.current[0] = img0;
      renderFrame(0);
    };

    // Preload remaining frames
    frameUrls.forEach((url, i) => {
      if (i === 0) return;
      const img = new Image();
      img.src = url;
      img.onload = () => {
        imagesRef.current[i] = img;
      };
    });
  }, [frameUrls]);

  useEffect(() => {
    if (!triggerRef.current || !canvasRef.current) return;

    const handleResize = () => {
      renderFrame(currentFrameRef.current);
    };
    window.addEventListener('resize', handleResize);

    const ctx = gsap.context(() => {
      gsap.timeline({
        scrollTrigger: {
          trigger: triggerRef.current,
          start: 'top top',
          end: `+=${scrollDistance}`,
          scrub: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            const progress = self.progress;
            const frame = Math.round(progress * (totalFrames - 1));
            const clampedFrame = Math.max(0, Math.min(totalFrames - 1, frame));
            
            if (imagesRef.current[clampedFrame]) {
              renderFrame(clampedFrame);
            }
          },
          onRefresh: () => {
            renderFrame(currentFrameRef.current);
          }
        }
      });
    });

    return () => {
      ctx.revert();
      window.removeEventListener('resize', handleResize);
    };
  }, [frameUrls, totalFrames, scrollDistance]);

  return (
    <div ref={triggerRef} className={`relative ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full object-contain" />
    </div>
  );
};
