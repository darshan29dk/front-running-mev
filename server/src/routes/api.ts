/**
 * API Routes
 * Main API endpoints for MEV detection and protection
 */

import express, { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { Transaction } from 'ethers';
import mempoolMonitor from '../services/mempoolMonitor';
import alchemyService from '../services/alchemyService';
import flashbotsService from '../services/flashbotsService';
import mevDetector from '../utils/mevDetector';
import emailAlertService from '../services/emailAlertService';
import {
  ApiResponse,
  MEVAttack,
  UserProfile,
  AnalyticsOverview,
  PaymentPlan,
  PaymentIntent,
  AttackStatistics,
  DexPoolSnapshot,
  PoolVolatilitySample,
  TradeIntent,
  SlippageRecommendation,
  BundleSimulationRequest,
  BundleOptimizationRequest,
  PushPlatform,
  PushRegistration,
} from '../types';
import pushNotificationService from '../services/pushNotificationService';
import cryptoMarketService from '../services/cryptoMarketService';

const router = Router();

const userProfiles = new Map<string, UserProfile>();
const addressIndex = new Map<string, string>();

const normalizeAddress = (address?: string): string => {
  if (address && typeof address === 'string' && address.trim().length > 0) {
    const hashed = createHash('sha256').update(address.toLowerCase()).digest('hex').slice(0, 40);
    return `0x${hashed}`;
  }
  return `0x${randomBytes(20).toString('hex')}`;
};

const defaultAlertsState = () => ({
  sandwich: false,
  frontrun: false,
  backrun: false,
  highGas: false,
  highSlippage: false,
});

const recalcLevel = (profile: UserProfile) => {
  profile.level = Math.max(1, 1 + Math.floor(profile.points / 1000));
};

const paymentPlans: PaymentPlan[] = [
  {
    id: 'free',
    name: 'Free Tier',
    description: 'Core Ethereum MEV monitoring and alerts',
    priceUsd: 0,
    currency: 'USD',
    features: ['Real-time attack detection', 'Anonymous profile tracking', 'Flashbots protection simulation'],
  },
];

const paymentIntents: PaymentIntent[] = [];

const createAnonymousProfile = (address?: string): UserProfile => {
  const id = randomUUID();
  const alias = `anon-${id.split('-')[0]}`;
  const normalizedAddress = normalizeAddress(address || alias);
  const now = new Date().toISOString();
  const existingId = addressIndex.get(normalizedAddress);
  if (existingId) {
    const existingProfile = userProfiles.get(existingId);
    if (existingProfile) {
      existingProfile.lastActiveAt = now;
      return existingProfile;
    }
  }
  const profile: UserProfile = {
    id,
    address: normalizedAddress,
    alias,
    points: 0,
    level: 1,
    badges: ['early-access'],
    createdAt: now,
    protectedTransactions: 0,
    lastActiveAt: now,
    alerts: defaultAlertsState(),
  };
  recalcLevel(profile);
  userProfiles.set(id, profile);
  addressIndex.set(normalizedAddress, id);
  return profile;
};

const getProfileById = (profileId: string): UserProfile | undefined => userProfiles.get(profileId);

const getProfileByAddress = (address?: string): UserProfile => {
  const normalized = normalizeAddress(address);
  const profileId = addressIndex.get(normalized);
  if (profileId) {
    const existing = userProfiles.get(profileId);
    if (existing) {
      existing.lastActiveAt = new Date().toISOString();
      return existing;
    }
  }
  return createAnonymousProfile(address);
};

const summarizeProfiles = (): { total: number; active: number; averagePoints: number; totalProtected: number } => {
  const profiles = Array.from(userProfiles.values());
  const total = profiles.length;
  if (total === 0) {
    return { total: 0, active: 0, averagePoints: 0, totalProtected: 0 };
  }
  const now = Date.now();
  const active = profiles.filter((p) => now - new Date(p.lastActiveAt).getTime() < 1000 * 60 * 10).length;
  const averagePoints = profiles.reduce((sum, p) => sum + p.points, 0) / total;
  const totalProtected = profiles.reduce((sum, p) => sum + p.protectedTransactions, 0);
  return { total, active, averagePoints, totalProtected };
};

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'MEV Detector API is running',
    timestamp: new Date().toISOString(),
    status: mempoolMonitor.isActive() ? 'monitoring' : 'idle',
  });
});

/**
 * GET /api/attacks
 * Get recent detected MEV attacks
 */
router.get('/attacks', (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
  const attacks = mempoolMonitor.getRecentAttacks(limit);

  res.json({
    success: true,
    data: attacks,
    count: attacks.length,
    timestamp: new Date().toISOString(),
  } as ApiResponse<MEVAttack[]>);
});

/**
 * GET /api/attacks/statistics
 * Get MEV attack statistics
 */
router.get('/attacks/statistics', (req: Request, res: Response) => {
  const stats = mempoolMonitor.getAttackStatistics();

  res.json({
    success: true,
    data: stats,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/gas-prices
 * Get current gas prices
 */
router.get('/gas-prices', async (req: Request, res: Response) => {
  try {
    const gasPrices = await alchemyService.getGasPrices();

    res.json({
      success: true,
      data: gasPrices,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/analyze-transaction
 * Analyze a specific transaction for MEV risk
 */
router.post('/analyze-transaction', (req: Request, res: Response) => {
  try {
    const { txHash, from, to, value, gasPrice } = req.body;

    if (!txHash) {
      return res.status(400).json({
        success: false,
        error: 'txHash is required',
      });
    }

    const mockTx = {
      hash: txHash,
      from: from || '0x' + Math.random().toString(16).slice(2),
      to: to || '0x' + Math.random().toString(16).slice(2),
      value: value || '0',
      gasPrice: gasPrice || '50000000000',
      gasLimit: '21000',
      nonce: 0,
      blockNumber: 0,
      timestamp: Math.floor(Date.now() / 1000),
    };

    const context = {
      pendingTransactions: 50,
      detectedPattern: 'sandwich' as const,
    };

    const analysis = mevDetector.analyzeTransaction(mockTx, context);

    res.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/protect-transaction
 * Submit transaction for Flashbots protection
 */
router.post('/protect-transaction', async (req: Request, res: Response) => {
  try {
    const { txHex, simulateOnly, fast, privacyPreferences } = req.body;

    if (!txHex || typeof txHex !== 'string' || !txHex.startsWith('0x')) {
      return res.status(400).json({
        success: false,
        error: 'txHex (0x-prefixed) is required',
      });
    }

    let parsedTx: Transaction;
    try {
      parsedTx = Transaction.from(txHex);
    } catch (parseErr: any) {
      return res.status(400).json({
        success: false,
        error: `Invalid transaction hex: ${parseErr?.message || 'unable to decode'}`,
      });
    }

    if (simulateOnly) {
      const simulation = await flashbotsService.simulateProtection({
        value: parsedTx.value?.toString(),
        gasPrice: parsedTx.gasPrice?.toString(),
        gasLimit: parsedTx.gasLimit?.toString(),
        maxFeePerGas: parsedTx.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: parsedTx.maxPriorityFeePerGas?.toString(),
      });
      return res.json({
        success: true,
        data: simulation,
        timestamp: new Date().toISOString(),
      });
    }

    const result = await flashbotsService.submitPrivateTransaction(txHex, {
      fast,
      privacyPreferences,
    });

    res.json({
      success: result.success,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/bundle/:bundleHash/status
 * Get bundle execution status
 */
router.get('/bundle/:bundleHash/status', async (req: Request, res: Response) => {
  try {
    const status = await flashbotsService.getBundleStatus(req.params.bundleHash);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Bundle not found',
      });
    }

    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/bundles/simulate
 * Simulate MEV bundle profitability using Flashbots builder API
 */
router.post('/bundles/simulate', async (req: Request, res: Response) => {
  try {
    const payload: BundleSimulationRequest = req.body;

    if (!payload || !Array.isArray(payload.transactions) || payload.transactions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'transactions array is required',
      });
    }

    if (typeof payload.targetBlock !== 'number' || payload.targetBlock <= 0) {
      return res.status(400).json({ success: false, error: 'targetBlock must be positive number' });
    }

    const result = await flashbotsService.simulateBundle(payload);

    res.json({
      success: result.success,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/bundles/optimize
 * Simulate and recommend optimizations for MEV bundles
 */
router.post('/bundles/optimize', async (req: Request, res: Response) => {
  try {
    const payload: BundleOptimizationRequest = req.body;

    if (!payload || !Array.isArray(payload.transactions) || payload.transactions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'transactions array is required',
      });
    }

    if (typeof payload.targetBlock !== 'number' || payload.targetBlock <= 0) {
      return res.status(400).json({ success: false, error: 'targetBlock must be positive number' });
    }

    const result = await flashbotsService.optimizeBundle(payload);

    res.json({
      success: result.success,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/mobile/push-token
 * Register Expo push token for mobile alerts
 */
router.post('/mobile/push-token', (req: Request, res: Response) => {
  try {
    const { token, platform, address, label } = req.body || {};
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, error: 'token is required' });
    }
    const normalized = typeof platform === 'string' ? (platform.toLowerCase() as PushPlatform) : undefined;
    const validPlatforms: PushPlatform[] = ['ios', 'android', 'web'];
    if (!normalized || !validPlatforms.includes(normalized)) {
      return res.status(400).json({ success: false, error: 'platform must be ios, android, or web' });
    }
    const stored = pushNotificationService.registerToken(token, {
      platform: normalized,
      address: typeof address === 'string' ? address : undefined,
      label: typeof label === 'string' ? label : undefined,
    });
    const registration: PushRegistration = {
      token,
      platform: normalized,
      address: stored.address,
      label: stored.label,
      registeredAt: stored.updatedAt,
    };
    res.json({
      success: true,
      data: registration,
      timestamp: new Date().toISOString(),
    } as ApiResponse<PushRegistration>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/mobile/push-token', (req: Request, res: Response) => {
  const { token } = req.body || {};
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ success: false, error: 'token is required' });
  }
  const removed = pushNotificationService.unregisterToken(token);
  res.json({
    success: true,
    data: { removed },
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /api/alerts/subscribe
 * Subscribe user to email alerts
 */
router.post('/alerts/subscribe', async (req: Request, res: Response) => {
  try {
    const { email, alerts } = req.body || {};

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Valid email is required',
      });
    }

    const subscriber = await emailAlertService.subscribe(email, alerts || {});

    res.json({
      success: true,
      message: 'Successfully subscribed to alerts',
      data: subscriber,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/alerts/send-test
 * Send test email alert
 */
router.post('/alerts/send-test', async (req: Request, res: Response) => {
  try {
    const { email, testAttack } = req.body || {};

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Valid email is required',
      });
    }

    const sent = await emailAlertService.sendTestEmail(email, testAttack);

    if (!sent) {
      return res.status(503).json({
        success: false,
        error: 'Email service unavailable',
      });
    }

    res.json({
      success: true,
      message: 'Test alert email sent successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/status
 * Get overall system status
 */
router.get('/status', (req: Request, res: Response) => {
  const stats = mempoolMonitor.getAttackStatistics();

  res.json({
    success: true,
    data: {
      monitoring: mempoolMonitor.isActive(),
      recentAttacks: mempoolMonitor.getRecentAttacks(5),
      statistics: stats,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;

/**
 * GET /api/what-was-built
 * Return the contents of WHAT_WAS_BUILT.txt for display in the frontend
 */
router.get('/what-was-built', (req: Request, res: Response) => {
  try {
    const filePath = path.resolve(__dirname, '../../../WHAT_WAS_BUILT.txt');
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'WHAT_WAS_BUILT.txt not found' });
    }

    const content = fs.readFileSync(filePath, { encoding: 'utf-8' });
    // Return as plain text (frontend will render/format it)
    res.type('text/plain').send(content);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/attacks/trigger-mock
 * Trigger a synthetic attack event (for testing & frontend development)
 */
router.post('/attacks/trigger-mock', (req: Request, res: Response) => {
  try {
    const attack = {
      id: `mock-${Date.now()}`,
      hash: `0x${Math.random().toString(16).slice(2, 12)}`,
      attackType: req.body.attackType || 'sandwich',
      riskScore: req.body.riskScore || Math.floor(50 + Math.random() * 50),
      slippageLoss: req.body.slippageLoss || parseFloat((Math.random() * 5).toFixed(4)),
      gasPrice: req.body.gasPrice || 120,
      from: req.body.from || '0x' + Math.random().toString(16).slice(2, 42),
      to: req.body.to || '0x' + Math.random().toString(16).slice(2, 42),
      timestamp: Date.now(),
      meta: { mocked: true },
    };

    try {
      const mempoolMonitor = require('../services/mempoolMonitor').default;
      // Add to mempool monitor
      mempoolMonitor.addMockAttack(attack);
      
      // Also emit to alchemyMempoolListener if it's active
      if (mempoolMonitor.isActive()) {
        const alchemyMempoolListener = require('../services/alchemyMempoolListener').default;
        alchemyMempoolListener.detectedAttacks.push(attack);
        alchemyMempoolListener.emit('attack-detected', attack);
      }
    } catch (e) {
      console.warn('Could not add mock attack to mempoolMonitor:', e);
    }

    res.json({ success: true, data: attack, message: 'Mock attack triggered' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/slippage/recommendation', (req: Request, res: Response) => {
  try {
    const { pools, volatility, trade } = req.body || {};

    const parsedPools: DexPoolSnapshot[] = Array.isArray(pools)
      ? pools
          .map((pool: any) => ({
            address: typeof pool?.address === 'string' ? pool.address : 'unknown',
            baseAsset: typeof pool?.baseAsset === 'string' ? pool.baseAsset : '',
            quoteAsset: typeof pool?.quoteAsset === 'string' ? pool.quoteAsset : '',
            baseReserve: Number(pool?.baseReserve ?? 0),
            quoteReserve: Number(pool?.quoteReserve ?? 0),
            feeBps: pool?.feeBps !== undefined ? Number(pool.feeBps) : undefined,
            lastUpdated: Number(pool?.lastUpdated ?? Math.floor(Date.now() / 1000)),
          }))
          .filter(
            (pool: DexPoolSnapshot) =>
              pool.address.length > 0 &&
              pool.baseAsset.length > 0 &&
              pool.quoteAsset.length > 0 &&
              Number.isFinite(pool.baseReserve) &&
              Number.isFinite(pool.quoteReserve) &&
              pool.baseReserve >= 0 &&
              pool.quoteReserve >= 0
          )
      : [];

    const parsedVolatility: PoolVolatilitySample[] = Array.isArray(volatility)
      ? volatility
          .map((sample: any) => ({
            timestamp: Number(sample?.timestamp ?? Math.floor(Date.now() / 1000)),
            price: Number(sample?.price ?? 0),
          }))
          .filter(
            (sample: PoolVolatilitySample) =>
              Number.isFinite(sample.timestamp) &&
              Number.isFinite(sample.price) &&
              sample.timestamp > 0 &&
              sample.price > 0
          )
      : [];

    const tradeIntent: TradeIntent | null =
      trade && typeof trade === 'object'
        ? {
            tokenIn: String(trade.tokenIn || ''),
            tokenOut: String(trade.tokenOut || ''),
            amountIn: Number(trade.amountIn ?? 0),
            side: trade.side === 'sell' ? 'sell' : 'buy',
          }
        : null;

    if (!tradeIntent || !tradeIntent.tokenIn || !tradeIntent.tokenOut || !Number.isFinite(tradeIntent.amountIn)) {
      return res.status(400).json({ success: false, error: 'Valid trade intent is required.' });
    }

    const recommendation: SlippageRecommendation = mevDetector.recommendSlippageSettings(
      parsedPools,
      parsedVolatility,
      tradeIntent
    );

    res.json({
      success: true,
      data: {
        recommendation,
        metadata: {
          poolsAnalyzed: parsedPools.length,
          volatilitySamples: parsedVolatility.length,
          tradeIntent,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/simulate', async (req: Request, res: Response) => {
  try {
  const { from, to, value, gasPrice, gasLimit, data, network } = req.body;

    // Build a mock transaction object compatible with mevDetector
    const mockTx = {
      hash: `0x${Math.random().toString(16).slice(2, 18)}`,
      from: from || '0x' + Math.random().toString(16).slice(2, 42),
      to: to || '0x' + Math.random().toString(16).slice(2, 42),
      value: value ? (BigInt(Math.floor(parseFloat(value) * 1e18))).toString() : '0',
      gasPrice: gasPrice ? (BigInt(Math.floor(parseFloat(gasPrice) * 1e9))).toString() : '50000000000',
      gasLimit: gasLimit || '21000',
      nonce: 0,
      blockNumber: 0,
      timestamp: Math.floor(Date.now() / 1000),
      data: data || '0x',
    };

    // Get current mempool stats if available
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mempoolMonitor = require('../services/mempoolMonitor').default;
    const pending = mempoolMonitor.isActive() ? mempoolMonitor.getAttackStatistics().totalDetected : 0;

    const context = {
      pendingTransactions: pending,
      detectedPattern: 'other',
      network: network || 'sepolia',
    };

    const analysis = mevDetector.analyzeTransaction(mockTx, context);

    // Get Flashbots protection simulation estimate
    const flashbotsService = require('../services/flashbotsService').default;
    const protection = await flashbotsService.simulateProtection({ value: mockTx.value, gasPrice: mockTx.gasPrice, gasLimit: mockTx.gasLimit });

    // Estimate MEV profit roughly as fraction of slippage
    const mevProfit = parseFloat((analysis.slippageLoss * (0.1 + Math.random() * 0.4)).toFixed(4));

    res.json({
      success: true,
      data: {
        analysis,
        mevProfit,
        protection,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/reports/weekly
 * Return a mock weekly trend report (attacks over time) for email/in-app
 */
router.get('/reports/weekly', (req: Request, res: Response) => {
  try {
    const now = Date.now();
    const days = Array.from({ length: 7 }, (_, i) => {
      const ts = now - (6 - i) * 24 * 60 * 60 * 1000;
      return {
        day: new Date(ts).toISOString().slice(0, 10),
        attacks: Math.floor(Math.random() * 50),
        avgRisk: Math.floor(Math.random() * 60),
        totalSlippage: parseFloat((Math.random() * 200).toFixed(2)),
      };
    });

    res.json({ success: true, data: { days, generatedAt: new Date().toISOString() } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/crypto/global-metrics
 * Get global cryptocurrency market metrics
 */
router.get('/crypto/global-metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await cryptoMarketService.getGlobalMetrics();
    
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/crypto/listings
 * Get cryptocurrency listings with filters
 */
router.get('/crypto/listings', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    const sort = (req.query.sort as string) || 'market_cap';
    const sortDir = (req.query.sort_dir as string) || 'desc';
    
    const listings = await cryptoMarketService.getCryptocurrencyListings(limit, sort, sortDir);
    
    res.json({
      success: true,
      data: listings,
      count: listings.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/crypto/historical
 * Get historical data for a cryptocurrency
 */
router.get('/crypto/historical', async (req: Request, res: Response) => {
  try {
    const { symbol, time_start, time_end, interval } = req.query;
    
    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'symbol is required',
      });
    }
    
    const timeStart = (time_start as string) || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // Default to 30 days ago
    const timeEnd = (time_end as string) || new Date().toISOString();
    const intervalStr = (interval as string) || 'daily';
    
    const historicalData = await cryptoMarketService.getHistoricalData(
      symbol.toUpperCase(),
      timeStart,
      timeEnd,
      intervalStr
    );
    
    res.json({
      success: true,
      data: historicalData,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/crypto/indicators
 * Get technical indicators for a cryptocurrency
 */
router.get('/crypto/indicators', async (req: Request, res: Response) => {
  try {
    const { symbol, indicator, period } = req.query;
    
    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'symbol is required',
      });
    }
    
    if (!indicator || typeof indicator !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'indicator is required',
      });
    }
    
    const indicators = await cryptoMarketService.getTechnicalIndicators(
      symbol.toUpperCase(),
      indicator,
      period ? parseInt(period as string) : undefined
    );
    
    res.json({
      success: true,
      data: indicators,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/crypto/trending
 * Get trending cryptocurrencies
 */
router.get('/crypto/trending', async (req: Request, res: Response) => {
  try {
    const coin = (req.query.coin as string) || '';
    const trending = await cryptoMarketService.getTrendingCoins(coin);
    
    res.json({
      success: true,
      data: trending,
      count: trending.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/crypto/fear-greed
 * Get Fear & Greed Index
 */
router.get('/crypto/fear-greed', async (req: Request, res: Response) => {
  try {
    const index = await cryptoMarketService.getFearGreedIndex();
    
    res.json({
      success: true,
      data: {
        index,
        label: index >= 90 ? 'Extreme Greed' : 
              index >= 75 ? 'Greed' : 
              index >= 50 ? 'Neutral' : 
              index >= 25 ? 'Fear' : 
              'Extreme Fear',
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/crypto/etf-flows
 * Get ETF flow data
 */
router.get('/crypto/etf-flows', async (req: Request, res: Response) => {
  try {
    const etfData = await cryptoMarketService.getETFData();
    
    res.json({
      success: true,
      data: etfData,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/crypto/gas-fees
 * Get gas fee data for different networks
 */
router.get('/crypto/gas-fees', async (req: Request, res: Response) => {
  try {
    const gasFeeData = await cryptoMarketService.getGasFeeData();
    
    res.json({
      success: true,
      data: gasFeeData,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/crypto/volatility
 * Get volatility data for specified cryptocurrencies
 */
router.get('/crypto/volatility', async (req: Request, res: Response) => {
  try {
    const symbols = (req.query.symbols as string)?.split(',') || ['BTC', 'ETH'];
    const volatilityData = await cryptoMarketService.getVolatilityData(symbols);
    
    res.json({
      success: true,
      data: volatilityData,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/crypto/correlations
 * Get correlation data for specified assets
 */
router.get('/crypto/correlations', async (req: Request, res: Response) => {
  try {
    const assets = (req.query.assets as string)?.split(',') || ['BTC', 'ETH', 'SOL'];
    const correlationData = await cryptoMarketService.getCorrelationData(assets);
    
    res.json({
      success: true,
      data: correlationData,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/crypto/market-cycle
 * Get market cycle data
 */
router.get('/crypto/market-cycle', async (req: Request, res: Response) => {
  try {
    const marketCycleData = await cryptoMarketService.getMarketCycleData();
    
    res.json({
      success: true,
      data: marketCycleData,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/crypto/on-chain
 * Get on-chain analytics data for a specific cryptocurrency
 */
router.get('/crypto/on-chain', async (req: Request, res: Response) => {
  try {
    const symbol = (req.query.symbol as string) || 'BTC';
    const onChainData = await cryptoMarketService.getOnChainData(symbol.toUpperCase());
    
    res.json({
      success: true,
      data: onChainData,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/crypto/whale-activity
 * Get whale activity data for a specific cryptocurrency
 */
router.get('/crypto/whale-activity', async (req: Request, res: Response) => {
  try {
    const symbol = (req.query.symbol as string) || 'BTC';
    const whaleActivityData = await cryptoMarketService.getWhaleActivityData(symbol.toUpperCase());
    
    res.json({
      success: true,
      data: whaleActivityData,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/crypto/stablecoins
 * Get stablecoin data
 */
router.get('/crypto/stablecoins', async (req: Request, res: Response) => {
  try {
    const stablecoinData = await cryptoMarketService.getStablecoinData();
    
    res.json({
      success: true,
      data: stablecoinData,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/crypto/defi-metrics
 * Get DeFi metrics
 */
router.get('/crypto/defi-metrics', async (req: Request, res: Response) => {
  try {
    const defiMetrics = await cryptoMarketService.getDeFiMetrics();
    
    res.json({
      success: true,
      data: defiMetrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/crypto/mining-metrics
 * Get mining metrics for a specific cryptocurrency
 */
router.get('/crypto/mining-metrics', async (req: Request, res: Response) => {
  try {
    const coin = (req.query.coin as string) || 'BTC';
    const miningMetrics = await cryptoMarketService.getMiningMetrics(coin.toUpperCase());
    
    res.json({
      success: true,
      data: miningMetrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});