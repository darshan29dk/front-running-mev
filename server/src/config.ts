/**
 * Configuration Management
 * Load and validate environment variables
 */

import { Config } from './types';

const apiKey = process.env.ALCHEMY_API_KEY || 'YOUR_ALCHEMY_API_KEY_HERE';
const mainnetBase = process.env.ALCHEMY_ENDPOINT_MAINNET || '';
const sepoliaBase = process.env.ALCHEMY_ENDPOINT_SEPOLIA || '';
const polygonBase = process.env.ALCHEMY_ENDPOINT_POLYGON || '';
const arbitrumBase = process.env.ALCHEMY_ENDPOINT_ARBITRUM || '';
const defaultEmailApiUrl = 'https://api.emailjs.com/api/v1.0/email/send';
const network = (process.env.NETWORK || 'sepolia').toLowerCase();
const baseByNetwork: Record<string, string> = {
  mainnet: mainnetBase,
  ethereum: mainnetBase,
  sepolia: sepoliaBase,
  polygon: polygonBase,
  arbitrum: arbitrumBase,
};
const alchemyBase = baseByNetwork[network] || sepoliaBase || mainnetBase;
const crossChainPollMs = parseInt(process.env.CROSSCHAIN_POLL_INTERVAL_MS || '15000');

const config: Config = {
  alchemyKey: apiKey,
  port: parseInt(process.env.PORT || '5000'),
  network,
  alchemyEndpoint: alchemyBase ? `${alchemyBase}${apiKey}` : '',
  flashbotsRelayUrl: process.env.FLASHBOTS_RELAY_URL || 'https://relay.flashbots.net',
  flashbotsProtectRpc: process.env.FLASHBOTS_PROTECT_RPC || 'https://rpc.flashbots.net',
  privateKey: process.env.PRIVATE_KEY,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  // New API keys for cryptocurrency market data
  coinMarketCapApiKey: process.env.COINMARKETCAP_API_KEY,
  coinGeckoApiKey: process.env.COINGECKO_API_KEY,
  email: {
    publicKey: process.env.EMAILJS_PUBLIC_KEY,
    privateKey: process.env.EMAILJS_PRIVATE_KEY,
    serviceId: process.env.EMAILJS_SERVICE_ID,
    subscriptionTemplateId: process.env.EMAILJS_TEMPLATE_ID_SUBSCRIPTION,
    alertTemplateId: process.env.EMAILJS_TEMPLATE_ID_ALERT,
    apiUrl: process.env.EMAILJS_API_URL || defaultEmailApiUrl,
  },
  mevShare: {
    endpoint: process.env.MEV_SHARE_ENDPOINT,
    wsUrl: process.env.MEV_SHARE_WS_URL,
    apiKey: process.env.MEV_SHARE_API_KEY,
  },
  crossChain: {
    pollIntervalMs: crossChainPollMs,
    arbitrum: {
      rpcUrl:
        process.env.ARBITRUM_RPC_URL || (arbitrumBase && apiKey ? `${arbitrumBase}${apiKey}` : undefined),
      apiKey: apiKey,
    },
    bsc: {
      rpcUrl: process.env.BSC_RPC_URL,
      apiKey: process.env.MORALIS_API_KEY,
    },
    solana: {
      rpcUrl: process.env.SOLANA_RPC_URL,
      apiKey: process.env.SOLANA_API_KEY || process.env.HELIUS_API_KEY,
    },
  },
};

export default config;