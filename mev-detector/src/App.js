import React, { useState, useEffect } from 'react';
import AIChat from './components/AIChat';
import EmailAlerts from './components/EmailAlerts';
import RiskHeatmap from './components/RiskHeatmap';
import Education from './components/Education';
import Rewards from './components/Rewards';
import LiveFeed from './components/LiveFeed';
import Simulator from './components/Simulator';
import FlashbotsProtection from './components/FlashbotsProtection';
import WeeklyReport from './components/WeeklyReport';

function App() {
  const [mevData, setMevData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [walletAddress, setWalletAddress] = useState('');
  const [walletError, setWalletError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const fetchMevData = async () => {
      try {
        setLoading(true);
        // Use environment variable for API URL
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3003';
        const response = await fetch(`${apiUrl}/api/attacks`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (result.success && result.data) {
          setMevData(result.data);
        } else {
          setMevData([]);
        }
        setError(null);
      } catch (err) {
        setError('Failed to fetch MEV data: ' + err.message);
        setMevData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMevData();
    const interval = setInterval(fetchMevData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) {
      return;
    }
    const provider = window.ethereum;
    const handleAccountsChanged = accounts => {
      if (accounts && accounts.length) {
        setWalletAddress(accounts[0]);
        setWalletError('');
      } else {
        setWalletAddress('');
      }
    };
    provider.request({ method: 'eth_accounts' }).then(handleAccountsChanged).catch(err => {
      setWalletError(err?.message || 'Unable to fetch accounts');
    });
    provider.on('accountsChanged', handleAccountsChanged);
    return () => {
      provider.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, []);

  const handleConnectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setWalletError('MetaMask not detected');
      return;
    }
    try {
      setIsConnecting(true);
      setWalletError('');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length) {
        setWalletAddress(accounts[0]);
      }
    } catch (err) {
      if (err?.code === 4001) {
        setWalletError('Connection rejected');
      } else {
        setWalletError(err?.message || 'Failed to connect');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const list = mevData.slice(0, 10);
  const stats = {
    totalAttacks: mevData.length,
    avgRisk: Math.round(mevData.reduce((sum, item) => sum + (parseFloat(item.riskScore) || 0), 0) / mevData.length || 0),
    totalSlippage: mevData.reduce((sum, item) => sum + (parseFloat(item.slippageLoss) || 0), 0),
    protected: Math.floor(mevData.length * 0.6)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <header className="bg-slate-900/80 border-b border-white/10 px-6 py-6 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-brand-neon bg-clip-text text-transparent">
                ⚡ MEV Detector
              </h1>
              <p className="mt-1 text-slate-400 text-sm">Real-time Ethereum MEV Protection & Analysis</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-slate-400">Network</div>
                <div className="font-bold text-green-400">Ethereum ✓</div>
              </div>
              {walletAddress && (
                <div className="text-right">
                  <div className="text-xs text-slate-400">Wallet</div>
                  <div className="font-bold text-brand-neon">{`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}</div>
                </div>
              )}
              <div className="flex flex-col items-end gap-1">
                <button
                  onClick={handleConnectWallet}
                  disabled={isConnecting}
                  className={`bg-brand-neon hover:bg-green-400 text-black px-4 py-2 rounded-lg font-medium transition ${
                    isConnecting ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isConnecting ? 'Connecting...' : walletAddress ? 'Connected' : 'Connect Wallet'}
                </button>
                {walletError && <span className="text-xs text-red-400">{walletError}</span>}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '📊' },
              { id: 'heatmap', label: 'Risk Map', icon: '🔥' },
              { id: 'alerts', label: 'Alerts', icon: '📧' },
              { id: 'education', label: 'Learn', icon: '📚' },
              { id: 'rewards', label: 'Rewards', icon: '🏆' }
            ].map(tab => (
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
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {error && (
              <div className="rounded-lg border border-red-400/60 bg-red-400/10 px-4 py-3 text-red-200 flex items-center gap-2">
                <span>⚠️</span>
                {error}
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-green-600/20 to-brand-neon/20 border border-green-500/30 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Detected Attacks</div>
                <div className="text-3xl font-bold text-brand-neon">{stats.totalAttacks}</div>
                <div className="text-xs text-slate-500 mt-2">Last 24 hours</div>
              </div>
              <div className="bg-gradient-to-br from-orange-600/20 to-red-600/20 border border-orange-500/30 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Avg Risk Score</div>
                <div className="text-3xl font-bold text-orange-400">{stats.avgRisk}%</div>
                <div className="text-xs text-slate-500 mt-2">Threat level</div>
              </div>
              <div className="bg-gradient-to-br from-red-600/20 to-pink-600/20 border border-red-500/30 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Total Slippage Loss</div>
                <div className="text-3xl font-bold text-red-400">${stats.totalSlippage.toFixed(0)}</div>
                <div className="text-xs text-slate-500 mt-2">Potential impact</div>
              </div>
              <div className="bg-gradient-to-br from-green-600/20 to-brand-neon/20 border border-green-500/30 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Protected</div>
                <div className="text-3xl font-bold text-brand-neon">{stats.protected}</div>
                <div className="text-xs text-slate-500 mt-2">Via Flashbots</div>
              </div>
            </div>

            {/* Main Content Area */}
            {loading ? (
              <div className="flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-10 py-20 text-lg text-slate-300 animate-pulse">
                ⏳ Loading MEV data...
              </div>
            ) : (
              <div className="rounded-2xl border border-brand-neon/30 bg-slate-900/70 p-8 backdrop-blur">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-brand-neon mb-2">📡 Real-Time MEV Attacks</h2>
                  <p className="text-slate-400">Latest detected MEV transactions on Ethereum</p>
                </div>

                {list.length > 0 ? (
                  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {/* Live feed column (top) */}
                    <div className="md:col-span-2 lg:col-span-3">
                      <h3 className="text-lg font-semibold text-slate-300 mb-3">Live Attack Feed</h3>
                      <LiveFeed />
                    </div>
                    {list.map((item, idx) => (
                      <div
                        key={item.hash ?? idx}
                        className="rounded-xl border border-brand-neon/40 bg-slate-950/80 p-6 hover:border-brand-neon/80 hover:shadow-lg hover:shadow-brand-neon/20 transition-all duration-300 hover:-translate-y-1"
                      >
                        {/* Attack Type Badge */}
                        <div className="inline-block mb-3 px-2 py-1 bg-amber-500/20 border border-amber-500/50 rounded-full text-xs font-bold text-amber-300">
                          {item.attackType || 'MEV Attack'}
                        </div>

                        {/* Hash */}
                        <div className="mb-4 border-b border-brand-neon/30 pb-3 font-mono text-sm text-brand-neon">
                          TX: {(item.hash ?? 'N/A').slice(0, 16)}...
                        </div>

                        {/* Details */}
                        <div className="space-y-3 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Risk Score</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-red-400">{item.riskScore || 'N/A'}</span>
                              <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all ${
                                    parseFloat(item.riskScore) > 75 ? 'bg-red-500' :
                                    parseFloat(item.riskScore) > 50 ? 'bg-orange-500' :
                                    'bg-yellow-500'
                                  }`}
                                  style={{ width: `${item.riskScore}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Slippage Loss</span>
                            <span className="font-bold text-red-400">
                              ${item.slippageLoss ? parseFloat(item.slippageLoss).toFixed(2) : 'N/A'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Gas Price</span>
                            <span className="font-bold text-brand-neon">
                              {item.gasPrice ? `${parseFloat(item.gasPrice).toFixed(1)} Gwei` : 'N/A'}
                            </span>
                          </div>

                          {item.timestamp && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Time</span>
                              <span className="font-mono text-slate-300">
                                {new Date(item.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Action Button */}
                        <button className="w-full mt-4 bg-brand-neon/20 hover:bg-brand-neon/40 border border-brand-neon/50 text-brand-neon py-2 rounded-lg transition font-medium text-sm">
                          View Details
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/10 bg-white/5 px-6 py-12 text-center text-slate-400">
                    ✓ No MEV attacks detected - monitoring mempool...
                  </div>
                )}
                {/* Project summary fetched from server */}
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <div className="mt-4">
                      <FlashbotsProtection />
                    </div>
                  </div>
                  <div>
                    <Simulator />
                  </div>
                </div>
                <div className="mt-6">
                  <WeeklyReport />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Heatmap Tab */}
        {activeTab === 'heatmap' && (
          <div className="space-y-6">
            <RiskHeatmap data={mevData} />
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            <EmailAlerts />
          </div>
        )}

        {/* Education Tab */}
        {activeTab === 'education' && (
          <div className="space-y-6">
            <Education />
          </div>
        )}

        {/* Rewards Tab */}
        {activeTab === 'rewards' && (
          <div className="space-y-6">
            <Rewards userAddress="0x742d3...8Qf2c" />
          </div>
        )}
      </main>

      {/* AI Chat Widget */}
      <AIChat />

      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-950/50 px-6 py-8 mt-16">
        <div className="max-w-7xl mx-auto text-center text-slate-400 text-sm">
          <p>⚡ MEV Detector - Protecting Ethereum users from Maximal Extractable Value attacks</p>
          <p className="mt-2">Built with Flashbots | Alchemy | Ethers.js</p>
        </div>
      </footer>
    </div>
  );
}

export default App;