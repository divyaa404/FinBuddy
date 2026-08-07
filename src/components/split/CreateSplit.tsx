import React, { useState } from 'react';
import { createSplit } from '../../firebase/db';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import splitCardImg from '../../assets/images/split_card.png';
import { motion } from 'framer-motion';

interface CreateSplitProps {
  ownerId: string;
  ownerName: string;
  onCreateSuccess: (splitId: string) => void;
}

interface ItemField {
  id: string;
  name: string;
  price: number;
}

const GUIDE_STEPS = [
  { step: '1', title: 'Setup Split', desc: 'Choose between Split Evenly or Itemized to enter individual line items.' },
  { step: '2', title: 'Generate QR', desc: 'Create a live local storage lobby session and render a custom QR code.' },
  { step: '3', title: 'Roomies Scan', desc: 'Roommates scan the QR code to join the live session on their devices.' },
  { step: '4', title: 'Pay & Settle', desc: 'Compute items, pay via integrated secure UPI, and log directly in ledger.' }
];

const SPLIT_HISTORY = [
  { id: '1', tag: '#COLAB-LUNCH-310', category: 'Food', amount: 1711, mode: 'Itemized', date: 'Today', status: 'Settled', statusColor: 'text-[#008037] bg-emerald-50 border-emerald-200' },
  { id: '2', tag: '#DORM-PIZZA-99', category: 'Food', amount: 830, mode: 'Even', date: '3 days ago', status: 'Settled', statusColor: 'text-[#008037] bg-emerald-50 border-emerald-200' },
  { id: '3', tag: '#TAXI-RIDE-401', category: 'Transport', amount: 450, mode: 'Even', date: '1 week ago', status: 'Pending', statusColor: 'text-amber-700 bg-amber-50 border-amber-200' },
  { id: '4', tag: '#ROOM-SUPPLIES-04', category: 'Supplies', amount: 1200, mode: 'Itemized', date: '2 weeks ago', status: 'Settled', statusColor: 'text-[#008037] bg-emerald-50 border-emerald-200' }
];

export const CreateSplit: React.FC<CreateSplitProps> = ({
  ownerId,
  ownerName,
  onCreateSuccess
}) => {
  const [showForm, setShowForm] = useState(false);
  const [totalAmount, setTotalAmount] = useState('');
  const [mode, setMode] = useState<'even' | 'itemized'>('even');
  const [participantCount, setParticipantCount] = useState('2');
  const [gstPercent, setGstPercent] = useState('0');
  
  // Itemized fields state
  const [items, setItems] = useState<ItemField[]>([
    { id: '1', name: 'Pizza', price: 650 },
    { id: '2', name: 'Drinks', price: 180 }
  ]);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddItem = () => {
    if (!itemName || !itemPrice || parseFloat(itemPrice) <= 0) return;
    const newItem: ItemField = {
      id: Date.now().toString(),
      name: itemName,
      price: parseFloat(itemPrice)
    };
    setItems([...items, newItem]);
    
    // Auto-update total amount based on items sum
    const newItems = [...items, newItem];
    const newTotal = newItems.reduce((sum, item) => sum + item.price, 0);
    setTotalAmount(newTotal.toFixed(2));

    setItemName('');
    setItemPrice('');
  };

  const handleRemoveItem = (id: string) => {
    const updated = items.filter(item => item.id !== id);
    setItems(updated);
    const newTotal = updated.reduce((sum, item) => sum + item.price, 0);
    setTotalAmount(newTotal.toFixed(2));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      setError('Please provide a valid bill amount.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const parsedAmount = parseFloat(totalAmount);
      const parsedGst = parseFloat(gstPercent) || 0;
      const count = parseInt(participantCount) || 1;

      const splitId = await createSplit(ownerId, ownerName, parsedAmount, mode, {
        gstPercent: parsedGst,
        items: mode === 'itemized' ? items : undefined,
        participantCount: mode === 'even' ? count : undefined
      });

      onCreateSuccess(splitId);
    } catch (err: any) {
      console.error('Error creating split:', err);
      setError(err.message || 'Failed to create split session. Check connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left w-full">
      
      {/* 1. Promotional Top Banner (Uses split_card.png) */}
      <div className="bg-[#121212] text-white rounded-[24px] p-6 relative overflow-hidden flex justify-between items-center border border-white/5 shadow-xl min-h-[160px]">
        {/* Glow */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-neon-green via-transparent to-transparent pointer-events-none"></div>
        
        {/* Left Side Info & Action */}
        <div className="flex flex-col gap-3 relative z-10 max-w-[65%]">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] uppercase tracking-wider text-neon-green font-extrabold px-2 py-0.5 rounded bg-neon-green/10 border border-neon-green/20 self-start">
              Dorm Split Engine
            </span>
            <h3 className="font-hanken font-bold text-xl text-white mt-1.5 leading-snug">Split bills. Settle faster.</h3>
            <p className="text-xs text-white/50 leading-relaxed font-sans mt-0.5">Generate a live QR session and compute individual bill shares dynamically with friends.</p>
          </div>
        </div>

        {/* Right Side png Graphic */}
        <div className="absolute top-1/2 -translate-y-1/2 right-4 w-32 h-32 md:w-36 md:h-36 overflow-hidden pointer-events-none flex items-center justify-center">
          <img 
            src={splitCardImg} 
            alt="Split card visual representation" 
            className="w-full h-auto object-contain transform rotate-6 drop-shadow-xl" 
          />
        </div>
      </div>

      {/* 2. How it Works Guide Section */}
      <div className="flex flex-col gap-3">
        <h4 className="font-hanken text-xs font-black uppercase tracking-wider text-[#121212]/50 px-1">
          How Live Splitting Works
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {GUIDE_STEPS.map((stepObj) => (
            <Card key={stepObj.step} variant="light" className="p-4.5 rounded-[20px] flex flex-col gap-2.5 text-left">
              <div className="w-6 h-6 rounded-full bg-neon-green/10 text-neon-green border border-neon-green/20 flex items-center justify-center font-bold text-xs">
                {stepObj.step}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-hanken text-xs font-bold text-[#121212]">{stepObj.title}</span>
                <p className="text-[10px] text-black/50 leading-relaxed font-sans">{stepObj.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* 3. Trigger Start Button (Positioned prominently after instructions) */}
      {!showForm && (
        <div className="flex justify-center py-2">
          <button 
            onClick={() => setShowForm(true)}
            className="bg-neon-green text-[#121212] px-8 py-3.5 rounded-full font-hanken font-bold text-xs flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-[0_4px_20px_rgba(15,238,101,0.35)] cursor-pointer border-none uppercase tracking-wider"
          >
            <span className="material-symbols-outlined text-[16px] font-bold">add</span>
            Start a Split Session
          </button>
        </div>
      )}

      {/* 4. Setup Form (Slide Down Panel) */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card variant="vessel" className="p-5 border border-white/[0.08] rounded-[24px] flex flex-col gap-4 bg-[#121212] text-white shadow-xl relative z-10">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h3 className="font-hanken text-sm font-semibold uppercase tracking-wider text-white">Setup Split Details</h3>
              <button 
                onClick={() => setShowForm(false)} 
                className="text-white/40 hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm font-bold">close</span>
              </button>
            </div>

            {error && (
              <div className="p-3 bg-error-container border border-error/20 text-error text-xs rounded-lg font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              
              {/* Split Mode Selector */}
              <div className="flex bg-[#222] p-1 rounded-lg border border-white/5">
                <button
                  type="button"
                  onClick={() => setMode('even')}
                  className={`flex-1 py-2 text-center text-xs font-bold rounded-md uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    mode === 'even' 
                      ? 'bg-[#121212] text-neon-green border border-white/5' 
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Split Evenly
                </button>
                <button
                  type="button"
                  onClick={() => setMode('itemized')}
                  className={`flex-1 py-2 text-center text-xs font-bold rounded-md uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    mode === 'itemized' 
                      ? 'bg-[#121212] text-neon-green border border-white/5' 
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Split Itemized
                </button>
              </div>

              {/* Total Amount Input */}
              <Input
                label="Total Bill Amount (₹)"
                type="number"
                step="0.01"
                placeholder="e.g. 1500"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                required
                disabled={mode === 'itemized'} // derived automatically in itemized
              />

              {/* Even mode fields */}
              {mode === 'even' && (
                <Input
                  label="Number of Splits (including you)"
                  type="number"
                  value={participantCount}
                  onChange={(e) => setParticipantCount(e.target.value)}
                  required
                  min="2"
                />
              )}

              {/* Itemized mode fields */}
              {mode === 'itemized' && (
                <div className="flex flex-col gap-3 bg-[#1b1c1c] border border-white/5 p-4 rounded-xl">
                  <span className="font-hanken text-xs font-bold uppercase tracking-wider text-white/50 border-b border-white/5 pb-1">
                    Bill Line Items
                  </span>
                  
                  {/* Items list */}
                  {items.length === 0 ? (
                    <p className="text-xs text-white/40 py-2 text-center">No items added yet</p>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto">
                      {items.map(item => (
                        <div key={item.id} className="flex justify-between items-center bg-[#222] px-3 py-2 rounded-lg border border-white/5 text-xs">
                          <span className="text-white/80 font-medium">{item.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-neon-green font-bold numeric-display">₹{item.price.toFixed(2)}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-red-400 hover:text-red-300 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-sm font-bold">delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add new item form */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-end mt-2">
                    <Input
                      label="Item Name"
                      placeholder="e.g. Garlic Bread"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                    />
                    <div className="flex gap-2 items-end">
                      <Input
                        label="Item Price (₹)"
                        type="number"
                        placeholder="e.g. 240"
                        value={itemPrice}
                        onChange={(e) => setItemPrice(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="primary"
                        onClick={handleAddItem}
                        className="px-3.5 h-10 flex-shrink-0"
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* Taxes & GST percentage */}
                  <div className="mt-2">
                    <Input
                      label="GST & Service Charge Percentage (%)"
                      type="number"
                      placeholder="e.g. 5"
                      value={gstPercent}
                      onChange={(e) => setGstPercent(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                fullWidth
                className="mt-2 text-xs uppercase tracking-wider py-3.5"
              >
                {loading ? 'Initializing Live Session...' : 'Generate Split QR'}
              </Button>

            </form>
          </Card>
        </motion.div>
      )}

      {/* 5. Recent Split Sessions History Log (New visual depth) */}
      <Card variant="light" className="p-6 rounded-[24px] flex flex-col gap-4 text-left">
        <div className="flex justify-between items-center border-b border-black/5 pb-3">
          <div>
            <h3 className="font-hanken text-sm font-black uppercase tracking-wider text-[#121212]">
              Recent Split History
            </h3>
            <span className="text-[10px] text-on-surface-variant font-medium font-sans">Audit log of your split sessions</span>
          </div>
          <span className="text-xs bg-black/5 text-[#121212] border border-black/10 px-2.5 py-0.5 rounded-full font-bold">
            {SPLIT_HISTORY.length} sessions
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {SPLIT_HISTORY.map((history) => (
            <div 
              key={history.id}
              className="flex justify-between items-center bg-surface hover:bg-surface-container/50 p-3.5 rounded-xl border border-outline-variant/30 transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-white border border-outline-variant/30 shadow-sm text-lg">
                  <span className="material-symbols-outlined text-sm font-bold text-[#121212]/80">
                    {history.category === 'Food' ? 'coffee' : 'directions_bus'}
                  </span>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-[#121212] leading-tight">
                    {history.tag}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] text-emerald-700 font-extrabold uppercase bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      {history.category}
                    </span>
                    <span className="text-[9px] text-on-surface-variant font-mono font-semibold">
                      Mode: {history.mode}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end text-right">
                  <span className="text-xs font-extrabold numeric-display text-[#121212]">
                    ₹{history.amount.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-on-surface-variant font-mono font-semibold">
                    {history.date}
                  </span>
                </div>
                <span className={`text-[8px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full border ${history.statusColor}`}>
                  {history.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

    </div>
  );
};
