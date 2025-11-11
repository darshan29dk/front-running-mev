/**
 * Real Alchemy Mempool Listener
 * Uses Alchemy WebSocket API for real-time mempool monitoring
 */

import { Alchemy, Network, AlchemySubscription } from 'alchemy-sdk';
import { EventEmitter } from 'events';
import config from '../config';
import { MempoolTransaction, MEVAttack } from '../types';
import mevDetector from '../utils/mevDetector';

const DEX_FUNCTION_SELECTORS = [
  '0x38ed1739', // swapExactTokensForTokens
  '0x18cbafe5', // swapExactETHForTokens
  '0x5c11d795', // swapExactTokensForETHSupportingFeeOnTransferTokens
  '0x7ff36ab5', // swapExactETHForTokensSupportingFeeOnTransferTokens
  '0x414bf389', // exactInput (Uni V3)
  '0xb858183f', // exactOutput (Uni V3)
];

const KNOWN_DEX_TARGETS = new Set(
  [
    '0x7a250d5630b4cf539739df2c5dacb4c659f2488d', // Uniswap V2 Router
    '0xe592427a0aece92dde3edee1f18e0157c05861564', // Uniswap V3 Router
    '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45', // Uniswap V3 Universal Router
    '0x1111111254eeb25477b68fb85ed929f73a960582', // 1inch Aggregation Router
    '0xdef1c0ded9bec7f1a1670819833240f027b25eff', // 0x Exchange Proxy
    '0x188c37db9afa8940ffb0af28540dcdf6f53d91eb', // CoW Protocol Settlement
  ].map((addr) => addr.toLowerCase())
);

export class AlchemyMempoolListener extends EventEmitter {
  private alchemy: Alchemy;
  private isListening: boolean = false;
  // Alchemy ws subscription return type can vary; keep flexible to avoid strict typing issues
  private unsubscribe: any = null;
  private networkMap: { [key: string]: Network } = {
    sepolia: Network.ETH_SEPOLIA,
    mainnet: Network.ETH_MAINNET,
    polygon: Network.MATIC_MAINNET,
    arbitrum: Network.ARB_MAINNET,
  };
  private recentTransactions: Map<string, MempoolTransaction> = new Map();
  private detectedAttacks: MEVAttack[] = [];

  constructor() {
    super();
    const network = this.networkMap[config.network] || Network.ETH_SEPOLIA;
    this.alchemy = new Alchemy({
      apiKey: config.alchemyKey,
      network,
    });
  }

  /**
   * Start listening to mempool via WebSocket
   */
  async startListening(): Promise<void> {
    if (this.isListening) {
      console.log('⚠️ Already listening to mempool');
      return;
    }

    try {
      if (!config.alchemyKey) {
        throw new Error('Alchemy API key missing - set ALCHEMY_API_KEY to enable real-time mempool listening');
      }

      console.log('🔌 Connecting to Alchemy mempool via WebSocket...');
      this.isListening = true;

      const handler = async (txResponse: any) => {
        try {
          await this.processPendingTransaction(txResponse);
        } catch (error) {
          console.error('Error processing pending transaction:', error);
        }
      };

      this.unsubscribe = this.alchemy.ws.on(AlchemySubscription.PENDING_TRANSACTIONS, handler);

      console.log('✅ Mempool listener started successfully');
      this.emit('started', { timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('❌ Error starting mempool listener:', error);
      this.isListening = false;
      this.emit('error', error);
    }
  }

  /**
   * Stop listening to mempool
   */
  stopListening(): void {
    // Unsubscribe safely - alchemy-sdk may return different shapes for the subscription handle
    try {
      if (typeof this.unsubscribe === 'function') {
        this.unsubscribe();
      } else if (this.unsubscribe && typeof this.unsubscribe.unsubscribe === 'function') {
        this.unsubscribe.unsubscribe();
      } else if (this.unsubscribe && typeof this.unsubscribe.remove === 'function') {
        this.unsubscribe.remove();
      }
    } catch (err) {
      console.warn('Warning: error while unsubscribing from Alchemy ws:', err);
    } finally {
      this.unsubscribe = null;
    }
    this.isListening = false;
    console.log('🛑 Mempool listener stopped');
    this.emit('stopped', { timestamp: new Date().toISOString() });
  }

  /**
   * Process incoming pending transaction
   */
  private async processPendingTransaction(txResponse: any): Promise<void> {
    try {
      // Parse transaction data
      const tx: MempoolTransaction = {
        hash: txResponse.hash || txResponse.transactionHash,
        from: txResponse.from || '',
        to: txResponse.to || '',
        value: txResponse.value || '0',
        gasPrice: txResponse.gasPrice || txResponse.maxFeePerGas || '0',
        maxFeePerGas: txResponse.maxFeePerGas,
        maxPriorityFeePerGas: txResponse.maxPriorityFeePerGas,
        input: txResponse.input,
        type: txResponse.type,
        gasLimit: txResponse.gas || txResponse.gasLimit || '21000',
        nonce: parseInt(txResponse.nonce || '0'),
        blockNumber: parseInt(txResponse.blockNumber || '0'),
        timestamp: Math.floor(Date.now() / 1000),
      };

      // Store recent transaction
      this.recentTransactions.set(tx.hash, tx);

      // Keep only last 1000 transactions in memory
      if (this.recentTransactions.size > 1000) {
        const firstKey = this.recentTransactions.keys().next().value as string | undefined;
        if (firstKey) this.recentTransactions.delete(firstKey as string);
      }

      // Analyze for MEV patterns with higher probability on testnet
      const context = {
        pendingTransactions: this.recentTransactions.size,
        detectedPattern: this.detectMEVPattern(tx),
        recentTxs: Array.from(this.recentTransactions.values()),
        maxFeePerGas: tx.maxFeePerGas,
        maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
        type: tx.type,
      };

      const pattern = context.detectedPattern;
      if (pattern) {
        const attack = mevDetector.analyzeTransaction(tx, context);
        this.detectedAttacks.push(attack);

        // Keep only last 500 attacks
        if (this.detectedAttacks.length > 500) {
          this.detectedAttacks.shift();
        }

        this.emit('attack-detected', attack);
        this.emit('mev-pattern-detected', {
          hash: attack.hash,
          attackType: attack.attackType,
          riskScore: attack.riskScore,
          timestamp: attack.timestamp,
        });
      }

      // Emit transaction processed
      this.emit('transaction-processed', {
        hash: tx.hash,
        from: tx.from ? tx.from.substring(0, 10) + '...' : 'unknown',
        to: tx.to ? tx.to.substring(0, 10) + '...' : 'unknown',
        value: (parseInt(tx.value) / 1e18).toFixed(4),
        gasPrice: (parseInt(tx.gasPrice) / 1e9).toFixed(2),
      });

      // Emit mempool update every 10 transactions
      if (this.recentTransactions.size % 10 === 0) {
        const avgGasPrice = Array.from(this.recentTransactions.values()).reduce((sum, current) => {
          return sum + parseInt(current.gasPrice || '0');
        }, 0) / Math.max(1, this.recentTransactions.size);

        this.emit('mempool-updated', {
          totalPending: this.recentTransactions.size,
          recentAttacks: this.detectedAttacks.slice(-5),
          lastProcessed: tx.hash,
          avgGasPrice: (avgGasPrice / 1e9).toFixed(2),
        });
      }
    } catch (error) {
      console.error('Error processing transaction:', error);
    }
  }

  /**
   * Detect MEV patterns in transaction
   */
  private detectMEVPattern(
    tx: MempoolTransaction
  ): 'sandwich' | 'front-run' | 'back-run' | 'other' | null {
    // Check recent transactions for patterns
    const recentTxs = Array.from(this.recentTransactions.values()).slice(-50);

    // Check for sandwich attack (high gas, same target)
    if (!tx.to) {
      return null;
    }

    const txTo = tx.to.toLowerCase();
    const isDexTarget = KNOWN_DEX_TARGETS.has(txTo);

    const isDexFunction = tx.input ? DEX_FUNCTION_SELECTORS.includes(tx.input.slice(0, 10)) : false;

    const recentDexTxs = recentTxs.filter((otherTx) => otherTx.to && otherTx.to.toLowerCase() === txTo);

    const highGasThreshold = parseInt(tx.gasPrice) * 1.2;
    const highValueThreshold = parseInt(tx.value) * 1.1;

    // Sandwich detection: same target, higher gas before and after victim, dex function call
    if (isDexTarget && isDexFunction) {
      const attackerBefore = recentDexTxs.find(
        (otherTx) =>
          parseInt(otherTx.gasPrice) > highGasThreshold &&
          otherTx.timestamp <= tx.timestamp &&
          otherTx.hash !== tx.hash
      );

      const attackerAfter = Array.from(this.recentTransactions.values()).find(
        (otherTx) =>
          otherTx !== tx &&
          otherTx.to &&
          otherTx.to.toLowerCase() === txTo &&
          parseInt(otherTx.gasPrice) > parseInt(tx.gasPrice) &&
          otherTx.timestamp > tx.timestamp
      );

      if (attackerBefore && attackerAfter) {
        return 'sandwich';
      }
    }

    // Front-run detection: same target, significantly higher gas, similar value, dex interaction
    const frontRunner = recentDexTxs.find(
      (otherTx) =>
        otherTx.hash !== tx.hash &&
        parseInt(tx.gasPrice) > parseInt(otherTx.gasPrice) * 1.3 &&
        Math.abs(parseInt(tx.value) - parseInt(otherTx.value)) < highValueThreshold &&
        Math.abs(tx.timestamp - otherTx.timestamp) <= 60
    );

    if (frontRunner && isDexFunction) {
      return 'front-run';
    }

    // Back-run detection: same target, high gas following victim
    const backRunner = Array.from(this.recentTransactions.values()).find(
      (otherTx) =>
        otherTx !== tx &&
        otherTx.to &&
        otherTx.to.toLowerCase() === txTo &&
        parseInt(otherTx.gasPrice) >= parseInt(tx.gasPrice) &&
        otherTx.timestamp >= tx.timestamp &&
        Math.abs(otherTx.timestamp - tx.timestamp) <= 120
    );

    if (backRunner && isDexFunction) {
      return 'back-run';
    }

    if (isDexTarget || isDexFunction) {
      return 'other';
    }

    return null;
  }

  /**
   * Get recent detected attacks
   */
  getRecentAttacks(limit: number = 10): MEVAttack[] {
    return this.detectedAttacks.slice(-limit);
  }

  /**
   * Get attack statistics
   */
  getAttackStatistics(): {
    totalDetected: number;
    byType: {
      sandwich: number;
      'front-run': number;
      'back-run': number;
      other: number;
    };
    averageRiskScore: number;
    totalSlippageLoss: number;
  } {
    const stats = {
      totalDetected: this.detectedAttacks.length,
      byType: {
        sandwich: 0,
        'front-run': 0,
        'back-run': 0,
        other: 0,
      },
      averageRiskScore: 0,
      totalSlippageLoss: 0,
    };

    for (const attack of this.detectedAttacks) {
      stats.byType[attack.attackType]++;
      stats.averageRiskScore += attack.riskScore;
      stats.totalSlippageLoss += attack.slippageLoss;
    }

    if (this.detectedAttacks.length > 0) {
      stats.averageRiskScore /= this.detectedAttacks.length;
    }

    return stats;
  }

  /**
   * Get mempool stats
   */
  getMempoolStats(): {
    totalPending: number;
    totalDetected: number;
    avgGasPrice: number;
  } {
    const txs = Array.from(this.recentTransactions.values());
    const totalGasPrice = txs.reduce((sum, tx) => sum + parseInt(tx.gasPrice), 0);
    const avgGasPrice = txs.length > 0 ? (totalGasPrice / txs.length / 1e9) : 0;

    return {
      totalPending: txs.length,
      totalDetected: this.detectedAttacks.length,
      avgGasPrice: Math.round(avgGasPrice * 100) / 100,
    };
  }

  /**
   * Check if listening
   */
  isActive(): boolean {
    return this.isListening;
  }
}

export default new AlchemyMempoolListener();