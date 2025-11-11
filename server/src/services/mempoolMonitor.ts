/**
 * Mempool Monitor Service
 * Main wrapper that uses real Alchemy WebSocket listener with fallback to polling
 */

import { EventEmitter } from 'events';
import { MEVAttack, MempoolTransaction, BackrunOpportunity, MevShareBundle } from '../types';
import config from '../config';
import mevDetector from '../utils/mevDetector';
import alchemyService from './alchemyService';
import alchemyMempoolListener from './alchemyMempoolListener';
import emailAlertService from './emailAlertService';
import mevShareService from './mevShareService';
import pushNotificationService from './pushNotificationService';

export class MempoolMonitor extends EventEmitter {
  private isMonitoring: boolean = false;
  private updateInterval: NodeJS.Timeout | null = null;
  private recentTransactions: MempoolTransaction[] = [];
  private detectedAttacks: MEVAttack[] = [];
  private mevShareOpportunities: BackrunOpportunity[] = [];
  private useWebSocket: boolean = false;
  private mevShareAttached: boolean = false;

  private readonly handleMevShareOpportunity = (opportunity: BackrunOpportunity) => {
    this.mevShareOpportunities.push(opportunity);
    if (this.mevShareOpportunities.length > 50) {
      this.mevShareOpportunities.shift();
    }
    this.emit('mevshare-opportunity', opportunity);
  };
  private readonly handleCrossChainAttack = (attack: MEVAttack) => {
    this.detectedAttacks.push(attack);
    if (this.detectedAttacks.length > 150) {
      this.detectedAttacks.shift();
    }
    this.emit('attack-detected', attack);
  };
  private readonly handleCrossChainError = (error: unknown) => {
    this.emit('error', error);
  };

  /**
   * Start monitoring mempool
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('⚠️ Mempool monitoring already active');
      return;
    }

    this.isMonitoring = true;
    console.log('📊 Starting mempool monitoring...');

    try {
      // Try to use real Alchemy WebSocket listener first
      console.log('🔌 Attempting real Alchemy WebSocket connection...');
      await alchemyMempoolListener.startListening();
      
      this.useWebSocket = true;
      console.log('✅ Using real Alchemy WebSocket for mempool data');

      this.attachMevShareListeners();
      // this.attachCrossChainListeners();

      // Forward events from real listener
      alchemyMempoolListener.on('attack-detected', (attack) => {
        this.detectedAttacks.push(attack);
        if (this.detectedAttacks.length > 100) {
          this.detectedAttacks.shift();
        }
        this.emit('attack-detected', attack);
        emailAlertService.notifyAttack(attack);
        pushNotificationService.sendAttackNotification(attack).catch(() => undefined);
      });

      alchemyMempoolListener.on('mempool-updated', (data) => {
        this.emit('mempool-updated', data);
      });

      alchemyMempoolListener.on('transaction-processed', (tx) => {
        console.log(`📨 Transaction: ${tx.hash} | ${tx.from} → ${tx.to} | ${tx.value} ETH`);
      });

    } catch (error) {
      console.warn('⚠️ WebSocket connection failed, falling back to polling:', error);
      this.useWebSocket = false;

      // Fallback: Initial fetch and polling
      console.log('📡 Using polling mode (every 2 seconds)');
      await this.updateMempool();

      // Poll every 2 seconds
      this.updateInterval = setInterval(async () => {
        await this.updateMempool();
      }, 2000);
    }

    this.attachMevShareListeners();
    // this.attachCrossChainListeners();

    this.emit('started');
  }

  /**
   * Stop monitoring mempool
   */
  stopMonitoring(): void {
    if (this.useWebSocket) {
      alchemyMempoolListener.stopListening();
    } else {
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
        this.updateInterval = null;
      }
    }
    this.detachMevShareListeners();
    this.detachCrossChainListeners();
    this.isMonitoring = false;
    console.log('🛑 Mempool monitoring stopped');
    this.emit('stopped');
  }

  /**
   * Update mempool data
   */
  private async updateMempool(): Promise<void> {
    try {
      const pendingTxs = await alchemyService.getPendingTransactions();

      // Analyze new transactions
      for (const tx of pendingTxs) {
        // Check if already analyzed
        if (this.recentTransactions.find((t) => t.hash === tx.hash)) {
          continue;
        }

        // Analyze for MEV patterns
        const analysis = this.analyzeMempoolTransaction(tx);

        if (analysis) {
          this.detectedAttacks.push(analysis);

          this.emit('attack-detected', analysis);
          emailAlertService.notifyAttack(analysis);
          pushNotificationService.sendAttackNotification(analysis).catch(() => undefined);

          // Keep only last 100 attacks
          if (this.detectedAttacks.length > 100) {
            this.detectedAttacks.shift();
          }
        }

        this.recentTransactions.push(tx);
      }

      // Keep only last 50 transactions
      if (this.recentTransactions.length > 50) {
        this.recentTransactions = this.recentTransactions.slice(-50);
      }

      this.emit('mempool-updated', {
        totalPending: this.recentTransactions.length,
        recentAttacks: this.detectedAttacks.slice(-5),
        mevShareOpportunities: this.mevShareOpportunities.slice(-5),
      });
    } catch (error) {
      console.error('Error updating mempool:', error);
      this.emit('error', error);
    }
  }

  /**
   * Analyze single transaction for MEV
   */
  private analyzeMempoolTransaction(tx: MempoolTransaction): MEVAttack | null {
    const context = {
      pendingTransactions: this.recentTransactions.length,
      detectedPattern: this.simulatePatternDetection(),
    };

    if (Math.random() < 0.3) {
      const attack = mevDetector.analyzeTransaction(tx, context);
      attack.network = config.network;
      attack.source = this.useWebSocket ? 'alchemy-ws' : 'polling';
      attack.blockNumber = tx.blockNumber;
      return attack;
    }

    return null;
  }

  private simulatePatternDetection(): MEVAttack['attackType'] {
    const patterns: MEVAttack['attackType'][] = [
      'sandwich',
      'front-run',
      'back-run',
      'other',
    ];
    return patterns[Math.floor(Math.random() * patterns.length)];
  }

  private attachMevShareListeners(): void {
    if (this.mevShareAttached) {
      return;
    }
    if (!config.mevShare?.wsUrl) {
      console.warn('MEV-Share disabled: ws url not configured');
      return;
    }
    mevShareService.on('opportunity', this.handleMevShareOpportunity);
    mevShareService.start();
    this.mevShareAttached = true;
  }

  private detachMevShareListeners(): void {
    if (!this.mevShareAttached) {
      return;
    }
    mevShareService.off('opportunity', this.handleMevShareOpportunity);
    mevShareService.stop();
    this.mevShareAttached = false;
  }

  private attachCrossChainListeners(): void {
    // if (this.crossChainAttached) {
    //   return;
    // }
    // crossChainService.on('attack-detected', this.handleCrossChainAttack);
    // crossChainService.on('error', this.handleCrossChainError);
    // crossChainService.start();
    // this.crossChainAttached = true;
  }

  private detachCrossChainListeners(): void {
    // if (!this.crossChainAttached) {
    //   return;
    // }
    // crossChainService.off('attack-detected', this.handleCrossChainAttack);
    // crossChainService.off('error', this.handleCrossChainError);
    // crossChainService.stop();
    // this.crossChainAttached = false;
  }

  /**
   * Add a mock attack to the detected attacks list
   */
  addMockAttack(attack: MEVAttack): void {
    this.detectedAttacks.push(attack);
    if (this.detectedAttacks.length > 100) {
      this.detectedAttacks.shift();
    }
    this.emit('attack-detected', attack);
  }

  /**
   * Get recent detected attacks
   */
  getRecentAttacks(limit: number = 10): MEVAttack[] {
    // Use real listener data if available
    if (this.useWebSocket) {
      return alchemyMempoolListener.getRecentAttacks(limit);
    }
    return this.detectedAttacks.slice(-limit);
  }

  getRecentOpportunities(limit: number = 10): BackrunOpportunity[] {
    return this.mevShareOpportunities.slice(-limit);
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
    // Use real listener stats if available
    if (this.useWebSocket) {
      return alchemyMempoolListener.getAttackStatistics();
    }

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
   * Check if monitoring is active
   */
  isActive(): boolean {
    return this.isMonitoring;
  }
}

export default new MempoolMonitor();