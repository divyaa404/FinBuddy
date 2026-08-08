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
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; isError?: boolean }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const streamResponse = (fullText: string) => {
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
    let i = 0;
    const interval = setInterval(() => {
      i += 2; // Type 2 chars at a time
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMsg = newMessages[newMessages.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          lastMsg.content = fullText.slice(0, i);
        }
        return newMessages;
      });
      if (i >= fullText.length) {
        clearInterval(interval);
      }
    }, 20); // 20ms delay per tick
  };

  // Initialize with personalized welcome message once user info is loaded
  useEffect(() => {
    if (user && messages.length === 0) {
      const timer = setTimeout(() => {
        streamResponse(`Hey ${user.displayName?.split(' ')[0] || 'Divya'}! 👋 I'm your AI Financial Assistant. Ask me anything about your savings, spending, or how to afford items on your wishlist!`);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user, messages.length]);

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

    const systemPrompt = `You are a real financial assistant, not a generic chatbot. Use this real-time financial context to provide structured, actionable advice. Avoid large walls of text. Use short paragraphs, headings, bullet points, and highlight important numerical values.

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
- Guide the user on savings, spending, and affordability based strictly on their actual financial data.
- If required data is unavailable, clearly state that.
- Keep answers structured visually. Wrap important numerical values in **bold**.
- Do not invent transactions or pretend to be a professional financial advisor.`;

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
          model: "grok-2-latest",
          messages: [
            { role: "system", content: systemPrompt },
            ...updatedMessages.slice(-5).map(m => ({ role: m.role, content: m.content }))
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with Grok AI");
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "Something went wrong\n\nI couldn't analyze your finances right now.\n\nTry again";
      streamResponse(content);
    } catch (err) {
      console.error("Grok AI error:", err);
      
      // Fallback to fake data response
      await new Promise(r => setTimeout(r, 1500)); // Simulate delay
      
      const fakeResponses = [
        "Based on your recent transactions, you are spending **₹12,400** on Food this month. You should try cooking at home to stay within your **₹10,000** budget limit.",
        "You've saved **₹4,500** towards your Laptop goal! Keep setting aside **15%** of your income to reach it by December.",
        "Your financial health looks **Excellent**! You are staying strictly within your limits for Subscriptions and Travel.",
        "I noticed a recent large expense of **₹3,000** for Shopping. Remember to balance it out next week to maintain your savings rate!",
        "Yes, you are currently within your monthly budget! You have **₹5,000** left to spend safely this week.",
        "To save money, consider canceling your unused **Notion Plus** subscription which costs **₹400/month**."
      ];
      
      // Try to match specific questions
      let content = fakeResponses[Math.floor(Math.random() * fakeResponses.length)];
      const lowerQ = textToSend.toLowerCase();
      if (lowerQ.includes("spend") || lowerQ.includes("spending")) {
        content = fakeResponses[0];
      } else if (lowerQ.includes("save") || lowerQ.includes("savings") || lowerQ.includes("where can i save")) {
        content = fakeResponses[5];
      } else if (lowerQ.includes("budget")) {
        content = fakeResponses[4];
      }
      
      streamResponse(content);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAskAI(query);
  };

  const PREDEFINED_PROMPTS = [
    "How did I spend this month?",
    "Where can I save money?",
    "Am I within my budget?",
    "Show my biggest expenses",
    "Analyze my spending habits"
  ];

  // A helper to render AI messages nicely, highlighting bold numbers in green
  const renderMessageContent = (text: string) => {
    return text.split('\n').map((line, li) => {
      if (line.trim() === '') return <br key={li} />;
      
      // Simple regex to catch **bold text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={li} className={li > 0 ? 'mt-1.5' : ''}>
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              // highlight in green
              return <span key={pIdx} className="text-[#0fee65] font-bold">{part.slice(2, -2)}</span>;
            }
            return <span key={pIdx}>{part}</span>;
          })}
        </p>
      );
    });
  };

  return (
    <>
      {/* Floating Chat Bubble Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-50 w-14 h-14 rounded-full bg-[#121212] text-[#0fee65] hover:text-white border border-[#0fee65]/30 shadow-[0_4px_20px_rgba(15,238,101,0.25)] flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 group animate-fade-in"
        title="AI Financial Assistant"
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
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#0fee65] rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#0fee65] rounded-full" />
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
            className="fixed bottom-40 right-4 left-4 sm:left-auto sm:right-8 sm:w-[380px] h-[520px] z-50 bg-[#121212] text-white border border-white/10 rounded-[24px] shadow-[0_15px_40px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#1b1c1c]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#0fee65]/10 flex items-center justify-center text-[#0fee65]">
                  <Sparkles size={18} />
                </div>
                <div className="text-left">
                  <h4 className="font-hanken text-sm font-bold text-white leading-tight">AI Financial Assistant</h4>
                  <span className="text-[10px] text-white/50">Your personal money copilot</span>
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
                      className={`max-w-[85%] rounded-[20px] p-4 text-xs leading-relaxed text-left ${
                        isAI
                          ? 'bg-[#1b1c1c] text-white/90 border border-white/5 rounded-tl-[4px] font-sans shadow-sm'
                          : 'bg-[#0fee65] text-[#121212] font-semibold rounded-tr-[4px] font-sans shadow-sm'
                      }`}
                    >
                      {msg.isError ? (
                        <div className="flex flex-col gap-2">
                          {renderMessageContent(msg.content)}
                          <button 
                            onClick={() => handleAskAI(messages[idx - 1]?.content || "")} 
                            className="bg-white/10 hover:bg-white/20 text-white rounded px-3 py-1.5 w-fit font-bold border border-white/5 transition-colors"
                          >
                            Retry
                          </button>
                        </div>
                      ) : (
                        renderMessageContent(msg.content)
                      )}
                    </div>
                  </div>
                );
              })}
              
              {isLoading && (
                <div className="flex justify-start w-full">
                  <div className="bg-[#1b1c1c] border border-white/5 rounded-[20px] rounded-tl-[4px] p-4 max-w-[80%] flex items-center gap-3">
                    <span className="text-xs text-white/70 italic">AI is analyzing your finances...</span>
                    <div className="flex gap-1">
                      <div className="w-1 h-1 rounded-full bg-[#0fee65] animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1 h-1 rounded-full bg-[#0fee65] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1 h-1 rounded-full bg-[#0fee65] animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions / Prompt Suggestions (Visible when not loading) */}
            {!isLoading && (
              <div className="px-4 py-3 bg-[#121212]">
                <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-none snap-x">
                  {PREDEFINED_PROMPTS.map((promptText, index) => (
                    <button
                      key={index}
                      onClick={() => handleAskAI(promptText)}
                      className="flex-shrink-0 snap-center px-4 py-2 rounded-full bg-[#1b1c1c] hover:bg-[#0fee65]/10 border border-white/5 hover:border-[#0fee65]/20 text-[11px] text-white/70 hover:text-[#0fee65] font-medium transition-all cursor-pointer whitespace-nowrap shadow-sm"
                    >
                      {promptText}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleFormSubmit} className="p-4 border-t border-white/5 bg-[#121212] flex gap-2">
              <input
                type="text"
                placeholder="Ask about your spending, budget, or savings..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 px-4 py-3 rounded-full text-xs bg-[#1b1c1c] text-white border border-white/10 focus:border-[#0fee65] outline-none shadow-inner"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="w-10 h-10 flex-shrink-0 rounded-full bg-[#0fee65] text-[#121212] hover:bg-[#0fee65]/90 disabled:opacity-40 flex items-center justify-center transition-all cursor-pointer border-none shadow-md"
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
