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
                  <th className="text-right py-3 text-slate-400 font-medium">Rank</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Yield</th>
                </tr>
              </thead>
              <tbody>
                {defiData.map((item, index) => (
                  <tr key={index} className="border-b border-slate-800/50 hover:bg-slate-700/30">
                    <td className="py-4 font-medium text-white">{item.protocol}</td>
                    <td className="text-right py-4 text-slate-300">{item.tvl}</td>
                    <td className="text-right py-4 text-slate-300">{item.rank}</td>
                    <td className="text-right py-4 text-green-400">{item.yield}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
        return renderDeFiMetrics();
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