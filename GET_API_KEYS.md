# How to Get API Keys for Crypto Market Data

To enable real-time cryptocurrency market data in the MEV Detector application, you need to obtain API keys from CoinMarketCap and optionally CoinGecko.

## Getting CoinMarketCap API Key

1. Visit [CoinMarketCap API](https://coinmarketcap.com/api/)
2. Click "Get Your Free API Key Today" or "Sign Up"
3. Create an account or log in if you already have one
4. After logging in, go to your account dashboard
5. Find your API key in the "API Keys" section
6. Copy the API key

## Getting CoinGecko API Key (Optional but Recommended)

1. Visit [CoinGecko API](https://www.coingecko.com/en/api)
2. Click "Get Started" or "Sign Up"
3. Create an account or log in if you already have one
4. Navigate to your API dashboard
5. Generate a new API key
6. Copy the API key

## Configuring the Application

Once you have your API keys, update the `.env` file in the `server` directory:

```env
# CoinMarketCap API Key (required for real data)
COINMARKETCAP_API_KEY=your_actual_coinmarketcap_api_key_here

# CoinGecko API Key (optional but provides better data)
COINGECKO_API_KEY=your_actual_coingecko_api_key_here
```

Replace `your_actual_coinmarketcap_api_key_here` and `your_actual_coingecko_api_key_here` with your actual API keys.

## Free vs Paid Plans

- **CoinMarketCap**: Free plan allows 333 requests per day
- **CoinGecko**: Free plan allows 50 requests per minute

For production use, consider upgrading to paid plans for higher rate limits and more features.

## Testing Your API Keys

After configuring your API keys, restart the server and check the "Market Analysis" tab in the application. You should now see real market data instead of mock data.