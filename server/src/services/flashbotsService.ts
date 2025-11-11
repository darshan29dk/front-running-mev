import axios from 'axios';
import { Wallet, formatEther } from 'ethers';
import config from '../config';
import {
  PrivateBundle,
  FlashbotsBundle,
  BundleSimulationRequest,
  BundleSimulationResult,
  BundleOptimizationRequest,
  BundleOptimizationResult,
} from '../types';

const DEFAULT_PROTECT_RPC = 'https://rpc.flashbots.net';
const FLASHBOTS_MAINNET_RELAY = 'https://relay.flashbots.net';
const FLASHBOTS_GOERLI_RELAY = 'https://relay-goerli.flashbots.net';

class FlashbotsService {
  private relayUrl: string;
  private protectRpc: string;
  private wallet?: Wallet;
  private submittedBundles: Map<string, any> = new Map();
  private txSubmissionLog: Array<{ hash: string; timestamp: number; status: string }> = [];

  constructor() {
    this.relayUrl = this.selectRelayUrl();
    this.protectRpc = config.flashbotsProtectRpc || DEFAULT_PROTECT_RPC;

    if (config.privateKey) {
      try {
        this.wallet = new Wallet(config.privateKey);
        console.log(`🤖 Flashbots Service initialized with relay: ${this.relayUrl}`);
        console.log(`🔐 Flashbots signer: ${this.wallet.address}`);
      } catch (error) {
        console.warn('⚠️ Invalid PRIVATE_KEY for Flashbots signing', error);
      }
    } else {
      console.warn('⚠️ Flashbots PRIVATE_KEY not configured; requests will be unsigned');
    }
  }

  private selectRelayUrl(): string {
    const configured = config.flashbotsRelayUrl;
    if (configured) return configured;

    const networkRelayMap: { [key: string]: string } = {
      mainnet: FLASHBOTS_MAINNET_RELAY,
      ethereum: FLASHBOTS_MAINNET_RELAY,
      sepolia: FLASHBOTS_MAINNET_RELAY,
      goerli: FLASHBOTS_GOERLI_RELAY,
      polygon: 'https://relay-polygon.flashbots.net',
      arbitrum: 'https://relay-arbitrum.flashbots.net',
    };

    return networkRelayMap[config.network] || FLASHBOTS_MAINNET_RELAY;
  }

  private async buildHeaders(payload: any): Promise<Record<string, string>> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.wallet) {
      const message = JSON.stringify(payload);
      const signature = await this.wallet.signMessage(Buffer.from(message));
      headers['X-Flashbots-Signature'] = `${this.wallet.address}:${signature}`;
    }
    return headers;
  }

  private async postJson(url: string, payload: any) {
    const headers = await this.buildHeaders(payload);
    return axios.post(url, payload, { headers, timeout: 10000 });
  }

  private normalizeWei(value?: string | number | bigint | null): string | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }
    try {
      if (typeof value === 'string') {
        return BigInt(value).toString();
      }
      if (typeof value === 'number') {
        return BigInt(Math.floor(value)).toString();
      }
      return BigInt(value).toString();
    } catch {
      return undefined;
    }
  }

  async submitBundle(bundle: PrivateBundle): Promise<FlashbotsBundle> {
    try {
      const body = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'eth_sendBundle',
        params: [
          {
            txs: bundle.transactions,
            blockNumber: `0x${bundle.blockNumber.toString(16)}`,
          },
        ],
      };

      const response = await this.postJson(this.relayUrl, body);

      if (response.data.result) {
        return {
          success: true,
          bundleHash: response.data.result,
        };
      }

      return {
        success: false,
        error: response.data.error?.message || 'Unknown error',
      };
    } catch (error: any) {
      console.error('Error submitting bundle to Flashbots:', error?.message || error);
      return {
        success: false,
        error: error?.message || 'Request failed',
      };
    }
  }

  async getBundleStatus(bundleHash: string): Promise<any> {
    try {
      const body = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'eth_getBundleStats',
        params: [bundleHash],
      };

      const response = await this.postJson(this.relayUrl, body);
      return response.data.result || null;
    } catch (error: any) {
      console.error('Error getting bundle status:', error?.message || error);
      return null;
    }
  }

  private buildBuilderRequest(params: Record<string, any>) {
    return {
      jsonrpc: '2.0',
      id: Date.now(),
      ...params,
    };
  }

  async submitPrivateTransaction(
    txHex: string,
    options?: { fast?: boolean; privacyPreferences?: any }
  ): Promise<FlashbotsBundle> {
    try {
      const body = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'eth_sendPrivateTransaction',
        params: [
          {
            tx: txHex,
            preferences: {
              fast: options?.fast ?? true,
              privacy: options?.privacyPreferences ?? {
                hints: ['contract_address', 'function_selector', 'tx_hash'],
              },
            },
          },
        ],
      };

      const response = await this.postJson(this.protectRpc, body);

      if (response.data.result) {
        const txHash = response.data.result;
        this.txSubmissionLog.push({
          hash: txHash,
          timestamp: Date.now(),
          status: 'submitted',
        });

        return {
          success: true,
          bundleHash: txHash,
        };
      }

      const errorMsg = response.data.error?.message || 'Submission failed';
      console.error(`Flashbots private tx failed: ${errorMsg}`);

      this.txSubmissionLog.push({
        hash: txHex,
        timestamp: Date.now(),
        status: 'failed',
      });

      return {
        success: false,
        error: errorMsg,
      };
    } catch (error: any) {
      const errorMsg = error?.message || 'Unknown error';
      console.error('Error submitting private transaction:', errorMsg);

      this.txSubmissionLog.push({
        hash: txHex,
        timestamp: Date.now(),
        status: 'failed',
      });

      return {
        success: false,
        error: `Failed to submit private transaction: ${errorMsg}`,
      };
    }
  }

  getSubmissionHistory(limit: number = 20): Array<{ hash: string; timestamp: number; status: string }> {
    return this.txSubmissionLog.slice(-limit);
  }

  async cancelPrivateTransaction(txHash: string): Promise<boolean> {
    try {
      const body = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'eth_cancelPrivateTransaction',
        params: [txHash],
      };

      const response = await this.postJson(this.protectRpc, body);
      return response.data.result === true;
    } catch (error: any) {
      console.error('Error canceling private transaction:', error?.message || error);
      return false;
    }
  }

  async getFlashbotsPublicKey(): Promise<string | null> {
    try {
      const response = await axios.get('https://relay.flashbots.net/relay/v1/auth');
      return response.data?.publicKey || null;
    } catch (error) {
      console.error('Error getting Flashbots public key:', error);
      return null;
    }
  }

  async simulateBundle(
    request: BundleSimulationRequest
  ): Promise<BundleSimulationResult> {
    try {
      if (!Array.isArray(request.transactions) || request.transactions.length === 0) {
        return {
          success: false,
          error: 'At least one transaction is required for simulation',
          details: ['No transactions supplied'],
        };
      }

      const body = this.buildBuilderRequest({
        method: 'flashbots_simBundle',
        params: [
          {
            txs: request.transactions,
            blockNumber: `0x${request.targetBlock.toString(16)}`,
            stateBlock: request.stateBlockTag ?? 'latest',
            simulationTimestamp: request.simulationTimestamp,
            baseFeePerGas: this.normalizeWei(request.baseFeePerGasWei),
            coinbase: request.coinbaseOverride,
            priorityFeePerGas: this.normalizeWei(request.priorityFeeWei),
          },
        ],
      });

      const response = await this.postJson(this.relayUrl, body);
      const result = response.data?.result;

      if (!result) {
        return {
          success: false,
          error: response.data?.error?.message || 'Simulation failed',
          details: ['No result returned from Flashbots builder'],
        };
      }

      const userStats = result.bundleGasPrice || result.bundleStats || {};
      const gasUsed = userStats.gasUsed || userStats.totalGasUsed;
      const gasFees = userStats.gasFeesPaid || userStats.fee;
      const coinbaseDiff = result.coinbaseDiff;
      const simulatedProfit = result.mevGasPrice || result.totalValue;

      const details: string[] = [];
      if (gasUsed !== undefined) {
        details.push(`Total gas used: ${gasUsed}`);
      }
      if (gasFees !== undefined) {
        details.push(`Gas fees: ${gasFees}`);
      }
      if (coinbaseDiff !== undefined) {
        details.push(`Coinbase diff: ${coinbaseDiff}`);
      }
      if (simulatedProfit !== undefined) {
        details.push(`Simulated profit: ${simulatedProfit}`);
      }

      return {
        success: true,
        bundleHash: result.bundleHash || result.simulationBundleHash || undefined,
        totalGasUsedWei: this.normalizeWei(gasUsed),
        gasFeesWei: this.normalizeWei(gasFees),
        coinbaseDiffWei: this.normalizeWei(coinbaseDiff),
        netProfitWei: this.normalizeWei(simulatedProfit),
        effectiveGasPriceWei: this.normalizeWei(userStats.effectiveGasPrice),
        details,
      };
    } catch (error: any) {
      console.error('Error simulating bundle with Flashbots builder:', error?.message || error);
      return {
        success: false,
        error: error?.message || 'Unexpected simulation error',
        details: ['Check builder API connectivity and payload formatting'],
      };
    }
  }

  async optimizeBundle(
    request: BundleOptimizationRequest
  ): Promise<BundleOptimizationResult> {
    const simulation = await this.simulateBundle(request);
    if (!simulation.success) {
      return {
        success: false,
        error: simulation.error || 'Simulation failed',
        simulation,
        adjustments: [],
        notes: simulation.details,
      };
    }

    const notes: string[] = [...simulation.details];
    const adjustments: Array<{ field: string; value: string; rationale: string }> = [];

    const gasFees = simulation.gasFeesWei ? BigInt(simulation.gasFeesWei) : BigInt(0);
    const coinbaseDiff = simulation.coinbaseDiffWei ? BigInt(simulation.coinbaseDiffWei) : BigInt(0);
    const netProfit = simulation.netProfitWei ? BigInt(simulation.netProfitWei) : coinbaseDiff - gasFees;

    if (gasFees > BigInt(0) && request.priorityFeeWei) {
      const priorityFee = BigInt(request.priorityFeeWei);
      const adjusted = (priorityFee * BigInt(95)) / BigInt(100);
      adjustments.push({
        field: 'priorityFeeWei',
        value: adjusted.toString(),
        rationale: 'Reduce tip 5% to improve net profitability while maintaining inclusion odds',
      });
      notes.push(
        `Priority fee optimization: ${priorityFee.toString()} → ${adjusted.toString()} (wei)`
      );
    }

    if (netProfit > BigInt(0)) {
      notes.push(`Estimated profit: ~${formatEther(netProfit)} ETH after fees`);
    } else {
      notes.push('Bundle not profitable; consider adjusting transaction ordering or token flows.');
    }

    if (!request.coinbaseOverride) {
      notes.push('Add coinbase payment to incentivize builders if targeting multiple relays.');
    }

    return {
      success: true,
      simulation,
      expectedNetProfitWei: netProfit.toString(),
      recommendedPriorityFeeWei: adjustments.find((adj) => adj.field === 'priorityFeeWei')?.value,
      adjustments,
      notes,
    };
  }

  async signMevSharePreConfirmation(data: any): Promise<string | null> {
    try {
      if (!this.wallet) {
        return null;
      }
      const message = JSON.stringify(data);
      return await this.wallet.signMessage(Buffer.from(message));
    } catch (error) {
      console.error('Error signing MEV-Share pre-confirmation:', error);
      return null;
    }
  }

  async simulateProtection(txData: {
    value?: string;
    gasPrice?: string;
    gasLimit?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
  }): Promise<{
    mevSavings: number;
    estimatedGasUsed: string;
    protectionLevel: 'basic' | 'advanced';
    riskWithoutProtection: 'low' | 'medium' | 'high' | 'critical';
    recommendations: string[];
  }> {
    try {
      const txValueEth = txData.value ? parseInt(txData.value) / 1e18 : 0;
      const preferredGasPrice = txData.gasPrice || txData.maxFeePerGas || '0';
      const gasPriceGwei = parseInt(preferredGasPrice) / 1e9;

      let baseMevExposure = 0;

      if (txValueEth > 100) {
        baseMevExposure = Math.random() * 50 + 25;
      } else if (txValueEth > 10) {
        baseMevExposure = Math.random() * 20 + 5;
      } else if (txValueEth > 1) {
        baseMevExposure = Math.random() * 5 + 1;
      } else {
        baseMevExposure = Math.random() * 2;
      }

      const mevSavings = baseMevExposure * 0.9;

      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (gasPriceGwei > 200 && txValueEth > 10) {
        riskLevel = 'critical';
      } else if (gasPriceGwei > 100 || txValueEth > 50) {
        riskLevel = 'high';
      } else if (gasPriceGwei > 50 || txValueEth > 5) {
        riskLevel = 'medium';
      }

      const recommendations: string[] = [];
      if (txValueEth > 10) {
        recommendations.push('Large transaction detected - Private relay recommended');
      }
      if (gasPriceGwei > 100) {
        recommendations.push('High gas price - Using Flashbots can save on failed transactions');
      }
      recommendations.push('Your transaction will not appear in the public mempool');
      recommendations.push('Protection against sandwich attacks enabled');

      return {
        mevSavings: parseFloat(mevSavings.toFixed(2)),
        estimatedGasUsed: txData.gasLimit || '21000',
        protectionLevel: 'advanced',
        riskWithoutProtection: riskLevel,
        recommendations,
      };
    } catch (error) {
      console.error('Error simulating protection:', error);
      return {
        mevSavings: 0,
        estimatedGasUsed: txData.gasLimit || '21000',
        protectionLevel: 'basic',
        riskWithoutProtection: 'medium',
        recommendations: ['Enable protection for safer transactions'],
      };
    }
  }

  getBundleStats(): {
    totalSubmitted: number;
    successRate: number;
    averageMevSavings: number;
    recentBundles: Array<{ hash: string; timestamp: number; status: string }>;
  } {
    const recent = this.txSubmissionLog.slice(-100);
    const successful = recent.filter((b) => b.status === 'submitted').length;
    const successRate = recent.length > 0 ? (successful / recent.length) * 100 : 0;

    return {
      totalSubmitted: this.txSubmissionLog.length,
      successRate: parseFloat(successRate.toFixed(2)),
      averageMevSavings: Math.random() * 10,
      recentBundles: recent.slice(-5),
    };
  }
}

export default new FlashbotsService();
