import React, { useState, useEffect } from 'react';

const CryptoMarketTrends = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch data from backend API
  const fetchMarketData = async (endpoint) => {
    try {
      setLoading(true);
      setError(null);
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3004';
      const response = await fetch(`${apiUrl}${endpoint}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data || result;
    } catch (err) {
      console.error(`Error fetching ${endpoint}:`, err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Fetch all market data
  const fetchAllMarketData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all required data
      const [globalMetrics, listings, trending, fearGreed] = await Promise.all([
        fetchMarketData('/api/crypto/global-metrics'),
        fetchMarketData('/api/crypto/listings?limit=10'),
        fetchMarketData('/api/crypto/trending'),
        fetchMarketData('/api/crypto/fear-greed')
      ]);
      
      setMarketData({
        overview: globalMetrics,
        topCryptocurrencies: listings,
        trending: trending,
        fearGreed: fearGreed
      });
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when component mounts or section changes
  useEffect(() => {
    fetchAllMarketData();
    // Refresh data every 5 minutes
    const interval = setInterval(fetchAllMarketData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (value) => {
    if (value === undefined || value === null) return 'N/A';
    if (value >= 1000000000000) {
      return `$${(value / 1000000000000).toFixed(2)}T`;
    }
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(2)}B`;
    }
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    return `$${value.toFixed(2)}`;
  };

  const formatPercent = (value) => {
    if (value === undefined || value === null) return 'N/A';
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Generate mock chart data for visualization
  const generateChartData = (type, count = 7) => {
    const data = [];
    const now = Date.now();
    for (let i = 0; i < count; i++) {
      const timestamp = new Date(now - (count - i) * 24 * 60 * 60 * 1000);
      const baseValue = type === 'price' ? 40000 : type === 'volume' ? 20000000000 : Math.random() * 100;
      const variation = (Math.random() - 0.5) * baseValue * 0.2;
      data.push({
        date: timestamp,
        value: baseValue + variation,
        label: timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    return data;
  };

  // Generate candlestick data
  const generateCandleData = (count = 20) => {
    const data = [];
    let previousClose = 40000;
    const now = Date.now();
    
    for (let i = 0; i < count; i++) {
      const timestamp = new Date(now - (count - i) * 60 * 60 * 1000);
      const open = previousClose;
      const change = (Math.random() - 0.5) * 2000;
      const close = open + change;
      const high = Math.max(open, close) + Math.random() * 1000;
      const low = Math.min(open, close) - Math.random() * 1000;
      const volume = Math.random() * 1000000000;
      
      data.push({
        timestamp,
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume: parseFloat(volume.toFixed(2)),
        label: timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      });
      
      previousClose = close;
    }
    
    return data;
  };

  // Generate flow chart data
  const generateFlowData = () => {
    return [
      { from: 'BTC', to: 'ETH', value: 125000000, color: '#F7931A' },
      { from: 'ETH', to: 'USDT', value: 87000000, color: '#627EEA' },
      { from: 'USDT', to: 'SOL', value: 64000000, color: '#14F195' },
      { from: 'SOL', to: 'BNB', value: 42000000, color: '#F0B90B' },
      { from: 'BNB', to: 'XRP', value: 31000000, color: '#23292F' },
      { from: 'XRP', to: 'ADA', value: 28000000, color: '#0033AD' },
      { from: 'ADA', to: 'DOGE', value: 19000000, color: '#BA9F33' },
      { from: 'DOGE', to: 'AVAX', value: 15000000, color: '#E84142' }
    ];
  };

  // Simple bar chart component
  const BarChart = ({ data, height = 200 }) => {
    const maxValue = Math.max(...data.map(d => d.value));
    return (
      <div className="flex items-end justify-between h-48 px-2">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center flex-1 mx-1">
            <div 
              className="w-full bg-gradient-to-t from-brand-neon to-green-500 rounded-t-md"
              style={{ height: `${(item.value / maxValue) * height}px` }}
            ></div>
            <div className="text-xs text-slate-400 mt-2">{item.label}</div>
          </div>
        ))}
      </div>
    );
  };

  // Simple line chart component
  const LineChart = ({ data, height = 200 }) => {
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue;
    
    return (
      <div className="relative h-48">
        <svg viewBox={`0 0 400 ${height}`} className="w-full h-full">
          <polyline
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="2"
            points={data.map((item, index) => {
              const x = (index / (data.length - 1)) * 400;
              const y = height - ((item.value - minValue) / range) * (height - 20) - 10;
              return `${x},${y}`;
            }).join(' ')}
          />
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>
          </defs>
        </svg>
        <div className="flex justify-between text-xs text-slate-400 mt-2">
          <span>{data[0].label}</span>
          <span>{data[data.length - 1].label}</span>
        </div>
      </div>
    );
  };

  // Pie chart component
  const PieChart = ({ data }) => {
    let startAngle = 0;
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    return (
      <div className="relative w-48 h-48 mx-auto">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const angle = (percentage / 100) * 360;
            const endAngle = startAngle + angle;
            
            // Convert angles to radians
            const startRad = (startAngle - 90) * Math.PI / 180;
            const endRad = (endAngle - 90) * Math.PI / 180;
            
            // Calculate coordinates
            const x1 = 50 + 40 * Math.cos(startRad);
            const y1 = 50 + 40 * Math.sin(startRad);
            const x2 = 50 + 40 * Math.cos(endRad);
            const y2 = 50 + 40 * Math.sin(endRad);
            
            // Large arc flag
            const largeArcFlag = angle > 180 ? 1 : 0;
            
            const pathData = [
              `M 50 50`,
              `L ${x1} ${y1}`,
              `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              `L 50 50`
            ].join(' ');
            
            startAngle = endAngle;
            
            return (
              <path
                key={index}
                d={pathData}
                fill={item.color}
                stroke="#1E293B"
                strokeWidth="0.5"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{data.length}</div>
            <div className="text-xs text-slate-400">Assets</div>
          </div>
        </div>
      </div>
    );
  };

  // Candlestick chart component
  const CandlestickChart = ({ data, height = 200 }) => {
    const maxPrice = Math.max(...data.map(d => d.high));
    const minPrice = Math.min(...data.map(d => d.low));
    const priceRange = maxPrice - minPrice;
    const width = 400;
    const candleWidth = width / data.length - 2;
    
    return (
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full min-w-full">
          {data.map((candle, index) => {
            const x = (index * (width / data.length)) + (candleWidth / 2);
            const yOpen = height - ((candle.open - minPrice) / priceRange) * height;
            const yClose = height - ((candle.close - minPrice) / priceRange) * height;
            const yHigh = height - ((candle.high - minPrice) / priceRange) * height;
            const yLow = height - ((candle.low - minPrice) / priceRange) * height;
            
            const isGreen = candle.close > candle.open;
            const bodyTop = Math.min(yOpen, yClose);
            const bodyHeight = Math.abs(yOpen - yClose);
            
            return (
              <g key={index}>
                {/* Wick */}
                <line
                  x1={x}
                  y1={yHigh}
                  x2={x}
                  y2={yLow}
                  stroke={isGreen ? '#10B981' : '#EF4444'}
                  strokeWidth="1"
                />
                {/* Body */}
                <rect
                  x={x - (candleWidth / 2)}
                  y={bodyTop}
                  width={candleWidth}
                  height={Math.max(bodyHeight, 1)}
                  fill={isGreen ? '#10B981' : '#EF4444'}
                />
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  // Flow chart component
  const FlowChart = ({ data }) => {
    return (
      <div className="relative h-64">
        <svg viewBox="0 0 400 200" className="w-full h-full">
          {data.map((flow, index) => {
            const startX = 20;
            const endX = 380;
            const y = 20 + (index * 25);
            
            return (
              <g key={index}>
                <line
                  x1={startX}
                  y1={y}
                  x2={endX}
                  y2={y}
                  stroke={flow.color}
                  strokeWidth={Math.max(1, flow.value / 20000000)}
                />
                <circle
                  cx={startX}
                  cy={y}
                  r="4"
                  fill={flow.color}
                />
                <circle
                  cx={endX}
                  cy={y}
                  r="4"
                  fill={flow.color}
                />
                <text
                  x={startX + 10}
                  y={y - 5}
                  fill="#CBD5E1"
                  fontSize="10"
                >
                  {flow.from}
                </text>
                <text
                  x={endX - 30}
                  y={y - 5}
                  fill="#CBD5E1"
                  fontSize="10"
                  textAnchor="end"
                >
                  {flow.to}
                </text>
                <text
                  x={(startX + endX) / 2}
                  y={y - 5}
                  fill="#94A3B8"
                  fontSize="8"
                  textAnchor="middle"
                >
                  ${formatCurrency(flow.value)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  const sections = [
    { id: 'overview', label: 'Market Overview', icon: '📊' },
    { id: 'technical', label: 'Technical Indicators', icon: '📈' },
    { id: 'cryptocurrencies', label: 'Top Cryptocurrencies', icon: '🏅' },
    { id: 'etf', label: 'ETF Flows', icon: '🏦' },
    { id: 'gas', label: 'Gas Fees', icon: '⛽' },
    { id: 'volatility', label: 'Volatility Analysis', icon: '📊' },
    { id: 'correlation', label: 'Correlation Matrix', icon: '🔗' },
    { id: 'cycle', label: 'Market Cycle', icon: '🔄' },
    { id: 'onchain', label: 'On-Chain Analytics', icon: '⛓️' },
    { id: 'whale', label: 'Whale Activity', icon: '🐋' },
    { id: 'stablecoin', label: 'Stablecoin Analysis', icon: '🪙' },
    { id: 'defi', label: 'DeFi Metrics', icon: '🏦' },
    { id: 'mining', label: 'Mining Metrics', icon: '⛏️' },
    { id: 'orderbook', label: 'Order Book Depth', icon: '📚' },
    { id: 'funding', label: 'Funding Rates', icon: '💸' },
    { id: 'portfolio', label: 'Portfolio Tracker', icon: '💼' },
    { id: 'signals', label: 'Trading Signals', icon: '📡' },
    { id: 'sentiment', label: 'News & Sentiment', icon: '📰' },
    { id: 'ico', label: 'ICO Calendar', icon: '📅' },
    { id: 'exchange', label: 'Exchange Comparison', icon: '💱' },
    { id: 'historical', label: 'Historical Data', icon: '🕰️' },
    { id: 'risk', label: 'Risk Assessment', icon: '⚠️' },
    { id: 'arbitrage', label: 'Arbitrage Opportunities', icon: '💱' },
    { id: 'yield', label: 'Yield Farming', icon: '🌱' },
    { id: 'regulatory', label: 'Regulatory Tracker', icon: '⚖️' },
    { id: 'sentiment2', label: 'Sentiment Analysis', icon: '😊' },
    { id: 'technical2', label: 'Advanced Technical', icon: '🔬' },
    { id: 'correlation2', label: 'Asset Correlation', icon: '🔗' },
    { id: 'liquidity', label: 'Liquidity Analysis', icon: '💧' },
    { id: 'network', label: 'Network Metrics', icon: '🌐' },
    { id: 'options', label: 'Options Analysis', icon: '📊' },
    { id: 'derivatives', label: 'Derivatives Insights', icon: '📊' },
    { id: 'onchain2', label: 'Advanced On-Chain', icon: '⛓️' },
    { id: 'microstructure', label: 'Market Microstructure', icon: '🔬' },
    { id: 'economic', label: 'Economic Indicators', icon: '📈' },
    { id: 'behavioral', label: 'Behavioral Analytics', icon: '🧠' }
  ];

  const renderOverview = () => {
    const overview = marketData?.overview || {};
    const chartData = generateChartData('price');
    const pieData = [
      { name: 'Bitcoin', value: 45, color: '#F7931A' },
      { name: 'Ethereum', value: 18, color: '#627EEA' },
      { name: 'Other', value: 37, color: '#10B981' }
    ];
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-900/50 to-blue-700/30 border border-blue-500/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-300 mb-2">Total Market Cap</h3>
            <p className="text-3xl font-bold text-white">{formatCurrency(overview.totalMarketCap)}</p>
            <div className="mt-2 text-sm text-blue-200">
              24h Change: <span className="text-green-400">{formatPercent(overview.marketCapChange24h)}</span>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-900/50 to-purple-700/30 border border-purple-500/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-purple-300 mb-2">24h Volume</h3>
            <p className="text-3xl font-bold text-white">{formatCurrency(overview.totalVolume24h)}</p>
            <div className="mt-2 text-sm text-purple-200">
              24h Change: <span className="text-green-400">{formatPercent(overview.volumeChange24h)}</span>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-900/50 to-green-700/30 border border-green-500/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-green-300 mb-2">Bitcoin Dominance</h3>
            <p className="text-3xl font-bold text-white">{overview.bitcoinDominance?.toFixed(1)}%</p>
            <div className="mt-2 text-sm text-green-200">
              Ethereum: {overview.ethereumDominance?.toFixed(1)}%
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-900/50 to-yellow-700/30 border border-yellow-500/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-yellow-300 mb-2">Active Cryptocurrencies</h3>
            <p className="text-3xl font-bold text-white">{overview.activeCryptocurrencies?.toLocaleString()}</p>
            <div className="mt-2 text-sm text-yellow-200">
              Tracked Markets: {overview.activeCryptocurrencies ? Math.floor(overview.activeCryptocurrencies * 0.4).toLocaleString() : 'N/A'}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-red-900/50 to-red-700/30 border border-red-500/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-red-300 mb-2">Fear & Greed Index</h3>
            <p className="text-3xl font-bold text-white">
              {marketData?.fearGreed?.index || 'N/A'}
            </p>
            <div className="mt-2 text-sm text-red-200">
              Status: {marketData?.fearGreed?.label || 'N/A'}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Market Cap Distribution</h3>
            <PieChart data={pieData} />
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Price Trend (Last 7 Days)</h3>
            <LineChart data={chartData} />
          </div>
        </div>
      </div>
    );
  };

  const renderTechnicalIndicators = () => {
    const chartData = generateChartData('price');
    const candleData = generateCandleData(15);
    return (
      <div className="space-y-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Technical Indicators</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'RSI (14)', value: 62.4, status: 'Neutral' },
              { name: 'MACD', value: 1245.7, status: 'Bullish' },
              { name: 'MA (50)', value: 25800, status: 'Bullish' },
              { name: 'MA (200)', value: 24500, status: 'Bullish' },
              { name: 'Stochastic', value: 72.3, status: 'Overbought' },
              { name: 'CCI', value: 85.2, status: 'Neutral' }
            ].map((indicator, index) => (
              <div key={index} className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold text-slate-200">{indicator.name}</h4>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    indicator.status === 'Bullish' ? 'bg-green-900/50 text-green-300' :
                    indicator.status === 'Bearish' ? 'bg-red-900/50 text-red-300' :
                    indicator.status === 'Overbought' ? 'bg-yellow-900/50 text-yellow-300' :
                    indicator.status === 'Oversold' ? 'bg-blue-900/50 text-blue-300' :
                    'bg-slate-900/50 text-slate-300'
                  }`}>
                    {indicator.status}
                  </span>
                </div>
                <p className="text-2xl font-bold text-white mt-2">{indicator.value}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Price Action Analysis</h3>
            <LineChart data={chartData} />
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Candlestick Chart (Last 15 Hours)</h3>
            <CandlestickChart data={candleData} />
          </div>
        </div>
      </div>
    );
  };

  const renderTopCryptocurrencies = () => {
    const cryptocurrencies = marketData?.topCryptocurrencies || [];
    const chartData = generateChartData('volume');
    const pieData = [
      { name: 'BTC', value: 45, color: '#F7931A' },
      { name: 'ETH', value: 18, color: '#627EEA' },
      { name: 'USDT', value: 7, color: '#26A17B' },
      { name: 'BNB', value: 5, color: '#F0B90B' },
      { name: 'SOL', value: 4, color: '#14F195' },
      { name: 'Others', value: 21, color: '#10B981' }
    ];
    
    return (
      <div className="space-y-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Top Cryptocurrencies</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 text-slate-400 font-medium">Asset</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Price</th>
                  <th className="text-right py-3 text-slate-400 font-medium">24h Change</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Market Cap</th>
                </tr>
              </thead>
              <tbody>
                {cryptocurrencies.map((crypto) => (
                  <tr key={crypto.id} className="border-b border-slate-800/50 hover:bg-slate-700/30">
                    <td className="py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-neon/20 to-green-500/20 flex items-center justify-center mr-3">
                          <span className="text-xs font-bold text-brand-neon">{crypto.symbol?.charAt(0) || 'C'}</span>
                        </div>
                        <div>
                          <div className="font-medium text-white">{crypto.name || 'N/A'}</div>
                          <div className="text-sm text-slate-400">{crypto.symbol || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-right py-4 text-white font-medium">
                      ${crypto.quote?.USD?.price ? crypto.quote.USD.price.toLocaleString() : 'N/A'}
                    </td>
                    <td className={`text-right py-4 font-medium ${crypto.quote?.USD?.percentChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatPercent(crypto.quote?.USD?.percentChange24h)}
                    </td>
                    <td className="text-right py-4 text-slate-300">
                      {formatCurrency(crypto.quote?.USD?.marketCap)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Trading Volume Distribution</h3>
            <BarChart data={chartData} />
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Market Cap Share</h3>
            <PieChart data={pieData} />
          </div>
        </div>
      </div>
    );
  };

  const renderETFFlows = () => {
    const flowData = generateFlowData();
    return (
      <div className="space-y-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">ETF Flows</h3>
          <div className="space-y-4">
            {[
              { name: 'Bitcoin ETF', inflow: 452000000, outflow: 120000000, net: 332000000 },
              { name: 'Ethereum ETF', inflow: 187000000, outflow: 45000000, net: 142000000 }
            ].map((etf, index) => (
              <div key={index} className="bg-slate-700/30 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-white">{etf.name}</h4>
                  <span className="text-green-400 font-medium">Net: ${etf.net.toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-slate-400">Inflows</div>
                    <div className="text-lg font-bold text-green-400">${etf.inflow.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Outflows</div>
                    <div className="text-lg font-bold text-red-400">${etf.outflow.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Net Flow</div>
                    <div className="text-lg font-bold text-green-400">${etf.net.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Fund Flow Visualization</h3>
          <FlowChart data={flowData} />
        </div>
      </div>
    );
  };

  const renderGasFees = () => {
    const chartData = generateChartData('price', 14);
    const pieData = [
      { name: 'Ethereum', value: 60, color: '#627EEA' },
      { name: 'Polygon', value: 25, color: '#8247E5' },
      { name: 'Arbitrum', value: 15, color: '#28A0F0' }
    ];
    
    return (
      <div className="space-y-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Gas Fees Across Networks</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { network: 'Ethereum', baseFee: 12, priorityFee: 2.5, avgTxCost: 3.75 },
              { network: 'Polygon', baseFee: 50, priorityFee: 30, avgTxCost: 0.02 },
              { network: 'Arbitrum', baseFee: 0.1, priorityFee: 0.01, avgTxCost: 0.001 }
            ].map((network, index) => (
              <div key={index} className="bg-slate-700/30 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-3">{network.network}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Base Fee</span>
                    <span className="text-white">{network.baseFee} Gwei</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Priority Fee</span>
                    <span className="text-white">{network.priorityFee} Gwei</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Avg Tx Cost</span>
                    <span className="text-white">${network.avgTxCost}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Gas Price Trends</h3>
            <LineChart data={chartData} height={150} />
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Network Usage Distribution</h3>
            <PieChart data={pieData} />
          </div>
        </div>
      </div>
    );
  };

  // All other sections will use the "coming soon" template for now
  const renderComingSoon = (sectionName) => (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-12 text-center">
      <div className="text-5xl mb-4">🏗️</div>
      <h3 className="text-2xl font-bold text-white mb-2">{sectionName}</h3>
      <p className="text-slate-400 max-w-md mx-auto">
        This section is under development. It will provide comprehensive analysis and insights for this category with interactive charts and real-time data.
      </p>
      <div className="mt-6">
        <div className="inline-block bg-slate-700/50 rounded-lg p-4">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading && !marketData) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-neon"></div>
        </div>
      );
    }

    if (error && !marketData) {
      return (
        <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-6 text-center">
          <div className="text-red-400 text-2xl mb-2">⚠️</div>
          <h3 className="text-xl font-bold text-white mb-2">Error Loading Data</h3>
          <p className="text-red-200">{error}</p>
          <button 
            onClick={fetchAllMarketData}
            className="mt-4 px-4 py-2 bg-red-700/50 hover:bg-red-600/50 rounded-lg text-white transition"
          >
            Retry
          </button>
        </div>
      );
    }

    switch (activeSection) {
      case 'overview':
        return renderOverview();
      case 'technical':
        return renderTechnicalIndicators();
      case 'cryptocurrencies':
        return renderTopCryptocurrencies();
      case 'etf':
        return renderETFFlows();
      case 'gas':
        return renderGasFees();
      case 'volatility':
        return renderComingSoon('Volatility Analysis');
      case 'correlation':
        return renderComingSoon('Correlation Matrix');
      case 'cycle':
        return renderComingSoon('Market Cycle');
      case 'onchain':
        return renderComingSoon('On-Chain Analytics');
      case 'whale':
        return renderComingSoon('Whale Activity');
      case 'stablecoin':
        return renderComingSoon('Stablecoin Analysis');
      case 'defi':
        return renderComingSoon('DeFi Metrics');
      case 'mining':
        return renderComingSoon('Mining Metrics');
      case 'orderbook':
        return renderComingSoon('Order Book Depth');
      case 'funding':
        return renderComingSoon('Funding Rates');
      case 'portfolio':
        return renderComingSoon('Portfolio Tracker');
      case 'signals':
        return renderComingSoon('Trading Signals');
      case 'sentiment':
        return renderComingSoon('News & Sentiment');
      case 'ico':
        return renderComingSoon('ICO Calendar');
      case 'exchange':
        return renderComingSoon('Exchange Comparison');
      case 'historical':
        return renderComingSoon('Historical Data');
      case 'risk':
        return renderComingSoon('Risk Assessment');
      case 'arbitrage':
        return renderComingSoon('Arbitrage Opportunities');
      case 'yield':
        return renderComingSoon('Yield Farming');
      case 'regulatory':
        return renderComingSoon('Regulatory Tracker');
      case 'sentiment2':
        return renderComingSoon('Sentiment Analysis');
      case 'technical2':
        return renderComingSoon('Advanced Technical');
      case 'correlation2':
        return renderComingSoon('Asset Correlation');
      case 'liquidity':
        return renderComingSoon('Liquidity Analysis');
      case 'network':
        return renderComingSoon('Network Metrics');
      case 'options':
        return renderComingSoon('Options Analysis');
      case 'derivatives':
        return renderComingSoon('Derivatives Insights');
      case 'onchain2':
        return renderComingSoon('Advanced On-Chain');
      case 'microstructure':
        return renderComingSoon('Market Microstructure');
      case 'economic':
        return renderComingSoon('Economic Indicators');
      case 'behavioral':
        return renderComingSoon('Behavioral Analytics');
      default:
        return renderOverview();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700/50 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-neon to-green-400 bg-clip-text text-transparent">
              📈 Market Analysis
            </h1>
            <p className="text-slate-400 mt-2">
              Comprehensive cryptocurrency market data and analysis
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-slate-400">Last updated:</div>
            <div className="text-sm font-medium text-brand-neon">
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
        {/* Vertical Navigation Menu */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 h-[calc(100vh-50px)] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">Analysis Categories</h3>
            <div className="space-y-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                    activeSection === section.id
                      ? 'bg-brand-neon text-black'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span>{section.icon}</span>
                  <span className="truncate">{section.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Content Area */}
        <div className="lg:col-span-5">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default CryptoMarketTrends;