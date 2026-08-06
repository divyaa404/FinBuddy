import React, { useState, useEffect } from 'react';
import { subscribeToSplit, subscribeToParticipants, joinSplit, updateParticipantItems } from '../../firebase/db';
import type { Split, Participant } from '../../types';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { SettleView } from './SettleView';
import Lottie from 'lottie-react';
import loadingMainAnim from '../../assets/animations/loading_main.json';

const LottiePlayer = (Lottie as any).default || Lottie;

interface SplitParticipantProps {
  splitId: string;
}

export const SplitParticipant: React.FC<SplitParticipantProps> = ({ splitId }) => {
  const [splitData, setSplitData] = useState<Split | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  // Guarantee minimum 2-second loading state for clean transitions
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);
  
  // Local Guest state
  const [name, setName] = useState('');
  const [localParticipantId, setLocalParticipantId] = useState<string | null>(() => {
    return localStorage.getItem(`participant_id_${splitId}`);
  });
  const [registered, setRegistered] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Subscribe to Split metadata changes
  useEffect(() => {
    const unsub = subscribeToSplit(splitId, (data) => {
      setSplitData(data);
    });
    return () => unsub();
  }, [splitId]);

  // 2. Subscribe to joined participants changes
  useEffect(() => {
    const unsub = subscribeToParticipants(splitId, (list) => {
      setParticipants(list);
    });
    return () => unsub();
  }, [splitId]);

  // 3. Keep registration state synced with localstorage
  useEffect(() => {
    if (localParticipantId && participants.length > 0) {
      const match = participants.find(p => p.id === localParticipantId);
      if (match) {
        setRegistered(true);
        setName(match.name);
        setSelectedItems(match.selectedItemIds || []);
      }
    }
  }, [localParticipantId, participants]);

  const handleRegisterName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !splitId) return;

    setLoading(true);
    try {
      const newId = localParticipantId || `p_${Date.now()}`;
      await joinSplit(splitId, newId, name.trim(), selectedItems);
      
      localStorage.setItem(`participant_id_${splitId}`, newId);
      setLocalParticipantId(newId);
      setRegistered(true);
    } catch (error) {
      console.error('Error joining split:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = async (itemId: string) => {
    if (!localParticipantId || !splitId) return;

    let updatedList = [...selectedItems];
    if (updatedList.includes(itemId)) {
      updatedList = updatedList.filter(id => id !== itemId);
    } else {
      updatedList.push(itemId);
    }

    setSelectedItems(updatedList);
    try {
      await updateParticipantItems(splitId, localParticipantId, updatedList);
    } catch (error) {
      console.error('Error updating items selections:', error);
    }
  };

  if (!splitData || isInitializing) {
    return (
      <div className="min-h-screen bg-[#fbf9f8] flex flex-col items-center justify-center p-6">
        <div className="w-40 h-40">
          <LottiePlayer animationData={loadingMainAnim} loop={true} />
        </div>
        <p className="font-hanken text-sm font-semibold uppercase tracking-wider text-[#121212]/60">Loading Split Session...</p>
      </div>
    );
  }

  // Get active participant's metadata if registered
  const me = localParticipantId ? participants.find(p => p.id === localParticipantId) : null;
  const isFinalized = splitData.status === 'finalized';

  // If split is finalized and participant is joined, show final settlement screen
  if (isFinalized && me) {
    return (
      <SettleView
        splitId={splitId}
        participantId={me.id}
        participantName={me.name}
        amountOwed={me.amountOwed}
        hasPaid={me.hasPaid}
        ownerName={splitData.ownerName}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#fbf9f8] text-[#1b1c1c] flex flex-col justify-center items-center p-6 text-left">
      <Card variant="vessel" className="w-full max-w-sm p-6 rounded-[24px] border border-white/[0.08] shadow-2xl relative overflow-hidden flex flex-col gap-5">
        
        {/* Glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-neon-green/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Brand */}
        <div className="flex items-center gap-1.5 border-b border-white/5 pb-3">
          <div className="w-6 h-6 rounded-md bg-neon-green text-[#121212] flex items-center justify-center font-bold text-xs">
            F
          </div>
          <span className="font-hanken font-bold text-xs uppercase tracking-wider text-white">FinBuddy Split Lobby</span>
        </div>

        {!registered ? (
          /* STEP 1: GUEST REGISTRATION */
          <form onSubmit={handleRegisterName} className="flex flex-col gap-4">
            <div>
              <h3 className="font-hanken text-base font-extrabold text-white">Join the Bill</h3>
              <p className="text-xs text-white/50 mt-1">
                Enter your name to connect to <strong className="text-white">{splitData.ownerName}</strong>'s bill split.
              </p>
            </div>

            <Input
              label="Your Name"
              placeholder="e.g. Indresh"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              fullWidth
              className="py-3 mt-2"
            >
              {loading ? 'Joining Lobby...' : 'Connect to Split'}
            </Button>
          </form>
        ) : (
          /* STEP 2: LOBBY & ITEM SELECTION (IF ITEMIZED) */
          <div className="flex flex-col gap-4">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-neon-green font-extrabold px-2 py-0.5 rounded bg-neon-green/10 border border-neon-green/20">
                Connected
              </span>
              <h3 className="font-hanken text-base font-extrabold text-white mt-2">
                {splitData.mode === 'itemized' ? 'Check your items' : 'Waiting in Lobby'}
              </h3>
              <p className="text-xs text-white/50 mt-1">
                Connected as <strong className="text-white">{name}</strong>.
              </p>
            </div>

            {splitData.mode === 'itemized' ? (
              /* Checkbox listing for items */
              <div className="flex flex-col gap-2.5 bg-[#1b1c1c] border border-white/5 p-3.5 rounded-xl">
                <span className="font-hanken text-[10px] uppercase font-bold tracking-wider text-white/40 border-b border-white/5 pb-1">
                  Select what you ordered
                </span>
                
                <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
                  {(splitData.items || []).map(item => {
                    const isChecked = selectedItems.includes(item.id);
                    return (
                      <label 
                        key={item.id}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all duration-200 select-none ${
                          isChecked 
                            ? 'bg-neon-green/10 border-neon-green/30 text-white' 
                            : 'bg-[#222] border-white/5 text-white/60 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleCheckboxChange(item.id)}
                            className="w-4 h-4 accent-neon-green bg-[#121212] border-white/10 rounded cursor-pointer"
                          />
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <span className="font-bold numeric-display">₹{item.price}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Even split lobby waiting room */
              <div className="bg-[#1b1c1c] border border-white/5 p-4 rounded-xl text-center flex flex-col items-center py-6">
                <div className="w-8 h-8 rounded-full border-2 border-t-neon-green border-white/10 animate-spin mb-3"></div>
                <p className="text-xs text-white/80 font-medium">Awaiting host finalization...</p>
                <p className="text-[10px] text-white/40 mt-1">Host will split the bill of ₹{splitData.totalAmount.toLocaleString()} evenly.</p>
              </div>
            )}

            {/* List of others in lobby */}
            <div className="flex flex-col gap-1.5 text-xs text-white/60 text-left border-t border-white/5 pt-3">
              <span className="font-hanken text-[10px] uppercase font-bold tracking-wider text-white/40">Roomies in Lobby:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                <span className="px-2 py-1 rounded bg-[#222] text-white border border-white/5 font-semibold text-[10px]">{splitData.ownerName} (Host)</span>
                {participants.filter(p => p.id !== localParticipantId).map(p => (
                  <span key={p.id} className="px-2 py-1 rounded bg-[#222] text-white/70 border border-white/5 text-[10px]">{p.name}</span>
                ))}
              </div>
            </div>

            {isFinalized && !me && (
              <div className="p-3 bg-error-container border border-error/25 text-error text-xs rounded-lg font-semibold text-center mt-2">
                Host finalized bill, but you did not join in time.
              </div>
            )}

          </div>
        )}

      </Card>
    </div>
  );
};
