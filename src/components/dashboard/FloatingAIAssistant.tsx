import React, { useState, useEffect, useRef } from 'react';
import type { User } from 'firebase/auth';
import type { Transaction, Budget, SavingsGoal } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';

interface FloatingAIAssistantProps {
  user: User;
  transactions: Transaction[];
  budgets: Budget[];
  goals: SavingsGoal[];
  balance: number;
}

export const FloatingAIAssistant: React.FC<FloatingAIAssistantProps> = ({
  user,
  transactions,
  budgets,
  goals,
  balance
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with personalized welcome message once user info is loaded
  useEffect(() => {
    if (user) {
      setMessages([
        {
          role: 'assistant',
          content: `Hey ${user.displayName?.split(' ')[0] || 'Divya'}! 👋 I'm your FinBuddy AI. I've audited your transactions and budgets. Ask me anything about your savings, spending, or how to afford items on your wishlist!`
        }
      ]);
    }
  }, [user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleAskAI = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;
    
    // Add user message to state
    const updatedMessages = [...messages, { role: 'user' as const, content: textToSend }];
    setMessages(updatedMessages);
    setQuery("");
    setIsLoading(true);

    // Compute financial context dynamically
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthTx = transactions.filter(tx => {
      const d = new Date(tx.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const monthExpenses = currentMonthTx
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const monthIncome = currentMonthTx
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const categorySpentMap: { [cat: string]: number } = {};
    currentMonthTx.filter(tx => tx.type === 'expense').forEach(tx => {
      categorySpentMap[tx.category] = (categorySpentMap[tx.category] || 0) + tx.amount;
    });

    const budgetStatus = budgets.map(b => {
      const spent = categorySpentMap[b.category] || 0;
      const pct = b.limit > 0 ? Math.round((spent / b.limit) * 100) : 0;
      return `- ${b.category}: limit ₹${b.limit}, spent ₹${spent} (${pct}% used)`;
    }).join('\n');

    const goalsStatus = goals.map(g => {
      const pct = g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0;
      return `- ${g.name}: target ₹${g.targetAmount}, saved ₹${g.currentAmount} (${pct}% progress)`;
    }).join('\n');

    // Retrieve Wishlist from localStorage
    const savedWishlist = localStorage.getItem('wishlist');
    const wishlistItems = savedWishlist ? JSON.parse(savedWishlist) : [];
    const wishlistStatus = wishlistItems.map((w: any) => `- ${w.name}: ₹${w.price} (${w.category})`).join('\n');

    const systemPrompt = `You are FinBuddy AI, a witty, friendly student financial coach helping college students save money, budget, and live within their means.
Use this real-time financial context of the user to provide customized, actionable advice (max 2-3 bullet points or 3-4 sentences):
User Name: ${user.displayName || 'Divya'}
Wallet Balance: ₹${balance}
This Month Income: ₹${monthIncome}
This Month Expenses: ₹${monthExpenses}

Active Budgets Status:
${budgetStatus || 'No budgets configured yet.'}

Savings Goals Status:
${goalsStatus || 'No savings goals configured yet.'}

Wishlist items:
${wishlistStatus || 'No wishlist items yet.'}

Guidelines:
- Guide the user on savings, spending, and affordability.
- If they ask if they can afford something, analyze it based on their wallet balance (₹${balance}) and the category remaining budget.
- Keep answers concise, helpful, and highly relevant to college student life.
- Do not use markdown headers, just plain text and bullet points.`;

    const GROK_KEY = import.meta.env.VITE_GROK_API;
    const isProd = import.meta.env.PROD;
    const url = isProd ? "https://api.x.ai/v1/chat/completions" : "/grok-api/chat/completions";

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROK_KEY}`
        },
        body: JSON.stringify({
          model: "grok-beta",
          messages: [
            { role: "system", content: systemPrompt },
            ...updatedMessages.slice(-5) // Send last 5 messages for context
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with Grok AI");
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "Sorry, I couldn't process that request.";
      setMessages(prev => [...prev, { role: 'assistant', content }]);
    } catch (err) {
      console.error("Grok AI error:", err);
      // Offline fallback responses with financial advice
      let fallbackText = "I'm having trouble connecting right now. Here's a tip: Try tracking smaller expenses like daily coffee and subscriptions; they add up fast!";
      if (textToSend.toLowerCase().includes('wish') || textToSend.toLowerCase().includes('afford')) {
        fallbackText = `Offline Affordability Check: Your current balance is ₹${balance.toLocaleString()}. Any wishlist item priced below this is technically affordable, but be sure it fits inside your monthly category limit to prevent overspending!`;
      } else if (textToSend.toLowerCase().includes('spend') || textToSend.toLowerCase().includes('audit')) {
        fallbackText = `Offline Spending Audit: You've spent ₹${monthExpenses.toLocaleString()} this month against ₹${monthIncome.toLocaleString()} income. Keep an eye on your Budgets tab to ensure you don't exceed your limits!`;
      } else if (textToSend.toLowerCase().includes('save') || textToSend.toLowerCase().includes('goal')) {
        fallbackText = `Offline Goals Check: You have ${goals.length} active savings goals. Try setting aside 15% of any deposit to accelerate your progress toward them!`;
      }
      setMessages(prev => [...prev, { role: 'assistant', content: fallbackText }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAskAI(query);
  };

  const PREDEFINED_PROMPTS = [
    { label: "Audit my spending 📊", text: "Audit my spending this month and let me know how I'm doing." },
    { label: "Can I afford my wishlist? 🎁", text: "Check my wishlist and tell me if I can afford to buy anything right now." },
    { label: "How are my savings goals? 🎯", text: "Review my savings goals progress and give me a tip to reach them faster." },
    { label: "Budget saving tip 💡", text: "Give me a quick, practical saving tip relevant to student life." }
  ];

  return (
    <>
      {/* Floating Chat Bubble Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-50 w-14 h-14 rounded-full bg-[#121212] text-neon-green hover:text-white border border-neon-green/30 shadow-[0_4px_20px_rgba(15,238,101,0.25)] flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 group animate-fade-in"
        title="FinBuddy AI Assistant"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative flex items-center justify-center"
            >
              <MessageSquare size={24} />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-neon-green rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-neon-green rounded-full" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Chat Drawer Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-40 right-4 left-4 sm:left-auto sm:right-8 sm:w-[380px] h-[500px] z-50 bg-[#121212] text-white border border-white/10 rounded-[28px] shadow-[0_15px_40px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#1b1c1c]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-neon-green/10 flex items-center justify-center text-neon-green">
                  <Sparkles size={16} />
                </div>
                <div className="text-left">
                  <h4 className="font-hanken text-xs font-black uppercase tracking-wider text-white">FinBuddy AI Coach</h4>
                  <span className="text-[9px] text-[#0fee65] font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" /> Online • Grok Powered
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin select-text">
              {messages.map((msg, idx) => {
                const isAI = msg.role === 'assistant';
                return (
                  <div
                    key={idx}
                    className={`flex ${isAI ? 'justify-start' : 'justify-end'} w-full`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed text-left ${
                        isAI
                          ? 'bg-white/5 text-white/90 border border-white/5 rounded-tl-none font-sans'
                          : 'bg-neon-green text-[#121212] font-semibold rounded-tr-none font-sans'
                      }`}
                    >
                      {msg.content.split('\n').map((line, li) => (
                        <p key={li} className={li > 0 ? 'mt-1.5' : ''}>{line}</p>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {isLoading && (
                <div className="flex justify-start w-full">
                  <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-none p-3 max-w-[80%] flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions / Prompt Suggestions (Visible when not loading) */}
            {!isLoading && (
              <div className="p-3 border-t border-white/5 bg-[#1b1c1c]/50">
                <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-none snap-x">
                  {PREDEFINED_PROMPTS.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handleAskAI(prompt.text)}
                      className="flex-shrink-0 snap-center px-3 py-1.5 rounded-full bg-white/5 hover:bg-neon-green/10 border border-white/5 hover:border-neon-green/20 text-[10px] text-white/70 hover:text-neon-green font-medium transition-all cursor-pointer whitespace-nowrap"
                    >
                      {prompt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleFormSubmit} className="p-3 border-t border-white/5 bg-[#1b1c1c] flex gap-2">
              <input
                type="text"
                placeholder="Ask me about savings, budgets..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs bg-white/5 text-white border border-white/10 focus:border-neon-green outline-none"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="w-9 h-9 rounded-xl bg-neon-green text-[#121212] hover:bg-neon-green/90 disabled:opacity-40 flex items-center justify-center transition-all cursor-pointer border-none"
              >
                <Send size={15} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
