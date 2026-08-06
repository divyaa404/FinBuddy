import React, { useState } from 'react';
import type { Transaction } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import Lottie from 'lottie-react';
import { motion, AnimatePresence } from 'framer-motion';
import paySuccessAnim from '../../assets/animations/pay_success.json';
import timeLoadingAnim from '../../assets/animations/time_loading.json';
import successSound from '../../assets/sounds/success.mp3';

const LottiePlayer = (Lottie as any).default || Lottie;

interface GPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
}

const RECIPIENTS = [
  { name: 'Canteen Chai Wala', handle: 'canteen@upi', avatar: '☕' },
  { name: 'Roomie Rohan', handle: 'rohan@upi', avatar: '👦' },
  { name: 'Campus Xerox Shop', handle: 'xerox@upi', avatar: '📄' },
  { name: 'Auto Driver Kanna', handle: 'auto@upi', avatar: '🛺' },
  { name: 'College Hostel Mess', handle: 'mess@upi', avatar: '🍽️' }
];

const CATEGORIES = ['Food', 'Transport', 'Subscriptions', 'Shopping', 'Entertainment', 'Others'];

export const GPayModal: React.FC<GPayModalProps> = ({ isOpen, onClose, onAddTransaction }) => {
  const [selectedRecipient, setSelectedRecipient] = useState(RECIPIENTS[0]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [note, setNote] = useState('');
  const [paymentStage, setPaymentStage] = useState<'input' | 'processing' | 'success'>('input');

  if (!isOpen) return null;

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    // 1. Move to Processing stage
    setPaymentStage('processing');

    // 2. Wait 2 seconds (time_loading.json processing loop)
    setTimeout(() => {
      // Play success audio
      const audio = new Audio(successSound);
      audio.play().catch(err => console.error("Audio play error:", err));

      setPaymentStage('success');

      // 3. Wait 2.2 seconds (pay_success.json animation)
      setTimeout(() => {
        onAddTransaction({
          amount: parseFloat(amount),
          type: 'expense',
          category,
          date: new Date().toISOString().split('T')[0],
          note: note.trim() || `Paid ${selectedRecipient.name}`
        });
        // Reset states and close
        setAmount('');
        setNote('');
        setCategory('Food');
        setPaymentStage('input');
        onClose();
      }, 2200);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="fixed inset-0" onClick={onClose}></div>

      <Card 
        variant="vessel" 
        className={`w-full max-w-sm p-6 border shadow-2xl relative z-10 text-white flex flex-col gap-6 overflow-hidden transition-all duration-500 rounded-[28px] ${
          paymentStage === 'success' 
            ? 'bg-[#008037] border-[#008037] shadow-[0_12px_40px_rgba(0,128,55,0.3)] animate-pulse-subtle' 
            : 'bg-[#1e2022] border-white/10'
        }`}
      >
        {/* Ambient background glow */}
        {paymentStage !== 'success' && (
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-neon-green/10 rounded-full blur-3xl pointer-events-none"></div>
        )}

        <AnimatePresence mode="wait">
          {paymentStage === 'input' && (
            <motion.div
              key="input-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-5 w-full text-left"
            >
              {/* GPay Header */}
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-red-400 to-yellow-400 font-hanken">
                  FinBuddy Pay
                </span>
                <button type="button" onClick={onClose} className="text-white/40 hover:text-white cursor-pointer">
                  <span className="material-symbols-outlined text-sm font-bold">close</span>
                </button>
              </div>

              <form onSubmit={handlePay} className="flex flex-col gap-5">
                {/* Recipient Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-hanken text-[10px] uppercase font-bold tracking-wider text-white/50">Send Money To</label>
                  <div className="flex gap-2 overflow-x-auto pb-2 snap-x hide-scrollbar">
                    {RECIPIENTS.map(rep => {
                      const isSelected = selectedRecipient.name === rep.name;
                      return (
                        <button
                          key={rep.name}
                          type="button"
                          onClick={() => setSelectedRecipient(rep)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border snap-center cursor-pointer ${
                            isSelected 
                              ? 'bg-neon-green text-[#121212] border-neon-green font-bold' 
                              : 'bg-[#2b2d31] text-white/70 border-white/5 hover:text-white'
                          }`}
                        >
                          <span>{rep.avatar}</span>
                          <span>{rep.name.split(' ')[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Amount input */}
                <div className="flex flex-col items-center gap-1 my-1">
                  <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Amount to Pay</span>
                  <div className="flex items-center justify-center relative w-full">
                    <span className="text-3xl font-extrabold text-white/60 mr-1">₹</span>
                    <input
                      type="number"
                      step="1"
                      placeholder="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      className="bg-transparent text-white font-extrabold text-5xl text-center w-48 outline-none border-b border-transparent focus:border-white/20 transition-all numeric-display"
                      autoFocus
                      min="1"
                    />
                  </div>
                  <span className="text-[10px] text-white/30 font-mono mt-1">{selectedRecipient.handle}</span>
                </div>

                {/* Category Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-hanken text-[10px] uppercase font-bold tracking-wider text-white/50">Category</label>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map(cat => {
                      const isSelected = category === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCategory(cat)}
                          className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold transition-all border cursor-pointer ${
                            isSelected 
                              ? 'bg-neon-green/10 text-neon-green border-neon-green/30' 
                              : 'bg-[#2b2d31] text-white/40 border-white/5 hover:text-white/60'
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Note */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="payment-note" className="font-hanken text-[10px] uppercase font-bold tracking-wider text-white/50">Add a note</label>
                  <input
                    id="payment-note"
                    type="text"
                    placeholder="What is this payment for?"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-xs bg-[#2b2d31] text-white border border-white/10 focus:border-neon-green focus:ring-1 focus:ring-neon-green outline-none"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  className="py-3.5 text-xs font-bold uppercase tracking-wider mt-2 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 border-none text-white hover:opacity-95 shadow-[0_6px_20px_rgba(79,70,229,0.3)] cursor-pointer animate-fade-in"
                >
                  Pay Securely ₹{amount ? parseFloat(amount).toLocaleString() : '0'}
                </Button>
              </form>
            </motion.div>
          )}

          {paymentStage === 'processing' && (
            <motion.div
              key="processing-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex flex-col items-center justify-center py-10 w-full text-center"
            >
              <div className="w-40 h-40">
                <LottiePlayer animationData={timeLoadingAnim} loop={true} />
              </div>
              <h3 className="font-hanken text-lg font-bold mt-6 tracking-wide text-white">Contacting Payment Gateway...</h3>
              <p className="text-white/40 text-xs mt-1 animate-pulse font-mono">Securing connection with bank server...</p>
              <span className="text-[9px] text-white/20 uppercase tracking-widest mt-8 font-semibold">Please do not exit this screen</span>
            </motion.div>
          )}

          {paymentStage === 'success' && (
            <motion.div
              key="success-view"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 90, damping: 12 }}
              className="flex flex-col items-center justify-center py-8 w-full text-center"
            >
              <div className="w-48 h-48 flex items-center justify-center">
                <LottiePlayer animationData={paySuccessAnim} loop={false} />
              </div>
              <h3 className="font-hanken text-2xl font-extrabold mt-4 tracking-wide text-white">Paid Successfully</h3>
              <p className="text-white/90 font-mono text-sm mt-1.5">₹{parseFloat(amount).toFixed(2)} sent to {selectedRecipient.name}</p>
              <span className="text-[10px] text-white/40 uppercase tracking-widest mt-2 font-mono">Ref ID: TXN-{Date.now().toString().slice(-6)}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
};
