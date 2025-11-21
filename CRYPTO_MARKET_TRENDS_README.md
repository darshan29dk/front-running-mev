# Crypto Market Trends Module

## Overview
The Crypto Market Trends module is a new feature for the MEV Detector dApp that provides comprehensive cryptocurrency market data and analysis. This module displays real-time and historical cryptocurrency data with high clarity and visual appeal, following the design patterns of the existing application.

## Features
- Global market overview with key metrics
- Technical indicators (RSI, MACD, etc.)
- Trending cryptocurrencies leaderboard
- Historical price charts
- Fear & Greed Index
- Altcoin season indicator

## Setup Instructions

### 1. API Keys Configuration
To use the Crypto Market Trends module, you need to obtain API keys from the following services:

1. **CoinMarketCap API**
   - Sign up at [CoinMarketCap API](https://coinmarketcap.com/api/)
   - Get your API key from the dashboard

2. **CoinGecko API** (Optional)
   - Sign up at [CoinGecko API](https://www.coingecko.com/en/api)
   - Get your API key for enhanced data

### 2. Environment Variables
Add the following environment variables to your `.env` file in the `server` directory:

```env
# CoinMarketCap API Key (required)
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key_here

# CoinGecko API Key (optional)
COINGECKO_API_KEY=your_coingecko_api_key_here
```

### 3. Installation
The module is already integrated into the codebase. Make sure to install all dependencies:

```bash
# In the server directory
cd server
npm install

# In the mev-detector directory
cd ../mev-detector
npm install
```

### 4. Running the Application
Start both the backend and frontend servers:

```bash
# Start the backend server (in server directory)
cd server
npm run dev

# Start the frontend (in mev-detector directory)
cd ../mev-detector
npm start
```

## Module Components

### Frontend
- **Component**: `mev-detector/src/components/CryptoMarketTrends.js`
- **Navigation**: Added as a new tab in the main navigation
- **API Integration**: Connects to backend endpoints at `/api/crypto/*`

### Backend
- **Service**: `server/src/services/cryptoMarketService.ts`
- **Routes**: Added new endpoints in `server/src/routes/api.ts`
- **Types**: Extended `server/src/types.ts` with cryptocurrency data interfaces

## API Endpoints

### Global Market Metrics
```
GET /api/crypto/global-metrics
```
Returns global cryptocurrency market metrics including total market cap, 24h volume, and coin dominance.

### Cryptocurrency Listings
```
GET /api/crypto/listings?limit=100&sort=market_cap&sort_dir=desc
```
Returns a list of cryptocurrencies with detailed market data.

### Historical Data
```
GET /api/crypto/historical?symbol=BTC&time_start=2023-01-01&time_end=2023-12-31
```
Returns historical price and volume data for a specific cryptocurrency.

### Technical Indicators
```
GET /api/crypto/indicators?symbol=BTC&indicator=rsi&period=14
```
Returns technical indicators for a specific cryptocurrency.

### Trending Coins
```
GET /api/crypto/trending
```
Returns currently trending cryptocurrencies.

### Fear & Greed Index
```
GET /api/crypto/fear-greed
```
Returns the current Fear & Greed Index for the cryptocurrency market.

## Caching
The module implements caching to improve performance and reduce API calls:
- Client-side caching with React Query
- Server-side caching with in-memory cache (5-minute expiry)

## Error Handling
The module includes comprehensive error handling:
- Fallback to mock data when APIs are unavailable
- User-friendly error messages
- Automatic retry mechanisms

## Customization
You can customize the module by modifying:
- Time ranges in the frontend component
- Displayed cryptocurrencies
- Technical indicators
- Chart types and visualizations

## Troubleshooting

### No Data Displayed
1. Check that API keys are correctly configured in environment variables
2. Verify that the backend server is running
3. Check the browser console for any errors

### API Rate Limits
1. The module includes caching to reduce API calls
2. If you hit rate limits, consider upgrading your API plan

### Performance Issues
1. The module is optimized for performance with caching
2. Reduce the number of displayed items if needed

## Future Enhancements
- Integration with more data sources
- Advanced charting capabilities
- Custom alerts for market conditions
- Portfolio tracking features
- Export functionality for reports

## Support
For issues with the Crypto Market Trends module, please check the console logs for error messages and ensure all API keys are correctly configured.