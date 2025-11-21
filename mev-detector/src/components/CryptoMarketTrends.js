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

  // Generate mock data for different analysis types
  const generateVolatilityData = () => {
    return [
      { asset: 'BTC', volatility: 2.3, stdDev: 1.8, period: '24h' },
      { asset: 'ETH', volatility: 3.1, stdDev: 2.2, period: '24h' },
      { asset: 'SOL', volatility: 5.7, stdDev: 4.1, period: '24h' },
      { asset: 'BNB', volatility: 4.2, stdDev: 3.3, period: '24h' },
      { asset: 'ADA', volatility: 3.8, stdDev: 2.9, period: '24h' }
    ];
  };

  const generateCorrelationData = () => {
    return [
      { asset1: 'BTC', asset2: 'ETH', correlation: 0.85 },
      { asset1: 'BTC', asset2: 'SOL', correlation: 0.67 },
      { asset1: 'ETH', asset2: 'BNB', correlation: 0.72 },
      { asset1: 'SOL', asset2: 'ADA', correlation: 0.45 },
      { asset1: 'BTC', asset2: 'ADA', correlation: 0.38 }
    ];
  };

  const generateMarketCycleData = () => {
    return {
      phase: 'Bull Market',
      confidence: 78,
      indicators: [
        { name: 'RSI', value: 62.4, status: 'Neutral' },
        { name: 'MACD', value: 1245.7, status: 'Bullish' },
        { name: 'MA(50)', value: 25800, status: 'Bullish' },
        { name: 'MA(200)', value: 24500, status: 'Bullish' }
      ]
    };
  };

  const generateOnChainData = () => {
    return [
      { metric: 'Active Addresses', value: '1,245,678', change: '+5.2%' },
      { metric: 'Transaction Count', value: '892,345', change: '+3.7%' },
      { metric: 'Exchange Flows', value: '$2.4B', change: '-1.2%' },
      { metric: 'Network Hashrate', value: '456 EH/s', change: '+2.1%' }
    ];
  };

  const generateWhaleActivityData = () => {
    return [
      { asset: 'BTC', transactions: 124, volume: '$42.5M', wallets: 42 },
      { asset: 'ETH', transactions: 89, volume: '$18.7M', wallets: 38 },
      { asset: 'SOL', transactions: 156, volume: '$9.3M', wallets: 67 },
      { asset: 'BNB', transactions: 76, volume: '$6.8M', wallets: 31 }
    ];
  };

  const generateStablecoinData = () => {
    return [
      { name: 'Tether (USDT)', marketCap: '$82B', peg: '0.9995', change: '+0.2%' },
      { name: 'USD Coin (USDC)', marketCap: '$32B', peg: '1.0002', change: '-0.1%' },
      { name: 'Dai (DAI)', marketCap: '$5B', peg: '0.9987', change: '+0.3%' },
      { name: 'Binance USD (BUSD)', marketCap: '$3B', peg: '1.0001', change: '0.0%' }
    ];
  };

  const generateDeFiMetrics = () => {
    return [
      { protocol: 'Uniswap', tvl: '$3.5B', rank: 1, yield: '8.5%' },
      { protocol: 'MakerDAO', tvl: '$2.1B', rank: 2, yield: '4.2%' },
      { protocol: 'Compound', tvl: '$1.8B', rank: 3, yield: '6.8%' },
      { protocol: 'Aave', tvl: '$1.5B', rank: 4, yield: '7.2%' },
      { protocol: 'Curve', tvl: '$1.2B', rank: 5, yield: '9.1%' }
    ];
  };

  const generateMiningMetrics = () => {
    return {
      coin: 'Bitcoin',
      hashRate: '185 EH/s',
      difficulty: '28.3T',
      distribution: [
        { pool: 'Foundry USA', share: 35.2 },
        { pool: 'Antpool', share: 12.8 },
        { pool: 'F2Pool', share: 11.5 },
        { pool: 'Poolin', share: 9.7 },
        { pool: 'Others', share: 30.8 }
      ]
    };
  };

  const generateOrderBookData = () => {
    return {
      bids: [
        { price: 43250, amount: 2.5 },
        { price: 43200, amount: 4.2 },
        { price: 43150, amount: 3.8 },
        { price: 43100, amount: 6.1 },
        { price: 43050, amount: 2.9 }
      ],
      asks: [
        { price: 43300, amount: 1.8 },
        { price: 43350, amount: 3.2 },
        { price: 43400, amount: 2.7 },
        { price: 43450, amount: 4.5 },
        { price: 43500, amount: 3.1 }
      ]
    };
  };

  const generateFundingRates = () => {
    return [
      { exchange: 'Binance', rate: 0.00015, annualized: 5.48 },
      { exchange: 'Bybit', rate: 0.00021, annualized: 7.67 },
      { exchange: 'OKX', rate: 0.00008, annualized: 2.92 },
      { exchange: 'BitMEX', rate: 0.00018, annualized: 6.57 },
      { exchange: 'Deribit', rate: 0.00012, annualized: 4.38 }
    ];
  };

  const generatePortfolioData = () => {
    return {
      totalValue: '$125,430',
      change24h: '+2.3%',
      allocation: [
        { asset: 'BTC', value: '$45,200', percentage: 36 },
        { asset: 'ETH', value: '$32,100', percentage: 25.6 },
        { asset: 'SOL', value: '$18,750', percentage: 15 },
        { asset: 'USDT', value: '$15,000', percentage: 12 },
        { asset: 'Others', value: '$14,380', percentage: 11.4 }
      ],
      riskMetrics: {
        sharpe: 1.8,
        volatility: 12.4,
        maxDrawdown: -8.2
      }
    };
  };

  const generateTradingSignals = () => {
    return [
      { asset: 'BTC', signal: 'Buy', strength: 85, timeframe: '4h' },
      { asset: 'ETH', signal: 'Hold', strength: 72, timeframe: '4h' },
      { asset: 'SOL', signal: 'Sell', strength: 68, timeframe: '4h' },
      { asset: 'BNB', signal: 'Buy', strength: 79, timeframe: '4h' },
      { asset: 'ADA', signal: 'Hold', strength: 61, timeframe: '4h' }
    ];
  };

  const generateNewsSentiment = () => {
    return [
      { source: 'CryptoNews', title: 'Bitcoin ETF Approval Expected Soon', sentiment: 'Positive', impact: 'High' },
      { source: 'CoinDesk', title: 'Ethereum Upgrade Improves Scalability', sentiment: 'Positive', impact: 'Medium' },
      { source: 'Cointelegraph', title: 'Regulatory Concerns Weigh on Market', sentiment: 'Negative', impact: 'High' },
      { source: 'Decrypt', title: 'DeFi Protocol Exploit Causes Losses', sentiment: 'Negative', impact: 'Medium' }
    ];
  };

  const generateICOCalendar = () => {
    return [
      { project: 'Project Alpha', date: '2023-11-15', status: 'Upcoming', target: '$5M' },
      { project: 'BetaChain', date: '2023-11-22', status: 'Upcoming', target: '$3M' },
      { project: 'GammaFi', date: '2023-11-30', status: 'Live', target: '$8M' },
      { project: 'DeltaSwap', date: '2023-12-05', status: 'Upcoming', target: '$2M' }
    ];
  };

  const generateExchangeComparison = () => {
    return [
      { exchange: 'Binance', volume: '$12.5B', fees: '0.1%', rating: 4.8 },
      { exchange: 'Coinbase', volume: '$3.2B', fees: '0.5%', rating: 4.5 },
      { exchange: 'Kraken', volume: '$1.8B', fees: '0.26%', rating: 4.3 },
      { exchange: 'Bybit', volume: '$8.7B', fees: '0.1%', rating: 4.6 },
      { exchange: 'OKX', volume: '$5.4B', fees: '0.1%', rating: 4.4 }
    ];
  };

  const generateHistoricalData = () => {
    return [
      { year: '2023', price: '$43,250', high: '$45,100', low: '$38,500', volume: '$1.2T' },
      { year: '2022', price: '$37,800', high: '$48,600', low: '$35,200', volume: '$980B' },
      { year: '2021', price: '$41,500', high: '$68,700', low: '$28,800', volume: '$2.3T' },
      { year: '2020', price: '$13,200', high: '$20,700', low: '$3,800', volume: '$720B' }
    ];
  };

  const generateRiskAssessment = () => {
    return [
      { category: 'Market Risk', score: 7.2, level: 'High' },
      { category: 'Liquidity Risk', score: 4.5, level: 'Medium' },
      { category: 'Credit Risk', score: 2.8, level: 'Low' },
      { category: 'Operational Risk', score: 3.1, level: 'Low' },
      { category: 'Regulatory Risk', score: 6.5, level: 'High' }
    ];
  };

  const generateArbitrageOpportunities = () => {
    return [
      { asset: 'BTC', exchange1: 'Binance', exchange2: 'Coinbase', difference: '1.2%', profit: '$420' },
      { asset: 'ETH', exchange1: 'Kraken', exchange2: 'Bybit', difference: '0.8%', profit: '$180' },
      { asset: 'SOL', exchange1: 'OKX', exchange2: 'Binance', difference: '1.5%', profit: '$95' },
      { asset: 'BNB', exchange1: 'Bybit', exchange2: 'Gate.io', difference: '0.9%', profit: '$65' }
    ];
  };

  const generateYieldFarming = () => {
    return [
      { protocol: 'Uniswap', asset: 'ETH/USDT', apr: '12.5%', tvl: '$2.8B' },
      { protocol: 'Curve', asset: '3Pool', apr: '8.2%', tvl: '$1.9B' },
      { protocol: 'Aave', asset: 'USDC', apr: '6.8%', tvl: '$1.5B' },
      { protocol: 'Compound', asset: 'DAI', apr: '5.4%', tvl: '$1.2B' }
    ];
  };

  const generateRegulatoryTracker = () => {
    return [
      { region: 'USA', status: 'Developing Framework', impact: 'Medium' },
      { region: 'EU', status: 'MiCA Implementation', impact: 'High' },
      { region: 'China', status: 'Complete Ban', impact: 'High' },
      { region: 'Japan', status: 'Licensed Framework', impact: 'Low' },
      { region: 'UK', status: 'Regulatory Clarity', impact: 'Medium' }
    ];
  };

  const generateSentimentAnalysis = () => {
    return {
      social: { twitter: 72, reddit: 68, forums: 65 },
      news: { positive: 45, neutral: 35, negative: 20 },
      search: { google: 62, yahoo: 58 }
    };
  };

  const generateAdvancedTechnical = () => {
    return [
      { indicator: 'Ichimoku Cloud', value: 'Bullish', signal: 'Buy' },
      { indicator: 'Elliott Wave', value: 'Wave 3', signal: 'Hold' },
      { indicator: 'Fibonacci Retracement', value: '61.8%', signal: 'Buy' },
      { indicator: 'Gann Angles', value: 'Support', signal: 'Buy' },
      { indicator: 'Harmonic Patterns', value: 'AB=CD', signal: 'Sell' }
    ];
  };

  const generateAssetCorrelation = () => {
    return [
      { asset1: 'BTC', asset2: 'Gold', correlation: -0.12 },
      { asset1: 'BTC', asset2: 'S&P 500', correlation: 0.35 },
      { asset1: 'ETH', asset2: 'Nasdaq', correlation: 0.42 },
      { asset1: 'SOL', asset2: 'Tech Sector', correlation: 0.58 },
      { asset1: 'BNB', asset2: 'Emerging Markets', correlation: 0.28 }
    ];
  };

  const generateLiquidityAnalysis = () => {
    return [
      { exchange: 'Binance', liquidity: '$1.2B', spread: '0.1%' },
      { exchange: 'Coinbase', liquidity: '$850M', spread: '0.2%' },
      { exchange: 'Kraken', liquidity: '$620M', spread: '0.15%' },
      { exchange: 'Bybit', liquidity: '$980M', spread: '0.1%' },
      { exchange: 'OKX', liquidity: '$750M', spread: '0.12%' }
    ];
  };

  const generateNetworkMetrics = () => {
    return [
      { network: 'Bitcoin', tps: 7, latency: '10min', nodes: 12450 },
      { network: 'Ethereum', tps: 15, latency: '12s', nodes: 8750 },
      { network: 'Solana', tps: 2800, latency: '400ms', nodes: 1980 },
      { network: 'Polygon', tps: 7200, latency: '2s', nodes: 3200 }
    ];
  };

  const generateOptionsAnalysis = () => {
    return [
      { asset: 'BTC', type: 'Call', strike: '$45,000', expiry: '2023-12-15', iv: '42.5%' },
      { asset: 'ETH', type: 'Put', strike: '$3,200', expiry: '2023-12-15', iv: '58.2%' },
      { asset: 'SOL', type: 'Call', strike: '$95', expiry: '2023-12-15', iv: '65.8%' }
    ];
  };

  const generateDerivativesInsights = () => {
    return [
      { instrument: 'BTC Futures', openInterest: '$8.2B', funding: '0.00015' },
      { instrument: 'ETH Perps', openInterest: '$4.7B', funding: '0.00021' },
      { instrument: 'SOL Options', openInterest: '$1.3B', funding: '0.00008' }
    ];
  };

  const generateAdvancedOnChain = () => {
    return [
      { metric: 'NVT Ratio', value: 28.5, status: 'Normal' },
      { metric: 'MVRV Ratio', value: 1.8, status: 'Overvalued' },
      { metric: 'Realized Cap', value: '$890B', status: 'Growing' },
      { metric: 'Exchange Net Flow', value: '-$245M', status: 'Accumulation' }
    ];
  };

  const generateMarketMicrostructure = () => {
    return [
      { aspect: 'Order Book Depth', value: 'High', impact: 'Low Slippage' },
      { aspect: 'Trade Size Distribution', value: 'Retail Dominated', impact: 'Volatile' },
      { aspect: 'Market Maker Activity', value: 'Active', impact: 'Liquidity' },
      { aspect: 'Quote Frequency', value: 'High', impact: 'Efficiency' }
    ];
  };

  const generateEconomicIndicators = () => {
    return [
      { indicator: 'Inflation Rate', value: '3.2%', impact: 'Bearish' },
      { indicator: 'Interest Rates', value: '5.5%', impact: 'Bearish' },
      { indicator: 'Unemployment', value: '3.8%', impact: 'Bullish' },
      { indicator: 'GDP Growth', value: '2.1%', impact: 'Neutral' }
    ];
  };

  const generateBehavioralAnalytics = () => {
    return [
      { pattern: 'FOMO Buying', frequency: 'High', impact: 'Short-term Bullish' },
      { pattern: 'FUD Selling', frequency: 'Medium', impact: 'Short-term Bearish' },
      { pattern: 'HODLing', frequency: 'High', impact: 'Long-term Bullish' },
      { pattern: 'Panic Selling', frequency: 'Low', impact: 'Very Short-term Bearish' }
    ];
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

  // Render Volatility Analysis
  const renderVolatilityAnalysis = () => {
    const volatilityData = generateVolatilityData();
    return (
      <div className="space-y-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Volatility Analysis</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 text-slate-400 font-medium">Asset</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Volatility (%)</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Std Deviation</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Period</th>
                </tr>
              </thead>
              <tbody>
                {volatilityData.map((item, index) => (
                  <tr key={index} className="border-b border-slate-800/50 hover:bg-slate-700/30">
                    <td className="py-4 font-medium text-white">{item.asset}</td>
                    <td className="text-right py-4 text-green-400">{item.volatility}%</td>
                    <td className="text-right py-4 text-slate-300">{item.stdDev}%</td>
                    <td className="text-right py-4 text-slate-400">{item.period}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Volatility Distribution</h3>
          <BarChart data={volatilityData.map(item => ({ 
            label: item.asset, 
            value: item.volatility 
          }))} height={150} />
        </div>
      </div>
    );
  };

  // Render Correlation Matrix
  const renderCorrelationMatrix = () => {
    const correlationData = generateCorrelationData();
    return (
      <div className="space-y-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Correlation Matrix</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 text-slate-400 font-medium">Asset Pair</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Correlation</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Strength</th>
                </tr>
              </thead>
              <tbody>
                {correlationData.map((item, index) => (
                  <tr key={index} className="border-b border-slate-800/50 hover:bg-slate-700/30">
                    <td className="py-4 font-medium text-white">{item.asset1} / {item.asset2}</td>
                    <td className="text-right py-4 text-green-400">{item.correlation}</td>
                    <td className="text-right py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.correlation > 0.7 ? 'bg-green-900/50 text-green-300' :
                        item.correlation > 0.5 ? 'bg-yellow-900/50 text-yellow-300' :
                        'bg-slate-900/50 text-slate-300'
                      }`}>
                        {item.correlation > 0.7 ? 'Strong' : item.correlation > 0.5 ? 'Moderate' : 'Weak'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Correlation Heatmap</h3>
          <div className="grid grid-cols-5 gap-2">
            {['BTC', 'ETH', 'SOL', 'BNB', 'ADA'].map((asset1, i) => (
              ['BTC', 'ETH', 'SOL', 'BNB', 'ADA'].map((asset2, j) => (
                <div 
                  key={`${i}-${j}`} 
                  className={`flex items-center justify-center h-12 rounded ${
                    i === j ? 'bg-brand-neon/20 text-brand-neon' :
                    i < j ? 'bg-slate-700/50 text-slate-300' :
                    Math.random() > 0.5 ? 'bg-green-900/50 text-green-300' : 'bg-yellow-900/50 text-yellow-300'
                  }`}
                >
                  {i === j ? '1.0' : (Math.random() * 0.8 + 0.2).toFixed(2)}
                </div>
              ))
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render Market Cycle
  const renderMarketCycle = () => {
    const cycleData = generateMarketCycleData();
    return (
      <div className="space-y-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Market Cycle Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-900/50 to-blue-700/30 border border-blue-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-blue-300 mb-2">Current Phase</h4>
              <p className="text-3xl font-bold text-white">{cycleData.phase}</p>
              <div className="mt-2">
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-brand-neon h-2 rounded-full" 
                    style={{ width: `${cycleData.confidence}%` }}
                  ></div>
                </div>
                <div className="text-sm text-slate-400 mt-1">Confidence: {cycleData.confidence}%</div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-900/50 to-purple-700/30 border border-purple-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-purple-300 mb-4">Key Indicators</h4>
              <div className="space-y-3">
                {cycleData.indicators.map((indicator, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-slate-300">{indicator.name}</span>
                    <span className={`font-medium ${
                      indicator.status === 'Bullish' ? 'text-green-400' : 'text-slate-400'
                    }`}>
                      {indicator.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Market Sentiment Distribution</h3>
          <PieChart data={[
            { name: 'Bullish', value: 45, color: '#10B981' },
            { name: 'Neutral', value: 30, color: '#F59E0B' },
            { name: 'Bearish', value: 25, color: '#EF4444' }
          ]} />
        </div>
      </div>
    );
  };

  // Render On-Chain Analytics
  const renderOnChainAnalytics = () => {
    const onChainData = generateOnChainData();
    return (
      <div className="space-y-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">On-Chain Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {onChainData.map((item, index) => (
              <div key={index} className="bg-slate-700/50 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">{item.metric}</div>
                <div className="text-xl font-bold text-white">{item.value}</div>
                <div className={`text-sm mt-1 ${item.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                  {item.change}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Network Activity Trend</h3>
          <LineChart data={generateChartData('volume', 14)} height={150} />
        </div>
      </div>
    );
  };

  // Render Whale Activity
  const renderWhaleActivity = () => {
    const whaleData = generateWhaleActivityData();
    return (
      <div className="space-y-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Whale Activity Tracking</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 text-slate-400 font-medium">Asset</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Transactions</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Volume</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Whale Wallets</th>
                </tr>
              </thead>
              <tbody>
                {whaleData.map((item, index) => (
                  <tr key={index} className="border-b border-slate-800/50 hover:bg-slate-700/30">
                    <td className="py-4 font-medium text-white">{item.asset}</td>
                    <td className="text-right py-4 text-slate-300">{item.transactions}</td>
                    <td className="text-right py-4 text-green-400">{item.volume}</td>
                    <td className="text-right py-4 text-slate-300">{item.wallets}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Whale Transaction Volume</h3>
          <BarChart data={whaleData.map(item => ({ 
            label: item.asset, 
            value: parseFloat(item.volume.replace(/[^0-9.-]+/g,"")) 
          }))} height={150} />
        </div>
      </div>
    );
  };

  // Render Stablecoin Analysis
  const renderStablecoinAnalysis = () => {
    const stablecoinData = generateStablecoinData();
    return (
      <div className="space-y-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Stablecoin Analysis</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 text-slate-400 font-medium">Stablecoin</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Market Cap</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Peg Status</th>
                  <th className="text-right py-3 text-slate-400 font-medium">24h Change</th>
                </tr>
              </thead>
              <tbody>
                {stablecoinData.map((item, index) => (
                  <tr key={index} className="border-b border-slate-800/50 hover:bg-slate-700/30">
                    <td className="py-4 font-medium text-white">{item.name}</td>
                    <td className="text-right py-4 text-slate-300">{item.marketCap}</td>
                    <td className="text-right py-4 text-green-400">{item.peg}</td>
                    <td className={`text-right py-4 ${item.change.startsWith('+') ? 'text-green-400' : item.change.startsWith('-') ? 'text-red-400' : 'text-slate-400'}`}>
                      {item.change}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Stablecoin Market Share</h3>
          <PieChart data={[
            { name: 'USDT', value: 82, color: '#26A17B' },
            { name: 'USDC', value: 32, color: '#2775CA' },
            { name: 'DAI', value: 5, color: '#F5AC37' },
            { name: 'BUSD', value: 3, color: '#F0B90B' },
            { name: 'Others', value: 8, color: '#10B981' }
          ]} />
        </div>
      </div>
    );
  };

  // Render DeFi Metrics
  const renderDeFiMetrics = () => {
    const defiData = generateDeFiMetrics();
    return (
      <div className="space-y-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">DeFi Metrics</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 text-slate-400 font-medium">Protocol</th>
                  <th className="text-right py-3 text-slate-400 font-medium">TVL</th>
                  <th className="text-right py-3 text-slate-400 font-medium">24h Change</th>
                  <th className="text-right py-3 text-slate-400 font-medium">7d Change</th>
                </tr>
              </thead>
              <tbody>
                {defiData.map((protocol, index) => (
                  <tr key={index} className="border-b border-slate-800/50 hover:bg-slate-700/30">
                    <td className="py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-neon/20 to-green-500/20 flex items-center justify-center mr-3">
                          <span className="text-xs font-bold text-brand-neon">{protocol.symbol?.charAt(0) || 'D'}</span>
                        </div>
                        <div>
                          <div className="font-medium text-white">{protocol.name || 'N/A'}</div>
                          <div className="text-sm text-slate-400">{protocol.category || 'Protocol'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-right py-4 text-white font-medium">
                      {protocol.tvl}
                    </td>
                    <td className={`text-right py-4 font-medium ${protocol.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatPercent(protocol.change24h)}
                    </td>
                    <td className={`text-right py-4 font-medium ${protocol.change7d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatPercent(protocol.change7d)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Yield Opportunities Section */}
          <div className="mt-8">
            <h4 className="text-lg font-semibold text-white mb-4">Top Yield Opportunities</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { token: 'USDC', protocol: 'Aave', apr: '4.2%', tvl: '$1.2B' },
                { token: 'ETH', protocol: 'Compound', apr: '2.8%', tvl: '$800M' },
                { token: 'DAI', protocol: 'MakerDAO', apr: '3.5%', tvl: '$600M' }
              ].map((yieldOp, index) => (
                <div key={index} className="bg-slate-700/50 border border-slate-600/50 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-white">{yieldOp.token}</div>
                      <div className="text-sm text-slate-400">{yieldOp.protocol}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-brand-neon">{yieldOp.apr}</div>
                      <div className="text-xs text-slate-400">APR</div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">TVL: {yieldOp.tvl}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Mining Metrics
  const renderMiningMetrics = () => {
    const miningData = generateMiningMetrics();
    return (
      <div className="space-y-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Mining Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-900/50 to-blue-700/30 border border-blue-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-blue-300 mb-2">Network Hashrate</h4>
              <p className="text-3xl font-bold text-white">{miningData.hashRate}</p>
              <div className="mt-2 text-sm text-blue-200">Current network hashrate</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-900/50 to-purple-700/30 border border-purple-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-purple-300 mb-2">Mining Difficulty</h4>
              <p className="text-3xl font-bold text-white">{miningData.difficulty}</p>
              <div className="mt-2 text-sm text-purple-200">Current mining difficulty</div>
            </div>
          </div>
          
          <div className="bg-slate-700/30 rounded-xl p-6 mt-6">
            <h4 className="text-lg font-semibold text-white mb-4">Mining Pool Distribution</h4>
            <div className="space-y-4">
              {miningData.distribution.map((pool, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-300">{pool.pool}</span>
                    <span className="text-white font-medium">{pool.share}%</span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-brand-neon to-green-500 h-2 rounded-full" 
                      style={{ width: `${pool.share}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Order Book Depth
  const renderOrderBookDepth = () => {
    const orderBookData = generateOrderBookData();
    
    // Calculate cumulative amounts for depth chart
    const bids = [...orderBookData.bids].sort((a, b) => b.price - a.price);
    const asks = [...orderBookData.asks].sort((a, b) => a.price - b.price);
    
    let cumulativeBid = 0;
    const bidDepth = bids.map(bid => {
      cumulativeBid += bid.amount;
      return { price: bid.price, amount: bid.amount, cumulative: cumulativeBid };
    });
    
    let cumulativeAsk = 0;
    const askDepth = asks.map(ask => {
      cumulativeAsk += ask.amount;
      return { price: ask.price, amount: ask.amount, cumulative: cumulativeAsk };
    });
    
    // Find min and max prices for chart
    const minPrice = Math.min(...bids.map(b => b.price), ...asks.map(a => a.price));
    const maxPrice = Math.max(...bids.map(b => b.price), ...asks.map(a => a.price));
    const priceRange = maxPrice - minPrice;
    
    // Find max cumulative for chart scaling
    const maxCumulative = Math.max(...bidDepth.map(b => b.cumulative), ...askDepth.map(a => a.cumulative));
    
    return (
      <div className="space-y-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Order Book Depth</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="overflow-x-auto">
              <h4 className="text-lg font-semibold text-green-400 mb-4">Bids (Buy Orders)</h4>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 text-slate-400 font-medium">Price (USD)</th>
                    <th className="text-right py-2 text-slate-400 font-medium">Amount (BTC)</th>
                    <th className="text-right py-2 text-slate-400 font-medium">Total (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  {bids.map((bid, index) => (
                    <tr key={index} className="border-b border-slate-800/50 hover:bg-slate-700/30">
                      <td className="py-2 text-green-400">${bid.price.toLocaleString()}</td>
                      <td className="text-right py-2 text-slate-300">{bid.amount}</td>
                      <td className="text-right py-2 text-slate-300">${(bid.price * bid.amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="overflow-x-auto">
              <h4 className="text-lg font-semibold text-red-400 mb-4">Asks (Sell Orders)</h4>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 text-slate-400 font-medium">Price (USD)</th>
                    <th className="text-right py-2 text-slate-400 font-medium">Amount (BTC)</th>
                    <th className="text-right py-2 text-slate-400 font-medium">Total (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  {asks.map((ask, index) => (
                    <tr key={index} className="border-b border-slate-800/50 hover:bg-slate-700/30">
                      <td className="py-2 text-red-400">${ask.price.toLocaleString()}</td>
                      <td className="text-right py-2 text-slate-300">{ask.amount}</td>
                      <td className="text-right py-2 text-slate-300">${(ask.price * ask.amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-8">
            <h4 className="text-lg font-semibold text-white mb-4">Market Depth Chart</h4>
            <div className="h-64 relative">
              <svg viewBox="0 0 800 200" className="w-full h-full">
                {/* Bids (green) */}
                <polygon
                  fill="url(#bidGradient)"
                  fillOpacity="0.6"
                  points={`0,200 ${bidDepth.map((bid, i) => {
                    const x = 400 - ((maxPrice - bid.price) / priceRange) * 400;
                    const y = 200 - (bid.cumulative / maxCumulative) * 180;
                    return `${x},${y}`;
                  }).join(' ')} 400,200`}
                />
                
                {/* Asks (red) */}
                <polygon
                  fill="url(#askGradient)"
                  fillOpacity="0.6"
                  points={`400,200 ${askDepth.map((ask, i) => {
                    const x = 400 + ((ask.price - minPrice) / priceRange) * 400;
                    const y = 200 - (ask.cumulative / maxCumulative) * 180;
                    return `${x},${y}`;
                  }).join(' ')} 800,200`}
                />
                
                <defs>
                  <linearGradient id="bidGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="askGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#EF4444" />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
                  </linearGradient>
                </defs>
                
                {/* Center line */}
                <line x1="400" y1="0" x2="400" y2="200" stroke="#64748B" strokeWidth="1" strokeDasharray="4" />
              </svg>
              
              <div className="flex justify-between text-xs text-slate-400 mt-2">
                <span>Bids</span>
                <span>Current Price</span>
                <span>Asks</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Funding Rates
  const renderFundingRates = () => {
    const fundingData = generateFundingRates();
    return (
      <div className="space-y-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Funding Rates Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 text-slate-400 font-medium">Exchange</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Funding Rate</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Annualized</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {fundingData.map((item, index) => (
                  <tr key={index} className="border-b border-slate-800/50 hover:bg-slate-700/30">
                    <td className="py-4 font-medium text-white">{item.exchange}</td>
                    <td className={`text-right py-4 ${item.rate > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {(item.rate * 100).toFixed(4)}%
                    </td>
                    <td className={`text-right py-4 ${item.annualized > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {item.annualized.toFixed(2)}%
                    </td>
                    <td className="text-right py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.rate > 0.0001 ? 'bg-red-900/50 text-red-300' :
                        item.rate < -0.0001 ? 'bg-green-900/50 text-green-300' :
                        'bg-slate-900/50 text-slate-300'
                      }`}>
                        {item.rate > 0.0001 ? 'Positive' : item.rate < -0.0001 ? 'Negative' : 'Neutral'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Funding Rate Distribution</h3>
          <BarChart data={fundingData.map(item => ({ 
            label: item.exchange.substring(0, 4), 
            value: Math.abs(item.rate * 10000) 
          }))} height={150} />
        </div>
      </div>
    );
  };

  // Render Portfolio Tracker
  const renderPortfolioTracker = () => {
    const portfolioData = generatePortfolioData();
    return (
      <div className="space-y-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Portfolio Tracker</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-900/50 to-blue-700/30 border border-blue-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-blue-300 mb-2">Total Portfolio Value</h4>
              <p className="text-3xl font-bold text-white">{portfolioData.totalValue}</p>
              <div className={`mt-2 text-sm ${portfolioData.change24h.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                24h Change: {portfolioData.change24h}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-900/50 to-purple-700/30 border border-purple-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-purple-300 mb-2">Portfolio Risk Metrics</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-300">Sharpe Ratio</span>
                  <span className="text-white">{portfolioData.riskMetrics.sharpe}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Volatility</span>
                  <span className="text-white">{portfolioData.riskMetrics.volatility}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Max Drawdown</span>
                  <span className="text-white">{portfolioData.riskMetrics.maxDrawdown}%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-700/30 rounded-xl p-6 mt-6">
            <h4 className="text-lg font-semibold text-white mb-4">Asset Allocation</h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <PieChart data={portfolioData.allocation.map((item, index) => ({
                  name: item.asset,
                  value: parseFloat(item.value.replace(/[^0-9.-]+/g, "")),
                  color: [
                    '#F7931A', // Bitcoin orange
                    '#627EEA', // Ethereum blue
                    '#14F195', // Solana green
                    '#26A17B', // Tether green
                    '#10B981'  // Others green
                  ][index]
                }))} />
              </div>
              <div>
                <div className="space-y-3">
                  {portfolioData.allocation.map((item, index) => (
                    <div key={index}>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-300">{item.asset}</span>
                        <span className="text-white font-medium">{item.percentage}%</span>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-brand-neon to-green-500 h-2 rounded-full" 
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-right text-sm text-slate-400 mt-1">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Trading Signals
  const renderTradingSignals = () => {
    const signalsData = generateTradingSignals();
    return (
      <div className="space-y-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Trading Signals</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 text-slate-400 font-medium">Asset</th>
                  <th className="text-center py-3 text-slate-400 font-medium">Signal</th>
                  <th className="text-center py-3 text-slate-400 font-medium">Strength</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Timeframe</th>
                </tr>
              </thead>
              <tbody>
                {signalsData.map((signal, index) => (
                  <tr key={index} className="border-b border-slate-800/50 hover:bg-slate-700/30">
                    <td className="py-4 font-medium text-white">{signal.asset}</td>
                    <td className="text-center py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        signal.signal === 'Buy' ? 'bg-green-900/50 text-green-300' :
                        signal.signal === 'Sell' ? 'bg-red-900/50 text-red-300' :
                        'bg-slate-900/50 text-slate-300'
                      }`}>
                        {signal.signal}
                      </span>
                    </td>
                    <td className="text-center py-4">
                      <div className="flex items-center justify-center">
                        <div className="w-24 bg-slate-700 rounded-full h-2 mr-2">
                          <div 
                            className={`h-2 rounded-full ${
                              signal.strength > 80 ? 'bg-green-500' :
                              signal.strength > 60 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`} 
                            style={{ width: `${signal.strength}%` }}
                          ></div>
                        </div>
                        <span className="text-slate-300 text-sm">{signal.strength}%</span>
                      </div>
                    </td>
                    <td className="text-right py-4 text-slate-400">{signal.timeframe}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Signal Strength Distribution</h3>
          <BarChart data={signalsData.map(signal => ({ 
            label: signal.asset, 
            value: signal.strength 
          }))} height={150} />
        </div>
      </div>
    );
  };

  // Render News & Sentiment
  const renderNewsSentiment = () => {
    const sentimentData = generateNewsSentiment();
    
    // Calculate overall sentiment score
    const positiveCount = sentimentData.filter(item => item.sentiment === 'Positive').length;
    const negativeCount = sentimentData.filter(item => item.sentiment === 'Negative').length;
    const neutralCount = sentimentData.filter(item => item.sentiment === 'Neutral').length;
    const total = sentimentData.length;
    
    const sentimentScore = total > 0 ? 
      ((positiveCount - negativeCount) / total) * 100 : 0;
    
    return (
      <div className="space-y-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">News & Sentiment Analysis</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-900/50 to-blue-700/30 border border-blue-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-blue-300 mb-2">Sentiment Score</h4>
              <p className="text-3xl font-bold text-white">
                {sentimentScore >= 0 ? '+' : ''}{sentimentScore.toFixed(1)}
              </p>
              <div className="mt-2">
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${sentimentScore >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.abs(sentimentScore)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>Negative</span>
                  <span>Positive</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-900/50 to-purple-700/30 border border-purple-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-purple-300 mb-2">News Sources</h4>
              <p className="text-3xl font-bold text-white">{total}</p>
              <div className="mt-2 text-sm text-purple-200">Active sources monitored</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-900/50 to-green-700/30 border border-green-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-green-300 mb-2">Market Impact</h4>
              <p className="text-3xl font-bold text-white">
                {((positiveCount * 2 + neutralCount - negativeCount * 2) / total * 10).toFixed(1)}
              </p>
              <div className="mt-2 text-sm text-green-200">Weighted impact score</div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <h4 className="text-lg font-semibold text-white mb-4">Latest News</h4>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 text-slate-400 font-medium">Source</th>
                  <th className="text-left py-3 text-slate-400 font-medium">Title</th>
                  <th className="text-center py-3 text-slate-400 font-medium">Sentiment</th>
                  <th className="text-center py-3 text-slate-400 font-medium">Impact</th>
                </tr>
              </thead>
              <tbody>
                {sentimentData.map((item, index) => (
                  <tr key={index} className="border-b border-slate-800/50 hover:bg-slate-700/30">
                    <td className="py-4 font-medium text-white">{item.source}</td>
                    <td className="py-4 text-slate-300 max-w-md">{item.title}</td>
                    <td className="text-center py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.sentiment === 'Positive' ? 'bg-green-900/50 text-green-300' :
                        item.sentiment === 'Negative' ? 'bg-red-900/50 text-red-300' :
                        'bg-slate-900/50 text-slate-300'
                      }`}>
                        {item.sentiment}
                      </span>
                    </td>
                    <td className="text-center py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.impact === 'High' ? 'bg-red-900/50 text-red-300' :
                        item.impact === 'Medium' ? 'bg-yellow-900/50 text-yellow-300' :
                        'bg-green-900/50 text-green-300'
                      }`}>
                        {item.impact}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Sentiment Distribution</h3>
          <div className="flex justify-center space-x-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">{positiveCount}</div>
              <div className="text-slate-400">Positive</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-400">{neutralCount}</div>
              <div className="text-slate-400">Neutral</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-400">{negativeCount}</div>
              <div className="text-slate-400">Negative</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render ICO Calendar
  const renderICOCalendar = () => {
    const icoData = generateICOCalendar();
    
    // Group by status
    const upcoming = icoData.filter(ico => ico.status === 'Upcoming');
    const live = icoData.filter(ico => ico.status === 'Live');
    const completed = icoData.filter(ico => ico.status === 'Completed');
    
    return (
      <div className="space-y-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">ICO Calendar</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-900/50 to-blue-700/30 border border-blue-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-blue-300 mb-2">Upcoming</h4>
              <p className="text-3xl font-bold text-white">{upcoming.length}</p>
              <div className="mt-2 text-sm text-blue-200">Projects</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-900/50 to-green-700/30 border border-green-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-green-300 mb-2">Live</h4>
              <p className="text-3xl font-bold text-white">{live.length}</p>
              <div className="mt-2 text-sm text-green-200">Active sales</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-900/50 to-purple-700/30 border border-purple-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-purple-300 mb-2">Total</h4>
              <p className="text-3xl font-bold text-white">{icoData.length}</p>
              <div className="mt-2 text-sm text-purple-200">Projects tracked</div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <h4 className="text-lg font-semibold text-white mb-4">Upcoming & Live ICOs</h4>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 text-slate-400 font-medium">Project</th>
                  <th className="text-center py-3 text-slate-400 font-medium">Status</th>
                  <th className="text-center py-3 text-slate-400 font-medium">Date</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Target</th>
                </tr>
              </thead>
              <tbody>
                {icoData.map((ico, index) => (
                  <tr key={index} className="border-b border-slate-800/50 hover:bg-slate-700/30">
                    <td className="py-4 font-medium text-white">{ico.project}</td>
                    <td className="text-center py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        ico.status === 'Live' ? 'bg-green-900/50 text-green-300' :
                        ico.status === 'Upcoming' ? 'bg-blue-900/50 text-blue-300' :
                        'bg-slate-900/50 text-slate-300'
                      }`}>
                        {ico.status}
                      </span>
                    </td>
                    <td className="text-center py-4 text-slate-300">{ico.date}</td>
                    <td className="text-right py-4 text-slate-300">{ico.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">ICO Timeline</h3>
          <div className="space-y-4">
            {icoData.map((ico, index) => (
              <div key={index} className="flex items-center">
                <div className="flex-shrink-0 w-3 h-3 rounded-full bg-brand-neon mr-4"></div>
                <div className="flex-grow">
                  <div className="flex justify-between">
                    <span className="font-medium text-white">{ico.project}</span>
                    <span className="text-slate-400 text-sm">{ico.date}</span>
                  </div>
                  <div className="text-sm text-slate-400">Target: {ico.target}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render Exchange Comparison
  const renderExchangeComparison = () => {
    const exchangeData = generateExchangeComparison();
    
    // Sort by volume
    const sortedExchanges = [...exchangeData].sort((a, b) => 
      parseFloat(b.volume.replace(/[^0-9.-]+/g, "")) - parseFloat(a.volume.replace(/[^0-9.-]+/g, ""))
    );
    
    return (
      <div className="space-y-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Exchange Comparison</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 text-slate-400 font-medium">Exchange</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Trading Volume</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Fees</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Rating</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Market Share</th>
                </tr>
              </thead>
              <tbody>
                {sortedExchanges.map((exchange, index) => (
                  <tr key={index} className="border-b border-slate-800/50 hover:bg-slate-700/30">
                    <td className="py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-neon/20 to-green-500/20 flex items-center justify-center mr-3">
                          <span className="text-xs font-bold text-brand-neon">{exchange.exchange.charAt(0)}</span>
                        </div>
                        <div className="font-medium text-white">{exchange.exchange}</div>
                      </div>
                    </td>
                    <td className="text-right py-4 text-slate-300">{exchange.volume}</td>
                    <td className="text-right py-4 text-slate-300">{exchange.fees}</td>
                    <td className="text-right py-4">
                      <div className="flex items-center justify-end">
                        <span className="text-slate-300 mr-2">{exchange.rating}</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <svg 
                              key={i} 
                              className={`w-4 h-4 ${i < Math.floor(exchange.rating) ? 'text-yellow-400' : 'text-slate-600'}`} 
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="text-right py-4">
                      <div className="flex items-center justify-end">
                        <span className="text-slate-300 mr-2">
                          {((parseFloat(exchange.volume.replace(/[^0-9.-]+/g, "")) / 
                          sortedExchanges.reduce((sum, ex) => sum + parseFloat(ex.volume.replace(/[^0-9.-]+/g, "")), 0)) * 100).toFixed(1)}%
                        </span>
                        <div className="w-24 bg-slate-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-brand-neon to-green-500 h-2 rounded-full" 
                            style={{ 
                              width: `${(parseFloat(exchange.volume.replace(/[^0-9.-]+/g, "")) / 
                              sortedExchanges.reduce((sum, ex) => sum + parseFloat(ex.volume.replace(/[^0-9.-]+/g, "")), 0)) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Volume Distribution</h3>
            <PieChart data={sortedExchanges.map((exchange, index) => ({
              name: exchange.exchange,
              value: parseFloat(exchange.volume.replace(/[^0-9.-]+/g, "")),
              color: [
                '#F7931A', // Orange
                '#627EEA', // Blue
                '#14F195', // Green
                '#F0B90B', // Yellow
                '#26A17B'  // Teal
              ][index % 5]
            }))} />
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Fee Comparison</h3>
            <BarChart data={sortedExchanges.map(exchange => ({ 
              label: exchange.exchange.substring(0, 4), 
              value: parseFloat(exchange.fees) * 100 
            }))} height={150} />
          </div>
        </div>
      </div>
    );
  };

  // Render Historical Data
  const renderHistoricalData = () => {
    const historicalData = generateHistoricalData();
    
    // Calculate price changes
    const priceChanges = historicalData.map((year, index) => {
      if (index === 0) return { ...year, change: 0 };
      const prevPrice = parseFloat(historicalData[index - 1].price.replace(/[^0-9.-]+/g, ""));
      const currentPrice = parseFloat(year.price.replace(/[^0-9.-]+/g, ""));
      const change = ((currentPrice - prevPrice) / prevPrice) * 100;
      return { ...year, change };
    });
    
    return (
      <div className="space-y-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Historical Data</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 text-slate-400 font-medium">Year</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Avg Price</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Yearly Change</th>
                  <th className="text-right py-3 text-slate-400 font-medium">High</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Low</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Volume</th>
                </tr>
              </thead>
              <tbody>
                {priceChanges.map((year, index) => (
                  <tr key={index} className="border-b border-slate-800/50 hover:bg-slate-700/30">
                    <td className="py-4 font-medium text-white">{year.year}</td>
                    <td className="text-right py-4 text-slate-300">{year.price}</td>
                    <td className={`text-right py-4 font-medium ${index === 0 ? 'text-slate-400' : year.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {index === 0 ? 'N/A' : `${year.change >= 0 ? '+' : ''}${year.change.toFixed(2)}%`}
                    </td>
                    <td className="text-right py-4 text-slate-300">{year.high}</td>
                    <td className="text-right py-4 text-slate-300">{year.low}</td>
                    <td className="text-right py-4 text-slate-300">{year.volume}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Price History</h3>
            <LineChart data={historicalData.map(year => ({ 
              label: year.year, 
              value: parseFloat(year.price.replace(/[^0-9.-]+/g, "")) 
            }))} height={200} />
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Volume Trend</h3>
            <BarChart data={historicalData.map(year => ({ 
              label: year.year, 
              value: parseFloat(year.volume.replace(/[^0-9.-]+/g, "")) 
            }))} height={200} />
          </div>
        </div>
      </div>
    );
  };

  // Render Risk Assessment
  const renderRiskAssessment = () => {
    const riskData = generateRiskAssessment();
    
    // Calculate overall risk score
    const totalScore = riskData.reduce((sum, item) => sum + item.score, 0);
    const averageScore = totalScore / riskData.length;
    
    return (
      <div className="space-y-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Risk Assessment</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-900/50 to-blue-700/30 border border-blue-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-blue-300 mb-2">Overall Risk Score</h4>
              <p className="text-3xl font-bold text-white">{averageScore.toFixed(1)}/10</p>
              <div className="mt-2">
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${averageScore > 7 ? 'bg-red-500' : averageScore > 4 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${(averageScore / 10) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-900/50 to-purple-700/30 border border-purple-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-purple-300 mb-2">Risk Categories</h4>
              <p className="text-3xl font-bold text-white">{riskData.length}</p>
              <div className="mt-2 text-sm text-purple-200">Assessed areas</div>
            </div>
            
            <div className="bg-gradient-to-br from-red-900/50 to-red-700/30 border border-red-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-red-300 mb-2">High Risk Areas</h4>
              <p className="text-3xl font-bold text-white">
                {riskData.filter(item => item.score > 7).length}
              </p>
              <div className="mt-2 text-sm text-red-200">Require attention</div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <h4 className="text-lg font-semibold text-white mb-4">Risk Categories Breakdown</h4>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 text-slate-400 font-medium">Category</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Score</th>
                  <th className="text-center py-3 text-slate-400 font-medium">Level</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {riskData.map((risk, index) => (
                  <tr key={index} className="border-b border-slate-800/50 hover:bg-slate-700/30">
                    <td className="py-4 font-medium text-white">{risk.category}</td>
                    <td className="text-right py-4 text-slate-300">{risk.score.toFixed(1)}/10</td>
                    <td className="text-center py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        risk.level === 'High' ? 'bg-red-900/50 text-red-300' :
                        risk.level === 'Medium' ? 'bg-yellow-900/50 text-yellow-300' :
                        'bg-green-900/50 text-green-300'
                      }`}>
                        {risk.level}
                      </span>
                    </td>
                    <td className="text-right py-4 text-slate-300">
                      {risk.level === 'High' ? 'Immediate action required' :
                       risk.level === 'Medium' ? 'Monitor closely' :
                       'Low concern'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Risk Distribution</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <BarChart data={riskData.map(risk => ({ 
                label: risk.category.split(' ')[0], 
                value: risk.score 
              }))} height={200} />
            </div>
            <div>
              <PieChart data={riskData.map((risk, index) => ({
                name: risk.category,
                value: risk.score,
                color: [
                  '#EF4444', // Red
                  '#F59E0B', // Yellow
                  '#10B981', // Green
                  '#3B82F6', // Blue
                  '#8B5CF6'  // Purple
                ][index % 5]
              }))} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Arbitrage Opportunities
  const renderArbitrageOpportunities = () => {
    const arbitrageData = generateArbitrageOpportunities();
    
    // Calculate total potential profit
    const totalProfit = arbitrageData.reduce((sum, item) => sum + parseFloat(item.profit.replace(/[^0-9.-]+/g, "")), 0);
    
    return (
      <div className="space-y-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Arbitrage Opportunities</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-900/50 to-blue-700/30 border border-blue-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-blue-300 mb-2">Opportunities Found</h4>
              <p className="text-3xl font-bold text-white">{arbitrageData.length}</p>
              <div className="mt-2 text-sm text-blue-200">Active arbitrage pairs</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-900/50 to-green-700/30 border border-green-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-green-300 mb-2">Total Potential Profit</h4>
              <p className="text-3xl font-bold text-white">${totalProfit.toLocaleString()}</p>
              <div className="mt-2 text-sm text-green-200">Across all opportunities</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-900/50 to-purple-700/30 border border-purple-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-purple-300 mb-2">Avg. Difference</h4>
              <p className="text-3xl font-bold text-white">
                {(arbitrageData.reduce((sum, item) => sum + item.difference, 0) / arbitrageData.length).toFixed(2)}%
              </p>
              <div className="mt-2 text-sm text-purple-200">Average price difference</div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <h4 className="text-lg font-semibold text-white mb-4">Current Arbitrage Opportunities</h4>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 text-slate-400 font-medium">Asset</th>
                  <th className="text-left py-3 text-slate-400 font-medium">Exchange 1</th>
                  <th className="text-left py-3 text-slate-400 font-medium">Exchange 2</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Price Difference</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Potential Profit</th>
                </tr>
              </thead>
              <tbody>
                {arbitrageData.map((opportunity, index) => (
                  <tr key={index} className="border-b border-slate-800/50 hover:bg-slate-700/30">
                    <td className="py-4 font-medium text-white">{opportunity.asset}</td>
                    <td className="py-4 text-slate-300">{opportunity.exchange1}</td>
                    <td className="py-4 text-slate-300">{opportunity.exchange2}</td>
                    <td className="text-right py-4 text-green-400">{opportunity.difference}%</td>
                    <td className="text-right py-4 text-slate-300">{opportunity.profit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Price Difference Distribution</h3>
            <BarChart data={arbitrageData.map(opportunity => ({ 
              label: opportunity.asset, 
              value: opportunity.difference 
            }))} height={150} />
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Profit Potential</h3>
            <BarChart data={arbitrageData.map(opportunity => ({ 
              label: opportunity.asset, 
              value: parseFloat(opportunity.profit.replace(/[^0-9.-]+/g, "")) 
            }))} height={150} />
          </div>
        </div>
      </div>
    );
  };

  // Render Yield Farming
  const renderYieldFarming = () => {
    const yieldData = generateYieldFarming();
    
    // Calculate total TVL
    const totalTvl = yieldData.reduce((sum, item) => sum + parseFloat(item.tvl.replace(/[^0-9.-]+/g, "")), 0);
    
    return (
      <div className="space-y-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Yield Farming Opportunities</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-900/50 to-blue-700/30 border border-blue-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-blue-300 mb-2">Total Value Locked</h4>
              <p className="text-3xl font-bold text-white">${formatCurrency(totalTvl)}</p>
              <div className="mt-2 text-sm text-blue-200">Across all protocols</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-900/50 to-green-700/30 border border-green-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-green-300 mb-2">Opportunities</h4>
              <p className="text-3xl font-bold text-white">{yieldData.length}</p>
              <div className="mt-2 text-sm text-green-200">Active farming pools</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-900/50 to-purple-700/30 border border-purple-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-purple-300 mb-2">Best APR</h4>
              <p className="text-3xl font-bold text-white">
                {Math.max(...yieldData.map(item => item.apr)).toFixed(2)}%
              </p>
              <div className="mt-2 text-sm text-purple-200">Highest yield opportunity</div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <h4 className="text-lg font-semibold text-white mb-4">Yield Farming Pools</h4>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 text-slate-400 font-medium">Protocol</th>
                  <th className="text-left py-3 text-slate-400 font-medium">Asset</th>
                  <th className="text-right py-3 text-slate-400 font-medium">APR</th>
                  <th className="text-right py-3 text-slate-400 font-medium">TVL</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Risk</th>
                </tr>
              </thead>
              <tbody>
                {yieldData.map((pool, index) => (
                  <tr key={index} className="border-b border-slate-800/50 hover:bg-slate-700/30">
                    <td className="py-4 font-medium text-white">{pool.protocol}</td>
                    <td className="py-4 text-slate-300">{pool.asset}</td>
                    <td className="text-right py-4 text-green-400">{pool.apr}%</td>
                    <td className="text-right py-4 text-slate-300">{pool.tvl}</td>
                    <td className="text-right py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        pool.apr > 10 ? 'bg-red-900/50 text-red-300' :
                        pool.apr > 7 ? 'bg-yellow-900/50 text-yellow-300' :
                        'bg-green-900/50 text-green-300'
                      }`}>
                        {pool.apr > 10 ? 'High' : pool.apr > 7 ? 'Medium' : 'Low'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">APR Comparison</h3>
            <BarChart data={yieldData.map(pool => ({ 
              label: pool.protocol.substring(0, 4), 
              value: pool.apr 
            }))} height={150} />
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">TVL Distribution</h3>
            <PieChart data={yieldData.map((pool, index) => ({
              name: pool.protocol,
              value: parseFloat(pool.tvl.replace(/[^0-9.-]+/g, "")),
              color: [
                '#F7931A', // Orange
                '#627EEA', // Blue
                '#14F195', // Green
                '#F0B90B'  // Yellow
              ][index % 4]
            }))} />
          </div>
        </div>
      </div>
    );
  };

  // Render Regulatory Tracker
  const renderRegulatoryTracker = () => {
    const regulatoryData = generateRegulatoryTracker();
    
    // Count by impact level
    const highImpact = regulatoryData.filter(item => item.impact === 'High').length;
    const mediumImpact = regulatoryData.filter(item => item.impact === 'Medium').length;
    const lowImpact = regulatoryData.filter(item => item.impact === 'Low').length;
    
    return (
      <div className="space-y-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Regulatory Tracker</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-900/50 to-blue-700/30 border border-blue-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-blue-300 mb-2">Regions Tracked</h4>
              <p className="text-3xl font-bold text-white">{regulatoryData.length}</p>
              <div className="mt-2 text-sm text-blue-200">Global jurisdictions</div>
            </div>
            
            <div className="bg-gradient-to-br from-red-900/50 to-red-700/30 border border-red-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-red-300 mb-2">High Impact</h4>
              <p className="text-3xl font-bold text-white">{highImpact}</p>
              <div className="mt-2 text-sm text-red-200">Critical regulations</div>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-900/50 to-yellow-700/30 border border-yellow-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-yellow-300 mb-2">Medium Impact</h4>
              <p className="text-3xl font-bold text-white">{mediumImpact}</p>
              <div className="mt-2 text-sm text-yellow-200">Significant changes</div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <h4 className="text-lg font-semibold text-white mb-4">Regulatory Status by Region</h4>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 text-slate-400 font-medium">Region</th>
                  <th className="text-left py-3 text-slate-400 font-medium">Status</th>
                  <th className="text-center py-3 text-slate-400 font-medium">Impact</th>
                  <th className="text-left py-3 text-slate-400 font-medium">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {regulatoryData.map((regulation, index) => (
                  <tr key={index} className="border-b border-slate-800/50 hover:bg-slate-700/30">
                    <td className="py-4 font-medium text-white">{regulation.region}</td>
                    <td className="py-4 text-slate-300">{regulation.status}</td>
                    <td className="text-center py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        regulation.impact === 'High' ? 'bg-red-900/50 text-red-300' :
                        regulation.impact === 'Medium' ? 'bg-yellow-900/50 text-yellow-300' :
                        'bg-green-900/50 text-green-300'
                      }`}>
                        {regulation.impact}
                      </span>
                    </td>
                    <td className="py-4 text-slate-300">{new Date().toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Impact Distribution</h3>
            <div className="flex justify-center space-x-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-400">{highImpact}</div>
                <div className="text-slate-400">High</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400">{mediumImpact}</div>
                <div className="text-slate-400">Medium</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">{lowImpact}</div>
                <div className="text-slate-400">Low</div>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Regulatory Heatmap</h3>
            <div className="space-y-3">
              {regulatoryData.map((regulation, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-300">{regulation.region}</span>
                    <span className="text-white font-medium">{regulation.status.split(' ')[0]}</span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        regulation.impact === 'High' ? 'bg-red-500' :
                        regulation.impact === 'Medium' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`} 
                      style={{ width: `${regulation.impact === 'High' ? '100' : regulation.impact === 'Medium' ? '66' : '33'}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Sentiment Analysis
  const renderSentimentAnalysis = () => {
    const sentimentData = generateSentimentAnalysis();
    
    // Calculate overall sentiment scores
    const socialAvg = (sentimentData.social.twitter + sentimentData.social.reddit + sentimentData.social.forums) / 3;
    const newsAvg = (sentimentData.news.positive * 1 + sentimentData.news.neutral * 0 + sentimentData.news.negative * -1) / 
      (sentimentData.news.positive + sentimentData.news.neutral + sentimentData.news.negative) * 100;
    const searchAvg = (sentimentData.search.google + sentimentData.search.yahoo) / 2;
    
    return (
      <div className="space-y-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Sentiment Analysis</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-900/50 to-blue-700/30 border border-blue-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-blue-300 mb-2">Social Sentiment</h4>
              <p className="text-3xl font-bold text-white">{socialAvg.toFixed(1)}</p>
              <div className="mt-2 text-sm text-blue-200">Avg. social media score</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-900/50 to-purple-700/30 border border-purple-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-purple-300 mb-2">News Sentiment</h4>
              <p className="text-3xl font-bold text-white">{newsAvg.toFixed(1)}</p>
              <div className="mt-2 text-sm text-purple-200">Weighted news score</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-900/50 to-green-700/30 border border-green-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-green-300 mb-2">Search Interest</h4>
              <p className="text-3xl font-bold text-white">{searchAvg.toFixed(1)}</p>
              <div className="mt-2 text-sm text-green-200">Avg. search volume</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-700/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-white mb-4">Social Media Sentiment</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-300">Twitter</span>
                    <span className="text-white font-medium">{sentimentData.social.twitter}</span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-brand-neon to-green-500 h-2 rounded-full" 
                      style={{ width: `${sentimentData.social.twitter}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-300">Reddit</span>
                    <span className="text-white font-medium">{sentimentData.social.reddit}</span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-brand-neon to-green-500 h-2 rounded-full" 
                      style={{ width: `${sentimentData.social.reddit}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-300">Forums</span>
                    <span className="text-white font-medium">{sentimentData.social.forums}</span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-brand-neon to-green-500 h-2 rounded-full" 
                      style={{ width: `${sentimentData.social.forums}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-700/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-white mb-4">News Sentiment Distribution</h4>
              <div className="flex justify-center space-x-6 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{sentimentData.news.positive}</div>
                  <div className="text-slate-400">Positive</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-400">{sentimentData.news.neutral}</div>
                  <div className="text-slate-400">Neutral</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">{sentimentData.news.negative}</div>
                  <div className="text-slate-400">Negative</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-slate-300">Positive: {sentimentData.news.positive} articles</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-slate-500 rounded-full mr-2"></div>
                  <span className="text-slate-300">Neutral: {sentimentData.news.neutral} articles</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-slate-300">Negative: {sentimentData.news.negative} articles</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Search Interest Trends</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-slate-300 mb-2">Google Search Volume</h4>
              <div className="text-3xl font-bold text-white">{sentimentData.search.google}%</div>
              <div className="w-full bg-slate-600 rounded-full h-2 mt-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-300 h-2 rounded-full" 
                  style={{ width: `${sentimentData.search.google}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-slate-300 mb-2">Yahoo Search Volume</h4>
              <div className="text-3xl font-bold text-white">{sentimentData.search.yahoo}%</div>
              <div className="w-full bg-slate-600 rounded-full h-2 mt-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-purple-300 h-2 rounded-full" 
                  style={{ width: `${sentimentData.search.yahoo}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Advanced Technical
  const renderAdvancedTechnical = () => {
    const technicalData = generateAdvancedTechnical();
    
    return (
      <div className="space-y-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Advanced Technical Analysis</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {technicalData.map((indicator, index) => (
              <div key={index} className="bg-slate-700/30 rounded-xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-lg font-semibold text-white">{indicator.indicator}</h4>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    indicator.signal === 'Buy' ? 'bg-green-900/50 text-green-300' :
                    indicator.signal === 'Sell' ? 'bg-red-900/50 text-red-300' :
                    'bg-slate-900/50 text-slate-300'
                  }`}>
                    {indicator.signal}
                  </span>
                </div>
                <div className="text-2xl font-bold text-slate-300 mb-2">{indicator.value}</div>
                <div className="w-full bg-slate-600 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      indicator.signal === 'Buy' ? 'bg-green-500' :
                      indicator.signal === 'Sell' ? 'bg-red-500' :
                      'bg-slate-500'
                    }`} 
                    style={{ 
                      width: `${
                        indicator.signal === 'Buy' ? '75' : 
                        indicator.signal === 'Sell' ? '25' : 
                        '50'
                      }%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Technical Indicators Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 text-slate-400 font-medium">Indicator</th>
                  <th className="text-left py-3 text-slate-400 font-medium">Value</th>
                  <th className="text-center py-3 text-slate-400 font-medium">Signal</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Strength</th>
                </tr>
              </thead>
              <tbody>
                {technicalData.map((indicator, index) => (
                  <tr key={index} className="border-b border-slate-800/50 hover:bg-slate-700/30">
                    <td className="py-4 font-medium text-white">{indicator.indicator}</td>
                    <td className="py-4 text-slate-300">{indicator.value}</td>
                    <td className="text-center py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        indicator.signal === 'Buy' ? 'bg-green-900/50 text-green-300' :
                        indicator.signal === 'Sell' ? 'bg-red-900/50 text-red-300' :
                        'bg-slate-900/50 text-slate-300'
                      }`}>
                        {indicator.signal}
                      </span>
                    </td>
                    <td className="text-right py-4">
                      <div className="flex items-center justify-end">
                        <span className="text-slate-300 mr-2">
                          {indicator.signal === 'Buy' ? '75%' : indicator.signal === 'Sell' ? '25%' : '50%'}
                        </span>
                        <div className="w-24 bg-slate-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              indicator.signal === 'Buy' ? 'bg-green-500' :
                              indicator.signal === 'Sell' ? 'bg-red-500' :
                              'bg-slate-500'
                            }`} 
                            style={{ 
                              width: `${
                                indicator.signal === 'Buy' ? '75' : 
                                indicator.signal === 'Sell' ? '25' : 
                                '50'
                              }%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Render Asset Correlation
  const renderAssetCorrelation = () => {
    const correlationData = generateAssetCorrelation();
    
    // Find min and max correlation values for coloring
    const correlations = correlationData.map(item => item.correlation);
    const minCorrelation = Math.min(...correlations);
    const maxCorrelation = Math.max(...correlations);
    
    return (
      <div className="space-y-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Asset Correlation Analysis</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-900/50 to-blue-700/30 border border-blue-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-blue-300 mb-2">Correlation Range</h4>
              <p className="text-3xl font-bold text-white">{minCorrelation.toFixed(2)} to {maxCorrelation.toFixed(2)}</p>
              <div className="mt-2 text-sm text-blue-200">Min to max correlation values</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-900/50 to-purple-700/30 border border-purple-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-purple-300 mb-2">Asset Pairs Analyzed</h4>
              <p className="text-3xl font-bold text-white">{correlationData.length}</p>
              <div className="mt-2 text-sm text-purple-200">Correlation relationships</div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <h4 className="text-lg font-semibold text-white mb-4">Asset Correlation Matrix</h4>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 text-slate-400 font-medium">Asset Pair</th>
                  <th className="text-left py-3 text-slate-400 font-medium">Correlation</th>
                  <th className="text-left py-3 text-slate-400 font-medium">Strength</th>
                  <th className="text-left py-3 text-slate-400 font-medium">Interpretation</th>
                </tr>
              </thead>
              <tbody>
                {correlationData.map((pair, index) => (
                  <tr key={index} className="border-b border-slate-800/50 hover:bg-slate-700/30">
                    <td className="py-4 font-medium text-white">{pair.asset1} / {pair.asset2}</td>
                    <td className="py-4 text-slate-300">{pair.correlation.toFixed(2)}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        Math.abs(pair.correlation) > 0.7 ? 'bg-green-900/50 text-green-300' :
                        Math.abs(pair.correlation) > 0.4 ? 'bg-yellow-900/50 text-yellow-300' :
                        'bg-slate-900/50 text-slate-300'
                      }`}>
                        {Math.abs(pair.correlation) > 0.7 ? 'Strong' : 
                         Math.abs(pair.correlation) > 0.4 ? 'Moderate' : 'Weak'}
                      </span>
                    </td>
                    <td className="py-4 text-slate-300">
                      {pair.correlation > 0.7 ? 'Strong positive correlation' : 
                       pair.correlation > 0.4 ? 'Moderate positive correlation' : 
                       pair.correlation < -0.7 ? 'Strong negative correlation' : 
                       pair.correlation < -0.4 ? 'Moderate negative correlation' : 
                       'Weak correlation'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Correlation Visualization</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {correlationData.map((pair, index) => (
              <div key={index} className="bg-slate-700/30 rounded-lg p-4 text-center">
                <div className="text-sm text-slate-400 mb-1">{pair.asset1}/{pair.asset2}</div>
                <div className="text-xl font-bold text-white">{pair.correlation.toFixed(2)}</div>
                <div className="w-full bg-slate-600 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full ${
                      pair.correlation > 0 ? 'bg-green-500' : 'bg-red-500'
                    }`} 
                    style={{ 
                      width: `${Math.abs(pair.correlation) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render Liquidity Analysis
  const renderLiquidityAnalysis = () => {
    const liquidityData = generateLiquidityAnalysis();
    
    // Calculate total liquidity
    const totalLiquidity = liquidityData.reduce((sum, item) => sum + parseFloat(item.liquidity.replace(/[^0-9.-]+/g, "")), 0);
    
    return (
      <div className="space-y-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Liquidity Analysis</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-900/50 to-blue-700/30 border border-blue-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-blue-300 mb-2">Total Liquidity</h4>
              <p className="text-3xl font-bold text-white">${formatCurrency(totalLiquidity)}</p>
              <div className="mt-2 text-sm text-blue-200">Across all exchanges</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-900/50 to-green-700/30 border border-green-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-green-300 mb-2">Exchanges Tracked</h4>
              <p className="text-3xl font-bold text-white">{liquidityData.length}</p>
              <div className="mt-2 text-sm text-green-200">Liquidity providers</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-900/50 to-purple-700/30 border border-purple-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-purple-300 mb-2">Best Spread</h4>
              <p className="text-3xl font-bold text-white">
                {Math.min(...liquidityData.map(item => parseFloat(item.spread.replace('%', '')))).toFixed(2)}%
              </p>
              <div className="mt-2 text-sm text-purple-200">Lowest trading cost</div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <h4 className="text-lg font-semibold text-white mb-4">Exchange Liquidity Metrics</h4>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 text-slate-400 font-medium">Exchange</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Liquidity</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Spread</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Liquidity Rank</th>
                </tr>
              </thead>
              <tbody>
                {liquidityData.map((exchange, index) => (
                  <tr key={index} className="border-b border-slate-800/50 hover:bg-slate-700/30">
                    <td className="py-4 font-medium text-white">{exchange.exchange}</td>
                    <td className="text-right py-4 text-slate-300">{exchange.liquidity}</td>
                    <td className="text-right py-4 text-slate-300">{exchange.spread}</td>
                    <td className="text-right py-4">
                      <div className="flex items-center justify-end">
                        <span className="text-slate-300 mr-2">#{index + 1}</span>
                        <div className="w-24 bg-slate-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-brand-neon to-green-500 h-2 rounded-full" 
                            style={{ width: `${((liquidityData.length - index) / liquidityData.length) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Liquidity Distribution</h3>
            <BarChart data={liquidityData.map(exchange => ({ 
              label: exchange.exchange.substring(0, 4), 
              value: parseFloat(exchange.liquidity.replace(/[^0-9.-]+/g, "")) 
            }))} height={150} />
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Spread Comparison</h3>
            <BarChart data={liquidityData.map(exchange => ({ 
              label: exchange.exchange.substring(0, 4), 
              value: parseFloat(exchange.spread.replace('%', '')) 
            }))} height={150} />
          </div>
        </div>
      </div>
    );
  };

  // Render Network Metrics
  const renderNetworkMetrics = () => {
    const networkData = generateNetworkMetrics();
    
    // Calculate average TPS
    const avgTps = networkData.reduce((sum, network) => sum + network.tps, 0) / networkData.length;
    
    return (
      <div className="space-y-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Network Metrics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-900/50 to-blue-700/30 border border-blue-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-blue-300 mb-2">Average TPS</h4>
              <p className="text-3xl font-bold text-white">{avgTps.toFixed(1)}</p>
              <div className="mt-2 text-sm text-blue-200">Across all networks</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-900/50 to-green-700/30 border border-green-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-green-300 mb-2">Networks Monitored</h4>
              <p className="text-3xl font-bold text-white">{networkData.length}</p>
              <div className="mt-2 text-sm text-green-200">Blockchain networks</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-900/50 to-purple-700/30 border border-purple-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-purple-300 mb-2">Total Nodes</h4>
              <p className="text-3xl font-bold text-white">
                {networkData.reduce((sum, network) => sum + network.nodes, 0).toLocaleString()}
              </p>
              <div className="mt-2 text-sm text-purple-200">Network participants</div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <h4 className="text-lg font-semibold text-white mb-4">Network Performance Metrics</h4>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 text-slate-400 font-medium">Network</th>
                  <th className="text-right py-3 text-slate-400 font-medium">TPS</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Latency</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Nodes</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Performance</th>
                </tr>
              </thead>
              <tbody>
                {networkData.map((network, index) => (
                  <tr key={index} className="border-b border-slate-800/50 hover:bg-slate-700/30">
                    <td className="py-4 font-medium text-white">{network.network}</td>
                    <td className="text-right py-4 text-slate-300">{network.tps}</td>
                    <td className="text-right py-4 text-slate-300">{network.latency}</td>
                    <td className="text-right py-4 text-slate-300">{network.nodes.toLocaleString()}</td>
                    <td className="text-right py-4">
                      <div className="flex items-center justify-end">
                        <span className="text-slate-300 mr-2">
                          {network.tps > 1000 ? 'High' : network.tps > 100 ? 'Medium' : 'Low'}
                        </span>
                        <div className="w-24 bg-slate-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              network.tps > 1000 ? 'bg-green-500' : 
                              network.tps > 100 ? 'bg-yellow-500' : 'bg-red-500'
                            }`} 
                            style={{ width: `${Math.min((network.tps / 3000) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">TPS Comparison</h3>
            <BarChart data={networkData.map(network => ({ 
              label: network.network.substring(0, 4), 
              value: network.tps 
            }))} height={150} />
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Node Distribution</h3>
            <PieChart data={networkData.map((network, index) => ({
              name: network.network,
              value: network.nodes,
              color: [
                '#F7931A', // Orange
                '#627EEA', // Blue
                '#14F195', // Green
                '#F0B90B'  // Yellow
              ][index % 4]
            }))} />
          </div>
        </div>
      </div>
    );
  };

  // Render Options Analysis
  const renderOptionsAnalysis = () => {
    const optionsData = generateOptionsAnalysis();
    
    // Calculate average implied volatility
    const avgIv = optionsData.reduce((sum, option) => sum + parseFloat(option.iv.replace('%', '')), 0) / optionsData.length;
    
    return (
      <div className="space-y-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Options Analysis</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-900/50 to-blue-700/30 border border-blue-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-blue-300 mb-2">Options Tracked</h4>
              <p className="text-3xl font-bold text-white">{optionsData.length}</p>
              <div className="mt-2 text-sm text-blue-200">Active contracts</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-900/50 to-green-700/30 border border-green-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-green-300 mb-2">Avg. Implied Volatility</h4>
              <p className="text-3xl font-bold text-white">{avgIv.toFixed(2)}%</p>
              <div className="mt-2 text-sm text-green-200">Market expectation</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-900/50 to-purple-700/30 border border-purple-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-purple-300 mb-2">Asset Coverage</h4>
              <p className="text-3xl font-bold text-white">
                {[...new Set(optionsData.map(option => option.asset))].length}
              </p>
              <div className="mt-2 text-sm text-purple-200">Underlying assets</div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <h4 className="text-lg font-semibold text-white mb-4">Options Contracts Overview</h4>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 text-slate-400 font-medium">Asset</th>
                  <th className="text-left py-3 text-slate-400 font-medium">Type</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Strike Price</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Expiry</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Implied Volatility</th>
                </tr>
              </thead>
              <tbody>
                {optionsData.map((option, index) => (
                  <tr key={index} className="border-b border-slate-800/50 hover:bg-slate-700/30">
                    <td className="py-4 font-medium text-white">{option.asset}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        option.type === 'Call' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
                      }`}>
                        {option.type}
                      </span>
                    </td>
                    <td className="text-right py-4 text-slate-300">{option.strike}</td>
                    <td className="text-right py-4 text-slate-300">{option.expiry}</td>
                    <td className="text-right py-4 text-slate-300">{option.iv}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Implied Volatility Comparison</h3>
            <BarChart data={optionsData.map(option => ({ 
              label: option.asset, 
              value: parseFloat(option.iv.replace('%', '')) 
            }))} height={150} />
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Options Distribution</h3>
            <div className="space-y-4">
              {optionsData.map((option, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-300">{option.asset} {option.type}</span>
                    <span className="text-white font-medium">{option.iv}</span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-brand-neon to-green-500 h-2 rounded-full" 
                      style={{ width: `${parseFloat(option.iv.replace('%', ''))}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Derivatives Insights
  const renderDerivativesInsights = () => {
    const derivativesData = generateDerivativesInsights();
    
    // Calculate total open interest
    const totalOi = derivativesData.reduce((sum, item) => sum + parseFloat(item.openInterest.replace(/[^0-9.-]+/g, "")), 0);
    
    return (
      <div className="space-y-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Derivatives Insights</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-900/50 to-blue-700/30 border border-blue-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-blue-300 mb-2">Total Open Interest</h4>
              <p className="text-3xl font-bold text-white">${formatCurrency(totalOi)}</p>
              <div className="mt-2 text-sm text-blue-200">Across all instruments</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-900/50 to-green-700/30 border border-green-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-green-300 mb-2">Instruments Tracked</h4>
              <p className="text-3xl font-bold text-white">{derivativesData.length}</p>
              <div className="mt-2 text-sm text-green-200">Active contracts</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-900/50 to-purple-700/30 border border-purple-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-purple-300 mb-2">Avg. Funding Rate</h4>
              <p className="text-3xl font-bold text-white">
                {(derivativesData.reduce((sum, item) => sum + parseFloat(item.funding), 0) / derivativesData.length).toFixed(4)}
              </p>
              <div className="mt-2 text-sm text-purple-200">Average cost of carry</div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <h4 className="text-lg font-semibold text-white mb-4">Derivatives Market Overview</h4>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 text-slate-400 font-medium">Instrument</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Open Interest</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Funding Rate</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Market Sentiment</th>
                </tr>
              </thead>
              <tbody>
                {derivativesData.map((instrument, index) => (
                  <tr key={index} className="border-b border-slate-800/50 hover:bg-slate-700/30">
                    <td className="py-4 font-medium text-white">{instrument.instrument}</td>
                    <td className="text-right py-4 text-slate-300">{instrument.openInterest}</td>
                    <td className={`text-right py-4 ${parseFloat(instrument.funding) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {instrument.funding}
                    </td>
                    <td className="text-right py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        parseFloat(instrument.funding) > 0.0001 ? 'bg-red-900/50 text-red-300' :
                        parseFloat(instrument.funding) < -0.0001 ? 'bg-green-900/50 text-green-300' :
                        'bg-slate-900/50 text-slate-300'
                      }`}>
                        {parseFloat(instrument.funding) > 0.0001 ? 'Bullish' : 
                         parseFloat(instrument.funding) < -0.0001 ? 'Bearish' : 'Neutral'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Open Interest Distribution</h3>
            <BarChart data={derivativesData.map(instrument => ({ 
              label: instrument.instrument.split(' ')[0], 
              value: parseFloat(instrument.openInterest.replace(/[^0-9.-]+/g, "")) 
            }))} height={150} />
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Funding Rate Analysis</h3>
            <BarChart data={derivativesData.map(instrument => ({ 
              label: instrument.instrument.split(' ')[0], 
              value: Math.abs(parseFloat(instrument.funding) * 10000) 
            }))} height={150} />
          </div>
        </div>
      </div>
    );
  };

  // Render Advanced On-Chain
  const renderAdvancedOnChain = () => {
    const onChainData = generateAdvancedOnChain();
    
    return (
      <div className="space-y-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Advanced On-Chain Analysis</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {onChainData.map((metric, index) => (
              <div key={index} className="bg-slate-700/50 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">{metric.metric}</div>
                <div className="text-xl font-bold text-white">{metric.value}</div>
                <div className={`text-sm mt-1 ${
                  metric.status === 'Overvalued' ? 'text-red-400' : 
                  metric.status === 'Undervalued' ? 'text-green-400' : 
                  metric.status === 'Growing' ? 'text-blue-400' : 
                  'text-slate-400'
                }`}>
                  {metric.status}
                </div>
              </div>
            ))}
          </div>
          
          <div className="overflow-x-auto">
            <h4 className="text-lg font-semibold text-white mb-4">On-Chain Metrics Deep Dive</h4>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 text-slate-400 font-medium">Metric</th>
                  <th className="text-left py-3 text-slate-400 font-medium">Value</th>
                  <th className="text-left py-3 text-slate-400 font-medium">Status</th>
                  <th className="text-left py-3 text-slate-400 font-medium">Interpretation</th>
                </tr>
              </thead>
              <tbody>
                {onChainData.map((metric, index) => (
                  <tr key={index} className="border-b border-slate-800/50 hover:bg-slate-700/30">
                    <td className="py-4 font-medium text-white">{metric.metric}</td>
                    <td className="py-4 text-slate-300">{metric.value}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        metric.status === 'Overvalued' ? 'bg-red-900/50 text-red-300' :
                        metric.status === 'Undervalued' ? 'bg-green-900/50 text-green-300' :
                        metric.status === 'Growing' ? 'bg-blue-900/50 text-blue-300' :
                        'bg-slate-900/50 text-slate-300'
                      }`}>
                        {metric.status}
                      </span>
                    </td>
                    <td className="py-4 text-slate-300">
                      {metric.metric === 'NVT Ratio' ? 
                        (parseFloat(metric.value) > 100 ? 'Asset may be overvalued relative to transaction volume' : 
                         'Asset may be undervalued relative to transaction volume') :
                       metric.metric === 'MVRV Ratio' ? 
                        (parseFloat(metric.value) > 1.5 ? 'Asset is overvalued compared to acquisition cost' : 
                         parseFloat(metric.value) < 0.8 ? 'Asset is undervalued compared to acquisition cost' : 
                         'Asset is fairly valued') :
                       metric.metric === 'Realized Cap' ? 
                        'Market capitalization based on the last movement of coins' :
                       metric.metric === 'Exchange Net Flow' ? 
                        (parseFloat(metric.value.replace(/[^0-9.-]+/g, "")) > 0 ? 
                         'More coins entering exchanges (potential selling pressure)' : 
                         'More coins leaving exchanges (potential accumulation)') :
                       'Advanced on-chain metric'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">On-Chain Sentiment Indicators</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-slate-300 mb-4">NVT Ratio Trend</h4>
              <LineChart data={[
                { label: '7d', value: 25 },
                { label: '14d', value: 32 },
                { label: '30d', value: 28 },
                { label: '60d', value: 35 },
                { label: '90d', value: 28.5 }
              ]} height={150} />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-slate-300 mb-4">MVRV Ratio Trend</h4>
              <LineChart data={[
                { label: '7d', value: 1.2 },
                { label: '14d', value: 1.5 },
                { label: '30d', value: 1.7 },
                { label: '60d', value: 1.6 },
                { label: '90d', value: 1.8 }
              ]} height={150} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Market Microstructure
  const renderMarketMicrostructure = () => {
    const microstructureData = generateMarketMicrostructure();
    
    return (
      <div className="space-y-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Market Microstructure Analysis</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-900/50 to-blue-700/30 border border-blue-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-blue-300 mb-2">Key Microstructure Metrics</h4>
              <p className="text-3xl font-bold text-white">{microstructureData.length}</p>
              <div className="mt-2 text-sm text-blue-200">Analyzed aspects</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-900/50 to-purple-700/30 border border-purple-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-purple-300 mb-2">Market Efficiency</h4>
              <p className="text-3xl font-bold text-white">
                {microstructureData.filter(item => item.impact === 'Efficiency' || item.impact === 'Liquidity').length}
              </p>
              <div className="mt-2 text-sm text-purple-200">Positive factors</div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <h4 className="text-lg font-semibold text-white mb-4">Microstructure Components</h4>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 text-slate-400 font-medium">Aspect</th>
                  <th className="text-left py-3 text-slate-400 font-medium">Value</th>
                  <th className="text-left py-3 text-slate-400 font-medium">Impact</th>
                  <th className="text-left py-3 text-slate-400 font-medium">Market Implication</th>
                </tr>
              </thead>
              <tbody>
                {microstructureData.map((aspect, index) => (
                  <tr key={index} className="border-b border-slate-800/50 hover:bg-slate-700/30">
                    <td className="py-4 font-medium text-white">{aspect.aspect}</td>
                    <td className="py-4 text-slate-300">{aspect.value}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        aspect.impact === 'Efficiency' || aspect.impact === 'Liquidity' ? 'bg-green-900/50 text-green-300' :
                        aspect.impact === 'Volatile' || aspect.impact === 'Slippage' ? 'bg-red-900/50 text-red-300' :
                        'bg-slate-900/50 text-slate-300'
                      }`}>
                        {aspect.impact}
                      </span>
                    </td>
                    <td className="py-4 text-slate-300">
                      {aspect.aspect === 'Order Book Depth' ? 
                        (aspect.value === 'High' ? 'Low slippage, good liquidity' : 'High slippage, poor liquidity') :
                       aspect.aspect === 'Trade Size Distribution' ? 
                        (aspect.value === 'Retail Dominated' ? 'More volatile, less institutional' : 'More stable, institutional presence') :
                       aspect.aspect === 'Market Maker Activity' ? 
                        (aspect.value === 'Active' ? 'Good liquidity provision' : 'Potential liquidity issues') :
                       aspect.aspect === 'Quote Frequency' ? 
                        (aspect.value === 'High' ? 'Market efficiency, tight spreads' : 'Potential inefficiencies') :
                       'Market microstructure factor'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Microstructure Impact Visualization</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-slate-300 mb-4">Impact Distribution</h4>
              <div className="space-y-4">
                {microstructureData.map((aspect, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-300">{aspect.aspect}</span>
                      <span className="text-white font-medium">{aspect.impact}</span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          aspect.impact === 'Efficiency' || aspect.impact === 'Liquidity' ? 'bg-green-500' :
                          aspect.impact === 'Volatile' || aspect.impact === 'Slippage' ? 'bg-red-500' :
                          'bg-slate-500'
                        }`} 
                        style={{ width: `${
                          aspect.impact === 'Efficiency' ? '90' : 
                          aspect.impact === 'Liquidity' ? '80' : 
                          aspect.impact === 'Volatile' ? '30' : 
                          aspect.impact === 'Slippage' ? '20' : 
                          '50'
                        }%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-slate-300 mb-4">Market Quality Indicators</h4>
              <div className="flex justify-center items-center h-48">
                <div className="relative w-40 h-40">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#334155" strokeWidth="8" />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="45" 
                      fill="none" 
                      stroke="#10B981" 
                      strokeWidth="8" 
                      strokeDasharray="283" 
                      strokeDashoffset="71" 
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-white">75%</span>
                    <span className="text-sm text-slate-400">Quality Score</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Economic Indicators
  const renderEconomicIndicators = () => {
    const economicData = generateEconomicIndicators();
    
    return (
      <div className="space-y-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Economic Indicators Analysis</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {economicData.map((indicator, index) => (
              <div key={index} className="bg-slate-700/50 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">{indicator.indicator}</div>
                <div className="text-xl font-bold text-white">{indicator.value}</div>
                <div className={`text-sm mt-1 ${
                  indicator.impact === 'Bullish' ? 'text-green-400' : 
                  indicator.impact === 'Bearish' ? 'text-red-400' : 
                  'text-slate-400'
                }`}>
                  {indicator.impact}
                </div>
              </div>
            ))}
          </div>
          
          <div className="overflow-x-auto">
            <h4 className="text-lg font-semibold text-white mb-4">Key Economic Indicators</h4>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 text-slate-400 font-medium">Indicator</th>
                  <th className="text-left py-3 text-slate-400 font-medium">Value</th>
                  <th className="text-left py-3 text-slate-400 font-medium">Impact</th>
                  <th className="text-left py-3 text-slate-400 font-medium">Market Interpretation</th>
                </tr>
              </thead>
              <tbody>
                {economicData.map((indicator, index) => (
                  <tr key={index} className="border-b border-slate-800/50 hover:bg-slate-700/30">
                    <td className="py-4 font-medium text-white">{indicator.indicator}</td>
                    <td className="py-4 text-slate-300">{indicator.value}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        indicator.impact === 'Bullish' ? 'bg-green-900/50 text-green-300' :
                        indicator.impact === 'Bearish' ? 'bg-red-900/50 text-red-300' :
                        'bg-slate-900/50 text-slate-300'
                      }`}>
                        {indicator.impact}
                      </span>
                    </td>
                    <td className="py-4 text-slate-300">
                      {indicator.indicator === 'Inflation Rate' ? 
                        (parseFloat(indicator.value.replace('%', '')) > 3 ? 
                         'High inflation may lead to tighter monetary policy, bearish for risk assets' : 
                         'Moderate inflation supports economic growth') :
                       indicator.indicator === 'Interest Rates' ? 
                        (parseFloat(indicator.value.replace('%', '')) > 5 ? 
                         'High rates make bonds more attractive, potentially bearish for stocks and crypto' : 
                         'Low rates support risk assets') :
                       indicator.indicator === 'Unemployment' ? 
                        (parseFloat(indicator.value.replace('%', '')) < 4 ? 
                         'Low unemployment indicates strong economy, bullish for risk assets' : 
                         'High unemployment signals economic weakness') :
                       indicator.indicator === 'GDP Growth' ? 
                        (parseFloat(indicator.value.replace('%', '')) > 2 ? 
                         'Strong GDP growth supports risk assets' : 
                         'Weak GDP growth may hurt risk assets') :
                       'Economic indicator'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Economic Impact Visualization</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-slate-300 mb-4">Indicator Impact</h4>
              <div className="space-y-4">
                {economicData.map((indicator, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-300">{indicator.indicator}</span>
                      <span className="text-white font-medium">{indicator.impact}</span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          indicator.impact === 'Bullish' ? 'bg-green-500' :
                          indicator.impact === 'Bearish' ? 'bg-red-500' :
                          'bg-slate-500'
                        }`} 
                        style={{ width: `${
                          indicator.impact === 'Bullish' ? '80' : 
                          indicator.impact === 'Bearish' ? '20' : 
                          '50'
                        }%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-slate-300 mb-4">Market Sentiment</h4>
              <div className="flex justify-center items-center h-48">
                <div className="relative w-40 h-40">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#334155" strokeWidth="8" />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="45" 
                      fill="none" 
                      stroke="#F59E0B" 
                      strokeWidth="8" 
                      strokeDasharray="283" 
                      strokeDashoffset="141" 
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-white">50%</span>
                    <span className="text-sm text-slate-400">Neutral Sentiment</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Behavioral Analytics
  const renderBehavioralAnalytics = () => {
    const behavioralData = generateBehavioralAnalytics();
    
    return (
      <div className="space-y-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Behavioral Analytics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-900/50 to-blue-700/30 border border-blue-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-blue-300 mb-2">Behavioral Patterns</h4>
              <p className="text-3xl font-bold text-white">{behavioralData.length}</p>
              <div className="mt-2 text-sm text-blue-200">Identified patterns</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-900/50 to-purple-700/30 border border-purple-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-purple-300 mb-2">Market Impact</h4>
              <p className="text-3xl font-bold text-white">
                {behavioralData.filter(item => item.impact.includes('Bullish') || item.impact.includes('Bearish')).length}
              </p>
              <div className="mt-2 text-sm text-purple-200">Significant patterns</div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <h4 className="text-lg font-semibold text-white mb-4">Behavioral Patterns Analysis</h4>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 text-slate-400 font-medium">Pattern</th>
                  <th className="text-left py-3 text-slate-400 font-medium">Frequency</th>
                  <th className="text-left py-3 text-slate-400 font-medium">Impact</th>
                  <th className="text-left py-3 text-slate-400 font-medium">Market Implication</th>
                </tr>
              </thead>
              <tbody>
                {behavioralData.map((pattern, index) => (
                  <tr key={index} className="border-b border-slate-800/50 hover:bg-slate-700/30">
                    <td className="py-4 font-medium text-white">{pattern.pattern}</td>
                    <td className="py-4 text-slate-300">{pattern.frequency}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        pattern.impact.includes('Bullish') ? 'bg-green-900/50 text-green-300' :
                        pattern.impact.includes('Bearish') ? 'bg-red-900/50 text-red-300' :
                        'bg-slate-900/50 text-slate-300'
                      }`}>
                        {pattern.impact}
                      </span>
                    </td>
                    <td className="py-4 text-slate-300">
                      {pattern.pattern === 'FOMO Buying' ? 
                        'Fear of missing out drives rapid price increases, often followed by corrections' :
                       pattern.pattern === 'FUD Selling' ? 
                        'Fear, uncertainty, and doubt cause panic selling, creating buying opportunities' :
                       pattern.pattern === 'HODLing' ? 
                        'Long-term holding supports price stability and reduces sell pressure' :
                       pattern.pattern === 'Panic Selling' ? 
                        'Emotional selling at market bottoms, often marking good entry points' :
                       'Behavioral trading pattern'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Behavioral Impact Visualization</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-slate-300 mb-4">Pattern Frequency</h4>
              <div className="space-y-4">
                {behavioralData.map((pattern, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-300">{pattern.pattern}</span>
                      <span className="text-white font-medium">{pattern.frequency}</span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          pattern.frequency === 'High' ? 'bg-red-500' :
                          pattern.frequency === 'Medium' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`} 
                        style={{ width: `${
                          pattern.frequency === 'High' ? '80' : 
                          pattern.frequency === 'Medium' ? '50' : 
                          '20'
                        }%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-slate-300 mb-4">Market Sentiment</h4>
              <div className="flex justify-center items-center h-48">
                <div className="relative w-40 h-40">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#334155" strokeWidth="8" />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="45" 
                      fill="none" 
                      stroke="#8B5CF6" 
                      strokeWidth="8" 
                      strokeDasharray="283" 
                      strokeDashoffset="198" 
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-white">30%</span>
                    <span className="text-sm text-slate-400">Bearish Sentiment</span>
                  </div>
                </div>
              </div>
            </div>
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
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-neon"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-900/50 border border-red-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-red-300 mb-2">Error Loading Data</h3>
          <p className="text-red-200">{error}</p>
          <button 
            onClick={fetchAllMarketData}
            className="mt-4 px-4 py-2 bg-red-700 hover:bg-red-600 rounded-lg text-white transition"
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
        return renderVolatilityAnalysis();
      case 'correlation':
        return renderCorrelationMatrix();
      case 'cycle':
        return renderMarketCycle();
      case 'onchain':
        return renderOnChainAnalytics();
      case 'whale':
        return renderWhaleActivity();
      case 'stablecoin':
        return renderStablecoinAnalysis();
      case 'defi':
        return renderDeFiMetrics();
      case 'mining':
        return renderMiningMetrics();
      case 'orderbook':
        return renderOrderBookDepth();
      case 'funding':
        return renderFundingRates();
      case 'portfolio':
        return renderPortfolioTracker();
      case 'signals':
        return renderTradingSignals();
      case 'sentiment':
        return renderNewsSentiment();
      case 'ico':
        return renderICOCalendar();
      case 'exchange':
        return renderExchangeComparison();
      case 'historical':
        return renderHistoricalData();
      case 'risk':
        return renderRiskAssessment();
      case 'arbitrage':
        return renderArbitrageOpportunities();
      case 'yield':
        return renderYieldFarming();
      case 'regulatory':
        return renderRegulatoryTracker();
      case 'sentiment2':
        return renderSentimentAnalysis();
      case 'technical2':
        return renderAdvancedTechnical();
      case 'correlation2':
        return renderAssetCorrelation();
      case 'liquidity':
        return renderLiquidityAnalysis();
      case 'network':
        return renderNetworkMetrics();
      case 'options':
        return renderOptionsAnalysis();
      case 'derivatives':
        return renderDerivativesInsights();
      case 'onchain2':
        return renderAdvancedOnChain();
      case 'microstructure':
        return renderMarketMicrostructure();
      case 'economic':
        return renderEconomicIndicators();
      case 'behavioral':
        return renderBehavioralAnalytics();
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
                  className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg text-sm transition ${activeSection === section.id ? 'bg-brand-neon text-black' : 'text-slate-300 hover:bg-slate-700'}`}
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
