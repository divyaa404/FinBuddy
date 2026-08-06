import React, { useState } from 'react';
import { createSplit } from '../../firebase/db';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import splitCardImg from '../../assets/images/split_card.png';

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
        <div className="flex flex-col gap-4 relative z-10 max-w-[60%]">
          <div className="flex flex-col gap-1">
            <h3 className="font-hanken font-bold text-xl text-white">Split bills. Settle faster.</h3>
            <p className="text-xs text-white/60 leading-relaxed font-sans">Generate a live QR session and split costs dynamically with friends.</p>
          </div>
          
          {!showForm && (
            <button 
              onClick={() => setShowForm(true)}
              className="bg-neon-green text-[#121212] px-5 py-2.5 rounded-full font-hanken font-bold text-[13px] self-start flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-[0_4px_14px_rgba(15,238,101,0.3)] cursor-pointer"
            >
              Split a bill
              <span className="material-symbols-outlined text-[16px] font-bold">arrow_forward</span>
            </button>
          )}
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

      {/* 2. Setup Form (Slide Down Panel) */}
      {showForm && (
        <Card variant="vessel" className="p-5 border border-white/[0.08] rounded-2xl flex flex-col gap-4 animate-fade-in relative z-10">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <h3 className="font-hanken text-sm font-semibold uppercase tracking-wider text-white">Setup Split Details</h3>
            <button 
              onClick={() => setShowForm(false)} 
              className="text-white/40 hover:text-white"
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
                className={`flex-1 py-2 text-center text-xs font-bold rounded-md uppercase tracking-wider transition-all duration-200 ${
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
                className={`flex-1 py-2 text-center text-xs font-bold rounded-md uppercase tracking-wider transition-all duration-200 ${
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
                            className="text-red-400 hover:text-red-300"
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
              className="mt-2 text-sm uppercase tracking-wider py-3.5"
            >
              {loading ? 'Initializing Live Session...' : 'Generate Split QR'}
            </Button>

          </form>
        </Card>
      )}

    </div>
  );
};
