import React, { useState } from 'react';
import { settleParticipantPayment } from '../../firebase/db';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import confetti from 'canvas-confetti';

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

  const handlePayment = async () => {
    setLoading(true);
    try {
      // 1. Mark as paid in Firestore
      await settleParticipantPayment(splitId, participantId);
      
      // 2. Trigger Confetti celebration
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
    <div className="min-h-screen bg-[#fbf9f8] flex flex-col justify-center items-center p-6 text-left">
      <Card variant="vessel" className="w-full max-w-sm p-6 rounded-[24px] border border-white/[0.08] shadow-2xl relative overflow-hidden flex flex-col gap-6">
        
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
            <span className="text-xs text-white/50 font-medium">Roomie Share:</span>
            <span className="text-xs text-white font-medium">{participantName}</span>
          </div>
          
          <div className="flex justify-between items-baseline border-b border-white/5 pb-3">
            <span className="text-xs text-white/50 font-medium">Status:</span>
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
              hasPaid ? 'bg-neon-green/10 text-neon-green border border-neon-green/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
            }`}>
              {hasPaid ? 'Settled' : 'Unpaid'}
            </span>
          </div>

          <div className="flex justify-between items-baseline pt-2">
            <span className="text-sm font-semibold text-white/70">Amount Owed:</span>
            <span className={`text-3xl font-extrabold numeric-display ${hasPaid ? 'text-white/40 line-through' : 'text-neon-green'}`}>
              ₹{amountOwed.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Pay Action Buttons */}
        {!hasPaid ? (
          <Button
            variant="primary"
            onClick={handlePayment}
            disabled={loading}
            fullWidth
            className="py-4 text-base uppercase tracking-wider font-bold"
          >
            {loading ? 'Settling Share...' : `Pay ₹${amountOwed.toFixed(2)}`}
          </Button>
        ) : (
          <div className="text-center py-2.5 bg-neon-green/10 text-neon-green rounded-xl border border-neon-green/25 font-bold font-hanken text-sm flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm font-bold">check_circle</span>
            Paid to {ownerName}
          </div>
        )}

        <p className="text-[10px] text-white/30 text-center leading-relaxed mt-1">
          * Demopay settlement system simulated for ACM hackathon evaluation.
        </p>

      </Card>
    </div>
  );
};
