import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { subscribeToSplit, subscribeToParticipants, finalizeSplitBill } from '../../firebase/db';
import type { Split, Participant, Transaction } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import Lottie from 'lottie-react';
import loadingMainAnim from '../../assets/animations/loading_main.json';

const LottiePlayer = (Lottie as any).default || Lottie;

interface LiveSplitOwnerProps {
  splitId: string;
  onReset: () => void;
  onRecordSplitTransaction: (tx: Omit<Transaction, 'id'>) => void;
}

export const LiveSplitOwner: React.FC<LiveSplitOwnerProps> = ({
  splitId,
  onReset,
  onRecordSplitTransaction
}) => {
  const [splitData, setSplitData] = useState<Split | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [hostOwed, setHostOwed] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);

  // Guarantee minimum 2-second loading state for clean transitions
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const participantUrl = `${window.location.origin}${window.location.pathname}#/split/${splitId}`;

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

  // 3. Mathematical Bill Splitting Calculation
  const handleSplitNow = async () => {
    if (!splitData) return;
    setLoading(true);

    try {
      const calculatedAmounts: { [participantId: string]: number } = {};
      const numPeople = participants.length + 1; // including Host
      const gstMultiplier = 1 + (splitData.gstPercent / 100);

      let ownerAmount = 0;

      if (splitData.mode === 'even') {
        // Even split across all who joined + host
        const share = (splitData.totalAmount * gstMultiplier) / numPeople;
        participants.forEach(p => {
          calculatedAmounts[p.id] = share;
        });
        ownerAmount = share;
      } else {
        // Itemized mode calculation
        const items = splitData.items || [];
        const itemSelectors: { [itemId: string]: string[] } = {};

        // Find who selected which items
        items.forEach(item => {
          itemSelectors[item.id] = [];
          
          // Check if host selected it (host selects everything by default if empty, or let's assume hosts splits the rest)
          // For demo, we split the item cost among all participants who checked it.
          // If nobody selected an item, it goes to the host.
          participants.forEach(p => {
            if (p.selectedItemIds.includes(item.id)) {
              itemSelectors[item.id].push(p.id);
            }
          });
        });

        // Calculate cost per item and distribute
        const participantSums: { [pId: string]: number } = {};
        participants.forEach(p => { participantSums[p.id] = 0; });
        
        let unselectedItemsTotal = 0;

        items.forEach(item => {
          const selectors = itemSelectors[item.id];
          if (selectors.length > 0) {
            const splitPrice = (item.price * gstMultiplier) / selectors.length;
            selectors.forEach(pId => {
              participantSums[pId] += splitPrice;
            });
          } else {
            // Unselected items are paid by host
            unselectedItemsTotal += item.price * gstMultiplier;
          }
        });

        // Map sums back to calculations
        participants.forEach(p => {
          calculatedAmounts[p.id] = participantSums[p.id];
        });

        // Host pays unselected items + any specific host selection (for simplicity, host pays remainder of bill)
        const totalGuestsOwed = Object.values(participantSums).reduce((s, val) => s + val, 0);
        ownerAmount = (splitData.totalAmount * gstMultiplier) - totalGuestsOwed;
      }

      setHostOwed(ownerAmount);

      // Write calculations back to Firestore and finalize status
      await finalizeSplitBill(splitId, participants, calculatedAmounts);

      // Log Host's transaction inside main dashboard automatically
      onRecordSplitTransaction({
        amount: parseFloat(ownerAmount.toFixed(2)),
        type: 'expense',
        category: 'Shopping', // Group Expense category
        date: new Date().toISOString().split('T')[0],
        note: `Group Split: ${splitData.mode === 'even' ? 'Even' : 'Itemized'} (FinBuddy)`
      });

    } catch (error) {
      console.error('Finalize split error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!splitData || isInitializing) {
    return (
      <Card variant="vessel" className="py-12 flex flex-col items-center justify-center text-white/40 border border-white/[0.08]">
        <div className="w-32 h-32">
          <LottiePlayer animationData={loadingMainAnim} loop={true} />
        </div>
        <p className="text-xs font-semibold mt-2 text-white/50">Loading Split Session...</p>
      </Card>
    );
  }

  const isFinalized = splitData.status === 'finalized';
  const totalSettled = participants.filter(p => p.hasPaid).length;
  const allSettled = participants.length > 0 && totalSettled === participants.length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left w-full">
      
      {/* Host Control Deck (Left Side) */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        
        {/* QR Code and Meta Vessel */}
        <Card variant="vessel" className="p-6 border border-white/[0.08] rounded-2xl flex flex-col gap-5">
          <div className="flex justify-between items-start border-b border-white/5 pb-3">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-neon-green font-extrabold px-2 py-0.5 rounded bg-neon-green/10 border border-neon-green/20">
                Live Host Dashboard
              </span>
              <h3 className="font-hanken text-lg font-bold text-white mt-1.5">
                {isFinalized ? 'Settlement Tracker' : 'Roomie Joining Lobby'}
              </h3>
            </div>
            
            <div className="text-right">
              <span className="text-white/40 text-[10px] uppercase font-bold tracking-wider font-hanken">Total Bill</span>
              <p className="text-lg font-bold text-white numeric-display">₹{splitData.totalAmount.toLocaleString()}</p>
            </div>
          </div>

          {!isFinalized ? (
            /* LOBBY VIEW */
            <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
              {/* QR Code Graphic Container */}
              <div className="bg-white p-3.5 rounded-2xl shadow-xl flex-shrink-0 flex items-center justify-center border border-white/10 select-none">
                <QRCodeSVG value={participantUrl} size={132} level="H" />
              </div>

              {/* Dynamic Steps */}
              <div className="flex flex-col gap-2 text-left">
                <span className="font-hanken text-xs font-extrabold uppercase tracking-wider text-white/50">Lobby QR</span>
                <p className="text-xs text-white/80 leading-relaxed">
                  Have participants scan this QR or navigate to:
                </p>
                <div className="bg-[#1b1c1c] text-neon-green text-[10px] p-2 rounded-lg font-mono break-all border border-white/5 select-all">
                  {participantUrl}
                </div>
                <p className="text-[10px] text-white/40 mt-1">
                  * No login required for joining roomies.
                </p>
              </div>
            </div>
          ) : (
            /* FINALIZED SETTLEMENT STATUS */
            <div className="bg-[#1b1c1c] p-4 rounded-xl border border-white/5 flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/60">Finalized Split Ratio:</span>
                <span className="text-neon-green font-bold">
                  {splitData.mode === 'even' ? 'Evenly Distributed' : 'Itemized Selections'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/60">Your net share (Host):</span>
                <span className="text-white font-extrabold numeric-display">
                  ₹{hostOwed > 0 ? hostOwed.toFixed(2) : (splitData.totalAmount / (participants.length + 1)).toFixed(2)}
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#222] rounded-full overflow-hidden mt-1">
                <div 
                  className="h-full bg-neon-green transition-all duration-300"
                  style={{ width: `${participants.length > 0 ? (totalSettled / participants.length) * 100 : 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-white/40">
                <span>Settled: {totalSettled} / {participants.length} roomies</span>
                <span>{allSettled ? 'All Clear!' : 'Awaiting Settlements...'}</span>
              </div>
            </div>
          )}

          {/* Action Trigger Buttons */}
          <div className="flex gap-3 border-t border-white/5 pt-4">
            <Button 
              variant="secondary" 
              onClick={onReset} 
              className="flex-1"
            >
              Close Split
            </Button>
            
            {!isFinalized && (
              <Button
                variant="primary"
                onClick={handleSplitNow}
                disabled={participants.length === 0 || loading}
                className="flex-1"
              >
                {loading ? 'Splitting...' : `Split Bill (among ${participants.length + 1})`}
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Participants Feed (Right Side) */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        <h4 className="font-hanken text-xs font-bold uppercase tracking-wider text-[#121212]/60 px-1 text-left">
          {isFinalized ? 'Settlement Log' : `Roomies Joined (${participants.length})`}
        </h4>

        {participants.length === 0 ? (
          <Card variant="vessel" className="py-12 text-center text-white/40 flex flex-col items-center justify-center border border-white/[0.08] min-h-[220px]">
            <span className="material-symbols-outlined text-4xl mb-2 text-white/20 animate-pulse">groups</span>
            <p className="text-xs font-semibold">Awaiting roomies to join...</p>
            <p className="text-[10px] text-white/30 max-w-[200px] mt-1 mx-auto">Scan the QR code to connect mobile view</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3 max-h-[360px] overflow-y-auto pr-1">
            {participants.map(p => (
              <div 
                key={p.id}
                className={`flex justify-between items-center p-4 rounded-xl border transition-all duration-300 ${
                  p.hasPaid 
                    ? 'bg-neon-green/5 border-neon-green/20' 
                    : 'bg-[#121212] border-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold uppercase ${
                    p.hasPaid ? 'bg-neon-green text-[#121212]' : 'bg-[#222] text-white'
                  }`}>
                    {p.name.slice(0, 2)}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-semibold text-white">{p.name}</span>
                    <span className="text-[9px] text-white/40 font-mono">
                      {isFinalized 
                        ? (p.hasPaid ? 'Settled successfully' : 'Pending payment') 
                        : (splitData.mode === 'itemized' 
                          ? `${p.selectedItemIds.length} items checked` 
                          : 'Even split')
                      }
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isFinalized ? (
                    <>
                      <span className="text-sm font-bold text-white numeric-display">
                        ₹{p.amountOwed.toLocaleString()}
                      </span>
                      {p.hasPaid ? (
                        <span className="material-symbols-outlined text-neon-green font-bold text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                          check_circle
                        </span>
                      ) : (
                        <span className="material-symbols-outlined text-yellow-500 text-lg animate-pulse">
                          pending
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="material-symbols-outlined text-white/20 text-sm font-bold">
                      check_circle
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
