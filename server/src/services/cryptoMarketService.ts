/**
 * Crypto Market Service
 * Handles fetching cryptocurrency market data from various APIs
 */

import axios from 'axios';
import config from '../config';

// Define types for our market data
interface GlobalMetrics {
  totalMarketCap: number;
  totalVolume24h: number;
  bitcoinDominance: number;
  ethereumDominance: number;
  activeCryptocurrencies: number;
  activeExchanges: number;
  lastUpdated: string;
  marketCapChange24h: number;
  volumeChange24h: number;
  defiMarketCap: number;
  defiVolume24h: number;
  stablecoinMarketCap: number;
  stablecoinVolume24h: number;
}

interface CryptocurrencyQuote {
  price: number;
  volume24h: number;
  percentChange1h: number;
  percentChange24h: number;
  percentChange7d: number;
  percentChange30d: number;
  marketCap: number;
  lastUpdated: string;
}

interface Cryptocurrency {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  cmcRank: number;
  numMarketPairs: number;
  circulatingSupply: number;
  totalSupply: number;
  maxSupply: number | null;
  lastUpdated: string;
  dateAdded: string;
  tags: string[];
  platform: any;
  quote: {
    [fiat: string]: CryptocurrencyQuote;
  };
}

interface TechnicalIndicator {
  symbol: string;
  name: string;
  value: number;
  timestamp: string;
  period?: number;
}

interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  marketCapRank: number;
  price: number;
  priceChangePercentage24h: number;
  totalVolume: number;
  score: number;
  sparkline: number[];
}

interface CoinGeckoCoin {
  id: string;
  name: string;
  symbol: string;
  market_cap_rank: number;
  current_price: number;
  price_change_percentage_24h: number;
  total_volume: number;
  market_cap: number;
  sparkline_in_7d: {
    price: number[];
  };
}

// New interfaces for additional market analysis features
interface ETFData {
  name: string;
  inflow: number;
  outflow: number;
  net: number;
  timestamp: string;
}

interface GasFeeData {
  network: string;
  baseFee: number;
  priorityFee: number;
  avgTxCost: number;
  timestamp: string;
}

interface VolatilityData {
  symbol: string;
  volatility: number;
  period: string;
  timestamp: string;
}

interface CorrelationData {
  asset1: string;
  asset2: string;
  correlation: number;
  period: string;
  timestamp: string;
}

interface MarketCycleData {
  phase: string;
  confidence: number;
  indicators: {
    [key: string]: number;
  };
  timestamp: string;
}

interface OnChainData {
  symbol: string;
  activeAddresses: number;
  transactionCount: number;
  exchangeFlows: number;
  timestamp: string;
}

interface WhaleActivityData {
  symbol: string;
  largeTransactions: number;
  whaleWallets: number;
  totalVolume: number;
  timestamp: string;
}

interface StablecoinData {
  name: string;
  symbol: string;
  marketCap: number;
  pegStatus: number;
  issuanceRate: number;
  redemptionRate: number;
  timestamp: string;
}

interface DeFiMetric {
  protocol: string;
  tvl: number;
  rank: number;
  yield: number;
  timestamp: string;
}

interface MiningMetric {
  coin: string;
  hashRate: number;
  difficulty: number;
  miningPoolDistribution: {
    [pool: string]: number;
  };
  timestamp: string;
}

class CryptoMarketService {
  private coinMarketCapApiKey: string;
  private coinGeckoApiKey?: string;
  private cache: Map<string, { data: any; timestamp: number }>;
  private cacheExpiry: number; // in milliseconds

  constructor() {
    this.coinMarketCapApiKey = config.coinMarketCapApiKey || '';
    this.coinGeckoApiKey = config.coinGeckoApiKey || undefined;
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get global cryptocurrency market metrics
   */
  async getGlobalMetrics(): Promise<GlobalMetrics> {
    try {
      const cacheKey = 'globalMetrics';
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      if (!this.coinMarketCapApiKey) {
        // Return mock data if no API key is configured
        return this.getMockGlobalMetrics();
      }

      const response = await axios.get('https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest', {
        headers: {
          'X-CMC_PRO_API_KEY': this.coinMarketCapApiKey,
          'Accept': 'application/json',
        },
      });

      const data = response.data.data;
      const metrics: GlobalMetrics = {
        totalMarketCap: data.quote.USD.total_market_cap,
        totalVolume24h: data.quote.USD.total_volume_24h,
        bitcoinDominance: data.btc_dominance,
        ethereumDominance: data.eth_dominance,
        activeCryptocurrencies: data.active_cryptocurrencies,
        activeExchanges: data.active_exchanges,
        lastUpdated: data.last_updated,
        marketCapChange24h: data.quote.USD.market_cap_change_24h,
        volumeChange24h: data.quote.USD.volume_change_24h,
        defiMarketCap: data.defi_market_cap || 0,
        defiVolume24h: data.defi_volume_24h || 0,
        stablecoinMarketCap: data.stablecoin_market_cap || 0,
        stablecoinVolume24h: data.stablecoin_volume_24h || 0,
      };

      this.setInCache(cacheKey, metrics);
      return metrics;
    } catch (error) {
      console.error('Error fetching global metrics:', error);
      // Return mock data as fallback
      return this.getMockGlobalMetrics();
    }
  }

  /**
   * Get cryptocurrency listings
   */
  async getCryptocurrencyListings(limit: number = 100, sort: string = 'market_cap', sortDir: string = 'desc', timeRange: string = '24h'): Promise<Cryptocurrency[]> {
    try {
      const cacheKey = `listings_${limit}_${sort}_${sortDir}_${timeRange}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      if (!this.coinMarketCapApiKey) {
        // Return mock data if no API key is configured
        return this.getMockCryptocurrencyListings(limit, timeRange);
      }

      const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', {
        headers: {
          'X-CMC_PRO_API_KEY': this.coinMarketCapApiKey,
          'Accept': 'application/json',
        },
        params: {
          limit,
          sort,
          sort_dir: sortDir,
          convert: 'USD',
        },
      });

      const listings: Cryptocurrency[] = response.data.data;
      this.setInCache(cacheKey, listings);
      return listings;
    } catch (error) {
      console.error('Error fetching cryptocurrency listings:', error);
      // Return mock data as fallback
      return this.getMockCryptocurrencyListings(limit, timeRange);
    }
  }

  /**
   * Get historical data for a cryptocurrency
   */
  async getHistoricalData(symbol: string, timeStart: string, timeEnd: string, interval: string = 'daily'): Promise<any> {
    try {
      const cacheKey = `historical_${symbol}_${timeStart}_${timeEnd}_${interval}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      if (!this.coinMarketCapApiKey) {
        // Return mock data if no API key is configured
        return this.getMockHistoricalData(symbol);
      }

      const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/historical', {
        headers: {
          'X-CMC_PRO_API_KEY': this.coinMarketCapApiKey,
          'Accept': 'application/json',
        },
        params: {
          symbol,
          time_start: timeStart,
          time_end: timeEnd,
          interval,
          convert: 'USD',
        },
      });

      const data = response.data;
      this.setInCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching historical data:', error);
      // Return mock data as fallback
      return this.getMockHistoricalData(symbol);
    }
  }

  /**
   * Get technical indicators for a cryptocurrency
   */
  async getTechnicalIndicators(symbol: string, indicator: string, period?: number): Promise<TechnicalIndicator[]> {
    try {
      // This would typically integrate with a technical analysis service
      // For now, we'll return mock data
      return this.getMockTechnicalIndicators(symbol, indicator, period);
    } catch (error) {
      console.error('Error fetching technical indicators:', error);
      return this.getMockTechnicalIndicators(symbol, indicator, period);
    }
  }

  /**
   * Get trending cryptocurrencies
   */
  async getTrendingCoins(coin: string = 'BTC'): Promise<TrendingCoin[]> {
    try {
      const cacheKey = `trendingCoins_${coin}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // Try CoinGecko API first for trending data with sparklines
      if (this.coinGeckoApiKey || true) { // Always try CoinGecko as it has free endpoints
        try {
          // If a specific coin is requested, get detailed data for that coin
          // Otherwise, get trending coins
          let response;
          if (coin && coin !== 'BTC') {
            // Get specific coin data
            response = await axios.get(`https://api.coingecko.com/api/v3/coins/${coin.toLowerCase()}`, {
              params: {
                localization: false,
                tickers: false,
                market_data: true,
                community_data: false,
                developer_data: false,
                sparkline: true
              },
              headers: {
                'Accept': 'application/json',
                ...(this.coinGeckoApiKey ? { 'Authorization': `Bearer ${this.coinGeckoApiKey}` } : {})
              }
            });
            
            // Transform single coin response to array format
            const coinData = response.data;
            const trending: TrendingCoin[] = [{
              id: coinData.id,
              name: coinData.name,
              symbol: coinData.symbol.toUpperCase(),
              marketCapRank: coinData.market_cap_rank,
              price: coinData.market_data.current_price.usd,
              priceChangePercentage24h: coinData.market_data.price_change_percentage_24h,
              totalVolume: coinData.market_data.total_volume.usd,
              score: Math.abs(coinData.market_data.price_change_percentage_24h),
              sparkline: coinData.market_data.sparkline_in_7d?.price || []
            }];
            
            this.setInCache(cacheKey, trending);
            return trending;
          } else {
            // Get trending coins
            response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
              params: {
                vs_currency: 'usd',
                order: 'market_cap_desc',
                per_page: 20,
                page: 1,
                sparkline: true,
                price_change_percentage: '24h'
              },
              headers: {
                'Accept': 'application/json',
                ...(this.coinGeckoApiKey ? { 'Authorization': `Bearer ${this.coinGeckoApiKey}` } : {})
              }
            });
            
            const trending: TrendingCoin[] = response.data.map((coin: CoinGeckoCoin) => ({
              id: coin.id,
              name: coin.name,
              symbol: coin.symbol.toUpperCase(),
              marketCapRank: coin.market_cap_rank,
              price: coin.current_price,
              priceChangePercentage24h: coin.price_change_percentage_24h,
              totalVolume: coin.total_volume,
              score: Math.abs(coin.price_change_percentage_24h), // Using absolute change as score
              sparkline: coin.sparkline_in_7d?.price || []
            }));
            
            this.setInCache(cacheKey, trending);
            return trending;
          }
        } catch (cgError) {
          console.warn('CoinGecko API error, falling back to CMC:', cgError);
        }
      }

      // Fallback to CMC listings sorted by percent change
      const listings = await this.getCryptocurrencyListings(20, 'percent_change_24h', 'desc', '24h');
      const trending: TrendingCoin[] = listings.slice(0, 10).map((coin: Cryptocurrency) => ({
        id: coin.id.toString(),
        name: coin.name,
        symbol: coin.symbol,
        marketCapRank: coin.cmcRank,
        price: coin.quote.USD.price,
        priceChangePercentage24h: coin.quote.USD.percentChange24h,
        totalVolume: coin.quote.USD.volume24h,
        score: Math.abs(coin.quote.USD.percentChange24h), // Using absolute change as score
        sparkline: [] // CMC doesn't provide sparklines in this endpoint
      }));

      this.setInCache(cacheKey, trending);
      return trending;
    } catch (error) {
      console.error('Error fetching trending coins:', error);
      return this.getMockTrendingCoins();
    }
  }

  /**
   * Get Fear & Greed Index
   */
  async getFearGreedIndex(): Promise<number> {
    try {
      const cacheKey = 'fearGreedIndex';
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // Try to get Fear & Greed Index from alternative sources
      try {
        // Alternative data source for Fear & Greed Index
        // This is a simplified approach - in production, you might use a dedicated API
        const listings = await this.getCryptocurrencyListings(10, 'market_cap', 'desc', '24h');
        
        // Calculate a simple sentiment score based on recent performance
        const avgChange = listings.reduce((sum, coin) => sum + coin.quote.USD.percentChange24h, 0) / listings.length;
        
        // Map the average change to a 0-100 scale
        // -10% or lower = 0 (extreme fear), +10% or higher = 100 (extreme greed)
        let index = 50 + (avgChange * 5); // Center at 50, scale by 5
        index = Math.max(0, Math.min(100, index)); // Clamp between 0-100
        
        const result = Math.round(index);
        this.setInCache(cacheKey, result);
        return result;
      } catch (calcError) {
        console.warn('Error calculating Fear & Greed Index:', calcError);
        const result = 50; // Neutral as fallback
        this.setInCache(cacheKey, result);
        return result;
      }
    } catch (error) {
      console.error('Error getting Fear & Greed Index:', error);
      return 50; // Neutral as fallback
    }
  }

  /**
   * Get ETF flow data
   */
  async getETFData(): Promise<ETFData[]> {
    try {
      const cacheKey = 'etfData';
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // Return mock data for now
      const etfData: ETFData[] = this.getMockETFData();
      this.setInCache(cacheKey, etfData);
      return etfData;
    } catch (error) {
      console.error('Error fetching ETF data:', error);
      return this.getMockETFData();
    }
  }

  /**
   * Get gas fee data for different networks
   */
  async getGasFeeData(): Promise<GasFeeData[]> {
    try {
      const cacheKey = 'gasFeeData';
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // Return mock data for now
      const gasFeeData: GasFeeData[] = this.getMockGasFeeData();
      this.setInCache(cacheKey, gasFeeData);
      return gasFeeData;
    } catch (error) {
      console.error('Error fetching gas fee data:', error);
      return this.getMockGasFeeData();
    }
  }

  /**
   * Get volatility data
   */
  async getVolatilityData(symbols: string[]): Promise<VolatilityData[]> {
    try {
      const cacheKey = `volatilityData_${symbols.join(',')}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // Return mock data for now
      const volatilityData: VolatilityData[] = this.getMockVolatilityData(symbols);
      this.setInCache(cacheKey, volatilityData);
      return volatilityData;
    } catch (error) {
      console.error('Error fetching volatility data:', error);
      return this.getMockVolatilityData(symbols);
    }
  }

  /**
   * Get correlation data
   */
  async getCorrelationData(assets: string[]): Promise<CorrelationData[]> {
    try {
      const cacheKey = `correlationData_${assets.join(',')}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // Return mock data for now
      const correlationData: CorrelationData[] = this.getMockCorrelationData(assets);
      this.setInCache(cacheKey, correlationData);
      return correlationData;
    } catch (error) {
      console.error('Error fetching correlation data:', error);
      return this.getMockCorrelationData(assets);
    }
  }

  /**
   * Get market cycle data
   */
  async getMarketCycleData(): Promise<MarketCycleData> {
    try {
      const cacheKey = 'marketCycleData';
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // Return mock data for now
      const marketCycleData: MarketCycleData = this.getMockMarketCycleData();
      this.setInCache(cacheKey, marketCycleData);
      return marketCycleData;
    } catch (error) {
      console.error('Error fetching market cycle data:', error);
      return this.getMockMarketCycleData();
    }
  }

  /**
   * Get on-chain analytics data
   */
  async getOnChainData(symbol: string): Promise<OnChainData> {
    try {
      const cacheKey = `onChainData_${symbol}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // Return mock data for now
      const onChainData: OnChainData = this.getMockOnChainData(symbol);
      this.setInCache(cacheKey, onChainData);
      return onChainData;
    } catch (error) {
      console.error('Error fetching on-chain data:', error);
      return this.getMockOnChainData(symbol);
    }
  }

  /**
   * Get whale activity data
   */
  async getWhaleActivityData(symbol: string): Promise<WhaleActivityData> {
    try {
      const cacheKey = `whaleActivityData_${symbol}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // Return mock data for now
      const whaleActivityData: WhaleActivityData = this.getMockWhaleActivityData(symbol);
      this.setInCache(cacheKey, whaleActivityData);
      return whaleActivityData;
    } catch (error) {
      console.error('Error fetching whale activity data:', error);
      return this.getMockWhaleActivityData(symbol);
    }
  }

  /**
   * Get stablecoin data
   */
  async getStablecoinData(): Promise<StablecoinData[]> {
    try {
      const cacheKey = 'stablecoinData';
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // Return mock data for now
      const stablecoinData: StablecoinData[] = this.getMockStablecoinData();
      this.setInCache(cacheKey, stablecoinData);
      return stablecoinData;
    } catch (error) {
      console.error('Error fetching stablecoin data:', error);
      return this.getMockStablecoinData();
    }
  }

  /**
   * Get DeFi metrics
   */
  async getDeFiMetrics(): Promise<DeFiMetric[]> {
    try {
      const cacheKey = 'defiMetrics';
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // Return mock data for now
      const defiMetrics: DeFiMetric[] = this.getMockDeFiMetrics();
      this.setInCache(cacheKey, defiMetrics);
      return defiMetrics;
    } catch (error) {
      console.error('Error fetching DeFi metrics:', error);
      return this.getMockDeFiMetrics();
    }
  }

  /**
   * Get mining metrics
   */
  async getMiningMetrics(coin: string): Promise<MiningMetric> {
    try {
      const cacheKey = `miningMetrics_${coin}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // Return mock data for now
      const miningMetrics: MiningMetric = this.getMockMiningMetrics(coin);
      this.setInCache(cacheKey, miningMetrics);
      return miningMetrics;
    } catch (error) {
      console.error('Error fetching mining metrics:', error);
      return this.getMockMiningMetrics(coin);
    }
  }

  /**
   * Cache management methods
   */
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setInCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Mock data methods for development and fallback
   */
  private getMockGlobalMetrics(): GlobalMetrics {
    return {
      totalMarketCap: 1208392000000 + Math.random() * 10000000000,
      totalVolume24h: 45210900000 + Math.random() * 1000000000,
      bitcoinDominance: 48.7 + (Math.random() * 2 - 1),
      ethereumDominance: 17.3 + (Math.random() * 2 - 1),
      activeCryptocurrencies: 23847 + Math.floor(Math.random() * 1000),
      activeExchanges: 126 + Math.floor(Math.random() * 10),
      lastUpdated: new Date().toISOString(),
      marketCapChange24h: 2.3 + (Math.random() * 2 - 1),
      volumeChange24h: 5.7 + (Math.random() * 2 - 1),
      defiMarketCap: 78000000000 + Math.random() * 5000000000,
      defiVolume24h: 3200000000 + Math.random() * 200000000,
      stablecoinMarketCap: 125000000000 + Math.random() * 5000000000,
      stablecoinVolume24h: 45000000000 + Math.random() * 2000000000
    };
  }

  private getMockCryptocurrencyListings(limit: number, timeRange: string = '24h'): Cryptocurrency[] {
    // Adjust the mock data based on the time range
    let timeRangeMultiplier = 1;
    switch (timeRange) {
      case '1h':
        timeRangeMultiplier = 0.1;
        break;
      case '24h':
        timeRangeMultiplier = 1;
        break;
      case '7d':
        timeRangeMultiplier = 2;
        break;
      case '30d':
        timeRangeMultiplier = 4;
        break;
      case '1y':
        timeRangeMultiplier = 8;
        break;
      default:
        timeRangeMultiplier = 1;
    }

    const mockCoins = [
      {
        id: 1,
        name: 'Bitcoin',
        symbol: 'BTC',
        slug: 'bitcoin',
        cmcRank: 1,
        numMarketPairs: 9782,
        circulatingSupply: 19500000,
        totalSupply: 19500000,
        maxSupply: 21000000,
        lastUpdated: new Date().toISOString(),
        dateAdded: '2013-04-28T00:00:00.000Z',
        tags: ['mineable', 'pow', 'sha-256', 'store-of-value', 'state-channel'],
        platform: null,
        quote: {
          USD: {
            price: 43256.78 + (Math.random() * 1000 - 500),
            volume24h: 21893456789 + Math.random() * 1000000000,
            percentChange1h: Math.random() * 2 * timeRangeMultiplier - 1 * timeRangeMultiplier,
            percentChange24h: Math.random() * 5 * timeRangeMultiplier - 2.5 * timeRangeMultiplier,
            percentChange7d: Math.random() * 10 * timeRangeMultiplier - 5 * timeRangeMultiplier,
            percentChange30d: Math.random() * 20 * timeRangeMultiplier - 10 * timeRangeMultiplier,
            marketCap: 843400000000 + Math.random() * 10000000000,
            lastUpdated: new Date().toISOString(),
          }
        }
      },
      {
        id: 1027,
        name: 'Ethereum',
        symbol: 'ETH',
        slug: 'ethereum',
        cmcRank: 2,
        numMarketPairs: 6543,
        circulatingSupply: 122389000,
        totalSupply: 122389000,
        maxSupply: null,
        lastUpdated: new Date().toISOString(),
        dateAdded: '2015-08-07T00:00:00.000Z',
        tags: ['mineable', 'pow', 'smart-contracts', 'ethereum-ecosystem'],
        platform: null,
        quote: {
          USD: {
            price: 2567.89 + (Math.random() * 100 - 50),
            volume24h: 15678901234 + Math.random() * 1000000000,
            percentChange1h: Math.random() * 2 * timeRangeMultiplier - 1 * timeRangeMultiplier,
            percentChange24h: Math.random() * 5 * timeRangeMultiplier - 2.5 * timeRangeMultiplier,
            percentChange7d: Math.random() * 10 * timeRangeMultiplier - 5 * timeRangeMultiplier,
            percentChange30d: Math.random() * 20 * timeRangeMultiplier - 10 * timeRangeMultiplier,
            marketCap: 314200000000 + Math.random() * 10000000000,
            lastUpdated: new Date().toISOString(),
          }
        }
      },
      {
        id: 1839,
        name: 'BNB',
        symbol: 'BNB',
        slug: 'bnb',
        cmcRank: 3,
        numMarketPairs: 1456,
        circulatingSupply: 153000000,
        totalSupply: 153000000,
        maxSupply: 200000000,
        lastUpdated: new Date().toISOString(),
        dateAdded: '2017-07-25T00:00:00.000Z',
        tags: ['marketplace', 'centralized-exchange', 'payments'],
        platform: null,
        quote: {
          USD: {
            price: 312.45 + (Math.random() * 20 - 10),
            volume24h: 1234567890 + Math.random() * 100000000,
            percentChange1h: Math.random() * 2 * timeRangeMultiplier - 1 * timeRangeMultiplier,
            percentChange24h: Math.random() * 5 * timeRangeMultiplier - 2.5 * timeRangeMultiplier,
            percentChange7d: Math.random() * 10 * timeRangeMultiplier - 5 * timeRangeMultiplier,
            percentChange30d: Math.random() * 20 * timeRangeMultiplier - 10 * timeRangeMultiplier,
            marketCap: 47700000000 + Math.random() * 1000000000,
            lastUpdated: new Date().toISOString(),
          }
        }
      }
    ];

    // Return only the requested limit
    return mockCoins.slice(0, limit);
  }

  private getMockHistoricalData(symbol: string): any {
    // Generate mock historical data
    const data = [];
    const now = Date.now();
    for (let i = 30; i >= 0; i--) {
      const timestamp = now - i * 24 * 60 * 60 * 1000;
      const basePrice = symbol === 'BTC' ? 40000 : symbol === 'ETH' ? 2500 : 100;
      const price = basePrice + (Math.random() * 2000 - 1000);
      data.push({
        timestamp: new Date(timestamp).toISOString(),
        price,
        volume24h: Math.random() * 10000000000,
        marketCap: price * (symbol === 'BTC' ? 19500000 : symbol === 'ETH' ? 122389000 : 10000000),
      });
    }

    return {
      symbol,
      data,
    };
  }

  private getMockTechnicalIndicators(symbol: string, indicator: string, period?: number): TechnicalIndicator[] {
    return [
      {
        symbol,
        name: indicator,
        value: Math.random() * 100,
        timestamp: new Date().toISOString(),
        period,
      }
    ];
  }

  private getMockTrendingCoins(): TrendingCoin[] {
    return [
      { id: '1', name: 'Bitcoin', symbol: 'BTC', marketCapRank: 1, price: 43256.78, priceChangePercentage24h: 2.34, totalVolume: 21893456789, score: 95, sparkline: [42000, 42500, 42300, 42800, 43000, 43200, 43100] },
      { id: '2', name: 'Ethereum', symbol: 'ETH', marketCapRank: 2, price: 2567.89, priceChangePercentage24h: -1.23, totalVolume: 15678901234, score: 87, sparkline: [2600, 2580, 2590, 2570, 2550, 2560, 2567] },
      { id: '3', name: 'Solana', symbol: 'SOL', marketCapRank: 5, price: 98.65, priceChangePercentage24h: 5.67, totalVolume: 8765432109, score: 82, sparkline: [95, 96, 97, 98, 99, 98.5, 98.65] },
      { id: '4', name: 'Cardano', symbol: 'ADA', marketCapRank: 7, price: 0.52, priceChangePercentage24h: 3.45, totalVolume: 5432109876, score: 78, sparkline: [0.50, 0.51, 0.505, 0.515, 0.52, 0.518, 0.52] },
      { id: '5', name: 'Polkadot', symbol: 'DOT', marketCapRank: 11, price: 7.89, priceChangePercentage24h: -0.89, totalVolume: 3210987654, score: 72, sparkline: [8, 7.9, 7.85, 7.9, 7.88, 7.91, 7.89] },
    ];
  }

  private getMockETFData(): ETFData[] {
    return [
      { name: 'Bitcoin ETF', inflow: 452000000, outflow: 120000000, net: 332000000, timestamp: new Date().toISOString() },
      { name: 'Ethereum ETF', inflow: 187000000, outflow: 45000000, net: 142000000, timestamp: new Date().toISOString() }
    ];
  }

  private getMockGasFeeData(): GasFeeData[] {
    return [
      { network: 'Ethereum', baseFee: 12, priorityFee: 2.5, avgTxCost: 3.75, timestamp: new Date().toISOString() },
      { network: 'Polygon', baseFee: 50, priorityFee: 30, avgTxCost: 0.02, timestamp: new Date().toISOString() },
      { network: 'Arbitrum', baseFee: 0.1, priorityFee: 0.01, avgTxCost: 0.001, timestamp: new Date().toISOString() }
    ];
  }

  private getMockVolatilityData(symbols: string[]): VolatilityData[] {
    return symbols.map(symbol => ({
      symbol,
      volatility: Math.random() * 100,
      period: '30d',
      timestamp: new Date().toISOString()
    }));
  }

  private getMockCorrelationData(assets: string[]): CorrelationData[] {
    const correlations: CorrelationData[] = [];
    for (let i = 0; i < assets.length; i++) {
      for (let j = i + 1; j < assets.length; j++) {
        correlations.push({
          asset1: assets[i],
          asset2: assets[j],
          correlation: Math.random() * 2 - 1, // Between -1 and 1
          period: '30d',
          timestamp: new Date().toISOString()
        });
      }
    }
    return correlations;
  }

  private getMockMarketCycleData(): MarketCycleData {
    return {
      phase: Math.random() > 0.5 ? 'Bull Market' : 'Bear Market',
      confidence: Math.random() * 100,
      indicators: {
        'RSI': Math.random() * 100,
        'MACD': Math.random() * 200 - 100,
        'MA': Math.random() * 100,
        'Volume': Math.random() * 10000000000
      },
      timestamp: new Date().toISOString()
    };
  }

  private getMockOnChainData(symbol: string): OnChainData {
    return {
      symbol,
      activeAddresses: Math.floor(Math.random() * 1000000),
      transactionCount: Math.floor(Math.random() * 500000),
      exchangeFlows: Math.random() * 1000000000,
      timestamp: new Date().toISOString()
    };
  }

  private getMockWhaleActivityData(symbol: string): WhaleActivityData {
    return {
      symbol,
      largeTransactions: Math.floor(Math.random() * 1000),
      whaleWallets: Math.floor(Math.random() * 100),
      totalVolume: Math.random() * 1000000000,
      timestamp: new Date().toISOString()
    };
  }

  private getMockStablecoinData(): StablecoinData[] {
    return [
      { name: 'Tether', symbol: 'USDT', marketCap: 82000000000, pegStatus: 0.9995, issuanceRate: 500000000, redemptionRate: 300000000, timestamp: new Date().toISOString() },
      { name: 'USD Coin', symbol: 'USDC', marketCap: 32000000000, pegStatus: 1.0002, issuanceRate: 200000000, redemptionRate: 150000000, timestamp: new Date().toISOString() },
      { name: 'Dai', symbol: 'DAI', marketCap: 5000000000, pegStatus: 0.9987, issuanceRate: 50000000, redemptionRate: 40000000, timestamp: new Date().toISOString() }
    ];
  }

  private getMockDeFiMetrics(): DeFiMetric[] {
    return [
      { protocol: 'Uniswap', tvl: 3500000000, rank: 1, yield: 8.5, timestamp: new Date().toISOString() },
      { protocol: 'MakerDAO', tvl: 2100000000, rank: 2, yield: 4.2, timestamp: new Date().toISOString() },
      { protocol: 'Compound', tvl: 1800000000, rank: 3, yield: 6.8, timestamp: new Date().toISOString() },
      { protocol: 'Aave', tvl: 1500000000, rank: 4, yield: 7.2, timestamp: new Date().toISOString() },
      { protocol: 'Curve', tvl: 1200000000, rank: 5, yield: 9.1, timestamp: new Date().toISOString() }
    ];
  }

  private getMockMiningMetrics(coin: string): MiningMetric {
    return {
      coin,
      hashRate: Math.random() * 200000000,
      difficulty: Math.random() * 50000000000,
      miningPoolDistribution: {
        'Pool 1': Math.random() * 30,
        'Pool 2': Math.random() * 25,
        'Pool 3': Math.random() * 20,
        'Others': Math.random() * 25
      },
      timestamp: new Date().toISOString()
    };
  }
}

export default new CryptoMarketService();