import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { subscribeToSplit, subscribeToParticipants, finalizeSplitBill } from '../../firebase/db';
import type { Split, Participant, Transaction } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import joiningSound from '../../assets/sounds/joining.mp3';
import successSound from '../../assets/sounds/success.mp3';
import Lottie from 'lottie-react';
import loadingMainAnim from '../../assets/animations/loading_main.json';
import fetchLoadingAnim from '../../assets/animations/fetch_loading.json';

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

  // Slider coordinates state for spring-back smoothness
  const [sliderX, setSliderX] = useState(0);

  // Guarantee minimum 2-second loading state for clean transitions
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const participantUrl = `${window.location.origin}${window.location.pathname}#/split/${splitId}`;

  const prevCountRef = React.useRef(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [dragWidth, setDragWidth] = useState(220);

  // Subscribe to Split metadata changes
  useEffect(() => {
    const unsub = subscribeToSplit(splitId, (data) => {
      setSplitData(data);
    });
    return () => unsub();
  }, [splitId]);

  // Subscribe to joined participants changes
  useEffect(() => {
    const unsub = subscribeToParticipants(splitId, (list) => {
      setParticipants(list);
      
      // Play joining sound if a new participant joined live
      if (list.length > prevCountRef.current && prevCountRef.current !== 0) {
        const audio = new Audio(joiningSound);
        audio.play().catch(e => console.error("Audio playback error:", e));
      }
      prevCountRef.current = list.length;
    });
    return () => unsub();
  }, [splitId]);

  useEffect(() => {
    if (containerRef.current) {
      setDragWidth(containerRef.current.clientWidth - 56);
    }
  }, [isInitializing, participants.length]);

  // WhatsApp Share Feature
  const handleShareWhatsApp = () => {
    const text = `Hey roomies! Join my live split session on FinBuddy to split our bill: ${participantUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  // SVG to PNG QR download share feature
  const handleDownloadQR = () => {
    const svg = document.getElementById('split-qr-svg');
    if (!svg) return;
    const svgString = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 200;
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 34, 34, 132, 132); // Centers SVG inside canvas
        const png = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = png;
        downloadLink.download = `finbuddy-split-qr-${splitId}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };
    image.src = blobURL;
  };

  // Mathematical Bill Splitting Calculation
  const handleSplitNow = async () => {
    if (!splitData) return;
    setLoading(true);

    try {
      const calculatedAmounts: { [participantId: string]: number } = {};
      const numPeople = participants.length + 1; // including Host
      const gstMultiplier = 1 + ((splitData.gstPercent || 0) / 100);

      let ownerAmount = 0;

      if (splitData.mode === 'even') {
        const share = ((splitData.totalAmount || 0) * gstMultiplier) / numPeople;
        participants.forEach(p => {
          calculatedAmounts[p.id] = share;
        });
        ownerAmount = share;
      } else {
        const items = splitData.items || [];
        const itemSelectors: { [itemId: string]: string[] } = {};

        items.forEach(item => {
          itemSelectors[item.id] = [];
          participants.forEach(p => {
            if ((p.selectedItemIds || []).includes(item.id)) {
              itemSelectors[item.id].push(p.id);
            }
          });
        });

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
            unselectedItemsTotal += item.price * gstMultiplier;
          }
        });

        participants.forEach(p => {
          calculatedAmounts[p.id] = participantSums[p.id];
        });

        const totalGuestsOwed = Object.values(participantSums).reduce((s, val) => s + val, 0);
        ownerAmount = ((splitData.totalAmount || 0) * gstMultiplier) - totalGuestsOwed;
      }

      setHostOwed(ownerAmount);

      const audio = new Audio(successSound);
      audio.play().catch(e => console.error("Audio playback error:", e));

      await finalizeSplitBill(splitId, participants, calculatedAmounts);

      onRecordSplitTransaction({
        amount: parseFloat(ownerAmount.toFixed(2)),
        type: 'expense',
        category: 'Shopping',
        date: new Date().toISOString().split('T')[0],
        note: `Group Split: ${splitData.mode === 'even' ? 'Even' : 'Itemized'} (FinBuddy)`
      });

    } catch (error) {
      console.error('Finalize split error:', error);
    } finally {
      // Small timeout to allow animation visual flow to complete
      setTimeout(() => {
        setLoading(false);
      }, 800);
    }
  };

  if (!splitData || isInitializing) {
    return (
      <Card variant="vessel" className="py-12 flex flex-col items-center justify-center text-white/40 border border-white/[0.08] backdrop-blur-md bg-[#121212]">
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left w-full relative">
      
      {/* 1. Loading Overlay when Splitting is processing */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/75 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center z-50 p-6 text-center"
          >
            <div className="w-36 h-36">
              <LottiePlayer animationData={fetchLoadingAnim} loop={true} />
            </div>
            <h4 className="font-hanken text-sm font-bold text-white uppercase tracking-wider mt-2">Computing Shared Ratios</h4>
            <p className="text-[10px] text-white/50 max-w-[200px] mt-1 font-sans">Calculating line items, taxes and recording directly in dorm ledger...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Host Control Deck (Left Side) */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        
        {/* QR Code and Meta Vessel */}
        <Card variant="vessel" className="p-6 border border-white/[0.08] rounded-2xl flex flex-col gap-5 bg-[#121212] backdrop-blur-md">
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
              <p className="text-lg font-bold text-white numeric-display">₹{(splitData.totalAmount || 0).toLocaleString()}</p>
            </div>
          </div>

          {!isFinalized ? (
            /* LOBBY VIEW */
            <div className="flex flex-col gap-6 py-2">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* QR Code Container with Image Download Option */}
                <div className="relative group flex flex-col items-center gap-2">
                  <div className="bg-white p-3 rounded-2xl shadow-xl flex-shrink-0 flex items-center justify-center border border-white/10 select-none">
                    <QRCodeSVG id="split-qr-svg" value={participantUrl} size={128} level="H" />
                  </div>
                </div>

                {/* Dynamic Share & Guide block */}
                <div className="flex-1 flex flex-col gap-3 text-left w-full">
                  <div className="flex flex-col gap-1">
                    <span className="font-hanken text-xs font-extrabold uppercase tracking-wider text-white/50">Lobby Link</span>
                    <p className="text-xs text-white/80 leading-normal">
                      Have roomies scan the QR or share this joining link:
                    </p>
                  </div>
                  <div className="bg-[#1b1c1c] text-[#0fee65] text-[10px] p-2.5 rounded-xl font-mono break-all border border-white/5 select-all">
                    {participantUrl}
                  </div>
                </div>
              </div>

              {/* Whatsapp & Image Download Action panel (WhatsApp Share feature) */}
              <div className="grid grid-cols-2 gap-3 mt-1 bg-white/[0.02] border border-white/5 p-3 rounded-2xl">
                <button
                  onClick={handleShareWhatsApp}
                  className="flex items-center justify-center gap-2 py-2 px-3 bg-[#0fee65]/10 hover:bg-[#0fee65]/20 border border-[#0fee65]/30 hover:border-[#0fee65]/40 text-[#0fee65] rounded-xl font-hanken font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">share</span>
                  Share on WhatsApp
                </button>
                <button
                  onClick={handleDownloadQR}
                  className="flex items-center justify-center gap-2 py-2 px-3 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-white rounded-xl font-hanken font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  Save QR Image
                </button>
              </div>
            </div>
          ) : (
            /* FINALIZED SETTLEMENT STATUS */
            <div className="bg-[#1b1c1c] p-4.5 rounded-2xl border border-white/5 flex flex-col gap-3.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/60">Finalized Split Ratio:</span>
                <span className="text-neon-green font-bold uppercase text-[10px]">
                  {splitData.mode === 'even' ? 'Evenly Distributed' : 'Itemized Selections'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2">
                <span className="text-white/60">Your net share (Host):</span>
                <span className="text-white font-extrabold numeric-display">
                  ₹{(hostOwed || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#222] rounded-full overflow-hidden mt-1">
                <div 
                  className="h-full bg-neon-green transition-all duration-300"
                  style={{ width: `${participants.length > 0 ? (totalSettled / participants.length) * 100 : 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[9px] uppercase font-bold tracking-wider text-white/40">
                <span>Settled: {totalSettled} / {participants.length} roomies</span>
                <span className={allSettled ? 'text-neon-green' : 'text-yellow-500 animate-pulse'}>
                  {allSettled ? 'All Clear!' : 'Awaiting Settlements...'}
                </span>
              </div>
            </div>
          )}

          {/* Action Trigger Buttons */}
          <div className="flex flex-col gap-4 border-t border-white/5 pt-4">
            {!isFinalized ? (
              <div className="flex flex-col gap-2">
                <label className="font-hanken text-[9px] uppercase font-bold tracking-widest text-white/40 text-center">
                  {participants.length === 0 ? 'Waiting for roomies to connect' : 'Swipe handle to split bill'}
                </label>
                <div 
                  ref={containerRef}
                  className="relative w-full h-14 bg-[#1b1c1c] border border-white/10 rounded-full flex items-center justify-center overflow-hidden shadow-inner"
                >
                  <span className="font-hanken text-[10px] uppercase font-black tracking-widest text-white/30 animate-pulse pointer-events-none select-none">
                    {participants.length === 0 ? 'Lobby is Empty' : 'Slide to Split >>>'}
                  </span>

                  {participants.length > 0 && (
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
                          handleSplitNow();
                        } else {
                          setSliderX(0); // smooth spring back snap
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
              </div>
            ) : null}
            
            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                onClick={onReset} 
                className="flex-1 text-xs uppercase tracking-wider py-3 rounded-xl cursor-pointer"
              >
                Close View
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Participants Feed (Right Side) */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        <h4 className="font-hanken text-xs font-bold uppercase tracking-wider text-white/60 px-1 text-left">
          {isFinalized ? 'Settlement Log' : `Roomies Joined (${participants.length})`}
        </h4>

        {participants.length === 0 ? (
          <Card variant="vessel" className="py-12 text-center text-white/40 flex flex-col items-center justify-center border border-white/[0.08] min-h-[220px] bg-[#121212] backdrop-blur-md">
            <span className="material-symbols-outlined text-4xl mb-2 text-white/25 animate-pulse">groups</span>
            <p className="text-xs font-semibold">Awaiting roomies to join...</p>
            <p className="text-[10px] text-white/30 max-w-[200px] mt-1 mx-auto font-sans leading-relaxed">Roomies scan QR or browse the lobby link to select items live</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-1">
            {participants.map(p => (
              <div 
                key={p.id}
                className={`flex justify-between items-center p-3.5 rounded-2xl border transition-all duration-300 ${
                  p.hasPaid 
                    ? 'bg-[#0fee65]/10 border-[#0fee65]/20' 
                    : 'bg-[#1b1c1c] border-white/5 shadow-md'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8.5 h-8.5 rounded-full flex items-center justify-center text-xs font-extrabold uppercase ${
                    p.hasPaid ? 'bg-neon-green text-[#121212]' : 'bg-[#222] text-white/80'
                  }`}>
                    {p.name.slice(0, 2)}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-white">{p.name}</span>
                    <span className="text-[9px] text-white/40 font-mono mt-0.5">
                      {isFinalized 
                        ? (p.hasPaid ? 'Settled successfully' : 'Pending payment') 
                        : (splitData.mode === 'itemized' 
                          ? `${(p.selectedItemIds || []).length} items checked` 
                          : 'Even split')
                      }
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isFinalized ? (
                    <>
                      <span className="text-xs font-bold text-white numeric-display">
                        ₹{(p.amountOwed || 0).toLocaleString()}
                      </span>
                      {p.hasPaid ? (
                        <span className="material-symbols-outlined text-neon-green font-bold text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                          check_circle
                        </span>
                      ) : (
                        <span className="material-symbols-outlined text-yellow-500 text-base animate-pulse">
                          pending
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="material-symbols-outlined text-white/25 text-sm font-bold">
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
