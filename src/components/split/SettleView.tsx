import React, { useState, useEffect, useRef } from 'react';
import { settleParticipantPayment } from '../../firebase/db';
import { Card } from '../ui/Card';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import successSound from '../../assets/sounds/success.mp3';

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

  useEffect(() => {
    if (containerRef.current) {
      // Handle is 48px (w-12), padding is 4px (left-1)
      setDragWidth(containerRef.current.clientWidth - 56);
    }
  }, [hasPaid]);

  const handlePayment = async () => {
    setLoading(true);
    try {
      // 1. Play success sound effect
      const audio = new Audio(successSound);
      audio.play().catch(e => console.error("Audio playback error:", e));

      // 2. Mark as paid in Firestore
      await settleParticipantPayment(splitId, participantId);
      
      // 3. Trigger Confetti celebration
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
      
    } catch (error) {
      console.error('Error recording payment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#141517] flex flex-col justify-center items-center p-6 text-left relative overflow-hidden">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 -right-32 w-80 h-80 bg-neon-green/5 rounded-full blur-[90px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 -left-32 w-80 h-80 bg-primary/5 rounded-full blur-[90px] pointer-events-none"></div>

      <Card variant="vessel" className="w-full max-w-sm p-6 rounded-[28px] border border-white/10 shadow-2xl relative overflow-hidden flex flex-col gap-6 bg-[#1a1c1e] text-white">
        
        {/* Glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-neon-green/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col items-center text-center gap-2 border-b border-white/5 pb-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            hasPaid ? 'bg-neon-green/20 text-neon-green neon-glow-strong' : 'bg-yellow-500/10 text-yellow-400'
          } mb-1`}>
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              {hasPaid ? 'check_circle' : 'payments'}
            </span>
          </div>
          <h3 className="font-hanken text-lg font-bold text-white">
            {hasPaid ? 'Payment Settled!' : 'Outstanding Dues'}
          </h3>
          <p className="text-xs text-white/50">
            Split initiated by <strong className="text-white">{ownerName}</strong>
          </p>
        </div>

        {/* Bill Amount Details */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-white/50 font-medium font-hanken uppercase tracking-wider">Roomie Share:</span>
            <span className="text-xs text-white font-medium">{participantName}</span>
          </div>
          
          <div className="flex justify-between items-baseline border-b border-white/5 pb-3">
            <span className="text-xs text-white/50 font-medium font-hanken uppercase tracking-wider">Status:</span>
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
              hasPaid ? 'bg-neon-green/10 text-neon-green border border-neon-green/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
            }`}>
              {hasPaid ? 'Settled' : 'Unpaid'}
            </span>
          </div>

          <div className="flex justify-between items-baseline pt-2">
            <span className="text-sm font-semibold text-white/70 font-hanken uppercase tracking-wider">Amount Owed:</span>
            <span className={`text-3xl font-extrabold numeric-display ${hasPaid ? 'text-white/40 line-through' : 'text-neon-green'}`}>
              ₹{amountOwed.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Pay Action - Swipe to Pay Slider */}
        {!hasPaid ? (
          <div className="flex flex-col gap-2 mt-2">
            <div 
              ref={containerRef}
              className="relative w-full h-14 bg-[#232629] border border-white/10 rounded-full flex items-center justify-center overflow-hidden shadow-inner"
            >
              {/* Pulsing Guide Text */}
              <span className="font-hanken text-[10px] uppercase font-black tracking-widest text-white/40 animate-pulse pointer-events-none select-none">
                {loading ? 'Processing...' : 'Slide to Pay >>>'}
              </span>

              {/* Swipeable Handle */}
              {!loading && (
                <motion.div
                  drag="x"
                  dragConstraints={{ left: 0, right: dragWidth }}
                  dragElastic={0.05}
                  dragMomentum={false}
                  onDragEnd={(_event, info) => {
                    // Trigger pay if swiped past 85% of track width
                    if (info.offset.x >= dragWidth * 0.85) {
                      handlePayment();
                    }
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="absolute left-1 w-12 h-12 rounded-full bg-neon-green text-[#121212] flex items-center justify-center cursor-grab active:cursor-grabbing shadow-[0_0_15px_rgba(15,238,101,0.5)] z-20 transition-transform"
                >
                  <span className="material-symbols-outlined font-bold pointer-events-none">arrow_forward</span>
                </motion.div>
              )}
            </div>
            <p className="text-[9px] text-white/30 text-center font-semibold uppercase tracking-wider mt-1">
              Swipe handle to complete payment
            </p>
          </div>
        ) : (
          <div className="text-center py-3 bg-neon-green/10 text-neon-green rounded-xl border border-neon-green/25 font-bold font-hanken text-sm flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm font-bold">check_circle</span>
            Paid to {ownerName}
          </div>
        )}

        <p className="text-[10px] text-white/30 text-center leading-relaxed mt-1 border-t border-white/5 pt-3">
          * Demopay settlement system simulated for ACM hackathon evaluation.
        </p>

      </Card>
    </div>
  );
};
