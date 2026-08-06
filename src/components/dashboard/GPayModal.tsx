import React, { useState } from 'react';
import type { Transaction } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import Lottie from 'lottie-react';
import paySuccessAnim from '../../assets/animations/pay_success.json';
import timeLoadingAnim from '../../assets/animations/time_loading.json';

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

  // PROCESSING STAGE VIEW (time_loading.json)
  if (paymentStage === 'processing') {
    return (
      <div className="fixed inset-0 z-50 bg-[#121212] flex flex-col items-center justify-center p-6 text-white animate-fade-in">
        <div className="w-48 h-48 flex items-center justify-center">
          <LottiePlayer animationData={timeLoadingAnim} loop={true} />
        </div>
        <h3 className="font-hanken text-xl font-bold mt-6 tracking-wide text-white">Contacting Payment Gateway...</h3>
        <p className="text-white/40 text-xs mt-1 animate-pulse font-mono">Securing connection with bank server...</p>
        <span className="text-[10px] text-white/20 uppercase tracking-widest mt-6">Please do not press back or close this screen</span>
      </div>
    );
  }

  // SUCCESS STAGE VIEW (pay_success.json)
  if (paymentStage === 'success') {
    return (
      <div className="fixed inset-0 z-50 bg-[#008037] flex flex-col items-center justify-center p-6 text-white animate-fade-in">
        <div className="w-56 h-56 flex items-center justify-center">
          <LottiePlayer animationData={paySuccessAnim} loop={false} />
        </div>
        <h3 className="font-hanken text-2xl font-extrabold mt-6 tracking-wide">Paid Successfully</h3>
        <p className="text-white/80 font-mono text-sm mt-2">₹{parseFloat(amount).toFixed(2)} sent to {selectedRecipient.name}</p>
        <span className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Ref ID: TXN-{Date.now().toString().slice(-6)}</span>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm animate-fade-in">
      
      {/* Click outside to close */}
      <div className="fixed inset-0" onClick={onClose}></div>

      <Card variant="vessel" className="w-full max-w-sm p-6 border border-white/10 rounded-[28px] shadow-2xl relative z-10 bg-[#121212] text-white flex flex-col gap-6 overflow-hidden">
        
        {/* Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-neon-green/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* GPay Header */}
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-red-400 to-yellow-400 font-hanken">
              FinBuddy Pay
            </span>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white cursor-pointer">
            <span className="material-symbols-outlined text-sm font-bold">close</span>
          </button>
        </div>

        <form onSubmit={handlePay} className="flex flex-col gap-5">
          
          {/* 1. Recipient Deck */}
          <div className="flex flex-col gap-1.5 text-left">
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
                        : 'bg-[#222] text-white/70 border-white/5 hover:text-white'
                    }`}
                  >
                    <span>{rep.avatar}</span>
                    <span>{rep.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. GPay style amount input */}
          <div className="flex flex-col items-center gap-1 my-2">
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

          {/* 3. Category Selector pills */}
          <div className="flex flex-col gap-1.5 text-left">
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
                        : 'bg-[#1b1c1c] text-white/40 border-white/5 hover:text-white/60'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Note Input */}
          <div className="text-left flex flex-col gap-1.5">
            <label htmlFor="payment-note" className="font-hanken text-[10px] uppercase font-bold tracking-wider text-white/50">Add a note</label>
            <input
              id="payment-note"
              type="text"
              placeholder="What is this payment for?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-xs bg-[#222] text-white border border-white/10 focus:border-neon-green focus:ring-1 focus:ring-neon-green outline-none"
            />
          </div>

          {/* 5. GPay Submit button */}
          <Button
            type="submit"
            variant="primary"
            fullWidth
            className="py-3.5 text-xs font-bold uppercase tracking-wider mt-2 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 border-none text-white hover:opacity-95 shadow-[0_6px_20px_rgba(79,70,229,0.3)]"
          >
            Pay Securely ₹{amount ? parseFloat(amount).toLocaleString() : '0'}
          </Button>

        </form>

      </Card>
    </div>
  );
};
