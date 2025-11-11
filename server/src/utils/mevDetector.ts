/**
 * MEV Detection Engine
 * Analyzes transactions for MEV attack patterns
 */

import {
  DexPoolSnapshot,
  MEVAttack,
  MempoolTransaction,
  PoolVolatilitySample,
  RiskAssessment,
  SlippageRecommendation,
  TradeIntent,
} from '../types';

export class MEVDetector {
  detectSandwichAttack(transactions: MempoolTransaction[], victimTx: MempoolTransaction): boolean {
    const attackerBefore = transactions.some(
      (tx) =>
        tx.from === tx.to &&
        tx.gasPrice > victimTx.gasPrice &&
        tx.nonce < victimTx.nonce &&
        this.isSimilarTarget(tx.to, victimTx.to)
    );

    const attackerAfter = transactions.some(
      (tx) =>
        tx.from === tx.to &&
        tx.nonce > victimTx.nonce &&
        this.isSimilarTarget(tx.to, victimTx.to)
    );

    return attackerBefore && attackerAfter;
  }

  detectFrontRunning(attackerTx: MempoolTransaction, victimTx: MempoolTransaction): boolean {
    const attackerGasPrice = parseInt(attackerTx.gasPrice);
    const victimGasPrice = parseInt(victimTx.gasPrice);
    return (
      attackerTx.to === victimTx.to &&
      attackerGasPrice > victimGasPrice * 1.1 &&
      this.isSimilarValue(attackerTx.value, victimTx.value)
    );
  }

  detectBackRunning(victimTx: MempoolTransaction, attackerTx: MempoolTransaction): boolean {
    return (
      victimTx.to === attackerTx.to &&
      attackerTx.gasPrice >= victimTx.gasPrice &&
      attackerTx.timestamp > victimTx.timestamp
    );
  }

  calculateRiskScore(tx: MempoolTransaction, context: any): RiskAssessment {
    let score = 0;

    const normalGasPrice = 50;
    const gasPriceGwei = parseInt(tx.gasPrice) / 1e9;
    if (gasPriceGwei > normalGasPrice * 2) {
      score += 30;
    } else if (gasPriceGwei > normalGasPrice) {
      score += 15;
    }

    const txValueEth = parseInt(tx.value) / 1e18;
    if (txValueEth > 10) {
      score += 30;
    } else if (txValueEth > 1) {
      score += 15;
    }

    if (context.pendingTransactions > 100) {
      score += 20;
    } else if (context.pendingTransactions > 50) {
      score += 10;
    }

    if (this.matchesKnownPattern(tx)) {
      score += 20;
    }

    return {
      score: Math.min(score, 100),
      level: this.getLevel(Math.min(score, 100)),
      factors: {
        gasPrice: gasPriceGwei > normalGasPrice ? 10 : 5,
        slippageRisk: txValueEth > 1 ? 10 : 5,
        mempoolCongestion: context.pendingTransactions > 50 ? 10 : 5,
        attackDetected: this.matchesKnownPattern(tx) ? 20 : 0,
      },
    };
  }

  estimateSlippageLoss(tx: MempoolTransaction, mevData: any): number {
    const txValueEth = parseInt(tx.value) / 1e18;

    let slippagePercent = 0.5;

    const gasPriceGwei = parseInt(tx.gasPrice) / 1e9;
    if (gasPriceGwei > 100) {
      slippagePercent = 2.0;
    } else if (gasPriceGwei > 50) {
      slippagePercent = 1.5;
    }

    if (txValueEth > 10) {
      slippagePercent += 1.0;
    }

    return (txValueEth * slippagePercent) / 100;
  }

  classifyAttack(pattern: 'sandwich' | 'front-run' | 'back-run' | 'other'): MEVAttack['attackType'] {
    return pattern;
  }

  analyzeTransaction(tx: MempoolTransaction, context: any): MEVAttack {
    const riskAssessment = this.calculateRiskScore(tx, context);
    const slippageLoss = this.estimateSlippageLoss(tx, context);

    return {
      hash: tx.hash,
      attackType: context.detectedPattern || 'other',
      riskScore: riskAssessment.score,
      slippageLoss,
      gasPrice: (parseInt(tx.gasPrice) / 1e9).toFixed(2) + ' Gwei',
      timestamp: new Date(tx.timestamp * 1000).toISOString(),
      attackerAddress: context.attackerAddress,
      victimAddress: context.victimAddress,
      transactionDetails: {
        from: tx.from,
        to: tx.to,
        value: (parseInt(tx.value) / 1e18).toFixed(6) + ' ETH',
        gasLimit: tx.gasLimit,
      },
    };
  }

  recommendSlippageSettings(
    pools: DexPoolSnapshot[],
    volatility: PoolVolatilitySample[],
    trade: TradeIntent
  ): SlippageRecommendation {
    if (!trade || !trade.tokenIn || !trade.tokenOut || !Number.isFinite(trade.amountIn) || trade.amountIn <= 0) {
      return this.defaultSlippageRecommendation(['Invalid trade context supplied.']);
    }

    const sanitizedPools = (pools || [])
      .filter((pool) => pool && pool.baseReserve > 0 && pool.quoteReserve > 0)
      .map((pool) => ({
        ...pool,
        baseAsset: pool.baseAsset.toLowerCase(),
        quoteAsset: pool.quoteAsset.toLowerCase(),
      }));

    if (sanitizedPools.length === 0) {
      return this.defaultSlippageRecommendation(['No pool depth data available.']);
    }

    const sortedVolatility = [...(volatility || [])]
      .filter((sample) => sample && sample.price > 0)
      .sort((a, b) => a.timestamp - b.timestamp);

    const pool = this.selectRelevantPool(sanitizedPools, trade);
    if (!pool) {
      return this.defaultSlippageRecommendation(['No matching pool found for the requested pair.']);
    }

    const priceImpactBps = this.computePriceImpactBps(pool, trade);
    const volatilityBps = this.computeVolatilityBps(sortedVolatility);

    const baselineBufferBps = pool.feeBps ? Math.max(pool.feeBps * 0.5, 5) : 15;
    const recommended = this.clamp(Math.round(priceImpactBps * 1.15 + volatilityBps * 1.1 + baselineBufferBps), 10, 5000);
    const aggressive = this.clamp(Math.round(recommended * 0.75), 5, recommended);
    const conservative = this.clamp(Math.round(recommended * 1.35 + 10), recommended, 7500);

    const confidence = this.deriveConfidence(pool, sortedVolatility, trade);

    const reasoning: string[] = [];
    if (priceImpactBps > 150) {
      reasoning.push('Trade size is large relative to available liquidity.');
    } else if (priceImpactBps > 50) {
      reasoning.push('Moderate price impact expected from pool depth.');
    } else {
      reasoning.push('Pool depth comfortably absorbs the trade size.');
    }

    if (volatilityBps > 120) {
      reasoning.push('Recent volatility is elevated, widening recommended slippage.');
    } else if (volatilityBps > 60) {
      reasoning.push('Recent volatility is moderate, adding buffer to slippage.');
    } else {
      reasoning.push('Stable pricing allows tighter slippage.');
    }

    if (pool.feeBps) {
      reasoning.push(`Pool fee of ${pool.feeBps} bps contributes to baseline buffer.`);
    }

    if (sortedVolatility.length < 5) {
      reasoning.push('Limited volatility history reduces confidence.');
    }

    return {
      recommendedBps: recommended,
      aggressiveBps: aggressive,
      conservativeBps: conservative,
      priceImpactBps,
      volatilityBps,
      confidence,
      reasoning,
    };
  }

  private isSimilarTarget(addr1: string, addr2: string): boolean {
    return addr1.toLowerCase() === addr2.toLowerCase();
  }

  private isSimilarValue(val1: string, val2: string, tolerance: number = 0.1): boolean {
    const num1 = parseInt(val1) || 1;
    const num2 = parseInt(val2) || 1;
    const diff = Math.abs(num1 - num2) / Math.max(num1, num2, 1);
    return diff <= tolerance;
  }

  private matchesKnownPattern(tx: MempoolTransaction): boolean {
    const knownMevPatterns = ['0x'];

    return knownMevPatterns.some((pattern) => tx.to.toLowerCase().includes(pattern.toLowerCase()));
  }

  private getLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score < 25) return 'low';
    if (score < 50) return 'medium';
    if (score < 75) return 'high';
    return 'critical';
  }

  private selectRelevantPool(pools: DexPoolSnapshot[], trade: TradeIntent): DexPoolSnapshot | undefined {
    const tokenIn = trade.tokenIn.toLowerCase();
    const tokenOut = trade.tokenOut.toLowerCase();

    const directMatch = pools.find(
      (pool) => pool.baseAsset === tokenIn && pool.quoteAsset === tokenOut
    );
    if (directMatch) {
      return directMatch;
    }

    const inverseMatch = pools.find(
      (pool) => pool.baseAsset === tokenOut && pool.quoteAsset === tokenIn
    );
    if (inverseMatch) {
      return inverseMatch;
    }

    return pools.reduce((best, pool) => {
      const currentScore = pool.baseReserve + pool.quoteReserve;
      if (!best) {
        return pool;
      }
      const bestScore = best.baseReserve + best.quoteReserve;
      return currentScore > bestScore ? pool : best;
    }, undefined as DexPoolSnapshot | undefined);
  }

  private computePriceImpactBps(pool: DexPoolSnapshot, trade: TradeIntent): number {
    const tokenIn = trade.tokenIn.toLowerCase();
    const tokenOut = trade.tokenOut.toLowerCase();
    const side = trade.side;
    const amountIn = Math.max(trade.amountIn, 0);

    if (amountIn === 0 || pool.baseReserve === 0 || pool.quoteReserve === 0) {
      return 20;
    }

    const feeMultiplier = pool.feeBps ? 1 - pool.feeBps / 10000 : 1;
    const baseReserve = pool.baseReserve;
    const quoteReserve = pool.quoteReserve;
    const priceBefore = quoteReserve / baseReserve;

    let priceAfter = priceBefore;

    if (tokenIn === pool.baseAsset && tokenOut === pool.quoteAsset) {
      const effectiveAmount = amountIn * feeMultiplier;
      const newBase = baseReserve + effectiveAmount;
      const amountOut = (effectiveAmount * quoteReserve) / newBase;
      const newQuote = quoteReserve - amountOut;
      if (newBase <= 0 || newQuote <= 0) {
        return 5000;
      }
      priceAfter = newQuote / newBase;
    } else if (tokenIn === pool.quoteAsset && tokenOut === pool.baseAsset) {
      const effectiveAmount = amountIn * feeMultiplier;
      const newQuote = quoteReserve + effectiveAmount;
      const amountOut = (effectiveAmount * baseReserve) / newQuote;
      const newBase = baseReserve - amountOut;
      if (newBase <= 0 || newQuote <= 0) {
        return 5000;
      }
      priceAfter = newQuote / newBase;
    } else if (side === 'buy') {
      const effectiveAmount = amountIn * feeMultiplier;
      const newQuote = quoteReserve + effectiveAmount;
      const amountOut = (effectiveAmount * baseReserve) / newQuote;
      const newBase = baseReserve - amountOut;
      if (newBase <= 0 || newQuote <= 0) {
        return 5000;
      }
      priceAfter = newQuote / newBase;
    } else {
      const effectiveAmount = amountIn * feeMultiplier;
      const newBase = baseReserve + effectiveAmount;
      const amountOut = (effectiveAmount * quoteReserve) / newBase;
      const newQuote = quoteReserve - amountOut;
      if (newBase <= 0 || newQuote <= 0) {
        return 5000;
      }
      priceAfter = newQuote / newBase;
    }

    if (priceBefore === 0) {
      return 5000;
    }

    const impact = Math.abs(priceAfter - priceBefore) / priceBefore;
    return this.clamp(Math.round(impact * 10000), 5, 5000);
  }

  private computeVolatilityBps(samples: PoolVolatilitySample[]): number {
    if (!samples || samples.length < 2) {
      return 40;
    }

    const returns: number[] = [];
    for (let i = 1; i < samples.length; i++) {
      const prev = samples[i - 1];
      const curr = samples[i];
      const change = (curr.price - prev.price) / prev.price;
      if (Number.isFinite(change)) {
        returns.push(change);
      }
    }

    if (returns.length < 1) {
      return 35;
    }

    const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
    const variance =
      returns.reduce((sum, value) => sum + (value - mean) * (value - mean), 0) /
      Math.max(returns.length - 1, 1);
    const stdDev = Math.sqrt(Math.max(variance, 0));

    const scaled = stdDev * Math.sqrt(returns.length);
    return this.clamp(Math.round(scaled * 10000), 20, 800);
  }

  private deriveConfidence(
    pool: DexPoolSnapshot,
    samples: PoolVolatilitySample[],
    trade: TradeIntent
  ): number {
    const liquidityScore = Math.min(
      (pool.baseReserve + pool.quoteReserve) / Math.max(trade.amountIn * 40, 1),
      1.2
    );
    const sampleScore = Math.min(samples.length / 12, 1);
    const recencyScore = samples.length
      ? Math.max(0, Math.min(1, 1 - (Date.now() / 1000 - samples[samples.length - 1].timestamp) / 900))
      : 0.2;

    const confidence = 0.3 + 0.35 * Math.min(liquidityScore, 1) + 0.2 * sampleScore + 0.15 * recencyScore;
    return parseFloat(this.clamp(confidence, 0.1, 0.98).toFixed(2));
  }

  private defaultSlippageRecommendation(reasons: string[]): SlippageRecommendation {
    const reasoning = reasons.length ? [...reasons] : ['Applying conservative defaults.'];
    return {
      recommendedBps: 120,
      aggressiveBps: 70,
      conservativeBps: 200,
      priceImpactBps: 80,
      volatilityBps: 60,
      confidence: 0.25,
      reasoning,
    };
  }

  private clamp(value: number, min: number, max: number): number {
    if (value < min) {
      return min;
    }
    if (value > max) {
      return max;
    }
    return value;
  }
}

export default new MEVDetector();
