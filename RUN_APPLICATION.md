# MEV Detector - Crypto Market Analysis Module

## Overview
This module provides real-time cryptocurrency market data and analysis within the MEV Detector application. It displays global market metrics, trending cryptocurrencies, technical indicators, and more.

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation
1. Install backend dependencies:
   ```
   cd server
   npm install
   ```

2. Install frontend dependencies:
   ```
   cd ../mev-detector
   npm install
   ```

### API Keys Configuration
To use real market data, you need to obtain API keys:

1. **CoinMarketCap API** (Required)
   - Sign up at [CoinMarketCap API](https://coinmarketcap.com/api/)
   - Get your API key from the dashboard

2. **CoinGecko API** (Optional but recommended)
   - Sign up at [CoinGecko API](https://www.coingecko.com/en/api)
   - Get your API key for enhanced data

Add the following to `server/.env`:
```env
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key_here
COINGECKO_API_KEY=your_coingecko_api_key_here
```

### Running the Application

#### Method 1: Using the batch file (Windows only)
Double-click on `start-servers.bat` to start both servers automatically.

#### Method 2: Manual start
1. Start the backend server:
   ```
   cd server
   npm run dev
   ```
   The backend will run on port 3001.

2. Start the frontend server:
   ```
   cd ../mev-detector
   npm start
   ```
   The frontend will run on port 3000 by default. If that port is occupied, it will ask to use another port.

### Accessing the Application
- Frontend: http://localhost:3000 (or the port you selected)
- Backend API: http://localhost:3001
- Market Analysis tab: Navigate to the "Market Analysis" tab in the application

## Features
- Global market overview with key metrics
- Technical indicators (RSI, MACD, etc.)
- Trending cryptocurrencies leaderboard with sparkline charts
- Historical price charts
- Fear & Greed Index
- Altcoin season indicator
- ETF flows tracking
- Gas fee monitoring for multiple networks

## Troubleshooting
- If you see mock data instead of real data, check that your API keys are correctly configured
- If the servers won't start due to port conflicts, change the ports in the configuration
- Check the browser console and terminal outputs for any error messages

## Support
For issues with the Crypto Market Analysis module, please check the console logs for error messages and ensure all API keys are correctly configured.