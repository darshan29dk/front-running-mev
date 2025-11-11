import React, { useState, useRef, useEffect } from 'react';

const AIChat = () => {
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hi! I\'m your MEV Protection Assistant. Ask me anything about MEV, sandwich attacks, or how to protect your transactions! 🛡️' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Simple MEV knowledge base
  const knowledgeBase = {
    'what is mev': 'MEV stands for Maximal Extractable Value. It\'s the profit that miners/validators can extract from the blockchain by reordering transactions in a block. This can harm regular users! 📊',
    'sandwich attack': 'A sandwich attack happens when someone sees your pending transaction, places their own transaction before yours, then places another after. They profit from the price movement you create! 🥪',
    'front run': 'Front-running is when someone sees your transaction, submits a similar one with higher gas, and benefits when your transaction executes at a worse price. Common on DEXes! ⚡',
    'back run': 'Back-running is the opposite - someone waits for your transaction to execute, then immediately exploits the new state. Often seen in liquidation strategies! 📉',
    'protect': 'To protect yourself: 1) Use Flashbots Protect (private relay), 2) Set slippage limits, 3) Use MEV-resistant routers, 4) Split large trades, 5) Avoid MEV peak hours 🛡️',
    'gas price': 'Gas prices are displayed in Gwei. Higher gas = transactions mined faster but costs more. During MEV activity, gas wars can happen! ⛽',
    'slippage': 'Slippage is the difference between expected and actual execution price. MEV attacks increase slippage. Our detector estimates potential losses! 💰',
    'flashbots': 'Flashbots Protect is a private transaction relay that hides your transaction from the public mempool, protecting you from MEV attacks! 🔒',
    'default': 'I can help explain MEV, sandwich attacks, front-running, protection strategies, and more. What would you like to know? 🤔'
  };

  const findAnswer = (question) => {
    const q = question.toLowerCase();
    for (const [key, answer] of Object.entries(knowledgeBase)) {
      if (q.includes(key)) {
        return answer;
      }
    }
    return knowledgeBase['default'];
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Simulate typing delay
    setTimeout(() => {
      const botResponse = findAnswer(input);
      setMessages(prev => [...prev, { role: 'bot', text: botResponse }]);
      setLoading(false);
    }, 800);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Button */}
      <div className="fixed bottom-6 right-6 z-40">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="relative w-14 h-14 bg-gradient-to-br from-green-500 to-brand-neon rounded-full shadow-lg hover:shadow-brand-neon/50 transition-all hover:scale-110 flex items-center justify-center"
          >
            <svg className="w-7 h-7 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
          </button>
        )}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-32px)] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-brand-neon/30 rounded-2xl shadow-2xl flex flex-col max-h-96 animate-slideUp">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-brand-neon/20">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <h3 className="text-sm font-semibold text-brand-neon">MEV Assistant</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition text-xl"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                    msg.role === 'user'
                      ? 'bg-brand-neon text-black rounded-br-none'
                      : 'bg-slate-800 text-slate-200 border border-brand-neon/30 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 border border-brand-neon/30 px-4 py-2 rounded-lg rounded-bl-none">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-brand-neon rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-brand-neon rounded-full animate-pulse animation-delay-200"></div>
                    <div className="w-2 h-2 bg-brand-neon rounded-full animate-pulse animation-delay-400"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-brand-neon/20">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about MEV..."
                className="flex-1 bg-slate-800 border border-brand-neon/30 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-neon transition"
              />
              <button
                onClick={handleSend}
                disabled={loading}
                className="bg-brand-neon text-black hover:bg-green-400 disabled:opacity-50 px-4 py-2 rounded-lg transition text-sm font-medium"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChat;