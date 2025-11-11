import React, { useState } from 'react';

const Education = () => {
  const [activeTab, setActiveTab] = useState('basics');

  const content = {
    basics: {
      title: '📚 MEV Basics',
      sections: [
        {
          title: 'What is MEV?',
          content: 'Maximal Extractable Value (MEV) is the maximum profit a miner or validator can make by reordering or manipulating transactions in a block. It\'s extracted at the expense of regular users who get worse prices.'
        },
        {
          title: 'Why Does It Matter?',
          content: 'MEV attacks cost users millions daily through poor execution prices, failed trades, and liquidations. On average, users lose $0.50-$5 per DEX swap due to MEV!'
        },
        {
          title: 'Who Extracts MEV?',
          content: 'Searchers (bots), validators, miners, and sophisticated traders extract MEV by front-running, sandwich attacking, or back-running transactions.'
        }
      ]
    },
    attacks: {
      title: '⚠️ Attack Types',
      sections: [
        {
          title: 'Sandwich Attack 🥪',
          content: 'An attacker places a transaction before your swap (front-run) and after your swap (back-run), profiting from the price movement. You end up with fewer tokens and the attacker profits.'
        },
        {
          title: 'Front-Running ⚡',
          content: 'An attacker sees your pending transaction and submits their own with higher gas first. This executes your transaction at a worse price than expected, benefiting the attacker.'
        },
        {
          title: 'Back-Running 📉',
          content: 'An attacker executes a transaction immediately after yours, exploiting the new market state you created. Common in liquidation and arbitrage strategies.'
        }
      ]
    },
    protection: {
      title: '🛡️ Protection Strategies',
      sections: [
        {
          title: 'Flashbots Protect',
          content: 'Use Flashbots Protect RPC to send transactions privately. Your transaction is hidden from the mempool, protecting you from front-runners and sandwich attacks. Validators still earn rewards!'
        },
        {
          title: 'MEV-Resistant Routers',
          content: 'Use routers like CoW Protocol or MEV-resistant DEX aggregators that optimize for fair pricing and include anti-MEV mechanisms in their design.'
        },
        {
          title: 'Smart Slippage Settings',
          content: 'Set appropriate slippage limits on your swaps. Lower slippage = better protection but may cause more failed transactions during high volatility.'
        }
      ]
    },
    advanced: {
      title: '🚀 Advanced Topics',
      sections: [
        {
          title: 'Risk Scoring Algorithm',
          content: 'We calculate risk scores (0-100) based on: gas price (40%), slippage (30%), transaction value (20%), and pattern analysis (10%). Higher scores = more likely MEV.'
        },
        {
          title: 'Transaction Replay',
          content: 'Our simulator replays your transaction against historical mempool states to estimate actual MEV impact and potential losses before you submit on-chain.'
        },
        {
          title: 'Multi-Chain MEV',
          content: 'MEV exists on Ethereum, Polygon, BSC, Arbitrum, Optimism, and other EVM chains. Cross-chain MEV is an emerging threat as liquidity spreads across networks.'
        }
      ]
    }
  };

  const tabs = [
    { id: 'basics', label: 'Basics', icon: '📖' },
    { id: 'attacks', label: 'Attacks', icon: '⚔️' },
    { id: 'protection', label: 'Protection', icon: '🔐' },
    { id: 'advanced', label: 'Advanced', icon: '🧪' }
  ];

  return (
    <div className="rounded-2xl border border-brand-neon/30 bg-gradient-to-br from-slate-900/50 to-slate-800/50 p-6 backdrop-blur">
      <h2 className="text-2xl font-bold text-brand-neon mb-6">📚 MEV Education Hub</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-brand-neon text-black'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-white">{content[activeTab].title}</h3>

        {content[activeTab].sections.map((section, idx) => (
          <div key={idx} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-brand-neon/30 transition">
            <h4 className="text-lg font-semibold text-brand-neon mb-2">{section.title}</h4>
            <p className="text-slate-300 leading-relaxed">{section.content}</p>
          </div>
        ))}
      </div>

      {/* Quick Tips */}
      <div className="mt-8 pt-6 border-t border-slate-700/50">
        <h3 className="text-lg font-bold text-brand-neon mb-4">⭐ Quick Tips</h3>
        <ul className="space-y-2 text-slate-300">
          <li className="flex gap-2">
            <span>💡</span>
            <span>Check our Risk Heatmap to avoid high-MEV hours</span>
          </li>
          <li className="flex gap-2">
            <span>💡</span>
            <span>Use the Transaction Simulator before large trades</span>
          </li>
          <li className="flex gap-2">
            <span>💡</span>
            <span>Split large orders into smaller trades to reduce MEV impact</span>
          </li>
          <li className="flex gap-2">
            <span>💡</span>
            <span>Enable email alerts to stay informed of market conditions</span>
          </li>
          <li className="flex gap-2">
            <span>💡</span>
            <span>Always use Flashbots Protect for high-value transactions</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Education;