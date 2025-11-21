# Getting Started with MEV Detector - Crypto Market Analysis

This guide will help you get the MEV Detector application running with real cryptocurrency market data.

## Prerequisites

1. **Node.js** (version 16 or higher)
2. **npm** (usually comes with Node.js)
3. **Git** (optional, for cloning the repository)

## Step 1: Obtain API Keys

To display real market data instead of mock data, you'll need API keys from:

### CoinMarketCap (Required)
1. Visit [CoinMarketCap API](https://coinmarketcap.com/api/)
2. Click "Get Your Free API Key Today"
3. Sign up for an account or log in
4. Copy your API key from the dashboard

### CoinGecko (Optional but Recommended)
1. Visit [CoinGecko API](https://www.coingecko.com/en/api)
2. Sign up for an account or log in
3. Navigate to your API dashboard
4. Generate a new API key
5. Copy the API key

## Step 2: Configure Environment Variables

1. Open the file `server/.env` in a text editor
2. Add or update the following lines with your actual API keys:
   ```
   COINMARKETCAP_API_KEY=your_actual_coinmarketcap_api_key_here
   COINGECKO_API_KEY=your_actual_coingecko_api_key_here
   ```
3. Save the file

## Step 3: Install Dependencies

### Backend Dependencies
1. Open a terminal/command prompt
2. Navigate to the `server` directory:
   ```
   cd server
   ```
3. Install dependencies:
   ```
   npm install
   ```

### Frontend Dependencies
1. Open a new terminal/command prompt
2. Navigate to the `mev-detector` directory:
   ```
   cd mev-detector
   ```
3. Install dependencies:
   ```
   npm install
   ```

## Step 4: Start the Servers

### Start Backend Server
1. In the terminal with the `server` directory open, run:
   ```
   npm run dev
   ```
2. The backend server will start on port 3001

### Start Frontend Server
1. In the terminal with the `mev-detector` directory open, run:
   ```
   npm start
   ```
2. The frontend server will start on port 3000
3. If port 3000 is already in use, it will ask if you want to use another port - press 'Y'

## Step 5: Access the Application

1. Open your web browser
2. Navigate to `http://localhost:3000` (or the alternative port if you selected one)
3. You should see the MEV Detector dashboard

## Step 6: View Market Analysis

1. In the navigation bar, click on the "Market Analysis" tab (represented by a 📈 icon)
2. You should now see real cryptocurrency market data instead of mock data
3. The data will automatically refresh every 5 minutes

## Troubleshooting

### No Real Data Displayed
- Check that your API keys are correctly added to `server/.env`
- Verify that both servers are running without errors
- Check the browser's developer console for any error messages
- Restart both servers after making changes to the `.env` file

### Port Conflicts
- If port 3001 is already in use, you can change it in `server/.env`:
  ```
  PORT=3005
  ```
- Update the frontend configuration in `mev-detector/.env` to match:
  ```
  REACT_APP_API_URL=http://localhost:3005
  ```

### Dependency Installation Issues
- Make sure you're using Node.js version 16 or higher
- Try deleting `node_modules` folders and `package-lock.json` files, then reinstall dependencies
- Check your internet connection as some dependencies are quite large

## Features in the Market Analysis Tab

The Market Analysis tab includes several sections:

1. **Market Overview**: Shows total market cap, 24h volume, Bitcoin dominance, and active cryptocurrencies
2. **Market Sentiment**: Displays Fear & Greed Index and Altcoin Season indicators
3. **Top Cryptocurrencies**: Lists major cryptocurrencies with price, volume, and performance data
4. **Technical Indicators**: Shows RSI values and Moving Averages for Bitcoin and Ethereum
5. **Trending Coins**: Displays top gainers and losers with 24h performance
6. **ETF Flows**: Tracks cryptocurrency ETF inflows and outflows
7. **Gas Fees**: Shows current gas fees for Ethereum, Polygon, and Avalanche networks

## Support

If you encounter any issues:
1. Check the console logs in both terminals for error messages
2. Verify that your API keys are valid and correctly configured
3. Ensure both backend and frontend servers are running
4. Refer to the documentation files in the project root directory for more detailed information