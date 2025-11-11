/**
 * MEV Detector Type Definitions
 * Core types for MEV detection, attacks, and blockchain data
 */

export interface MEVAttack {
  hash: string;
  attackType: 'sandwich' | 'front-run' | 'back-run' | 'other';
  riskScore: number;
  slippageLoss: number;
  gasPrice: string;
  timestamp: string;
  attackerAddress?: string;
  victimAddress?: string;
  transactionDetails?: {
    from: string;
    to: string;
    value: string;
    gasLimit: string;
  };
  network?: string;
  source?: string;
  blockNumber?: number;
}

export interface UserProfile {
  id: string;
  address: string;
  alias: string;
  email?: string;
  points: number;
  level: number;
  badges: string[];
  createdAt: string;
  protectedTransactions: number;
  lastActiveAt: string;
  alerts?: {
    sandwich: boolean;
    frontrun: boolean;
    backrun: boolean;
    highGas: boolean;
    highSlippage: boolean;
  };
}

export interface RiskAssessment {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: {
    gasPrice: number;
    slippageRisk: number;
    mempoolCongestion: number;
    attackDetected: number;
  };
}

export interface MempoolTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  gasLimit: string;
  nonce: number;
  blockNumber: number;
  timestamp: number;
  input?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  type?: number;
}

export interface PrivateBundle {
  transactions: string[];
  blockNumber: number;
}

export interface FlashbotsBundle {
  success: boolean;
  bundleHash?: string;
  error?: string;
}

export interface EmailConfig {
  publicKey?: string;
  privateKey?: string;
  serviceId?: string;
  subscriptionTemplateId?: string;
  alertTemplateId?: string;
  apiUrl?: string;
}

export interface MevShareConfig {
  endpoint?: string;
  wsUrl?: string;
  apiKey?: string;
}

export interface CrossChainNetworkConfig {
  rpcUrl?: string;
  apiKey?: string;
}

export interface CrossChainConfig {
  pollIntervalMs: number;
  arbitrum?: CrossChainNetworkConfig;
  bsc?: CrossChainNetworkConfig;
  solana?: CrossChainNetworkConfig;
}

export interface Config {
  alchemyKey: string;
  port: number;
  network: string;
  alchemyEndpoint: string;
  flashbotsRelayUrl?: string;
  flashbotsProtectRpc?: string;
  privateKey?: string;
  databaseUrl?: string;
  jwtSecret?: string;
  email?: EmailConfig;
  mevShare?: MevShareConfig;
  crossChain?: CrossChainConfig;
}

export interface AttackStatistics {
  totalDetected: number;
  byType: {
    sandwich: number;
    'front-run': number;
    'back-run': number;
    other: number;
  };
  averageRiskScore: number;
  totalSlippageLoss: number;
}

export interface AnalyticsOverview {
  network: string;
  totalProfiles: number;
  activeProfiles: number;
  averageLevel: number;
  averagePoints: number;
  totalProtectedTransactions: number;
  attackStatistics: AttackStatistics;
  recentAttacks: MEVAttack[];
}

export interface PaymentPlan {
  id: string;
  name: string;
  description: string;
  priceUsd: number;
  currency: 'USD';
  features: string[];
}

export interface PaymentIntent {
  planId: string;
  amountUsd: number;
  currency: 'USD';
  status: 'pending' | 'completed' | 'rejected';
  reason?: string;
  processedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface MevShareBundle {
  id: string;
  bundleHash: string;
  transactions: string[];
  timestamp: string;
  builder?: string;
  target?: string;
  metadata?: Record<string, any>;
}

export interface BackrunOpportunity {
  bundleHash: string;
  targetTxHash?: string;
  expectedProfitUsd?: number;
  confidence: number;
  bundle: MevShareBundle;
  analysis: string;
  createdAt: string;
}

export interface DexPoolSnapshot {
  address: string;
  baseAsset: string;
  quoteAsset: string;
  baseReserve: number;
  quoteReserve: number;
  feeBps?: number;
  lastUpdated: number;
}

export interface PoolVolatilitySample {
  timestamp: number;
  price: number;
}

export interface TradeIntent {
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  side: 'buy' | 'sell';
}

export interface SlippageRecommendation {
  recommendedBps: number;
  aggressiveBps: number;
  conservativeBps: number;
  priceImpactBps: number;
  volatilityBps: number;
  confidence: number;
  reasoning: string[];
}

export interface BundleSimulationRequest {
  transactions: string[];
  targetBlock: number;
  stateBlockTag?: string;
  simulationTimestamp?: number;
  priorityFeeWei?: string;
  baseFeePerGasWei?: string;
  coinbaseOverride?: string;
}

export interface BundleSimulationResult {
  success: boolean;
  error?: string;
  bundleHash?: string;
  totalGasUsedWei?: string;
  gasFeesWei?: string;
  coinbaseDiffWei?: string;
  netProfitWei?: string;
  effectiveGasPriceWei?: string;
  details: string[];
}

export interface BundleOptimizationRequest extends BundleSimulationRequest {}

export interface BundleOptimizationResult {
  success: boolean;
  error?: string;
  simulation: BundleSimulationResult;
  recommendedPriorityFeeWei?: string;
  expectedNetProfitWei?: string;
  adjustments: Array<{ field: string; value: string; rationale: string }>;
  notes: string[];
}

export type PushPlatform = 'ios' | 'android' | 'web';

export interface PushRegistration {
  token: string;
  platform: PushPlatform;
  address?: string;
  label?: string;
  registeredAt: string;
}
