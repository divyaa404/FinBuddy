import React, { useState, useEffect } from 'react';
import type { Transaction } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface TransactionFormProps {
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
  onClose: () => void;
  editingTransaction?: Transaction | null;
  onUpdateTransaction?: (tx: Transaction) => void;
}

const CATEGORIES = ['Food', 'Transport', 'Subscriptions', 'Shopping', 'Entertainment', 'Others'];

export const TransactionForm: React.FC<TransactionFormProps> = ({
  onAddTransaction,
  onClose,
  editingTransaction,
  onUpdateTransaction
}) => {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (editingTransaction) {
      setAmount(editingTransaction.amount.toString());
      setType(editingTransaction.type);
      setCategory(editingTransaction.category);
      setDate(editingTransaction.date);
      setNote(editingTransaction.note || '');
    }
  }, [editingTransaction]);

  // Keyword-based category auto-suggestion
  const handleNoteChange = (val: string) => {
    setNote(val);
    if (type !== 'expense') return;

    const lowerVal = val.toLowerCase();
    
    // Food keywords
    if (/swiggy|zomato|cafe|burger|pizza|dinner|lunch|breakfast|eat|starbucks|maggi|canteen|chai|food|restaurant|mcdonald|kfc/i.test(lowerVal)) {
      setCategory('Food');
    }
    // Transport keywords
    else if (/uber|ola|auto|cab|metro|train|bus|petrol|fuel|rapido|flight|travel|ticket/i.test(lowerVal)) {
      setCategory('Transport');
    }
    // Subscriptions keywords
    else if (/netflix|spotify|youtube|prime|disney|github|adobe|icloud|chatgpt|openai|premium/i.test(lowerVal)) {
      setCategory('Subscriptions');
    }
    // Shopping keywords
    else if (/amazon|flipkart|myntra|zara|h&m|clothes|shoes|meesho|blinkit|zepto|grocery|groceries|mall/i.test(lowerVal)) {
      setCategory('Shopping');
    }
    // Entertainment keywords
    else if (/movie|pvr|concert|game|steam|pub|club|party|fun|bowling|arcade/i.test(lowerVal)) {
      setCategory('Entertainment');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    const txData = {
      amount: parseFloat(amount),
      type,
      category: type === 'income' ? 'Income' : category,
      date,
      note: note.trim()
    };

    if (editingTransaction && onUpdateTransaction) {
      onUpdateTransaction({
        ...editingTransaction,
        ...txData
      });
    } else {
      onAddTransaction(txData);
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
      <h3 className="font-hanken text-base font-extrabold uppercase tracking-wider text-white border-b border-white/5 pb-2 mb-2">
        {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
      </h3>

      {/* Transaction Type Selection Toggle */}
      <div className="flex bg-[#222] p-1 rounded-lg border border-white/5">
        <button
          type="button"
          onClick={() => {
            setType('expense');
            setCategory('Food');
          }}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-md uppercase tracking-wider transition-all duration-200 ${
            type === 'expense' 
              ? 'bg-[#121212] text-neon-green border border-white/5' 
              : 'text-white/60 hover:text-white'
          }`}
        >
          Expense
        </button>
        <button
          type="button"
          onClick={() => {
            setType('income');
            setCategory('Income');
          }}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-md uppercase tracking-wider transition-all duration-200 ${
            type === 'income' 
              ? 'bg-[#121212] text-neon-green border border-white/5' 
              : 'text-white/60 hover:text-white'
          }`}
        >
          Income
        </button>
      </div>

      {/* Amount Input */}
      <Input
        label="Amount (₹)"
        type="number"
        step="0.01"
        placeholder="Enter amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
        min="0.01"
      />

      {/* Category Dropdown (Only for Expense) */}
      {type === 'expense' && (
        <div className="flex flex-col gap-1.5">
          <label className="font-hanken text-xs font-semibold uppercase tracking-wider text-white/60">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg text-sm bg-[#222] text-white border border-white/10 focus:border-neon-green focus:ring-1 focus:ring-neon-green outline-none"
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      )}

      {/* Date Input */}
      <Input
        label="Date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />

      {/* Note / Keyword Input */}
      <Input
        label="Note"
        type="text"
        placeholder="e.g. Swiggy lunch, Uber ride, Spotify..."
        value={note}
        onChange={(e) => handleNoteChange(e.target.value)}
      />

      {/* Actions */}
      <div className="flex gap-3 mt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          className="flex-1"
        >
          {editingTransaction ? 'Save Changes' : 'Record'}
        </Button>
      </div>
    </form>
  );
};
