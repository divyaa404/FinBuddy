import React, { useState, useEffect, useRef } from 'react';
import { settleParticipantPayment } from '../../firebase/db';
import { Card } from '../ui/Card';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import successSound from '../../assets/sounds/success.mp3';
import Lottie from 'lottie-react';
import paySuccessAnim from '../../assets/animations/pay_success.json';

const LottiePlayer = (Lottie as any).default || Lottie;

interface SettleViewProps {
  splitId: string;
  participantId: string;
  participantName: string;
  amountOwed: number;
  hasPaid: boolean;
  ownerName: string;
}

export const SettleView: React.FC<SettleViewProps> = ({
  splitId,
  participantId,
  participantName,
  amountOwed,
  hasPaid,
  ownerName
}) => {
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragWidth, setDragWidth] = useState(220);

  // Slider coordinates state for spring-back physics
  const [sliderX, setSliderX] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      setDragWidth(containerRef.current.clientWidth - 56);
    }
  }, [hasPaid]);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const audio = new Audio(successSound);
      audio.play().catch(e => console.error("Audio playback error:", e));

      await settleParticipantPayment(splitId, participantId);
      
      confetti({
        particleCount: 160,
        spread: 80,
        origin: { y: 0.6 }
      });
      
    } catch (error) {
      console.error('Error recording payment:', error);
    } finally {
      // Small timeout for visual flow
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-[#141517] flex flex-col justify-center items-center p-6 text-left relative overflow-hidden">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 -right-32 w-80 h-80 bg-neon-green/5 rounded-full blur-[90px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 -left-32 w-80 h-80 bg-primary/5 rounded-full blur-[90px] pointer-events-none"></div>

      <Card variant="vessel" className="w-full max-w-sm p-6 rounded-[28px] border border-white/10 shadow-2xl relative overflow-hidden flex flex-col gap-6 bg-[#1a1c1e]/90 backdrop-blur-md text-white">
        
        {/* Glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-neon-green/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col items-center text-center gap-2 border-b border-white/5 pb-4">
          
          {hasPaid ? (
            /* Autoplays success lottie checkmark animation */
            <div className="w-24 h-24 -my-4 flex items-center justify-center">
              <LottiePlayer animationData={paySuccessAnim} loop={false} autoplay={true} className="w-full h-full" />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-full flex items-center justify-center bg-yellow-500/10 text-yellow-400 mb-1 border border-yellow-500/20">
              <span className="material-symbols-outlined text-3xl">payments</span>
            </div>
          )}

          <h3 className="font-hanken text-base font-bold text-white mt-1">
            {hasPaid ? 'Payment Settled!' : 'Outstanding Dues'}
          </h3>
          <p className="text-xs text-white/50 font-sans">
            Split initiated by <strong className="text-white font-semibold">{ownerName}</strong>
          </p>
        </div>

        {/* Bill Amount Details */}
        <div className="flex flex-col gap-3 font-sans">
          <div className="flex justify-between items-baseline text-xs">
            <span className="text-white/40 uppercase font-bold tracking-wider font-hanken">Roomie Share:</span>
            <span className="text-white font-medium">{participantName}</span>
          </div>
          
          <div className="flex justify-between items-baseline border-b border-white/5 pb-3 text-xs">
            <span className="text-white/40 uppercase font-bold tracking-wider font-hanken">Status:</span>
            <span className={`text-[9px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full border ${
              hasPaid ? 'bg-neon-green/10 text-neon-green border-neon-green/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
            }`}>
              {hasPaid ? 'Settled' : 'Unpaid'}
            </span>
          </div>

          <div className="flex justify-between items-baseline pt-2">
            <span className="text-xs font-bold text-white/60 font-hanken uppercase tracking-wider">Amount Owed:</span>
            {/* Safe numerical render with fallback values (Prevents Firestore race condition crashes) */}
            <span className={`text-3xl font-extrabold numeric-display ${hasPaid ? 'text-white/30 line-through' : 'text-neon-green'}`}>
              ₹{(amountOwed || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Pay Action - Swipe to Pay Slider */}
        {!hasPaid ? (
          <div className="flex flex-col gap-2 mt-2">
            <div 
              ref={containerRef}
              className="relative w-full h-14 bg-[#121214] border border-white/10 rounded-full flex items-center justify-center overflow-hidden shadow-inner"
            >
              {/* Pulsing Guide Text */}
              <span className="font-hanken text-[10px] uppercase font-black tracking-widest text-white/30 animate-pulse pointer-events-none select-none">
                {loading ? 'Processing...' : 'Slide to Pay >>>'}
              </span>

              {/* Swipeable Spring-back Handle */}
              {!loading && (
                <motion.div
                  drag="x"
                  dragConstraints={{ left: 0, right: dragWidth }}
                  dragElastic={0.05}
                  dragMomentum={false}
                  animate={{ x: sliderX }}
                  onDrag={(_event, info) => {
                    setSliderX(info.offset.x);
                  }}
                  onDragEnd={(_event, info) => {
                    if (info.offset.x >= dragWidth * 0.85) {
                      setSliderX(dragWidth);
                      handlePayment();
                    } else {
                      setSliderX(0); // Smooth spring back snap
                    }
                  }}
                  transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                  whileTap={{ scale: 0.95 }}
                  className="absolute left-1 w-12 h-12 rounded-full bg-neon-green text-[#121212] flex items-center justify-center cursor-grab active:cursor-grabbing shadow-[0_0_15px_rgba(15,238,101,0.5)] z-20"
                >
                  <span className="material-symbols-outlined font-bold pointer-events-none">arrow_forward</span>
                </motion.div>
              )}
            </div>
            <p className="text-[9px] text-white/30 text-center font-bold uppercase tracking-wider mt-1.5 font-hanken">
              Swipe handle to complete payment
            </p>
          </div>
        ) : (
          <div className="text-center py-3 bg-neon-green/10 text-neon-green rounded-2xl border border-neon-green/20 font-bold font-hanken text-xs uppercase tracking-wider flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm font-bold">check_circle</span>
            Paid to {ownerName}
          </div>
        )}

        <p className="text-[8px] font-medium tracking-wide text-white/20 text-center uppercase leading-normal mt-1 border-t border-white/5 pt-3">
          * Demopay settlement system simulated for ACM hackathon evaluation.
        </p>

      </Card>
    </div>
  );
};
