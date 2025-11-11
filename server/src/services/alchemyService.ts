/**
 * Alchemy Service
 * Handles Alchemy SDK integration for blockchain data fetching
 */

import { Alchemy, Network, AlchemySubscription } from 'alchemy-sdk';
import config from '../config';
import { MempoolTransaction } from '../types';

export class AlchemyService {
  private alchemy: Alchemy;
  private networkMap: { [key: string]: Network } = {
    sepolia: Network.ETH_SEPOLIA,
    mainnet: Network.ETH_MAINNET,
    ethereum: Network.ETH_MAINNET,
    polygon: Network.MATIC_MAINNET,
    arbitrum: Network.ARB_MAINNET,
  };

  constructor() {
    const network = this.networkMap[config.network] || Network.ETH_SEPOLIA;
    this.alchemy = new Alchemy({
      apiKey: config.alchemyKey,
      network,
    });
  }

  /**
   * Get current gas prices
   */
  async getGasPrices(): Promise<{
    standard: number;
    fast: number;
    slow: number;
  }> {
    try {
      const gasPrices = await this.alchemy.core.getGasPrice();
      return {
        standard: parseInt(gasPrices.toString()) / 1e9,
        fast: (parseInt(gasPrices.toString()) / 1e9) * 1.2,
        slow: (parseInt(gasPrices.toString()) / 1e9) * 0.8,
      };
    } catch (error) {
      console.error('Error fetching gas prices:', error);
      return { standard: 30, fast: 40, slow: 20 };
    }
  }

  /**
   * Get pending transactions (mempool)
   */
  async getPendingTransactions(limit: number = 50): Promise<MempoolTransaction[]> {
    try {
      const block = await this.alchemy.core.getBlockWithTransactions('pending');
      if (!block || !block.transactions) {
        return [];
      }

      return block.transactions.slice(0, limit).map((tx) => ({
        hash: tx.hash,
        from: tx.from || '',
        to: tx.to || '',
        value: tx.value ? tx.value.toString() : '0',
        gasPrice: tx.maxFeePerGas?.toString() || tx.gasPrice?.toString() || '0',
        maxFeePerGas: tx.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: tx.maxPriorityFeePerGas?.toString(),
        input: (tx as any).input || (tx as any).data || '0x',
        type: typeof tx.type === 'number' ? tx.type : parseInt(tx.type as any, 10) || 0,
        gasLimit: tx.gasLimit?.toString() || '21000',
        nonce: typeof tx.nonce === 'number' ? tx.nonce : parseInt((tx.nonce as any) || '0', 10),
        blockNumber: typeof tx.blockNumber === 'number' ? tx.blockNumber : parseInt((tx.blockNumber as any) || '0', 10),
        timestamp: block.timestamp ? Number(block.timestamp) : Math.floor(Date.now() / 1000),
      }));
    } catch (error) {
      console.error('Error fetching pending transactions:', error);
      return [];
    }
  }

  /**
   * Get block details
   */
  async getBlockDetails(blockNumber: number | string): Promise<any> {
    try {
      const block = await this.alchemy.core.getBlock(blockNumber);
      return block;
    } catch (error) {
      console.error('Error fetching block details:', error);
      return null;
    }
  }

  /**
   * Get transaction details
   */
  async getTransactionDetails(txHash: string): Promise<any> {
    try {
      const tx = await this.alchemy.core.getTransaction(txHash);
      return tx;
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      return null;
    }
  }

  /**
   * Subscribe to pending transactions (Notification API)
   */
  subscribeToMempoolTransactions(callback: (tx: MempoolTransaction) => void): void {
    try {
      // This uses Alchemy's Notify API which requires separate setup
      // For now, we'll use a polling approach
      setInterval(async () => {
        const txs = await this.getPendingTransactions();
        txs.forEach((tx) => callback(tx));
      }, 2000);

      console.log('Subscribed to mempool transactions');
    } catch (error) {
      console.error('Error subscribing to mempool:', error);
    }
  }

  /**
   * Get account token balances
   */
  async getTokenBalances(address: string): Promise<any> {
    try {
      const balances = await this.alchemy.core.getTokenBalances(address);
      return balances;
    } catch (error) {
      console.error('Error fetching token balances:', error);
      return null;
    }
  }

  /**
   * Get account ETH balance
   */
  async getEthBalance(address: string): Promise<string> {
    try {
      const balance = await this.alchemy.core.getBalance(address);
      return balance.toString();
    } catch (error) {
      console.error('Error fetching ETH balance:', error);
      return '0';
    }
  }
}

export default new AlchemyService();